/* الأدوات المشتركة بين الموقع ولوحة التحكم: الأيقونات، طبقة البيانات، الثيمات */
(function () {
  'use strict';
  const DG = (window.DG = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  DG.$ = $; DG.$$ = $$;
  DG.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  DG.safeUrl = u => { try { const x = new URL(String(u).trim()); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : ''; } catch (e) { return ''; } };
  DG.lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  DG.lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  DG.lsDel = k => { try { localStorage.removeItem(k); } catch (e) { } };
  DG.ssGet = k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  DG.ssSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { } };
  DG.ssDel = k => { try { sessionStorage.removeItem(k); } catch (e) { } };
  DG.uid = () => Math.random().toString(36).slice(2, 9);
  DG.clone = o => JSON.parse(JSON.stringify(o));
  DG.fmtDT = iso => { try { return new Date(iso).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; } };
  DG.pct = (n, t) => t ? Math.round((n / t) * 1000) / 10 : 0;

  /* ---------- أيقونات ---------- */
  DG.P = {
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.5c2.4.2 4 1.8 4.5 4.5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    home: '<path d="M3 11l9-7 9 7M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    vol: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.6-2.1-.5-1.2.2-2.4 1.5-2.4H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/>',
    vote: '<path d="M4 14h16v6H4zM8 14l-1-4 6-6 5 5-5 6"/><path d="M9 10l4 4"/>',
    check: '<path d="M5 12l4 4 10-10"/>',
    logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
  };
  DG.ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${DG.P[n] || ''}</svg>`;
  DG.CYCLE = ['db', 'shield', 'globe', 'users', 'chart', 'doc', 'spark', 'home'];
  DG.cardIcon = (it, i) => DG.ic(it.icon && DG.P[it.icon] ? it.icon : DG.CYCLE[i % DG.CYCLE.length]);

  DG.GOVS = ['بغداد', 'نينوى', 'البصرة', 'ذي قار', 'ميسان', 'واسط', 'القادسية', 'المثنى', 'النجف', 'كربلاء', 'بابل', 'الأنبار', 'ديالى', 'صلاح الدين', 'كركوك', 'أربيل', 'السليمانية', 'دهوك', 'حلبجة'];
  DG.CATS = ['مشاركات', 'مبادرة وطن', 'لقاءات', 'تعاون دولي'];
  DG.TYPES = { complaint: 'شكوى', suggestion: 'اقتراح', inquiry: 'تواصل واستفسار' };
  DG.STAT = { new: 'جديد', review: 'قيد المعالجة', done: 'مغلق' };
  DG.GROUPS = ['الموقع الرسمي', 'منصات التواصل', 'جهات حكومية'];

  /* ---------- الاتصال بالخادم (إن وُجد) ---------- */
  DG.mode = 'static';
  DG.token = DG.ssGet('dg_token') || null;
  async function req(method, url, o = {}) {
    const h = {}; let body;
    if (o.auth && DG.token) h.Authorization = 'Bearer ' + DG.token;
    if (o.json !== undefined) { h['Content-Type'] = 'application/json'; body = JSON.stringify(o.json); }
    else if (o.raw) { body = o.raw; h['Content-Type'] = o.type || 'application/octet-stream'; }
    const r = await fetch(url, { method, headers: h, body, cache: 'no-store', credentials: 'same-origin' });
    let j = null; try { j = await r.json(); } catch (e) { }
    if (!r.ok) { const er = new Error((j && j.error) || ('http_' + r.status)); er.status = r.status; er.data = j; throw er; }
    return j;
  }
  DG.req = req;
  DG.init = async function () {
    if (location.protocol === 'file:') { DG.mode = 'static'; return DG.mode; }
    try { const j = await req('GET', 'api/ping'); if (j && j.ok && j.server) DG.mode = 'server'; } catch (e) { DG.mode = 'static'; }
    return DG.mode;
  };

  /* ---------- المحتوى ---------- */
  DG.merge = c => {
    const seed = DG.clone(window.DG_SEED || {});
    const out = { ...seed, ...(c || {}) };
    out.settings = { ...seed.settings, ...((c && c.settings) || {}) };
    return out;
  };
  DG.loadContent = async function () {
    let c = null;
    if (DG.mode === 'server') { try { c = await req('GET', 'api/content'); } catch (e) { } }
    else { const t = DG.lsGet('dgov_content'); if (t) { try { c = JSON.parse(t); } catch (e) { } } }
    return DG.merge(c);
  };
  DG.saveContent = async function (S) {
    if (DG.mode === 'server') { await req('PUT', 'api/content', { json: S, auth: true }); return; }
    if (!DG.lsSet('dgov_content', JSON.stringify(S))) throw new Error('quota');
  };
  DG.resetContent = async function () {
    if (DG.mode === 'server') await req('DELETE', 'api/content', { auth: true });
    else DG.lsDel('dgov_content');
  };

  /* ---------- الرفع ---------- */
  function compress(file, max) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const im = new Image();
        im.onload = () => {
          const k = Math.min(1, max / im.width), c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          c.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/jpeg', .76);
        };
        im.onerror = rej; im.src = r.result;
      };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }
  const blobToData = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  /** يعيد {url, persistent}. الفيديو في وضع الملفات المحلي يعمل في الجلسة فقط. */
  DG.upload = async function (file) {
    const isVid = file.type.startsWith('video/');
    if (DG.mode === 'server' && DG.token) {
      if (isVid) { const j = await req('POST', 'api/upload', { raw: file, type: file.type, auth: true }); return { url: j.url, persistent: true }; }
      const b = await compress(file, 1400);
      const j = await req('POST', 'api/upload', { raw: b, type: 'image/jpeg', auth: true });
      return { url: j.url, persistent: true };
    }
    if (isVid) return { url: URL.createObjectURL(file), persistent: false };
    const b = await compress(file, 1000);
    return { url: await blobToData(b), persistent: true };
  };

  /* ---------- الدخول ---------- */
  DG.login = async pw => { const j = await req('POST', 'api/login', { json: { password: pw } }); DG.token = j.token; DG.ssSet('dg_token', j.token); };
  DG.logout = async () => { try { await req('POST', 'api/logout', { auth: true }); } catch (e) { } DG.token = null; DG.ssDel('dg_token'); };
  DG.checkAuth = async () => { if (!DG.token) return false; try { await req('GET', 'api/me', { auth: true }); return true; } catch (e) { DG.token = null; DG.ssDel('dg_token'); return false; } };

  /* ---------- الشكاوى والاقتراحات ---------- */
  const localSubs = () => { try { return JSON.parse(DG.lsGet('dgov_subs') || '[]'); } catch (e) { return []; } };
  const saveLocalSubs = a => DG.lsSet('dgov_subs', JSON.stringify(a));
  DG.submit = async function (item) {
    if (DG.mode === 'server') return req('POST', 'api/submit', { json: item });
    const ref = 'DG-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
    const a = localSubs(); a.push({ ...item, id: DG.uid(), ref, status: 'new', at: new Date().toISOString() });
    if (!saveLocalSubs(a)) throw new Error('quota');
    return { ok: true, ref, local: true };
  };
  DG.subs = async function () {
    if (DG.mode === 'server') return (await req('GET', 'api/submissions', { auth: true })).items;
    return localSubs().sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  };
  DG.setStatus = async function (id, status) {
    if (DG.mode === 'server') return req('PATCH', 'api/submissions/' + encodeURIComponent(id), { json: { status }, auth: true });
    const a = localSubs(); const x = a.find(s => s.id === id); if (x) x.status = status; saveLocalSubs(a);
  };
  DG.delSub = async function (id) {
    if (DG.mode === 'server') return req('DELETE', 'api/submissions/' + encodeURIComponent(id), { auth: true });
    saveLocalSubs(localSubs().filter(s => s.id !== id));
  };

  /* ---------- التصويت ---------- */
  const emptyCounts = () => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  DG.votes = async function () {
    if (DG.mode === 'server') return req('GET', 'api/votes');
    let v; try { v = JSON.parse(DG.lsGet('dgov_votes') || 'null'); } catch (e) { v = null; }
    v = v || { mine: 0, at: null, log: [] };
    const counts = emptyCounts(); if (v.mine) counts[v.mine] = 1;
    return { counts, total: v.mine ? 1 : 0, mine: v.mine || 0, open: true, updatedAt: v.at, daily: [], ledger: (v.log || []).slice(-20).reverse(), myHash: 'local', local: true };
  };
  DG.vote = async function (choice) {
    if (DG.mode === 'server') return req('POST', 'api/vote', { json: { choice } });
    let v; try { v = JSON.parse(DG.lsGet('dgov_votes') || 'null'); } catch (e) { v = null; }
    v = v || { mine: 0, at: null, log: [] };
    v.mine = choice; v.at = new Date().toISOString(); v.log.push({ t: v.at, c: choice, h: 'local' });
    DG.lsSet('dgov_votes', JSON.stringify(v)); return { ok: true };
  };
  DG.resetVotes = async function () {
    if (DG.mode === 'server') return req('POST', 'api/votes/reset', { auth: true });
    DG.lsDel('dgov_votes');
  };

  /* ---------- الثيمات ---------- */
  DG.THEMES = [
    { id: 'emerald', name: 'زمرد', sw: ['#0A5C55', '#0B2433', '#D8B05A'] },
    { id: 'night', name: 'ليلي', sw: ['#3DB6A4', '#050F15', '#D8B05A'] },
    { id: 'sand', name: 'رمل', sw: ['#9C4A12', '#2B1B10', '#2BB3AB'] },
    { id: 'tigris', name: 'دجلة', sw: ['#1B5FA8', '#0A1F44', '#F2B33D'] },
    { id: 'burgundy', name: 'عنابي', sw: ['#7A1F2B', '#2A0E14', '#D8B05A'] },
  ];
  const OV = ['--primary', '--on-primary', '--deep', '--gold-bright', '--gold', '--bg', '--ink', '--surface-2', '--f-display', '--f-body'];
  DG.look = { theme: 'emerald', ident: 0 };
  /** يحدد الثيم والهوية المعروضة. preview: رقم هوية للمعاينة المؤقتة. */
  DG.applyLook = function (settings, preview) {
    const root = document.documentElement, pref = DG.lsGet('dgov_theme');
    const approved = +(settings && settings.identityApproved) || 0;
    let theme = 'emerald', ident = 0;
    if (preview) { ident = preview; }
    else if (pref === 'identity' && approved) { ident = approved; }
    else if (pref && DG.THEMES.some(t => t.id === pref)) { theme = pref; }
    else if (approved) { ident = approved; }
    else if (settings && DG.THEMES.some(t => t.id === settings.theme)) { theme = settings.theme; }
    else { theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'emerald'; }
    root.setAttribute('data-theme', theme);
    OV.forEach(k => root.style.removeProperty(k));
    if (ident && DG.IDENTITIES) {
      const I = DG.IDENTITIES.find(x => x.id === ident);
      if (I) {
        const c = I.colors, f = I.fonts, st = root.style;
        st.setProperty('--primary', c.primary); st.setProperty('--on-primary', '#FFFFFF'); st.setProperty('--deep', c.deep);
        st.setProperty('--gold-bright', c.accent); st.setProperty('--gold', `color-mix(in srgb, ${c.accent} 62%, #000)`);
        st.setProperty('--bg', c.paper); st.setProperty('--ink', c.ink); st.setProperty('--surface-2', `color-mix(in srgb, ${c.paper} 90%, ${c.ink})`);
        st.setProperty('--f-display', `'${f.display}','IBM Plex Sans Arabic',serif`); st.setProperty('--f-body', `'${f.body}','IBM Plex Sans Arabic',sans-serif`);
      }
    }
    DG.look = { theme, ident };
    return DG.look;
  };
  DG.setThemePref = id => DG.lsSet('dgov_theme', id);
  /** الهوية المعروضة في الشعار: المعاينة ثم المعتمدة ثم الأولى. */
  DG.logoId = (settings, preview) => preview || +(settings && settings.identityApproved) || 1;

  let tt;
  DG.toast = function (m) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 3800);
  };
})();
