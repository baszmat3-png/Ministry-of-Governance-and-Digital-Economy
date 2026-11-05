#!/usr/bin/env node
/*
 * خادم موقع وزارة الاقتصاد الرقمي والحوكمة
 * بلا أي حزم خارجية. يتطلب Node.js الإصدار 16 فما فوق.
 *
 * التشغيل:   ADMIN_PASSWORD="كلمة-مرور-قوية" node server.js
 * المنفذ:    PORT=3000 (الافتراضي)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const UPLOADS = path.join(ROOT, 'uploads');
const PORT = +process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin12345';
const SESSION_MS = 8 * 3600 * 1000;
const CHOICES = [1, 2, 3, 4, 5];

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });

/* ---------- أدوات الملفات ---------- */
const F = {
  content: path.join(DATA, 'content.json'),
  votes: path.join(DATA, 'votes.json'),
  subs: path.join(DATA, 'submissions.json'),
  secret: path.join(DATA, 'secret.key'),
};
function readJSON(file, def) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return def; } }
function writeJSON(file, obj) { const tmp = file + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(obj, null, 1)); fs.renameSync(tmp, file); }
function seed() {
  const t = fs.readFileSync(path.join(DATA, 'content.js'), 'utf8');
  return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
}
let SECRET = ''; try { SECRET = fs.readFileSync(F.secret, 'utf8'); } catch (e) { }
if (!SECRET) { SECRET = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(F.secret, SECRET, { mode: 0o600 }); }
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const hmac = s => crypto.createHmac('sha256', SECRET).update(String(s)).digest('hex');

/* ---------- جلسات الإدارة ---------- */
const sessions = new Map();
function newSession() { const t = crypto.randomBytes(32).toString('hex'); sessions.set(t, Date.now() + SESSION_MS); return t; }
function isAuth(req) {
  const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || ''); if (!m) return false;
  const exp = sessions.get(m[1]); if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(m[1]); return false; }
  return true;
}
setInterval(() => { const n = Date.now(); for (const [t, e] of sessions) if (e < n) sessions.delete(t); }, 600000).unref();

/* ---------- تحديد المعدل ---------- */
const buckets = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(); let b = buckets.get(key);
  if (!b || b.reset < now) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.n++; return b.n > max;
}
setInterval(() => { const n = Date.now(); for (const [k, b] of buckets) if (b.reset < n) buckets.delete(k); }, 600000).unref();
const clientIP = req => (process.env.TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '') || String(req.socket.remoteAddress || '');

/* ---------- الاستجابات ---------- */
const SEC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'",
};
function send(res, code, body, headers = {}) { res.writeHead(code, { ...SEC_HEADERS, ...headers }); res.end(body); }
function json(res, code, obj, headers = {}) { send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); }
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { reject(Object.assign(new Error('too_large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject);
  });
}
async function bodyJSON(req, limit = 1.5e6) {
  const b = await readBody(req, limit);
  try { const o = JSON.parse(b.toString('utf8')); return o; } catch (e) { throw Object.assign(new Error('bad_json'), { status: 400 }); }
}

/* ---------- التصويت ---------- */
function votingOpen() { const c = readJSON(F.content, null); return !(c && c.settings && c.settings.votingOpen === false); }
function voterId(req, res) {
  const m = /(?:^|;\s*)dg_voter=([a-f0-9]{32})/.exec(req.headers.cookie || '');
  if (m) return m[1];
  const id = crypto.randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie', `dg_voter=${id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`);
  return id;
}
function tally(db) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const k in db.votes) counts[db.votes[k].c]++;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const log = db.log || [];
  const days = {}; log.forEach(e => { const d = e.t.slice(0, 10); days[d] = (days[d] || 0) + 1; });
  const daily = Object.keys(days).sort().slice(-14).map(d => ({ d, count: days[d] }));
  return { counts, total, updatedAt: log.length ? log[log.length - 1].t : null, daily, log };
}
function votesView(req, res, full) {
  const db = readJSON(F.votes, { votes: {}, log: [] }), t = tally(db);
  const vid = voterId(req, res), h = hmac(vid), mine = db.votes[h] ? db.votes[h].c : 0;
  const out = { counts: t.counts, total: t.total, mine, myHash: h.slice(0, 8), open: votingOpen(), updatedAt: t.updatedAt, daily: t.daily, ledger: t.log.slice(-20).reverse() };
  if (full) { out.uniqueVoters = Object.keys(db.votes).length; out.changes = t.log.filter(e => e.k === 'change').length; out.ledger = t.log.slice(-100).reverse(); }
  return out;
}

