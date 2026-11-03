/**
 * SEO & Social Graph Meta Manager
 * Updates page title, meta description, Open Graph and Twitter Card tags per route.
 */

export function setPageMeta({ title, description, image, url } = {}) {
  // 1. Update Title
  if (title) {
    document.title = title;
  }

  const defaultDesc = 'BEAR & SOW — High-performance athletic wear engineered for discipline, movement, and everyday luxury. Pan-India air express delivery.';
  const defaultImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0A_M4HqJNIIAusW1iTMaL94tnVHUlB2_7uyMjBw5mHw6BLBMJonDYlpbl1ks7zxdtF5jLW3oxBMrz9ZUSoacdbiSztre6lZoDTkvo9Apt6qGtxTxL2PLQibuZAUxKdZJVQD8YhaWaEAhApqCJQHkOjxDW8K-juFBWPSJxhzNXraK5jbwy0Vfos7iF5tBILTs-ByqMTeXYzQYYE66yCKJF6mcKz8kT6DF0rxTO3w';
  const currentUrl = url || window.location.href;

  const descContent = description || defaultDesc;
  const imageContent = image || defaultImage;

  function setMetaTag(attr, key, content) {
    let tag = document.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }

  // Standard Description
  setMetaTag('name', 'description', descContent);

  // Open Graph
  setMetaTag('property', 'og:title', title || document.title);
  setMetaTag('property', 'og:description', descContent);
  setMetaTag('property', 'og:image', imageContent);
  setMetaTag('property', 'og:url', currentUrl);
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:site_name', 'BEAR & SOW Store');

  // Twitter Cards
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title || document.title);
  setMetaTag('name', 'twitter:description', descContent);
  setMetaTag('name', 'twitter:image', imageContent);
}

export default { setPageMeta };

