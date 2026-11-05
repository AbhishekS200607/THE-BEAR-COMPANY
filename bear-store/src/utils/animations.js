/**
 * BEAR Store — Animation Utilities
 * Wires up all 14 animation behaviours via JS.
 * Call initAnimations() once on app boot.
 */

// ── 3. Image lazy-load fade-in ────────────────────────────────
export function initLazyImages(root = document) {
  root.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.classList.add('img-lazy');
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('img-loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('img-loaded'), { once: true });
    }
  });
}

// ── 4. Product grid stagger entrance ─────────────────────────
export function applyStagger(container, selector = '[data-purpose="product-card"]') {
  const cards = container.querySelectorAll(selector);
  cards.forEach((card, i) => {
    const d = Math.min(i, 7);
    card.classList.add('card-stagger', `card-stagger-d${d}`);
  });
}

// ── 5. Number counter roll-up ─────────────────────────────────
export function animateCounter(el, target, duration = 800) {
  const start = performance.now();
  const from = 0;
  el.classList.add('count-up-anim');
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }
  requestAnimationFrame(tick);
}

// ── 7. Form input shake on error ─────────────────────────────
export function shakeInput(el) {
  el.classList.remove('input-shake');
  void el.offsetWidth; // reflow to restart
  el.classList.add('input-shake');
  el.addEventListener('animationend', () => el.classList.remove('input-shake'), { once: true });
}

// ── 8. Button loading spinner ─────────────────────────────────
export function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="btn-spinner"></span>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || originalText || '';
  }
}

// ── 1. Add to cart burst + badge pop ─────────────────────────
export function cartAddFeedback(btn) {
  btn.classList.remove('cart-add-burst');
  void btn.offsetWidth;
  btn.classList.add('cart-add-burst');
  btn.addEventListener('animationend', () => btn.classList.remove('cart-add-burst'), { once: true });

  // Pop all cart badges in the DOM
  document.querySelectorAll('.badge-count, .mobile-dock__badge').forEach((badge) => {
    badge.classList.remove('badge-pop');
    void badge.offsetWidth;
    badge.classList.add('badge-pop');
    badge.addEventListener('animationend', () => badge.classList.remove('badge-pop'), { once: true });
  });
}

// ── 2. Wishlist heart animation ───────────────────────────────
export function animateHeart(btn, isWishlisted) {
  const cls = isWishlisted ? 'heart-fill-anim' : 'heart-unfill-anim';
  btn.classList.remove('heart-fill-anim', 'heart-unfill-anim');
  void btn.offsetWidth;
  btn.classList.add(cls);
  btn.addEventListener('animationend', () => btn.classList.remove(cls), { once: true });
}

// ── 10. Scroll-triggered section reveal ──────────────────────
export function initScrollReveal(root = document) {
  const els = root.querySelectorAll('.reveal, .reveal-left, .reveal-scale');
  if (!els.length) return;

  // Immediately reveal elements that are already within initial viewport
  els.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('revealed');
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
  );

  els.forEach((el) => {
    if (!el.classList.contains('revealed')) {
      observer.observe(el);
    }
  });
}

