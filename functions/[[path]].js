export async function onRequest(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const cookieHeader = request.headers.get('Cookie') || '';

    function getCookie(name) {
      const match = cookieHeader.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    }

    if (path.startsWith('/r/')) {
      const parts = path.split('/');
      const cardId = parts[2] ? parts[2].trim() : '';
      
      if (!cardId) {
        return new Response('Kartu tidak ditemukan', { status: 404 });
      }

      let cardDataStr = null;
      if (env && env.KANGREVIEW_KV) {
        try {
          cardDataStr = await env.KANGREVIEW_KV.get("card_" + cardId);
        } catch (e) {}
      }

      const card = cardDataStr ? JSON.parse(cardDataStr) : {
        name: "Review Bisnis",
        greview: "https://google.com",
        whatsapp: "",
        logo: ""
      };

      const logoHtml = card.logo 
        ? '<div class="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-md overflow-hidden border border-slate-200"><img src="' + card.logo + '" alt="Logo" class="w-full h-full object-cover"></div>'
        : '<div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-sm"><i class="fa-solid fa-face-smile"></i></div>';

      const html = '<!DOCTYPE html>' +
      '<html lang="id">' +
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ulasan - ' + card.name + '</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></head>' +
      '<body class="bg-slate-100 text-slate-800 min-h-screen flex items-center justify-center p-4">' +
      '<div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 border border-slate-200 text-center">' +
      logoHtml +
      '<h1 class="text-xl font-bold mb-1 text-slate-900">' + card.name + '</h1>' +
      '<p class="text-slate-500 text-xs mb-6">5 detik masukan dari kamu berharga banget buat meningkatkan kualitas layanan kami 😊</p>' +
      '<div id="rating-section"><div class="flex justify-center gap-2 mb-2 text-3xl cursor-pointer" id="star-container">' +
      '<i class="far fa-star text-amber-400" data-rating="1"></i>' +
      '<i class="far fa-star text-amber-400" data-rating="2"></i>' +
      '<i class="far fa-star text-amber-400" data-rating="3"></i>' +
      '<i class="far fa-star text-amber-400" data-rating="4"></i>' +
      '<i class="far fa-star text-amber-400" data-rating="5"></i>' +
      '</div><p id="rating-text" class="text-xs font-semibold text-amber-500 mb-6 h-5"></p></div>' +
      '<div id="feedback-form" class="hidden text-left mt-2">' +
      '<label class="block text-xs font-semibold text-slate-600 mb-1">Tulis kesan / pesan kamu (Opsional):</label>' +
      '<textarea id="review-comment" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 mb-4" placeholder="Tulis masukan di sini..."></textarea>' +
      '<button id="submit-feedback" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-2xl transition shadow-lg">Kirim Ulasan</button>' +
      '</div></div>' +
      '<script>' +
      'const stars = document.querySelectorAll("#star-container i");' +
      'const ratingText = document.getElementById("rating-text");' +
      'const feedbackForm = document.getElementById("feedback-form");' +
      'const ratingSection = document.getElementById("rating-section");' +
      'const ownerWhatsApp = "' + (card.whatsapp || '') + '";' +
      'const googleReviewUrl = "' + (card.greview || '#') + '";' +
      'let selectedRating = 0;' +
      'const ratingLabels = { 1: "Kurang Memuaskan 😞", 2: "Cukup 😐", 3: "Biasa Saja 🙂", 4: "Puas! 😊", 5: "Sangat Memuaskan! 😍" };' +
      'stars.forEach(star => {' +
      '  star.addEventListener("mouseover", function() { highlightStars(this.dataset.rating); ratingText.innerText = ratingLabels[this.dataset.rating]; });' +
      '  star.addEventListener("mouseout", function() { highlightStars(selectedRating); ratingText.innerText = selectedRating ? ratingLabels[selectedRating] : ""; });' +
      '  star.addEventListener("click", function() {' +
      '    selectedRating = parseInt(this.dataset.rating); highlightStars(selectedRating); ratingText.innerText = ratingLabels[selectedRating];' +
      '    if (selectedRating >= 4) { setTimeout(() => { window.location.href = googleReviewUrl; }, 400); }' +
      '    else { setTimeout(() => { ratingSection.classList.add("hidden"); feedbackForm.classList.remove("hidden"); }, 400); }' +
      '  });' +
      '});' +
      'function highlightStars(val) {' +
      '  stars.forEach(s => {' +
      '    if (s.dataset.rating <= val) { s.classList.remove("far"); s.classList.add("fas"); }' +
      '    else { s.classList.remove("fas"); s.classList.add("far"); }' +
      '  });' +
      '}' +
      'document.getElementById("submit-feedback").addEventListener("click", function() {' +
      '  const comment = document.getElementById("review-comment").value.trim();' +
      '  if (ownerWhatsApp) {' +
      '    const message = encodeURIComponent("Halo Kak, saya memberikan rating " + selectedRating + " bintang.\\nMasukan: " + (comment || "(Tanpa catatan)"));' +
      '    let waNumber = ownerWhatsApp.replace(/^0/, "62");' +
      '    window.location.href = "https://wa.me/" + waNumber + "?text=" + message;' +
      '  } else { alert("Terima kasih banyak atas masukan berharga Anda!"); location.reload(); }' +
      '});' +
      '</script></body></html>';
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    if (path === '/reseller-login') {
      let errorMsg = '';
      if (request.method === 'POST') {
        const formData = await request.formData();
        const username = formData.get('username') ? formData.get('username').trim() : '';
        const password = formData.get('password') ? formData.get('password').trim() : '';
        
        let validLogin = false;
        if (username === 'admin' && password === 'admin123') {
          validLogin = true;
        } else if (env && env.KANGREVIEW_KV) {
          try {
            const kvKey = "reseller_" + username;
            const savedResellerStr = await env.KANGREVIEW_KV.get(kvKey);
            if (savedResellerStr) {
              const resellerData = JSON.parse(savedResellerStr);
              if (resellerData.password === password) {
                validLogin = true;
              }
            }
          } catch (e) {}
        }

        if (validLogin) {
          return new Response(null, {
            status: 302,
            headers: { 
              'Location': '/reseller', 
              'Set-Cookie': 'reseller_user=' + username + '; Path=/; HttpOnly; Secure' 
            }
          });
        } else {
          errorMsg = '<p class="text-red-400 text-xs text-center mt-2 font-medium">Username atau Password Reseller salah!</p>';
        }
      }

      const html = '<!DOCTYPE html>' +
      '<html lang="id">' +
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Login Reseller - KangReview</title><script src="https://cdn.tailwindcss.com"></script></head>' +
      '<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">' +
      '<div class="max-w-sm w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">' +
      '<h1 class="text-xl font-bold mb-1 text-center">Login Reseller</h1>' +
      '<p class="text-slate-400 text-xs text-center mb-6">Masukkan username & password unik Anda</p>' +
      '<form method="POST" class="space-y-4">' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Username</label>' +
      '<input type="text" name="username" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Username..."></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label>' +
      '<input type="password" name="password" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Password..."></div>' +
      '<button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition">Masuk Portal</button>' +
      errorMsg + '</form>' +
      '<div class="text-center mt-4"><a href="/admin" class="text-xs text-slate-400 hover:text-slate-200">&larr; Kembali ke Admin Utama</a></div>' +
      '</div></body></html>';

      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    if (path === '/reseller') {
      const activeUser = getCookie('reseller_user');
      if (!activeUser) {
        return new Response(null, { status: 302, headers: { 'Location': '/reseller-login' } });
      }

      let resultHtml = '';
      if (request.method === 'POST') {
        const formData = await request.formData();
        const rawCardId = formData.get('cardid') ? formData.get('cardid').trim() : '';
        const name = formData.get('name');
        const whatsapp = formData.get('whatsapp');
        const greview = formData.get('greview');
        const logo = formData.get('logo') ? formData.get('logo').trim() : '';
        
        const cardId = rawCardId ? rawCardId.replace(/[^a-zA-Z0-9_-]/g, '') : Math.random().toString(36).substring(2, 8);
        const cardData = JSON.stringify({ name, whatsapp, greview, logo, owner: activeUser });

        if (env && env.KANGREVIEW_KV) {
          try {
            await env.KANGREVIEW_KV.put("card_" + cardId, cardData);
          } catch (e) {}
        }

        const generatedLink = url.origin + '/r/' + cardId;
        
        resultHtml = '<div class="bg-emerald-900/40 border border-emerald-500/50 p-4 rounded-xl mb-6 text-center">' +
          '<p class="text-xs text-emerald-400 font-semibold mb-1">QR CODE & DATA BISNIS BERHASIL DISIMPAN!</p>' +
          '<p class="text-sm font-bold text-white mb-3">' + name + '</p>' +
          '<div class="bg-white p-3 inline-block rounded-xl mb-3 shadow-md"><img id="qr-image" src="" alt="QR Code" class="w-36 h-36 mx-auto"></div>' +
          '<div class="mb-3"><input type="text" readonly value="' + generatedLink + '" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-center text-slate-300 select-all"></div>' +
          '<a id="download-btn" download="QR.png" class="block w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-2.5 rounded-lg transition text-center">Download QR Code (PNG)</a>' +
          '</div>' +
          '<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>' +
          '<script>' +
          'QRCode.toDataURL("' + generatedLink + '", { width: 300, margin: 2 }, function (err, urlData) {' +
          '  if (!err) {' +
          '    document.getElementById("qr-image").src = urlData;' +
          '    document.getElementById("download-btn").href = urlData;' +
          '  }' +
          '});' +
          '</script>';
      }

      const html = '<!DOCTYPE html>' +
      '<html lang="id">' +
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Portal Reseller - Pendaftaran Bisnis</title><script src="https://cdn.tailwindcss.com"></script></head>' +
      '<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">' +
      '<div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">' +
      '<div class="flex justify-between items-center mb-4"><div><h1 class="text-xl font-bold">Portal Reseller</h1><p class="text-slate-400 text-xs">Login sebagai: <span class="text-emerald-400 font-semibold">' + activeUser + '</span></p></div>' +
      '<a href="/admin" class="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-200 transition">Admin Utama</a></div>' +
      resultHtml +
      '<form method="POST" class="space-y-4">' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">ID / Kode Kartu Unik (Opsional)</label><input type="text" name="cardid" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Kosongkan untuk buat kode acak"></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nama Bisnis / Toko / Cafe</label><input type="text" name="name" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: Mesti Coffee"></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Link URL Gambar Logo / Foto (Opsional)</label><input type="url" name="logo" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://i.ibb.co/... atau link gambar langsung"></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nomor WhatsApp Owner (Opsional)</label><input type="text" name="whatsapp" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="0821..."></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Link Google Review Asli</label><input type="url" name="greview" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://g.page/r/..."></div>' +
      '<button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition">Simpan & Generate QR Code</button>' +
      '</form></div></body></html>';

      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    if (path === '/admin/resellers') {
      let msg = '';
      if (request.method === 'POST') {
        const formData = await request.formData();
        const newUsername = formData.get('username') ? formData.get('username').trim() : '';
        const newPassword = formData.get('password') ? formData.get('password').trim() : '';
        
        if (newUsername && newPassword && env && env.KANGREVIEW_KV) {
          const kvKey = "reseller_" + newUsername;
          await env.KANGREVIEW_KV.put(kvKey, JSON.stringify({ password: newPassword }));
          msg = '<p class="text-emerald-400 text-xs text-center mt-2 font-medium">Reseller \'' + newUsername + '\' berhasil didaftarkan!</p>';
        }
      }

      const html = '<!DOCTYPE html>' +
      '<html lang="id">' +
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Kelola Reseller - Admin Utama</title><script src="https://cdn.tailwindcss.com"></script></head>' +
      '<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">' +
      '<div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">' +
      '<div class="flex justify-between items-center mb-4"><h1 class="text-xl font-bold">Tambah Akun Reseller</h1><a href="/admin" class="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-200 transition">Kembali</a></div>' +
      '<form method="POST" class="space-y-4">' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Username Reseller</label><input type="text" name="username" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: reseller_budi"></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password Reseller</label><input type="text" name="password" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Password rahasia..."></div>' +
      '<button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition">Simpan Akun Reseller</button>' +
      msg + '</form></div></body></html>';

      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    const adminHtml = '<!DOCTYPE html>' +
    '<html lang="id">' +
    '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Utama - KangReview</title><script src="https://cdn.tailwindcss.com"></script></head>' +
    '<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">' +
    '<div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700 text-center">' +
    '<div class="mb-6"><span class="bg-blue-900/50 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">Pusat Kendali Admin</span>' +
    '<h1 class="text-2xl font-bold mt-2">KangReview Admin</h1><p class="text-slate-400 text-sm">Kelola akun reseller dan database kartu review.</p></div>' +
    '<div class="space-y-3">' +
    '<a href="/admin/resellers" class="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition text-center">&#10133; Tambah Akun Reseller Baru</a>' +
    '<a href="/reseller-login" class="block w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition text-center">&#128273; Login Portal Reseller</a>' +
    '</div></div></body></html>';

    return new Response(adminHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });

  } catch (err) {
    return new Response("Terjadi kesalahan sistem: " + err.message, { status: 500 });
  }
}
