export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const ADMIN_PIN = "999999";

    // 1. Panel Admin (/admin)
    if (pathname === "/admin" || pathname === "/admin/") {
      return new Response(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Panel</title><style>body{font-family:sans-serif;background:#0f172a;color:#fff;padding:20px;max-width:500px;margin:auto}.card{background:#1e293b;padding:20px;border-radius:10px}input,button{width:100%;padding:10px;margin:5px 0;border-radius:5px;border:1px solid #475569;box-sizing:border-box}button{background:#2563eb;color:#fff;font-weight:bold;border:none;cursor:pointer}.hidden{display:none}</style></head><body><div class="card"><h2>Admin Panel KK Review</h2><div id="login"><label>PIN Admin</label><input type="password" id="pin" placeholder="******"><button onclick="login()">Masuk</button></div><div id="content" class="hidden"><h3>Tambah Reseller</h3><input type="text" id="rName" placeholder="Nama Reseller"><input type="password" id="rPin" placeholder="PIN Reseller (6 digit)"><button onclick="addR()">Tambah Reseller</button><p id="msg"></p></div></div><script>let p="";async function login(){p=document.getElementById("pin").value;let r=await fetch("/api/admin/verify",{method:"POST",body:JSON.stringify({pin:p})});if(r.ok){document.getElementById("login").classList.add("hidden");document.getElementById("content").classList.remove("hidden");}else{alert("PIN Salah");}}async function addR(){let name=document.getElementById("rName").value;let pin=document.getElementById("rPin").value;let r=await fetch("/api/admin/add-reseller",{method:"POST",body:JSON.stringify({adminPin:p,name,pin})});let d=await r.json();if(d.success){document.getElementById("msg").innerText="Reseller berhasil ditambahkan!";document.getElementById("rName").value="";document.getElementById("rPin").value="";}else{alert(d.message||"Gagal");}}</script></body></html>',
        { headers: { "Content-Type": "text/html;charset=UTF-8" } }
      );
    }

    // 2. Portal Reseller (/reseller)
    if (pathname === "/reseller" || pathname === "/reseller/") {
      return new Response(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reseller Portal</title><style>body{font-family:sans-serif;background:#0f172a;color:#fff;padding:20px;max-width:500px;margin:auto}.card{background:#1e293b;padding:20px;border-radius:10px}input,button{width:100%;padding:10px;margin:5px 0;border-radius:5px;border:1px solid #475569;box-sizing:border-box}button{background:#16a34a;color:#fff;font-weight:bold;border:none;cursor:pointer}.hidden{display:none}</style></head><body><div class="card"><h2>Portal Reseller</h2><div id="login"><label>ID / Nama Reseller</label><input type="text" id="rId"><label>PIN Reseller</label><input type="password" id="rPin"><button onclick="login()">Masuk Portal</button></div><div id="content" class="hidden"><h3>Aktivasi Kartu Klien</h3><input type="text" id="cName" placeholder="Nama Toko Klien"><input type="text" id="cUrl" placeholder="Link Google Review Klien"><button onclick="act()">Aktifkan Kartu</button><p id="res" style="word-break:break-all"></p></div></div><script>let id="",pin="";async function login(){id=document.getElementById("rId").value;pin=document.getElementById("rPin").value;let r=await fetch("/api/reseller/verify",{method:"POST",body:JSON.stringify({id,pin})});if(r.ok){document.getElementById("login").classList.add("hidden");document.getElementById("content").classList.remove("hidden");}else{alert("ID/PIN Salah");}}async function act(){let cName=document.getElementById("cName").value;let cUrl=document.getElementById("cUrl").value;let r=await fetch("/api/reseller/activate",{method:"POST",body:JSON.stringify({resellerId:id,resellerPin:pin,clientName:cName,clientTarget:cUrl})});let d=await r.json();if(d.success){document.getElementById("res").innerHTML="Aktivasi Berhasil!<br>Link: <a href=\'"+d.shortUrl+"\' style=\'color:#38bdf8\'>"+d.shortUrl+"</a>";}else{alert(d.message||"Gagal");}}</script></body></html>',
        { headers: { "Content-Type": "text/html;charset=UTF-8" } }
      );
    }

    // 3. API Verification & Management
    if (pathname === "/api/admin/verify" && request.method === "POST") {
      const body = await request.json();
      return new Response(JSON.stringify({ success: body.pin === ADMIN_PIN }), {
        status: body.pin === ADMIN_PIN ? 200 : 401,
        headers: { "Content-Type": "application/json" }
      });
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

      return new Response(JSON.stringify({ success: !!found }), {
        status: found ? 200 : 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (pathname === "/api/reseller/activate" && request.method === "POST") {
      const body = await request.json();
      if (!env.KK_STORE) return new Response(JSON.stringify({ success: false, message: "KV Error" }), { status: 500 });

      const cardId = "card_" + Math.random().toString(36).substring(2, 8);
      const cardKey = "CARD:" + cardId;
      const cardData = JSON.stringify({ id: cardId, name: body.clientName, targetUrl: body.clientTarget });

      await env.KK_STORE.put(cardKey, cardData);

      return new Response(JSON.stringify({
        success: true,
        shortUrl: url.origin + "/r/" + cardId
      }), { headers: { "Content-Type": "application/json" } });
    }

    // 4. Redirect Kartu (/r/card_xxx)
    if (pathname.startsWith("/r/")) {
      const cardId = pathname.replace("/r/", "");
      if (!env.KK_STORE) return new Response("KV Store belum siap", { status: 500 });

      const cardData = await env.KK_STORE.get("CARD:" + cardId, "json");
      if (cardData && cardData.targetUrl) {
        return Response.redirect(cardData.targetUrl, 302);
      }
      return new Response("Kartu tidak ditemukan atau belum diaktifkan.", { status: 404 });
    }

    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not Found", { status: 404 });
  }
};
