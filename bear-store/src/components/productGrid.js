import { createProductCard } from './productCard.js';

/**
 * Render a skeleton card for loading state
 */
function createSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'skeleton-card';
  card.innerHTML = `
    <div class="skeleton skeleton-image"></div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text-sm"></div>
  `;
  return card;
}

/**
 * Render a grid of product cards.
 * @param {Element} container
 * @param {Array} products
 * @param {object} options
 */
export function renderProductGrid(container, products, options = {}) {
  const {
    columns = 'auto', // 'auto' | 2 | 3 | 4
    loading = false,
    skeletonCount = 8,
    emptyMessage = 'No products found.',
    emptySubtitle = 'Try adjusting your filters or browse all products.',
  } = options;

  const gridEl = document.createElement('div');
  const colClass =
    columns === 'auto'
      ? 'grid grid-auto'
      : columns === 4
      ? 'grid product-grid-4 grid-auto'
      : columns === 3
      ? 'grid product-grid-3'
      : 'grid grid-2';
  gridEl.className = colClass;
  gridEl.style.gap = 'var(--space-4)';

  if (loading) {
    for (let i = 0; i < skeletonCount; i++) {
      gridEl.appendChild(createSkeletonCard());
    }
  } else if (!products || products.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.gridColumn = '1 / -1';
    empty.innerHTML = `
      <div class="empty-state__icon">🏷️</div>
      <h3 class="empty-state__title">${emptyMessage}</h3>
      <p class="empty-state__desc">${emptySubtitle}</p>
      <a href="#collection" class="btn btn-primary btn-sm">Browse All</a>
    `;
    gridEl.appendChild(empty);
  } else {
    products.forEach((product) => {
      gridEl.appendChild(createProductCard(product));
    });
  }

  container.innerHTML = '';
  container.appendChild(gridEl);
}

export default { renderProductGrid };

