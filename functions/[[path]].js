export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. HALAMAN REVIEW KLIEN (/r/id_kartu)
  if (path.startsWith('/r/')) {
    const cardId = path.split('/')[2];
    if (!cardId) return new Response('Kartu tidak ditemukan', { status: 404 });

    let cardDataStr = null;
    if (env.KANGREVIEW_KV) {
      cardDataStr = await env.KANGREVIEW_KV.get(cardId);
    }

    const card = cardDataStr ? JSON.parse(cardDataStr) : {
      name: "Review Bisnis",
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
                    highlightStars(this.dataset.rating);
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
                    const message = encodeURIComponent("Halo Kak, saya memberikan rating " + selectedRating + " bintang.\\nMasukan: " + comment);
                    let waNumber = ownerWhatsApp.replace(/^0/, '62');
                    window.location.href = "https://wa.me/" + waNumber + "?text=" + message;
                } else {
                    // Kamuflase jika WhatsApp tidak diisi/tidak ada
                    alert('Terima kasih banyak atas masukan berharga Anda!');
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
    let resultHtml = '';
    if (request.method === 'POST') {
      const formData = await request.formData();
      const cardId = formData.get('cardid').trim().replace(/[^a-zA-Z0-9_-]/g, '');
      const name = formData.get('name');
      const whatsapp = formData.get('whatsapp');
      const greview = formData.get('greview');
      
      const cardData = JSON.stringify({ name, whatsapp, greview });

      if (env.KANGREVIEW_KV) {
        // Bisa di-update tanpa batas jika ID kartu yang sama disubmit ulang
        await env.KANGREVIEW_KV.put(cardId, cardData);
      }

      const generatedLink = `${url.origin}/r/${cardId}`;
      
      resultHtml = `
        <div class="bg-emerald-900/40 border border-emerald-500/50 p-4 rounded-xl mb-6 text-center">
            <p class="text-xs text-emerald-400 font-semibold mb-1">DATA BISNIS BERHASIL DISIMPAN / DI-UPDATE!</p>
            <p class="text-sm font-bold text-white mb-3">${name}</p>
            <div class="bg-white p-3 inline-block rounded-xl mb-3 shadow-md">
                <img id="qr-image" src="" alt="QR Code" class="w-36 h-36 mx-auto">
            </div>
            <div class="mb-3">
                <input type="text" readonly value="${generatedLink}" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-center text-slate-300 select-all">
            </div>
            <a id="download-btn" download="QR-${name.replace(/[^a-zA-Z0-9]/g, '_')}.png" class="block w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-2.5 rounded-lg transition text-center">Download QR Code (PNG)</a>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        <script>
            QRCode.toDataURL("${generatedLink}", { width: 300, margin: 2 }, function (err, urlData) {
                if (!err) {
                    document.getElementById('qr-image').src = urlData;
                    document.getElementById('download-btn').href = urlData;
                }
            });
        </script>
      `;
    }

    const html = `<!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portal Reseller - Pendaftaran & Update Bisnis</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h1 class="text-xl font-bold">Portal Reseller</h1>
                    <p class="text-slate-400 text-xs">Daftar & Update Bisnis Google Review</p>
                </div>
                <a href="/admin" class="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-200 transition">Admin Utama</a>
            </div>
            
            ${resultHtml}

            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">ID / Kode pada Kartu Fisik</label>
                    <input type="text" name="cardid" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: card01 atau kode dari kartu">
                    <p class="text-[10px] text-slate-400 mt-1">Jika kartu sudah pernah terdaftar, input ID yang sama untuk meng-update nama/alamat/link bisnis.</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nama Bisnis / Toko / Cafe</label>
                    <input type="text" name="name" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: Kedai Kopi Mantap (Cabang Baru)">
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nomor WhatsApp Owner (Opsional)</label>
                    <input type="text" name="whatsapp" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: 08123456789 (Kosongkan jika ingin dikamuflase)">
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Link Google Review Asli</label>
                    <input type="url" name="greview" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://g.page/r/...">
                </div>
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition">Simpan / Update Data Bisnis</button>
            </form>
        </div>
    </body>
    </html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  // 3. HALAMAN ADMIN UTAMA (/admin atau root /)
  const adminHtml = `<!DOCTYPE html>
  <html lang="id">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Utama - KangReview</title>
      <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700 text-center">
          <div class="mb-6">
              <span class="bg-blue-900/50 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">Pusat Kendali</span>
              <h1 class="text-2xl font-bold mt-2">Admin Utama</h1>
              <p class="text-slate-400 text-sm">Kelola sistem, reseller, dan database kartu review.</p>
          </div>
          
          <div class="space-y-3">
              <a href="/reseller" class="block w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition text-center">Buka Portal Reseller</a>
              <div class="p-4 bg-slate-900 rounded-xl border border-slate-700 text-left text-xs text-slate-300 space-y-2">
                  <p class="font-semibold text-slate-200">📌 Panduan Sistem:</p>
                  <p>• <b>Admin & Reseller</b> menggunakan halaman <code>/reseller</code> untuk mendaftarkan atau meng-update data bisnis klien kapan saja tanpa batas.</p>
                  <p>• <b>Bintang 4-5</b> otomatis meluncur mulus ke Google Review asli.</p>
                  <p>• <b>Bintang 1-3</b> masuk ke WhatsApp owner. Jika nomor WA kosong, sistem otomatis mengaktifkan mode kamuflase (alert terima kasih ramah).</p>
              </div>
          </div>
      </div>
  </body>
  </html>`;

  return new Response(adminHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
