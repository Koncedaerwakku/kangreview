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
    <body class="bg-slate-100 text-slate-800 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 border border-slate-200 text-center">
            <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-4 shadow-sm">
                <i class="fa-solid fa-face-smile"></i>
            </div>
            
            <h1 class="text-xl font-bold mb-1 text-slate-900">${card.name}</h1>
            <p class="text-slate-500 text-xs mb-6">5 detik masukan dari kamu berharga banget buat meningkatkan kualitas layanan kami 😊</p>
            
            <div id="rating-section">
                <div class="flex justify-center gap-2 mb-2 text-3xl cursor-pointer" id="star-container">
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="1"></i>
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="2"></i>
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="3"></i>
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="4"></i>
                    <i class="far fa-star text-amber-400 hover:scale-110 transition" data-rating="5"></i>
                </div>
                <p id="rating-text" class="text-xs font-semibold text-amber-500 mb-6 h-5"></p>
            </div>

            <div id="feedback-form" class="hidden text-left mt-2">
                <label class="block text-xs font-semibold text-slate-600 mb-1">Tulis kesan / pesan kamu (Opsional):</label>
                <textarea id="review-comment" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 mb-4" placeholder="Tulis masukan di sini..."></textarea>
                <button id="submit-feedback" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-2xl transition shadow-lg shadow-blue-500/25">Kirim Ulasan</button>
            </div>
        </div>

        <script>
            const stars = document.querySelectorAll('#star-container i');
            const ratingText = document.getElementById('rating-text');
            const feedbackForm = document.getElementById('feedback-form');
            const ratingSection = document.getElementById('rating-section');
            const ownerWhatsApp = "${card.whatsapp || ''}";
            const googleReviewUrl = "${card.greview || '#'}";
            let selectedRating = 0;

            const ratingLabels = {
                1: "Kurang Memuaskan 😞",
                2: "Cukup 😐",
                3: "Biasa Saja 🙂",
                4: "Puas! 😊",
                5: "Sangat Memuaskan! 😍"
            };

            stars.forEach(star => {
                star.addEventListener('mouseover', function() {
                    highlightStars(this.dataset.rating);
                    ratingText.innerText = ratingLabels[this.dataset.rating];
                });
                star.addEventListener('mouseout', function() {
                    highlightStars(selectedRating);
                    ratingText.innerText = selectedRating ? ratingLabels[selectedRating] : "";
                });
                star.addEventListener('click', function() {
                    selectedRating = parseInt(this.dataset.rating);
                    highlightStars(selectedRating);
                    ratingText.innerText = ratingLabels[selectedRating];

                    if (selectedRating >= 4) {
                        setTimeout(() => {
                            window.location.href = googleReviewUrl;
                        }, 400);
                    } else {
                        setTimeout(() => {
                            ratingSection.classList.add('hidden');
                            feedbackForm.classList.remove('hidden');
                        }, 400);
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

                if (ownerWhatsApp) {
                    const message = encodeURIComponent("Halo Kak, saya memberikan rating " + selectedRating + " bintang.\\nMasukan: " + (comment || "(Tanpa catatan)"));
                    let waNumber = ownerWhatsApp.replace(/^0/, '62');
                    window.location.href = "https://wa.me/" + waNumber + "?text=" + message;
                } else {
                    alert('Terima kasih banyak atas masukan berharga Anda!');
                    location.reload();
                }
            });
        </script>
    </body>
    </html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  // 2. HALAMAN LOGIN RESELLER (/reseller-login)
  if (path === '/reseller-login') {
    let errorMsg = '';
    if (request.method === 'POST') {
      const formData = await request.formData();
      const code = formData.get('reseller_code');
      // Validasi kode reseller sederhana (bisa disesuaikan atau disimpan di KV)
      if (code === 'reseller123' || code === 'admin123') {
        return new Response(null, {
          status: 302,
          headers: { 'Location': '/reseller', 'Set-Cookie': 'session=active; Path=/;' }
        });
      } else {
        errorMsg = '<p class="text-red-400 text-xs text-center mt-2 font-medium">Kode Reseller salah!</p>';
      }
    }

    const html = `<!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Reseller - KangReview</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-sm w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
            <h1 class="text-xl font-bold mb-1 text-center">Login Reseller</h1>
            <p class="text-slate-400 text-xs text-center mb-6">Masukkan kode akses untuk mendaftarkan klien</p>
            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Kode Akses Reseller</label>
                    <input type="password" name="reseller_code" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Masukkan kode...">
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition">Masuk Portal</button>
                ${errorMsg}
            </form>
            <div class="text-center mt-4">
                <a href="/admin" class="text-xs text-slate-400 hover:text-slate-200">← Kembali ke Admin Utama</a>
            </div>
        </div>
    </body>
    </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  // 3. HALAMAN PORTAL RESELLER (/reseller)
  if (path === '/reseller') {
    let resultHtml = '';
    if (request.method === 'POST') {
      const formData = await request.formData();
      const rawCardId = formData.get('cardid').trim();
      const name = formData.get('name');
      const whatsapp = formData.get('whatsapp');
      const greview = formData.get('greview');
      
      const cardId = rawCardId ? rawCardId.replace(/[^a-zA-Z0-9_-]/g, '') : 'card_' + Math.random().toString(36).substring(2, 8);
      const cardData = JSON.stringify({ name, whatsapp, greview });

      if (env.KANGREVIEW_KV) {
        await env.KANGREVIEW_KV.put(cardId, cardData);
      }

      const generatedLink = `${url.origin}/r/${cardId}`;
      
      resultHtml = `
        <div class="bg-emerald-900/40 border border-emerald-500/50 p-4 rounded-xl mb-6 text-center">
            <p class="text-xs text-emerald-400 font-semibold mb-1">QR CODE & DATA BISNIS BERHASIL DISIMPAN!</p>
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
                    <p class="text-slate-400 text-xs">Daftarkan & Update Bisnis Klien</p>
                </div>
                <a href="/admin" class="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-200 transition">Admin Utama</a>
            </div>
            
            ${resultHtml}

            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">ID / Kode Kartu Fisik (Opsional)</label>
                    <input type="text" name="cardid" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Kosongkan untuk buat QR baru otomatis">
                    <p class="text-[10px] text-slate-400 mt-1"><b>Kosongkan</b> jika untuk cetak baru. <b>Isi</b> jika pakai kartu fisik yang sudah ada.</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nama Bisnis / Toko / Cafe</label>
                    <input type="text" name="name" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: Mesti Coffee Mahato">
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nomor WhatsApp Owner (Opsional)</label>
                    <input type="text" name="whatsapp" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: 082183321579 (Kosongkan untuk mode kamuflase)">
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Link Google Review Asli</label>
                    <input type="url" name="greview" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://g.page/r/...">
                </div>
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition">Simpan & Generate QR Code</button>
            </form>
        </div>
    </body>
    </html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  // 4. HALAMAN ADMIN UTAMA (/admin atau root /)
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
              <a href="/reseller-login" class="block w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition text-center">Portal Reseller (Login)</a>
              <a href="/reseller" class="block w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition text-center">Akses Langsung Reseller</a>
              <div class="p-4 bg-slate-900 rounded-xl border border-slate-700 text-left text-xs text-slate-300 space-y-2 mt-4">
                  <p class="font-semibold text-slate-200">📌 Panduan Sistem:</p>
                  <p>• <b>Calon Reseller</b> bisa dibagikan link login khusus (`/reseller-login`) dengan kode akses yang Wak tentukan.</p>
                  <p>• <b>ID Kartu</b> sekarang sudah fleksibel (bisa dikosongkan untuk generate QR baru secara otomatis).</p>
              </div>
          </div>
      </div>
  </body>
  </html>`;

  return new Response(adminHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}