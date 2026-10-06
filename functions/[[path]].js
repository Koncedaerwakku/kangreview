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

    // 1. HALAMAN PUBLIK ULASAN PELANGGAN (/r/cardId)
    if (path.startsWith('/r/')) {
      const parts = path.split('/');
      const cardId = parts[2] ? parts[2].trim() : '';
      if (!cardId) return new Response('Kartu tidak ditemukan', { status: 404 });

      let cardDataStr = null;
      if (env && env.KANGREVIEW_KV) {
        try { cardDataStr = await env.KANGREVIEW_KV.get("card_" + cardId); } catch (e) {}
      }

      const card = cardDataStr ? JSON.parse(cardDataStr) : { name: "Review Bisnis", greview: "https://google.com", whatsapp: "", logo: "" };

      const logoHtml = card.logo 
        ? '<div class="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-md overflow-hidden border border-slate-200"><img src="' + card.logo + '" alt="Logo" class="w-full h-full object-cover"></div>'
        : '<div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-sm"><i class="fa-solid fa-face-smile"></i></div>';

      const html = '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ulasan - ' + card.name + '</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></head>' +
      '<body class="bg-slate-100 text-slate-800 min-h-screen flex items-center justify-center p-4">' +
      '<div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 border border-slate-200 text-center">' +
      logoHtml +
      '<h1 class="text-xl font-bold mb-1 text-slate-900">' + card.name + '</h1>' +
      '<p class="text-slate-500 text-xs mb-6">5 detik masukan dari kamu berharga banget buat meningkatkan kualitas layanan kami 😊</p>' +
      '<div id="rating-section"><div class="flex justify-center gap-2 mb-2 text-3xl cursor-pointer" id="star-container">' +
      '<i class="far fa-star text-amber-400" data-rating="1"></i><i class="far fa-star text-amber-400" data-rating="2"></i><i class="far fa-star text-amber-400" data-rating="3"></i><i class="far fa-star text-amber-400" data-rating="4"></i><i class="far fa-star text-amber-400" data-rating="5"></i>' +
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

    // 2. LOGIN RESELLER
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
            const savedResellerStr = await env.KANGREVIEW_KV.get("reseller_" + username);
            if (savedResellerStr && JSON.parse(savedResellerStr).password === password) validLogin = true;
          } catch (e) {}
        }
        if (validLogin) {
          return new Response(null, { status: 302, headers: { 'Location': '/reseller', 'Set-Cookie': 'reseller_user=' + username + '; Path=/; HttpOnly; Secure' } });
        } else {
          errorMsg = '<p class="text-red-400 text-xs text-center mt-2 font-medium">Username atau Password salah!</p>';
        }
      }
      const html = '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Login Reseller</title><script src="https://cdn.tailwindcss.com"></script></head>' +
      '<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">' +
      '<div class="max-w-sm w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">' +
      '<h1 class="text-xl font-bold mb-1 text-center">Login Reseller</h1><p class="text-slate-400 text-xs text-center mb-6">Masukkan akun Anda</p>' +
      '<form method="POST" class="space-y-4">' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Username</label><input type="text" name="username" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label><input type="password" name="password" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"></div>' +
      '<button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition">Masuk Portal</button>' +
      errorMsg + '</form><div class="text-center mt-4"><a href="/admin" class="text-xs text-slate-400 hover:text-slate-200">&larr; Kembali</a></div></div></body></html>';
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // 3. PORTAL RESELLER (TAMBAH, EDIT, & PROTEKSI PIN)
    if (path === '/reseller') {
      const activeUser = getCookie('reseller_user');
      if (!activeUser) return new Response(null, { status: 302, headers: { 'Location': '/reseller-login' } });

      let resultHtml = '';
      let editCardId = url.searchParams.get('edit') || '';
      let existingCard = null;
      let errorPinMsg = '';

      if (env && env.KANGREVIEW_KV) {
        // Jika mode edit atau verifikasi PIN dikirim
        if (request.method === 'POST') {
          const formData = await request.formData();
          const actionType = formData.get('action_type');

          if (actionType === 'verify_pin') {
            const targetId = formData.get('card_id');
            const enteredPin = formData.get('pin_check');
            const cardDataStr = await env.KANGREVIEW_KV.get("card_" + targetId);
            if (cardDataStr) {
              const parsed = JSON.parse(cardDataStr);
              if (parsed.pin && parsed.pin === enteredPin) {
                // PIN cocok, arahkan ke form edit dengan parameter
                return new Response(null, { status: 302, headers: { 'Location': '/reseller?edit=' + targetId + '&verified=true' } });
              } else {
                errorPinMsg = '<div class="bg-red-900/40 border border-red-500/50 p-3 rounded-xl mb-4 text-xs text-red-300 text-center">PIN Keamanan Salah! Hubungi pemilik bisnis jika lupa.</div>';
              }
            }
          } else {
            // Simpan Data Baru atau Update Data Lama
            const rawCardId = formData.get('cardid') ? formData.get('cardid').trim() : '';
            const name = formData.get('name');
            const whatsapp = formData.get('whatsapp');
            const greview = formData.get('greview');
            const logo = formData.get('logo') ? formData.get('logo').trim() : '';
            const pin = formData.get('pin') ? formData.get('pin').trim() : '1234'; // Default PIN jika kosong
            
            const cardId = rawCardId ? rawCardId.replace(/[^a-zA-Z0-9_-]/g, '') : Math.random().toString(36).substring(2, 8);
            
            // Cek jika sedang mengedit, pertahankan logo lama jika tidak di-upload baru
            let finalLogo = logo;
            if (!finalLogo && editCardId) {
              const oldData = await env.KANGREVIEW_KV.get("card_" + cardId);
              if (oldData) {
                finalLogo = JSON.parse(oldData).logo || '';
              }
            }

            const cardData = JSON.stringify({ name, whatsapp, greview, logo: finalLogo, pin, owner: activeUser });
            await env.KANGREVIEW_KV.put("card_" + cardId, cardData);

            const generatedLink = url.origin + '/r/' + cardId;
            resultHtml = '<div class="bg-emerald-900/40 border border-emerald-500/50 p-4 rounded-xl mb-6 text-center">' +
              '<p class="text-xs text-emerald-400 font-semibold mb-1">DATA & PIN KEAMANAN BERHASIL DISIMPAN! 🔒</p>' +
              '<p class="text-sm font-bold text-white mb-3">' + name + '</p>' +
              '<div class="bg-white p-3 inline-block rounded-xl mb-3 shadow-md"><img id="qr-image" src="" alt="QR" class="w-36 h-36 mx-auto"></div>' +
              '<div class="mb-3"><input type="text" readonly value="' + generatedLink + '" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-center text-slate-300 select-all"></div>' +
              '<a id="download-btn" download="QR.png" class="block w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-2.5 rounded-lg transition text-center">Download QR Code (PNG)</a>' +
              '</div><script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>' +
              '<script>QRCode.toDataURL("' + generatedLink + '", { width: 300, margin: 2 }, function (err, urlData) { if (!err) { document.getElementById("qr-image").src = urlData; document.getElementById("download-btn").href = urlData; } });</script>';
            
            editCardId = ''; // Reset edit mode setelah simpan
          }
        }

        if (editCardId && url.searchParams.get('verified') === 'true') {
          const cardDataStr = await env.KANGREVIEW_KV.get("card_" + editCardId);
          if (cardDataStr) existingCard = JSON.parse(cardDataStr);
        }
      }

      // Ambil daftar semua kartu milik reseller ini untuk ditampilkan di bawah
      let listCardsHtml = '';
      if (env && env.KANGREVIEW_KV) {
        try {
          const list = await env.KANGREVIEW_KV.list();
          let items = [];
          for (const key of list.keys) {
            if (key.name.startsWith("card_")) {
              const val = await env.KANGREVIEW_KV.get(key.name);
              if (val) {
                const parsed = JSON.parse(val);
                if (parsed.owner === activeUser || activeUser === 'admin') {
                  items.push({ id: key.name.replace("card_", ""), ...parsed });
                }
              }
            }
          }
          if (items.length > 0) {
            listCardsHtml = '<div class="mt-8 border-t border-slate-700 pt-6"><h2 class="text-sm font-bold text-slate-300 mb-3">Daftar Bisnis Terdaftar:</h2><div class="space-y-3">';
            items.forEach(item => {
              listCardsHtml += '<div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center">' +
                '<div><p class="text-xs font-bold text-white">' + item.name + '</p><p class="text-[10px] text-slate-400">ID: ' + item.id + '</p></div>' +
                '<button onclick="openPinModal(\'' + item.id + '\')" class="bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition">Edit Link/Maps</button>' +
                '</div>';
            });
            listCardsHtml += '</div></div>';
          }
        } catch (e) {}
      }

      const html = '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Portal Reseller</title><script src="https://cdn.tailwindcss.com"></script></head>' +
      '<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">' +
      '<div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">' +
      '<div class="flex justify-between items-center mb-4"><div><h1 class="text-xl font-bold">Portal Reseller</h1><p class="text-slate-400 text-xs">Login: <span class="text-emerald-400 font-semibold">' + activeUser + '</span></p></div><a href="/admin" class="text-xs bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200">Admin</a></div>' +
      errorPinMsg +
      resultHtml +
      '<form method="POST" class="space-y-4">' +
      '<input type="hidden" name="cardid" value="' + (editCardId || '') + '">' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nama Bisnis / Toko</label><input type="text" name="name" required value="' + (existingCard ? existingCard.name : '') + '" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: Mesti Coffee"></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Upload Logo Toko (Pilih dari HP)</label><input type="file" id="upload-file" accept="image/*" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"><input type="hidden" name="logo" id="logo-base64" value="' + (existingCard ? existingCard.logo : '') + '"></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nomor WhatsApp Owner (Untuk Bintang 1-3)</label><input type="text" name="whatsapp" value="' + (existingCard ? (existingCard.whatsapp || '') : '') + '" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="0821..."></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Link Google Review / Maps Asli</label><input type="url" name="greview" required value="' + (existingCard ? (existingCard.greview || '') : '') + '" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="https://g.page/r/..."></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">PIN Keamanan Bisnis (4 Angka)</label><input type="text" name="pin" required maxlength="6" value="' + (existingCard ? (existingCard.pin || '1234') : '1234') + '" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Contoh: 1234"></div>' +
      '<button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition">' + (editCardId ? 'Perbarui Data Bisnis' : 'Simpan & Generate QR Code') + '</button>' +
      (editCardId ? '<a href="/reseller" class="block text-center text-xs text-slate-400 hover:text-white mt-2">Batal Edit</a>' : '') +
      '</form>' +
      listCardsHtml +
      '</div>' +
      // Modal Popup Input PIN untuk Verifikasi Edit
      '<div id="pinModal" class="hidden fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">' +
      '<div class="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center">' +
      '<h3 class="text-sm font-bold text-white mb-2">Masukkan PIN Keamanan Bisnis</h3>' +
      '<p class="text-xs text-slate-400 mb-4">PIN diperlukan agar Google Maps / data tidak diubah orang lain.</p>' +
      '<form method="POST">' +
      '<input type="hidden" name="action_type" value="verify_pin">' +
      '<input type="hidden" name="card_id" id="modalCardId">' +
      '<input type="password" name="pin_check" required maxlength="6" placeholder="Masukkan PIN" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white text-center focus:outline-none focus:border-blue-500 mb-4">' +
      '<div class="flex gap-2">' +
      '<button type="button" onclick="closePinModal()" class="w-1/2 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2.5 rounded-xl">Batal</button>' +
      '<button type="submit" class="w-1/2 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2.5 rounded-xl font-semibold">Verifikasi</button>' +
      '</div></form></div></div>' +
      '<script>' +
      'function openPinModal(id) { document.getElementById("modalCardId").value = id; document.getElementById("pinModal").classList.remove("hidden"); }' +
      'function closePinModal() { document.getElementById("pinModal").classList.add("hidden"); }' +
      'document.getElementById("upload-file").addEventListener("change", function(e) {' +
      '  const file = e.target.files[0];' +
      '  if (file) {' +
      '    const reader = new FileReader();' +
      '    reader.onload = function(event) {' +
      '      const img = new Image();' +
      '      img.onload = function() {' +
      '        const canvas = document.createElement("canvas");' +
      '        const maxDim = 300;' +
      '        let width = img.width;' +
      '        let height = img.height;' +
      '        if (width > height) { if (width > maxDim) { height *= maxDim / width; width = maxDim; } }' +
      '        else { if (height > maxDim) { width *= maxDim / height; height = maxDim; } }' +
      '        canvas.width = width; canvas.height = height;' +
      '        const ctx = canvas.getContext("2d");' +
      '        ctx.drawImage(img, 0, 0, width, height);' +
      '        document.getElementById("logo-base64").value = canvas.toDataURL("image/jpeg", 0.7);' +
      '      };' +
      '      img.src = event.target.result;' +
      '    };' +
      '    reader.readAsDataURL(file);' +
      '  }' +
      '});' +
      '</script></body></html>';
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // 4. MANAJEMEN RESELLER OLEH ADMIN UTAMA
    if (path === '/admin/resellers') {
      let msg = '';
      if (request.method === 'POST') {
        const formData = await request.formData();
        const newUsername = formData.get('username') ? formData.get('username').trim() : '';
        const newPassword = formData.get('password') ? formData.get('password').trim() : '';
        if (newUsername && newPassword && env && env.KANGREVIEW_KV) {
          await env.KANGREVIEW_KV.put("reseller_" + newUsername, JSON.stringify({ password: newPassword }));
          msg = '<p class="text-emerald-400 text-xs text-center mt-2 font-medium">Reseller berhasil didaftarkan!</p>';
        }
      }
      const html = '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Tambah Reseller</title><script src="https://cdn.tailwindcss.com"></script></head>' +
      '<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">' +
      '<div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">' +
      '<div class="flex justify-between items-center mb-4"><h1 class="text-xl font-bold">Tambah Reseller</h1><a href="/admin" class="text-xs bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200">Kembali</a></div>' +
      '<form method="POST" class="space-y-4">' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Username</label><input type="text" name="username" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"></div>' +
      '<div><label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label><input type="text" name="password" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"></div>' +
      '<button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition">Simpan Reseller</button>' +
      msg + '</form></div></body></html>';
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    const adminHtml = '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Utama</title><script src="https://cdn.tailwindcss.com"></script></head>' +
    '<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">' +
    '<div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700 text-center">' +
    '<div class="mb-6"><span class="bg-blue-900/50 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">Admin Utama</span>' +
    '<h1 class="text-2xl font-bold mt-2">KangReview</h1><p class="text-slate-400 text-sm">Pusat kendali sistem.</p></div>' +
    '<div class="space-y-3">' +
    '<a href="/admin/resellers" class="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition text-center">&#10133; Tambah Akun Reseller Baru</a>' +
    '<a href="/reseller-login" class="block w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition text-center">&#128273; Login Portal Reseller</a>' +
    '</div></div></body></html>';

    return new Response(adminHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });

  } catch (err) {
    return new Response("Terjadi kesalahan sistem: " + err.message, { status: 500 });
  }
}
