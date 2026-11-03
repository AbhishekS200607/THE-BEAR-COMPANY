/**
 * Ergonomic Size & Fit Guide
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[960px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  let currentMode = 'bear';
  let unit = 'cm'; // 'cm' or 'in'

  const sizeData = {
    bear: [
      { size: 'S', chestCm: '96 - 101', chestIn: '38 - 40', lengthCm: '72', lengthIn: '28.3', shoulderCm: '48', shoulderIn: '18.9' },
      { size: 'M', chestCm: '101 - 106', chestIn: '40 - 42', lengthCm: '74', lengthIn: '29.1', shoulderCm: '50', shoulderIn: '19.7' },
      { size: 'L', chestCm: '106 - 112', chestIn: '42 - 44', lengthCm: '76', lengthIn: '29.9', shoulderCm: '52', shoulderIn: '20.5' },
      { size: 'XL', chestCm: '112 - 118', chestIn: '44 - 46', lengthCm: '78', lengthIn: '30.7', shoulderCm: '54', shoulderIn: '21.3' },
      { size: 'XXL', chestCm: '118 - 124', chestIn: '46 - 49', lengthCm: '80', lengthIn: '31.5', shoulderCm: '56', shoulderIn: '22.0' },
    ],
    sow: [
      { size: 'XS', bustCm: '78 - 83', bustIn: '31 - 33', waistCm: '60 - 65', waistIn: '24 - 26', hipCm: '86 - 91', hipIn: '34 - 36' },
      { size: 'S', bustCm: '83 - 88', bustIn: '33 - 35', waistCm: '65 - 70', waistIn: '26 - 28', hipCm: '91 - 96', hipIn: '36 - 38' },
      { size: 'M', bustCm: '88 - 93', bustIn: '35 - 37', waistCm: '70 - 75', waistIn: '28 - 30', hipCm: '96 - 101', hipIn: '38 - 40' },
      { size: 'L', bustCm: '93 - 99', bustIn: '37 - 39', waistCm: '75 - 81', waistIn: '30 - 32', hipCm: '101 - 107', hipIn: '40 - 42' },
      { size: 'XL', bustCm: '99 - 105', bustIn: '39 - 41', waistCm: '81 - 87', waistIn: '32 - 34', hipCm: '107 - 113', hipIn: '42 - 44' },
    ]
  };

  function updateTable() {
    const tbody = page.querySelector('#size-table-body');
    const thead = page.querySelector('#size-table-head');
    if (!tbody || !thead) return;

    if (currentMode === 'bear') {
      thead.innerHTML = `
        <tr class="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase font-headline text-zinc-500">
          <th class="py-3 px-4 text-left">Size</th>
          <th class="py-3 px-4 text-left">Chest (${unit.toUpperCase()})</th>
          <th class="py-3 px-4 text-left">Length (${unit.toUpperCase()})</th>
          <th class="py-3 px-4 text-left">Shoulder Width (${unit.toUpperCase()})</th>
        </tr>
      `;
      tbody.innerHTML = sizeData.bear.map(row => `
        <tr class="border-b border-zinc-100 hover:bg-zinc-50/50 text-xs">
          <td class="py-3 px-4 font-bold font-headline text-zinc-950">${row.size}</td>
          <td class="py-3 px-4 font-mono text-zinc-700">${unit === 'cm' ? row.chestCm : row.chestIn}</td>
          <td class="py-3 px-4 font-mono text-zinc-700">${unit === 'cm' ? row.lengthCm : row.lengthIn}</td>
          <td class="py-3 px-4 font-mono text-zinc-700">${unit === 'cm' ? row.shoulderCm : row.shoulderIn}</td>
        </tr>
      `).join('');
    } else {
      thead.innerHTML = `
        <tr class="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase font-headline text-zinc-500">
          <th class="py-3 px-4 text-left">Size</th>
          <th class="py-3 px-4 text-left">Bust (${unit.toUpperCase()})</th>
          <th class="py-3 px-4 text-left">Waist (${unit.toUpperCase()})</th>
          <th class="py-3 px-4 text-left">Hip (${unit.toUpperCase()})</th>
        </tr>
      `;
      tbody.innerHTML = sizeData.sow.map(row => `
        <tr class="border-b border-zinc-100 hover:bg-zinc-50/50 text-xs">
          <td class="py-3 px-4 font-bold font-headline text-zinc-950">${row.size}</td>
          <td class="py-3 px-4 font-mono text-zinc-700">${unit === 'cm' ? row.bustCm : row.bustIn}</td>
          <td class="py-3 px-4 font-mono text-zinc-700">${unit === 'cm' ? row.waistCm : row.waistIn}</td>
          <td class="py-3 px-4 font-mono text-zinc-700">${unit === 'cm' ? row.hipCm : row.hipIn}</td>
        </tr>
      `).join('');
    }
  }

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-10">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">PRECISION TAILORING</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">Ergonomic Size Guide</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Engineered silhouettes designed to accommodate athletic deltoids and athletic posture.</p>
    </div>

    <!-- Controls: BEAR vs SOW, CM vs INCHES -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100">
      <!-- Mode Toggle -->
      <div class="inline-flex p-1 bg-zinc-100 rounded-full border border-zinc-200">
        <button id="guide-mode-bear" class="px-5 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-2xs transition-all cursor-pointer">
          BEAR (Men's)
        </button>
        <button id="guide-mode-sow" class="px-5 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider text-zinc-600 hover:text-black transition-all cursor-pointer">
          SOW (Women's)
        </button>
      </div>

      <!-- Unit Toggle -->
      <div class="inline-flex p-1 bg-zinc-100 rounded-full border border-zinc-200">
        <button id="unit-cm" class="px-4 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-2xs transition-all cursor-pointer">
          CM
        </button>
        <button id="unit-in" class="px-4 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider text-zinc-600 hover:text-black transition-all cursor-pointer">
          INCHES
        </button>
      </div>
    </div>

    <!-- Size Table Container -->
    <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm overflow-x-auto shadow-xs mb-10">
      <table class="w-full text-left border-collapse">
        <thead id="size-table-head"></thead>
        <tbody id="size-table-body"></tbody>
      </table>
    </div>

    <!-- How to Measure Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <p class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1">1. Chest / Bust</p>
        <p class="text-xs text-zinc-500 leading-relaxed">Wrap measuring tape around the fullest part of your chest, keeping the tape level and relaxed under armpits.</p>
      </div>
      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <p class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1">2. Waist</p>
        <p class="text-xs text-zinc-500 leading-relaxed">Measure around your natural waistline, typically located roughly 2 inches above your navel.</p>
      </div>
      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <p class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1">3. Hip / Seat</p>
        <p class="text-xs text-zinc-500 leading-relaxed">Stand with feet together and measure around the widest portion of your glutes and upper thighs.</p>
      </div>
    </div>
  `;

  const btnBear = page.querySelector('#guide-mode-bear');
  const btnSow = page.querySelector('#guide-mode-sow');
  const btnCm = page.querySelector('#unit-cm');
  const btnIn = page.querySelector('#unit-in');

  btnBear?.addEventListener('click', () => {
    currentMode = 'bear';
    btnBear.className = 'px-5 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-2xs transition-all cursor-pointer';
    btnSow.className = 'px-5 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider text-zinc-600 hover:text-black transition-all cursor-pointer';
    updateTable();
  });

  btnSow?.addEventListener('click', () => {
    currentMode = 'sow';
    btnSow.className = 'px-5 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-[#80534C] text-white shadow-2xs transition-all cursor-pointer';
    btnBear.className = 'px-5 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider text-zinc-600 hover:text-black transition-all cursor-pointer';
    updateTable();
  });

  btnCm?.addEventListener('click', () => {
    unit = 'cm';
    btnCm.className = 'px-4 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-2xs transition-all cursor-pointer';
    btnIn.className = 'px-4 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider text-zinc-600 hover:text-black transition-all cursor-pointer';
    updateTable();
  });

  btnIn?.addEventListener('click', () => {
    unit = 'in';
    btnIn.className = 'px-4 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-2xs transition-all cursor-pointer';
    btnCm.className = 'px-4 py-1.5 rounded-full text-xs font-bold font-headline uppercase tracking-wider text-zinc-600 hover:text-black transition-all cursor-pointer';
    updateTable();
  });

  updateTable();

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

