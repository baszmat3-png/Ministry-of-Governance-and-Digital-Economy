/* الواجهة العامة لموقع الوزارة */
(function () {
  'use strict';
  const { $, $$, esc, safeUrl, ic, cardIcon, fmtDT, pct } = DG;
  let S = DG.merge(null), V = null, preview = 0, filter = 'الكل', contactKind = 'suggestion', vio = null;

  /* ---------- الهيدر والشعار ---------- */
  function brandHTML() {
    const id = DG.logoId(S.settings, preview);
    return `${DG.logo(id, 46)}<span><b>وزارة الاقتصاد الرقمي والحوكمة</b><small>Ministry of Digital Economy &amp; Governance</small></span>`;
  }
  function fillChrome() {
    $$('[data-brand]').forEach(e => e.innerHTML = brandHTML());
    const n = $('#notice'); n.hidden = S.settings.demoNotice === false;
    $('#themeBtn').innerHTML = ic('palette');
    $('#menuBtn').innerHTML = '<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    const cur = DG.look.ident ? 'identity' : DG.look.theme, approved = +S.settings.identityApproved || 0;
    const items = [];
    if (approved) items.push(`<button role="menuitemradio" aria-checked="${cur === 'identity'}" data-action="setTheme" data-v="identity"><span class="sw3">${['primary', 'deep', 'accent'].map(k => `<i style="background:${DG.IDENTITIES[approved - 1].colors[k]}"></i>`).join('')}</span>هوية الوزارة المعتمدة</button>`);
    DG.THEMES.forEach(t => items.push(`<button role="menuitemradio" aria-checked="${cur === t.id}" data-action="setTheme" data-v="${t.id}"><span class="sw3">${t.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span>${t.name}</button>`));
    $('#themeMenu').innerHTML = '<h4>ثيم الموقع</h4>' + items.join('');
  }

  /* ---------- المشاهدات والإعجابات ---------- */
  let ST = {}, LIKED = new Set();
  const engHTML = id => { const x = ST[id] || { v: 0, l: 0 }, on = LIKED.has(id);
    return `<span class="eng" data-eng="${esc(id)}"><span class="ev" title="المشاهدات">${ic('eye')}<b>${DG.fmt(x.v)}</b></span><span class="el${on ? ' on' : ''}" role="button" tabindex="0" data-action="like" data-id="${esc(id)}" aria-pressed="${on}" aria-label="إعجاب">${ic('heart')}<b>${DG.fmt(x.l)}</b></span></span>`; };
  const paintEng = id => $$('[data-eng="' + id + '"]').forEach(e => e.outerHTML = engHTML(id));
  async function loadStats() { try { const r = await DG.stats(); ST = r.stats || {}; LIKED = new Set(r.mine || []); S.news.forEach(n => paintEng(n.id)); } catch (e) { } }
  async function like(id) {
    const was = LIKED.has(id), x = ST[id] || (ST[id] = { v: 0, l: 0 });
    was ? (LIKED.delete(id), x.l--) : (LIKED.add(id), x.l++); paintEng(id);
    try { const r = await DG.engage(id, 'like'); if (r) { x.l = r.l; x.v = r.v; r.liked ? LIKED.add(id) : LIKED.delete(id); paintEng(id); } } catch (e) { was ? LIKED.add(id) : LIKED.delete(id); x.l += was ? 1 : -1; paintEng(id); }
  }

  /* ---------- الأخبار ---------- */
  function newsCard(n, i, list) {
    const feat = i === 0 && filter === 'الكل';
    const off = filter === 'الكل' ? 1 : 0, rest = list.length - off, j = i - off;
    const w = !feat && rest % 3 === 2 && j < 2 ? ' w3' : (!feat && rest % 3 === 1 && j === 0 ? ' w6' : '');
    const pos = esc(n.pos || 'center');
    const media = n.video
      ? `<video src="${esc(n.video)}${n.img ? '' : '#t=0.1'}"${n.img ? ` poster="${esc(n.img)}"` : ''} muted loop playsinline preload="metadata" style="object-position:${pos}"></video><span class="vbadge" data-vb data-action="toggleSound" role="button" tabindex="0" aria-label="تشغيل أو كتم صوت الفيديو">${ic('play')} <em>فيديو</em></span>`
      : `<img src="${esc(n.img)}" alt="" style="object-position:${pos}">`;
    return `<button class="card ncard${feat ? ' feat' : ''}${w}${n.video ? ' hasvid' : ''}" data-action="openNews" data-id="${esc(n.id)}">
      <div class="im">${media}</div>
      <div class="tx"><div class="meta"><span class="tag">${esc(n.cat)}</span><span>${esc(n.date)}</span></div><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p><div class="foot2"><span class="more">اقرأ الخبر كاملاً ←</span>${engHTML(n.id)}</div></div></button>`;
  }

  /* ---------- الروابط ---------- */
  function linksHTML() {
    const groups = DG.GROUPS.filter(g => S.links.some(l => l.group === g));
    return groups.map(g => `<div class="lgroup">${esc(g)}</div>` + S.links.filter(l => l.group === g).map(l => {
      const u = safeUrl(l.url); let host = ''; try { host = new URL(u).host; } catch (e) { }
      return u ? `<a class="lcard" href="${esc(u)}" target="_blank" rel="noopener"><span class="ico">${ic('link')}</span><div><b>${esc(l.title)}</b><small>${esc(host)}</small></div></a>`
        : `<div class="lcard off"><span class="ico">${ic('link')}</span><div><b>${esc(l.title)}</b><small>الرابط غير مضاف بعد</small></div></div>`;
    }).join('')).join('');
  }

  /* ---------- النماذج ---------- */
  function formHTML(kind, type) {
    const c = kind === 'complaint';
    return `<form data-form="${kind}" data-type="${type}" novalidate>
      <div class="fgrid">
        <div class="fld"><label class="req" for="${kind}-name">الاسم الكامل</label><input id="${kind}-name" name="name" autocomplete="name" maxlength="120" required></div>
        <div class="fld"><label class="req" for="${kind}-contact">الهاتف أو البريد الإلكتروني</label><input id="${kind}-contact" name="contact" autocomplete="off" maxlength="120" required></div>
        <div class="fld"><label for="${kind}-gov">المحافظة</label><select id="${kind}-gov" name="gov"><option value="">اختر المحافظة</option>${DG.GOVS.map(g => `<option>${g}</option>`).join('')}</select></div>
        <div class="fld"><label class="req" for="${kind}-subject">${c ? 'الجهة أو الدائرة المعنية' : 'الموضوع'}</label><input id="${kind}-subject" name="subject" maxlength="200" required></div>
        <div class="fld w2"><label class="req" for="${kind}-body">${c ? 'تفاصيل الشكوى' : type === 'suggestion' ? 'نص الاقتراح' : 'نص الرسالة'}</label><textarea id="${kind}-body" name="body" maxlength="4000" required></textarea></div>
      </div>
      <div class="err" role="alert" data-err></div>
      <div style="margin-top:14px"><button class="btn" type="submit">${c ? 'إرسال الشكوى' : type === 'suggestion' ? 'إرسال الاقتراح' : 'إرسال الرسالة'}</button></div>
      ${S.settings.demoNotice === false ? '' : '<p class="note" style="margin-top:14px">نسخة العرض: تُحفظ الطلبات للمعاينة ولا تصل إلى جهة رسمية.</p>'}
      <div data-result></div></form>`;
  }

  /* ---------- الهوية البصرية والتصويت ---------- */
  function idCard(I) {
    const c = I.colors, f = I.fonts, mine = V && V.mine === I.id, closed = V && V.open === false;
    return `<article class="idc${mine ? ' mine' : ''}" style="--ip:${c.primary};--id:${c.deep};--ia:${c.accent};--ipaper:${c.paper};--iink:${c.ink};--ifd:'${f.display}',serif;--ifb:'${f.body}',sans-serif">
      <div class="idc-top"><div class="idc-logo">${DG.logo(I.id, 84)}</div><div><span class="idc-no">المقترح ${I.id}</span><h3>${esc(I.name)}</h3><p class="idc-word">وزارة الاقتصاد الرقمي والحوكمة</p></div></div>
      <p class="idc-concept">${esc(I.concept)}</p>
      <div class="idc-sw">${[['primary', 'الأساسي'], ['deep', 'العميق'], ['accent', 'المميز'], ['paper', 'الورق'], ['ink', 'الحبر']].map(([k, l]) => `<span title="${l}"><i style="background:${c[k]}"></i><small dir="ltr">${c[k]}</small></span>`).join('')}</div>
      <div class="idc-type"><b>${esc(f.display)} + ${esc(f.body)}</b><span class="d">اقتصاد رقمي يبني الدولة</span><span class="b">خدمات أسرع وإجراءات أبسط للمواطن</span></div>
      <div class="idc-app"><div class="bar">${DG.logo(I.id, 26)}<span>وزارة الاقتصاد الرقمي والحوكمة</span><em>تواصل</em></div></div>
      <div class="idc-act"><button class="btn sm ghost" data-action="preview" data-id="${I.id}">معاينة على الموقع</button>
      <button class="btn sm" data-action="vote" data-id="${I.id}" ${closed ? 'disabled' : ''}>${mine ? 'صوتك لهذا المقترح ✓' : 'صوّت لهذا المقترح'}</button></div></article>`;
  }
  function resultsHTML() {
    if (!V) return '<div class="panel res"><h3>نتائج التصويت</h3><p class="sub">جارٍ تحميل النتائج...</p></div>';
    const total = V.total || 0, max = Math.max(...Object.values(V.counts));
    const rows = DG.IDENTITIES.map(I => {
      const n = V.counts[I.id] || 0, p = pct(n, total), lead = total > 0 && n === max;
      return `<div class="rrow${lead ? ' lead' : ''}"><div>${DG.logo(I.id, 32)}</div><div><div class="meta2"><b>${esc(I.name)}${lead ? ' · الأعلى' : ''}</b><span class="num">${n} صوت · ${p}%</span></div><div class="bar" role="img" aria-label="${esc(I.name)}: ${p}%"><i style="width:${p}%"></i></div></div></div>`;
    }).join('');
    const ledger = (V.ledger || []).slice(0, 10).map(e => `<tr class="${V.myHash && e.h === V.myHash ? 'you' : ''}"><td class="num">${fmtDT(e.t)}</td><td>${esc((DG.IDENTITIES[e.c - 1] || {}).name || e.c)}</td><td dir="ltr" class="num">${esc(e.h)}${V.myHash && e.h === V.myHash ? ' (أنت)' : ''}</td></tr>`).join('');
    return `<aside class="panel res" aria-live="polite"><h3>النتائج المباشرة</h3>
      <p class="sub" style="margin-bottom:8px">${V.open === false ? 'التصويت مغلق، وهذه النتيجة النهائية.' : 'التصويت مفتوح. تتحدث الأرقام تلقائياً.'}</p>
      ${V.local ? '<p class="note" style="margin-bottom:8px">وضع العرض المحلي: الأصوات تُحفظ في هذا المتصفح فقط. شغّل الخادم لتجميع أصوات الزوار.</p>' : ''}
      ${rows}
      <div class="rtotal"><span>مجموع الأصوات</span><span class="num">${total}</span></div>
      ${V.updatedAt ? `<p style="font-size:13px;color:var(--muted);margin-top:4px">آخر صوت: ${fmtDT(V.updatedAt)}</p>` : ''}
      <ul class="rules"><li>صوت واحد لكل جهاز ومتصفح، ويمكنك تغيير صوتك ما دام التصويت مفتوحاً.</li><li>تظهر النتائج للجميع كما هي دون تعديل، ويسجَّل كل صوت بوقته ورمز مختصر لا يكشف صاحبه.</li><li>التصويت استرشادي، والقرار النهائي لمعالي الوزير.</li></ul>
      <details class="ledger"><summary>سجل الأصوات الأخيرة</summary>${ledger ? `<table><thead><tr><th>الوقت</th><th>المقترح</th><th>الرمز</th></tr></thead><tbody>${ledger}</tbody></table>` : '<p style="margin-top:8px">لا توجد أصوات بعد.</p>'}</details></aside>`;
  }
  function identityInner() {
    const ap = +S.settings.identityApproved || 0, I = ap && DG.IDENTITIES[ap - 1];
    return (I ? `<div class="appr">${DG.logo(I.id, 44)}<div><b>الهوية المعتمدة: ${esc(I.name)}</b><div style="font-size:14px;color:var(--muted)">اعتمدها معالي الوزير وتظهر الآن في الموقع.</div></div></div>` : '') +
      `<div class="id-layout"><div class="id-grid">${DG.IDENTITIES.map(idCard).join('')}</div>${resultsHTML()}</div>`;
  }
  function renderIdentity() { const r = $('#identityRoot'); if (r) r.innerHTML = identityInner(); }

  /* ---------- الصفحة ---------- */
  function siteHTML() {
    const s = S.settings, cats = ['الكل', ...new Set(S.news.map(n => n.cat).filter(Boolean))];
    const list = S.news.filter(n => filter === 'الكل' || n.cat === filter);
    const info = [['pin', 'العنوان', s.address], ['phone', 'الهاتف', s.phone], ['mail', 'البريد الإلكتروني', s.email], ['clock', 'ساعات الاستقبال', s.hours]].filter(x => x[2]);
    return `
    <section class="hero"><div class="wrap">
      <div class="hero-in">
        <div><div class="hero-kicker"><i></i>جمهورية العراق</div>
          <h1>${esc(s.heroTitle)}</h1><p class="lede">${esc(s.heroText)}</p>
          <div class="hero-cta"><a class="btn gold" href="#news">آخر الأخبار</a><a class="btn ghost" href="#complaints">قدّم شكوى أو اقتراحاً</a></div></div>
        <figure class="minister" style="margin:0"><div class="ph"><img src="assets/img/minister.jpg" alt="${esc(s.ministerName)}"></div>
          <figcaption class="plate"><small>${esc(s.ministerTitle)}</small><b>${esc(s.ministerName)}</b></figcaption></figure>
      </div>
      <div class="quote"><q>${esc(s.quote)}</q><span>${esc(s.quoteBy)}</span></div>
    </div></section>
    <div class="wrap">
      ${S.stats.length ? `<div class="stats">${S.stats.map(x => `<div class="stat"><b class="num">${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join('')}</div>` : ''}

      <section class="sec" id="news"><div class="sec-head"><h2>الأخبار</h2><div class="chips" role="group" aria-label="تصفية الأخبار">${cats.map(c => `<button class="chip" aria-pressed="${c === filter}" data-action="filter" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
        <div class="news-grid">${list.length ? list.map((n, i) => newsCard(n, i, list)).join('') : '<div class="empty">لا توجد أخبار في هذا التصنيف.</div>'}</div></section>

      <section class="sec" id="about"><div class="sec-head"><h2>عن الوزارة</h2></div>
        <div class="about"><p class="big">${esc(s.aboutText)}</p>
          <div class="pillars">
            <div class="pillar"><span class="ico">${ic('spark')}</span><div><h3>الرؤية</h3><p>${esc(s.vision)}</p></div></div>
            <div class="pillar"><span class="ico">${ic('flag')}</span><div><h3>الرسالة</h3><p>${esc(s.mission)}</p></div></div>
            <div class="pillar"><span class="ico">${ic('shield')}</span><div><h3>القيم</h3><p>${esc(s.valuesText)}</p></div></div>
          </div></div></section>

      <section class="sec" id="achievements"><div class="sec-head"><h2>الإنجازات</h2><p>ما تحقق منذ تأسيس الوزارة، كما نُشر في أخبارها.</p></div>
        <div class="ach">${S.achievements.map((a, i) => `<article class="card"><span class="ico">${cardIcon(a, i)}</span><div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div></article>`).join('')}</div></section>
    </div>

    <section class="band" id="vision"><div class="wrap"><div class="sec-head"><h2>التطلعات</h2><p>إلى أين تتجه الوزارة خلال المرحلة المقبلة.</p></div>
      <div class="asp">${S.aspirations.map((a, i) => `<article><span class="ico">${cardIcon(a, i + 2)}</span><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></article>`).join('')}</div></div></section>

    <div class="wrap">
      <section class="sec" id="tasks"><div class="sec-head"><h2>المهام</h2><p>الملفات التي تعمل عليها الوزارة اليوم.</p></div>
        <div class="tasks">${S.tasks.map((a, i) => `<div class="task"><h3>${cardIcon(a, i)}${esc(a.title)}</h3><p>${esc(a.text)}</p></div>`).join('')}</div>
        <div class="flow"><h3>كيف تعمل بيانات مبادرة وطن</h3><p>من بيانات الوزارات إلى الاستمارة الإلكترونية الخاصة بتوزيع مليون قطعة أرض سكنية.</p>
          <div class="flow-row">
            <div class="fsplit"><div class="fnode"><small>وزارة العدل</small><b>قاعدة البيانات الوطنية لمالكي العقارات</b></div><div class="fnode"><small>وزارة الزراعة</small><b>ملاك الأراضي الزراعية والمستفيدون منها</b></div></div>
            <div class="farrow">←</div>
            <div class="fnode core"><small>وزارة الاقتصاد الرقمي والحوكمة</small><b>معالجة البيانات المستلمة وتقاطعها</b></div>
            <div class="farrow">←</div>
            <div class="fnode"><small>الاستمارة الإلكترونية</small><b>اعتماد شروط المتقدمين</b></div>
            <div class="farrow">←</div>
            <div class="fnode"><small>مبادرة وطن</small><b>توزيع مليون قطعة أرض سكنية على المستحقين</b></div>
          </div></div></section>

      <section class="sec" id="identity"><div class="sec-head"><h2>الهوية البصرية</h2><p>خمسة مقترحات متكاملة للشعار والألوان والخطوط. جرّب كل واحد على الموقع نفسه، ثم صوّت للأنسب. النتائج معلنة أمامك لحظة بلحظة.</p></div>
        <div id="identityRoot"></div></section>

      <section class="sec" id="contact"><div class="sec-head"><h2>التواصل والاقتراحات</h2><p>أرسل اقتراحاً أو استفساراً، وتعرّف على القنوات الرسمية للوزارة.</p></div>
        <div class="two">
          <div class="panel"><div class="seg" role="group" aria-label="نوع الرسالة"><button data-action="ckind" data-v="suggestion" aria-pressed="${contactKind === 'suggestion'}">اقتراح</button><button data-action="ckind" data-v="inquiry" aria-pressed="${contactKind === 'inquiry'}">تواصل واستفسار</button></div>
            ${formHTML('contact', contactKind)}</div>
          <div class="panel"><h3>قنوات التواصل</h3><p class="sub">البيانات الرسمية للوزارة.</p>
            ${info.length ? `<ul class="infolist">${info.map(x => `<li><span class="ico">${ic(x[0])}</span><div><small>${x[1]}</small>${esc(x[2])}</div></li>`).join('')}</ul>` : '<div class="empty">لم تُضف بيانات التواصل بعد.</div>'}
          </div></div>
        <div class="links-grid">${linksHTML()}</div></section>

      <section class="sec" id="complaints"><div class="sec-head"><h2>الشكاوى</h2><p>سجّل شكواك لتصلك برقم مرجعي، وتتابع حالتها: جديدة، قيد المعالجة، ثم مغلقة.</p></div>
        <div class="two"><div class="panel"><h3>تقديم شكوى</h3><p class="sub">اكتب التفاصيل بوضوح، ولا ترسل كلمات مرور أو بيانات بنكية.</p>${formHTML('complaint', 'complaint')}</div>
          <div class="panel"><h3>مسار الشكوى</h3><p class="sub">كل شكوى تمر بثلاث حالات.</p>
            <div class="steps"><div class="step"><i class="s-new">1</i><div><b>جديدة</b><p style="color:var(--muted);font-size:14.5px">تُسجَّل الشكوى ويُعطى صاحبها رقماً مرجعياً.</p></div></div>
              <div class="step"><i class="s-review">2</i><div><b>قيد المعالجة</b><p style="color:var(--muted);font-size:14.5px">يراجعها فريق الوزارة ويحيلها إلى الجهة المختصة.</p></div></div>
              <div class="step"><i class="s-done">3</i><div><b>مغلقة</b><p style="color:var(--muted);font-size:14.5px">تُغلق بعد المعالجة أو الرد على صاحبها.</p></div></div></div></div></div></section>
    </div>

    <footer class="foot"><div class="wrap"><div class="foot-g">
      <div><a class="brand" href="#home" data-go="home" data-brand style="padding:0"></a><p>نبني اقتصاداً رقمياً يخدم المواطن ويحمي بيانات العراق.</p></div>
      <div><h4>الموقع</h4><a href="#news">الأخبار</a><a href="#about">عن الوزارة</a><a href="#achievements">الإنجازات</a><a href="#vision">التطلعات</a><a href="#tasks">المهام</a></div>
      <div><h4>خدمات</h4><a href="#identity">الهوية البصرية</a><a href="#contact">التواصل والاقتراحات</a><a href="#complaints">الشكاوى</a></div></div>
      <div class="copy"><span>© 2026 وزارة الاقتصاد الرقمي والحوكمة، جمهورية العراق</span></div></div></footer>`;
  }

  function renderAll() {
    $('#siteRoot').innerHTML = siteHTML();
    renderIdentity(); fillChrome(); renderPreviewBar(); bindVideos();
  }

  /* ---------- نافذة الخبر ---------- */
  let lastFocus = null;
  function openNews(id) {
    const n = S.news.find(x => x.id === id); if (!n) return; lastFocus = document.activeElement;
    const imgs = [n.img2].filter(Boolean), pos = esc(n.pos || 'center');
    $('#modalHost').innerHTML = `<div class="ov" data-action="closeModal"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(n.title)}">
      <button class="iconbtn x" data-action="closeModal" aria-label="إغلاق">${ic('x')}</button>
      <div class="mim${n.video ? ' vid' : ''}">${n.video ? `<video src="${esc(n.video)}"${n.img ? ` poster="${esc(n.img)}"` : ''} preload="auto" controls playsinline loop></video>` : `<img src="${esc(n.img)}" alt="" style="object-position:${pos}">`}</div>
      ${imgs.length ? `<div class="mgal">${imgs.map(i => `<img src="${esc(i)}" alt="">`).join('')}</div>` : ''}
      <div class="mb"><div class="meta"><span class="tag">${esc(n.cat)}</span><span>${esc(n.date)}</span></div><h2>${esc(n.title)}</h2>
      <div class="mfoot">${engHTML(n.id)}</div><div class="body">${String(n.body || n.summary || '').split('\n').filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('')}</div></div></div></div>`;
    DG.engage(id, 'view').then(r => { if (r) { (ST[id] = ST[id] || {}).v = r.v; ST[id].l = r.l; paintEng(id); } }).catch(() => { });
    $$('.ncard.hasvid video').forEach(v => { v._want = false; v.pause(); });
    $('#modalHost .x').focus();
    const mv = $('#modalHost .mim video');
    if (mv) { mv.muted = false; mv.play().catch(() => { mv.muted = true; mv.play().catch(() => { }); }); }
  }
  function closeModal() { $('#modalHost').innerHTML = ''; lastFocus && lastFocus.focus && lastFocus.focus(); }

  /* ---------- الفيديو: تشغيل الصوت دون فتح الخبر ----------
     المتصفحات تمنع الصوت التلقائي قبل أول تفاعل من الزائر مع الصفحة. لذلك:
     1) زر الصوت على بطاقة الفيديو يشغّل/يكتم الصوت دون فتح الخبر.
     2) بعد أول نقرة أو لمسة في أي مكان من الصفحة، تعمل الفيديوهات بالصوت تلقائياً
        عند الوقوف عليها (حاسوب) أو عند ظهورها في الشاشة (هاتف).
     3) فيديو واحد فقط بالصوت في الوقت نفسه. */
  let audioOK = false, soundOn = null;
  function setBadge(c, v) {
    const b = $('[data-vb]', c); if (!b) return;
    const playing = !v.paused, sound = playing && !v.muted;
    const em = $('em', b); if (em) em.textContent = !playing ? 'فيديو' : sound ? 'الصوت يعمل · انقر للكتم' : 'بلا صوت · انقر لتشغيل الصوت';
    const svg = $('svg', b); if (svg) svg.outerHTML = ic(!playing ? 'play' : sound ? 'vol' : 'mute');
    b.classList.toggle('on', sound);
  }
  function muteOthers(except) {
    $$('.ncard.hasvid video').forEach(o => { if (o !== except && !o.muted) { o.muted = true; setBadge(o.closest('.ncard'), o); } });
  }
  async function startVid(c, v, wantSound = audioOK) {
    v._want = true;
    if (wantSound) { muteOthers(v); v.muted = false; } else v.muted = true;
    try { await v.play(); }
    catch (e) {
      if (!v._want) return;
      v.muted = true;
      try { await v.play(); } catch (_) { }
    }
    if (v._want) { if (!v.muted) soundOn = v; setBadge(c, v); }
  }
  function stopVid(c, v) { v._want = false; v.pause(); try { v.currentTime = 0; } catch (e) { } if (soundOn === v) soundOn = null; setBadge(c, v); }
  function toggleSound(badgeEl) {
    const c = badgeEl.closest('.ncard'), v = c && $('video', c); if (!v) return;
    audioOK = true;
    if (!v.paused && !v.muted) { v.muted = true; setBadge(c, v); return; }   // كتم
    startVid(c, v, true);                                                    // تشغيل بالصوت
  }
  function unlockAudio() {
    if (audioOK) return;
    audioOK = true;
    // أي فيديو يعمل الآن بلا صوت يُفتح صوته فوراً
    const cur = $$('.ncard.hasvid video').find(v => !v.paused && v._want);
    if (cur) startVid(cur.closest('.ncard'), cur, true);
  }
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
  document.addEventListener('keydown', e => {
    const b = e.target.closest && e.target.closest('[data-vb]');
    if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); toggleSound(b); }
  }, true);
  function bindVideos() {
    if (vio) { vio.disconnect(); vio = null; }
    soundOn = null;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const touch = matchMedia('(hover: none)').matches, cards = $$('.ncard.hasvid');
    cards.forEach(c => {
      const v = $('video', c); if (!v) return;
      if (!touch) {
        c.addEventListener('mouseenter', () => startVid(c, v)); c.addEventListener('mouseleave', () => stopVid(c, v));
        c.addEventListener('focus', () => startVid(c, v)); c.addEventListener('blur', () => stopVid(c, v));
      }
    });
    if (touch && cards.length && 'IntersectionObserver' in window) {
      vio = new IntersectionObserver(es => es.forEach(e => {
        const c = e.target, v = $('video', c); if (!v) return;
        if (e.isIntersecting) startVid(c, v);
        else { v._want = false; v.pause(); if (soundOn === v) soundOn = null; setBadge(c, v); }
      }), { threshold: .65 });
      cards.forEach(c => vio.observe(c));
    }
  }

  /* ---------- معاينة الهوية ---------- */
  function renderPreviewBar() {
    const h = $('#pvHost');
    if (!preview) { h.innerHTML = ''; return; }
    const I = DG.IDENTITIES[preview - 1], closed = V && V.open === false;
    h.innerHTML = `<div class="pvbar" role="region" aria-label="معاينة الهوية"><span>تعاين الآن: <b>${esc(I.name)}</b></span><button class="btn sm gold" data-action="vote" data-id="${I.id}" ${closed ? 'disabled' : ''}>صوّت لها</button><button class="btn sm ghost" data-action="endPreview">إنهاء المعاينة</button></div>`;
  }
  function setPreview(id) { preview = id; DG.applyLook(S.settings, preview); fillChrome(); renderPreviewBar(); }

  /* ---------- الأصوات ---------- */
  async function loadVotes() {
    try { V = await DG.votes(); } catch (e) { return; }
    renderIdentity(); renderPreviewBar();
  }
  async function castVote(id) {
    if (V && V.open === false) { DG.toast('التصويت مغلق حالياً.'); return; }
    try { await DG.vote(id); DG.toast('تم تسجيل صوتك للمقترح ' + id + ': ' + DG.IDENTITIES[id - 1].name); await loadVotes(); }
    catch (e) { DG.toast(e.message === 'closed' ? 'التصويت مغلق حالياً.' : e.status === 429 ? 'تجاوزت الحد المسموح. حاول لاحقاً.' : 'تعذّر تسجيل الصوت. حاول مرة أخرى.'); }
  }

  /* ---------- إرسال النماذج ---------- */
  async function submitForm(form) {
    const kind = form.dataset.form, type = form.dataset.type, f = new FormData(form);
    const v = { name: (f.get('name') || '').trim(), contact: (f.get('contact') || '').trim(), gov: f.get('gov') || '', subject: (f.get('subject') || '').trim(), body: (f.get('body') || '').trim() };
    const err = $('[data-err]', form), res = $('[data-result]', form); err.textContent = '';
    if (!v.name || !v.contact || !v.subject || !v.body) { err.textContent = 'أكمل الحقول المطلوبة المعلّمة بنجمة.'; return; }
    if (v.body.length < 15) { err.textContent = 'اكتب التفاصيل بجملتين على الأقل حتى نتمكن من المعالجة.'; return; }
    const btn = $('button[type=submit]', form); btn.disabled = true;
    try {
      const r = await DG.submit({ type, ...v });
      form.reset();
      res.innerHTML = `<div class="ok-box" style="margin-top:14px"><b>تم تسجيل ${DG.TYPES[type] || 'الطلب'}</b><span>رقمك المرجعي: <span class="ref">${esc(r.ref)}</span></span>${r.local ? '<span style="font-size:14px">وضع العرض المحلي: حُفظ الطلب في هذا المتصفح لأغراض المعاينة.</span>' : ''}</div>`;
    } catch (e) {
      err.textContent = e.status === 429 ? 'أرسلت عدداً كبيراً من الطلبات. حاول لاحقاً.' : 'تعذّر إرسال الطلب. تحقق من الاتصال وحاول مرة أخرى.';
    } finally { btn.disabled = false; }
  }

  /* ---------- الأحداث ---------- */
  function closeMenus() {
    $('#nav').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
    $('#themeMenu').hidden = true; $('#themeBtn').setAttribute('aria-expanded', 'false');
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('.tmenu')) { $('#themeMenu').hidden = true; $('#themeBtn').setAttribute('aria-expanded', 'false'); }
    if (e.target.closest('#menuBtn')) { const o = $('#nav').classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); return; }
    if (e.target.closest('#themeBtn')) { const m = $('#themeMenu'); m.hidden = !m.hidden; $('#themeBtn').setAttribute('aria-expanded', !m.hidden); return; }
    const g = e.target.closest('[data-go]');
    if (g) { closeMenus(); if (g.dataset.go === 'home') { e.preventDefault(); try { history.replaceState(null, '', '#home'); } catch (_) { } window.scrollTo(0, 0); } return; }
    if (e.target.closest('.foot a[href^="#"]')) { closeMenus(); return; }
    const a = e.target.closest('[data-action]'); if (!a) return;
    const act = a.dataset.action, id = a.dataset.id;
    switch (act) {
      case 'closeModal': if (e.target === a || a.classList.contains('x') || a.closest('.x')) closeModal(); break;
      case 'filter': filter = a.dataset.v; renderAll(); { const n = document.getElementById('news'); n && n.scrollIntoView(); } break;
      case 'openNews': openNews(id); break;
      case 'like': e.preventDefault(); e.stopPropagation(); like(id); break;
      case 'toggleSound': e.preventDefault(); e.stopPropagation(); toggleSound(a); break;
      case 'ckind': contactKind = a.dataset.v; renderAll(); { const n = document.getElementById('contact'); n && n.scrollIntoView(); } break;
      case 'preview': setPreview(+id); break;
      case 'endPreview': setPreview(0); break;
      case 'vote': castVote(+id); break;
      case 'setTheme': {
        const v = a.dataset.v; DG.setThemePref(v); preview = 0; DG.applyLook(S.settings); fillChrome(); renderPreviewBar(); closeMenus(); break;
      }
    }
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.action === 'like') { e.preventDefault(); like(e.target.dataset.id); return; } if (e.key === 'Escape') { if ($('#modalHost .ov')) closeModal(); closeMenus(); } });
  document.addEventListener('submit', e => { const f = e.target; if (f.dataset && f.dataset.form) { e.preventDefault(); submitForm(f); } });

  /* ---------- التشغيل ---------- */
  async function boot() {
    DG.applyLook(S.settings); renderAll();
    await DG.init();
    S = await DG.loadContent();
    DG.applyLook(S.settings, preview); renderAll();
    loadVotes(); loadStats();
    setInterval(() => { if (document.visibilityState === 'visible') loadVotes(); }, 20000);
    if (location.hash && location.hash.length > 1) { const el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
  }
  /* ضبط إطار بطاقة الفيديو على أبعاد الفيديو الفعلية (عمودي للريلز، أفقي للعادي) */
  document.addEventListener('loadedmetadata', e => {
    const v = e.target; if (!(v instanceof HTMLVideoElement) || !v.videoWidth) return;
    const im = v.closest('.ncard .im'); if (im) im.style.setProperty('--vr', v.videoWidth + '/' + v.videoHeight);
  }, true);
  boot();
})();
