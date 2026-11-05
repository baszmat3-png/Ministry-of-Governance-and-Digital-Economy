/* خمسة مقترحات للهوية البصرية: شعار وألوان وخطوط. الشعارات رسوم أصلية وليست الشعار الرسمي للدولة. */
(function () {
  'use strict';
  const L = {
    /* 1: فجر البيانات. مصفوفة نقاط تتصاعد نحو نقطة مضيئة */
    1: c => `<rect width="64" height="64" rx="17" fill="${c.primary}"/>
      <g fill="#fff"><circle cx="19" cy="45" r="2.6"/><circle cx="32" cy="45" r="3.2"/><circle cx="45" cy="45" r="3.8"/>
      <circle cx="19" cy="32" r="2.6" opacity=".55"/><circle cx="32" cy="32" r="3.9"/><circle cx="45" cy="32" r="4.8"/>
      <circle cx="19" cy="19" r="2.6" opacity=".3"/><circle cx="32" cy="19" r="3.2" opacity=".6"/></g>
      <circle cx="46" cy="17" r="6" fill="${c.accent}"/>`,
    /* 2: نخلة الشبكة. سعف النخلة خطوط دارات تنتهي بعُقد */
    2: c => `<circle cx="32" cy="32" r="32" fill="${c.deep}"/>
      <g fill="none" stroke="${c.paper}" stroke-linecap="round" stroke-width="3">
      <path d="M32 54V31" stroke-width="3.8"/><path d="M22 54h20"/>
      <path d="M32 31C26 23 18 23 11 28"/><path d="M32 31C27 20 20 16 13 16"/>
      <path d="M32 31C38 23 46 23 53 28"/><path d="M32 31C37 20 44 16 51 16"/><path d="M32 31V13"/></g>
      <g fill="${c.accent}"><circle cx="11" cy="28" r="3.2"/><circle cx="13" cy="16" r="3.2"/><circle cx="53" cy="28" r="3.2"/><circle cx="51" cy="16" r="3.2"/><circle cx="32" cy="11" r="3.6"/></g>`,
    /* 3: الزقورة الرقمية. مدرجات من بكسلات تصعد نحو بكسل ذهبي */
    3: c => `<rect width="64" height="64" rx="14" fill="${c.deep}"/>
      <g fill="${c.paper}"><rect x="9" y="42" width="46" height="9" rx="1.5"/><rect x="17" y="32" width="30" height="8" rx="1.5"/><rect x="25" y="23" width="14" height="7" rx="1.5"/></g>
      <rect x="28" y="11" width="8" height="8" rx="1.5" fill="${c.accent}"/>
      <g fill="${c.primary}"><rect x="14" y="45" width="4" height="3"/><rect x="22" y="45" width="4" height="3"/><rect x="30" y="45" width="4" height="3"/><rect x="38" y="45" width="4" height="3"/><rect x="46" y="45" width="4" height="3"/></g>`,
    /* 4: النهران. دجلة والفرات يلتقيان عند عقدة */
    4: c => `<circle cx="32" cy="32" r="32" fill="${c.primary}"/>
      <circle cx="32" cy="32" r="27" fill="none" stroke="${c.accent}" stroke-width="1.4" opacity=".7"/>
      <g fill="none" stroke="#fff" stroke-linecap="round" stroke-width="3.6">
      <path d="M17 13C28 21 13 34 32 46"/><path d="M47 13C36 21 51 34 32 46"/></g>
      <circle cx="32" cy="47" r="5.6" fill="${c.accent}"/>
      <g fill="#fff"><circle cx="32" cy="12" r="2.2"/><circle cx="24" cy="16" r="1.6" opacity=".7"/><circle cx="40" cy="16" r="1.6" opacity=".7"/></g>`,
    /* 5: مفتاح السيادة. درع سداسي بقفل ودارة */
    5: c => `<path d="M32 3 56 17v26L32 61 8 43V17z" fill="${c.deep}" stroke="${c.accent}" stroke-width="2"/>
      <g fill="none" stroke="${c.paper}" stroke-linecap="round" stroke-width="3">
      <circle cx="32" cy="26" r="7" stroke="${c.accent}"/><path d="M32 33v15"/><path d="M32 41h9"/><path d="M32 47h-8"/></g>
      <g fill="${c.accent}"><circle cx="43" cy="41" r="2.6"/><circle cx="22.5" cy="47" r="2.6"/></g>`,
  };

  const ID = [
    { id: 1, name: 'فجر البيانات',
      concept: 'نقاط رقمية تتصاعد نحو نقطة ذهبية مضيئة. تعبّر عن بيانات متفرقة تتحول إلى قرار، وعن بداية مرحلة جديدة. هوية هادئة وعملية تناسب الجهات الحكومية.',
      colors: { primary: '#0A5C55', deep: '#0B2433', accent: '#D8B05A', paper: '#F2F6F5', ink: '#0D2230' },
      fonts: { display: 'Reem Kufi', body: 'IBM Plex Sans Arabic' } },
    { id: 2, name: 'نخلة الشبكة',
      concept: 'النخلة رمز عراقي أصيل، وسعفها هنا خطوط دارات تنتهي بعُقد اتصال. تجمع الجذور الزراعية للبلد بمستقبله الرقمي، بألوان خضراء دافئة وتمرية.',
      colors: { primary: '#1F6B45', deep: '#10281C', accent: '#E0A526', paper: '#EEF3EA', ink: '#14251A' },
      fonts: { display: 'El Messiri', body: 'Almarai' } },
    { id: 3, name: 'الزقورة الرقمية',
      concept: 'مدرجات الزقورة مبنية من بكسلات تصعد نحو بكسل ذهبي. تربط حضارة وادي الرافدين بالحوسبة، بألوان الطين والفيروز المعروفة في العمارة العراقية القديمة.',
      colors: { primary: '#A4501D', deep: '#2B1B12', accent: '#2BA6A0', paper: '#F6EEDD', ink: '#2B1B12' },
      fonts: { display: 'Amiri', body: 'Tajawal' } },
    { id: 4, name: 'النهران',
      concept: 'نهران ينسابان ثم يلتقيان عند عقدة واحدة: تدفق البيانات بين مؤسسات الدولة نحو منظومة موحدة. هوية زرقاء منعشة بلمسة مائية.',
      colors: { primary: '#1B5FA8', deep: '#0A1F44', accent: '#4FD1C5', paper: '#EEF5FC', ink: '#0A1F44' },
      fonts: { display: 'Noto Kufi Arabic', body: 'Cairo' } },
    { id: 5, name: 'مفتاح السيادة',
      concept: 'درع سداسي بقفل ودارة يعبّر عن حماية البيانات والسيادة الرقمية. هوية رسمية وقوية بالعنابي والذهبي، تناسب خطاب الحوكمة والأمن المعلوماتي.',
      colors: { primary: '#7A1F2B', deep: '#2A0E14', accent: '#C9A24B', paper: '#F7F0F0', ink: '#2A0E14' },
      fonts: { display: 'Changa', body: 'Tajawal' } },
  ];
  DG.IDENTITIES = ID;
  DG.logo = function (id, size) {
    const I = ID.find(x => x.id === id) || ID[0];
    const s = size || 48;
    return `<svg class="logo" width="${s}" height="${s}" viewBox="0 0 64 64" role="img" aria-label="شعار المقترح ${I.id}: ${I.name}">${L[I.id](I.colors)}</svg>`;
  };
})();
