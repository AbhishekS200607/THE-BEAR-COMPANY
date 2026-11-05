import { getMode } from '../state/store.js';
import { skeletonContentPage } from '../utils/skeletons.js';

export function render(container) {
  container.innerHTML = skeletonContentPage();
  const mode = getMode();
  const isSow = mode === 'sow';

  const page = document.createElement('div');
  page.className = 'w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  const accent      = isSow ? '#80534C' : '#09090b';
  const accentLight = isSow ? 'bg-[#FAF7F5] border-[#EFE7DF]' : 'bg-zinc-50 border-zinc-200';
  const accentBtn   = isSow ? 'bg-[#80534C] hover:bg-[#6b4540]' : 'bg-black hover:bg-zinc-800';
  const accentText  = isSow ? 'text-[#80534C]' : 'text-black';
  const accentBadge = isSow ? 'bg-[#FAF7F5] border-[#EFE7DF] text-[#80534C]' : 'bg-zinc-100 border-zinc-200 text-zinc-800';
  const dotColor    = isSow ? 'bg-[#80534C]' : 'bg-black';
  const focusBorder = isSow ? 'focus:border-[#80534C]' : 'focus:border-black';

  const channels = [
    {
      icon: 'chat',
      label: 'WhatsApp Concierge',
      value: '+91 98765 43210',
      sub: 'Fastest response · 7 days a week · 9 AM – 9 PM IST',
      href: 'https://wa.me/919876543210',
      cta: 'Open WhatsApp',
      external: true,
    },
    {
      icon: 'mail',
      label: 'Email Support',
      value: 'support@bearperformance.in',
      sub: 'Replies within 4 business hours',
      href: 'mailto:support@bearperformance.in',
      cta: 'Send Email',
      external: false,
    },
    {
      icon: 'location_on',
      label: 'Design & Fulfillment Hub',
      value: 'Peenya Industrial Area, Bengaluru — 560058',
      sub: 'Not open for walk-ins · Dispatch & design only',
      href: null,
      cta: null,
      external: false,
    },
  ];

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-12">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">GET IN TOUCH</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">
        Contact ${isSow ? 'SOW' : 'BEAR'}
      </h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">
        ${isSow
          ? 'Our SOW concierge team is here for sizing, styling, and order support.'
          : 'Our athlete support team handles orders, sizing, and everything in between.'}
      </p>
    </div>

    <!-- Contact Channels -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
      ${channels.map(ch => `
        <div class="p-5 sm:p-6 bg-white border border-zinc-200 rounded-none sm:rounded-sm flex flex-col gap-3">
          <div class="w-10 h-10 rounded-full ${accentLight} border flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px] ${accentText}">${ch.icon}</span>
          </div>
          <div class="flex-1">
            <p class="font-headline text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">${ch.label}</p>
            <p class="font-headline text-sm font-bold text-zinc-950 leading-snug">${ch.value}</p>
            <p class="text-[11px] text-zinc-500 mt-1 leading-relaxed">${ch.sub}</p>
          </div>
          ${ch.href ? `
            <a href="${ch.href}" ${ch.external ? 'target="_blank" rel="noopener noreferrer"' : ''} 
               class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full ${accentBtn} text-white font-headline text-[11px] font-bold uppercase tracking-wider transition-colors w-fit">
              <span>${ch.cta}</span>
              <span class="material-symbols-outlined text-[14px]">${ch.external ? 'open_in_new' : 'arrow_forward'}</span>
            </a>
          ` : ''}
        </div>
      `).join('')}
    </div>

    <!-- Contact Form -->
    <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-6 sm:p-8 shadow-xs mb-10">
      <div class="flex items-center gap-2 mb-1">
        <span class="w-2 h-2 rounded-full ${dotColor} inline-block"></span>
        <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950">Send Us a Message</h2>
      </div>
      <p class="text-xs text-zinc-500 mb-6 ml-4">We read every message. Expect a reply within 4 hours on business days.</p>

      <form id="contact-form" class="space-y-4" novalidate>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Full Name <span class="text-red-500">*</span></label>
            <input type="text" id="contact-name" required placeholder="e.g. Arjun Sharma"
              class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none ${focusBorder} transition-colors placeholder:text-zinc-400" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">WhatsApp / Phone <span class="text-red-500">*</span></label>
            <input type="tel" id="contact-phone" required placeholder="10-digit mobile number" inputmode="numeric" pattern="[0-9]{10}"
              class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none ${focusBorder} transition-colors placeholder:text-zinc-400 font-mono" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Email Address</label>
            <input type="email" id="contact-email" placeholder="you@email.com"
              class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none ${focusBorder} transition-colors placeholder:text-zinc-400 font-mono" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Order Number (if applicable)</label>
            <input type="text" id="contact-order" placeholder="e.g. BR-2024-4821"
              class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none ${focusBorder} transition-colors placeholder:text-zinc-400 font-mono" />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Subject <span class="text-red-500">*</span></label>
          <select id="contact-subject" required
            class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none ${focusBorder} transition-colors bg-white">
            <option value="">Select a topic…</option>
            <option value="order">Order Status / Tracking</option>
            <option value="exchange">Size Exchange / Return</option>
            <option value="sizing">Sizing & Fit Advice</option>
            <option value="product">Product Question</option>
            <option value="payment">Payment Issue</option>
            <option value="wholesale">Wholesale / Bulk Inquiry</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Message <span class="text-red-500">*</span></label>
          <textarea id="contact-message" rows="4" required placeholder="Describe your query in detail…"
            class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none ${focusBorder} transition-colors resize-none placeholder:text-zinc-400"></textarea>
        </div>

        <div id="contact-error" class="hidden text-xs text-red-600 font-medium">Please fill in all required fields.</div>

        <button type="submit" id="contact-submit"
          class="w-full py-3 rounded-full ${accentBtn} text-white font-headline text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2">
          <span>Send Message</span>
          <span class="material-symbols-outlined text-[16px]">send</span>
        </button>
      </form>

      <!-- Success State -->
      <div id="contact-success" class="hidden mt-4 p-5 rounded-none sm:rounded-sm ${accentLight} border">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-[22px] ${accentText} shrink-0">check_circle</span>
          <div>
            <p class="font-headline text-sm font-bold uppercase ${accentText}">Message Received!</p>
            <p class="text-xs text-zinc-600 mt-1 leading-relaxed">
              Our support team will respond to your WhatsApp or email within 4 business hours.
              For urgent order issues, ping us directly on WhatsApp for the fastest resolution.
            </p>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-[11px] font-bold uppercase tracking-wider transition-colors">
              <span class="material-symbols-outlined text-[14px]">chat</span>
              <span>WhatsApp Us Now</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Response Time Promise -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="p-4 ${accentLight} border rounded-none sm:rounded-sm text-center">
        <p class="font-headline text-lg font-extrabold text-zinc-950">&lt; 4H</p>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-headline mt-0.5">Email Response</p>
      </div>
      <div class="p-4 ${accentLight} border rounded-none sm:rounded-sm text-center">
        <p class="font-headline text-lg font-extrabold text-zinc-950">&lt; 30M</p>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-headline mt-0.5">WhatsApp Response</p>
      </div>
      <div class="p-4 ${accentLight} border rounded-none sm:rounded-sm text-center">
        <p class="font-headline text-lg font-extrabold text-zinc-950">7 Days</p>
        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-headline mt-0.5">Support Availability</p>
      </div>
    </div>
  `;

  // Form submission
  const form    = page.querySelector('#contact-form');
  const success = page.querySelector('#contact-success');
  const error   = page.querySelector('#contact-error');
  const submit  = page.querySelector('#contact-submit');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = page.querySelector('#contact-name').value.trim();
    const phone   = page.querySelector('#contact-phone').value.trim();
    const subject = page.querySelector('#contact-subject').value;
    const message = page.querySelector('#contact-message').value.trim();

    if (!name || !phone || !subject || !message) {
      error.classList.remove('hidden');
      return;
    }
    error.classList.add('hidden');
    submit.disabled = true;
    submit.innerHTML = `<span class="btn-spinner"></span>`;
    setTimeout(() => {
      form.style.display = 'none';
      success.classList.remove('hidden');
    }, 800);
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
