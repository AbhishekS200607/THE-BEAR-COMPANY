/**
 * Floating WhatsApp Support Button
 * Direct priority channel to WhatsApp Business Number: 919605210198
 */

export function mountFloatingWhatsApp() {
  const existing = document.getElementById('floating-whatsapp-widget');
  if (existing) existing.remove();

  const widget = document.createElement('aside');
  widget.id = 'floating-whatsapp-widget';
  widget.className = 'fixed bottom-24 right-5 md:bottom-8 md:right-24 z-40 flex items-center group';

  const waPhone = '919605210198';
  const prefilled = encodeURIComponent('Hi BEAR Support! I have a question regarding my order and sizing.');
  const waUrl = `https://wa.me/${waPhone}?text=${prefilled}`;

  widget.innerHTML = `
    <!-- Tooltip (desktop only) -->
    <div class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-wider mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md border border-zinc-800">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span>Instant Support</span>
    </div>

    <!-- Floating Action Button -->
    <a 
      href="${waUrl}" 
      target="_blank" 
      rel="noopener noreferrer" 
      aria-label="Chat with BEAR Support on WhatsApp" 
      class="w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 no-underline cursor-pointer border-2 border-white"
    >
      <svg class="w-6 h-6 fill-white" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
      </svg>
    </a>
  `;

  document.body.appendChild(widget);
}

export default { mountFloatingWhatsApp };
