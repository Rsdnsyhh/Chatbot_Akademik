/* DASHBOARD MAHASISWA: Beranda, Chatbot, Dokumen, Panduan, Pengaturan + aksi Sampah & Keluar */
const me = Boot.need(['SEED', 'Store', 'UI', 'Desk', 'Auth', 'Bot', 'Icons']) ? Auth.require('student') : null;
if (me) {
  const key = 'chat_' + me.id, first = me.name.split(' ')[0];
  const fmt = s => new Date(s).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  const hhmm = s => new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const docsOn = () => Store.arr('docs').filter(d => d.active);
  const ST = { ok: ['Terjawab', ''], none: ['Belum terjawab', 'red'], scope: ['Di luar lingkup', 'gray'], error: ['Error', 'red'] };
  const badge = s => { const t = ST[s] || ['-', 'gray']; return `<span class="badge ${t[1]}">${t[0]}</span>`; };

  function home(b) {
    const L = Store.arr('logs').filter(l => l.user === me.id), D = docsOn(), ok = L.filter(l => l.status === 'ok').length, pct = L.length ? Math.round(ok / L.length * 100) : 0;
    b.innerHTML = `<div class="hero"><div><h2 class="px">HALO, ${UI.esc(first).toUpperCase()}!</h2><p>Tanyakan apa saja seputar layanan akademik. Jawaban diambil dari dokumen resmi, lengkap dengan sumbernya.</p><button class="btn" id="go">Mulai bertanya →</button></div><div class="herobot">${Icons.get('bot', 72)}</div></div>
      <div class="stats">${[[L.length, 'Pertanyaanmu'], [pct + '%', 'Terjawab'], [D.length, 'Dokumen aktif']].map(([n, l]) => `<div class="card"><b class="px">${n}</b><span class="muted">${l}</span></div>`).join('')}</div>
      <h3 class="sec">TOPIK POPULER</h3>
      <div class="topics">${D.map(d => `<button class="topic" data-q="${UI.esc(d.title)}">${Icons.get('folder', 28)}<div><b>${UI.esc(d.title)}</b><span class="muted">${UI.esc(d.cat)}</span></div></button>`).join('') || '<div class="card muted">Belum ada dokumen aktif.</div>'}</div>
      <h3 class="sec">PERTANYAAN TERAKHIR</h3>
      <div class="scroll" style="flex:none;max-height:210px">${L.slice(-5).reverse().map(l => `<div class="li"><div>${UI.esc(l.q)}<br><span class="muted">${fmt(l.ts)}</span></div>${badge(l.status)}</div>`).join('') || '<p class="muted pad">Belum ada pertanyaan. Coba klik salah satu topik di atas!</p>'}</div>`;
    UI.$('#go', b).onclick = () => Desk.go('chat');
    b.querySelectorAll('[data-q]').forEach(t => t.onclick = () => Desk.go('chat', { ask: t.dataset.q }));
  }

  function chat(b, arg) {
    let H = Store.arr(key);
    if (!H.length) { H = [{ r: 'b', t: `Halo, ${first}! Saya chatbot AI layanan akademik. Jawaban saya bersumber dari dokumen akademik resmi, dan saya tidak mengakses data pribadi seperti nilai atau tagihan.`, ts: Date.now() }]; Store.s(key, H); }
    b.innerHTML = `<div class="chatwrap"><div class="chatmain"><div class="msgs"></div><div class="chips only-narrow"></div>
      <form class="row"><input class="in" placeholder="Type command… (tanya soal akademik)" maxlength="300" autocomplete="off"><button class="btn">Kirim</button></form></div>
      <aside class="chatside"><h3 class="sec">TOPIK CEPAT</h3><div class="col" id="tl"></div><div class="card muted"><b>Ingat:</b> Anda berbicara dengan AI. Bot tidak mengakses nilai atau data pribadi.</div></aside></div>`;
    const M = UI.$('.msgs', b), C = UI.$('.chips', b), F = UI.$('form', b), Q = UI.$('input', b), S = UI.$('.btn', F);
    const draw = m => {
      const bot = m.r === 'b', src = bot && m.src && m.src.length && Store.settings().src ? `<div class="src">${Icons.get('doc', 14)}<span>Sumber: ${m.src.map(s => UI.esc(s.title)).join(', ')}</span><span class="muted">berlaku ${UI.esc(m.src[0].date)}</span></div>` : '';
      const e = UI.h(`<div class="mr ${m.r}"><span class="av">${Icons.get(bot ? 'bot' : 'user', 20)}</span><div class="mc"><div class="mh">${bot ? 'Bot Akademik' : UI.esc(first)} · ${hhmm(m.ts || Date.now())}</div><div class="m ${m.r}">${UI.esc(m.t)}${src}</div>${bot ? '<div class="ma"><button class="btn gray sm">Salin</button></div>' : ''}</div></div>`);
      const cp = UI.$('.ma .btn', e);
      if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(m.t); UI.toast('Jawaban disalin'); } catch (_) { UI.toast('Gagal menyalin', 'err'); } };
      M.append(e); M.scrollTop = M.scrollHeight;
    };
    H.forEach(draw);
    (SEED.suggest || []).forEach(s => { const c = UI.h(`<button type="button" class="btn gray sm">${UI.esc(s)}</button>`); c.onclick = () => send(s); C.append(c); });
    docsOn().forEach(d => { const t = UI.h(`<button type="button" class="topic">${Icons.get('doc', 20)}<b>${UI.esc(d.title)}</b></button>`); t.onclick = () => send(d.title); UI.$('#tl', b).append(t); });
    async function send(t) {
      t = String(t).replace(/\s+/g, ' ').trim(); if (!t || S.disabled) return;
      if (t.length > 300) return UI.toast('Pertanyaan maksimal 300 karakter', 'err');
      Q.value = ''; S.disabled = true;
      const u = { r: 'u', t, ts: Date.now() }; H.push(u); draw(u);
      const typing = UI.h(`<div class="mr b"><span class="av">${Icons.get('bot', 20)}</span><div class="mc"><div class="m b"><div class="dots"><i></i><i></i><i></i></div></div></div></div>`); M.append(typing); M.scrollTop = M.scrollHeight;
      let a;
      try { [a] = await Promise.all([Bot.ask(t, me), new Promise(r => setTimeout(r, Store.settings().typing ? 800 : 0))]); }
      catch (e) { console.error(e); a = { status: 'error', text: 'Maaf, terjadi gangguan pada chatbot. Silakan coba lagi.', src: [] }; }
      finally { typing.remove(); }
      const m = { r: 'b', t: a.text, src: a.src, ts: Date.now() }; H.push(m); draw(m); Store.s(key, H.slice(-100));
      const L = Store.arr('logs'); L.push({ id: Date.now(), ts: new Date().toISOString(), user: me.id, name: me.name, q: t, status: a.status, src: (a.src || []).map(s => s.title) });
      Store.s('logs', L.slice(-500)); S.disabled = false; Q.focus();
    }
    F.onsubmit = e => { e.preventDefault(); send(Q.value); };
    if (arg && arg.ask) { const q = arg.ask; arg.ask = null; send(q); } else Q.focus();
  }

  function docsPage(b) {
    const D = docsOn(), cats = ['Semua', ...new Set(D.map(d => d.cat))]; let cat = 'Semua', q = '';
    b.innerHTML = `<input class="in" id="sq" placeholder="Cari dokumen…"><div class="tabs">${cats.map((c, i) => `<button class="tab ${i ? '' : 'on'}" data-c="${UI.esc(c)}">${UI.esc(c)}</button>`).join('')}</div><div class="col" id="dl"></div>`;
    const draw = () => {
      const R = D.filter(d => (cat === 'Semua' || d.cat === cat) && (d.title + ' ' + d.content).toLowerCase().includes(q));
      UI.$('#dl', b).innerHTML = R.map(d => `<details><summary>${UI.esc(d.title)} <span class="badge gray">${UI.esc(d.cat)}</span></summary><p>${UI.esc(d.content)}</p><div class="muted">Berlaku: ${UI.esc(d.date)}</div></details>`).join('') || '<div class="card muted">Tidak ada dokumen yang cocok.</div>';
    };
    UI.$('#sq', b).oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
    b.querySelectorAll('.tab').forEach(t => t.onclick = () => { cat = t.dataset.c; b.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t)); draw(); });
    draw();
  }

  function help(b) {
    const S = [['Ketik pertanyaan', 'Tulis di menu Chatbot atau klik topik cepat.'], ['Baca jawabannya', 'Jawaban disertai nama dokumen sumber dan tanggal berlaku.'], ['Bot tidak tahu?', 'Pertanyaan dicatat otomatis agar admin menambah dokumennya.']];
    const E = [['bot', 'Anda berbicara dengan AI, bukan petugas manusia.'], ['user', 'Bot tidak mengakses nilai, tagihan, atau data pribadi.'], ['help', 'Jangan mengetik data sensitif seperti password atau NIK.'], ['doc', 'Untuk keputusan penting, konfirmasi ke bagian akademik.']];
    b.innerHTML = `<h3 class="sec">CARA MEMAKAI</h3><div class="steps">${S.map(([t, d], i) => `<div class="card"><span class="num">${i + 1}</span><br><b>${t}</b><br><span class="muted">${d}</span></div>`).join('')}</div>
      <h3 class="sec">ETIKA &amp; PRIVASI</h3><div class="steps">${E.map(([i, t]) => `<div class="card row">${Icons.get(i, 24)}<span>${t}</span></div>`).join('')}</div>`;
  }

  Desk.init({ user: me, apps: [
    { id: 'home', label: 'Beranda', icon: 'home', render: home },
    { id: 'chat', label: 'Chatbot', icon: 'chat', title: 'CHATBOT AKADEMIK', render: chat },
    { id: 'docs', label: 'Dokumen', icon: 'folder', title: 'DOKUMEN AKADEMIK', render: docsPage },
    { id: 'help', label: 'Panduan', icon: 'help', title: 'PANDUAN & ETIKA', render: help },
    { id: 'set', label: 'Pengaturan', icon: 'gear', render: UI.settingsPage },
    { id: 'trash', label: 'Sampah', icon: 'trash', action: () => UI.confirm('Hapus seluruh riwayat percakapan Anda?', () => { Store.del(key); if (Desk.cur === 'chat') Desk.refresh(); UI.toast('Riwayat dihapus'); }) },
    { id: 'out', label: 'Keluar', icon: 'power', danger: true, action: Desk.logout }
  ] });
}
