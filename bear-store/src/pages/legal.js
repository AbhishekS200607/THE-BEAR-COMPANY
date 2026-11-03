/**
 * Legal Policies Page (Privacy Policy, Terms of Service, Refund Policy)
 */
export function render(container, activeTab = 'privacy') {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[860px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  let currentTab = activeTab || 'privacy';

  function renderContent() {
    const contentRoot = page.querySelector('#legal-content-root');
    const tabPrivacy = page.querySelector('#tab-privacy');
    const tabTerms = page.querySelector('#tab-terms');
    const tabRefund = page.querySelector('#tab-refund');

    // Update Tab Styles
    [tabPrivacy, tabTerms, tabRefund].forEach(btn => {
      if (btn.dataset.tab === currentTab) {
        btn.className = 'px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-xs transition-colors cursor-pointer';
      } else {
        btn.className = 'px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-zinc-100 text-zinc-600 hover:text-black transition-colors cursor-pointer';
      }
    });

    if (currentTab === 'privacy') {
      contentRoot.innerHTML = `
        <h2 class="font-headline text-lg sm:text-xl font-bold uppercase tracking-tight text-zinc-950 mb-4 pb-2 border-b border-zinc-100">
          Privacy Policy (DPDP Act Compliance)
        </h2>
        <div class="space-y-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
          <p><strong>Effective Date:</strong> January 1, 2026 | Last Updated: November 2026</p>
          <p>
            BEAR Performance Wear Pvt. Ltd. ("BEAR", "we", "us") values your privacy and is dedicated to securing your personal identifiable information in strict compliance with the Digital Personal Data Protection Act (DPDPA 2023) of India.
          </p>
          <h3 class="font-headline text-sm font-bold uppercase text-zinc-900 pt-2">1. Data We Collect</h3>
          <p>
            When you interact with the BEAR platform, place drops in your bag, or checkout, we collect only necessary data: your name, shipping address, 10-digit mobile number, WhatsApp handle, email address, and IP address for courier fraud detection.
          </p>
          <h3 class="font-headline text-sm font-bold uppercase text-zinc-900 pt-2">2. Payment Security</h3>
          <p>
            We do not store your complete credit/debit card numbers, UPI PINs, or CVVs on our servers. All monetary transactions are processed through RBI-licensed PCI-DSS Level 1 compliant payment gateways (Razorpay / Cashfree) with end-to-end 256-bit encryption.
          </p>
          <h3 class="font-headline text-sm font-bold uppercase text-zinc-900 pt-2">3. WhatsApp Communications</h3>
          <p>
            By opting into order tracking or drop alerts, you authorize BEAR to send automated transaction updates and courier delivery alerts to your registered mobile number via WhatsApp Business API. You may opt out anytime by replying "STOP".
          </p>
        </div>
      `;
    } else if (currentTab === 'terms') {
      contentRoot.innerHTML = `
        <h2 class="font-headline text-lg sm:text-xl font-bold uppercase tracking-tight text-zinc-950 mb-4 pb-2 border-b border-zinc-100">
          Terms of Service &amp; Conditions
        </h2>
        <div class="space-y-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
          <p><strong>Entity:</strong> BEAR Performance Wear Pvt Ltd (Bengaluru, Karnataka, India)</p>
          <p>
            By visiting our website and purchasing products from BEAR or SOW, you engage in our "Service" and agree to be bound by the following terms and conditions.
          </p>
          <h3 class="font-headline text-sm font-bold uppercase text-zinc-900 pt-2">1. Drop Availability &amp; Pricing</h3>
          <p>
            All products are limited batch releases. We reserve the right to limit quantities purchased per customer or household. All prices listed on our platform are in Indian Rupees (INR) and are fully inclusive of all applicable Goods &amp; Services Taxes (GST).
          </p>
          <h3 class="font-headline text-sm font-bold uppercase text-zinc-900 pt-2">2. Cash on Delivery (COD) Contract</h3>
          <p>
            When choosing Cash on Delivery, you enter into a binding agreement to accept and pay the courier upon delivery. Fraudulent refusal of confirmed COD shipments may result in restriction of COD privileges for your delivery address and phone number across our logistics network.
          </p>
          <h3 class="font-headline text-sm font-bold uppercase text-zinc-900 pt-2">3. Intellectual Property</h3>
          <p>
            All trademarks, logos, typography, editorial photography, and silhouette patterns displayed on this platform are the exclusive intellectual property of BEAR Performance Wear Pvt Ltd.
          </p>
        </div>
      `;
    } else {
      contentRoot.innerHTML = `
        <h2 class="font-headline text-lg sm:text-xl font-bold uppercase tracking-tight text-zinc-950 mb-4 pb-2 border-b border-zinc-100">
          Refund &amp; Doorstep Exchange Policy
        </h2>
        <div class="space-y-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
          <p>
            We take pride in our precision engineering. If your apparel does not meet your expectations, our 7-day doorstep exchange and return policy protects every order.
          </p>
          <h3 class="font-headline text-sm font-bold uppercase text-zinc-900 pt-2">1. 7-Day Window</h3>
          <p>
            You have 7 full calendar days from the date of confirmed delivery to initiate a doorstep size swap or return via our #returns portal or WhatsApp Concierge.
          </p>
          <h3 class="font-headline text-sm font-bold uppercase text-zinc-900 pt-2">2. Refund Timeline</h3>
          <p>
            Prepaid orders: Full refund credited back to your original source (Bank / UPI / Card) within 24–48 hours of return inspection.<br/>
            COD orders: Refund sent instantly via automated UPI payment link or bank NEFT upon doorstep pickup.
          </p>
        </div>
      `;
    }
  }

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-10">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">LEGAL COMPLIANCE</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">Trust &amp; Governance</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Transparent, encrypted, and legally compliant standards for every transaction.</p>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap items-center justify-center gap-2 mb-8">
      <button id="tab-privacy" data-tab="privacy" class="px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-xs transition-colors cursor-pointer">
        Privacy Policy
      </button>
      <button id="tab-terms" data-tab="terms" class="px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-zinc-100 text-zinc-600 hover:text-black transition-colors cursor-pointer">
        Terms of Service
      </button>
      <button id="tab-refund" data-tab="refund" class="px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-zinc-100 text-zinc-600 hover:text-black transition-colors cursor-pointer">
        Refund &amp; Exchange
      </button>
    </div>

    <!-- Content Panel -->
    <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-6 sm:p-10 shadow-xs" id="legal-content-root">
    </div>
  `;

  page.querySelectorAll('#tab-privacy, #tab-terms, #tab-refund').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      renderContent();
    });
  });

  renderContent();

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

