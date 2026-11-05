let currentIndex = 0;
let intervalId = null;
let dismissed = false;

const DEFAULT_MESSAGES = [
  '⚡ Free Pan-India Air Express Delivery (₹0 Delivery Charge)',
  '🏷️ Use Code BEAR10 for 10% Off At Checkout',
  '🔄 7-Day Doorstep Size Swaps & Instant Exchanges',
  '💬 Order & Track Direct via WhatsApp: +91 96052 10198',
];

let activeMessages = [...DEFAULT_MESSAGES];

// Fetch dynamic promotions from server
async function loadPromotions() {
  try {
    const res = await fetch('http://localhost:4000/api/v1/promotions');
    if (res.ok) {
      const json = await res.json();
      const msgs = json.data?.announcement_bar?.messages;
      if (Array.isArray(msgs) && msgs.length > 0) {
        activeMessages = msgs;
      }
    }
  } catch {
    // Keep DEFAULT_MESSAGES if server unreachable
  }
}

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
      messageEl.textContent = activeMessages[index % activeMessages.length];
      messageEl.classList.remove('-translate-y-2');
      messageEl.classList.add('translate-y-2');

      requestAnimationFrame(() => {
        messageEl.classList.remove('opacity-0', 'translate-y-2');
        messageEl.classList.add('opacity-100', 'translate-y-0');
      });
    }, 200);
  }

  messageEl.textContent = activeMessages[0];

  loadPromotions().then(() => {
    if (messageEl && activeMessages.length > 0) {
      messageEl.textContent = activeMessages[currentIndex % activeMessages.length];
    }
  });

  // Rotate messages every 3.8 seconds
  intervalId = setInterval(() => {
    currentIndex = (currentIndex + 1) % activeMessages.length;
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

  container.prepend(bar);
}

export function unmount() {
  if (intervalId) clearInterval(intervalId);
  const bar = document.querySelector('.announcement-bar');
  if (bar) bar.remove();
}

export default { mount, unmount };
