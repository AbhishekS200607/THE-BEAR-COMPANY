/**
 * Frequently Asked Questions Page
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  const faqData = [
    {
      category: 'Shipping & Delivery',
      questions: [
        {
          q: 'How fast is BEAR air express shipping?',
          a: 'All orders are dispatched within 24 hours from our fulfillment hub in Bengaluru. Metro cities (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai) receive delivery within 24-48 hours. Other regions take 2-4 business days across 19,000+ PIN codes.'
        },
        {
          q: 'Do you charge for shipping?',
          a: 'Standard prepaid and COD delivery is 100% FREE on all orders above ₹999 across India. For orders below ₹999, a nominal flat express transit fee of ₹99 applies.'
        },
        {
          q: 'Can I track my order in real-time?',
          a: 'Yes. As soon as your drop is dispatched, you will receive an SMS and WhatsApp tracking link with live BlueDart / Delhivery status updates. You can also track anytime on our #track-order page.'
        }
      ]
    },
    {
      category: 'Swaps & Exchanges',
      questions: [
        {
          q: 'How does the 7-Day Doorstep Swap work?',
          a: 'If a size does not fit you like a second skin, we provide an effortless doorstep pickup within 48 hours and dispatch your replacement size immediately with zero shipping charges.'
        },
        {
          q: 'What condition should items be in?',
          a: 'Items must be unworn, unwashed, and have the original BEAR or SOW product tags attached. Footwear and compression base layers must have hygiene strips intact.'
        },
        {
          q: 'How do I initiate a return or exchange?',
          a: 'Simply head to our #returns portal or send a message to our WhatsApp Concierge at +91 98765 43210 with your 4-digit order number.'
        }
      ]
    },
    {
      category: 'Fabrics & Performance',
      questions: [
        {
          q: 'What is 260 GSM Heavyweight Cotton?',
          a: 'Our signature BEAR tees are engineered from combed 260 GSM ultra-heavyweight cotton. It offers an architectural drape that never clings to perspiration, retains its structured silhouette through 100+ washes, and breathes naturally.'
        },
        {
          q: 'What is SOW Contour fabrication?',
          a: 'SOW luxury movement pieces use a bespoke 4-way micro-ribbed nylon/elastane blend (75/25 ratio) with zero-sheer squat-proof opacity and adaptive moisture-wicking capillary channels.'
        },
        {
          q: 'How should I wash BEAR and SOW pieces?',
          a: 'Machine wash cold (30°C or below) inside out with similar darks. Do not tumble dry. Line dry in shade to preserve yarn elasticity and print resilience.'
        }
      ]
    },
    {
      category: 'Payments & Security',
      questions: [
        {
          q: 'Which payment methods do you support?',
          a: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay, Amex), Net Banking across 50+ banks, and Cash on Delivery (COD).'
        },
        {
          q: 'Is Cash on Delivery available everywhere?',
          a: 'Yes, Cash on Delivery is available across 19,000+ PIN codes in India. We verify COD orders via automated WhatsApp OTP prior to dispatch.'
        }
      ]
    }
  ];

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-2xl mx-auto mb-10 md:mb-14">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">HELP &amp; CONCIERGE</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">Frequently Asked Questions</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Everything you need to know about BEAR performance drops, sizing, and logistics.</p>

      <!-- Search Input -->
      <div class="mt-6 max-w-md mx-auto">
        <div class="relative flex items-center">
          <span class="material-symbols-outlined absolute left-3.5 text-zinc-400 text-lg">search</span>
          <input type="text" id="faq-search-input" placeholder="Search questions (e.g. shipping, size, returns)..." class="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors" />
        </div>
      </div>
    </div>

    <!-- FAQ Accordion Section -->
    <div class="space-y-8" id="faq-groups-root">
      ${faqData.map((group, gIdx) => `
        <div class="faq-group bg-white border border-zinc-200 rounded-none sm:rounded-sm overflow-hidden p-5 sm:p-6 shadow-2xs">
          <h2 class="font-headline text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
            <span class="w-2 h-2 bg-black rounded-full inline-block"></span>
            <span>${group.category}</span>
          </h2>
          <div class="divide-y divide-zinc-100">
            ${group.questions.map((item, qIdx) => `
              <div class="faq-item py-3.5">
                <button class="faq-question-btn w-full flex items-center justify-between text-left font-semibold text-xs sm:text-sm text-zinc-900 hover:text-black gap-3 cursor-pointer" type="button" aria-expanded="false">
                  <span>${item.q}</span>
                  <span class="material-symbols-outlined text-[18px] text-zinc-400 transition-transform duration-200 faq-chevron shrink-0">expand_more</span>
                </button>
                <div class="faq-answer hidden text-xs sm:text-sm text-zinc-600 pt-2.5 leading-relaxed">
                  ${item.a}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Still need help card -->
    <div class="mt-12 p-6 rounded-none sm:rounded-sm bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <div>
        <h3 class="font-headline text-sm font-bold uppercase tracking-wide text-zinc-900">Still have questions?</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Our athletes &amp; concierge team are live on WhatsApp 7 days a week.</p>
      </div>
      <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-headline text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-xs">
        <span class="material-symbols-outlined text-[16px]">chat</span>
        <span>WhatsApp Concierge</span>
      </a>
    </div>
  `;

  // Accordion toggle handlers
  page.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const chevron = item.querySelector('.faq-chevron');
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        answer.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        answer.classList.remove('hidden');
        chevron.style.transform = 'rotate(180deg)';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Filter Search
  const searchInput = page.querySelector('#faq-search-input');
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    page.querySelectorAll('.faq-item').forEach(item => {
      const qText = item.querySelector('.faq-question-btn span').textContent.toLowerCase();
      const aText = item.querySelector('.faq-answer').textContent.toLowerCase();
      if (qText.includes(query) || aText.includes(query)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

