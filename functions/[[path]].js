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
                      <i class="far fa-star text-amber-400" data-rating="1"></i>
                      <i class="far fa-star text-amber-400" data-rating="2"></i>
                      <i class="far fa-star text-amber-400" data-rating="3"></i>
                      <i class="far fa-star text-amber-400" data-rating="4"></i>
                      <i class="far fa-star text-amber-400" data-rating="5"></i>
                  </div>
                  <p id="rating-text" class="text-xs font-semibold text-amber-500 mb-6 h-5"></p>
              </div>
              <div id="feedback-form" class="hidden text-left mt-2">
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Tulis kesan / pesan kamu (Opsional):</label>
                  <textarea id="review-comment" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 mb-4" placeholder="Tulis masukan di sini..."></textarea>
                  <button id="submit-feedback" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-2xl transition shadow-lg">Kirim Ulasan</button>
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
              const ratingLabels = { 1: "Kurang Memuaskan 😞", 2: "Cukup 😐", 3: "Biasa Saja 🙂", 4: "Puas! 😊", 5: "Sangat Memuaskan! 😍" };
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
                          setTimeout(() => { window.location.href = googleReviewUrl; }, 400);
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
                      if (s.dataset.rating <= val) {
                          s.classList.remove('far'); s.classList.add('fas');
                      } else {
                          s.classList.remove('fas'); s.classList.add('far');
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
            const savedResellerStr = await env.KANGREVIEW_KV.get("res
