/* HALAMAN LOGIN: tab Mahasiswa (NIM) / Admin (email), validasi input, pesan error yang jelas */
(async () => {
  if (!Boot.need(['SEED', 'CONFIG', 'Icons', 'Store', 'UI', 'Auth'])) return;
  try { UI.boot(); await Store.init(); } catch (e) { return Boot.fatal('Gagal memulai', 'Penyimpanan data tidak dapat disiapkan: ' + UI.esc(e.message)); }
  const m = Auth.me(); if (m) { location.replace(m.role + '/dashboard.html'); return; }
  let role = 'student', busy = false; const $ = UI.$, id = $('#id'), pw = $('#pw');
  const setRole = r => {
    role = r; document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.r === r));
    const s = r === 'student'; $('#idl').textContent = s ? 'NIM' : 'EMAIL'; id.type = s ? 'text' : 'email'; id.value = ''; pw.value = '';
    id.maxLength = s ? 12 : 100; id.placeholder = s ? 'contoh: 2409106025' : 'contoh: admin@unmul.ac.id';
    $('#hint').innerHTML = '<b class="px" style="font-size:8px">AKUN DEMO</b><br>' + (s ? 'NIM <b>2409106025</b> · password <b>unmul123</b>' : 'Email <b>admin@unmul.ac.id</b> · password <b>admin123</b>');
  };
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => setRole(t.dataset.r)); setRole('student');
  $('#form').onsubmit = async e => {
    e.preventDefault(); if (busy) return;
    const v = id.value.trim(), bad = msg => UI.modal({ title: 'Input Tidak Valid', body: UI.esc(msg) });
    if (role === 'student' && !/^\d{8,12}$/.test(v)) return bad('NIM harus berupa angka (8–12 digit).');
    if (role === 'admin' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return bad('Format email tidak valid.');
    if (!pw.value) return bad('Password wajib diisi.');
    const b = $('#go'), pb = $('#pb'), bar = pb.firstElementChild; busy = true; b.disabled = true; pb.hidden = false; bar.style.width = '40%';
    let r; try { r = await Auth.login(role, v, pw.value); } catch (err) { console.error(err); r = { err: 'sys' }; }
    const fail = msg => { busy = false; b.disabled = false; pb.hidden = true; bar.style.width = 0; pw.value = ''; UI.modal({ title: 'Login Gagal', body: UI.esc(msg) }); };
    if (r.err === 'locked') return fail('Terlalu banyak percobaan gagal. Coba lagi dalam ' + r.wait + ' detik.');
    if (r.err === 'session') return fail('Browser memblokir penyimpanan sesi. Aktifkan penyimpanan situs atau jangan gunakan mode private.');
    if (r.err === 'net') return fail('Tidak dapat terhubung ke database. Periksa koneksi internet lalu coba lagi.');
    if (r.err === 'bad') return fail((role === 'student' ? 'NIM' : 'Email') + ' atau password salah.');
    if (r.err) return fail('Terjadi kesalahan sistem. Muat ulang halaman lalu coba lagi.');
    bar.style.width = '100%'; UI.toast('Selamat datang, ' + r.user.name); setTimeout(() => location.href = role + '/dashboard.html', 500);
  };
})();
