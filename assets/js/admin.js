/* DASHBOARD ADMIN: Ringkasan, Dokumen (CRUD), Log Pertanyaan, Mahasiswa, Pengaturan + Keluar */
const me = Boot.need(['SEED', 'Store', 'UI', 'Desk', 'Auth', 'Icons']) ? Auth.require('admin') : null;
if (me) {
  const fmt = s => new Date(s).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  const ST = { ok: ['Terjawab', ''], none: ['Belum terjawab', 'red'], scope: ['Di luar lingkup', 'gray'], error: ['Error sistem', 'red'] };
  const badge = s => { const t = ST[s] || ['Tidak diketahui', 'gray']; return `<span class="badge ${t[1]}">${t[0]}</span>`; };
  const students = () => Store.arr('users').filter(u => u.role === 'student');
  const stat = (n, l) => `<div class="card"><b class="px">${n}</b><span class="muted">${l}</span></div>`;

  function dash(b) {
    const L = Store.arr('logs'), D = Store.arr('docs'), cnt = s => L.filter(l => l.status === s).length, ok = cnt('ok'), no = cnt('none'), oth = L.length - ok - no, pct = L.length ? Math.round(ok / L.length * 100) : 0;
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
    const counts = days.map(d => L.filter(l => new Date(l.ts).toDateString() === d.toDateString()).length), mx = Math.max(1, ...counts), N = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const seg = (n, c) => L.length ? `<i style="width:${n / L.length * 100}%;background:${c}"></i>` : '';
    const todo = L.filter(l => l.status === 'none').slice(-5).reverse(), recent = L.slice(-5).reverse();
    b.innerHTML = `<div class="hero"><div><h2 class="px">PANEL ADMIN</h2><p>Pantau pertanyaan mahasiswa dan kelola dokumen sumber jawaban chatbot.</p><button class="btn" id="gd">Kelola dokumen →</button></div><div class="herobot">${Icons.get('chart', 72)}</div></div>
      <div class="stats">${stat(L.length, 'Pertanyaan')}${stat(no, 'Belum terjawab')}${stat(D.filter(d => d.active).length + '/' + D.length, 'Dokumen aktif')}${stat(students().length, 'Mahasiswa')}</div>
      <div class="grid2"><div class="col"><h3 class="sec">PERTANYAAN 7 HARI TERAKHIR</h3>
        <div class="chart">${counts.map((c, i) => `<div class="cc"><span>${c}</span><i style="height:${Math.round(c / mx * 70)}px"></i><span class="muted">${N[days[i].getDay()]}</span></div>`).join('')}</div>
        <h3 class="sec">KUALITAS JAWABAN — ${pct}% TERJAWAB</h3><div class="seg">${seg(ok, 'var(--blue)')}${seg(no, 'var(--red)')}${seg(oth, 'var(--gray)')}</div>
        <div class="row muted" style="gap:12px;flex-wrap:wrap"><span><b style="color:var(--blue)">■</b> Terjawab ${ok}</span><span><b style="color:var(--red)">■</b> Belum ${no}</span><span><b style="color:var(--gray)">■</b> Lainnya ${oth}</span></div></div>
      <div class="col"><h3 class="sec">PERLU DITINDAKLANJUTI</h3><div class="scroll" style="flex:none">${todo.map(l => `<div class="li"><div>${UI.esc(l.q)}<br><span class="muted">${UI.esc(l.name)} · ${fmt(l.ts)}</span></div><button class="btn sm" data-a="${l.id}">+ Dokumen</button></div>`).join('') || '<p class="muted pad">Semua pertanyaan terjawab</p>'}</div>
        <h3 class="sec">TERBARU</h3><div class="scroll" style="flex:none">${recent.map(l => `<div class="li"><div>${UI.esc(l.q)}<br><span class="muted">${UI.esc(l.name)} · ${fmt(l.ts)}</span></div>${badge(l.status)}</div>`).join('') || '<p class="muted pad">Belum ada pertanyaan.</p>'}</div></div></div>
      <div class="row end"><button class="btn red sm" id="rs">Bersihkan data lokal</button></div>`;
    UI.$('#gd', b).onclick = () => Desk.go('docs');
    b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => { const l = L.find(l => l.id == x.dataset.a); if (l) Desk.go('ed', { doc: { title: l.q, cat: 'Umum' } }); });
    UI.$('#rs', b).onclick = () => UI.confirm('Pengaturan dan riwayat chat di browser ini dibersihkan, lalu Anda keluar. Data di database tidak dihapus. Lanjutkan?', () => { Store.reset(); Auth.logout(); });
  }

  function docs(b) {
    b.innerHTML = `<div class="row" style="flex-wrap:wrap"><input class="in" id="sq" placeholder="Cari dokumen…" style="flex:1 1 180px"><button class="btn" id="nw">+ Dokumen baru</button></div><div class="muted">Dokumen aktif menjadi sumber jawaban chatbot.</div><div class="scroll" id="tw"></div>`;
    let q = '';
    const draw = () => {
      const D = Store.arr('docs').filter(d => (d.title + ' ' + d.cat).toLowerCase().includes(q)), w = UI.$('#tw', b);
      w.innerHTML = `<table class="tbl"><tr><th>Judul</th><th>Kategori</th><th>Berlaku</th><th>Aktif</th><th></th></tr>${D.map(d => `<tr><td>${UI.esc(d.title)}</td><td>${UI.esc(d.cat)}</td><td class="nw">${UI.esc(d.date)}</td>
        <td><label class="ck"><input type="checkbox" data-t="${UI.esc(d.id)}" ${d.active ? 'checked' : ''}></label></td><td class="nw"><button class="btn gray sm" data-e="${UI.esc(d.id)}">Edit</button> <button class="btn red sm" data-d="${UI.esc(d.id)}">Hapus</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Tidak ada dokumen.</td></tr>'}</table>`;
      w.querySelectorAll('[data-t]').forEach(c => c.onchange = () => { const A = Store.arr('docs'), x = A.find(x => x.id === c.dataset.t); if (!x) return UI.toast('Dokumen tidak ditemukan', 'err'); x.active = c.checked; Store.s('docs', A); UI.toast(c.checked ? 'Dokumen diaktifkan' : 'Dokumen dinonaktifkan'); });
      w.querySelectorAll('[data-e]').forEach(x => x.onclick = () => { const d = Store.arr('docs').find(d => d.id === x.dataset.e); if (d) Desk.go('ed', { doc: d }); });
      w.querySelectorAll('[data-d]').forEach(x => x.onclick = () => UI.confirm('Hapus dokumen ini?', () => { Store.s('docs', Store.arr('docs').filter(d => d.id !== x.dataset.d)); draw(); UI.toast('Dokumen dihapus'); }));
    };
    UI.$('#sq', b).oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
    UI.$('#nw', b).onclick = () => Desk.go('ed', {});
    draw();
  }

  function editor(b, arg) {
    const d = (arg && arg.doc) || {};
    b.innerHTML = `<form class="col card"><div><label class="l">JUDUL</label><input class="in" name="title" required value="${UI.esc(d.title || '')}"></div>
      <div class="row"><div style="flex:1"><label class="l">KATEGORI</label><select class="in" name="cat">${['Akademik', 'Administrasi', 'Keuangan', 'Umum'].map(c => `<option ${c === d.cat ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div style="flex:1"><label class="l">TANGGAL BERLAKU</label><input class="in" type="date" name="date" value="${UI.esc(d.date || new Date().toISOString().slice(0, 10))}"></div></div>
      <div><label class="l">ISI (pisahkan paragraf dengan baris kosong)</label><textarea class="in" name="content" rows="10" required>${UI.esc(d.content || '')}</textarea></div>
      <label class="ck"><input type="checkbox" name="active" ${d.active !== false ? 'checked' : ''}> Aktif untuk chatbot</label>
      <div class="row end"><button class="btn">Simpan</button><button type="button" class="btn gray" data-x>Batal</button></div></form>`;
    UI.$('[data-x]', b).onclick = () => Desk.go('docs');
    UI.$('form', b).onsubmit = e => {
      e.preventDefault(); const f = new FormData(e.target), A = Store.arr('docs');
      const ti = String(f.get('title')).trim(), co = String(f.get('content')).trim(), dt = String(f.get('date'));
      if (ti.length < 3 || ti.length > 120) return UI.toast('Judul harus 3–120 karakter', 'err');
      if (co.length < 10 || co.length > 5000) return UI.toast('Isi dokumen harus 10–5000 karakter', 'err');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dt) || isNaN(Date.parse(dt))) return UI.toast('Tanggal berlaku tidak valid', 'err');
      const rec = { id: d.id || 'd' + Date.now(), title: ti, cat: f.get('cat'), date: dt, content: co, active: !!f.get('active') };
      const i = A.findIndex(x => x.id === rec.id); i < 0 ? A.push(rec) : A[i] = rec; Store.s('docs', A);
      UI.toast('Dokumen tersimpan'); Desk.go('docs');
    };
  }

  function logs(b) {
    let f = 'all', q = '';
    b.innerHTML = `<div class="row" style="flex-wrap:wrap"><input class="in" id="sq" placeholder="Cari pertanyaan / nama…" style="flex:1 1 180px"><button class="btn gray" id="csv">Ekspor CSV</button></div>
      <div class="tabs"><button class="tab on" data-f="all">Semua</button><button class="tab" data-f="none">Belum terjawab</button></div><div class="scroll" id="lg"></div>`;
    const draw = () => {
      const L = Store.arr('logs').filter(l => (f === 'all' || l.status === 'none') && (String(l.q) + ' ' + String(l.name)).toLowerCase().includes(q)).reverse(), w = UI.$('#lg', b);
      w.innerHTML = `<table class="tbl"><tr><th>Waktu</th><th>Mahasiswa</th><th>Pertanyaan</th><th>Status</th><th></th></tr>${L.map(l => `<tr><td class="nw">${fmt(l.ts)}</td><td>${UI.esc(l.name)}</td><td>${UI.esc(l.q)}</td><td>${badge(l.status)}</td>
        <td>${l.status === 'none' ? `<button class="btn sm" data-a="${l.id}">+ Dokumen</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Belum ada data.</td></tr>'}</table>`;
      w.querySelectorAll('[data-a]').forEach(x => x.onclick = () => { const l = L.find(l => l.id == x.dataset.a); if (l) Desk.go('ed', { doc: { title: l.q, cat: 'Umum' } }); });
    };
    UI.$('#sq', b).oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
    b.querySelectorAll('[data-f]').forEach(t => t.onclick = () => { f = t.dataset.f; b.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === t)); draw(); });
    UI.$('#csv', b).onclick = () => {
      const L = Store.arr('logs'); if (!L.length) return UI.toast('Belum ada data untuk diekspor', 'err');
      const q = s => { s = String(s ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
      const rows = [['waktu', 'nim', 'nama', 'pertanyaan', 'status'], ...L.map(l => [l.ts, l.user, l.name, l.q, l.status])];
      const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'log-chatbot.csv'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    draw();
  }

  function stu(b) {
    b.innerHTML = `<form class="row card" style="flex-wrap:wrap"><input class="in" name="id" placeholder="NIM" pattern="[0-9]{8,12}" required style="flex:1 1 110px"><input class="in" name="name" placeholder="Nama" required style="flex:2 1 150px">
      <input class="in" name="pw" type="password" placeholder="Password (min 6)" minlength="6" required style="flex:1 1 130px"><button class="btn">Tambah</button></form>
      <div class="scroll"><table class="tbl"><tr><th>NIM</th><th>Nama</th><th></th></tr>${students().map(u => `<tr><td>${UI.esc(u.id)}</td><td>${UI.esc(u.name)}</td><td><button class="btn red sm" data-d="${UI.esc(u.id)}">Hapus</button></td></tr>`).join('')}</table></div>`;
    UI.$('form', b).onsubmit = async e => {
      e.preventDefault(); const btn = UI.$('.btn', e.target); if (btn.disabled) return;
      const f = new FormData(e.target), U = Store.arr('users'), id = String(f.get('id')).trim(), nm = String(f.get('name')).trim(), pw = String(f.get('pw'));
      if (!/^\d{8,12}$/.test(id)) return UI.toast('NIM harus 8–12 digit angka', 'err');
      if (nm.length < 3 || nm.length > 80) return UI.toast('Nama harus 3–80 karakter', 'err');
      if (pw.length < 6 || pw.length > 64) return UI.toast('Password harus 6–64 karakter', 'err');
      if (U.some(u => u.id === id)) return UI.toast('NIM sudah terdaftar', 'err');
      btn.disabled = true;
      const r = await Store.addUser(id, nm, pw);
      if (r.err) { btn.disabled = false; return UI.toast(r.err === 'exists' ? 'Akun NIM ini sudah ada di Firebase dengan password lain' : r.err === 'weak' ? 'Password terlalu lemah (min 6 karakter)' : 'Gagal menambah akun', 'err'); }
      UI.toast('Mahasiswa ditambahkan'); Desk.refresh();
    };
    b.querySelectorAll('[data-d]').forEach(x => x.onclick = () => UI.confirm('Hapus akun mahasiswa ' + x.dataset.d + '?', () => { Store.s('users', Store.arr('users').filter(u => u.id !== x.dataset.d)); Store.del('chat_' + x.dataset.d); UI.toast('Akun dihapus'); Desk.refresh(); }));
  }

  Store.init().then(() => Desk.init({ user: me, apps: [
    { id: 'dash', label: 'Ringkasan', icon: 'chart', title: 'RINGKASAN', render: dash },
    { id: 'docs', label: 'Dokumen', icon: 'folder', title: 'DOKUMEN AKADEMIK', render: docs },
    { id: 'logs', label: 'Log', icon: 'doc', title: 'LOG PERTANYAAN', render: logs },
    { id: 'stu', label: 'Mahasiswa', icon: 'users', title: 'AKUN MAHASISWA', render: stu },
    { id: 'set', label: 'Pengaturan', icon: 'gear', render: UI.settingsPage },
    { id: 'ed', label: 'Editor', icon: 'doc', title: 'EDITOR DOKUMEN', hide: true, parent: 'docs', render: editor },
    { id: 'out', label: 'Keluar', icon: 'power', danger: true, action: Desk.logout }
  ] })).catch(e => { console.error(e); Boot.fatal('Gagal memuat data', 'Database tidak dapat dihubungi: ' + UI.esc(e.message)); });
}