/* ---------- المسارات ---------- */
const SUB_TYPES = ['complaint', 'suggestion', 'inquiry'];
const SUB_STATUS = ['new', 'review', 'done'];
const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
const UP_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' };

async function api(req, res, u) {
  const p = u.pathname, m = req.method, ip = clientIP(req);
  if (p === '/api/ping') return json(res, 200, { ok: true, server: true });

  if (p === '/api/login' && m === 'POST') {
    if (limited('login:' + ip, 10, 600000)) return json(res, 429, { error: 'too_many' });
    const b = await bodyJSON(req, 4096);
    const ok = crypto.timingSafeEqual(Buffer.from(sha(b.password || '')), Buffer.from(sha(ADMIN_PASSWORD)));
    if (!ok) return json(res, 401, { error: 'bad_password' });
    return json(res, 200, { token: newSession() });
  }
  if (p === '/api/logout' && m === 'POST') { const t = /^Bearer (.+)$/.exec(req.headers.authorization || ''); if (t) sessions.delete(t[1]); return json(res, 200, { ok: true }); }
  if (p === '/api/me') return isAuth(req) ? json(res, 200, { ok: true }) : json(res, 401, { error: 'auth' });

  if (p === '/api/content') {
    if (m === 'GET') return json(res, 200, readJSON(F.content, null) || seed());
    if (!isAuth(req)) return json(res, 401, { error: 'auth' });
    if (m === 'PUT') {
      const o = await bodyJSON(req, 2e6);
      if (!o || typeof o !== 'object' || !Array.isArray(o.news) || !o.settings) return json(res, 400, { error: 'bad_content' });
      writeJSON(F.content, o); return json(res, 200, { ok: true });
    }
    if (m === 'DELETE') { try { fs.unlinkSync(F.content); } catch (e) { } return json(res, 200, { ok: true }); }
  }

  if (p === '/api/upload' && m === 'POST') {
    if (!isAuth(req)) return json(res, 401, { error: 'auth' });
    const ct = String(req.headers['content-type'] || '').split(';')[0].trim(), ext = UP_TYPES[ct];
    if (!ext) return json(res, 415, { error: 'type' });
    const buf = await readBody(req, ct.startsWith('video/') ? 25 * 1048576 : 8 * 1048576);
    const name = crypto.randomBytes(10).toString('hex') + '.' + ext;
    fs.writeFileSync(path.join(UPLOADS, name), buf);
    return json(res, 200, { url: 'uploads/' + name });
  }

  if (p === '/api/votes' && m === 'GET') return json(res, 200, votesView(req, res, false));
  if (p === '/api/votes/audit' && m === 'GET') { if (!isAuth(req)) return json(res, 401, { error: 'auth' }); return json(res, 200, votesView(req, res, true)); }
  if (p === '/api/votes/reset' && m === 'POST') { if (!isAuth(req)) return json(res, 401, { error: 'auth' }); writeJSON(F.votes, { votes: {}, log: [] }); return json(res, 200, { ok: true }); }
  if (p === '/api/vote' && m === 'POST') {
    if (limited('vote:' + ip, 40, 3600000)) return json(res, 429, { error: 'too_many' });
    if (!votingOpen()) return json(res, 403, { error: 'closed' });
    const b = await bodyJSON(req, 1024), c = +b.choice;
    if (!CHOICES.includes(c)) return json(res, 400, { error: 'bad_choice' });
    const vid = voterId(req, res), h = hmac(vid), db = readJSON(F.votes, { votes: {}, log: [] });
    /* حماية من تعدد الأصوات: عدد محدود من المصوّتين الجدد لكل عنوان IP في اليوم */
    const day = new Date().toISOString().slice(0, 10), ipKey = 'ipday:' + hmac(ip) + ':' + day;
    const existing = db.votes[h];
    if (!existing && limited(ipKey, 25, 86400000)) return json(res, 429, { error: 'too_many' });
    const now = new Date().toISOString();
    db.votes[h] = { c, t: now };
    db.log.push({ t: now, c, h: h.slice(0, 8), k: existing ? 'change' : 'new' });
    if (db.log.length > 20000) db.log = db.log.slice(-20000);
    writeJSON(F.votes, db);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/submit' && m === 'POST') {
    if (limited('sub:' + ip, 8, 3600000)) return json(res, 429, { error: 'too_many' });
    const b = await bodyJSON(req, 16384);
    const item = { type: b.type, name: clip(b.name, 120), contact: clip(b.contact, 120), gov: clip(b.gov, 40), subject: clip(b.subject, 200), body: clip(b.body, 4000) };
    if (!SUB_TYPES.includes(item.type) || !item.name || !item.contact || !item.subject || item.body.length < 15) return json(res, 400, { error: 'invalid' });
    const list = readJSON(F.subs, []);
    const d = new Date(); let ref;
    do { ref = 'DG-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + '-' + crypto.randomInt(1000, 10000); } while (list.some(s => s.ref === ref));
    list.push({ id: crypto.randomBytes(6).toString('hex'), ref, ...item, status: 'new', at: d.toISOString() });
    writeJSON(F.subs, list);
    return json(res, 200, { ok: true, ref });
  }
  if (p === '/api/submissions' && m === 'GET') {
    if (!isAuth(req)) return json(res, 401, { error: 'auth' });
    return json(res, 200, { items: readJSON(F.subs, []).sort((a, b) => b.at.localeCompare(a.at)) });
  }
  const sm = /^\/api\/submissions\/([a-f0-9]+)$/.exec(p);
  if (sm) {
    if (!isAuth(req)) return json(res, 401, { error: 'auth' });
    const list = readJSON(F.subs, []), i = list.findIndex(s => s.id === sm[1]);
    if (i < 0) return json(res, 404, { error: 'not_found' });
    if (m === 'PATCH') { const b = await bodyJSON(req, 1024); if (!SUB_STATUS.includes(b.status)) return json(res, 400, { error: 'bad_status' }); list[i].status = b.status; writeJSON(F.subs, list); return json(res, 200, { ok: true }); }
    if (m === 'DELETE') { list.splice(i, 1); writeJSON(F.subs, list); return json(res, 200, { ok: true }); }
  }
  return json(res, 404, { error: 'not_found' });
}

/* ---------- الملفات الثابتة ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
const ALLOWED_TOP = new Set(['index.html', 'admin.html', 'assets', 'uploads', 'data']);
function serveStatic(req, res, u) {
  let rel = decodeURIComponent(u.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  if (rel === '/admin') rel = '/admin.html';
  const abs = path.normalize(path.join(ROOT, rel));
  if (!abs.startsWith(ROOT + path.sep)) return send(res, 403, 'Forbidden');
  const parts = path.relative(ROOT, abs).split(path.sep);
  if (!ALLOWED_TOP.has(parts[0]) || parts.some(s => s.startsWith('.'))) return send(res, 404, 'Not found');
  if (parts[0] === 'data' && !(parts.length === 2 && parts[1] === 'content.js')) return send(res, 404, 'Not found');
  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found');
    const ext = path.extname(abs).toLowerCase(), type = MIME[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'Cache-Control': parts[0] === 'uploads' ? 'public, max-age=86400' : 'no-cache' };
    if (parts[0] === 'admin.html' || abs.endsWith('admin.html')) headers['X-Robots-Tag'] = 'noindex';
    if (req.method === 'HEAD') return send(res, 200, '', { ...headers, 'Content-Length': st.size });
    res.writeHead(200, { ...SEC_HEADERS, ...headers, 'Content-Length': st.size });
    fs.createReadStream(abs).pipe(res);
  });
}

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    if (u.pathname.startsWith('/api/')) return await api(req, res, u);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    return serveStatic(req, res, u);
  } catch (e) {
    const code = e.status || 500;
    if (!res.headersSent) json(res, code, { error: code === 500 ? 'server_error' : e.message });
    if (code === 500) console.error(e);
  }
}).listen(PORT, () => {
  console.log(`\nالموقع:       http://localhost:${PORT}/`);
  console.log(`لوحة التحكم:  http://localhost:${PORT}/admin.html`);
  if (!process.env.ADMIN_PASSWORD) console.log('\nتنبيه: تعمل لوحة التحكم بكلمة المرور الافتراضية (admin12345). غيّرها قبل النشر:\n  ADMIN_PASSWORD="كلمة-مرور-قوية" node server.js\n');
});
