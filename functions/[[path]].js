export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. HALAMAN UTAMA / REDIRECT KARTU (/r/id_kartu)
  if (path.startsWith('/r/')) {
    const cardId = path.split('/')[2];
    if (!cardId) return new Response('Kartu tidak ditemukan', { status: 404 });

    let cardDataStr = null;
    if (env.KANGREVIEW_KV) {
      cardDataStr = await env.KANGREVIEW_KV.get(cardId);
    }

    const card = cardDataStr ? JSON.parse(cardDataStr) : {
      name: "Contoh Bisnis",
      greview: "https://google.com",
      whatsapp: ""
    };

    const html = `<!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ulasan - ${card.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700 text-center">
            <h1 class="text-2xl font-bold mb-2">${card.name}</h1>
            <p class="text-slate-400 text-sm mb-6">Bagaimana pengalaman Anda bersama kami?</p>
            
            <div id="rating-section">
                <div class="flex justify-center gap-2 mb-6 text-3xl cursor-pointer" id="star-container">
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="1"></i>
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="2"></i>
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="3"></i>
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="4"></i>
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="5"></i>
                </div>
            </div>

            <div id="feedback-form" class="hidden text-left mt-4">
                <p class="text-sm text-amber-400 mb-3 font-medium">Masukan Anda sangat berarti untuk perbaikan layanan kami.</p>
                <textarea id="review-comment" rows="4" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 mb-3" placeholder="Tuliskan kritik atau saran Anda..."></textarea>
                <button id="submit-feedback" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition">Kirim Masukan</button>
            </div>
        </div>

        <script>
            const stars = document.querySelectorAll('#star-container i');
            const feedbackForm = document.getElementById('feedback-form');
            const ratingSection = document.getElementById('rating-section');
            const ownerWhatsApp = "${card.whatsapp || ''}";
            const googleReviewUrl = "${card.greview || '#'}";
            let selectedRating = 0;

            stars.forEach(star => {
                star.addEventListener('mouseover', function() {
                    const val = this.dataset.rating;
                    highlightStars(val);
                });
                star.addEventListener('mouseout', function() {
                    highlightStars(selectedRating);
                });
                star.addEventListener('click', function() {
                    selectedRating = parseInt(this.dataset.rating);
                    highlightStars(selectedRating);

                    if (selectedRating >= 4) {
                        window.location.href = googleReviewUrl;
                    } else {
                        ratingSection.classList.add('hidden');
                        feedbackForm.classList.remove('hidden');
                    }
                });
            });

            function highlightStars(val) {
                stars.forEach(s => {
                    const r = s.dataset.rating;
                    if (r <= val) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            }

            document.getElementById('submit-feedback').addEventListener('click', function() {
                const comment = document.getElementById('review-comment').value.trim();
                if (!comment) {
                    alert('Mohon isi masukan Anda terlebih dahulu.');
                    return;
                }

                if (ownerWhatsApp) {
                    const message = encodeURIComponent(\`Halo Kak, saya memberikan rating \${selectedRating} bintang.\\nMasukan: \${comment}\`);
                    let waNumber = ownerWhatsApp.replace(/^0/, '62');
                    window.location.href = \`https://wa.me/\${waNumber}?text=\${message}\`;
                } else {
                    alert('Terima kasih atas masukan Anda!');
                    location.reload();
                }
            });
        </script>
    </body>
    </html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  // 2. HALAMAN PORTAL RESELLER (/reseller)
  if (path === '/reseller') {
    let alertMessage = '';
    if (request.method === 'POST') {
      const formData = await request.formData();
      const name = formData.get('name');
      const whatsapp = formData.get('whatsapp');
      const greview = formData.get('greview');
      
      const cardId = 'card_' + Math.random().toString(36).substring(2, 8);
      const cardData = JSON.stringify({ name, whatsapp, greview });

      if (env.KANGREVIEW_KV) {
        await env.KANGREVIEW_KV.put(cardId, cardData);
      }

      const generatedLink = `${url.origin}/r/${cardId}`;
      alertMessage = `Kartu berhasil diaktifkan! Link Klien: ${generatedLink}`;
    }

    const html = `<!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portal Reseller - Aktivasi Kartu</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
            <h1 class="text-xl font-bold mb-1">Portal Reseller</h1>
            <p class="text-slate-400 text-sm mb-6">Aktivasi Kartu Klien</p>
            
            \${alertMessage ? \`<div class="bg-emerald-900/50 border border-emerald-500 text-emerald-200 text-sm p-3 rounded-xl mb-4 break-all">\${alertMessage}</div>\` : ''}

            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nama Toko / Cafe / Bisnis</label>
                    <input type="text" name="name" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: Mesti Coffee">
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nomor WhatsApp Owner (Opsional)</label>
                    <input type="text" name="whatsapp" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: 08123456789">
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Link Google Review Klien</label>
                    <input type="url" name="greview" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://g.page/r/...">
                </div>
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition">Aktifkan Kartu & Buat QR</button>
            </form>
        </div>
    </body>
    </html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  return new Response('Halaman tidak ditemukan', { status: 404 });
}
