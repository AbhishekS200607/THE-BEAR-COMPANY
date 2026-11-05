/**
 * Floating WhatsApp Support Button
 * Styled to match BEAR/SOW brand accent — not WhatsApp green.
 */

import { getMode } from '../state/store.js';

export function mountFloatingWhatsApp() {
  const existing = document.getElementById('floating-whatsapp-widget');
  if (existing) existing.remove();

  const mode = getMode();
  const isSow = mode === 'sow';
  const bg = isSow ? '#80534C' : '#09090b';
  const bgHover = isSow ? '#6b4540' : '#27272a';

  const waPhone = '919605210198';
  const prefilled = encodeURIComponent('Hi BEAR Support! I have a question regarding my order and sizing.');
  const waUrl = `https://wa.me/${waPhone}?text=${prefilled}`;

  const widget = document.createElement('aside');
  widget.id = 'floating-whatsapp-widget';
  widget.setAttribute('aria-label', 'WhatsApp Support');
  widget.style.cssText = 'position:fixed;bottom:96px;right:20px;z-index:40;display:flex;align-items:center;';

  widget.innerHTML = `
    <style>
      #floating-whatsapp-widget .wa-tooltip {
        display: none;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        background: ${bg};
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-right: 8px;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.18);
      }
      @media (min-width: 768px) {
        #floating-whatsapp-widget:hover .wa-tooltip { display: flex; }
      }
      #floating-whatsapp-widget .wa-btn {
        width: 46px;
        height: 46px;
        border-radius: 999px;
        background: ${bg};
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        box-shadow: 0 4px 16px rgba(0,0,0,0.22);
        border: 2px solid rgba(255,255,255,0.12);
        transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        cursor: pointer;
        flex-shrink: 0;
      }
      #floating-whatsapp-widget .wa-btn:hover {
        background: ${bgHover};
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0,0,0,0.28);
      }
      #floating-whatsapp-widget .wa-btn:active {
        transform: scale(0.95);
      }
      @media (min-width: 768px) {
        #floating-whatsapp-widget {
          bottom: 32px;
          right: 96px;
        }
      }
    </style>

    <!-- Tooltip -->
    <div class="wa-tooltip">
      <span style="width:7px;height:7px;border-radius:50%;background:#4ade80;animation:pulse 1.5s infinite;flex-shrink:0;"></span>
      <span>Support</span>
    </div>

    <!-- Button -->
    <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="wa-btn" aria-label="Chat with BEAR on WhatsApp">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
      </svg>
    </a>
  `;

  document.body.appendChild(widget);

  // Re-mount on mode change so accent colour updates
  window.addEventListener('mode-change', () => mountFloatingWhatsApp(), { once: true });
}

export default { mountFloatingWhatsApp };
