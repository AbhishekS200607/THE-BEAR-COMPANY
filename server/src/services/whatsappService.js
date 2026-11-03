import { env } from '../config/env.js';

/**
 * Formats a clean, high-conversion WhatsApp message for customer dispatch
 * Uses single backend environment variable env.WHATSAPP_BUSINESS_NUMBER
 */
export function generateWhatsAppHandoff(order) {
  const lines = [
    `*NEW ORDER RESERVATION — BEAR.*`,
    `Order Reference: ${order.order_number}`,
    ``,
    `*Customer Details:*`,
    `• Name: ${order.customer_name}`,
    `• Mobile: ${order.customer_phone}`,
    ``,
    `*Shipping Address:*`,
    `${order.delivery_line1}${order.delivery_line2 ? ', ' + order.delivery_line2 : ''}`,
    `${order.delivery_city}, ${order.delivery_state} — ${order.delivery_pincode}`,
    ``,
    `*Items:*`,
    ...(order.items || []).map(
      (item) => `• ${item.product_name} (${item.size} / ${item.colour_name}) × ${item.quantity}`
    ),
    ``,
    `*Total Due:* ₹${((order.total_paise || 0) / 100).toLocaleString('en-IN')}`,
    `*Shipping:* FREE (Complimentary Delivery)`,
    ``,
    `Please confirm my order and share dispatch tracking details.`,
  ];

  const rawMessage = lines.join('\n');
  const whatsappUrl = `https://wa.me/${env.WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(rawMessage)}`;

  return {
    rawMessage,
    whatsappUrl,
    businessNumber: env.WHATSAPP_BUSINESS_NUMBER,
  };
}
