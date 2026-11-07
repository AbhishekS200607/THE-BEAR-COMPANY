import { supabaseAdmin } from '../config/supabase.js';

/**
 * BEAR Fulfillment Service
 * Powers warehouse operations, order pipelines, packing checklists, and audit timelines.
 */

export async function getFulfillmentData(filters = {}) {
  const {
    tab = 'all',
    staffId,
    courier,
    search,
    limit = 50,
    offset = 0,
  } = filters;

  let allOrders = [];

  // Attempt 1: Fetch with full fulfillment schema columns
  try {
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        customer_name,
        customer_phone,
        delivery_line1,
        delivery_line2,
        delivery_city,
        delivery_state,
        delivery_pincode,
        total_paise,
        carrier_name,
        tracking_number,
        tracking_url,
        admin_notes,
        created_at,
        fulfillment_staff_id,
        packing_status,
        packed_items,
        is_urgent,
        fulfillment_priority,
        printed_at,
        order_items (
          id,
          product_name,
          size,
          colour_name,
          sku,
          quantity,
          unit_price_paise,
          total_price_paise
        )
      `)
      .order('created_at', { ascending: false });

    if (tab === 'urgent') {
      query = query.or('is_urgent.eq.true,status.eq.exception');
    } else if (tab === 'processing') {
      query = query.in('status', ['confirmed', 'processing']);
    } else if (tab === 'ready_to_ship') {
      query = query.in('status', ['ready_to_ship', 'packed']);
    } else if (tab === 'shipped') {
      query = query.eq('status', 'shipped');
    } else if (tab === 'exceptions') {
      query = query.eq('status', 'exception');
    }

    if (staffId && staffId !== 'all') {
      query = query.eq('fulfillment_staff_id', staffId);
    }
    if (courier && courier !== 'all') {
      query = query.eq('carrier_name', courier);
    }

    const { data, error } = await query;
    if (error) throw error;
    allOrders = data || [];
  } catch (schemaErr) {
    // Graceful fallback for environments before migration 008 is executed in Supabase
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        customer_name,
        customer_phone,
        delivery_line1,
        delivery_line2,
        delivery_city,
        delivery_state,
        delivery_pincode,
        total_paise,
        carrier_name,
        tracking_number,
        tracking_url,
        admin_notes,
        created_at,
        order_items (
          id,
          product_name,
          size,
          colour_name,
          sku,
          quantity,
          unit_price_paise,
          total_price_paise
        )
      `)
      .order('created_at', { ascending: false });

    if (tab === 'processing') {
      query = query.in('status', ['confirmed', 'processing']);
    } else if (tab === 'shipped') {
      query = query.eq('status', 'shipped');
    } else if (tab === 'exceptions' || tab === 'urgent') {
      query = query.eq('status', 'exception');
    }

    if (courier && courier !== 'all') {
      query = query.eq('carrier_name', courier);
    }

    const { data } = await query;
    allOrders = (data || []).map((o) => ({
      ...o,
      fulfillment_staff_id: null,
      packing_status: 'unpacked',
      packed_items: [],
      is_urgent: false,
      fulfillment_priority: 0,
      printed_at: null,
    }));
  }

  // Filter in-memory if search string is present (across customer name, order number, phone, AWB, SKU)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    allOrders = allOrders.filter((o) => {
      const matchOrder = o.order_number?.toLowerCase().includes(q);
      const matchCustomer = o.customer_name?.toLowerCase().includes(q);
      const matchPhone = o.customer_phone?.includes(q);
      const matchAwb = o.tracking_number?.toLowerCase().includes(q);
      const matchSku = (o.order_items || []).some((item) => item.sku?.toLowerCase().includes(q) || item.product_name?.toLowerCase().includes(q));
      return matchOrder || matchCustomer || matchPhone || matchAwb || matchSku;
    });
  }

  // Calculate live tab counts across active operational orders
  const tabCounts = {
    urgent: allOrders.filter((o) => o.is_urgent || o.status === 'exception').length,
    processing: allOrders.filter((o) => ['confirmed', 'processing'].includes(o.status)).length,
    ready_to_ship: allOrders.filter((o) => ['ready_to_ship', 'packed'].includes(o.status) || o.packing_status === 'packed').length,
    shipped: allOrders.filter((o) => o.status === 'shipped').length,
    exceptions: allOrders.filter((o) => o.status === 'exception').length,
    all: allOrders.length,
  };

  // Slice paginated window
  const total = allOrders.length;
  const paginatedOrders = allOrders.slice(Number(offset), Number(offset) + Number(limit));

  // Retrieve staff list for assignment dropdown
  let staffMembers = [];
  try {
    const { data: staffList } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['super_admin', 'admin', 'operations_manager', 'customer_support'])
      .order('full_name', { ascending: true });
    staffMembers = staffList || [];
  } catch {}

  const staffMap = new Map(staffMembers.map((s) => [s.id, s.full_name]));

  // Format orders for frontend cockpit
  const orders = paginatedOrders.map((o) => {
    const addressParts = [
      o.delivery_line1,
      o.delivery_line2,
      o.delivery_city,
      o.delivery_state ? `${o.delivery_state} - ${o.delivery_pincode}` : o.delivery_pincode,
    ].filter(Boolean);

    const items = (o.order_items || []).map((i, idx) => {
      const isPacked = Array.isArray(o.packed_items) ? Boolean(o.packed_items[idx]) : false;
      return {
        id: i.id || `item-${idx}`,
        index: idx,
        name: i.product_name,
        size: i.size,
        colour: i.colour_name,
        sku: i.sku || `BEAR-${(i.product_name || 'GARMENT').slice(0, 3).toUpperCase()}-${i.size || 'M'}`,
        qty: i.quantity || 1,
        price: (i.unit_price_paise || (i.quantity ? i.total_price_paise / i.quantity : 0)) / 100,
        isPacked,
      };
    });

    const packedCount = items.filter((i) => i.isPacked).length;
    const isFullyPacked = items.length > 0 && packedCount === items.length;

    return {
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      packingStatus: o.packing_status || (isFullyPacked ? 'packed' : packedCount > 0 ? 'partially_packed' : 'unpacked'),
      isUrgent: Boolean(o.is_urgent),
      priority: o.fulfillment_priority || 0,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      shippingAddress: addressParts.join(', '),
      totalAmount: (o.total_paise || 0) / 100,
      carrierName: o.carrier_name || 'Pan-India Express Air',
      trackingNumber: o.tracking_number || null,
      trackingUrl: o.tracking_url || null,
      adminNotes: o.admin_notes || null,
      printedAt: o.printed_at || null,
      assignedStaffId: o.fulfillment_staff_id || null,
      assignedStaffName: o.fulfillment_staff_id ? (staffMap.get(o.fulfillment_staff_id) || 'Warehouse Specialist') : null,
      createdAt: o.created_at,
      items,
      packedCount,
      totalItems: items.length,
    };
  });

  return {
    orders,
    tabCounts,
    staffMembers,
    pagination: {
      total,
      limit: Number(limit),
      offset: Number(offset),
    },
  };
}

