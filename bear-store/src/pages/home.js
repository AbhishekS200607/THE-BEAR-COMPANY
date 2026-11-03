import { getMode, setMode, subscribe } from '../state/store.js';
import { getFeatured, getProducts } from '../services/productService.js';
import { createProductCard } from '../components/productCard.js';
import { getRecentlyViewedIds } from '../services/recentlyViewedService.js';
import { products } from '../data/products.js';

export async function render(container) {
  const currentMode = getMode();
  const isSow = currentMode === 'sow';

  const page = document.createElement('div');
  page.className = 'w-full flex flex-col pt-20 md:pt-24 pb-28 md:pb-12';

  // Render initial page with loading skeletons in grid to eliminate layout shift
  page.innerHTML = `
    <!-- Top Hero Campaign Section -->
    <section class="relative w-full max-w-[1360px] mx-auto px-4 md:px-gutter-desktop mt-2 md:mt-space-lg mb-6 md:mb-space-2xl">
      <div class="relative w-full min-h-[440px] md:min-h-[580px] rounded-2xl md:rounded-lg overflow-hidden shadow-sm flex items-center bg-primary" id="campaign-banner">
        <!-- Hero Background Image -->
        <img 
          src="${isSow 
            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwJwjClrMEmcZdI7T5_s4E_hHPVNSvONzixL7JG9-QvsrOFNVHsJuM34lczkEnDZwBuddxz_XYgYNG3dVxfyDWbS9nWSmYIm9hoZqLJC2kjzY0eZzeqffaWX-YYCyBV25Vha3ShEgy8-DsQyeiv8v-7doFJr0Aw4myGI4pHt412ia-kqZZyIN1J3O23yjiYoMKkZDS_f51t6qAJ4pXlwdu3EG3rgGzswUdnY2fxQ' 
            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_vt3-yhwyyME5_KhwDPsuet5gX1jptpflQhFdHmb5tVbgcgIczBJgAb9QGPF2ouw_6YFT8UCUqCxPFPi2MPKY0XHZHfFUiybXRhZ9tXmnHYr97LqU1n8pbc1TtMcci0D_xC4k_-Ub7e7aEhmFH8ZVrv8J7yDBPPmgJtg1-xZ0s4k9OPIVMBnoSaF0I7ABdrWr81Fbgn9SOTyg0lLjej86iO7ebRI2qqIRgF4gCA'}" 
          alt="${isSow ? 'SOW Athletic Luxury Campaign' : 'BEAR High-Performance Campaign'}" 
          class="absolute inset-0 w-full h-full object-cover object-top"
          id="hero-bg-img"
        />
        <!-- Ambient Gradient Overlay -->
        <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.2) 100%);"></div>

        <!-- Hero Content Overlay -->
        <div class="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 items-center p-5 md:p-space-xl lg:p-space-2xl gap-5 md:gap-space-xl">
          <div class="lg:col-span-7 flex flex-col items-start space-y-3.5 md:space-y-space-md text-white">
            <div class="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white shadow-sm border border-white/20">
              <span class="w-2 h-2 rounded-full ${isSow ? 'bg-[#ffc3bb]' : 'bg-green-400'} animate-pulse"></span>
              <span class="font-headline text-[10px] md:text-xs uppercase tracking-widest text-white/90 font-bold">
                ${isSow ? 'SOW // ATHLETIC LUXURY CAPSULE' : 'SEASON 04 // ACTIVE REPOSITORY'}
              </span>
            </div>

            <div class="space-y-1" id="hero-headings">
              <p class="font-headline text-xs tracking-widest uppercase text-white/70 font-semibold">
                ${isSow ? 'NEW SOW DROP' : 'NEW BEAR RELEASE'}
              </p>
              <h1 class="font-display-hero text-3xl md:text-5xl uppercase tracking-tighter text-white font-bold leading-none font-headline" id="hero-title">
                ${isSow ? 'POWER IN<br/>MOTION.' : 'BUILT FOR<br/>MORE.'}
              </h1>
            </div>

            <p class="text-xs md:text-sm text-white/80 max-w-md leading-relaxed" id="hero-subtitle">
              ${isSow 
                ? 'Ergonomic compression and ribbed silhouettes sculpted for feminine grace and physical resilience. Breathable, squat-proof, and designed to move with you.' 
                : 'Performance apparel engineered for unrelenting discipline, dynamic range of motion, and the everyday grind. Crafted with ultra-breathable heavy-GSM yarn.'}
            </p>

            <div class="pt-2 flex items-center flex-wrap gap-2.5 md:gap-space-md">
              <a href="#collection" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black text-xs md:text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md font-bold font-headline">
                <span>Shop Collection</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
              <div class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20">
                <span class="material-symbols-outlined text-[14px] ${isSow ? 'text-[#ffc3bb]' : 'text-green-400'}">verified</span>
                <span class="text-[11px] font-semibold">
                  ${isSow ? 'SculptSpun MicroRib™' : '260 GSM Interlock'}
                </span>
              </div>
            </div>
          </div>

          <div class="hidden lg:flex lg:col-span-5 relative justify-end items-end">
            <div class="w-full max-w-[360px] p-space-md rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl flex items-center justify-between border border-black/10">
              <div class="flex items-center gap-space-md">
                <div class="w-12 h-12 rounded-full ${isSow ? 'bg-[#80534C]' : 'bg-black'} text-white flex items-center justify-center font-headline-sm text-headline-sm font-bold font-headline">
                  01
                </div>
                <div>
                  <p class="font-headline text-sm text-zinc-900 uppercase font-bold">
                    ${isSow ? 'Sculpt Flex Bra' : 'Heavy Oversized Tee'}
                  </p>
                  <p class="text-xs text-zinc-500">
                    ${isSow ? 'Terracotta Clay • Medium Support' : 'Washed Carbon Black • Regular Fit'}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-base text-zinc-950 font-bold font-headline">
                  ${isSow ? '₹1,199' : '₹999'}
                </p>
                <span class="text-[10px] text-green-700 uppercase font-bold">In Stock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Matrix -->
    <section class="w-full max-w-[1360px] mx-auto px-4 md:px-gutter-desktop mb-6 md:mb-space-2xl">
      <div class="flex items-end justify-between mb-3 md:mb-space-lg">
        <div>
          <p class="text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest font-bold font-headline">ARCHITECTURE OF GEAR</p>
          <h2 class="font-headline text-lg md:text-2xl text-zinc-950 uppercase tracking-tight font-bold">
            ${isSow ? 'SOW Silhouettes' : 'Category Matrix'}
          </h2>
        </div>
        <a href="#collection" class="text-xs text-zinc-700 hover:text-black transition-colors inline-flex items-center gap-1 font-bold uppercase font-headline">
          Explore All <span class="material-symbols-outlined text-[14px]">north_east</span>
        </a>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-gutter-desktop">
        <!-- Category 1 -->
        <a href="#collection" class="group relative rounded-xl sm:rounded-2xl bg-white p-3 pb-4 sm:p-4 sm:pb-5 shadow-xs hover:shadow-md transition-all flex flex-col items-center border border-zinc-200/80">
          <div class="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 mb-2">
            <img src="${isSow ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwJwjClrMEmcZdI7T5_s4E_hHPVNSvONzixL7JG9-QvsrOFNVHsJuM34lczkEnDZwBuddxz_XYgYNG3dVxfyDWbS9nWSmYIm9hoZqLJC2kjzY0eZzeqffaWX-YYCyBV25Vha3ShEgy8-DsQyeiv8v-7doFJr0Aw4myGI4pHt412ia-kqZZyIN1J3O23yjiYoMKkZDS_f51t6qAJ4pXlwdu3EG3rgGzswUdnY2fxQ' : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCzKTdaaLRbanuHgk9tAnT3Od__K8RJ47QNldYiRR7AoApQCc0HaB6DuiijDI5ZEsm_MO36AofuWSm3CtHtIHJdUo8d3wJzYt5KYDvHtElcj6lVKsIi7pIJ1VneHGXzzBkdECisyUWAX_3O0YzSplDkpd2O2JyP3TdEAs03UoHehNq07xRUXrRNGRT1Cav6rakkFNYrqdyZSGUBe6S931X1B2eLXQOeaWtVGZ8bw'}" alt="${isSow ? 'Sports Bras' : 'T-Shirts'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-lg sm:rounded-xl" />
          </div>
          <div class="w-full pt-1.5 flex flex-col items-center justify-center text-center min-w-0">
            <h3 class="font-headline text-xs sm:text-sm text-zinc-900 uppercase font-bold tracking-wide truncate w-full text-center">${isSow ? 'Sports Bras' : 'T-Shirts'}</h3>
            <p class="text-[11px] text-zinc-400 font-medium truncate w-full text-center mt-0.5">${isSow ? '8 Items' : '24 Items'}</p>
          </div>
        </a>

        <!-- Category 2 (Valid Non-Truncated SOW Leggings Image) -->
        <a href="#collection" class="group relative rounded-xl sm:rounded-2xl bg-white p-3 pb-4 sm:p-4 sm:pb-5 shadow-xs hover:shadow-md transition-all flex flex-col items-center border border-zinc-200/80">
          <div class="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 mb-2">
            <img src="${isSow ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4Mwdd33IQiXxYvoZjoUYwVaNsHMyQqHGgfwrOLC7mgwyMN3lSQTRaAsvH_c2sWptQerXsbHRreHedH5S_sijZ2e9eD11keAse9pyNAJaO8GNrRM_mIUVfqDic0edxJTyW_sOIZDPUKThT-y1_8bMr9J7Yal_Sbrxk3jvw0pWsNV9HEJZeHeb9ZGWzF83475qVnVZTEVvoPfuPh-_QdwrIvx2C35dqyAykokYYRw' : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZfUaCLWobDsFeaa3fUotfDOwDwDCxViQiwoun9TK6_dXUUQXFOlWFGADID0ZMmkVuKjshRg_yXJ_0z9ern--ww8BVZ0wSTA7axQtzGhOEm14Kbno0vi-J495g6ghRL0de6ua4PncYU_8gVguf39AOI0U8ta6Agsn3oGpaUhfCyQYJhEJhNpyPwWR_3wWKE1p-FYpNffpR1LfSXhpLQ1ufI_FWbeQ2rivNiV_9uQ'}" alt="${isSow ? 'Contour Tights' : 'Tank Tops'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-lg sm:rounded-xl" />
          </div>
          <div class="w-full pt-1.5 flex flex-col items-center justify-center text-center min-w-0">
            <h3 class="font-headline text-xs sm:text-sm text-zinc-900 uppercase font-bold tracking-wide truncate w-full text-center">${isSow ? 'Contour Tights' : 'Tank Tops'}</h3>
            <p class="text-[11px] text-zinc-400 font-medium truncate w-full text-center mt-0.5">${isSow ? '10 Items' : '12 Items'}</p>
          </div>
        </a>

        <!-- Category 3 -->
        <a href="#collection" class="group relative rounded-xl sm:rounded-2xl bg-white p-3 pb-4 sm:p-4 sm:pb-5 shadow-xs hover:shadow-md transition-all flex flex-col items-center border border-zinc-200/80">
          <div class="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 mb-2">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQEiogc_cPXim5UCGnhYNjkqhNBolHTUYVLmqhnzr9avfYJ3iL_FxP5Ms6egN1z6_30qHnq1THf0gkHHYr4apPcM0A0i6Za-NpBQlrl6THFESDuh0cwSL-TFQ8yhT03GNn129FPbbTTjblL7Td3hyUSQd0l7a6iquHpLS_cJ81XPtoOcbfO17xZxFBhAjnP4-vaB3dtZDRi8lytMq4pOCSwyvG41cKE6fHzltWvQ" alt="${isSow ? 'Biker Shorts' : 'Shorts'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-lg sm:rounded-xl" />
          </div>
          <div class="w-full pt-1.5 flex flex-col items-center justify-center text-center min-w-0">
            <h3 class="font-headline text-xs sm:text-sm text-zinc-900 uppercase font-bold tracking-wide truncate w-full text-center">${isSow ? 'Biker Shorts' : 'Shorts'}</h3>
            <p class="text-[11px] text-zinc-400 font-medium truncate w-full text-center mt-0.5">${isSow ? '18 Items' : '18 Items'}</p>
          </div>
        </a>

        <!-- Category 4 -->
        <a href="#collection" class="group relative rounded-xl sm:rounded-2xl bg-white p-3 pb-4 sm:p-4 sm:pb-5 shadow-xs hover:shadow-md transition-all flex flex-col items-center border border-zinc-200/80">
          <div class="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 mb-2">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQEsW48g189o2HUpuW4bFaJfaUBgKBVtO_OU2E2bAnL3yp0UngrE1oIWVJ1yPQ2P1bop8H5Y8cG8KxRVAC6oX4H52nf0pDhKf2Y5sJvekTMYg237GbPCjj4GlRHLMzgoa0-2RscYX7onBeEc4Ijz5jTQAQS_vad33JlCG9u4Y2BA7c7uFJFhcSQBo6kLHg6sjIQKx_ORBdCq-Fx4OsagH26f8nNj45yBC2rSlMsA" alt="${isSow ? 'Ribbed Tops' : 'Joggers'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-lg sm:rounded-xl" />
          </div>
          <div class="w-full pt-1.5 flex flex-col items-center justify-center text-center min-w-0">
            <h3 class="font-headline text-xs sm:text-sm text-zinc-900 uppercase font-bold tracking-wide truncate w-full text-center">${isSow ? 'Ribbed Tops' : 'Joggers'}</h3>
            <p class="text-[11px] text-zinc-400 font-medium truncate w-full text-center mt-0.5">${isSow ? '14 Items' : '14 Items'}</p>
          </div>
        </a>
      </div>
    </section>

    <!-- Engineered Drops -->
    <section class="w-full max-w-[1360px] mx-auto px-4 md:px-gutter-desktop mb-8 md:mb-space-2xl" id="core-drops-section">
      <div class="flex items-end justify-between mb-3 md:mb-space-lg">
        <div>
          <div class="flex items-center gap-1.5 text-zinc-400 mb-0.5">
            <span class="text-[10px] md:text-xs uppercase tracking-wider font-bold font-headline">
              ${isSow ? 'SOW CORE PIECES' : 'BEAR CORE COLLECTION'}
            </span>
            <span>•</span>
            <span class="text-[10px] md:text-xs text-green-700 uppercase font-bold font-headline">IN STOCK</span>
          </div>
          <h2 class="font-headline text-lg md:text-2xl text-zinc-950 uppercase font-bold tracking-tight">
            ${isSow ? 'SOW Engineered Drops' : 'Engineered Drops'}
          </h2>
        </div>
        <a href="#collection" class="text-xs font-bold text-zinc-700 hover:text-black uppercase font-headline">
          View All <span class="material-symbols-outlined text-[14px]">chevron_right</span>
        </a>
      </div>

      <!-- Core Drops Products Grid with initial Loading Skeletons -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4" id="home-primary-grid">
        ${[1, 2, 3, 4]
          .map(
            () => `
          <div class="animate-pulse bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-zinc-200/80 flex flex-col">
            <div class="w-full aspect-[4/5] bg-zinc-100 rounded-lg sm:rounded-xl mb-3"></div>
            <div class="h-3 bg-zinc-100 rounded w-2/3 mb-2"></div>
            <div class="h-3 bg-zinc-100 rounded w-1/3 mb-4"></div>
            <div class="h-6 bg-zinc-100 rounded-full w-full mt-auto"></div>
          </div>
        `
          )
          .join('')}
      </div>
    </section>

    <!-- Technical Value Props -->
    <section class="w-full max-w-[1360px] mx-auto px-4 md:px-gutter-desktop mb-8 md:mb-space-2xl">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-gutter-desktop">
        <div class="p-4 md:p-space-lg rounded-xl bg-white shadow-xs flex items-start gap-3 border border-zinc-200/80">
          <div class="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-black flex-shrink-0">
            <span class="material-symbols-outlined text-[20px]">local_shipping</span>
          </div>
          <div>
            <h3 class="font-headline text-xs sm:text-sm text-zinc-900 uppercase font-bold mb-0.5">Complimentary Shipping</h3>
            <p class="text-xs text-zinc-500 leading-relaxed">
              Zero delivery charges nationwide across India. Dispatched securely.
            </p>
          </div>
        </div>

        <div class="p-4 md:p-space-lg rounded-xl bg-white shadow-xs flex items-start gap-3 border border-zinc-200/80">
          <div class="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-black flex-shrink-0">
            <span class="material-symbols-outlined text-[20px]">chat</span>
          </div>
          <div>
            <h3 class="font-headline text-xs sm:text-sm text-zinc-900 uppercase font-bold mb-0.5">1-Tap WhatsApp Checkout</h3>
            <p class="text-xs text-zinc-500 leading-relaxed">
              Instant order requests, direct verification, and live dispatch updates on WhatsApp.
            </p>
          </div>
        </div>

        <div class="p-4 md:p-space-lg rounded-xl bg-white shadow-xs flex items-start gap-3 border border-zinc-200/80">
          <div class="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-black flex-shrink-0">
            <span class="material-symbols-outlined text-[20px]">published_with_changes</span>
          </div>
          <div>
            <h3 class="font-headline text-xs sm:text-sm text-zinc-900 uppercase font-bold mb-0.5">Doorstep Exchange Support</h3>
            <p class="text-xs text-zinc-500 leading-relaxed">
              Seamless 7-day doorstep size swaps coordinated directly via WhatsApp support.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Recently Viewed Section (Item 4) -->
    <section class="w-full max-w-[1360px] mx-auto px-4 md:px-gutter-desktop mb-12 md:mb-space-2xl hidden" id="home-recent-section">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-headline mb-0.5">CONTINUE BROWSING</p>
          <h2 class="font-headline text-2xl font-extrabold uppercase text-zinc-950 tracking-tight">Recently Viewed</h2>
        </div>
        <a href="#collection" class="text-xs font-bold uppercase tracking-wider text-black underline font-headline hover:text-zinc-600">Browse All</a>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" id="home-recent-grid"></div>
    </section>

    <!-- Priority Release Newsletter -->
    <section class="w-full max-w-[1360px] mx-auto px-4 md:px-gutter-desktop mb-12 md:mb-space-2xl">
      <div class="w-full bg-white p-5 md:p-space-xl rounded-xl shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4 border border-zinc-200/80">
        <div class="space-y-1 text-center lg:text-left">
          <h3 class="font-headline text-base md:text-xl text-zinc-950 uppercase font-bold">Gain Priority Drop Access</h3>
          <p class="text-xs text-zinc-500">Limited batch drops sell out quickly. Receive priority release notifications.</p>
        </div>
        <div class="w-full lg:w-auto flex-1 max-w-md">
          <form class="flex items-center bg-zinc-100 p-1 rounded-full shadow-inner border border-zinc-200" id="newsletter-form">
            <input class="flex-1 bg-transparent px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none" placeholder="Enter your 10-digit WhatsApp number" required type="tel" inputmode="numeric" pattern="[0-9]{10}" />
            <button class="px-4 py-1.5 rounded-full ${isSow ? 'bg-[#80534C]' : 'bg-black'} text-white text-[11px] uppercase font-bold font-headline transition-opacity hover:opacity-90" type="submit">
              SUBSCRIBE
            </button>
          </form>
          <p class="text-xs text-green-700 mt-2 text-center lg:text-left hidden" id="newsletter-success">✓ You are registered for priority release access.</p>
        </div>
      </div>
    </section>
  `;

  container.innerHTML = '';
  container.appendChild(page);

  // Await product fetching and cleanly replace skeletons
  const activeProducts = await getProducts(currentMode);
  const primaryGrid = page.querySelector('#home-primary-grid');

  if (primaryGrid) {
    primaryGrid.innerHTML = '';
    activeProducts.slice(0, 8).forEach((p) => {
      primaryGrid.appendChild(createProductCard(p));
    });
  }

  // Populate Recently Viewed Products (Item 4)
  const recentSection = page.querySelector('#home-recent-section');
  const recentGrid = page.querySelector('#home-recent-grid');
  const recentIds = getRecentlyViewedIds();

  if (recentSection && recentGrid && recentIds.length > 0) {
    const recentProducts = products.filter((p) => recentIds.includes(p.id)).slice(0, 4);
    if (recentProducts.length > 0) {
      recentSection.classList.remove('hidden');
      recentProducts.forEach((p) => {
        recentGrid.appendChild(createProductCard(p));
      });
    }
  }

  // Newsletter submission
  const nlForm = page.querySelector('#newsletter-form');
  const nlSuccess = page.querySelector('#newsletter-success');
  nlForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    nlForm.style.display = 'none';
    nlSuccess?.classList.remove('hidden');
  });
}

export default { render };
