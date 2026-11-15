/* PENYIMPANAN: localStorage (prefix "rc_") dengan cadangan memori bila browser memblokir/penuh. */
const Store = {
  mem: {}, ok: null,
  can() { if (this.ok !== null) return this.ok; try { localStorage.setItem('rc__t', '1'); localStorage.removeItem('rc__t'); this.ok = true; } catch (e) { this.ok = false; } return this.ok; },
  g(k, d) { try { const v = k in this.mem ? this.mem[k] : (this.can() ? localStorage.getItem('rc_' + k) : null); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  arr(k) { const a = this.g(k, []); return Array.isArray(a) ? a.filter(x => x && typeof x === 'object') : []; },
  s(k, v) {
    let j; try { j = JSON.stringify(v); } catch (e) { return false; }
    try { if (!this.can()) throw 0; localStorage.setItem('rc_' + k, j); delete this.mem[k]; return true; }
    catch (e) { this.mem[k] = j; if (typeof UI !== 'undefined') UI.toast('Penyimpanan browser penuh/diblokir. Data hanya tersimpan sementara.', 'err'); return false; }
  },
  del(k) { delete this.mem[k]; try { localStorage.removeItem('rc_' + k); } catch (e) {} },
  settings() { const s = this.g('settings', {}) || {}, o = { crt: true, typing: true, src: true }; for (const k in o) if (typeof s[k] === 'boolean') o[k] = s[k]; return o; },
  fallback(t) { let h = 5381; for (const c of t) h = (h * 33) ^ c.charCodeAt(0); return 'x' + (h >>> 0).toString(16); },
  async hashes(t) {
    const out = [this.fallback(t)];
    try { if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); out.unshift([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')); } } catch (e) {}
    return out;
  },
  async hash(t) { return (await this.hashes(t))[0]; },
  /* Seed otomatis; data yang rusak/hilang dipulihkan. */
  async init() {
    const hasU = this.arr('users').length, d = this.g('docs', null);
    if (hasU && Array.isArray(d) && this.g('seeded')) return;
    if (!hasU) { const u = []; for (const x of SEED.users) u.push({ id: x.id, role: x.role, name: x.name, hash: await this.hash(x.pass) }); this.s('users', u); }
    if (!Array.isArray(d)) this.s('docs', SEED.docs);
    if (!Array.isArray(this.g('logs', null))) this.s('logs', []);
    this.s('seeded', 1);
  },
  reset() { try { Object.keys(localStorage).filter(k => k.startsWith('rc_')).forEach(k => localStorage.removeItem(k)); sessionStorage.removeItem('rc_session'); } catch (e) {} this.mem = {}; }
};