export async function assignStaffToOrders(orderIds, staffId, actor = {}) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new Error('At least one order ID must be specified');
  }

  // Update orders
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ fulfillment_staff_id: staffId || null })
    .in('id', orderIds);

  if (error) throw error;

  // Append timeline events
  const timelineEntries = orderIds.map((id) => ({
    order_id: id,
    actor_id: actor.id || null,
    actor_name: actor.fullName || actor.name || 'Admin Specialist',
    action: 'STAFF_ASSIGNED',
    new_state: staffId ? `Staff ID: ${staffId}` : 'Unassigned',
    notes: staffId ? 'Assigned to warehouse fulfillment specialist' : 'Order unassigned',
    metadata: { assignedStaffId: staffId },
  }));

  try {
    await supabaseAdmin.from('order_timeline').insert(timelineEntries);
  } catch (err) {
    console.warn('[FulfillmentService] Failed to insert timeline entries:', err.message);
  }

  return { success: true, count: orderIds.length };
}

export async function updateOrdersStatus(orderIds, newStatus, trackingData = {}, actor = {}) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new Error('At least one order ID must be specified');
  }

  const updates = { status: newStatus };
  if (trackingData.carrierName) updates.carrier_name = trackingData.carrierName;
  if (trackingData.trackingNumber) updates.tracking_number = trackingData.trackingNumber;
  if (trackingData.trackingUrl) updates.tracking_url = trackingData.trackingUrl;

  const { error } = await supabaseAdmin
    .from('orders')
    .update(updates)
    .in('id', orderIds);

  if (error) throw error;

  // Append timeline entries
  const timelineEntries = orderIds.map((id) => ({
    order_id: id,
    actor_id: actor.id || null,
    actor_name: actor.fullName || actor.name || 'Fulfillment Specialist',
    action: 'STATUS_CHANGE',
    new_state: newStatus,
    notes: `Order status moved to ${newStatus}`,
    metadata: trackingData,
  }));

  try {
    await supabaseAdmin.from('order_timeline').insert(timelineEntries);
  } catch (err) {
    console.warn('[FulfillmentService] Failed to insert status change timeline:', err.message);
  }

  return { success: true, count: orderIds.length };
}

