/**
 * Careers & Culture Page
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  const roles = [
    {
      title: 'Senior Technical Apparel Designer',
      dept: 'Design Lab',
      location: 'Bengaluru, India (Onsite)',
      type: 'Full-Time',
      desc: 'Lead the architectural patterning of upcoming BEAR men\'s oversized series and SOW women\'s contour collections. Minimum 4 years experience in technical sportswear 3D CAD.'
    },
    {
      title: 'Performance Fabric Technologist',
      dept: 'R&D / Textile Engineering',
      location: 'Tiruppur / Bengaluru',
      type: 'Full-Time',
      desc: 'Oversee yarn spinning, circular knitting, and bio-wash formulations. Responsible for shrinkage tolerances, antimicrobial washes, and laboratory fabric stress verifications.'
    },
    {
      title: 'Fullstack / Frontend Engineer (Vite, JS, Fastify)',
      dept: 'Digital Commerce',
      location: 'Bengaluru or Remote (India)',
      type: 'Full-Time',
      desc: 'Build blazing-fast modern shopping experiences with zero bloat, mobile-first performance, headless architecture, and instant WhatsApp checkouts.'
    },
    {
      title: 'Athlete & Field Marketing Specialist',
      dept: 'Brand Growth',
      location: 'Bengaluru / Mumbai',
      type: 'Full-Time',
      desc: 'Liaise directly with high-performance coaches, CrossFit affiliates, Hyrox racers, and combat gyms across India. Manage seeding logistics and regional events.'
    }
  ];

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-12">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">JOIN THE SQUAD</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">Careers at BEAR</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Build India's definitive athletic performance apparel house. High agency, uncompromising craft.</p>
    </div>

    <!-- Culture Pillars -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <h3 class="font-headline text-xs sm:text-sm font-bold uppercase text-zinc-900 mb-1">Obsessive Standards</h3>
        <p class="text-xs text-zinc-500 leading-relaxed">We care intensely about millimetric seam tolerances, code latency, and prompt customer resolution.</p>
      </div>

      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <h3 class="font-headline text-xs sm:text-sm font-bold uppercase text-zinc-900 mb-1">Gym &amp; Gear Budget</h3>
        <p class="text-xs text-zinc-500 leading-relaxed">Every team member receives a comprehensive monthly gym stipend and unlimited BEAR &amp; SOW seasonal gear allocations.</p>
      </div>

      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <h3 class="font-headline text-xs sm:text-sm font-bold uppercase text-zinc-900 mb-1">Direct Ownership</h3>
        <p class="text-xs text-zinc-500 leading-relaxed">Flat hierarchy. Zero layers of approval bureaucracy. You build, test, and ship your own projects.</p>
      </div>
    </div>

    <!-- Open Positions -->
    <div class="space-y-4 mb-12">
      <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950 pb-2 border-b border-zinc-100">
        Current Open Roles (${roles.length})
      </h2>

      ${roles.map((r, idx) => `
        <div class="p-5 sm:p-6 bg-white border border-zinc-200 rounded-none sm:rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-black transition-colors">
          <div class="max-w-xl">
            <div class="flex flex-wrap items-center gap-2 mb-1.5">
              <span class="px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-800 text-[10px] font-bold uppercase font-headline">${r.dept}</span>
              <span class="text-[10px] text-zinc-400">•</span>
              <span class="text-[10px] text-zinc-500 font-mono">${r.location}</span>
              <span class="text-[10px] text-zinc-400">•</span>
              <span class="text-[10px] text-zinc-500">${r.type}</span>
            </div>
            <h3 class="font-headline text-sm sm:text-base font-bold uppercase text-zinc-950">${r.title}</h3>
            <p class="text-xs text-zinc-600 mt-1 leading-relaxed">${r.desc}</p>
          </div>
          <button class="apply-btn px-5 py-2.5 rounded-full bg-black text-white font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shrink-0 shadow-xs cursor-pointer" data-role="${r.title}">
            Apply Now
          </button>
        </div>
      `).join('')}
    </div>

    <!-- Quick Application Sheet -->
    <div id="job-apply-modal" class="hidden bg-white border border-zinc-200 rounded-none sm:rounded-sm p-6 sm:p-8 shadow-md mb-10">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
        <h3 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950" id="apply-modal-title">Job Application</h3>
        <button id="close-apply-modal" class="text-zinc-400 hover:text-black text-sm cursor-pointer">✕</button>
      </div>

      <form id="careers-form" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Full Name</label>
            <input type="text" required placeholder="Your name" class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Email Address</label>
            <input type="email" required placeholder="you@domain.com" class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Portfolio / LinkedIn / GitHub</label>
            <input type="url" required placeholder="https://..." class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Current City</label>
            <input type="text" required placeholder="e.g. Bengaluru, Mumbai" class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black" />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Why BEAR? (Tell us about something remarkable you built or designed)</label>
          <textarea rows="3" required placeholder="Write a short note on your craft or training discipline..." class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black"></textarea>
        </div>

        <button type="submit" class="w-full py-3 bg-black text-white rounded-full font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer">
          Submit Application Dossier
        </button>
      </form>

      <div id="careers-success" class="mt-4 p-4 rounded-none sm:rounded-sm bg-green-50 border border-green-200 hidden">
        <p class="font-headline text-xs font-bold text-green-900 uppercase">Application Received!</p>
        <p class="text-xs text-green-800 mt-1">Our hiring lead reviews all portfolios directly. We will be in touch within 3 business days.</p>
      </div>
    </div>
  `;

  const modal = page.querySelector('#job-apply-modal');
  const modalTitle = page.querySelector('#apply-modal-title');
  const closeModal = page.querySelector('#close-apply-modal');
  const cForm = page.querySelector('#careers-form');
  const cSuccess = page.querySelector('#careers-success');

  page.querySelectorAll('.apply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      modalTitle.textContent = `Apply for: ${role}`;
      modal.classList.remove('hidden');
      modal.scrollIntoView({ behavior: 'smooth' });
    });
  });

  closeModal?.addEventListener('click', () => modal.classList.add('hidden'));

  cForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    cForm.style.display = 'none';
    cSuccess?.classList.remove('hidden');
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

