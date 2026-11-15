/* PENYIMPANAN: Firestore untuk users/docs/logs (cache memori + tulis otomatis ke cloud).
   Kunci lain (settings, lock, riwayat chat, dll.) tetap di localStorage (prefix "rc_"). */
const Store = {
  mem: {}, ok: null,
  CLOUD: ['users', 'docs', 'logs'],
  cache: {}, snap: {}, fb: null, user: null, profile: null, q: Promise.resolve(),

  can() { if (this.ok !== null) return this.ok; try { localStorage.setItem('rc__t', '1'); localStorage.removeItem('rc__t'); this.ok = true; } catch (e) { this.ok = false; } return this.ok; },
  g(k, d) {
    if (this.CLOUD.includes(k)) { const v = this.cache[k]; return v === undefined ? d : v; }
    try { const v = k in this.mem ? this.mem[k] : (this.can() ? localStorage.getItem('rc_' + k) : null); return v ? JSON.parse(v) : d; } catch (e) { return d; }
  },
  arr(k) { const a = this.g(k, []); return Array.isArray(a) ? a.filter(x => x && typeof x === 'object') : []; },
  s(k, v) {
    if (this.CLOUD.includes(k)) return this.sync(k, v);
    let j; try { j = JSON.stringify(v); } catch (e) { return false; }
    try { if (!this.can()) throw 0; localStorage.setItem('rc_' + k, j); delete this.mem[k]; return true; }
    catch (e) { this.mem[k] = j; if (typeof UI !== 'undefined') UI.toast('Penyimpanan browser penuh/diblokir. Data hanya tersimpan sementara.', 'err'); return false; }
  },
  del(k) { if (this.CLOUD.includes(k)) return; delete this.mem[k]; try { localStorage.removeItem('rc_' + k); } catch (e) {} },
  settings() { const s = this.g('settings', {}) || {}, o = { crt: true, typing: true, src: true }; for (const k in o) if (typeof s[k] === 'boolean') o[k] = s[k]; return o; },
  fallback(t) { let h = 5381; for (const c of t) h = (h * 33) ^ c.charCodeAt(0); return 'x' + (h >>> 0).toString(16); },
  async hashes(t) {
    const out = [this.fallback(t)];
    try { if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); out.unshift([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')); } } catch (e) {}
    return out;
  },
  async hash(t) { return (await this.hashes(t))[0]; },
  newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },

  /* ---------- Firebase ---------- */
  fbInit() {
    return this._fbp || (this._fbp = (async () => {
      const b = 'https://www.gstatic.com/firebasejs/' + CONFIG.FIREBASE_VER + '/';
      const [P, A, F] = await Promise.all([import(b + 'firebase-app.js'), import(b + 'firebase-auth.js'), import(b + 'firebase-firestore.js')]);
      const app = P.initializeApp(CONFIG.FIREBASE), auth = A.getAuth(app);
      try { await A.setPersistence(auth, A.browserSessionPersistence); } catch (e) {}
      this.fb = { P, A, F, app, auth, db: F.getFirestore(app) };
      return this.fb;
    })().catch(e => { this._fbp = null; throw e; }));
  },
  run(fn) {
    this.q = this.q.then(fn).catch(e => {
      console.error('Firestore:', e);
      if (typeof UI !== 'undefined') UI.toast('Gagal menyimpan ke database: ' + (e.code || e.message), 'err');
    });
  },
  mark(k) { this.snap[k] = new Map((this.cache[k] || []).map(x => [String(x.id), { j: JSON.stringify(x), ref: k === 'users' ? x.uid : String(x.id) }])); },

  /* Muat profil + data setelah login. Mengembalikan profil, atau null bila profil tidak ada. */
  async load(user) {
    const { F, db, A, auth } = this.fb;
    const ps = await F.getDoc(F.doc(db, 'users', user.uid));
    if (!ps.exists()) { await A.signOut(auth); this.cache = {}; this.user = this.profile = null; return null; }
    const p = ps.data(), me = { id: p.id, role: p.role, name: p.name, uid: user.uid }, admin = p.role === 'admin';
    const rd = async q => (await F.getDocs(q)).docs.map(d => ({ ...d.data() }));
    const logsQ = admin ? F.collection(db, 'logs') : F.query(F.collection(db, 'logs'), F.where('uid', '==', user.uid));
    const [docs, logs] = await Promise.all([rd(F.collection(db, 'docs')), rd(logsQ)]);
    let users = [me];
    if (admin) users = (await F.getDocs(F.collection(db, 'users'))).docs.map(d => ({ ...d.data(), uid: d.id }));
    this.cache = { docs, logs, users };
    this.CLOUD.forEach(k => this.mark(k));
    this.user = user; this.profile = me;
    return me;
  },
  /* Dipanggil di awal setiap halaman dashboard: await Store.init() */
  init() {
    return this._ready || (this._ready = (async () => {
      const f = await this.fbInit();
      const user = await new Promise(res => { const un = f.A.onAuthStateChanged(f.auth, u => { un(); res(u); }); });
      let me = null;
      if (user) me = await this.load(user);
      if (!me && /\/(student|admin)\//.test(location.pathname)) location.replace(Auth.root() + 'index.html');
    })().catch(e => { this._ready = null; throw e; }));
  },

  /* Tulis perubahan array (users/docs/logs) ke Firestore berdasarkan selisih dengan kondisi sebelumnya. */
  sync(k, v) {
    if (!Array.isArray(v)) return false;
    const prev = this.snap[k] || new Map(), next = [];
    for (const x of v) {
      if (!x || typeof x !== 'object') continue;
      if (!x.id) x.id = this.newId();
      if (k === 'logs' && !x.uid && this.user) x.uid = this.user.uid;
      next.push(x);
    }
    this.cache[k] = next;
    if (!this.fb || !this.user) return false;
    const { F, db } = this.fb, ops = [], ids = new Set();
    for (const x of next) {
      const id = String(x.id); ids.add(id);
      if (k === 'users') continue; // akun dibuat lewat Store.addUser
      if (!prev.has(id) || prev.get(id).j !== JSON.stringify(x)) ops.push(() => F.setDoc(F.doc(db, k, id), JSON.parse(JSON.stringify(x))));
    }
    for (const [id, o] of prev) if (!ids.has(id)) ops.push(() => F.deleteDoc(F.doc(db, k, o.ref)));
    this.mark(k);
    ops.forEach(op => this.run(op));
    return true;
  },

  /* Admin menambah akun mahasiswa: buat akun Auth lewat app kedua supaya admin tidak ikut logout. */
  async addUser(nim, name, pass) {
    const { P, A, F, db } = this.fb;
    if (!this.profile || this.profile.role !== 'admin') return { err: 'forbidden' };
    const email = nim + '@' + CONFIG.STUDENT_DOMAIN, sec = P.initializeApp(CONFIG.FIREBASE, 'sec' + Date.now()), sa = A.getAuth(sec);
    let uid;
    try {
      try { uid = (await A.createUserWithEmailAndPassword(sa, email, pass)).user.uid; }
      catch (e) {
        if (e.code === 'auth/email-already-in-use') { try { uid = (await A.signInWithEmailAndPassword(sa, email, pass)).user.uid; } catch (e2) { return { err: 'exists' }; } }
        else if (e.code === 'auth/weak-password') return { err: 'weak' };
        else throw e;
      }
      await F.setDoc(F.doc(db, 'users', uid), { id: nim, role: 'student', name });
      const u = { id: nim, role: 'student', name, uid };
      this.cache.users = [...this.arr('users').filter(x => x.id !== nim), u]; this.mark('users');
      return { user: u };
    } catch (e) { console.error(e); return { err: 'fail' }; }
    finally { try { await A.signOut(sa); await P.deleteApp(sec); } catch (e) {} }
  },

  /* Hanya membersihkan data lokal (pengaturan, riwayat chat, sesi). Data cloud TIDAK dihapus. */
  reset() { try { Object.keys(localStorage).filter(k => k.startsWith('rc_')).forEach(k => localStorage.removeItem(k)); sessionStorage.removeItem('rc_session'); } catch (e) {} this.mem = {}; }
};