export async function updateItemPackingChecklist(orderId, itemIndex, isPacked, actor = {}) {
  // Fetch existing order items & packed_items
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, packed_items, order_items(id, product_name)')
    .eq('id', orderId)
    .single();

  if (error || !order) throw new Error('Order not found');

  const totalItems = (order.order_items || []).length;
  const currentPacked = Array.isArray(order.packed_items)
    ? [...order.packed_items]
    : new Array(totalItems).fill(false);

  // Extend array if needed
  while (currentPacked.length < totalItems) {
    currentPacked.push(false);
  }

  currentPacked[itemIndex] = Boolean(isPacked);

  const packedCount = currentPacked.filter(Boolean).length;
  let packingStatus = 'unpacked';
  if (packedCount === totalItems && totalItems > 0) {
    packingStatus = 'packed';
  } else if (packedCount > 0) {
    packingStatus = 'partially_packed';
  }

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      packed_items: currentPacked,
      packing_status: packingStatus,
    })
    .eq('id', orderId);

  if (updateError) throw updateError;

  // Log to timeline
  const item = order.order_items?.[itemIndex];
  try {
    await supabaseAdmin.from('order_timeline').insert({
      order_id: orderId,
      actor_id: actor.id || null,
      actor_name: actor.fullName || actor.name || 'Warehouse Specialist',
      action: 'ITEM_PACKED',
      previous_state: isPacked ? 'unpacked' : 'packed',
      new_state: isPacked ? 'packed' : 'unpacked',
      notes: `${isPacked ? 'Verified & Packed' : 'Unchecked'}: ${item?.product_name || `Item #${itemIndex + 1}`}`,
      metadata: { itemIndex, isPacked, packingStatus },
    });
  } catch (err) {
    console.warn('[FulfillmentService] Timeline insert error:', err.message);
  }

  return {
    success: true,
    packingStatus,
    packedItems: currentPacked,
    packedCount,
    totalItems,
  };
}

export async function toggleOrderUrgent(orderId, isUrgent, actor = {}) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ is_urgent: Boolean(isUrgent) })
    .eq('id', orderId);

  if (error) throw error;

  try {
    await supabaseAdmin.from('order_timeline').insert({
      order_id: orderId,
      actor_id: actor.id || null,
      actor_name: actor.fullName || actor.name || 'Fulfillment Lead',
      action: 'URGENT_FLAGGED',
      new_state: isUrgent ? 'URGENT' : 'NORMAL',
      notes: isUrgent ? 'Marked as priority dispatch order' : 'Removed priority flag',
    });
  } catch {}

  return { success: true, isUrgent: Boolean(isUrgent) };
}

