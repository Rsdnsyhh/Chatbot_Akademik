/* PENANGANAN ERROR GLOBAL. Wajib dimuat PERTAMA di setiap halaman. */
const Boot = {
  fatal(title, msg) {
    if (!document.body || document.getElementById('fatal')) return false;
    const d = document.createElement('div'); d.id = 'fatal';
    d.style.cssText = 'position:fixed;inset:0;z-index:100000;display:grid;place-items:center;background:#f0f0f0;font:14px Inter,system-ui,sans-serif;color:#16181d';
    d.innerHTML = `<div style="width:min(460px,92vw);border:1px solid #16181d;border-radius:4px;background:#e6e4de"><div style="background:#e81123;color:#fff;padding:6px 8px;font:bold 12px monospace">⚠ ${title}</div>
      <div style="padding:14px;line-height:1.5">${msg}<br><br><button onclick="location.reload()" style="padding:5px 14px;cursor:pointer">Muat ulang</button></div></div>`;
    document.body.append(d); return false;
  },
  need(names) {
    const miss = names.filter(n => { try { return new Function('return typeof ' + n)() === 'undefined'; } catch (e) { return true; } });
    if (!miss.length) return true;
    return Boot.fatal('Berkas program tidak lengkap', 'Komponen berikut gagal dimuat: <b>' + miss.join(', ') + '</b>.<br>Pastikan seluruh isi folder proyek utuh (jangan memindahkan <code>index.html</code> saja) dan buka lewat Live Server.');
  },
  report(m) {
    m = String(m || 'Kesalahan tidak diketahui'); console.error(m);
    const now = Date.now(); Boot._s = Boot._s || {}; if (Boot._s[m] && now - Boot._s[m] < 3000) return; Boot._s[m] = now;
    if (typeof UI !== 'undefined' && document.body) UI.toast('Terjadi kesalahan, silakan coba lagi.', 'err');
  }
};
window.addEventListener('error', e => {
  const t = e.target;
  if (t && t !== window && t.tagName === 'SCRIPT') return Boot.fatal('Berkas gagal dimuat', 'Tidak dapat memuat <code>' + (t.getAttribute('src') || '?') + '</code>.<br>Periksa apakah file tersebut ada di folder proyek, lalu buka lewat Live Server.');
  if (t && t !== window && t.tagName === 'LINK') return console.warn('Stylesheet/font gagal dimuat:', t.href);
  Boot.report(e.message);
}, true);
window.addEventListener('unhandledrejection', e => { e.preventDefault(); Boot.report(e.reason && e.reason.message || e.reason); });
