export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // PIN Default (Bisa diubah)
    const ADMIN_PIN = "999999";

    // Helper Response HTML
    const htmlResponse = (html) => new Response(html, {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });

    // Helper Response JSON
    const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });

    // ----------------------------------------------------
    // 1. ROUTE: /admin (Panel Admin Utama)
    // ----------------------------------------------------
    if (pathname === "/admin" || pathname === "/admin/") {
      return htmlResponse(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Portal - KK Review</title>
          <style>
            * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
            body { background-color: #0f172a; color: #f8fafc; display: flex; justify-content: center; padding: 20px; margin: 0; min-height: 100vh; }
            .card { background: #1e293b; padding: 24px; border-radius: 12px; width: 100%; max-width: 480px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
            h2 { margin-top: 0; color: #38bdf8; text-align: center; font-size: 1.5rem; }
            label { font-size: 0.875rem; color: #94a3b8; display: block; margin-top: 12px; margin-bottom: 4px; }
            input, select { width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #fff; margin-bottom: 8px; }
            button { width: 100%; padding: 12px; border-radius: 6px; border: none; background: #2563eb; color: #fff; font-weight: bold; cursor: pointer; margin-top: 12px; }
            button:hover { background: #1d4ed8; }
            .hidden { display: none; }
            .msg { padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 0.875rem; text-align: center; }
            .success { background: #065f46; color: #a7f3d0; }
            .error { background: #991b1b; color: #fecaca; }
            .reseller-item { background: #0f172a; padding: 12px; border-radius: 8px; margin-top: 8px; border: 1px solid #334155; font-size: 0.875rem; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #0284c7; font-size: 0.75rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Admin Portal KK Review</h2>
            
            <div id="loginSection">
              <label>Masukkan PIN Admin</label>
              <input type="password" id="adminPin" placeholder="******">
              <button onclick="loginAdmin()">Masuk Admin</button>
              <div id="loginMsg"></div>
            </div>

            <div id="adminContent" class="hidden">
              <hr style="border-color: #334155; margin: 20px 0;">
              <h3>1. Buat / Tambah Reseller Baru</h3>
              <label>Nama Reseller</label>
              <input type="text" id="resellerName" placeholder="Contoh: Budi Cellular">
              <label>PIN Reseller (6 Angka)</label>
              <input type="password" id="resellerPin" placeholder="123456">
              <button onclick="addReseller()">Tambah Reseller</button>
              <div id="addResellerMsg"></div>

              <hr style="border-color: #334155; margin: 20px 0;">
              <h3>2. Daftar Reseller Aktif</h3>
              <button onclick="loadResellers()" style="background: #475569;">Refresh List Reseller</button>
              <div id="resellerList"></div>
            </div>
          </div>

          <script>
            let currentPin = '';

            async function loginAdmin() {
              const pin = document.getElementById('adminPin').value;
              const msg = document.getElementById('loginMsg');
              msg.className = 'msg';
              msg.innerText = 'Memeriksa...';

              const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
              });

              const data = await res.json();
              if (res.ok && data.success) {
                currentPin = pin;
                document.getElementById('loginSection').classList.add('hidden');
                document.getElementById('adminContent').classList.remove('hidden');
                loadResellers();
              } else {
                msg.className = 'msg error';
                msg.innerText = data.message || 'PIN Admin Salah!';
              }
            }

            async function addReseller() {
              const name = document.getElementById('resellerName').value;
              const pin = document.getElementById('resellerPin').value;
              const msg = document.getElementById('addResellerMsg');

              if (!name || !pin) {
                alert('Nama dan PIN Reseller wajib diisi!');
                return;
              }

              const res = await fetch('/api/admin/add-reseller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPin: currentPin, name, pin })
              });

              const data = await res.json();
              if (res.ok && data.success) {
                msg.className = 'msg success';
                msg.innerText = 'Reseller Berhasil Ditambahkan!';
                document.getElementById('resellerName').value = '';
                document.getElementById('resellerPin').value = '';
                loadResellers();
              } else {
                msg.className = 'msg error';
                msg.innerText = data.message || 'Gagal menambahkan reseller.';
              }
            }

            async function loadResellers() {
              const container = document.getElementById('resellerList');
              container.innerHTML = 'Loading data...';

              const res = await fetch('/api/admin/list-resellers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPin: currentPin })
              });

              const data = await res.json();
              if (res.ok && data.resellers) {
                if (data.resellers.length === 0) {
                  container.innerHTML = '<p style="color:#94a3b8;">Belum ada reseller.</p>';
                  return;
                }
                container.innerHTML = data.resellers.map(r => \`
                  <div class="reseller-item">
                    <strong>\${r.name}</strong> <span class="badge">Reseller</span><br>
                    <small style="color:#94a3b8;">ID: \${r.id}</small>
                  </div>
                \`).join('');
              } else {
                container.innerHTML = 'Gagal memuat list reseller.';
              }
            }
          </script>
        </body>
        </html>
      `);
    }

    // ----------------------------------------------------
    // 2. ROUTE: /reseller (Portal Reseller)
    // ----------------------------------------------------
    if (pathname === "/reseller" || pathname === "/reseller/") {
      return htmlResponse(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Portal Reseller - KK Review</title>
          <style>
            * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
            body { background-color: #0f172a; color: #f8fafc; display: flex; justify-content: center; padding: 20px; margin: 0; min-height: 100vh; }
            .card { background: #1e293b; padding: 24px; border-radius: 12px; width: 100%; max-width: 480px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
            h2 { margin-top: 0; color: #38bdf8; text-align: center; font-size: 1.5rem; }
            label { font-size: 0.875rem; color: #94a3b8; display: block; margin-top: 12px; margin-bottom: 4px; }
            input { width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #fff; margin-bottom: 8px; }
            button { width: 100%; padding: 12px; border-radius: 6px; border: none; background: #16a34a; color: #fff; font-weight: bold; cursor: pointer; margin-top: 12px; }
            button:hover { background: #15803d; }
            .hidden { display: none; }
            .msg { padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 0.875rem; text-align: center; }
            .success { background: #065f46; color: #a7f3d0; word-break: break-all; }
            .error { background: #991b1b; color: #fecaca; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Portal Reseller KK Review</h2>
            
            <div id="loginSection">
              <label>Nama / ID Reseller</label>
              <input type="text" id="resellerId" placeholder="Masukkan ID Reseller">
              <label>PIN Reseller</label>
              <input type="password" id="resellerPin" placeholder="******">
              <button onclick="loginReseller()">Masuk Portal</button>
              <div id="loginMsg"></div>
            </div>

            <div id="resellerContent" class="hidden">
              <hr style="border-color: #334155; margin: 20px 0;">
              <h3>Aktivasi Kartu Klien Baru</h3>
              <label>Nama Toko / Bisnis Klien</label>
              <input type="text" id="clientName" placeholder="Contoh: Rumah Makan Minang">
              <label>Link Google Review Klien</label>
              <input type="text" id="clientTarget" placeholder="https://g.page/r/...">
              <button onclick="activateCard()">Aktifkan Kartu Klien</button>
              <div id="activationResult"></div>
            </div>
          </div>

          <script>
            let resId = '';
            let resPin = '';

            async function loginReseller() {
              resId = document.getElementById('resellerId').value;
              resPin = document.getElementById('resellerPin').value;
              const msg = document.getElementById('loginMsg');
              msg.className = 'msg';
              msg.innerText = 'Memeriksa...';

              const res = await fetch('/api/reseller/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: resId, pin: resPin })
              });

              const data = await res.json();
              if (res.ok && data.success) {
                document.getElementById('loginSection').classList.add('hidden');
                document.getElementById('resellerContent').classList.remove('hidden');
              } else {
                msg.className = 'msg error';
                msg.innerText = data.message || 'Login Reseller Gagal!';
              }
            }

            async function activateCard() {
              const clientName = document.getElementById('clientName').value;
              const clientTarget = document.getElementById('clientTarget').value;
              const msg = document.getElementById('activationResult');

              if (!clientName || !clientTarget) {
                alert('Semua data wajib diisi!');
                return;
              }

              const res = await fetch('/api/reseller/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resellerId: resId, resellerPin: resPin, clientName, clientTarget })
              });

              const data = await res.json();
              if (res.ok && data.success) {
                msg.className = 'msg success';
                msg.innerHTML = \`
                  <strong>Aktivasi Berhasil!</strong><br>
                  Link Kartu Klien:<br>
                  <a href="\${data.shortUrl}" target="_blank" style="color:#38bdf8;">\${data.shortUrl}</a>
                \`;
              } else {
                msg.className = 'msg error';
                msg.innerText = data.message || 'Gagal aktivasi kartu.';
              }
            }
          </script>
        </body>
        </html>
      `);
    }

    // ----------------------------------------------------
    // 3. API ENDPOINTS
    // ----------------------------------------------------
    if (pathname === "/api/admin/verify" && request.method === "POST") {
      const body = await request.json();
      if (body.pin === ADMIN_PIN) {
        return jsonResponse({ success: true });
      }
      return jsonResponse({ success: false, message: "PIN Admin Salah" }, 401);
    }

    if (pathname === "/api/admin/add-reseller" && request.method === "POST") {
      const body = await request.json();
      if (body.adminPin !== ADMIN_PIN) {
        return jsonResponse({ success: false, message: "Akses ditolak" }, 403);
      }
      if (!env.KK_STORE) {
        return jsonResponse({ success: false, message: "KV KK_STORE belum di-bind!" }, 500);
      }

      const id = "res_" + Date.now();
      const newReseller = { id, name: body.name, pin: body.pin, createdAt: new Date().toISOString() };
      
      let resellers = await env.KK_STORE.get("RESELLERS_LIST", "json") || [];
      resellers.push(newReseller);
      await env.KK_STORE.put("RESELLERS_LIST", JSON.stringify(resellers));

      return jsonResponse({ success: true, reseller: newReseller });
    }

    if (pathname === "/api/admin/list-resellers" && request.method === "POST") {
      const body = await request.json();
      if (body.adminPin !== ADMIN_PIN) {
        return jsonResponse({ success: false, message: "Akses ditolak" }, 403);
      }
      if (!env.KK_STORE) return jsonResponse({ resellers: [] });

      const resellers = await env.KK_STORE.get("RESELLERS_LIST", "json") || [];
      return jsonResponse({ resellers });
    }

    if (pathname === "/api/reseller/verify" && request.method === "POST") {
      const body = await request.json();
      if (!env.KK_STORE) return jsonResponse({ success: false, message: "KV Store error" }, 500);

      const resellers = await env.KK_STORE.get("RESELLERS_LIST", "json") || [];
      const found = resellers.find(r => (r.id === body.id || r.name.toLowerCase() === body.id.toLowerCase()) && r.pin === body.pin);

      if (found) {
        return jsonResponse({ success: true, reseller: found });
      }
      return jsonResponse({ success: false, message: "ID atau PIN Reseller Salah" }, 401);
    }

    if (pathname === "/api/reseller/activate" && request.method === "POST") {
      const body = await request.json();
      if (!env.KK_STORE) return jsonResponse({ success: false, message: "KV Store error" }, 500);

      const cardId = "card_" + Math.random().toString(36).substring(2, 8);
      const cardData = {
        id: cardId,
        clientName: body.clientName,
        targetUrl: body.clientTarget,
        activatedBy: body.resellerId,
        createdAt: new Date().toISOString()
      };

      await env.KK_STORE.put(\`CARD:\${cardId}\`, JSON.stringify(cardData));

      const origin = url.origin;
      return jsonResponse({
        success: true,
        cardId,
        shortUrl: \`\${origin}/r/\${cardId}\`
      });
    }

    // ----------------------------------------------------
    // 4. ROUTE: REDIRECT KARTU KLIEN (/r/:cardId)
    // ----------------------------------------------------
    if (pathname.startsWith("/r/")) {
      const cardId = pathname.replace("/r/", "");
      if (!env.KK_STORE) return new Response("KV Store belum siap", { status: 500 });

      const cardData = await env.KK_STORE.get(\`CARD:\${cardId}\`, "json");
      if (cardData && cardData.targetUrl) {
        return Response.redirect(cardData.targetUrl, 302);
      }
      return new Response("Kartu belum diaktivasi atau tidak ditemukan.", { status: 404 });
    }

    // Selebihnya serahkan ke file statis (index.html)
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not Found", { status: 404 });
  }
};