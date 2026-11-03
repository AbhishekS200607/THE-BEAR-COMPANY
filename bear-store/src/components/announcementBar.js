import { announcementMessages } from '../data/content.js';

let currentIndex = 0;
let intervalId = null;
let dismissed = false;

const VALUE_MESSAGES = [
  '⚡ Free Pan-India Air Express Delivery (₹0 Delivery Charge)',
  '🏷️ Use Code BEAR10 for 10% Off At Checkout',
  '🔄 7-Day Doorstep Size Swaps & Instant Exchanges',
  '💬 Order & Track Direct via WhatsApp: +91 96052 10198',
];

export function mount(container) {
  if (dismissed) return;

  const bar = document.createElement('div');
  bar.className = 'announcement-bar';
  bar.setAttribute('role', 'banner');
  bar.setAttribute('aria-label', 'Site announcement');
  bar.innerHTML = `
    <div class="announcement-bar-inner container flex items-center justify-between overflow-hidden relative">
      <div class="flex-1 text-center overflow-hidden h-5 flex items-center justify-center">
        <span class="announcement-bar__message inline-block transition-all duration-300 transform opacity-100 translate-y-0" aria-live="polite"></span>
      </div>
      <button class="announcement-bar__dismiss ml-2 shrink-0 cursor-pointer" aria-label="Dismiss announcement" title="Dismiss">×</button>
    </div>
  `;

  const messageEl = bar.querySelector('.announcement-bar__message');
  const dismissBtn = bar.querySelector('.announcement-bar__dismiss');

  function showMessage(index) {
    if (!messageEl) return;
    messageEl.classList.remove('opacity-100', 'translate-y-0');
    messageEl.classList.add('opacity-0', '-translate-y-2');

    setTimeout(() => {
      messageEl.textContent = VALUE_MESSAGES[index % VALUE_MESSAGES.length];
      messageEl.classList.remove('-translate-y-2');
      messageEl.classList.add('translate-y-2');

      requestAnimationFrame(() => {
        messageEl.classList.remove('opacity-0', 'translate-y-2');
        messageEl.classList.add('opacity-100', 'translate-y-0');
      });
    }, 200);
  }

  messageEl.textContent = VALUE_MESSAGES[0];

  // Rotate messages every 3.8 seconds
  intervalId = setInterval(() => {
    currentIndex = (currentIndex + 1) % VALUE_MESSAGES.length;
    showMessage(currentIndex);
  }, 3800);

  dismissBtn.addEventListener('click', () => {
    dismissed = true;
    if (intervalId) clearInterval(intervalId);
    bar.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
    bar.style.maxHeight = bar.offsetHeight + 'px';
    requestAnimationFrame(() => {
      bar.style.maxHeight = '0';
      bar.style.opacity = '0';
      bar.style.overflow = 'hidden';
      setTimeout(() => bar.remove(), 350);
    });
  });

  container.appendChild(bar);
}

export default { mount };

