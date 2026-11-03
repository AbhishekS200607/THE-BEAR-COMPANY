/**
 * Floating Scroll-to-Top Button
 * Automatically appears when scrolled down > 350px.
 */

export function mountScrollToTop() {
  const existing = document.getElementById('scroll-to-top-btn');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.id = 'scroll-to-top-btn';
  btn.setAttribute('aria-label', 'Scroll back to top');
  btn.setAttribute('title', 'Scroll to top');
  btn.className = 'fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40 w-11 h-11 rounded-full bg-black/90 text-white shadow-lg backdrop-blur flex items-center justify-center opacity-0 pointer-events-none transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/10';

  btn.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">arrow_upward</span>
  `;

  document.body.appendChild(btn);

  let isVisible = false;

  function onScroll() {
    const shouldShow = window.scrollY > 350;
    if (shouldShow && !isVisible) {
      isVisible = true;
      btn.classList.remove('opacity-0', 'pointer-events-none');
      btn.classList.add('opacity-100', 'pointer-events-auto');
    } else if (!shouldShow && isVisible) {
      isVisible = false;
      btn.classList.remove('opacity-100', 'pointer-events-auto');
      btn.classList.add('opacity-0', 'pointer-events-none');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

export default { mountScrollToTop };
