/* MESIN CHATBOT (prototipe): pencarian kata kunci pada dokumen aktif ala RAG sederhana.
   Jawaban hanya dari dokumen resmi; bila tidak cocok, bot mengaku tidak tahu (anti-halusinasi). Semua jalur aman dari error. */
const Bot = {
  stop: new Set('yang dan di ke dari untuk apa bagaimana cara saya aku dong dengan atau ini itu ada akan bisa apakah mau tolong kak min'.split(' ')),
  stem: w => { let r = w.replace(/^(meng|meny|men|mem|me|peng|peny|pen|pem|per|pe|ber|ter|di|ke|se)(?=.{3})/, ''); if (r.length > 4) r = r.replace(/(kan|an|i|nya)$/, ''); return r; },
  stems(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !Bot.stop.has(w)).map(Bot.stem); },
  async api(q, user) {
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), CONFIG.TIMEOUT_MS || 8000);
    try {
      const r = await fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, nim: user && user.id }), signal: ac.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (!j || typeof j.answer !== 'string' || !j.answer.trim()) throw new Error('Format respons API tidak valid');
      const src = Array.isArray(j.sources) ? j.sources.filter(s => s && s.title).map(s => ({ title: String(s.title), date: String(s.date || '-') })) : [];
      return { status: 'ok', text: j.answer.trim().slice(0, 4000), src };
    } catch (e) { console.warn('API gagal, memakai mesin lokal:', e.message); return null; }
    finally { clearTimeout(to); }
  },
  async ask(q, user) {
    q = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (!q) return { status: 'none', text: 'Silakan ketik pertanyaan Anda terlebih dahulu.', src: [] };
    try {
      if (CONFIG.USE_API) { const a = await Bot.api(q, user); if (a) return a; }
      if (/^(halo|hai|hi|selamat|assalam|permisi|pagi|siang|sore|malam)/i.test(q) && q.length < 25)
        return { status: 'ok', text: 'Halo! Silakan tanyakan seputar layanan akademik, misalnya KRS, cuti akademik, atau surat keterangan.', src: [] };
      if (/(nilai|ipk|ips|tagihan|transkrip).*(saya|aku|ku)\b|(saya|aku).*(nilai|ipk|ips|tagihan)/i.test(q))
        return { status: 'scope', text: 'Maaf, saya tidak dapat mengakses data pribadi seperti nilai atau tagihan. Silakan cek sistem informasi akademik atau hubungi bagian akademik.', src: [] };
      const docs = Store.arr('docs').filter(d => d.active && d.title && typeof d.content === 'string' && d.content.trim());
      if (!docs.length) return { status: 'none', text: 'Belum ada dokumen akademik aktif yang dapat dijadikan sumber jawaban. Silakan hubungi bagian akademik.', src: [] };
      const qs = new Set(Bot.stems(q)); let best = null;
      for (const d of docs) {
        const tt = new Set(Bot.stems(d.title + ' ' + (d.cat || '')));
        for (const p of d.content.split(/\n\n+/)) {
          const ps = new Set(Bot.stems(p)); let s = 0;
          qs.forEach(w => { if (ps.has(w)) s++; if (tt.has(w)) s += 1.5; });
          if (!best || s > best.s) best = { s, p, d };
        }
      }
      if (!best || best.s === 0 || best.s < Math.min(2, qs.size))
        return { status: 'none', text: 'Maaf, saya belum menemukan informasi itu di dokumen resmi yang tersedia. Pertanyaan Anda dicatat agar admin dapat menambah dokumennya. Untuk sementara, silakan hubungi bagian akademik.', src: [] };
      return { status: 'ok', text: best.p, src: [{ title: String(best.d.title), date: String(best.d.date || '-') }] };
    } catch (e) {
      console.error(e); return { status: 'error', text: 'Maaf, terjadi gangguan pada chatbot. Silakan coba lagi sebentar lagi.', src: [] };
    }
  }
};
