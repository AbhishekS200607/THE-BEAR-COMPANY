/**
 * Product gallery — desktop thumbnails + mobile swipe
 */

function makePlaceholderSVG(name, index, mode = 'bear') {
  const bgColors = mode === 'sow'
    ? ['#EFE7DF', '#E5DDD4', '#DBD0C5']
    : ['#F0F0EE', '#E8E8E4', '#E0E0DC'];
  const bg = bgColors[index % bgColors.length];
  const textColor = mode === 'sow' ? '#8A625B' : '#777777';
  const labels = ['Front', 'Back', 'Detail', 'Styled'];
  const label = labels[index % labels.length];

  return `
    <svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="300" height="400" fill="${bg}"/>
      <text x="150" y="185" font-family="Inter, system-ui" font-size="14" font-weight="600" fill="${textColor}" text-anchor="middle" opacity="0.4">${name}</text>
      <text x="150" y="215" font-family="Inter, system-ui" font-size="12" font-weight="400" fill="${textColor}" text-anchor="middle" opacity="0.3">${label}</text>
    </svg>
  `;
}

/**
 * Create desktop gallery (thumbnails left/below main)
 */
export function createProductGallery(product) {
  const images = product.images || [];
  const imageCount = Math.max(images.length, 2);
  let activeIndex = 0;

  const wrapper = document.createElement('div');
  wrapper.className = 'product-gallery';

  const mainWrap = document.createElement('div');
  mainWrap.className = 'product-gallery__main';

  const thumbsWrap = document.createElement('div');
  thumbsWrap.className = 'product-gallery__thumbs';

  function renderMain(index) {
    mainWrap.innerHTML = makePlaceholderSVG(product.name, index, product.mode);
    mainWrap.classList.remove('gallery-main-fade');
    void mainWrap.offsetWidth;
    mainWrap.classList.add('gallery-main-fade');
  }

  function renderThumbs() {
    thumbsWrap.innerHTML = '';
    for (let i = 0; i < imageCount; i++) {
      const thumb = document.createElement('div');
      thumb.className = `product-gallery__thumb ${i === activeIndex ? 'active' : ''}`;
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('aria-label', `View image ${i + 1}`);
      thumb.innerHTML = makePlaceholderSVG(product.name, i, product.mode);
      thumb.addEventListener('click', () => {
        activeIndex = i;
        renderMain(i);
        thumbsWrap.querySelectorAll('.product-gallery__thumb').forEach((t, ti) => {
          t.classList.toggle('active', ti === i);
        });
      });
      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); thumb.click(); }
      });
      thumbsWrap.appendChild(thumb);
    }
  }

  renderMain(0);
  renderThumbs();
  wrapper.appendChild(mainWrap);
  wrapper.appendChild(thumbsWrap);

  return wrapper;
}

/**
 * Create mobile swipeable gallery
 */
export function createMobileGallery(product) {
  const images = product.images || [];
  const imageCount = Math.max(images.length, 2);
  let currentSlide = 0;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="gallery-mobile">
      <div class="gallery-mobile__track" id="gallery-track"></div>
    </div>
    <div class="gallery-dots" id="gallery-dots" aria-label="Image ${currentSlide + 1} of ${imageCount}"></div>
  `;

  const track = wrapper.querySelector('#gallery-track');
  const dots = wrapper.querySelector('#gallery-dots');

  // Create slides
  for (let i = 0; i < imageCount; i++) {
    const slide = document.createElement('div');
    slide.className = 'gallery-mobile__slide';
    slide.innerHTML = makePlaceholderSVG(product.name, i, product.mode);
    track.appendChild(slide);
  }

  // Create dots
  for (let i = 0; i < imageCount; i++) {
    const dot = document.createElement('button');
    dot.className = `gallery-dot ${i === 0 ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Image ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dots.appendChild(dot);
  }

  function goTo(index) {
    currentSlide = Math.max(0, Math.min(index, imageCount - 1));
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    dots.setAttribute('aria-label', `Image ${currentSlide + 1} of ${imageCount}`);
  }

  // Touch/swipe
  let startX = 0;
  let isDragging = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      goTo(currentSlide + (diff > 0 ? 1 : -1));
    }
  });

  return wrapper;
}

export default { createProductGallery, createMobileGallery };