// ── 12. Mode switch ripple ────────────────────────────────────
export function addRipple(btn, e) {
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'mode-ripple';
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top  = `${e.clientY - rect.top}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

// ── 9. Price strike-through on compare prices ─────────────────
export function initPriceStrikes(root = document) {
  root.querySelectorAll('.line-through, [class*="line-through"]').forEach((el) => {
    el.classList.add('price-strike');
    // remove native line-through so our CSS pseudo-element handles it
    el.style.textDecoration = 'none';
  });
}

// ── 14. Stock badge pulse ─────────────────────────────────────
export function initStockBadges(root = document) {
  root.querySelectorAll('[data-stock-low]').forEach((el) => {
    el.classList.add('stock-badge-pulse');
  });
}

// Helper to find the actual visible cart button in either desktop header, mobile top bar, or mobile bottom dock
function getVisibleCartTarget() {
  const candidates = [
    document.querySelector('#header-cart-btn'),
    document.querySelector('#mobile-header-cart-btn'),
    document.querySelector('#dock-cart-btn'),
  ];
  for (const el of candidates) {
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && rect.top >= -10 && rect.left >= -10) {
      return { el, rect };
    }
  }
  // Safe default fallback anchored near top right
  return {
    el: null,
    rect: { left: window.innerWidth - 48, top: 16, width: 28, height: 28 },
  };
}

// ── 20. Parabolic Fly-to-Cart Animation ──────────────────────
export function flyToCart(startEl, imageUrl = '') {
  if (!startEl) return;

  const startRect = startEl.getBoundingClientRect();
  const { el: targetEl, rect: targetRect } = getVisibleCartTarget();

  const particle = document.createElement('div');
  particle.className = 'fly-to-cart-particle';

  if (imageUrl) {
    particle.style.backgroundImage = `url('${imageUrl}')`;
  } else {
    particle.style.background = '#09090b';
  }

  // Start position: center of the trigger element
  const x0 = startRect.left + startRect.width / 2 - 26;
  const y0 = startRect.top + startRect.height / 2 - 26;

  // End position: center of the cart icon
  const x1 = targetRect.left + targetRect.width / 2 - 26;
  const y1 = targetRect.top + targetRect.height / 2 - 26;

  // Parabolic control point: Midpoint X, arc stays comfortably within the viewport
  const cpX = (x0 + x1) / 2;
  const highestY = Math.min(y0, y1);
  // Ensure peak arc NEVER goes negative (off-screen) — keeps at least 20px below screen top
  const cpY = Math.max(20, highestY - Math.min(100, Math.abs(x1 - x0) * 0.28 + 30));

  particle.style.left = '0px';
  particle.style.top = '0px';
  particle.style.transform = `translate3d(${x0}px, ${y0}px, 0) scale(1)`;
  particle.style.opacity = '1';
  document.body.appendChild(particle);

  const duration = 650;
  const startTime = performance.now();

  function easeInQuad(t) { return t * t; }
  function easeOutQuad(t) { return t * (2 - t); }

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);

    const tX = t;
    const tY = easeInQuad(t);

    // Quadratic bezier: B(t) = (1-t)²·P0 + 2(1-t)t·CP + t²·P1
    const bx = (1 - tX) * (1 - tX) * x0 + 2 * (1 - tX) * tX * cpX + tX * tX * x1;
    const by = (1 - tY) * (1 - tY) * y0 + 2 * (1 - tY) * tY * cpY + tY * tY * y1;

    // Scale shrinks smoothly from 1.0 → 0.28 as it approaches bag
    const scale = 1 - easeOutQuad(t) * 0.72;
    // Keep particle 100% visible throughout flight; only fade in last 12% of flight
    const opacity = t < 0.88 ? 1 : 1 - ((t - 0.88) / 0.12);

    particle.style.transform = `translate3d(${bx}px, ${by}px, 0) scale(${scale})`;
    particle.style.opacity = `${opacity}`;

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      particle.remove();
      // Pop all cart badges and icons
      document.querySelectorAll('#header-cart-btn, #dock-cart-btn, #mobile-header-cart-btn').forEach((btn) => {
        btn.classList.remove('cart-icon-pop');
        void btn.offsetWidth;
        btn.classList.add('cart-icon-pop');
        btn.addEventListener('animationend', () => btn.classList.remove('cart-icon-pop'), { once: true });
      });
      cartAddFeedback(startEl);
    }
  }

  requestAnimationFrame(frame);
}

// ── 21. 3D Card Tilt with Dynamic Fabric Sheen ────────────────
export function initCard3DTilt(root = document) {
  const cards = root.querySelectorAll('[data-purpose="product-card"], .product-card-3d');
  cards.forEach((card) => {
    card.classList.add('product-card-3d');
    if (!card.querySelector('.card-sheen')) {
      const sheen = document.createElement('div');
      sheen.className = 'card-sheen';
      card.appendChild(sheen);
    }

    let rect = null;
    const getRect = () => {
      if (!rect) rect = card.getBoundingClientRect();
      return rect;
    };

    card.addEventListener('mouseenter', () => {
      rect = card.getBoundingClientRect();
    });

    card.addEventListener('mousemove', (e) => {
      const r = getRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--tilt-rx', `${-y * 14}deg`);
      card.style.setProperty('--tilt-ry', `${x * 14}deg`);
      card.style.setProperty('--sheen-x', `${e.clientX - r.left}px`);
      card.style.setProperty('--sheen-y', `${e.clientY - r.top}px`);
    });

    card.addEventListener('mouseleave', () => {
      rect = null;
      card.style.setProperty('--tilt-rx', '0deg');
      card.style.setProperty('--tilt-ry', '0deg');
    });
  });
}

// ── 24. Monochrome Luxury Particle Burst (Confetti) ───────────
export function triggerOrderConfetti() {
  const existing = document.querySelector('.order-confetti-canvas');
  if (existing) existing.remove();

  const canvas = document.createElement('canvas');
  canvas.className = 'order-confetti-canvas';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#09090b', '#27272a', '#71717a', '#d4d4d8', '#ffffff', '#80534C'];
  const particles = Array.from({ length: 80 }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.45,
    w: Math.random() * 9 + 4,
    h: Math.random() * 7 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 22,
    vy: (Math.random() * -18) - 5,
    rotation: Math.random() * 360,
    rSpeed: (Math.random() - 0.5) * 16,
    gravity: 0.45,
    drag: 0.96,
    alpha: 1,
  }));

  const startTime = performance.now();
  function renderFrame(now) {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.rotation += p.rSpeed;
      p.alpha = Math.max(0, 1 - elapsed / 2400);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < 2400) {
      requestAnimationFrame(renderFrame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(renderFrame);
}

// ── Master init for page mounts ───────────────────────────────
export function initPageAnimations(root = document) {
  initLazyImages(root);
  initScrollReveal(root);
  initPriceStrikes(root);
  initStockBadges(root);
  initCard3DTilt(root);
}

// ── Master init — call once on app boot ──────────────────────
export function initAnimations() {
  initPageAnimations(document);

  // Re-run on route changes (SPA)
  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      initPageAnimations(document);
    }, 120);
  });
}

export default {
  initAnimations,
  initPageAnimations,
  initLazyImages,
  initScrollReveal,
  initPriceStrikes,
  initStockBadges,
  initCard3DTilt,
  flyToCart,
  triggerOrderConfetti,
  applyStagger,
  animateCounter,
  shakeInput,
  setButtonLoading,
  cartAddFeedback,
  animateHeart,
  addRipple,
};
