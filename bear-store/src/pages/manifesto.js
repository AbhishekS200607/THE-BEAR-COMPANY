/**
 * The Discipline Manifesto Page
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[840px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-12 md:mb-16">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">ETHOS &amp; PHILOSOPHY</p>
      <h1 class="font-headline text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-zinc-950">The Discipline Manifesto</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Performance wear stripped of excess. Engineered strictly for training, recovery, and daily focus.</p>
    </div>

    <!-- Editorial Quote Block -->
    <div class="p-8 sm:p-12 bg-zinc-950 text-white rounded-none sm:rounded-sm mb-12 shadow-md">
      <p class="font-headline text-lg sm:text-2xl font-bold uppercase tracking-tight leading-snug">
        "WE DO NOT DESIGN GEAR TO CAPTIVATE RUNWAYS. WE ASSEMBLE APPAREL AS ARCHITECTURAL ARMOUR FOR THOSE WHO FIND FREEDOM IN ROUTINE, SWEAT, AND DISCIPLINE."
      </p>
      <div class="flex items-center gap-2 mt-6 pt-6 border-t border-zinc-800">
        <span class="font-headline text-xs uppercase font-bold text-zinc-400 tracking-wider">BEAR DESIGN LAB • BENGALURU, INDIA</span>
      </div>
    </div>

    <!-- 4 Tenets of Discipline -->
    <div class="space-y-10 text-left">
      <article class="border-b border-zinc-100 pb-8">
        <span class="font-mono text-xs font-bold text-zinc-400">01 / ARCHITECTURAL WEIGHT</span>
        <h2 class="font-headline text-xl sm:text-2xl font-bold text-zinc-950 uppercase tracking-tight mt-1 mb-3">
          Fabric Density Dictates Dignity
        </h2>
        <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          Fast-fashion relies on lightweight 140 GSM poly-blends that deteriorate after three machine washes. We reject disposable textiles. Our minimum threshold is 260 GSM combed cotton and 240 GSM four-way nylon ribbing. Heavier yarns maintain structural form over deltoids and lats, resist clinging to moisture, and age gracefully.
        </p>
      </article>

      <article class="border-b border-zinc-100 pb-8">
        <span class="font-mono text-xs font-bold text-zinc-400">02 / ZERO COMPROMISE ANATOMY</span>
        <h2 class="font-headline text-xl sm:text-2xl font-bold text-zinc-950 uppercase tracking-tight mt-1 mb-3">
          Ergonomics Over Superficial Cut
        </h2>
        <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          Active human bodies move in arcs, hinges, and rotations. Every seam in a BEAR or SOW silhouette is mapped along natural fascia movement lines. Reinforced twin-needle flatlock seams sit flat against the skin to eliminate friction burns during compound lifts and 10k road miles.
        </p>
      </article>

      <article class="border-b border-zinc-100 pb-8">
        <span class="font-mono text-xs font-bold text-zinc-400">03 / DUAL-MODE COMMERCE</span>
        <h2 class="font-headline text-xl sm:text-2xl font-bold text-zinc-950 uppercase tracking-tight mt-1 mb-3">
          BEAR &amp; SOW: Two Forces, One Purpose
        </h2>
        <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          BEAR embodies uncompromising utilitarian athletic power. SOW delivers sculpted, warm-neutral kinetic movement for women who demand both sculptural silhouette and high-tensile resistance. Together, they represent the complete modern gymwear ecosystem.
        </p>
      </article>

      <article class="pb-4">
        <span class="font-mono text-xs font-bold text-zinc-400">04 / THE DOMESTIC PRIDE</span>
        <h2 class="font-headline text-xl sm:text-2xl font-bold text-zinc-950 uppercase tracking-tight mt-1 mb-3">
          Crafted in India, Built for the World
        </h2>
        <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          India holds some of the world's finest textile craft heritage. By partnering directly with solar-powered spinning and knitting facilities in Tiruppur and Bengaluru, we cut out multinational markups and invest that value back into world-class yarn purity and fair factory wages.
        </p>
      </article>
    </div>

    <!-- Call to action -->
    <div class="mt-12 p-6 bg-zinc-50 border border-zinc-200 rounded-none sm:rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <div>
        <h3 class="font-headline text-sm font-bold uppercase text-zinc-900">Experience the Engineering</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Explore our limited edition engineered drops.</p>
      </div>
      <a href="#collection" class="px-6 py-2.5 rounded-full bg-black text-white font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-xs">
        Browse Collection
      </a>
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

