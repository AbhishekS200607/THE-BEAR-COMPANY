import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function handleGetProfile(req, res, next) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone_number, role, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    return successResponse(res, profile);
  } catch (err) {
    return next(err);
  }
}

export async function handleUpdateProfile(req, res, next) {
  try {
    const { fullName, phoneNumber } = req.body;
    const updates = {};
    if (fullName) updates.full_name = fullName.trim();
    if (phoneNumber) updates.phone_number = phoneNumber.trim();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, full_name, phone_number, role')
      .single();

    if (error) throw error;

    // Automatically migrate any unassigned guest orders matching the updated mobile number
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone) {
        await supabaseAdmin
          .from('orders')
          .update({ profile_id: req.user.id })
          .is('profile_id', null)
          .eq('customer_phone', cleanPhone);
      }
    }

    return successResponse(res, data, 200, 'Profile updated');
  } catch (err) {
    return next(err);
  }
}

export async function handleGetAddresses(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('profile_id', req.user.id)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return successResponse(res, data || []);
  } catch (err) {
    return next(err);
  }
}

export async function handleAddAddress(req, res, next) {
  try {
    const { label, fullName, phoneNumber, line1, line2, city, state, pincode, isDefault } = req.body;

    if (isDefault) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('profile_id', req.user.id);
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        profile_id: req.user.id,
        label: label || 'Home',
        full_name: fullName,
        phone_number: phoneNumber,
        line1,
        line2: line2 || null,
        city,
        state,
        pincode,
        is_default: !!isDefault,
      })
      .select()
      .single();

    if (error) throw error;
    return successResponse(res, data, 201, 'Address added');
  } catch (err) {
    return next(err);
  }
}

export async function handleUpdateAddress(req, res, next) {
  try {
    const { id } = req.params;
    const { label, fullName, phoneNumber, line1, line2, city, state, pincode, isDefault } = req.body;

    const { data: existing, error: findError } = await supabaseAdmin
      .from('addresses')
      .select('id')
      .eq('id', id)
      .eq('profile_id', req.user.id)
      .single();

    if (findError || !existing) {
      return errorResponse(res, 'Address not found or unauthorized', 404);
    }

    if (isDefault) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('profile_id', req.user.id);
    }

    const updates = {};
    if (label !== undefined) updates.label = label;
    if (fullName !== undefined) updates.full_name = fullName;
    if (phoneNumber !== undefined) updates.phone_number = phoneNumber;
    if (line1 !== undefined) updates.line1 = line1;
    if (line2 !== undefined) updates.line2 = line2;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (pincode !== undefined) updates.pincode = pincode;
    if (isDefault !== undefined) updates.is_default = !!isDefault;

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update(updates)
      .eq('id', id)
      .eq('profile_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(res, data, 200, 'Address updated');
  } catch (err) {
    return next(err);
  }
}

export async function handleDeleteAddress(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('profile_id', req.user.id);

    if (error) throw error;
    return successResponse(res, null, 200, 'Address deleted');
  } catch (err) {
    return next(err);
  }
}

export async function handleGetCustomerOrders(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        subtotal_paise,
        total_paise,
        carrier_name,
        tracking_number,
        tracking_url,
        created_at,
        order_items (
          product_name,
          sku,
          colour_name,
          size,
          quantity,
          unit_price_paise,
          total_price_paise
        )
      `)
      .eq('profile_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      total: o.total_paise / 100,
      carrier: o.carrier_name,
      trackingNumber: o.tracking_number,
      trackingUrl: o.tracking_url,
      createdAt: o.created_at,
      items: (o.order_items || []).map((i) => ({
        name: i.product_name,
        size: i.size,
        colour: i.colour_name,
        quantity: i.quantity,
        price: i.unit_price_paise / 100,
      })),
    }));

    return successResponse(res, formatted);
  } catch (err) {
    return next(err);
  }
}

export async function handleClaimGuestOrders(req, res, next) {
  try {
    const { orderNumbers, phoneNumber } = req.body || {};
    const userId = req.user.id;

    // Resolve customer phone from request or profile
    let cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '').slice(-10) : null;
    if (!cleanPhone) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('phone_number')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.phone_number) {
        cleanPhone = profile.phone_number.replace(/[^0-9]/g, '').slice(-10);
      }
    }

    let claimedOrders = [];

    // 1. If customer has a verified phone, claim all unlinked orders matching that phone
    if (cleanPhone) {
      const { data: phoneOrders } = await supabaseAdmin
        .from('orders')
        .update({ profile_id: userId })
        .is('profile_id', null)
        .eq('customer_phone', cleanPhone)
        .select('id, order_number, customer_phone');
      if (phoneOrders && phoneOrders.length) {
        claimedOrders = claimedOrders.concat(phoneOrders);
      }
    }

    // 2. If explicit order references were provided from local browser session:
    if (Array.isArray(orderNumbers) && orderNumbers.length > 0) {
      // Find orders matching these references that are currently unlinked
      const { data: refOrders } = await supabaseAdmin
        .from('orders')
        .update({ profile_id: userId })
        .is('profile_id', null)
        .in('order_number', orderNumbers)
        .select('id, order_number, customer_phone');
      if (refOrders && refOrders.length) {
        // Only add those not already counted
        const existingIds = new Set(claimedOrders.map((o) => o.id));
        const newAdditions = refOrders.filter((o) => !existingIds.has(o.id));
        claimedOrders = claimedOrders.concat(newAdditions);
      }
    }

    return successResponse(res, {
      claimedCount: claimedOrders.length,
      orders: claimedOrders,
    }, 200, 'Guest orders migrated successfully');
  } catch (err) {
    return next(err);
  }
}


