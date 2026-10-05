export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const ADMIN_PIN = "999999";

  // 1. ADMIN PANEL
  if (pathname === "/admin" || pathname === "/admin/") {
    return new Response(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Panel</title><style>body{font-family:sans-serif;background:#0f172a;color:#fff;padding:20px;max-width:500px;margin:auto}.card{background:#1e293b;padding:20px;border-radius:10px}input,button{width:100%;padding:10px;margin:5px 0;border-radius:5px;border:1px solid #475569;box-sizing:border-box}button{background:#2563eb;color:#fff;font-weight:bold;border:none;cursor:pointer}.hidden{display:none}</style></head><body><div class="card"><h2>Admin Panel KK Review</h2><div id="login"><label>PIN Admin</label><input type="password" id="pin" placeholder="******"><button onclick="login()">Masuk</button></div><div id="content" class="hidden"><h3>Tambah Reseller</h3><input type="text" id="rName" placeholder="Nama Reseller"><input type="password" id="rPin" placeholder="PIN Reseller"><button onclick="addR()">Tambah Reseller</button><p id="msg"></p></div></div><script>let p="";async function login(){p=document.getElementById("pin").value;let r=await fetch("/api/admin/verify",{method:"POST",body:JSON.stringify({pin:p})});if(r.ok){document.getElementById("login").classList.add("hidden");document.getElementById("content").classList.remove("hidden");}else{alert("PIN Salah");}}async function addR(){let name=document.getElementById("rName").value;let pin=document.getElementById("rPin").value;let r=await fetch("/api/admin/add-reseller",{method:"POST",body:JSON.stringify({adminPin:p,name,pin})});let d=await r.json();if(d.success){document.getElementById("msg").innerText="Reseller berhasil ditambahkan!";document.getElementById("rName").value="";document.getElementById("rPin").value="";}else{alert(d.message||"Gagal");}}</script></body></html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }

  // 2. RESELLER PORTAL (DILENGKAPI FITUR GENERATE QR CODE AUTOMATIS)
  if (pathname === "/reseller" || pathname === "/reseller/") {
    return new Response(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reseller Portal</title><style>body{font-family:sans-serif;background:#0f172a;color:#fff;padding:20px;max-width:500px;margin:auto}.card{background:#1e293b;padding:20px;border-radius:10px}input,button{width:100%;padding:10px;margin:5px 0;border-radius:5px;border:1px solid #475569;box-sizing:border-box}button{background:#16a34a;color:#fff;font-weight:bold;border:none;cursor:pointer}.hidden{display:none}#qrBox{text-align:center;margin-top:15px;background:#fff;padding:15px;border-radius:8px;color:#000}</style><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script></head><body><div class="card"><h2>Portal Reseller</h2><div id="login"><label>ID / Nama Reseller</label><input type="text" id="rId"><label>PIN Reseller</label><input type="password" id="rPin"><button onclick="login()">Masuk Portal</button></div><div id="content" class="hidden"><h3>Aktivasi Kartu Klien</h3><input type="text" id="cName" placeholder="Nama Toko Klien"><input type="text" id="cUrl" placeholder="Link Google Review Klien"><button onclick="act()">Aktifkan Kartu & Buat QR</button><p id="res" style="word-break:break-all"></p><div id="qrBox" class="hidden"><h4>QR Code Kartu:</h4><div id="qrcode" style="display:flex;justify-content:center;margin:10px 0;"></div></div></div></div><script>let id="",pin="";async function login(){id=document.getElementById("rId").value;pin=document.getElementById("rPin").value;let r=await fetch("/api/reseller/verify",{method:"POST",body:JSON.stringify({id,pin})});if(r.ok){document.getElementById("login").classList.add("hidden");document.getElementById("content").classList.remove("hidden");}else{alert("ID/PIN Salah");}}async function act(){let cName=document.getElementById("cName").value;let cUrl=document.getElementById("cUrl").value;let r=await fetch("/api/reseller/activate",{method:"POST",body:JSON.stringify({resellerId:id,resellerPin:pin,clientName:cName,clientTarget:cUrl})});let d=await r.json();if(d.success){document.getElementById("res").innerHTML="Aktivasi Berhasil!<br>Link: <a href='"+d.shortUrl+"' target='_blank' style='color:#38bdf8'>"+d.shortUrl+"</a>";document.getElementById("qrcode").innerHTML="";new QRCode(document.getElementById("qrcode"),{text:d.shortUrl,width:180,height:180});document.getElementById("qrBox").classList.remove("hidden");}else{alert(d.message||"Gagal");}}</script></body></html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }

  // API Endpoints
  if (pathname === "/api/admin/verify" && request.method === "POST") {
    const body = await request.json();
    return new Response(JSON.stringify({ success: body.pin === ADMIN_PIN }), { status: body.pin === ADMIN_PIN ? 200 : 401, headers: { "Content-Type": "application/json" } });
  }

  if (pathname === "/api/admin/add-reseller" && request.method === "POST") {
    const body = await request.json();
    if (body.adminPin !== ADMIN_PIN) return new Response(JSON.stringify({ success: false }), { status: 403 });
    if (!env.KK_STORE) return new Response(JSON.stringify({ success: false, message: "KV KK_STORE belum di-bind!" }), { status: 500 });

    const newReseller = { id: "res_" + Date.now(), name: body.name, pin: body.pin };
    let resellers = await env.KK_STORE.get("RESELLERS_LIST", "json") || [];
    resellers.push(newReseller);
    await env.KK_STORE.put("RESELLERS_LIST", JSON.stringify(resellers));
    return new Response(JSON.stringify({ success: true }));
  }

  if (pathname === "/api/reseller/verify" && request.method === "POST") {
    const body = await request.json();
    if (!env.KK_STORE) return new Response(JSON.stringify({ success: false, message: "KV Error" }), { status: 500 });

    const resellers = await env.KK_STORE.get("RESELLERS_LIST", "json") || [];
    const found = resellers.find(r => (r.id === body.id || r.name.toLowerCase() === body.id.toLowerCase()) && r.pin === body.pin);

    return new Response(JSON.stringify({ success: !!found }), { status: found ? 200 : 401, headers: { "Content-Type": "application/json" } });
  }

  if (pathname === "/api/reseller/activate" && request.method === "POST") {
    const body = await request.json();
    if (!env.KK_STORE) return new Response(JSON.stringify({ success: false, message: "KV Error" }), { status: 500 });

    const cardId = "card_" + Math.random().toString(36).substring(2, 8);
    const cardData = JSON.stringify({ id: cardId, name: body.clientName, targetUrl: body.clientTarget });

    await env.KK_STORE.put("CARD:" + cardId, cardData);
    return new Response(JSON.stringify({ success: true, shortUrl: url.origin + "/r/" + cardId }), { headers: { "Content-Type": "application/json" } });
  }

  // 3. HALAMAN PENAMPUNG BINTANG (REVIEW FILTERING)
  if (pathname.startsWith("/r/")) {
    const cardId = pathname.replace("/r/", "");
    if (!env.KK_STORE) return new Response("KV Store belum siap", { status: 500 });

    const cardData = await env.KK_STORE.get("CARD:" + cardId, "json");
    if (cardData && cardData.targetUrl) {
      const storeName = cardData.name || "Toko Kami";
      const targetUrl = cardData.targetUrl;

      // Render Tampilan Penampung Bintang
      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ulasan Pelanggan</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 15px; box-sizing: border-box; }
    .card { background: #ffffff; width: 100%; max-width: 380px; padding: 25px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; }
    .icon { width: 60px; height: 60px; background: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: #2563eb; }
    .icon svg { width: 32px; height: 32px; fill: currentColor; }
    h2 { margin: 0 0 8px; color: #0f172a; font-size: 22px; font-weight: 700; }
    p { margin: 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.4; }
    .stars { display: flex; justify-content: center; gap: 8px; margin-bottom: 15px; }
    .star { font-size: 36px; color: #cbd5e1; cursor: pointer; transition: color 0.2s; user-select: none; }
    .star.active { color: #f59e0b; }
    .status-text { height: 24px; font-size: 14px; font-weight: 600; color: #2563eb; margin-bottom: 15px; }
    textarea { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 15px; resize: none; font-family: inherit; font-size: 14px; outline: none; }
    button { width: 100%; background: #2563eb; color: #fff; border: none; padding: 12px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/></svg>
    </div>
    <h2>${storeName}</h2>
    <p>Bagaimana pengalaman Anda berbelanja/layanan kami?</p>
    
    <div class="stars" id="stars">
      <span class="star" onclick="setRating(1)">★</span>
      <span class="star" onclick="setRating(2)">★</span>
      <span class="star" onclick="setRating(3)">★</span>
      <span class="star" onclick="setRating(4)">★</span>
      <span class="star" onclick="setRating(5)">★</span>
    </div>
    
    <div class="status-text" id="statusText"></div>
    <textarea id="feedback" rows="3" placeholder="Tuliskan masukan atau kritik Anda di sini..." class="hidden"></textarea>
    <button id="btnSend" onclick="submitReview()" disabled>Kirim Ulasan</button>
  </div>

  <script>
    let selectedRating = 0;
    const targetGoogle = "${targetUrl}";
    const texts = ["", "Kecewa 😞", "Kurang Puas 😐", "Cukup Baik 🙂", "Sangat Memuaskan! 😍", "Sangat Memuaskan! 😍"];

    function setRating(r) {
      selectedRating = r;
      const stars = document.querySelectorAll('.star');
      stars.forEach((s, idx) => {
        if (idx < r) s.classList.add('active');
        else s.classList.remove('active');
      });
      document.getElementById('statusText').innerText = texts[r];
      document.getElementById('btnSend').disabled = false;
      
      if(r <= 3) {
        document.getElementById('feedback').classList.remove('hidden');
      } else {
        document.getElementById('feedback').classList.add('hidden');
      }
    }

    function submitReview() {
      if (selectedRating >= 4) {
        // Bintang 4 & 5 langsung lempar ke Google Review
        window.location.href = targetGoogle;
      } else {
        // Bintang 1, 2, 3 hanya kirim kritik lokal
        alert("Terima kasih atas masukan dan kritik Anda!");
        location.reload();
      }
    }
  </script>
</body>
</html>`;

      return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    }
    return new Response("Kartu tidak ditemukan.", { status: 404 });
  }

  return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not Found", { status: 404 });
}
