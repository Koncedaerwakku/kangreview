export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.slice(1); // Ambil path setelah domain

  // Gunakan Cloudflare KV jika tersedia (env.DB), atau fallback memori lokal sementara
  // Pastikan di Cloudflare Pages settings sudah di-bind KV namespace bernama 'DB' (opsional)
  // Di sini kita sediakan handler API & Redirect
  
  const kv = env.DB; // Cloudflare KV binding

  // API: Ambil semua data bisnis
  if (url.pathname === '/api/businesses') {
    if (request.method === 'GET') {
      let data = {};
      if (kv) {
        const raw = await kv.get('all_businesses');
        data = raw ? JSON.parse(raw) : {};
      } else {
        // Fallback jika KV belum disetup
        data = globalThis._fallbackDB || {};
      }
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API: Simpan / Tambah / Edit bisnis
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        let data = {};
        if (kv) {
          const raw = await kv.get('all_businesses');
          data = raw ? JSON.parse(raw) : {};
        } else {
          if (!globalThis._fallbackDB) globalThis._fallbackDB = {};
          data = globalThis._fallbackDB;
        }

        data[body.slug] = {
          name: body.name,
          url: body.url,
          logo: body.logo || (data[body.slug] ? data[body.slug].logo : '')
        };

        if (kv) {
          await kv.put('all_businesses', JSON.stringify(data));
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
      }
    }

    // API: Hapus bisnis
    if (request.method === 'DELETE') {
      const slug = url.searchParams.get('slug');
      let data = {};
      if (kv) {
        const raw = await kv.get('all_businesses');
        data = raw ? JSON.parse(raw) : {};
        delete data[slug];
        await kv.put('all_businesses', JSON.stringify(data));
      } else {
        data = globalThis._fallbackDB || {};
        delete data[slug];
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Jika mengakses short link (misal: domain.com/unclefang)
  if (path && !path.startsWith('api/')) {
    let data = {};
    if (kv) {
      const raw = await kv.get('all_businesses');
      data = raw ? JSON.parse(raw) : {};
    } else {
      data = globalThis._fallbackDB || {};
    }

    if (data[path]) {
      // REDIRECT LANGSUNG KE LINK GOOGLE REVIEW TUJUAN
      return Response.redirect(data[path].url, 302);
    }
  }

  // Jika bukan short link, teruskan ke file static (index.html)
  return context.next();
}