export async function getOrderTimelineEvents(orderId) {
  const { data, error } = await supabaseAdmin
    .from('order_timeline')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function renderBatchPackingSlipsHtml(orderIds = []) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return '<html><body><div style="font-family:sans-serif;padding:24px;"><h2>BEAR Performance Logistics</h2><p>No orders selected for printing.</p></div></body></html>';
  }

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      customer_name,
      customer_phone,
      delivery_line1,
      delivery_line2,
      delivery_city,
      delivery_state,
      delivery_pincode,
      carrier_name,
      tracking_number,
      created_at,
      order_items (
        product_name,
        size,
        colour_name,
        sku,
        quantity,
        total_price_paise
      )
    `)
    .in('id', orderIds);

  const list = orders || [];

  // Mark orders as printed
  try {
    await supabaseAdmin
      .from('orders')
      .update({ printed_at: new Date().toISOString() })
      .in('id', orderIds);
  } catch {}

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>BEAR — Batch Packing Slips (${list.length} Orders)</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 0; background: #fff; }
    .slip { page-break-after: always; padding-bottom: 20px; margin-bottom: 30px; border-bottom: 1px dashed #ccc; }
    .slip:last-child { page-break-after: avoid; border-bottom: none; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
    .tagline { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #666; margin-top: 2px; }
    .meta-box { text-align: right; font-size: 11px; }
    .order-ref { font-size: 16px; font-weight: 800; font-family: monospace; }
    .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f9f9f9; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 11px; }
    .address-title { font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-size: 10px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    th { text-align: left; padding: 8px 10px; background: #000; color: #fff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 10px; border-bottom: 1px solid #e5e5e5; }
    .check-box { width: 16px; height: 16px; border: 1.5px solid #000; display: inline-block; border-radius: 3px; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #ddd; padding-top: 12px; font-size: 10px; color: #666; }
    .sign-line { width: 150px; border-bottom: 1px solid #000; display: inline-block; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="padding: 12px; background: #09090b; color: #fff; text-align: center; font-size: 12px; font-weight: bold;">
    WAREHOUSE BATCH PRINT — ${list.length} PACKING SLIPS GENERATED • 
    <button onclick="window.print()" style="margin-left: 12px; padding: 6px 16px; background: #fff; color: #000; border: none; border-radius: 20px; font-weight: bold; cursor: pointer;">Print All Now</button>
  </div>

  ${list.map((o) => `
    <div class="slip">
      <div class="header">
        <div>
          <div class="logo">BEAR</div>
          <div class="tagline">Discipline &amp; Utility • Fulfillment Slip</div>
        </div>
        <div class="meta-box">
          <div class="order-ref">${o.order_number}</div>
          <div>Date: ${new Date(o.created_at).toLocaleDateString('en-IN')}</div>
          <div>Logistics: <strong>${o.carrier_name || 'Pan-India Express Air'}</strong></div>
          ${o.tracking_number ? `<div>AWB: <strong>${o.tracking_number}</strong></div>` : ''}
        </div>
      </div>

      <div class="address-grid">
        <div>
          <div class="address-title">Ship To Customer</div>
          <div style="font-weight: bold; font-size: 12px;">${o.customer_name}</div>
          <div>Phone: ${o.customer_phone || 'N/A'}</div>
          <div>${o.delivery_line1 || ''} ${o.delivery_line2 || ''}</div>
          <div>${o.delivery_city || ''}, ${o.delivery_state || ''} - <strong>${o.delivery_pincode || ''}</strong></div>
        </div>
        <div>
          <div class="address-title">Warehouse Origin</div>
          <div style="font-weight: bold;">BEAR Performance Logistics Hub</div>
          <div>Express Dispatch Dock #04</div>
          <div>Bengaluru Central Logistics Gateway, KA - 560001</div>
          <div>Contact: dispatch@bear.in</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">Verified</th>
            <th>Item &amp; Description</th>
            <th>SKU Reference</th>
            <th>Size</th>
            <th>Colour</th>
            <th style="text-align: center;">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${(o.order_items || []).map((i) => `
            <tr>
              <td style="text-align: center;"><div class="check-box"></div></td>
              <td style="font-weight: bold;">${i.product_name}</td>
              <td style="font-family: monospace; font-size: 10px;">${i.sku || 'BEAR-PERF-GARMENT'}</td>
              <td><strong>${i.size || 'M'}</strong></td>
              <td>${i.colour_name || 'Black'}</td>
              <td style="text-align: center; font-weight: bold; font-size: 13px;">${i.quantity || 1}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div>Items Verified By Picker: <span class="sign-line"></span></div>
        <div>Quality Check / Packer Signature: <span class="sign-line"></span></div>
        <div>BEAR Performance Wear • All Rights Reserved</div>
      </div>
    </div>
  `).join('')}
</body>
</html>
  `;
}
