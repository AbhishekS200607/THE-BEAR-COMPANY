import { getCartCount, subscribe } from '../state/store.js';

const routes = [
  { hash: '#', label: 'Home', icon: '⌂' },
  { hash: '#collection', label: 'Collection', icon: '▦' },
];

function getActiveHash() {
  const hash = window.location.hash;
  if (!hash || hash === '#') return '#';
  if (hash.startsWith('#collection')) return '#collection';
  return hash;
}

export function createNavLinks(type = 'desktop') {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Main navigation');

  function render() {
    const active = getActiveHash();
    if (type === 'desktop') {
      nav.innerHTML = routes
        .map(
          (r) =>
            `<a href="${r.hash}" class="nav-pill__link ${active === r.hash ? 'active' : ''}" aria-current="${active === r.hash ? 'page' : 'false'}">${r.label}</a>`
        )
        .join('');
    }
  }

  render();
  window.addEventListener('hashchange', () => render());
  return nav;
}

export function createCartBadge() {
  const badge = document.createElement('span');
  badge.className = 'badge-count';
  badge.setAttribute('aria-label', 'Cart items');

  function update() {
    const count = getCartCount();
    badge.textContent = count > 0 ? (count > 9 ? '9+' : count) : '';
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  update();
  subscribe(update);
  return badge;
}

export default { createNavLinks, createCartBadge };

