import { announcementMessages } from '../data/content.js';

let currentIndex = 0;
let intervalId = null;
let dismissed = false;

export function mount(container) {
  if (dismissed) return;

  const bar = document.createElement('div');
  bar.className = 'announcement-bar';
  bar.setAttribute('role', 'banner');
  bar.setAttribute('aria-label', 'Site announcement');
  bar.innerHTML = `
    <div class="announcement-bar-inner container">
      <span class="announcement-bar__message" aria-live="polite"></span>
      <button class="announcement-bar__dismiss" aria-label="Dismiss announcement" title="Dismiss">×</button>
    </div>
  `;

  const messageEl = bar.querySelector('.announcement-bar__message');
  const dismissBtn = bar.querySelector('.announcement-bar__dismiss');

  function showMessage(index) {
    messageEl.textContent = announcementMessages[index % announcementMessages.length];
  }

  showMessage(currentIndex);

  // Rotate messages every 4 seconds
  if (announcementMessages.length > 1) {
    intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % announcementMessages.length;
      showMessage(currentIndex);
    }, 4000);
  }

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

