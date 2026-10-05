export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // PIN Admin Utama Khusus Wak
    const ADMIN_PIN = env.ADMIN_PIN || "999999"; 

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // -------------------------------------------------------------
    // 1. DASHBOARD ADMIN UTAMA (/admin)
    // -------------------------------------------------------------
    if (pathname === "/admin") {
      return new Response(getAdminPageHTML(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    // -------------------------------------------------------------
    // 2. PORTAL KHUSUS RESELLER (/reseller)
    // -------------------------------------------------------------
    if (pathname === "/reseller") {
      return new Response(getResellerPageHTML(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    // -------------------------------------------------------------
    // 3. API: AMBIL DAFTAR RESELLER (Khusus Admin)
    // -------------------------------------------------------------
    if (pathname === "/api/get-resellers" && request.method === "POST") {
      try {
        const { adminPin } = await request.json();
        if (adminPin !== ADMIN_PIN) {
          return new Response(JSON.stringify({ success: false, message: "❌ Akses Ditolak" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const listData = await env.KK_STORE.get("SYSTEM_RESELLERS");
        const resellers = listData ? JSON.parse(listData) : [];

        return new Response(JSON.stringify({ success: true, resellers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, message: err.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // -------------------------------------------------------------
    // 4. API: TAMBAH / HAPUS RESELLER (Khusus Admin)
    // -------------------------------------------------------------
    if (pathname === "/api/manage-reseller" && request.method === "POST") {
      try {
        const { adminPin, action, username, pin } = await request.json();
        if (adminPin !== ADMIN_PIN) {
          return new Response(JSON.stringify({ success: false, message: "❌ PIN Admin Salah!" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const listData = await env.KK_STORE.get("SYSTEM_RESELLERS");
        let resellers = listData ? JSON.parse(listData) : [];

        if (action === "ADD") {
          const cleanUser = username.trim().toLowerCase();
          if (resellers.some(r => r.username === cleanUser)) {
            return new Response(JSON.stringify({ success: false, message: "❌ Username reseller sudah ada!" }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          resellers.push({ username: cleanUser, pin: pin.trim(), createdAt: new Date().toISOString() });
          await env.KK_STORE.put("SYSTEM_RESELLERS", JSON.stringify(resellers));
          return new Response(JSON.stringify({ success: true, message: `✅ Reseller '${cleanUser}' berhasil ditambahkan.` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (action === "DELETE") {
          const cleanUser = username.trim().toLowerCase();
          resellers = resellers.filter(r => r.username !== cleanUser);
          await env.KK_STORE.put("SYSTEM_RESELLERS", JSON.stringify(resellers));
          return new Response(JSON.stringify({ success: true, message: `✅ Reseller '${cleanUser}' telah dihapus.` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

      } catch (err) {
        return new Response(JSON.stringify({ success: false, message: err.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // -------------------------------------------------------------
    // 5. API: AKTIVASI KARTU (Admin & Reseller)
    // -------------------------------------------------------------
    if (pathname === "/api/update" && request.method === "POST") {
      try {
        const body = await request.json();
        const { role, adminPin, resellerUser, resellerPin, idKartu, targetUrl, namaToko } = body;

        let actorName = "";

        if (role === "admin") {
          if (adminPin !== ADMIN_PIN) {
            return new Response(JSON.stringify({ success: false, message: "❌ PIN Admin Utama Salah!" }), {
              status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          actorName = "ADMIN";
        } else if (role === "reseller") {
          const listData = await env.KK_STORE.get("SYSTEM_RESELLERS");
          const resellers = listData ? JSON.parse(listData) : [];
          
          const cleanUser = (resellerUser || "").trim().toLowerCase();
          const found = resellers.find(r => r.username === cleanUser && r.pin === (resellerPin || "").trim());

          if (!found) {
            return new Response(JSON.stringify({ success: false, message: "❌ Username atau PIN Reseller Salah!" }), {
              status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          actorName = `RESELLER (${cleanUser})`;
        }

        if (!idKartu || !targetUrl) {
          return new Response(JSON.stringify({ success: false, message: "❌ ID Kartu & Link wajib diisi!" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const cleanId = idKartu.trim().toUpperCase();
        let formattedUrl = targetUrl.trim();
        if (!formattedUrl.match(/^https?:\/\//i)) {
          formattedUrl = "https://" + formattedUrl;
        }

        const storeData = {
          url: formattedUrl,
          namaToko: namaToko ? namaToko.trim() : "-",
          updatedBy: actorName,
          updatedAt: new Date().toISOString()
        };

        await env.KK_STORE.put(cleanId, JSON.stringify(storeData));

        return new Response(JSON.stringify({ 
          success: true, 
          message: `✅ Sukses! Kartu [${cleanId}] diaktifkan oleh ${actorName}.` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ success: false, message: err.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // -------------------------------------------------------------
    // 6. REDIRECT NFC / QR (Contoh: /K001)
    // -------------------------------------------------------------
    const cardId = pathname.replace("/", "").trim().toUpperCase();
    if (!cardId) {
      return new Response("<h3>Sistem NFC Active</h3>", { headers: { "Content-Type": "text/html" } });
    }

    const rawData = await env.KK_STORE.get(cardId);
    if (rawData) {
      let targetUrl = rawData;
      try {
        const parsed = JSON.parse(rawData);
        if (parsed.url) targetUrl = parsed.url;
      } catch (e) {}
      return Response.redirect(targetUrl, 302);
    } else {
      return new Response(`
        <div style="font-family:sans-serif; text-align:center; padding:40px;">
          <h2>Kartu Belum Diaktivasi</h2>
          <p>ID Kartu: <b>${cardId}</b></p>
          <p>Silakan hubungi admin / reseller resmi untuk aktivasi.</p>
        </div>
      `, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    }
  }
};

// =========================================================================
// HTML: DASHBOARD ADMIN UTAMA WAK
// =========================================================================
function getAdminPageHTML() {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Panel - Multi Reseller</title>
      <style>
        * { box-sizing: border-box; font-family: system-ui, sans-serif; }
        body { background: #0f172a; color: #f8fafc; padding: 20px; display: flex; justify-content: center; }
        .container { width: 100%; max-width: 500px; }
        .box { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px; }
        h2, h3 { color: #38bdf8; margin-top: 0; }
        label { display: block; font-size: 12px; color: #cbd5e1; margin-top: 10px; }
        input { width: 100%; padding: 10px; border: 1px solid #475569; background: #0f172a; color: white; border-radius: 6px; margin-top: 4px; }
        button { width: 100%; background: #0284c7; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; margin-top: 12px; cursor: pointer; }
        button.danger { background: #dc2626; padding: 4px 8px; font-size: 12px; width: auto; margin: 0; }
        .reseller-item { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 10px; border-radius: 6px; margin-top: 8px; font-size: 13px; }
        #status { padding: 10px; border-radius: 6px; display: none; font-size: 13px; margin-top: 10px; }
        .success { background: #064e3b; color: #6ee7b7; }
        .error { background: #7f1d1d; color: #fca5a5; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- AKTIVASI KARTU -->
        <div class="box">
          <h2>👑 Panel Utama Admin</h2>
          <label>PIN Admin Utama</label>
          <input type="password" id="adminPin" placeholder="PIN Admin (Default: 999999)">
          
          <hr style="border-color:#334155; margin:15px 0;">
          <h3>Aktivasi / Edit Kartu</h3>
          <label>ID Kartu (contoh: K001)</label>
          <input type="text" id="idKartu" style="text-transform:uppercase;">
          <label>Nama Toko Klien</label>
          <input type="text" id="namaToko">
          <label>Link Google Review</label>
          <input type="url" id="targetUrl">
          <button onclick="submitKartu()">Simpan Data Kartu</button>
        </div>

        <!-- MANAJEMEN RESELLER -->
        <div class="box">
          <h3>👥 Kelola Reseller</h3>
          <label>Username Reseller Baru</label>
          <input type="text" id="newUser" placeholder="misal: budi_medan">
          <label>PIN Khusus Dia</label>
          <input type="text" id="newPin" placeholder="misal: 4567">
          <button onclick="addReseller()" style="background:#16a34a;">+ Tambah Reseller Baru</button>

          <hr style="border-color:#334155; margin:15px 0;">
          <button onclick="loadResellers()" style="background:#475569;">🔄 Muat Daftar Reseller</button>
          <div id="resellerList"></div>
        </div>

        <div id="status"></div>
      </div>

      <script>
        async function submitKartu() {
          const adminPin = document.getElementById('adminPin').value;
          const idKartu = document.getElementById('idKartu').value;
          const namaToko = document.getElementById('namaToko').value;
          const targetUrl = document.getElementById('targetUrl').value;

          showStatus("Memproses...");
          const res = await fetch('/api/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ role: 'admin', adminPin, idKartu, namaToko, targetUrl })
          });
          const data = await res.json();
          showStatus(data.message, data.success);
        }

        async function addReseller() {
          const adminPin = document.getElementById('adminPin').value;
          const username = document.getElementById('newUser').value;
          const pin = document.getElementById('newPin').value;

          if(!username || !pin) return alert("Isi Username dan PIN Reseller!");

          showStatus("Menambahkan reseller...");
          const res = await fetch('/api/manage-reseller', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ adminPin, action: 'ADD', username, pin })
          });
          const data = await res.json();
          showStatus(data.message, data.success);
          if(data.success) {
            document.getElementById('newUser').value = '';
            document.getElementById('newPin').value = '';
            loadResellers();
          }
        }

        async function loadResellers() {
          const adminPin = document.getElementById('adminPin').value;
          const res = await fetch('/api/get-resellers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ adminPin })
          });
          const data = await res.json();
          if(data.success) {
            const container = document.getElementById('resellerList');
            if(data.resellers.length === 0) {
              container.innerHTML = "<p style='font-size:12px; color:#94a3b8; margin-top:10px;'>Belum ada reseller tersimpan.</p>";
              return;
            }
            container.innerHTML = data.resellers.map(r => `
              <div class="reseller-item">
                <div><b>${r.username}</b> (PIN:${r.pin})</div>
                <button class="danger" onclick="deleteReseller('${r.username}')">Hapus</button>
              </div>
            `).join('');
          } else {
            showStatus(data.message, false);
          }
        }

        async function deleteReseller(username) {
          if(!confirm("Yakin hapus reseller " + username + "?")) return;
          const adminPin = document.getElementById('adminPin').value;
          const res = await fetch('/api/manage-reseller', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ adminPin, action: 'DELETE', username })
          });
          const data = await res.json();
          showStatus(data.message, data.success);
          if(data.success) loadResellers();
        }

        function showStatus(msg, isSuccess = true) {
          const s = document.getElementById('status');
          s.style.display = 'block';
          s.className = isSuccess ? 'success' : 'error';
          s.innerText = msg;
        }
      </script>
    </body>
    </html>
  `;
}

// =========================================================================
// HTML: PORTAL RESELLER (LOGIN USERNAME & PIN)
// =========================================================================
function getResellerPageHTML() {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portal Reseller - KKReview</title>
      <style>
        * { box-sizing: border-box; font-family: system-ui, sans-serif; }
        body { background: #f1f5f9; color: #1e293b; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin:0; }
        .box { background: white; padding: 25px; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        h2 { text-align: center; color: #0f172a; margin-top: 0; }
        label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-top: 10px; }
        input { width: 100%; padding: 11px; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 4px; font-size: 14px; }
        button { width: 100%; background: #16a34a; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; font-size: 15px; margin-top: 15px; cursor: pointer; }
        #status { margin-top: 15px; padding: 10px; border-radius: 6px; font-size: 13px; text-align: center; display: none; }
        .success { background: #dcfce7; color: #15803d; }
        .error { background: #fee2e2; color: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>📱 Portal Aktivasi Reseller</h2>
        <label>Username Anda</label>
        <input type="text" id="rUser" placeholder="Masukkan Username">
        
        <label>PIN Anda</label>
        <input type="password" id="rPin" placeholder="Masukkan PIN">

        <hr style="border-color:#e2e8f0; margin:15px 0;">

        <label>ID Kartu (contoh: K001)</label>
        <input type="text" id="idKartu" placeholder="K001" style="text-transform:uppercase;">

        <label>Nama Toko Klien</label>
        <input type="text" id="namaToko" placeholder="Contoh: Kedai Kopi">

        <label>Link Google Review Toko</label>
        <input type="url" id="targetUrl" placeholder="https://maps.app.goo.gl/...">

        <button onclick="submitReseller()">Aktifkan Kartu</button>
        <div id="status"></div>
      </div>

      <script>
        async function submitReseller() {
          const resellerUser = document.getElementById('rUser').value;
          const resellerPin = document.getElementById('rPin').value;
          const idKartu = document.getElementById('idKartu').value;
          const namaToko = document.getElementById('namaToko').value;
          const targetUrl = document.getElementById('targetUrl').value;
          const statusDiv = document.getElementById('status');

          statusDiv.style.display = "block";
          statusDiv.className = "";
          statusDiv.innerText = "⏳ Memproses...";

          try {
            const res = await fetch('/api/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'reseller', resellerUser, resellerPin, idKartu, namaToko, targetUrl })
            });

            const data = await res.json();
            statusDiv.className = data.success ? "success" : "error";
            statusDiv.innerText = data.message;

            if (data.success) {
              document.getElementById('idKartu').value = "";
              document.getElementById('namaToko').value = "";
              document.getElementById('targetUrl').value = "";
            }
          } catch (err) {
            statusDiv.className = "error";
            statusDiv.innerText = "❌ Terjadi kesalahan koneksi.";
          }
        }
      </script>
    </body>
    </html>
  `;
}
