/* AUTENTIKASI: Firebase Authentication (email/password). NIM diubah jadi email internal NIM@STUDENT_DOMAIN.
   Tetap ada batas 5 percobaan gagal (kunci 30 detik) dan sesi kedaluwarsa 8 jam. */
const Auth = {
  root() { return /\/(student|admin)\//.test(location.pathname) ? '../' : ''; },
  async login(role, id, pass) {
    id = String(id || '').trim().slice(0, 100); pass = String(pass || '').slice(0, 200);
    if (!id || !pass || !['student', 'admin'].includes(role)) return { err: 'empty' };
    const lk = Store.g('lock', null) || { n: 0, until: 0 };
    if (Date.now() < lk.until) return { err: 'locked', wait: Math.ceil((lk.until - Date.now()) / 1000) };
    const fail = () => { lk.n = (lk.n || 0) + 1; if (lk.n >= 5) { lk.until = Date.now() + 30000; lk.n = 0; } Store.s('lock', lk); return { err: 'bad' }; };

    let f; try { f = await Store.fbInit(); } catch (e) { console.error(e); return { err: 'net' }; }
    const email = role === 'admin' ? id.toLowerCase() : id + '@' + CONFIG.STUDENT_DOMAIN;
    let cred;
    try { cred = await f.A.signInWithEmailAndPassword(f.auth, email, pass); }
    catch (e) {
      if (e.code === 'auth/network-request-failed') return { err: 'net' };
      if (e.code === 'auth/too-many-requests') return { err: 'locked', wait: 60 };
      return fail();
    }
    let me; try { me = await Store.load(cred.user); } catch (e) { console.error(e); try { await f.A.signOut(f.auth); } catch (e2) {} return { err: 'net' }; }
    if (!me || me.role !== role) { try { await f.A.signOut(f.auth); } catch (e) {} return fail(); }
    Store.s('lock', { n: 0, until: 0 });
    try { sessionStorage.setItem('rc_session', JSON.stringify({ role, id: me.id, name: me.name, t: Date.now() })); } catch (e) { return { err: 'session' }; }
    Store._ready = Promise.resolve();
    return { user: me };
  },
  me() {
    try {
      const s = JSON.parse(sessionStorage.getItem('rc_session'));
      if (!s || !s.id || !s.role || Date.now() - (s.t || 0) > 8 * 3600e3) return null;
      return s;
    } catch (e) { return null; }
  },
  require(role) {
    const m = Auth.me();
    if (!m || m.role !== role) { location.replace(Auth.root() + 'index.html'); return null; }
    return m;
  },
  async logout() {
    try { sessionStorage.removeItem('rc_session'); if (Store.fb) await Store.fb.A.signOut(Store.fb.auth); } catch (e) {}
    location.href = Auth.root() + 'index.html';
  }
};
