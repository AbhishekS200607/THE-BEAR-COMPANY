/**
 * Shipping & Transit Logistics Policy Page
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-10 md:mb-12">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">PAN-INDIA FULFILLMENT</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">Shipping &amp; Transit</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Precision logistics powered by dedicated BlueDart and Delhivery Air Express channels.</p>
    </div>

    <!-- 4 Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 mb-10">
      <div class="p-4 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-2xl font-bold font-headline text-zinc-950">24H</span>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1 font-headline">Same-Day Dispatch</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">Orders placed before 2 PM IST</p>
      </div>

      <div class="p-4 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-2xl font-bold font-headline text-zinc-950">19K+</span>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1 font-headline">PIN Codes</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">Comprehensive India coverage</p>
      </div>

      <div class="p-4 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-2xl font-bold font-headline text-zinc-950">₹0</span>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1 font-headline">Free Shipping</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">On all orders above ₹999</p>
      </div>

      <div class="p-4 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-2xl font-bold font-headline text-zinc-950">Air</span>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1 font-headline">Express Transit</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">BlueDart &amp; Delhivery Priority</p>
      </div>
    </div>

    <!-- Delivery Timeframes Table -->
    <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5 sm:p-8 shadow-xs mb-10">
      <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-2 border-b border-zinc-100">Estimated Transit Times</h2>
      <div class="divide-y divide-zinc-100 text-xs sm:text-sm">
        <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <p class="font-bold font-headline text-zinc-900">Tier 1 Metro Gateways</p>
            <p class="text-[11px] text-zinc-500">Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Kolkata</p>
          </div>
          <span class="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded w-fit font-mono">24 – 48 Hours</span>
        </div>

        <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <p class="font-bold font-headline text-zinc-900">Tier 2 State Capitals &amp; Hubs</p>
            <p class="text-[11px] text-zinc-500">Pune, Ahmedabad, Jaipur, Lucknow, Chandigarh, Kochi</p>
          </div>
          <span class="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded w-fit font-mono">2 – 3 Days</span>
        </div>

        <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <p class="font-bold font-headline text-zinc-900">Rest of India &amp; Regional Hubs</p>
            <p class="text-[11px] text-zinc-500">All other serviceable postal PIN codes across India</p>
          </div>
          <span class="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded w-fit font-mono">3 – 5 Days</span>
        </div>
      </div>
    </div>

    <!-- Logistics FAQs -->
    <div class="bg-zinc-50 border border-zinc-200 rounded-none sm:rounded-sm p-6 text-xs text-zinc-600 space-y-3 leading-relaxed">
      <h3 class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-900">Important Shipping Details</h3>
      <p>• <strong>Same-Day Dispatch Cutoff:</strong> All orders confirmed prior to 2:00 PM IST Monday through Saturday are packed and handed over to air cargo carriers the exact same day.</p>
      <p>• <strong>Tamper-Proof Packaging:</strong> Every BEAR drop is enclosed in double-sealed waterproof poly mailers with tamper indicator strips.</p>
      <p>• <strong>Delivery Rescheduling:</strong> Receive an interactive WhatsApp notification from BlueDart/Delhivery on delivery morning to update delivery slot or instruct security drop.</p>
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

