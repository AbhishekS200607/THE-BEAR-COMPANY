/**
 * BEAR Athlete Club & Ambassador Page
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-12">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">RELENTLESS DISCIPLINE</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">BEAR Athlete Club</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">A high-performance coalition of strength athletes, Hyrox racers, combat fighters, and trainers.</p>
    </div>

    <!-- Ambassador Perks -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
      <div class="p-6 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-xl font-bold font-headline text-zinc-950 block mb-2">01. Drop Allocation</span>
        <p class="text-xs text-zinc-600 leading-relaxed">Complimentary piece allocations from every seasonal engineered drop before general public release.</p>
      </div>

      <div class="p-6 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-xl font-bold font-headline text-zinc-950 block mb-2">02. Prototype Testing</span>
        <p class="text-xs text-zinc-600 leading-relaxed">Direct input into our Bengaluru design lab. Wear-test alpha samples in high-intensity training environments.</p>
      </div>

      <div class="p-6 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <span class="text-xl font-bold font-headline text-zinc-950 block mb-2">03. Performance Bonus</span>
        <p class="text-xs text-zinc-600 leading-relaxed">Personalized 15% discount code for your audience with monthly performance payouts and podium bonuses.</p>
      </div>
    </div>

    <!-- Application Form -->
    <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-6 sm:p-8 shadow-xs mb-10">
      <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950 mb-2">Apply for Athlete Sponsorship</h2>
      <p class="text-xs text-zinc-500 mb-6">We prioritize discipline, work ethic, and coaching commitment over mere follower counts.</p>

      <form id="athlete-form" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Full Legal Name</label>
            <input type="text" id="ath-name" placeholder="e.g. Vikram Malhotra" required class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Instagram / YouTube Handle</label>
            <input type="text" id="ath-handle" placeholder="@yourhandle" required class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Primary Sport / Discipline</label>
            <select id="ath-sport" class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black bg-white">
              <option value="powerlifting">Powerlifting / Strength</option>
              <option value="bodybuilding">Bodybuilding / Hypertrophy</option>
              <option value="crossfit">CrossFit / Hyrox Functional Racing</option>
              <option value="combat">MMA / Combat Sports / Boxing</option>
              <option value="running">Marathon / Trail Running</option>
              <option value="coach">Strength &amp; Conditioning Coach</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Primary City of Training</label>
            <input type="text" id="ath-city" placeholder="e.g. Mumbai, Bengaluru, Delhi" required class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black" />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Tell us about your weekly discipline &amp; personal records</label>
          <textarea id="ath-bio" rows="3" placeholder="Briefly detail your training schedule, competitive background, or coaching roster..." required class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black"></textarea>
        </div>

        <button type="submit" class="w-full py-3 bg-black text-white rounded-full font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer mt-2">
          Submit Athlete Dossier
        </button>
      </form>

      <div id="athlete-success" class="mt-4 p-4 rounded-none sm:rounded-sm bg-green-50 border border-green-200 hidden">
        <p class="font-headline text-xs font-bold text-green-900 uppercase">Application Received!</p>
        <p class="text-xs text-green-800 mt-1">Our sports marketing team reviews new profiles every Tuesday. If your discipline aligns with our roster, we will reach out via WhatsApp.</p>
      </div>
    </div>
  `;

  const form = page.querySelector('#athlete-form');
  const success = page.querySelector('#athlete-success');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    form.style.display = 'none';
    success?.classList.remove('hidden');
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

