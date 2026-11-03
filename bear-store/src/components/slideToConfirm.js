/**
 * Slide to Confirm Interactive Component
 * High-performance mobile touch + pointer slider for order confirmation.
 * Compatible with all touchscreens, iOS Safari, Android Chrome, and desktop pointer emulators.
 */

export function createSlideToConfirm({
  label = 'SLIDE TO CONFIRM ORDER',
  confirmedLabel = 'ORDER CONFIRMED',
  mode = 'bear',
  onConfirm = () => {},
  validate = () => true,
}) {
  const isSow = mode === 'sow';
  const container = document.createElement('div');
  container.className = 'w-full select-none';
  container.setAttribute('data-purpose', 'slide-to-confirm');

  const trackBg = isSow ? 'bg-[#332923]' : 'bg-black';
  const progressBg = isSow ? 'bg-[#80534C]' : 'bg-zinc-800';
  const thumbBg = 'bg-white text-zinc-950';

  container.innerHTML = `
    <div class="relative w-full h-14 ${trackBg} rounded-full p-1.5 overflow-hidden flex items-center shadow-lg border border-zinc-800/80 cursor-pointer touch-none" id="slider-track" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${label}">
      <!-- Dynamic Progress Fill Behind Thumb -->
      <div id="slider-progress" class="absolute left-0 top-0 bottom-0 w-0 ${progressBg} rounded-full transition-all duration-75 pointer-events-none"></div>

      <!-- Centered Shimmering Label -->
      <div id="slider-label" class="absolute inset-0 flex items-center justify-center pointer-events-none px-12 transition-opacity duration-200">
        <span class="font-headline text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <span>${label}</span>
          <span class="material-symbols-outlined text-[15px] animate-pulse">chevron_right</span>
        </span>
      </div>

      <!-- Draggable Circular Thumb Handle -->
      <div id="slider-thumb" class="relative z-10 w-11 h-11 ${thumbBg} rounded-full flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing transition-transform duration-75 touch-none shrink-0">
        <span id="slider-icon" class="material-symbols-outlined text-[20px] font-bold text-zinc-900 select-none">arrow_forward</span>
      </div>
    </div>
    <p class="text-center text-[11px] text-zinc-400 mt-2 font-medium">
      Swipe the handle all the way right to confirm
    </p>
  `;

  const track = container.querySelector('#slider-track');
  const thumb = container.querySelector('#slider-thumb');
  const progress = container.querySelector('#slider-progress');
  const labelEl = container.querySelector('#slider-label');
  const iconEl = container.querySelector('#slider-icon');

  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let maxSlide = 0;
  let isConfirmed = false;

  function calculateMaxSlide() {
    const trackWidth = track.clientWidth;
    const thumbWidth = thumb.clientWidth;
    // Account for 6px padding on each side (p-1.5 = 6px)
    maxSlide = Math.max(0, trackWidth - thumbWidth - 12);
  }

  function updatePosition(x) {
    thumb.style.transform = `translateX(${x}px)`;
    progress.style.width = `${x + thumb.clientWidth + 6}px`;

    // Fade out label as thumb slides
    const progressRatio = maxSlide > 0 ? x / maxSlide : 0;
    labelEl.style.opacity = `${Math.max(0, 1 - progressRatio * 1.5)}`;
    track.setAttribute('aria-valuenow', Math.round(progressRatio * 100));
  }

  function resetSlider() {
    isDragging = false;
    currentX = 0;
    thumb.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
    progress.style.transition = 'width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
    updatePosition(0);

    setTimeout(() => {
      thumb.style.transition = '';
      progress.style.transition = '';
    }, 250);
  }

  function confirmSlider() {
    isConfirmed = true;
    isDragging = false;
    currentX = maxSlide;
    thumb.style.transition = 'transform 0.15s ease-out';
    progress.style.transition = 'width 0.15s ease-out';
    updatePosition(maxSlide);

    // Visual confirmed state
    thumb.className = `relative z-10 w-11 h-11 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md transition-all shrink-0`;
    iconEl.className = 'material-symbols-outlined text-[20px] font-bold text-white';
    iconEl.textContent = 'check';

    labelEl.innerHTML = `
      <span class="font-headline text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px]">verified</span>
        <span>${confirmedLabel}</span>
      </span>
    `;
    labelEl.style.opacity = '1';

    // Haptic feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch (e) {
        // Ignore if blocked
      }
    }

    // Trigger action
    onConfirm();
  }

  // ── TOUCH EVENT LISTENERS (Mobile Native Touch) ─────────────
  thumb.addEventListener(
    'touchstart',
    (e) => {
      if (isConfirmed) return;
      if (!validate()) {
        resetSlider();
        return;
      }
      calculateMaxSlide();
      isDragging = true;
      startX = e.touches[0].clientX - currentX;
      thumb.style.transition = '';
      progress.style.transition = '';
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (!isDragging || isConfirmed) return;
      const touchX = e.touches[0].clientX;
      const delta = touchX - startX;
      currentX = Math.max(0, Math.min(delta, maxSlide));
      updatePosition(currentX);

      // Check threshold (80% or greater triggers confirmation)
      if (maxSlide > 0 && currentX >= maxSlide * 0.82) {
        confirmSlider();
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    () => {
      if (!isDragging || isConfirmed) return;
      if (maxSlide > 0 && currentX >= maxSlide * 0.82) {
        confirmSlider();
      } else {
        resetSlider();
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchcancel',
    () => {
      if (!isDragging || isConfirmed) return;
      resetSlider();
    },
    { passive: true }
  );

  // ── POINTER / MOUSE EVENT LISTENERS (Desktop / Emulators) ───
  thumb.addEventListener('pointerdown', (e) => {
    if (isConfirmed) return;
    if (e.pointerType === 'touch') return; // Handled by touch listeners
    if (!validate()) {
      resetSlider();
      return;
    }
    calculateMaxSlide();
    isDragging = true;
    startX = e.clientX - currentX;
    thumb.setPointerCapture?.(e.pointerId);
    thumb.style.transition = '';
    progress.style.transition = '';
  });

  thumb.addEventListener('pointermove', (e) => {
    if (!isDragging || isConfirmed) return;
    if (e.pointerType === 'touch') return;
    const delta = e.clientX - startX;
    currentX = Math.max(0, Math.min(delta, maxSlide));
    updatePosition(currentX);

    if (maxSlide > 0 && currentX >= maxSlide * 0.82) {
      confirmSlider();
    }
  });

  thumb.addEventListener('pointerup', (e) => {
    if (!isDragging || isConfirmed) return;
    if (e.pointerType === 'touch') return;
    thumb.releasePointerCapture?.(e.pointerId);
    if (maxSlide > 0 && currentX >= maxSlide * 0.82) {
      confirmSlider();
    } else {
      resetSlider();
    }
  });

  thumb.addEventListener('pointercancel', () => {
    if (!isDragging || isConfirmed) return;
    resetSlider();
  });

  // Track click to snap/slide if clicked near right edge
  track.addEventListener('click', (e) => {
    if (isConfirmed) return;
    if (e.target === thumb || thumb.contains(e.target)) return;
    calculateMaxSlide();
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX > rect.width * 0.7) {
      if (!validate()) return;
      confirmSlider();
    }
  });

  // Public reset method
  container.reset = () => {
    isConfirmed = false;
    thumb.className = `relative z-10 w-11 h-11 ${thumbBg} rounded-full flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing transition-transform duration-75 touch-none shrink-0`;
    iconEl.className = 'material-symbols-outlined text-[20px] font-bold text-zinc-900 select-none';
    iconEl.textContent = 'arrow_forward';
    labelEl.innerHTML = `
      <span class="font-headline text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
        <span>${label}</span>
        <span class="material-symbols-outlined text-[15px] animate-pulse">chevron_right</span>
      </span>
    `;
    resetSlider();
  };

  return container;
}

export default { createSlideToConfirm };

