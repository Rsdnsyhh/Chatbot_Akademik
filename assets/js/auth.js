/* AUTENTIKASI (demo, sisi klien): validasi input, batas percobaan gagal, sesi kedaluwarsa 8 jam. */
const Auth = {
  root() { return /\/(student|admin)\//.test(location.pathname) ? '../' : ''; },
  async login(role, id, pass) {
    id = String(id || '').trim().slice(0, 100); pass = String(pass || '').slice(0, 200);
    if (!id || !pass || !['student', 'admin'].includes(role)) return { err: 'empty' };
    const lk = Store.g('lock', null) || { n: 0, until: 0 };
    if (Date.now() < lk.until) return { err: 'locked', wait: Math.ceil((lk.until - Date.now()) / 1000) };
    await Store.init();
    const hs = await Store.hashes(pass);
    const u = Store.arr('users').find(x => x.role === role && String(x.id).toLowerCase() === id.toLowerCase() && hs.includes(x.hash));
    if (!u) { lk.n = (lk.n || 0) + 1; if (lk.n >= 5) { lk.until = Date.now() + 30000; lk.n = 0; } Store.s('lock', lk); return { err: 'bad' }; }
    Store.s('lock', { n: 0, until: 0 });
    try { sessionStorage.setItem('rc_session', JSON.stringify({ role, id: u.id, name: u.name, t: Date.now() })); } catch (e) { return { err: 'session' }; }
    return { user: u };
  },
  me() {
    try {
      const s = JSON.parse(sessionStorage.getItem('rc_session'));
      if (!s || !s.id || !s.role || Date.now() - (s.t || 0) > 8 * 3600e3) return null;
      return Store.arr('users').some(u => u.id === s.id && u.role === s.role) ? s : null;
    } catch (e) { return null; }
  },
  require(role) {
    const m = Auth.me();
    if (!m || m.role !== role) { location.replace(Auth.root() + 'index.html'); return null; }
    return m;
  },
  logout() { try { sessionStorage.removeItem('rc_session'); } catch (e) {} location.href = Auth.root() + 'index.html'; }
};
