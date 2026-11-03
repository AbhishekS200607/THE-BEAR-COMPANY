/**
 * Technical Textiles & Fabric Lab Page
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[960px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  const fabrics = [
    {
      name: '260 GSM Ultra-Combed Cotton',
      tag: 'BEAR SIGNATURE TEES',
      desc: 'Sourced from long-staple Indian organic cotton fields. Double-compacted to prevent fabric pilling, yielding a clean architectural fall with zero clinging when saturated.',
      specs: ['100% Combed Ringspun Cotton', '260 GSM Heavyweight Density', 'Bio-Washed & Silicon Softened', 'Pre-Shrunk to < 1.5% Tolerance']
    },
    {
      name: 'SOW Contour 4-Way Ribbed Knit',
      tag: 'SOW LUXURY ACTIVEWEAR',
      desc: 'Bespoke interlock micro-rib knit engineered to provide graduated compression around the core, glutes, and thighs. Certified 100% squat-proof under direct floodlights.',
      specs: ['75% Micro-Nylon / 25% High-Tensile Elastane', '300 GSM Interlock Knit', 'Zero-Sheer Non-See-Through Opacity', 'Four-Direction Omnidirectional Stretch']
    },
    {
      name: 'Hydro-Wick Aerodynamic Poly-Blend',
      tag: 'PERFORMANCE COMPRESSION & TANKS',
      desc: 'Micro-capillary filaments draw sweat away from the epidermis to the outer textile layer for rapid air-evaporation, keeping body core temperature regulated during PR lifts.',
      specs: ['88% Hydro-Polyester / 12% Spandex', 'Silver-Ion Antimicrobial Infusion', 'Fast Evaporation Dry-Rate (3x cotton)', 'Ultra-Low 180 GSM Featherweight']
    },
    {
      name: 'Structured French Terry Fleece',
      tag: 'HEAVYWEIGHT JOGGERS & HOODIES',
      desc: 'Loopback interior knit engineered for thermal heat trapping without bulk. Breathable unbrushed terry eliminates excessive overheating in indoor gym environments.',
      specs: ['380 GSM Heavyweight Loopback', 'Reinforced Ribbed Cuffs & Waistband', 'YKK Metal-Tipped Natural Cordage', 'Heavy Metal Hardware Reinforcements']
    }
  ];

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-12">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">FABRIC LAB &amp; INNOVATION</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">Technical Textiles</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Every yarn is lab-tested for tensility, moisture vapor transmission, and wash durability.</p>
    </div>

    <!-- Fabrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      ${fabrics.map((f, idx) => `
        <div class="p-6 bg-white border border-zinc-200 rounded-none sm:rounded-sm flex flex-col justify-between shadow-2xs">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-headline">${f.tag}</span>
              <span class="font-mono text-xs font-bold text-zinc-300">0${idx + 1}</span>
            </div>
            <h3 class="font-headline text-base sm:text-lg font-bold uppercase text-zinc-950 mb-2">${f.name}</h3>
            <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">${f.desc}</p>
          </div>

          <div class="pt-4 border-t border-zinc-100 space-y-1.5">
            ${f.specs.map(spec => `
              <div class="flex items-center gap-2 text-xs text-zinc-700">
                <span class="w-1.5 h-1.5 rounded-full bg-zinc-950 shrink-0"></span>
                <span class="font-medium">${spec}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Lab Testing Standards Banner -->
    <div class="p-6 sm:p-8 bg-zinc-950 text-white rounded-none sm:rounded-sm">
      <h3 class="font-headline text-base font-bold uppercase tracking-wider mb-2">Lab Verification Protocol</h3>
      <p class="text-xs text-zinc-400 leading-relaxed max-w-2xl">
        Every batch run undergoes rigorous Martindale abrasion friction testing (exceeding 30,000 cycles), automated crocking colorfastness verification, and tensile stress testing before moving to garment assembly.
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800 text-left">
        <div>
          <span class="text-xl font-bold font-headline">Grade 4.5+</span>
          <p class="text-[10px] text-zinc-400 uppercase font-headline mt-0.5">Colorfastness Rating</p>
        </div>
        <div>
          <span class="text-xl font-bold font-headline">&lt; 1.5%</span>
          <p class="text-[10px] text-zinc-400 uppercase font-headline mt-0.5">Shrinkage Tolerance</p>
        </div>
        <div>
          <span class="text-xl font-bold font-headline">100+</span>
          <p class="text-[10px] text-zinc-400 uppercase font-headline mt-0.5">Machine Wash Durability</p>
        </div>
        <div>
          <span class="text-xl font-bold font-headline">0%</span>
          <p class="text-[10px] text-zinc-400 uppercase font-headline mt-0.5">Hazardous Chemical Dyes</p>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

