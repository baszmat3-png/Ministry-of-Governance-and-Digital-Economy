/* لوحة تحكم الوزارة: أخبار، روابط، وارد، محتوى، هوية وتصويت، إعدادات */
(function () {
  'use strict';
  const { $, $$, esc, safeUrl, ic, fmtDT, pct } = DG;
  let S = DG.merge(null), subs = [], V = null, audit = null;
  const ui = { tab: 'overview', edit: null, inboxFilter: 'all', done: {} };
  const root = () => $('#adminRoot');

  const LISTS = {
    stats: { title: 'الأرقام الرئيسية', a: 'value', al: 'الرقم', b: 'label', bl: 'الوصف', icon: false },
    achievements: { title: 'الإنجازات', a: 'title', al: 'العنوان', b: 'text', bl: 'الوصف', icon: true },
    aspirations: { title: 'التطلعات', a: 'title', al: 'العنوان', b: 'text', bl: 'الوصف', icon: true },
    tasks: { title: 'المهام', a: 'title', al: 'العنوان', b: 'text', bl: 'الوصف', icon: true },
  };
  const ICON_NAMES = { db: 'بيانات', shield: 'حماية', globe: 'عالمي', users: 'أشخاص', chart: 'نمو', doc: 'وثيقة', spark: 'ذكاء', home: 'سكن', flag: 'علم', bulb: 'فكرة' };

  /* ---------- الحفظ ---------- */
  async function commit(msg) {
    try { await DG.saveContent(S); DG.toast(msg + (DG.mode === 'server' ? ' · ظهر للزوار' : ' · محفوظ في هذا المتصفح')); return true; }
    catch (e) { DG.toast(e.message === 'quota' ? 'تعذّر الحفظ: مساحة المتصفح ممتلئة.' : e.status === 401 ? 'انتهت الجلسة. سجّل الدخول من جديد.' : 'تعذّر الحفظ. حاول مرة أخرى.'); if (e.status === 401) { DG.token = null; renderLogin(); } return false; }
  }

  /* ---------- الدخول ---------- */
  function renderLogin() {
    $('#logoutBtn').hidden = true;
    root().innerHTML = `<div class="wrap"><div class="login"><form class="panel" id="loginForm" novalidate>
      <h1 style="font-size:26px">دخول لوحة التحكم</h1><p class="sub" style="color:var(--muted)">أدخل كلمة المرور الخاصة بالإدارة.</p>
      <div class="fld"><label for="pw" class="req">كلمة المرور</label><input id="pw" type="password" autocomplete="current-password" dir="ltr"></div>
      <div class="err" role="alert" id="loginErr"></div><button class="btn" type="submit">دخول</button></form></div></div>`;
    $('#pw').focus();
  }
  document.addEventListener('submit', async e => {
    if (e.target.id !== 'loginForm') return; e.preventDefault();
    const err = $('#loginErr'); err.textContent = '';
    try { await DG.login($('#pw').value); await start(); }
    catch (ex) { err.textContent = ex.status === 429 ? 'محاولات كثيرة. انتظر عشر دقائق ثم حاول.' : 'كلمة المرور غير صحيحة.'; }
  });
  $('#logoutBtn').addEventListener('click', async () => { await DG.logout(); renderLogin(); });

  /* ---------- الأجزاء ---------- */
  function overviewPane() {
    const c = k => subs.filter(x => x.status === k).length, linked = S.links.filter(l => safeUrl(l.url)).length;
    return `<div class="kpis"><div class="kpi"><b class="num">${S.news.length}</b><span>خبراً منشوراً</span></div><div class="kpi"><b class="num">${c('new')}</b><span>طلب جديد</span></div><div class="kpi"><b class="num">${c('review')}</b><span>قيد المعالجة</span></div><div class="kpi"><b class="num">${linked}/${S.links.length}</b><span>روابط رسمية مضافة</span></div><div class="kpi"><b class="num">${V ? V.total : 0}</b><span>صوتاً على الهوية البصرية</span></div></div>
    <div class="sub-head"><h2>أحدث الطلبات</h2><button class="btn ghost sm" data-action="tab" data-v="inbox">فتح الوارد</button></div>
    ${subs.length ? `<div class="rows">${subs.slice(0, 4).map(s => `<div class="row nothumb"><div><b>${esc(s.subject)}</b><small>${esc(DG.TYPES[s.type] || s.type)} · ${esc(s.name)} · ${fmtDT(s.at)}</small></div><span class="pill ${s.status}">${DG.STAT[s.status]}</span></div>`).join('')}</div>` : '<div class="empty">لم يصل أي طلب بعد.</div>'}
    <div class="sub-head" style="margin-top:26px"><h2>إجراءات سريعة</h2></div>
    <div class="acts"><button class="btn sm" data-action="newNews">${ic('plus')} إضافة خبر</button><button class="btn ghost sm" data-action="tab" data-v="links">${ic('link')} إضافة رابط رسمي</button><button class="btn ghost sm" data-action="tab" data-v="identity">${ic('vote')} نتائج الهوية</button><button class="btn ghost sm" data-action="tab" data-v="settings">${ic('gear')} بيانات التواصل</button></div>`;
  }

  function newsForm(n) {
    const isNew = !n.id;
    return `<div class="formp"><h3>${isNew ? 'خبر جديد' : 'تعديل الخبر'}</h3><form data-df="news" data-id="${esc(n.id || '')}" novalidate><div class="fgrid">
      <div class="fld w2"><label class="req" for="f-title">العنوان</label><input id="f-title" name="title" value="${esc(n.title || '')}"></div>
      <div class="fld"><label for="f-cat">التصنيف</label><input id="f-cat" name="cat" list="cats" value="${esc(n.cat || '')}"><datalist id="cats">${DG.CATS.map(c => `<option value="${c}">`).join('')}</datalist></div>
      <div class="fld"><label for="f-date">التاريخ أو الوصف الزمني</label><input id="f-date" name="date" value="${esc(n.date || '')}" placeholder="مثال: 5 تشرين الثاني 2026"></div>
      <div class="fld w2"><label class="req" for="f-sum">ملخص قصير</label><textarea id="f-sum" name="summary" style="min-height:80px">${esc(n.summary || '')}</textarea></div>
      <div class="fld w2"><label for="f-body">نص الخبر (كل فقرة في سطر)</label><textarea id="f-body" name="body" style="min-height:180px">${esc(n.body || '')}</textarea></div>
      <div class="fld w2"><label for="f-img">صورة الخبر</label><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><img id="f-prev" alt="" src="${esc(n.img || '')}" style="${n.img ? '' : 'display:none;'}width:96px;height:64px;border-radius:8px;object-fit:cover"><input id="f-img" type="file" accept="image/*" style="flex:1;min-width:200px"></div>
        <input type="hidden" name="img" value="${esc(n.img || '')}"><input type="hidden" name="img2" value="${esc(n.img2 || '')}"><input type="hidden" name="pos" value="${esc(n.pos || 'center')}"><input type="hidden" name="video" value="${esc(n.video || '')}"></div>
      <div class="fld w2"><label for="f-video">فيديو الخبر (اختياري)</label><input id="f-video" type="file" accept="video/mp4,video/webm"><div class="note" id="f-vstat">${n.video ? 'يوجد فيديو مرفق بهذا الخبر.' : 'يُشغَّل الفيديو تلقائياً وبلا صوت عند الوقوف على بطاقة الخبر، ويتوقف عند الابتعاد. الحد الأقصى 25 ميغابايت، بصيغة MP4 أو WebM.'}</div>${n.video ? '<button class="btn danger sm" type="button" data-action="rmVideo" style="justify-self:start">إزالة الفيديو</button>' : ''}</div>
    </div><div class="err" role="alert" data-err></div>
    <div class="acts" style="margin-top:14px"><button class="btn" type="submit">${isNew ? 'نشر الخبر' : 'حفظ التعديلات'}</button><button class="btn ghost" type="button" data-action="cancelEdit">إلغاء</button></div></form></div>`;
  }
  function newsPane() {
    return `<div class="sub-head"><h2>الأخبار</h2><button class="btn sm" data-action="newNews">${ic('plus')} خبر جديد</button></div>
    ${ui.edit && ui.edit.k === 'news' ? newsForm(ui.edit.item) : ''}
    <div class="rows">${S.news.map((n, i) => `<div class="row"><img class="th" src="${esc(n.img)}" alt=""><div style="min-width:0"><b>${esc(n.title)}</b><small>${esc(n.cat)} · ${esc(n.date)}${n.video ? ' · فيديو' : ''}${i === 0 ? ' · الخبر الرئيسي' : ''}</small></div>
      <div class="acts">${i > 0 ? `<button class="btn ghost sm" data-action="newsUp" data-id="${esc(n.id)}" title="نقل للأعلى" aria-label="نقل للأعلى">${ic('up')}</button>` : ''}<button class="btn ghost sm" data-action="editNews" data-id="${esc(n.id)}">${ic('edit')} تعديل</button><button class="btn danger sm" data-action="delArm" data-k="news" data-id="${esc(n.id)}">${ic('trash')} ${ui.done['news' + n.id] ? 'تأكيد الحذف' : 'حذف'}</button></div></div>`).join('') || '<div class="empty">لا توجد أخبار. أضف أول خبر.</div>'}</div>`;
  }
  function linksPane() {
    const l = ui.edit && ui.edit.k === 'link' ? ui.edit.item : null;
    return `<div class="sub-head"><h2>المواقع الرسمية وروابط التواصل</h2></div>
    <div class="formp"><h3>${l && l.id ? 'تعديل الرابط' : 'إضافة رابط'}</h3><form data-df="link" data-id="${esc(l ? l.id || '' : '')}" novalidate><div class="fgrid">
      <div class="fld"><label class="req" for="l-title">الاسم</label><input id="l-title" name="title" value="${esc(l ? l.title || '' : '')}" placeholder="مثال: صفحة الوزارة على فيسبوك"></div>
      <div class="fld"><label for="l-group">المجموعة</label><select id="l-group" name="group">${DG.GROUPS.map(g => `<option ${l && l.group === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
      <div class="fld w2"><label for="l-url">الرابط (يبدأ بـ https://)</label><input id="l-url" name="url" dir="ltr" inputmode="url" value="${esc(l ? l.url || '' : '')}" placeholder="https://"></div></div>
      <div class="err" role="alert" data-err></div><div class="acts" style="margin-top:14px"><button class="btn" type="submit">${l && l.id ? 'حفظ' : 'إضافة'}</button>${l ? '<button class="btn ghost" type="button" data-action="cancelEdit">إلغاء</button>' : ''}</div></form></div>
    <div class="rows">${S.links.map(x => { const u = safeUrl(x.url); return `<div class="row nothumb"><div style="min-width:0"><b>${esc(x.title)}</b><small>${esc(x.group)} · <span dir="ltr">${u ? esc(u) : 'الرابط غير مضاف'}</span></small></div><div class="acts"><button class="btn ghost sm" data-action="editLink" data-id="${esc(x.id)}">${ic('edit')} تعديل</button><button class="btn danger sm" data-action="delArm" data-k="link" data-id="${esc(x.id)}">${ic('trash')} ${ui.done['link' + x.id] ? 'تأكيد الحذف' : 'حذف'}</button></div></div>`; }).join('') || '<div class="empty">لا توجد روابط.</div>'}</div>`;
  }
  function inboxPane() {
    const f = ui.inboxFilter, list = subs.filter(s => f === 'all' || s.status === f || s.type === f);
    const fl = [['all', 'الكل'], ['new', 'جديد'], ['review', 'قيد المعالجة'], ['done', 'مغلق'], ['complaint', 'شكاوى'], ['suggestion', 'اقتراحات'], ['inquiry', 'استفسارات']];
    return `<div class="sub-head"><h2>الشكاوى والاقتراحات</h2></div><div class="chips" style="margin-bottom:14px">${fl.map(x => `<button class="chip" aria-pressed="${f === x[0]}" data-action="ifilter" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>
    <div class="rows">${list.map(s => `<article class="inbox-item"><div class="hd"><span class="pill ${s.status}">${DG.STAT[s.status]}</span><span class="tag">${esc(DG.TYPES[s.type] || s.type)}</span><b>${esc(s.subject)}</b></div>
      <div class="bd">${esc(s.body)}</div>
      <div class="kv"><span>${esc(s.name)}</span><span dir="ltr">${esc(s.contact)}</span>${s.gov ? `<span>${esc(s.gov)}</span>` : ''}<span>${fmtDT(s.at)}</span><span>الرقم: <span class="ref" style="padding:0 6px">${esc(s.ref)}</span></span></div>
      <div class="acts"><select aria-label="الحالة" data-action="setStatus" data-id="${esc(s.id)}" style="width:auto;min-height:36px;padding:4px 10px">${Object.entries(DG.STAT).map(([k, v]) => `<option value="${k}" ${s.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select><button class="btn danger sm" data-action="delSub" data-id="${esc(s.id)}">${ic('trash')} ${ui.done['sub' + s.id] ? 'تأكيد الحذف' : 'حذف'}</button></div></article>`).join('') || '<div class="empty">لا توجد طلبات في هذا التصنيف.</div>'}</div>`;
  }
  function contentPane() {
    return Object.entries(LISTS).map(([k, c]) => {
      const e = ui.edit && ui.edit.k === k ? ui.edit : null;
      return `<div style="margin-bottom:30px"><div class="sub-head"><h2>${c.title}</h2><button class="btn sm" data-action="newItem" data-k="${k}">${ic('plus')} إضافة</button></div>
      ${e ? `<div class="formp"><form data-df="list" data-k="${k}" data-idx="${e.idx}" novalidate><div class="fgrid"><div class="fld"><label class="req" for="i-a">${c.al}</label><input id="i-a" name="a" value="${esc(e.item[c.a] || '')}"></div>
        ${c.icon ? `<div class="fld"><label for="i-ic">الأيقونة</label><select id="i-ic" name="icon">${Object.keys(ICON_NAMES).map(p => `<option value="${p}" ${e.item.icon === p ? 'selected' : ''}>${ICON_NAMES[p]}</option>`).join('')}</select></div>` : '<div></div>'}
        <div class="fld w2"><label class="req" for="i-b">${c.bl}</label><textarea id="i-b" name="b" style="min-height:90px">${esc(e.item[c.b] || '')}</textarea></div></div>
        <div class="err" data-err role="alert"></div><div class="acts" style="margin-top:12px"><button class="btn" type="submit">حفظ</button><button class="btn ghost" type="button" data-action="cancelEdit">إلغاء</button></div></form></div>` : ''}
      <div class="rows">${S[k].map((it, i) => `<div class="row nothumb"><div style="min-width:0"><b>${esc(it[c.a])}</b><small>${esc(it[c.b])}</small></div><div class="acts"><button class="btn ghost sm" data-action="editItem" data-k="${k}" data-idx="${i}">${ic('edit')} تعديل</button><button class="btn danger sm" data-action="delArm" data-k="${k}" data-id="${i}">${ic('trash')} ${ui.done[k + i] ? 'تأكيد الحذف' : 'حذف'}</button></div></div>`).join('') || '<div class="empty">القائمة فارغة.</div>'}</div></div>`;
    }).join('');
  }

  function identityPane() {
    const open = S.settings.votingOpen !== false, ap = +S.settings.identityApproved || 0;
    const t = V ? V.total : 0, counts = V ? V.counts : {}, max = Math.max(0, ...Object.values(counts));
    const rows = DG.IDENTITIES.map(I => {
      const n = counts[I.id] || 0, p = pct(n, t), lead = t > 0 && n === max;
      return `<div class="row nothumb" style="grid-template-columns:48px minmax(0,1fr) auto"><div>${DG.logo(I.id, 44)}</div>
        <div><b>${esc(I.name)}${ap === I.id ? ' · معتمدة' : ''}${lead ? ' · الأعلى' : ''}</b><div class="bar" style="margin:6px 0 2px"><i style="width:${p}%;${lead ? 'background:var(--gold-bright)' : ''}"></i></div><small class="num">${n} صوت · ${p}%</small></div>
        <div class="acts">${ap === I.id ? '<button class="btn ghost sm" data-action="unapprove">إلغاء الاعتماد</button>' : `<button class="btn sm" data-action="approve" data-id="${I.id}">${ic('check')} اعتماد</button>`}</div></div>`;
    }).join('');
    const ledger = ((audit && audit.ledger) || (V && V.ledger) || []).slice(0, 40).map(e => `<tr><td class="num">${fmtDT(e.t)}</td><td>${esc((DG.IDENTITIES[e.c - 1] || {}).name || e.c)}</td><td dir="ltr" class="num">${esc(e.h)}</td></tr>`).join('');
    return `<div class="sub-head"><h2>الهوية البصرية والتصويت</h2></div>
    <div class="mode ${open ? 'live' : 'demo'}">${ic('vote')}<div><b>التصويت ${open ? 'مفتوح' : 'مغلق'}.</b> ${ap ? 'الهوية المعتمدة الآن: ' + esc(DG.IDENTITIES[ap - 1].name) + '.' : 'لم تُعتمد هوية بعد.'} اعتماد هوية يغيّر شعار الموقع وألوانه وخطوطه لجميع الزوار.</div></div>
    ${V && V.local ? '<div class="note" style="margin-bottom:14px">وضع الملفات المحلي: الأصوات هنا من هذا المتصفح فقط. شغّل الخادم لتجميع أصوات الزوار.</div>' : ''}
    <div class="kpis"><div class="kpi"><b class="num">${t}</b><span>مجموع الأصوات</span></div>${audit && audit.uniqueVoters != null ? `<div class="kpi"><b class="num">${audit.uniqueVoters}</b><span>مصوّتاً فريداً</span></div><div class="kpi"><b class="num">${audit.changes || 0}</b><span>تغيير صوت</span></div>` : ''}</div>
    <div class="rows">${rows}</div>
    <div class="acts" style="margin-top:16px"><button class="btn ghost" data-action="toggleVoting">${open ? 'إغلاق التصويت' : 'إعادة فتح التصويت'}</button><button class="btn danger" data-action="resetVotes">${ui.done.rv ? 'تأكيد: تصفير كل الأصوات' : 'تصفير الأصوات'}</button></div>
    <div class="sub-head" style="margin-top:26px"><h2>سجل الأصوات</h2></div>
    ${ledger ? `<div class="panel" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:start">الوقت</th><th style="text-align:start">المقترح</th><th style="text-align:start">الرمز المختصر</th></tr></thead><tbody>${ledger}</tbody></table></div>` : '<div class="empty">لا توجد أصوات بعد.</div>'}`;
  }

  function settingsPane() {
    const s = S.settings;
    const fld = (k, l, t = 'input', w2 = false) => `<div class="fld ${w2 ? 'w2' : ''}"><label for="s-${k}">${l}</label>${t === 'ta' ? `<textarea id="s-${k}" name="${k}" style="min-height:90px">${esc(s[k])}</textarea>` : `<input id="s-${k}" name="${k}" value="${esc(s[k])}" ${k === 'email' || k === 'phone' ? 'dir="ltr"' : ''}>`}</div>`;
    return `<div class="sub-head"><h2>إعدادات الموقع</h2></div><form data-df="settings" novalidate>
    <div class="formp"><h3>الواجهة الرئيسية</h3><div class="fgrid">${fld('heroTitle', 'عنوان الواجهة', 'input', true)}${fld('heroText', 'النص التعريفي', 'ta', true)}${fld('quote', 'الاقتباس', 'input', true)}${fld('quoteBy', 'مصدر الاقتباس')}${fld('ministerName', 'اسم الوزير')}${fld('ministerTitle', 'المنصب')}</div></div>
    <div class="formp"><h3>عن الوزارة</h3><div class="fgrid">${fld('aboutText', 'نبذة', 'ta', true)}${fld('vision', 'الرؤية', 'ta')}${fld('mission', 'الرسالة', 'ta')}${fld('valuesText', 'القيم', 'ta', true)}</div></div>
    <div class="formp"><h3>بيانات التواصل</h3><div class="fgrid">${fld('address', 'العنوان', 'input', true)}${fld('phone', 'الهاتف')}${fld('email', 'البريد الإلكتروني')}${fld('hours', 'ساعات الاستقبال', 'input', true)}</div></div>
    <div class="formp"><h3>المظهر والتنبيهات</h3><div class="fgrid">
      <div class="fld"><label for="s-theme">الثيم الافتراضي للزوار</label><select id="s-theme" name="theme">${DG.THEMES.map(t => `<option value="${t.id}" ${s.theme === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
      <div class="fld"><span class="lbl">شريط "نموذج تصميمي"</span><label class="tog" for="s-demo"><input id="s-demo" type="checkbox" name="demoNotice" ${s.demoNotice !== false ? 'checked' : ''}> إظهار الشريط العلوي وملاحظة النماذج</label></div></div>
      <p class="note" style="margin-top:10px">الزائر الذي يختار ثيماً بنفسه يرى اختياره. وإذا اعتُمدت هوية بصرية فهي الافتراضية لمن لم يختر ثيماً.</p></div>
    <div class="acts"><button class="btn" type="submit">حفظ الإعدادات</button><button class="btn danger" type="button" data-action="resetAll">${ui.done.reset ? 'تأكيد: استعادة كل المحتوى الأصلي' : 'استعادة المحتوى الأصلي'}</button></div></form>`;
  }

  function paneHTML() {
    switch (ui.tab) {
      case 'news': return newsPane(); case 'links': return linksPane(); case 'inbox': return inboxPane();
      case 'content': return contentPane(); case 'identity': return identityPane(); case 'settings': return settingsPane();
      default: return overviewPane();
    }
  }
  function render() {
    const y = window.scrollY, nNew = subs.filter(x => x.status === 'new').length;
    const tabs = [['overview', 'grid', 'نظرة عامة'], ['news', 'news', 'الأخبار'], ['links', 'link', 'المواقع الرسمية'], ['inbox', 'inbox', 'الشكاوى والاقتراحات'], ['content', 'list', 'محتوى الأقسام'], ['identity', 'vote', 'الهوية والتصويت'], ['settings', 'gear', 'إعدادات الموقع']];
    const mode = DG.mode === 'server'
      ? `<div class="mode live">${ic('shield')}<div><b>متصل بالخادم.</b> كل تعديل تحفظه يظهر مباشرة لزوار الموقع.</div></div>`
      : `<div class="mode demo">${ic('eye')}<div><b>وضع الملفات المحلي.</b> التعديلات تُحفظ في هذا المتصفح فقط ولا يراها الزوار، ولا توجد كلمة مرور. شغّل الخادم (server.js) للنشر الفعلي والحماية.</div></div>`;
    root().innerHTML = `<div class="wrap dash"><div class="dash-top"><h1>لوحة التحكم</h1></div>${mode}
      <div class="dash-g"><nav class="side" aria-label="أقسام لوحة التحكم">${tabs.map(t => `<button data-action="tab" data-v="${t[0]}" ${ui.tab === t[0] ? 'aria-current="true"' : ''}>${ic(t[1])}${t[2]}${t[0] === 'inbox' && nNew ? `<span class="badge">${nNew}</span>` : ''}</button>`).join('')}</nav>
      <div id="dpane">${paneHTML()}</div></div></div>`;
    window.scrollTo(0, y);
  }

  /* ---------- رفع الملفات ---------- */
  async function handleImage(input) {
    const f = input.files[0]; if (!f) return; const form = input.closest('form'), prev = $('#f-prev');
    try {
      const r = await DG.upload(f);
      form.elements.namedItem('img').value = r.url; form.elements.namedItem('img2').value = ''; form.elements.namedItem('pos').value = 'center';
      prev.src = r.url; prev.style.display = 'block';
    } catch (e) { DG.toast('تعذّر رفع الصورة. جرّب صورة JPG أو PNG.'); }
  }
  async function handleVideo(input) {
    const f = input.files[0]; if (!f) return; const form = input.closest('form'), st = $('#f-vstat');
    if (!/^video\/(mp4|webm)$/.test(f.type)) { st.textContent = 'الصيغة غير مدعومة. استخدم MP4 أو WebM.'; input.value = ''; return; }
    if (f.size > 25 * 1024 * 1024) { st.textContent = 'حجم الفيديو ' + (f.size / 1048576).toFixed(1) + ' ميغابايت. الحد الأقصى 25 ميغابايت.'; input.value = ''; return; }
    st.textContent = 'جارٍ رفع الفيديو...';
    try {
      const r = await DG.upload(f); form.elements.namedItem('video').value = r.url;
      st.textContent = r.persistent ? 'تم رفع الفيديو. احفظ الخبر لنشره.' : 'وضع الملفات المحلي: الفيديو يعمل في هذه الجلسة فقط. شغّل الخادم لحفظه.';
    } catch (e) { st.textContent = 'تعذّر رفع الفيديو. حاول مرة أخرى.'; input.value = ''; }
  }

  /* ---------- الأحداث ---------- */
  async function refreshVotes() { try { V = await DG.votes(); } catch (e) { } if (DG.mode === 'server') { try { audit = await DG.req('GET', 'api/votes/audit', { auth: true }); } catch (e) { } } }
  async function refreshSubs() { try { subs = await DG.subs(); } catch (e) { subs = []; } }
  const arm = (key, fn) => { if (!ui.done[key]) { ui.done = { [key]: 1 }; render(); setTimeout(() => { if (ui.done[key]) { ui.done = {}; render(); } }, 4000); return; } ui.done = {}; fn(); };

  document.addEventListener('click', async e => {
    const a = e.target.closest('[data-action]'); if (!a || a.tagName === 'SELECT') return;
    const act = a.dataset.action, id = a.dataset.id, k = a.dataset.k;
    switch (act) {
      case 'tab': ui.tab = a.dataset.v; ui.edit = null; ui.done = {}; if (ui.tab === 'inbox') await refreshSubs(); if (ui.tab === 'identity' || ui.tab === 'overview') await refreshVotes(); render(); break;
      case 'newNews': ui.tab = 'news'; ui.edit = { k: 'news', item: { cat: DG.CATS[0], pos: 'center' } }; render(); break;
      case 'editNews': ui.edit = { k: 'news', item: DG.clone(S.news.find(n => n.id === id)) }; render(); break;
      case 'editLink': ui.edit = { k: 'link', item: DG.clone(S.links.find(n => n.id === id)) }; render(); break;
      case 'newItem': ui.edit = { k, idx: -1, item: {} }; render(); break;
      case 'editItem': ui.edit = { k, idx: +a.dataset.idx, item: DG.clone(S[k][+a.dataset.idx]) }; render(); break;
      case 'cancelEdit': ui.edit = null; render(); break;
      case 'rmVideo': { const f = a.closest('form'); f.elements.namedItem('video').value = ''; $('#f-vstat').textContent = 'سيُحذف الفيديو عند الحفظ.'; a.remove(); break; }
      case 'newsUp': { const i = S.news.findIndex(n => n.id === id); if (i > 0) { const [x] = S.news.splice(i, 1); S.news.splice(i - 1, 0, x); await commit('نُقل الخبر إلى الأعلى'); render(); } break; }
      case 'ifilter': ui.inboxFilter = a.dataset.v; render(); break;
      case 'delArm': arm(k + id, async () => {
        if (k === 'news') S.news = S.news.filter(n => n.id !== id); else if (k === 'link') S.links = S.links.filter(n => n.id !== id); else S[k].splice(+id, 1);
        await commit('تم الحذف'); render();
      }); break;
      case 'delSub': arm('sub' + id, async () => { try { await DG.delSub(id); await refreshSubs(); DG.toast('تم الحذف'); } catch (er) { DG.toast('تعذّر الحذف'); } render(); }); break;
      case 'approve': S.settings.identityApproved = +id; if (await commit('اعتُمدت الهوية: ' + DG.IDENTITIES[id - 1].name)) DG.applyLook(S.settings); fillBrand(); render(); break;
      case 'unapprove': S.settings.identityApproved = 0; await commit('أُلغي اعتماد الهوية'); DG.applyLook(S.settings); fillBrand(); render(); break;
      case 'toggleVoting': S.settings.votingOpen = S.settings.votingOpen === false; await commit(S.settings.votingOpen ? 'فُتح التصويت' : 'أُغلق التصويت'); await refreshVotes(); render(); break;
      case 'resetVotes': arm('rv', async () => { try { await DG.resetVotes(); await refreshVotes(); DG.toast('صُفّرت الأصوات'); } catch (er) { DG.toast('تعذّر التصفير'); } render(); }); break;
      case 'resetAll': arm('reset', async () => { try { await DG.resetContent(); S = await DG.loadContent(); DG.applyLook(S.settings); fillBrand(); DG.toast('استُعيد المحتوى الأصلي'); } catch (er) { DG.toast('تعذّرت الاستعادة'); } render(); }); break;
    }
  });
  document.addEventListener('change', async e => {
    if (e.target.id === 'f-img') handleImage(e.target);
    if (e.target.id === 'f-video') handleVideo(e.target);
    if (e.target.dataset && e.target.dataset.action === 'setStatus') {
      try { await DG.setStatus(e.target.dataset.id, e.target.value); await refreshSubs(); DG.toast('تم تحديث الحالة'); } catch (er) { DG.toast('تعذّر تحديث الحالة'); } render();
    }
  });
  document.addEventListener('submit', async e => {
    const f = e.target, df = f.dataset && f.dataset.df; if (!df) return; e.preventDefault();
    const err = $('[data-err]', f), v = n => ((f.elements.namedItem(n) || {}).value || '').trim();
    if (df === 'news') {
      if (!v('title') || !v('summary')) { err.textContent = 'أكمل العنوان والملخص.'; return; }
      if (!v('img')) { err.textContent = 'أضف صورة للخبر.'; return; }
      const item = { id: f.dataset.id || 'n' + DG.uid(), title: v('title'), cat: v('cat') || 'أخبار', date: v('date'), summary: v('summary'), body: v('body'), img: v('img'), img2: v('img2'), pos: v('pos') || 'center', video: v('video') };
      if (!item.img2) delete item.img2; if (!item.video) delete item.video;
      const i = S.news.findIndex(n => n.id === item.id); if (i >= 0) S.news[i] = item; else S.news.unshift(item);
      ui.edit = null; await commit(i >= 0 ? 'حُفظ الخبر' : 'نُشر الخبر'); render();
    } else if (df === 'link') {
      if (!v('title')) { err.textContent = 'اكتب اسم الرابط.'; return; }
      let url = v('url'); if (url && !safeUrl(url)) { err.textContent = 'الرابط غير صالح. ابدأه بـ https://'; return; } url = url ? safeUrl(url) : '';
      const item = { id: f.dataset.id || 'l' + DG.uid(), title: v('title'), url, group: v('group') };
      const i = S.links.findIndex(n => n.id === item.id); if (i >= 0) S.links[i] = item; else S.links.push(item);
      ui.edit = null; await commit('حُفظ الرابط'); render();
    } else if (df === 'list') {
      const c = LISTS[f.dataset.k]; if (!v('a') || !v('b')) { err.textContent = 'أكمل الحقلين.'; return; }
      const item = { [c.a]: v('a'), [c.b]: v('b') }; if (c.icon) item.icon = v('icon'); const idx = +f.dataset.idx;
      if (idx >= 0) S[f.dataset.k][idx] = item; else S[f.dataset.k].push(item);
      ui.edit = null; await commit('حُفظ التعديل'); render();
    } else if (df === 'settings') {
      Object.keys(S.settings).forEach(k => { const el = f.elements.namedItem(k); if (el && el.type !== 'checkbox') S.settings[k] = el.value.trim(); });
      S.settings.demoNotice = !!f.elements.namedItem('demoNotice').checked;
      await commit('حُفظت الإعدادات'); DG.applyLook(S.settings); render();
    }
  });

  /* ---------- التشغيل ---------- */
  function fillBrand() { $$('[data-brand]').forEach(e => e.innerHTML = `${DG.logo(DG.logoId(S.settings), 40)}<span><b>لوحة التحكم</b><small>وزارة الاقتصاد الرقمي والحوكمة</small></span>`); }
  async function start() {
    S = await DG.loadContent(); DG.applyLook(S.settings); fillBrand();
    $('#siteLink').innerHTML = ic('eye') + ' عرض الموقع';
    $('#logoutBtn').innerHTML = ic('logout') + ' خروج'; $('#logoutBtn').hidden = DG.mode !== 'server';
    await Promise.all([refreshSubs(), refreshVotes()]);
    render();
  }
  (async function boot() {
    await DG.init(); fillBrand();
    if (DG.mode === 'server' && !(await DG.checkAuth())) { renderLogin(); return; }
    await start();
  })();
})();
