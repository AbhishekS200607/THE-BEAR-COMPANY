/**
 * Ethical Production Hub Page
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-12">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">RESPONSIBLE CRAFT</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">Ethical Production Hub</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Precision apparel created in clean, transparent, solar-powered Indian manufacturing facilities.</p>
    </div>

    <!-- Hero Stat Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-3xl font-extrabold font-headline text-zinc-950">100%</span>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-headline mt-1">Made In India</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">Tiruppur &amp; Bengaluru hubs</p>
      </div>

      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-3xl font-extrabold font-headline text-zinc-950">65%</span>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-headline mt-1">Solar Powered</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">Rooftop renewable energy</p>
      </div>

      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-3xl font-extrabold font-headline text-zinc-950">1.8x</span>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-headline mt-1">Fair Wages</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">Above statutory floor</p>
      </div>

      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-3xl font-extrabold font-headline text-zinc-950">Zero</span>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-headline mt-1">Toxic Dyes</p>
        <p class="text-[11px] text-zinc-500 mt-0.5">ZDHC Level 3 compliance</p>
      </div>
    </div>

    <!-- Facility Detailed Pillars -->
    <div class="space-y-6 mb-12">
      <div class="p-6 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <h3 class="font-headline text-base font-bold uppercase text-zinc-950 mb-2">Tiruppur Knitting &amp; Dyeing Hub</h3>
        <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          Located in Tamil Nadu's historic textile corridor, our knitting partner employs state-of-the-art circular knitting machinery powered by on-site wind and solar arrays. Effluent treatment plants recycle 98% of all process water through closed-loop reverse osmosis, discharging zero untreated chemical waste into surrounding soil.
        </p>
      </div>

      <div class="p-6 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <h3 class="font-headline text-base font-bold uppercase text-zinc-950 mb-2">Bengaluru Cut &amp; Stitch Atelier</h3>
        <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          Garment assembly occurs in our climate-controlled facility in Peenya, Bengaluru. Master patternmakers and sewing technicians receive comprehensive health insurance, paid maternal leave, ergonomic seating, and salaries 80% higher than the state minimum wage threshold.
        </p>
      </div>

      <div class="p-6 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <h3 class="font-headline text-base font-bold uppercase text-zinc-950 mb-2">Organic Cotton Sourcing Purity</h3>
        <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          We contract directly with farmer cooperatives across Gujarat and Maharashtra for raw long-staple cotton, bypassing multi-tiered middlemen. This guarantees pesticide-free fiber purity for your skin while delivering direct financial dividends to domestic farmers.
        </p>
      </div>
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

