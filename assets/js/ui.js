/* UI: helper, toast, modal, halaman pengaturan, dan Desk (shell: sidebar + satu panel utama) */
const UI = {
  $: (s, r = document) => r.querySelector(s),
  h(s) { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; },
  esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  toast(msg, type = '') { if (!document.body) return; document.querySelectorAll('.toast').forEach(x => x.remove()); const t = UI.h(`<div class="toast ${type}">${UI.esc(msg)}</div>`); document.body.append(t); setTimeout(() => t.remove(), 2600); },
  modal({ title, body, ok = 'OK', cancel, onOk }) {
    const ov = UI.h(`<div class="ov"><section class="win st active" style="width:min(340px,92vw)"><header class="tb"><span class="t">${UI.esc(title)}</span></header>
      <div class="wb"><div>${body}</div><div class="row end"><button class="btn" data-ok>${ok}</button>${cancel ? `<button class="btn gray" data-no>${cancel}</button>` : ''}</div></div></section></div>`);
    const close = () => { ov.remove(); document.removeEventListener('keydown', esc); }, esc = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    UI.$('[data-no]', ov)?.addEventListener('click', close);
    UI.$('[data-ok]', ov).onclick = () => { close(); onOk && onOk(); };
    document.body.append(ov); UI.$('[data-ok]', ov).focus(); return ov;
  },
  confirm: (msg, onOk) => UI.modal({ title: 'Confirm Action?', body: UI.esc(msg), ok: 'OK', cancel: 'Cancel', onOk }),
  run(fn) { try { return fn(); } catch (e) { console.error(e); UI.toast('Terjadi kesalahan: ' + (e.message || e), 'err'); } },
  applySettings() { document.body.classList.toggle('no-crt', !Store.settings().crt); },
  boot() {
    UI.applySettings();
    const c = UI.$('#clock');
    if (c) { const t = () => c.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); t(); setInterval(t, 15000); }
    document.querySelectorAll('[data-i]').forEach(e => e.innerHTML = Icons.get(e.dataset.i, +e.dataset.s || 14));
  },
  settingsPage(b) {
    const s = Store.settings();
    b.innerHTML = `<div class="card col">${[['crt', 'Efek scanline CRT', 'Garis halus bergaya monitor tabung'], ['typing', 'Animasi mengetik chatbot', 'Bot "berpikir" sebentar sebelum menjawab'], ['src', 'Tampilkan sumber jawaban', 'Nama dokumen di bawah tiap jawaban']]
      .map(([k, l, d]) => `<label class="ck"><input type="checkbox" data-k="${k}" ${s[k] ? 'checked' : ''}><span><b>${l}</b><br><span class="muted">${d}</span></span></label>`).join('')}</div><div class="muted">Pengaturan disimpan di browser ini.</div>`;
    b.querySelectorAll('[data-k]').forEach(i => i.onchange = () => { const n = Store.settings(); n[i.dataset.k] = i.checked; Store.s('settings', n); UI.applySettings(); UI.toast('Pengaturan disimpan'); });
  }
};

/* Desk: setiap menu = satu halaman di panel utama (tanpa jendela bertumpuk). Mendukung tombol Back browser lewat #hash. */
const Desk = {
  apps: [], cur: null, arg: null,
  logout() { UI.modal({ title: 'Konfirmasi Keluar', body: 'Apakah Anda yakin ingin keluar dari sistem?', ok: 'Ya, keluar', cancel: 'Batal', onOk: Auth.logout }); },
  init({ user, apps }) {
    UI.boot();
    const nav = UI.$('#nav'), body = UI.$('#pbody');
    if (!nav || !body || !UI.$('#ptitle')) return Boot.fatal('Struktur halaman rusak', 'Elemen dashboard tidak ditemukan pada file HTML.');
    Desk.apps = apps;
    UI.$('#me').innerHTML = `<span class="av">${Icons.get('user', 22)}</span><div><b>${UI.esc(user.name)}</b><span class="r">${user.role === 'admin' ? 'Administrator' : 'NIM ' + UI.esc(user.id)}</span></div>`;
    let firstAct = true;
    apps.filter(a => !a.hide).forEach(a => {
      const cls = ['nv', a.action && firstAct ? 'first-act' : '', a.danger ? 'red' : ''].join(' ');
      if (a.action) firstAct = false;
      const b = UI.h(`<button class="${cls}" data-id="${a.id}">${Icons.get(a.icon, 20)}<span>${a.label}</span></button>`);
      b.onclick = () => a.action ? UI.run(a.action) : Desk.go(a.id);
      nav.append(b);
    });
    window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id && id !== Desk.cur) Desk.go(id, null, true); });
    const h = location.hash.slice(1), first = apps.find(a => a.id === h && !a.hide && !a.action) || apps.find(a => !a.action);
    Desk.go(first.id, null, true); Desk.bootScreen();
  },
  go(id, arg, fromHash) {
    const a = Desk.apps.find(x => x.id === id && !x.action); if (!a) return;
    Desk.cur = id; Desk.arg = arg || null;
    UI.$('#ptitle').textContent = a.title || a.label.toUpperCase(); UI.$('#pico').innerHTML = Icons.get(a.icon, 14);
    document.querySelectorAll('.nv').forEach(n => n.classList.toggle('on', n.dataset.id === (a.parent || id)));
    const b = UI.$('#pbody'); b.className = 'wb'; b.style.padding = ''; b.innerHTML = ''; void b.offsetWidth; b.classList.add('enter'); b.scrollTop = 0;
    try { a.render(b, Desk.arg); } catch (e) {
      console.error(e); b.innerHTML = `<div class="card"><b>Halaman gagal dimuat</b><div class="muted">${UI.esc(e.message)}</div></div><button class="btn sm" id="rt">Coba lagi</button>`; UI.$('#rt', b).onclick = () => Desk.refresh();
    }
    if (!a.hide && !fromHash && location.hash.slice(1) !== id) { try { history.pushState(null, '', '#' + id); } catch (_) {} }
  },
  refresh() { if (Desk.cur) Desk.go(Desk.cur, Desk.arg, true); },
  bootScreen() {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const o = UI.h(`<div class="boot"><section class="win st active" style="width:min(360px,90vw)"><header class="tb"><span class="t">MEMUAT SISTEM</span></header><div class="wb"><div class="px" style="font-size:9px">RETRO-OS AKADEMIK</div><div class="bar"><i></i></div><div class="muted">Menyiapkan dashboard…</div></div></section></div>`);
    document.body.append(o); const i = UI.$('i', o); let p = 0;
    const iv = setInterval(() => { p += 25; i.style.width = p + '%'; if (p >= 100) { clearInterval(iv); o.style.opacity = 0; setTimeout(() => o.remove(), 260); } }, 90);
  }
};
