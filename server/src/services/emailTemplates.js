/**
 * BEAR Performance Wear — Transactional Email Templates
 * 
 * Design Standards:
 * - Table-based layout for robust Outlook / Gmail / Apple Mail compatibility.
 * - 600px container with responsive fluid sizing.
 * - System-safe typography stack (no remote web-font dependency).
 * - Inline SVG icons with text fallbacks.
 * - Dark industrial minimalist palette matching the BEAR storefront.
 * - XSS-safe escaping for all dynamic inputs.
 * - Both HTML and Plain-Text rendering for every template.
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtCurrency(val) {
  return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// ── Shared Email Header & Footer Shell ──────────────────────────────────────

function wrapEmailShell({ title, previewText, contentHtml }) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #09090b; }
    @media only screen and (max-width: 620px) {
      .container-table { width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <!-- Hidden Preview Preheader -->
  <div style="display: none; font-size: 1px; color: #09090b; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapeHtml(previewText)}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b;">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        <table role="presentation" class="container-table" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 600px; background-color: #111113; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 32px 24px 24px 24px; border-bottom: 1px solid #1f1f23; background-color: #0d0d0f;">
              <!-- Inline SVG Logo with Text Fallback -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin-bottom: 8px;">
                      <rect width="32" height="32" rx="6" fill="#18181b"/>
                      <path d="M8 24V8h8.5a4.5 4.5 0 0 1 3.1 7.7A4.8 4.8 0 0 1 24 20.2 4.8 4.8 0 0 1 19.2 24H8zm3.5-3.5h7.7a1.8 1.8 0 0 0 0-3.5H11.5v3.5zm0-6h7a1.6 1.6 0 1 0 0-3.2h-7v3.2z" fill="#f4f4f5"/>
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.03em; color: #f4f4f5; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      BEAR<span style="color: #71717a;">.</span>
                    </span>
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.18em; color: #71717a; text-transform: uppercase; margin-top: 2px;">
                      PERFORMANCE WEAR
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td class="mobile-padding" style="padding: 36px 36px 28px 36px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0c0c0e; border-top: 1px solid #1f1f23; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #71717a; line-height: 18px;">
                BEAR Performance Wear Pvt. Ltd. · High-Performance Athletic Gear &amp; Utilitarian Technical Apparel.<br />
                Pan-India Air Dispatch &amp; Doorstep Logistics.
              </p>
              <p style="margin: 0; font-size: 10px; color: #52525b; line-height: 16px;">
                This is an automated transactional message. If you did not initiate this activity, please contact our security desk immediately at <a href="mailto:support@bear.in" style="color: #a1a1aa; text-decoration: underline;">support@bear.in</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── SVG Icon Snippets ────────────────────────────────────────────────────────

const ICONS = {
  shield: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 10.99h6.92c-.47 3.99-2.94 7.6-6.92 8.78V12.99H5V6.3l7-2.62v9.31z" fill="#f4f4f5"/>
  </svg>`,
  checkCircle: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
    <circle cx="12" cy="12" r="10" stroke="#34d399" stroke-width="2" fill="#064e3b" fill-opacity="0.3"/>
    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  truck: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
    <path d="M19 7h-3V4H3c-1.1 0-2 .9-2 2v10h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V8.5h2.5zM18 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#38bdf8"/>
  </svg>`,
  package: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
    <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2zm0 2.2L6.1 7.5 12 10.8l5.9-3.3L12 4.2zm6 5.1l-5 2.8v6.7l5-2.8V9.3zm-7 9.5v-6.7l-5-2.8v6.7l5 2.8z" fill="#a1a1aa"/>
  </svg>`,
  location: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#a1a1aa"/>
  </svg>`,
  mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#a1a1aa"/>
  </svg>`,
};

// ── Status Stepper Component ────────────────────────────────────────────────

function renderStatusStepper(currentStatus) {
  const steps = [
    { key: 'placed', label: 'Order Placed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Dispatched' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const statusMap = {
    pending_whatsapp: 0,
    confirmed: 1,
    processing: 1,
    shipped: 2,
    delivered: 3,
  };

  const activeIndex = statusMap[currentStatus] !== undefined ? statusMap[currentStatus] : 0;

  const stepTds = steps.map((s, idx) => {
    const isCompleted = idx < activeIndex;
    const isCurrent = idx === activeIndex;
    const bulletBg = isCurrent ? '#f4f4f5' : isCompleted ? '#34d399' : '#27272a';
    const bulletText = isCurrent ? '#09090b' : isCompleted ? '#09090b' : '#71717a';
    const textColor = isCurrent ? '#ffffff' : isCompleted ? '#34d399' : '#52525b';
    const fontWeight = isCurrent ? 'bold' : 'normal';

    return `
      <td align="center" style="padding: 0 4px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${bulletBg}; color: ${bulletText}; font-size: 11px; font-weight: bold; line-height: 22px; text-align: center;">
                ${isCompleted ? '✓' : idx + 1}
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 6px;">
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${textColor}; font-weight: ${fontWeight};">
                ${s.label}
              </span>
            </td>
          </tr>
        </table>
      </td>
    `;
  }).join('');

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 12px; margin: 24px 0;">
      <tr>
        ${stepTds}
      </tr>
    </table>
  `;
}

// ============================================================================
// 1. OTP VERIFICATION EMAIL
// ============================================================================

export function renderOtpEmail({ otp, expiryMinutes = 10, purpose = 'verification' }) {
  const safeOtp = escapeHtml(otp);
  const safeExpiry = escapeHtml(expiryMinutes);

  const purposeLabels = {
    verification: 'Email Verification',
    login: 'Account Authentication',
    password_reset: 'Password Recovery',
  };
  const label = purposeLabels[purpose] || 'Verification';

  const html = wrapEmailShell({
    title: `BEAR — Your Security Verification Code: ${safeOtp}`,
    previewText: `Use verification code ${safeOtp} to complete your ${label}. Code expires in ${safeExpiry} minutes.`,
    contentHtml: `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            ${ICONS.shield}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 8px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #f4f4f5; text-transform: uppercase;">
              Security Verification Code
            </h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 20px; max-width: 440px;">
              Enter the one-time security code below to authorize your <strong style="color: #f4f4f5;">${escapeHtml(label)}</strong>. This verification code is confidential.
            </p>
          </td>
        </tr>

        <!-- OTP CARD -->
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid #3f3f46; border-radius: 10px; padding: 18px 36px;">
              <tr>
                <td align="center">
                  <span style="font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; text-align: center; display: inline-block;">
                    ${safeOtp}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- EXPIRY & SECURITY WARNING -->
        <tr>
          <td align="center" style="padding-bottom: 28px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1505; border: 1px solid #78350f; border-radius: 8px; padding: 14px 18px;">
              <tr>
                <td>
                  <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: #fef3c7;">
                    ⏱️ Code expires in ${safeExpiry} minutes
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #fde68a; line-height: 16px;">
                    BEAR staff will never ask for this code via phone, chat, or WhatsApp. If you did not request this verification, please disregard this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  });

  const text = `BEAR PERFORMANCE WEAR — SECURITY VERIFICATION

Your One-Time Verification Code: ${safeOtp}

Purpose: ${label}
Validity: Valid for ${safeExpiry} minutes.

SECURITY NOTICE:
Never share this OTP with anyone, including BEAR representatives.
If you did not initiate this request, your account may be compromised. Please secure your account immediately.

Support: support@bear.in
BEAR Performance Wear Pvt. Ltd.`;

  return { html, text };
}

// ============================================================================
// 2. ORDER CONFIRMATION EMAIL
// ============================================================================

export function renderOrderConfirmationEmail({
  customerName,
  orderNumber,
  items = [],
  subtotal = 0,
  discount = 0,
  total = 0,
  status = 'pending_whatsapp',
  deliveryAddress = {},
  trackingUrl,
  supportEmail = 'support@bear.in',
  createdAt = new Date().toISOString(),
}) {
  const safeName = escapeHtml(customerName || 'Athlete');
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeSupport = escapeHtml(supportEmail);
  const safeDate = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const addressLine = [
    deliveryAddress.line1,
    deliveryAddress.line2,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.pincode,
  ].filter(Boolean).map(escapeHtml).join(', ');

  const itemsHtml = (items || []).map((item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #1f1f23;">
        <p style="margin: 0; font-size: 13px; font-weight: bold; color: #f4f4f5;">
          ${escapeHtml(item.productName || item.name || 'Athletic Garment')}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #71717a;">
          Color: <span style="color: #a1a1aa;">${escapeHtml(item.colour || item.colour_name || 'Standard')}</span> &nbsp;|&nbsp;
          Size: <span style="color: #a1a1aa;">${escapeHtml(item.size || 'M')}</span> &nbsp;|&nbsp;
          Qty: <span style="color: #a1a1aa;">${escapeHtml(item.quantity || 1)}</span>
        </p>
      </td>
      <td align="right" style="padding: 12px 0; border-bottom: 1px solid #1f1f23; font-size: 13px; font-weight: bold; color: #f4f4f5; vertical-align: top;">
        ${fmtCurrency(item.totalPrice || (item.unitPrice ? item.unitPrice * (item.quantity || 1) : 0))}
      </td>
    </tr>
  `).join('');

  const html = wrapEmailShell({
    title: `BEAR Order Confirmation — ${safeOrderNumber}`,
    previewText: `Thank you for your order ${safeOrderNumber}. We have reserved your items and initiated fulfillment.`,
    contentHtml: `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 16px;">
            ${ICONS.checkCircle}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 6px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #f4f4f5; text-transform: uppercase;">
              Order Confirmed
            </h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 20px;">
              Thank you, <strong style="color: #ffffff;">${safeName}</strong>. Your order <span style="color: #ffffff; font-family: monospace; font-weight: bold;">${safeOrderNumber}</span> is reserved and being prepped for express air logistics.
            </p>
          </td>
        </tr>

        <!-- PROGRESS STEPPER -->
        <tr>
          <td>
            ${renderStatusStepper(status)}
          </td>
        </tr>

        <!-- ORDER META CARD -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 14px 18px;">
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Order Reference</td>
                <td align="right" style="font-size: 12px; font-weight: bold; color: #f4f4f5; font-family: monospace;">${safeOrderNumber}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 6px;">Date Placed</td>
                <td align="right" style="font-size: 11px; color: #a1a1aa; padding-top: 6px;">${safeDate}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 6px;">Shipping Speed</td>
                <td align="right" style="font-size: 11px; color: #34d399; font-weight: bold; padding-top: 6px;">BlueDart Air Express (Complimentary)</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ITEMIZED SUMMARY -->
        <tr>
          <td style="padding-bottom: 8px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; padding-bottom: 8px;">
                  Garments in This Drop
                </td>
              </tr>
              ${itemsHtml}
            </table>
          </td>
        </tr>

        <!-- PRICE BREAKDOWN -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding-top: 10px;">
              <tr>
                <td style="font-size: 12px; color: #71717a; padding: 4px 0;">Subtotal</td>
                <td align="right" style="font-size: 12px; color: #a1a1aa;">${fmtCurrency(subtotal || total)}</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td style="font-size: 12px; color: #34d399; padding: 4px 0;">Coupon Discount</td>
                <td align="right" style="font-size: 12px; color: #34d399;">-${fmtCurrency(discount)}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="font-size: 12px; color: #71717a; padding: 4px 0;">Air Shipping</td>
                <td align="right" style="font-size: 12px; color: #34d399; font-weight: bold;">FREE</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: bold; color: #ffffff; padding: 10px 0 4px 0; border-top: 1px solid #27272a;">Total Amount</td>
                <td align="right" style="font-size: 16px; font-weight: 800; color: #ffffff; padding: 10px 0 4px 0; border-top: 1px solid #27272a;">${fmtCurrency(total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DELIVERY DESTINATION -->
        <tr>
          <td style="padding-bottom: 28px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141416; border: 1px solid #27272a; border-radius: 8px; padding: 14px 18px;">
              <tr>
                <td style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; padding-bottom: 6px;">
                  Delivery Address
                </td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #d4d4d8; line-height: 18px;">
                  ${addressLine || 'Address provided at checkout'}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TRACKING CTA BUTTON -->
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center">
                  <a href="${escapeHtml(trackingUrl)}" target="_blank" style="display: block; width: 100%; max-width: 320px; background-color: #ffffff; color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; text-decoration: none; padding: 14px 24px; border-radius: 9999px; text-align: center; box-shadow: 0 4px 14px rgba(255,255,255,0.15);">
                    Track Live Drop Status →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CONTACT HELP -->
        <tr>
          <td align="center" style="padding-top: 12px; border-top: 1px solid #1f1f23;">
            <p style="margin: 0; font-size: 11px; color: #71717a;">
              Need to modify your delivery or size? Reply to this email or reach us at <a href="mailto:${safeSupport}" style="color: #f4f4f5; text-decoration: underline;">${safeSupport}</a>.
            </p>
          </td>
        </tr>

      </table>
    `,
  });

  const textItems = (items || [])
    .map((i) => `- ${i.productName || i.name} (${i.colour || 'Standard'}, Size ${i.size}) x${i.quantity || 1}: ${fmtCurrency(i.totalPrice || i.unitPrice)}`)
    .join('\n');

  const text = `BEAR PERFORMANCE WEAR — ORDER CONFIRMED

Order Number: ${safeOrderNumber}
Date: ${safeDate}
Customer: ${safeName}

ORDER ITEMS:
${textItems}

Total Amount: ${fmtCurrency(total)} (Free Pan-India Air Express)

Delivery Address:
${addressLine}

Track your order:
${trackingUrl}

Support: ${safeSupport}
BEAR Performance Wear Pvt. Ltd.`;

  return { html, text };
}

// ============================================================================
// 3. SHIPMENT DISPATCHED EMAIL
// ============================================================================

export function renderShipmentDispatchedEmail({
  customerName,
  orderNumber,
  carrierName = 'BlueDart Express',
  trackingNumber,
  trackingUrl,
  storeTrackingUrl,
  supportEmail = 'support@bear.in',
  dispatchedAt = new Date().toISOString(),
}) {
  const safeName = escapeHtml(customerName || 'Athlete');
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeCarrier = escapeHtml(carrierName);
  const safeAwb = escapeHtml(trackingNumber || 'Available via BlueDart Portal');
  const safeSupport = escapeHtml(supportEmail);
  const safeDate = new Date(dispatchedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const html = wrapEmailShell({
    title: `Your BEAR Order ${safeOrderNumber} Has Been Dispatched`,
    previewText: `Your package ${safeOrderNumber} is airborne with ${safeCarrier} (AWB: ${safeAwb}).`,
    contentHtml: `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 16px;">
            ${ICONS.truck}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 6px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #f4f4f5; text-transform: uppercase;">
              Your Gear is En Route
            </h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 20px;">
              Good news, <strong style="color: #ffffff;">${safeName}</strong>. Your shipment has departed the fulfillment hub and is in transit via express air priority.
            </p>
          </td>
        </tr>

        <!-- STATUS STEPPER (HIGHLIGHTS SHIPPED) -->
        <tr>
          <td>
            ${renderStatusStepper('shipped')}
          </td>
        </tr>

        <!-- LOGISTICS TRACKING CARD -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 18px 20px;">
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Courier Partner</td>
                <td align="right" style="font-size: 12px; font-weight: bold; color: #f4f4f5;">${safeCarrier}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 8px;">Airway Bill (AWB)</td>
                <td align="right" style="font-size: 13px; font-weight: bold; color: #38bdf8; font-family: monospace; padding-top: 8px;">${safeAwb}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 8px;">Dispatch Date</td>
                <td align="right" style="font-size: 11px; color: #a1a1aa; padding-top: 8px;">${safeDate}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 8px;">Transit Speed</td>
                <td align="right" style="font-size: 11px; color: #34d399; font-weight: bold; padding-top: 8px;">Estimated 24-48h Delivery</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ACTION BUTTONS -->
        <tr>
          <td align="center" style="padding-bottom: 28px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              ${trackingUrl ? `
              <tr>
                <td align="center" style="padding-bottom: 12px;">
                  <a href="${escapeHtml(trackingUrl)}" target="_blank" style="display: block; width: 100%; max-width: 320px; background-color: #ffffff; color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; text-decoration: none; padding: 14px 24px; border-radius: 9999px; text-align: center;">
                    Track on ${safeCarrier} →
                  </a>
                </td>
              </tr>
              ` : ''}
              ${storeTrackingUrl ? `
              <tr>
                <td align="center">
                  <a href="${escapeHtml(storeTrackingUrl)}" target="_blank" style="display: block; width: 100%; max-width: 320px; background-color: #18181b; border: 1px solid #3f3f46; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; text-decoration: none; padding: 12px 24px; border-radius: 9999px; text-align: center;">
                    View in BEAR Storefront
                  </a>
                </td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>

        <!-- FOOTER SUPPORT NOTE -->
        <tr>
          <td align="center" style="padding-top: 12px; border-top: 1px solid #1f1f23;">
            <p style="margin: 0; font-size: 11px; color: #71717a;">
              Need to reschedule doorstep delivery? Contact <a href="mailto:${safeSupport}" style="color: #f4f4f5; text-decoration: underline;">${safeSupport}</a>.
            </p>
          </td>
        </tr>

      </table>
    `,
  });

  const text = `BEAR PERFORMANCE WEAR — SHIPMENT DISPATCHED

Your order ${safeOrderNumber} has been dispatched!

Courier: ${safeCarrier}
Airway Bill (AWB): ${safeAwb}
Dispatch Date: ${safeDate}

Track via Courier:
${trackingUrl || 'N/A'}

Track on BEAR Store:
${storeTrackingUrl || 'N/A'}

Support: ${safeSupport}
BEAR Performance Wear Pvt. Ltd.`;

  return { html, text };
}

// ============================================================================
// 4. ADMIN TEST EMAIL
// ============================================================================

export function renderAdminTestEmail({ adminEmail, timestamp = new Date().toISOString() }) {
  const safeAdmin = escapeHtml(adminEmail);
  const safeTime = new Date(timestamp).toLocaleString('en-IN');

  const html = wrapEmailShell({
    title: `BEAR Admin — SMTP Integration Test`,
    previewText: `SMTP diagnostic test completed successfully for ${safeAdmin}.`,
    contentHtml: `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 16px;">
            ${ICONS.shield}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 8px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #f4f4f5; text-transform: uppercase;">
              SMTP Diagnostic Test Successful
            </h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 20px;">
              Your BEAR transactional email pipeline and SMTP credentials are functionally verified and ready for production deliveries.
            </p>
          </td>
        </tr>

        <!-- DIAGNOSTIC DETAILS -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px;">
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase;">Recipient Account</td>
                <td align="right" style="font-size: 12px; font-weight: bold; color: #f4f4f5; font-family: monospace;">${safeAdmin}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase; padding-top: 6px;">Test Timestamp</td>
                <td align="right" style="font-size: 11px; color: #a1a1aa; padding-top: 6px;">${safeTime}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; color: #71717a; text-transform: uppercase; padding-top: 6px;">Pipeline State</td>
                <td align="right" style="font-size: 11px; color: #34d399; font-weight: bold; padding-top: 6px;">ONLINE · TLS ACTIVE</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  });

  const text = `BEAR PERFORMANCE WEAR — SMTP DIAGNOSTIC TEST

Your transactional email pipeline is online and operational.
Recipient: ${safeAdmin}
Timestamp: ${safeTime}

BEAR Performance Wear Pvt. Ltd.`;

  return { html, text };
}

export default {
  renderOtpEmail,
  renderOrderConfirmationEmail,
  renderShipmentDispatchedEmail,
  renderAdminTestEmail,
  escapeHtml,
};

