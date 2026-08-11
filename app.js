const DB_KEY = 'wintercamp_rental_v1';

const HIJRI_MONTHS = [
  '',
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

const seed = {
  bookings: [],
  expenses: [],
  withdrawals: [],
  devices: [
    { id: 1, name: 'RCF ART 715-A MK5', qty: 2 },
    { id: 2, name: 'سماعة بلوتوث', qty: 1 },
    { id: 3, name: 'MG-12XU ميكسر', qty: 1 },
    { id: 4, name: 'ميكروفون', qty: 4 }
  ]
};

let db = load();

let currentPage = 'home';
let reportMonth = 'all';
let reportYear = String(currentHijri().year);
let bookingSearch = '';
let bookingFilter = 'all';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

/* =====================================================
   تحسينات واجهة Winter Camp
   - اختيار الباقات / كتابة يدوية
   - تكبير شعار الفاتورة
   - منع انقسام نوع المناسبة
===================================================== */

(function injectWinterCampEnhancements() {

  if (
    document.getElementById(
      'wintercamp-enhancement-styles'
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      'style'
    );

  style.id =
    'wintercamp-enhancement-styles';

  style.textContent = `

    .invoice-preview-scroll{
      width:100% !important;
      overflow:hidden !important;
      display:block !important;
      position:relative !important;
      padding:0 !important;
      margin:0 auto 8px !important;
      direction:ltr !important;
    }

    #invoicePaper.invoice-a4{
      width:794px !important;
      height:1123px !important;
      min-width:794px !important;
      min-height:1123px !important;
      max-width:794px !important;
      max-height:1123px !important;
      background:#fff !important;
      color:#111 !important;
      overflow:hidden !important;
      box-shadow:0 10px 32px rgba(0,0,0,.18);
      border-radius:0 !important;
      position:absolute !important;
      top:0 !important;
      left:50% !important;
      margin:0 !important;
      display:block !important;
      flex:0 0 auto !important;
    }

    .wc-invoice{
      --wc-green:#0a6d49;
      --wc-green-dark:#075a3d;
      --wc-green-mid:#2e8063;
      --wc-green-soft:#edf6f2;
      --wc-line:#d9e2dd;
      --wc-muted:#6c7771;

      width:100%;
      height:100%;
      box-sizing:border-box;
      position:relative;
      display:flex;
      flex-direction:column;
      padding:28px 48px 24px;
      direction:rtl;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;
      background:#fff;
      overflow:hidden;
    }

    /* تموجات أعلى اليسار */
    .wc-top-waves{
      position:absolute;
      left:-36px;
      top:-2px;
      width:325px;
      height:175px;
      opacity:.48;
      z-index:0;
      pointer-events:none;
    }

    .wc-top-waves span{
      position:absolute;
      left:0;
      width:325px;
      height:70px;
      border-top:1.8px solid #80b49e;
      border-radius:50%;
      transform:rotate(-8deg);
    }

    .wc-top-waves span:nth-child(1){top:0}
    .wc-top-waves span:nth-child(2){top:11px}
    .wc-top-waves span:nth-child(3){top:22px}
    .wc-top-waves span:nth-child(4){top:33px}
    .wc-top-waves span:nth-child(5){top:44px}
    .wc-top-waves span:nth-child(6){top:55px}
    .wc-top-waves span:nth-child(7){top:66px}
    .wc-top-waves span:nth-child(8){top:77px}

    /* الزاوية الصوتية أعلى اليمين */
    .wc-audio-corner{
      position:absolute;
      top:0;
      right:0;
      width:220px;
      height:190px;
      overflow:hidden;
      border-bottom-left-radius:118px;
      background:
        radial-gradient(circle at 83% 17%,rgba(255,255,255,.16) 1.5px,transparent 1.8px) 0 0/13px 13px,
        linear-gradient(135deg,#4d8e75 0%,#3a7d63 48%,#2e6b53 100%);
      z-index:0;
    }

    .wc-audio-corner::before{
      content:"";
      position:absolute;
      inset:0;
      background:
        linear-gradient(115deg,rgba(255,255,255,.12),transparent 45%),
        radial-gradient(circle at 28% 65%,rgba(255,255,255,.08),transparent 46%);
    }

    .wc-waveform{
      position:absolute;
      left:15px;
      top:57px;
      width:114px;
      height:54px;
      display:flex;
      align-items:center;
      gap:3px;
      opacity:.95;
    }

    .wc-waveform i{
      display:block;
      width:2px;
      background:rgba(255,255,255,.9);
      border-radius:999px;
    }

    .wc-waveform i:nth-child(1){height:10px}
    .wc-waveform i:nth-child(2){height:18px}
    .wc-waveform i:nth-child(3){height:30px}
    .wc-waveform i:nth-child(4){height:46px}
    .wc-waveform i:nth-child(5){height:34px}
    .wc-waveform i:nth-child(6){height:20px}
    .wc-waveform i:nth-child(7){height:40px}
    .wc-waveform i:nth-child(8){height:52px}
    .wc-waveform i:nth-child(9){height:28px}
    .wc-waveform i:nth-child(10){height:18px}
    .wc-waveform i:nth-child(11){height:34px}
    .wc-waveform i:nth-child(12){height:24px}
    .wc-waveform i:nth-child(13){height:12px}
    .wc-waveform i:nth-child(14){height:22px}
    .wc-waveform i:nth-child(15){height:14px}

    .wc-mixer{
      position:absolute;
      right:12px;
      bottom:18px;
      width:118px;
      height:88px;
      transform:rotate(-8deg);
      opacity:.96;
    }

    .wc-mixer-line{
      position:absolute;
      width:10px;
      height:64px;
      top:8px;
      border-left:2px solid rgba(255,255,255,.72);
    }

    .wc-mixer-line:nth-child(1){left:12px}
    .wc-mixer-line:nth-child(2){left:38px}
    .wc-mixer-line:nth-child(3){left:64px}
    .wc-mixer-line:nth-child(4){left:90px}

    .wc-mixer-line::after{
      content:"";
      position:absolute;
      left:-6px;
      width:13px;
      height:7px;
      border-radius:3px;
      background:#f3f6f4;
      box-shadow:0 1px 1px rgba(0,0,0,.16);
    }

    .wc-mixer-line:nth-child(1)::after{top:34px}
    .wc-mixer-line:nth-child(2)::after{top:17px}
    .wc-mixer-line:nth-child(3)::after{top:43px}
    .wc-mixer-line:nth-child(4)::after{top:25px}

    .wc-invoice-header{
      position:relative;
      z-index:2;
      text-align:center;
      margin-bottom:12px;
    }

    .wc-invoice-logo{
      display:block;
      width:230px;
      height:88px;
      object-fit:contain;
      margin:0 auto;
    }

    .wc-brand-name{
      font-size:16px;
      font-weight:800;
      letter-spacing:2.1px;
      color:#111;
      direction:ltr;
      margin-top:-2px;
    }

    .wc-brand-ar{
      margin-top:2px;
      color:#2a342f;
      font-size:14px;
      font-weight:700;
    }

    .wc-invoice-title{
      width:max-content;
      margin:10px auto 0;
      padding:0 18px 8px;
      border-bottom:2px solid var(--wc-green);
      color:var(--wc-green);
      font-size:34px;
      line-height:1;
      font-weight:900;
    }

    .wc-meta{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:14px;
      position:relative;
      z-index:2;
      margin-bottom:15px;
    }

    .wc-meta-card{
      min-height:76px;
      border:1px solid var(--wc-line);
      border-radius:13px;
      background:#fff;
      display:grid;
      grid-template-columns:44px 1fr;
      align-items:center;
      padding:10px 15px;
      text-align:center;
    }

    .wc-meta-icon{
      width:36px;
      height:36px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:9px;
      background:var(--wc-green-soft);
      color:var(--wc-green);
      font-size:18px;
      font-weight:900;
    }

    .wc-meta-label{
      display:block;
      margin-bottom:4px;
      color:var(--wc-muted);
      font-size:12px;
    }

    .wc-meta-value{
      display:block;
      color:#161b18;
      font-size:15px;
      font-weight:900;
      line-height:1.5;
    }

    .wc-info-grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:14px;
      position:relative;
      z-index:2;
      margin-bottom:14px;
    }

    .wc-info-card{
      position:relative;
      min-height:176px;
      padding:28px 20px 14px;
      border:1px solid var(--wc-line);
      border-radius:14px;
      background:#fff;
    }

    .wc-info-tab{
      position:absolute;
      top:-14px;
      right:18px;
      min-width:118px;
      padding:7px 16px;
      border-radius:8px 8px 5px 5px;
      background:linear-gradient(180deg,#0a7550,#075f41);
      color:#fff;
      text-align:center;
      font-size:13px;
      font-weight:800;
      box-shadow:0 4px 10px rgba(6,107,61,.12);
    }

    .wc-data-row{
      display:grid;
      grid-template-columns:105px 1fr;
      gap:8px;
      align-items:center;
      min-height:42px;
      border-bottom:1px dashed #e1e6e3;
      font-size:13px;
      direction:rtl;
    }

    .wc-data-row:last-child{
      border-bottom:0;
    }

    .wc-data-label{
      color:#68736d;
    }

    .wc-data-value{
      color:#151b18;
      font-weight:800;
      text-align:right;
      overflow-wrap:anywhere;
    }

    .wc-phone-value{
      text-align:right !important;
      direction:ltr !important;
      unicode-bidi:isolate !important;
    }

    .wc-section-title{
      display:flex;
      align-items:center;
      justify-content:center;
      gap:12px;
      margin:0 0 7px;
      color:var(--wc-green);
      font-size:14px;
      font-weight:800;
    }

    .wc-section-title::before,
    .wc-section-title::after{
      content:"";
      height:1px;
      background:#d7e1dc;
      flex:1;
    }

    .wc-products{
      width:100%;
      table-layout:fixed;
      border-collapse:separate;
      border-spacing:0;
      border:1px solid var(--wc-line);
      border-radius:12px;
      overflow:hidden;
      margin:0 0 14px;
      position:relative;
      z-index:2;
    }

    .wc-products th{
      padding:9px 6px;
      border-left:1px solid rgba(255,255,255,.16);
      background:linear-gradient(180deg,#0b7651,#075f41);
      color:#fff;
      font-size:13px;
      font-weight:800;
    }

    .wc-products td{
      height:74px;
      padding:12px 8px;
      border-left:1px solid #d7dfdb;
      border-top:1px solid #d7dfdb;
      background:#fff;
      color:#111;
      text-align:center;
      vertical-align:middle;
      font-size:15px !important;
      font-weight:800 !important;
      line-height:1.5;
    }

    .wc-products th:last-child,
    .wc-products td:last-child{
      border-left:0;
    }

    .wc-products .wc-item{width:46%}
    .wc-products .wc-small{width:12%}
    .wc-products .wc-money{width:15%}

    .wc-products .wc-item-cell{
      text-align:right;
      font-size:15px !important;
      font-weight:800 !important;
    }

    .wc-bottom-grid{
      display:grid;
      grid-template-columns:40% 60%;
      gap:14px;
      align-items:start;
      position:relative;
      z-index:2;
      margin-bottom:0;
    }

    .wc-totals{
      border:1px solid var(--wc-line);
      border-radius:12px;
      overflow:hidden;
      background:#fff;
    }

    .wc-total-row{
      display:grid;
      grid-template-columns:1fr auto;
      align-items:center;
      min-height:42px;
      padding:0 14px;
      border-bottom:1px solid #dce4e0;
      font-size:13px;
    }

    .wc-total-row:last-child{
      border-bottom:0;
    }

    .wc-total-row strong{
      color:#111;
      font-size:15px;
    }

    .wc-total-row.wc-grand{
      min-height:54px;
      background:linear-gradient(180deg,#0b7651,#075f41);
      color:#fff;
      font-weight:900;
    }

    .wc-total-row.wc-grand strong{
      color:#fff;
      font-size:20px;
    }

    .wc-amount-card{
      min-height:114px;
      padding:16px 18px;
      border:1px solid var(--wc-line);
      border-radius:12px;
      background:#fff;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      text-align:center;
    }

    .wc-words-label{
      margin-bottom:6px;
      color:#67736d;
      font-size:12px;
      text-align:center;
    }

    .wc-words{
      color:var(--wc-green);
      font-size:16px;
      font-weight:900;
      line-height:1.55;
      text-align:center;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:clip;
    }

    /* الختم في المنتصف */
    .wc-stamp-center{
      display:flex;
      justify-content:center;
      align-items:center;
      position:relative;
      z-index:2;
      margin:4px 0 8px;
    }

    .wc-stamp{
      display:block;
      width:120px;
      height:120px;
      object-fit:contain;
      margin:0 auto;
      filter:saturate(1.28) contrast(1.06);
    }

    .wc-notes{
      min-height:54px;
      padding:9px 16px;
      border:1px solid var(--wc-line);
      border-radius:12px;
      background:#fff;
      display:grid;
      grid-template-columns:120px 1fr;
      align-items:center;
      gap:8px;
      position:relative;
      z-index:2;
      margin-bottom:12px;
    }

    .wc-notes-label{
      color:var(--wc-green);
      font-size:13px;
      font-weight:800;
    }

    .wc-notes-text{
      color:#202822;
      font-size:13px;
      font-weight:700;
      text-align:center;
    }

    .wc-footer{
      margin-top:auto;
      height:58px;
      min-height:58px;
      position:relative;
      z-index:2;
      border-radius:29px;
      background:linear-gradient(90deg,#075f41,#0b7651);
      color:#fff;
      font-size:12px;
      font-weight:700;
      direction:ltr !important;
      overflow:hidden;
    }

    .wc-footer::before,
    .wc-footer::after{
      content:"";
      position:absolute;
      top:50%;
      width:64px;
      height:64px;
      transform:translateY(-50%);
      opacity:.25;
      background:
        radial-gradient(circle,rgba(255,255,255,.95) 1.4px,transparent 1.7px);
      background-size:10px 10px;
    }

    .wc-footer::before{right:5px}
    .wc-footer::after{left:5px}

    .wc-footer-brand{
      position:absolute;
      right:20px;
      top:50%;
      transform:translateY(-50%);
      white-space:nowrap !important;
      text-align:right;
      direction:ltr !important;
    }

    .wc-footer-location{
      position:absolute;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      white-space:nowrap !important;
      text-align:center;
      direction:rtl !important;
    }

    .wc-footer-phone{
      position:absolute;
      left:20px;
      top:50%;
      transform:translateY(-50%);
      display:flex;
      align-items:center;
      justify-content:flex-start;
      gap:6px;
      white-space:nowrap !important;
      direction:ltr !important;
    }

    .wc-whatsapp-svg{
      width:18px;
      height:18px;
      color:#fff;
      flex:0 0 auto;
    }

    .invoice-actions{
      margin-top:14px !important;
    }

    @media(max-width:600px){
      .invoice-preview-scroll{
        overflow:hidden !important;
      }
    }

  `;

  document.head.appendChild(style);

})();



function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function load() {
  try {
    const saved = localStorage.getItem(DB_KEY);

    if (!saved) {
      return clone(seed);
    }

    const data = JSON.parse(saved);

    if (!Array.isArray(data.bookings)) {
      data.bookings = [];
    }

    if (!Array.isArray(data.expenses)) {
      data.expenses = [];
    }

    if (!Array.isArray(data.withdrawals)) {
      data.withdrawals = [];

      // ترحيل المسحوبات القديمة من المصاريف تلقائياً مرة واحدة
      const oldPartnerExpenses = [];
      const operatingExpenses = [];

      data.expenses.forEach(item => {
        const name = String(item.item || '')
          .trim()
          .replace(/\s+/g, ' ');

        if (
          ['انا', 'أنا', 'ثامر'].includes(name)
        ) {
          oldPartnerExpenses.push({
            id:
              Number(item.id) ||
              Date.now() +
              oldPartnerExpenses.length,

            partner:
              name === 'ثامر'
                ? 'ثامر'
                : 'عبدالله',

            amount:
              Number(item.amount || 0),

            date:
              item.date || todayISO(),

            note:
              'تم ترحيله تلقائياً من المصاريف'
          });

        } else {

          operatingExpenses.push(item);

        }
      });

      data.withdrawals =
        oldPartnerExpenses;

      data.expenses =
        operatingExpenses;
    }

    if (!Array.isArray(data.devices)) {
      data.devices =
        clone(seed.devices);
    }

    return data;

  } catch (error) {

    console.error(error);

    return clone(seed);
  }
}

function save() {
  localStorage.setItem(
    DB_KEY,
    JSON.stringify(db)
  );
}


/* =====================================================
   أدوات عامة
===================================================== */

function esc(text = '') {
  return String(text).replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c])
  );
}

function money(value) {
  return new Intl.NumberFormat(
    'ar-SA',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  ).format(
    Number(value || 0)
  ) + ' ر.س';
}


/* =====================================================
   التاريخ
===================================================== */

function todayISO() {
  const d = new Date();

  return (
    d.getFullYear() +
    '-' +
    String(
      d.getMonth() + 1
    ).padStart(2, '0') +
    '-' +
    String(
      d.getDate()
    ).padStart(2, '0')
  );
}

function getHijriParts(isoDate) {

  try {

    const date =
      new Date(
        isoDate +
        'T12:00:00'
      );

    const formatter =
      new Intl.DateTimeFormat(
        'en-u-ca-islamic-umalqura',
        {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          timeZone:
            'Asia/Riyadh'
        }
      );

    const parts =
      formatter.formatToParts(
        date
      );

    return {

      day:
        Number(
          parts.find(
            x =>
              x.type === 'day'
          )?.value
        ),

      month:
        Number(
          parts.find(
            x =>
              x.type === 'month'
          )?.value
        ),

      year:
        Number(
          parts.find(
            x =>
              x.type === 'year'
          )?.value
        )

    };

  } catch {

    return {
      day: 1,
      month: 1,
      year: 1448
    };

  }
}

function currentHijri() {
  return getHijriParts(
    todayISO()
  );
}

function hijriFull(isoDate) {

  const h =
    getHijriParts(
      isoDate
    );

  return (
    `${h.day} ` +
    `${HIJRI_MONTHS[h.month]} ` +
    `${h.year} هـ`
  );
}

function dayName(isoDate) {

  try {

    return new Intl.DateTimeFormat(
      'ar-SA',
      {
        weekday: 'long',
        timeZone:
          'Asia/Riyadh'
      }
    ).format(
      new Date(
        isoDate +
        'T12:00:00'
      )
    );

  } catch {

    return '';

  }
}

function hijriWithDay(isoDate) {

  return (
    `${dayName(isoDate)}، ` +
    `${hijriFull(isoDate)}`
  );

}

function hijriToGregorian(
  hijriYear,
  hijriMonth,
  hijriDay
) {

  hijriYear =
    Number(hijriYear);

  hijriMonth =
    Number(hijriMonth);

  hijriDay =
    Number(hijriDay);


  const estimatedYear =
    Math.floor(
      hijriYear *
      0.970224 +
      621.5774
    );


  const start =
    new Date(
      estimatedYear - 1,
      0,
      1,
      12,
      0,
      0
    );


  for (
    let offset = 0;
    offset < 900;
    offset++
  ) {

    const date =
      new Date(start);


    date.setDate(
      start.getDate() +
      offset
    );


    const iso =
      `${date.getFullYear()}-` +
      `${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-` +
      `${String(
        date.getDate()
      ).padStart(2, '0')}`;


    const h =
      getHijriParts(
        iso
      );


    if (
      h.year === hijriYear &&
      h.month === hijriMonth &&
      h.day === hijriDay
    ) {

      return iso;

    }

  }


  return null;
}


/* =====================================================
   حقول التاريخ
===================================================== */

function hijriDateFields(
  isoDate = todayISO(),
  prefix = 'date'
) {

  const selected =
    getHijriParts(
      isoDate
    );

  const current =
    currentHijri();


  let days = '';
  let months = '';
  let years = '';


  for (
    let day = 1;
    day <= 30;
    day++
  ) {

    days += `
      <option
        value="${day}"
        ${
          day === selected.day
            ? 'selected'
            : ''
        }>
        ${day}
      </option>
    `;
  }


  for (
    let month = 1;
    month <= 12;
    month++
  ) {

    months += `
      <option
        value="${month}"
        ${
          month === selected.month
            ? 'selected'
            : ''
        }>
        ${HIJRI_MONTHS[month]}
      </option>
    `;
  }


  for (
    let year = 1446;
    year <= current.year + 5;
    year++
  ) {

    years += `
      <option
        value="${year}"
        ${
          year === selected.year
            ? 'selected'
            : ''
        }>
        ${year} هـ
      </option>
    `;
  }


  return `
    <label>

      التاريخ الهجري

      <div class="hijri-selects">

        <select
          name="${prefix}_day"
          required>

          ${days}

        </select>


        <select
          name="${prefix}_month"
          required>

          ${months}

        </select>


        <select
          name="${prefix}_year"
          required>

          ${years}

        </select>

      </div>

    </label>
  `;
}


/* =====================================================
   الحسابات
===================================================== */

function totals(
  bookings = db.bookings,
  expenses = db.expenses
) {

  const revenue =
    bookings.reduce(
      (sum, item) =>
        sum +
        Number(
          item.agreed || 0
        ),
      0
    );


  const paid =
    bookings.reduce(
      (sum, item) =>
        sum +
        Number(
          item.paid || 0
        ),
      0
    );


  const expensesTotal =
    expenses.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );


  return {

    revenue,

    paid,

    remaining:
      revenue - paid,

    expenses:
      expensesTotal,

    profit:
      revenue -
      expensesTotal

  };
}


function status(booking) {

  const remaining =
    Number(
      booking.agreed || 0
    ) -
    Number(
      booking.paid || 0
    );


  if (
    remaining <= 0
  ) {

    return [
      'مدفوعة بالكامل',
      'paid'
    ];

  }


  if (
    Number(
      booking.paid || 0
    ) > 0
  ) {

    return [
      'مدفوعة جزئياً',
      'partial'
    ];

  }


  return [
    'لم يتم الدفع',
    'unpaid'
  ];
}


/* =====================================================
   الرئيسية
===================================================== */

function homeView() {

  const t =
    totals();


  const upcoming =
    [...db.bookings]

      .filter(
        b =>
          b.date >= todayISO()
      )

      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      )

      .slice(
        0,
        5
      );


  return `

    <section class="hero">

      <div>

        <h2>
          مرحباً بك 👋
        </h2>

        <p>
          ملخص نشاط Winter Camp
        </p>

      </div>

    </section>


    <div class="cards">


      <div class="stat-card stat-revenue">

        <div class="stat-card-top">

          <span class="label">
            إجمالي الإيرادات
          </span>


          <span class="dashboard-icon green-icon">

            <svg viewBox="0 0 24 24">

              <path
                d="M4 18L10 12L14 16L21 7"
              />

              <path
                d="M15 7H21V13"
              />

            </svg>

          </span>

        </div>


        <span class="value green">

          ${money(
            t.revenue
          )}

        </span>


        <small class="stat-description">
          الحجوزات المسجلة
        </small>

      </div>


      <div class="stat-card stat-expenses">

        <div class="stat-card-top">

          <span class="label">
            إجمالي المصاريف
          </span>


          <span class="report-stat-icon report-expense-icon">

            <svg viewBox="0 0 24 24">

              <rect
                x="3"
                y="6"
                width="18"
                height="14"
                rx="3"
              />

              <path
                d="M3 10H21"
              />

              <path
                d="M16 15H18"
              />

            </svg>

          </span>

        </div>


        <span class="value red">

          ${money(
            t.expenses
          )}

        </span>


        <small class="stat-description">
          المصروفات المسجلة
        </small>

      </div>


      <div class="stat-card stat-profit">

        <div class="stat-card-top">

          <span class="label">
            صافي الربح
          </span>


          <span class="dashboard-icon blue-icon">

            <svg viewBox="0 0 24 24">

              <path
                d="M4 20V13"
              />

              <path
                d="M10 20V8"
              />

              <path
                d="M16 20V4"
              />

              <path
                d="M22 20H2"
              />

            </svg>

          </span>

        </div>


        <span class="value blue">

          ${money(
            t.profit
          )}

        </span>


        <small class="stat-description">
          الإيرادات ناقص المصاريف
        </small>

      </div>
      <div class="stat-card stat-remaining">

        <div class="stat-card-top">

          <span class="label">
            المتبقي للتحصيل
          </span>


          <span class="report-stat-icon report-remaining-icon">

            <svg viewBox="0 0 24 24">

              <circle
                cx="12"
                cy="12"
                r="9"
              />

              <path
                d="M12 7V12L15 14"
              />

            </svg>

          </span>

        </div>


        <span class="value gold">

          ${money(
            t.remaining
          )}

        </span>


        <small class="stat-description">
          المبالغ المتبقية من العملاء
        </small>

      </div>

    </div>


    <div class="section-head">

      <h3>
        الحجوزات القادمة
      </h3>


      <button
        class="link-btn"
        data-go="bookings">

        عرض الكل

      </button>

    </div>


    ${
      upcoming.length

        ? upcoming
            .map(
              bookingCard
            )
            .join('')

        : `
          <div class="empty">
            لا توجد حجوزات قادمة
          </div>
        `
    }

  `;
}


/* =====================================================
   بطاقة الحجز
===================================================== */

function bookingCard(
  booking
) {

  const [
    statusText,
    statusClass
  ] =
    status(
      booking
    );


  const remaining =
    Math.max(
      0,
      Number(
        booking.agreed || 0
      ) -
      Number(
        booking.paid || 0
      )
    );


  return `

    <article class="booking-card">

      <div class="booking-top">

        <div>

          <div class="booking-name">

            ${esc(
              booking.name
            )}

          </div>


          <div class="booking-meta">

            <div>
              🔊
              ${esc(
                booking.device
              )}
            </div>


            <div>
              📍
              ${esc(
                booking.location
              )}
            </div>


            <div>
              📅
              ${hijriWithDay(
                booking.date
              )}
            </div>


            ${
              booking.phone

                ? `
                  <div>
                    ☎
                    ${esc(
                      booking.phone
                    )}
                  </div>
                `

                : ''
            }

          </div>


          <span class="badge ${statusClass}">

            ${statusText}

          </span>

        </div>


        <div class="amount">

          ${money(
            booking.agreed
          )}


          <small>

            متبقي

            <span class="red">

              ${money(
                remaining
              )}

            </span>

          </small>

        </div>

      </div>


      <div class="card-actions">

        <button
          class="small-btn"
          data-detail="${booking.id}">

          تفاصيل

        </button>


        <button
          class="small-btn primary"
          data-invoice="${booking.id}">

          عرض الفاتورة

        </button>

      </div>

    </article>

  `;
}


/* =====================================================
   البحث
===================================================== */

function normalizePhone(
  value
) {

  return String(
    value || ''
  ).replace(
    /[^\d٠-٩]/g,
    ''
  );

}


function normalizeSearch(
  value
) {

  return String(
    value || ''
  )
    .trim()
    .toLowerCase();

}


function getFilteredBookings() {

  let bookings =
    [...db.bookings];


  const today =
    todayISO();


  if (
    bookingFilter ===
    'upcoming'
  ) {

    bookings =
      bookings.filter(
        item =>
          item.date >= today
      );

  }


  if (
    bookingFilter ===
    'past'
  ) {

    bookings =
      bookings.filter(
        item =>
          item.date < today
      );

  }


  const search =
    normalizeSearch(
      bookingSearch
    );


  const phoneSearch =
    normalizePhone(
      bookingSearch
    );


  if (search) {

    bookings =
      bookings.filter(
        item => {

          const name =
            normalizeSearch(
              item.name
            );


          const phone =
            normalizePhone(
              item.phone
            );


          return (

            name.includes(
              search
            )

            ||

            (
              phoneSearch &&
              phone.includes(
                phoneSearch
              )
            )

          );

        }
      );

  }


  bookings.sort(
    (a, b) =>
      b.date.localeCompare(
        a.date
      )
  );


  return bookings;

}


/* =====================================================
   صفحة الحجوزات
===================================================== */

function bookingsView() {

  const bookings =
    getFilteredBookings();


  const title =

    bookingFilter ===
    'upcoming'

      ? 'الحجوزات القادمة'

      : bookingFilter ===
        'past'

        ? 'الحجوزات السابقة'

        : 'جميع الحجوزات';


  return `

    <div class="bookings-tools">

      <div class="booking-search-box">

        <span class="search-icon">

          <svg viewBox="0 0 24 24">

            <circle
              cx="11"
              cy="11"
              r="7"
            />

            <path
              d="M20 20L16.5 16.5"
            />

          </svg>

        </span>


        <input
          id="bookingSearch"
          type="text"
          inputmode="search"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          enterkeyhint="search"
          placeholder="بحث بالاسم أو رقم الجوال"
          value="${esc(
            bookingSearch
          )}">

      </div>


      <div class="booking-filter-tabs">

        <button
          data-booking-filter="all"
          class="${
            bookingFilter === 'all'
              ? 'active'
              : ''
          }">

          الكل

        </button>


        <button
          data-booking-filter="upcoming"
          class="${
            bookingFilter ===
            'upcoming'

              ? 'active'
              : ''
          }">

          القادمة

        </button>


        <button
          data-booking-filter="past"
          class="${
            bookingFilter === 'past'
              ? 'active'
              : ''
          }">

          السابقة

        </button>

      </div>

    </div>


    <div class="section-head">

      <h3>

        ${title}

      </h3>


      <span
        id="bookingCount"
        class="count-badge">

        ${bookings.length}

      </span>

    </div>


    <div id="bookingResults">

      ${
        bookings.length

          ? bookings
              .map(
                bookingCard
              )
              .join('')

          : `
            <div class="empty">
              لا توجد نتائج مطابقة
            </div>
          `
      }

    </div>

  `;
}


function refreshBookingResults() {

  const bookings =
    getFilteredBookings();


  const list =
    $('#bookingResults');


  const count =
    $('#bookingCount');


  if (list) {

    list.innerHTML =

      bookings.length

        ? bookings
            .map(
              bookingCard
            )
            .join('')

        : `
          <div class="empty">
            لا توجد نتائج مطابقة
          </div>
        `;

  }


  if (count) {

    count.textContent =
      bookings.length;

  }


  bindBookingResultEvents();

}


/* =====================================================
   مسحوبات شريك محدد
===================================================== */

function partnerWithdrawals(
  partner
) {

  return (
    db.withdrawals || []
  )
    .filter(
      item =>
        item.partner ===
        partner
    )
    .sort(
      (a, b) =>
        String(
          b.date || ''
        ).localeCompare(
          String(
            a.date || ''
          )
        )
    );

}


function partnerWithdrawalTotal(
  partner
) {

  return partnerWithdrawals(
    partner
  ).reduce(
    (sum, item) =>
      sum +
      Number(
        item.amount || 0
      ),
    0
  );

}


/* =====================================================
   صفحة المصاريف
===================================================== */

function expensesView() {

  const expenses =
    [...db.expenses]
      .sort(
        (a, b) =>
          b.date.localeCompare(
            a.date
          )
      );


  const abdullahTotal =
    partnerWithdrawalTotal(
      'عبدالله'
    );


  const thamerTotal =
    partnerWithdrawalTotal(
      'ثامر'
    );


  return `

    <div class="section-head">

      <div>

        <h3>
          المصاريف التشغيلية
        </h3>

        <small class="section-note">
          تخصم من صافي الربح
        </small>

      </div>


      <strong class="red">

        ${money(
          totals().expenses
        )}

      </strong>

    </div>


    ${
      expenses.length

        ? expenses
            .map(
              expense => `

                <div class="expense-row">

                  <div>

                    <strong>

                      ${esc(
                        expense.item
                      )}

                    </strong>


                    <small>

                      ${hijriWithDay(
                        expense.date
                      )}

                    </small>

                  </div>


                  <div>

                    <strong class="red">

                      ${money(
                        expense.amount
                      )}

                    </strong>


                    <div class="expense-actions">

                      <button
                        type="button"
                        class="edit-mini"
                        data-edit-expense="${expense.id}">

                        تعديل

                      </button>


                      <button
                        type="button"
                        class="delete-mini"
                        data-del-expense="${expense.id}">

                        حذف

                      </button>

                    </div>

                  </div>

                </div>

              `
            )
            .join('')

        : `
          <div class="empty compact-empty">

            لا توجد مصاريف تشغيلية

          </div>
        `
    }


    <div class="partners-withdrawals-section">

      <div class="partners-withdrawals-head">

        <div>

          <h3>
            مسحوبات الشركاء
          </h3>

          <small>
            لا تدخل ضمن المصاريف أو صافي الربح
          </small>

        </div>

      </div>


      <div class="partner-withdrawal-grid">


        <button
          type="button"
          class="partner-withdrawal-card"
          data-partner-history="عبدالله">

          <div class="partner-withdrawal-icon">

            <svg viewBox="0 0 24 24">

              <circle
                cx="12"
                cy="8"
                r="4"
              />

              <path
                d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"
              />

            </svg>

          </div>


          <span class="partner-withdrawal-name">

            عبدالله

          </span>


          <strong class="partner-withdrawal-total">

            ${money(
              abdullahTotal
            )}

          </strong>


          <small class="partner-withdrawal-open">

            اضغط لعرض السجل

          </small>

        </button>


        <button
          type="button"
          class="partner-withdrawal-card"
          data-partner-history="ثامر">

          <div class="partner-withdrawal-icon">

            <svg viewBox="0 0 24 24">

              <circle
                cx="12"
                cy="8"
                r="4"
              />

              <path
                d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"
              />

            </svg>

          </div>


          <span class="partner-withdrawal-name">

            ثامر

          </span>


          <strong class="partner-withdrawal-total">

            ${money(
              thamerTotal
            )}

          </strong>


          <small class="partner-withdrawal-open">

            اضغط لعرض السجل

          </small>

        </button>


      </div>

    </div>

  `;
}


/* =====================================================
   نافذة سجل مسحوبات الشريك
===================================================== */

function showPartnerWithdrawals(
  partner
) {

  const withdrawals =
    partnerWithdrawals(
      partner
    );


  const total =
    partnerWithdrawalTotal(
      partner
    );


  const rows =

    withdrawals.length

      ? withdrawals
          .map(
            item => `

              <div class="partner-history-row">

                <div class="partner-history-main">

                  <strong class="partner-history-amount">

                    ${money(
                      item.amount
                    )}

                  </strong>


                  <span class="partner-history-date">

                    ${hijriWithDay(
                      item.date
                    )}

                  </span>


                  ${
                    item.note

                      ? `
                        <small class="partner-history-note">

                          ${esc(
                            item.note
                          )}

                        </small>
                      `

                      : ''
                  }

                </div>


                <div class="partner-history-actions">

                  <button
                    type="button"
                    class="edit-mini"
                    data-history-edit="${item.id}">

                    تعديل

                  </button>


                  <button
                    type="button"
                    class="delete-mini"
                    data-history-delete="${item.id}">

                    حذف

                  </button>

                </div>

              </div>

            `
          )
          .join('')

      : `
        <div class="empty compact-empty">

          لا توجد مسحوبات مسجلة

        </div>
      `;


  openModal(

    `مسحوبات ${partner}`,

    `

      <div class="partner-history">

        <div class="partner-history-summary">

          <span>
            مجموع مسحوبات ${esc(
              partner
            )}
          </span>


          <strong>

            ${money(
              total
            )}

          </strong>

        </div>


        <div class="partner-history-list">

          ${rows}

        </div>


        <button
          type="button"
          class="add-partner-withdrawal-btn"
          id="addPartnerWithdrawal">

          + إضافة مسحوب

        </button>

      </div>

    `

  );


  $$('[data-history-edit]')
    .forEach(
      button => {

        button.onclick =
          () => {

            const id =
              Number(
                button.dataset
                  .historyEdit
              );


            closeModal();


            editWithdrawal(
              id
            );

          };

      }
    );


  $$('[data-history-delete]')
    .forEach(
      button => {

        button.onclick =
          () => {

            const id =
              Number(
                button.dataset
                  .historyDelete
              );


            if (
              !confirm(
                'هل تريد حذف هذا المسحوب؟'
              )
            ) {

              return;

            }


            db.withdrawals =
              (
                db.withdrawals || []
              ).filter(
                item =>
                  Number(
                    item.id
                  ) !==
                  id
              );


            save();


            showPartnerWithdrawals(
              partner
            );


            toast(
              'تم حذف المسحوب'
            );

          };

      }
    );


  const addButton =
    $('#addPartnerWithdrawal');


  if (addButton) {

    addButton.onclick =
      () => {

        closeModal();


        openWithdrawalForm(
          null,
          partner
        );

      };

  }

}
/* =====================================================
   التقارير
===================================================== */

function getAvailableHijriYears() {

  const current =
    currentHijri().year;


  const years =
    [];


  for (
    let year = 1446;
    year <= current + 5;
    year++
  ) {

    years.push(
      year
    );

  }


  return years;

}


function filterByHijriPeriod(
  items,
  month = reportMonth,
  year = reportYear
) {

  return items.filter(
    item => {

      const h =
        getHijriParts(
          item.date
        );


      const monthMatch =

        month === 'all'

        ||

        h.month ===
          Number(
            month
          );


      const yearMatch =

        year === 'all'

        ||

        h.year ===
          Number(
            year
          );


      return (
        monthMatch &&
        yearMatch
      );

    }
  );

}


function reportPeriodTitle() {

  if (
    reportMonth === 'all'
    &&
    reportYear === 'all'
  ) {

    return 'جميع الأشهر وجميع السنوات';

  }


  if (
    reportMonth === 'all'
  ) {

    return (
      `جميع أشهر سنة ${reportYear} هـ`
    );

  }


  if (
    reportYear === 'all'
  ) {

    return (
      `${HIJRI_MONTHS[
        Number(
          reportMonth
        )
      ]} - جميع السنوات`
    );

  }


  return (
    `${HIJRI_MONTHS[
      Number(
        reportMonth
      )
    ]} ${reportYear} هـ`
  );

}


/* =====================================================
   التقرير الشهري
===================================================== */

function monthlyBreakdownView() {

  if (
    reportMonth !== 'all'
    ||
    reportYear === 'all'
  ) {

    return '';

  }


  let html = `

    <div class="section-head">

      <h3>
        أشهر سنة ${reportYear} هـ
      </h3>

    </div>


    <div class="months-list">

  `;


  for (
    let month = 1;
    month <= 12;
    month++
  ) {

    const bookings =
      filterByHijriPeriod(
        db.bookings,
        String(
          month
        ),
        reportYear
      );


    const expenses =
      filterByHijriPeriod(
        db.expenses,
        String(
          month
        ),
        reportYear
      );


    const t =
      totals(
        bookings,
        expenses
      );


    html += `

      <button
        class="month-report-card"
        data-report-month="${month}">

        <div>

          <strong>
            ${HIJRI_MONTHS[month]}
          </strong>

          <small>
            ${bookings.length} حجز
          </small>

        </div>


        <div class="month-report-money">

          <span class="green">

            ${money(
              t.revenue
            )}

          </span>


          <small>

            المصاريف:
            ${money(
              t.expenses
            )}

            <br>

            الصافي:
            ${money(
              t.profit
            )}

          </small>

        </div>

      </button>

    `;

  }


  html += `
    </div>
  `;


  return html;

}


/* =====================================================
   صفحة التقارير
===================================================== */

function reportsView() {

  const bookings =
    filterByHijriPeriod(
      db.bookings
    );


  const expenses =
    filterByHijriPeriod(
      db.expenses
    );


  const t =
    totals(
      bookings,
      expenses
    );


  const years =
    getAvailableHijriYears();


  return `

    <div class="report-title">

      <h2>
        التقرير المالي
      </h2>


      <p>
        ${reportPeriodTitle()}
      </p>

    </div>


    <div class="report-filters">


      <label>

        الشهر الهجري

        <select id="reportMonthFilter">


          <option
            value="all"
            ${
              reportMonth === 'all'
                ? 'selected'
                : ''
            }>

            جميع الأشهر

          </option>


          ${
            HIJRI_MONTHS

              .map(
                (
                  month,
                  index
                ) => {

                  if (!index) {

                    return '';

                  }


                  return `

                    <option
                      value="${index}"
                      ${
                        String(
                          index
                        ) ===
                        String(
                          reportMonth
                        )

                          ? 'selected'
                          : ''
                      }>

                      ${month}

                    </option>

                  `;

                }
              )

              .join('')
          }

        </select>

      </label>


      <label>

        السنة الهجرية

        <select id="reportYearFilter">


          <option
            value="all"
            ${
              reportYear === 'all'
                ? 'selected'
                : ''
            }>

            جميع السنوات

          </option>


          ${
            years

              .map(
                year => `

                  <option
                    value="${year}"
                    ${
                      String(
                        year
                      ) ===
                      String(
                        reportYear
                      )

                        ? 'selected'
                        : ''
                    }>

                    ${year} هـ

                  </option>

                `
              )

              .join('')
          }

        </select>

      </label>

    </div>


    <div class="cards">

  <div class="stat-card stat-revenue">

    <div class="stat-card-top">

      <span class="label">
        الإيرادات
      </span>

      <span class="dashboard-icon green-icon">
        <svg viewBox="0 0 24 24">
          <path d="M4 18L10 12L14 16L21 7"/>
          <path d="M15 7H21V13"/>
        </svg>
      </span>

    </div>

    <span class="value green">
      ${money(
        t.revenue
      )}
    </span>

  </div>


  <div class="stat-card stat-expenses">

    <div class="stat-card-top">

      <span class="label">
        المصاريف
      </span>

      <span class="dashboard-icon red-icon">
        <svg viewBox="0 0 24 24">
          <rect
            x="3"
            y="6"
            width="18"
            height="14"
            rx="3"
          />
          <path d="M3 10H21"/>
          <path d="M16 15H18"/>
        </svg>
      </span>

    </div>

    <span class="value red">
      ${money(
        t.expenses
      )}
    </span>

  </div>


  <div class="stat-card stat-profit">

    <div class="stat-card-top">

      <span class="label">
        صافي الربح
      </span>

      <span class="dashboard-icon blue-icon">
        <svg viewBox="0 0 24 24">
          <path d="M4 20V13"/>
          <path d="M10 20V8"/>
          <path d="M16 20V4"/>
          <path d="M22 20H2"/>
        </svg>
      </span>

    </div>

    <span class="value blue">
      ${money(
        t.profit
      )}
    </span>

  </div>


  <div class="stat-card stat-remaining">

    <div class="stat-card-top">

      <span class="label">
        المتبقي
      </span>

      <span class="dashboard-icon gold-icon">
        <svg viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="9"
          />
          <path d="M12 7V12L15 14"/>
        </svg>
      </span>

    </div>

    <span class="value gold">
      ${money(
        t.remaining
      )}
    </span>

  </div>

</div>

${monthlyBreakdownView()}

    ${monthlyBreakdownView()}

  `;

}


/* =====================================================
   الأجهزة
===================================================== */

function devicesView() {

  return `

    <div class="section-head">

      <h3>
        الأجهزة
      </h3>

    </div>


    ${
      db.devices

        .map(
          device => `

            <div class="device-card">

              <strong>
                ${esc(
                  device.name
                )}
              </strong>


              <small>
                الكمية:
                ${device.qty}
              </small>

            </div>

          `
        )

        .join('')
    }

  `;

}


/* =====================================================
   قائمة الفواتير
===================================================== */

function invoicesView() {

  const bookings =
    [...db.bookings]

      .sort(
        (a, b) =>
          b.date.localeCompare(
            a.date
          )
      );


  return `

    <div class="section-head">

      <h3>
        الفواتير
      </h3>

    </div>


    ${
      bookings.length

        ? bookings

            .map(
              booking => `

                <div class="invoice-row">

                  <div>

                    <strong>

                      فاتورة #${String(
                        booking.id
                      ).slice(-6)}

                    </strong>


                    <small>

                      ${esc(
                        booking.name
                      )}

                      <br>

                      ${hijriFull(
                        booking.date
                      )}

                    </small>

                  </div>


                  <button
                    class="small-btn primary"
                    data-invoice="${booking.id}">

                    عرض

                  </button>

                </div>

              `
            )

            .join('')

        : `
          <div class="empty">
            لا توجد فواتير
          </div>
        `
    }

  `;

}


/* =====================================================
   الإعدادات
===================================================== */

function settingsView() {

  return `

    <div class="section-head">

      <h3>
        الإعدادات
      </h3>

    </div>


    <div class="settings-card">

      <strong>
        نظام التاريخ
      </strong>

      <small>
        هجري - تقويم أم القرى
      </small>

    </div>


    <div class="settings-card">

      <strong>
        سنوات التقارير
      </strong>

      <small>
        من 1446 هـ
      </small>

    </div>


    <button
      id="settingsExport"
      class="submit-btn">

      تصدير نسخة احتياطية

    </button>

  `;

}


/* =====================================================
   العرض
===================================================== */

function render() {

  const titles = {

    home:
      'الرئيسية',

    bookings:
      'الحجوزات',

    expenses:
      'المصاريف',

    reports:
      'التقارير',

    devices:
      'الأجهزة',

    invoices:
      'الفواتير',

    settings:
      'الإعدادات'

  };


  const pageTitle =
    $('#pageTitle');


  if (pageTitle) {

    pageTitle.textContent =
      titles[
        currentPage
      ]
      ||
      'الرئيسية';

  }


  $$('.nav-item')

    .forEach(
      button => {

        button.classList.toggle(

          'active',

          button.dataset.page ===
            currentPage

        );

      }
    );


  const views = {

    home:
      homeView,

    bookings:
      bookingsView,

    expenses:
      expensesView,

    reports:
      reportsView,

    devices:
      devicesView,

    invoices:
      invoicesView,

    settings:
      settingsView

  };


  const main =
    $('#mainContent');


  if (main) {

    main.innerHTML =
      (
        views[
          currentPage
        ]
        ||
        homeView
      )();

  }


  bindViewEvents();

}


function go(page) {

  currentPage =
    page;


  render();

}


/* =====================================================
   أحداث الحجوزات
===================================================== */

function bindBookingResultEvents() {

  $$('[data-detail]')

    .forEach(
      button => {

        button.onclick =
          () =>
            showDetail(

              Number(
                button.dataset.detail
              )

            );

      }
    );


  $$('[data-invoice]')

    .forEach(
      button => {

        button.onclick =
          () =>
            showInvoice(

              Number(
                button.dataset.invoice
              )

            );

      }
    );

}


/* =====================================================
   أحداث الصفحة
===================================================== */

function bindViewEvents() {


  /* -------------------------
     التنقل
  ------------------------- */

  $$('[data-go]')

    .forEach(
      button => {

        button.onclick =
          () =>
            go(
              button.dataset.go
            );

      }
    );


  bindBookingResultEvents();


  /* -------------------------
     المصاريف
  ------------------------- */

  $$('[data-edit-expense]')

    .forEach(
      button => {

        button.onclick =
          () =>
            editExpense(

              Number(
                button.dataset
                  .editExpense
              )

            );

      }
    );


  $$('[data-del-expense]')

    .forEach(
      button => {

        button.onclick =
          () =>
            deleteExpense(

              Number(
                button.dataset
                  .delExpense
              )

            );

      }
    );


  /* -------------------------
     مربعات الشركاء
  ------------------------- */

  $$('[data-partner-history]')

    .forEach(
      button => {

        button.onclick =
          () => {

            const partner =
              button.dataset
                .partnerHistory;


            showPartnerWithdrawals(
              partner
            );

          };

      }
    );


  /* -------------------------
     بحث الحجوزات
  ------------------------- */

  const searchInput =
    $('#bookingSearch');


  if (searchInput) {

    searchInput.addEventListener(

      'input',

      event => {

        bookingSearch =
          event.target.value;


        refreshBookingResults();

      }

    );

  }


  /* -------------------------
     فلترة الحجوزات
  ------------------------- */

  $$('[data-booking-filter]')

    .forEach(
      button => {

        button.onclick =
          () => {

            bookingFilter =
              button.dataset
                .bookingFilter;


            render();

          };

      }
    );


  /* -------------------------
     الشهر
  ------------------------- */

  const monthFilter =
    $('#reportMonthFilter');


  if (monthFilter) {

    monthFilter.onchange =
      event => {

        reportMonth =
          event.target.value;


        render();

      };

  }


  /* -------------------------
     السنة
  ------------------------- */

  const yearFilter =
    $('#reportYearFilter');


  if (yearFilter) {

    yearFilter.onchange =
      event => {

        reportYear =
          event.target.value;


        render();

      };

  }


  /* -------------------------
     فتح تقرير شهر
  ------------------------- */

  $$('[data-report-month]')

    .forEach(
      button => {

        button.onclick =
          () => {

            reportMonth =
              button.dataset
                .reportMonth;


            render();

          };

      }
    );


  /* -------------------------
     النسخة الاحتياطية
  ------------------------- */

  const settingsExport =
    $('#settingsExport');


  if (settingsExport) {

    settingsExport.onclick =
      exportData;

  }

}


/* =====================================================
   النوافذ
===================================================== */

function openModal(
  title,
  content
) {

  const modalTitle =
    $('#modalTitle');


  const modalBody =
    $('#modalBody');


  if (modalTitle) {

    modalTitle.textContent =
      title;

  }


  if (modalBody) {

    modalBody.innerHTML =
      content;

  }


  $('#modalBackdrop')
    ?.classList
    .remove(
      'hidden'
    );


  $('#modal')
    ?.classList
    .remove(
      'hidden'
    );

}


function closeModal() {

  $('#modalBackdrop')
    ?.classList
    .add(
      'hidden'
    );


  $('#modal')
    ?.classList
    .add(
      'hidden'
    );

}
/* =====================================================
   تفاصيل الحجز
===================================================== */

function showDetail(id) {

  const booking =
    db.bookings.find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!booking) {
    return;
  }


  const remaining =
    Math.max(
      0,
      Number(booking.agreed || 0) -
      Number(booking.paid || 0)
    );


  openModal(
    'تفاصيل الحجز',
    `

      <div class="detail-list">

        <div>
          <span>اسم العميل</span>
          <strong>
            ${esc(booking.name)}
          </strong>
        </div>


        <div>
          <span>رقم الجوال</span>
          <strong dir="ltr">
            ${esc(booking.phone || '-')}
          </strong>
        </div>


        <div>
          <span>نوع المناسبة</span>
          <strong>
            ${esc(booking.eventType || '-')}
          </strong>
        </div>


        <div>
          <span>الباقة / الأجهزة</span>
          <strong>
            ${esc(booking.device)}
          </strong>
        </div>


        <div>
          <span>الموقع</span>
          <strong>
            ${esc(booking.location)}
          </strong>
        </div>


        <div>
          <span>التاريخ</span>
          <strong>
            ${hijriWithDay(booking.date)}
          </strong>
        </div>


        <div>
          <span>المبلغ</span>
          <strong class="green">
            ${money(booking.agreed)}
          </strong>
        </div>


        <div>
          <span>الواصل</span>
          <strong class="blue">
            ${money(booking.paid)}
          </strong>
        </div>


        <div>
          <span>المتبقي</span>
          <strong class="red">
            ${money(remaining)}
          </strong>
        </div>

      </div>


      <div class="card-actions">

        <button
          id="detailInvoice"
          class="small-btn primary">

          عرض الفاتورة

        </button>


        <button
          id="editBooking"
          class="small-btn">

          تعديل

        </button>

      </div>


      <button
        id="deleteBooking"
        class="delete-full">

        حذف الحجز

      </button>

    `
  );


  $('#detailInvoice').onclick =
    () =>
      showInvoice(id);


  $('#editBooking').onclick =
    () =>
      openBookingForm(
        booking
      );


  $('#deleteBooking').onclick =
    () => {

      if (
        confirm(
          'هل تريد حذف الحجز؟'
        )
      ) {

        db.bookings =
          db.bookings.filter(
            item =>
              Number(item.id) !==
              Number(id)
          );


        save();

        closeModal();

        render();

        toast(
          'تم حذف الحجز'
        );

      }

    };

}


/* =====================================================
   نموذج الحجز
===================================================== */

function openBookingForm(
  existing = null
) {

  const booking =
    existing || {

      name: '',

      phone: '',

      eventType: '',

      device: '',

      location: '',

      date: todayISO(),

      agreed: '',

      paid: '',

      notes: ''

    };


  const devicePackages = [

    'عدد (1) سماعة RCF ART 715-A MK5 SPEAKER 13000824 بقوة (1400) واط',

    'عدد (2) سماعة RCF ART 715-A MK5 SPEAKER 13000824 بقوة (1400) واط',

    'عدد (1) سماعة RCF ART 715-A MK5 SPEAKER 13000824 بقوة (1400) واط + ياماها ميكسر 12 قناة MG-12XU + ميكروفون صوتي ديناميكي',

    'عدد (2) سماعة RCF ART 715-A MK5 SPEAKER 13000824 بقوة (1400) واط + ياماها ميكسر 12 قناة MG-12XU + ميكروفون صوتي ديناميكي'

  ];


  const currentDevice =
    String(
      booking.device || ''
    ).trim();


  const currentPackageIndex =
    devicePackages.indexOf(
      currentDevice
    );


  const initialDeviceMode =
    currentDevice
      ? (
          currentPackageIndex === -1
            ? 'manual'
            : 'list'
        )
      : 'closed';


  openModal(

    existing
      ? 'تعديل الحجز'
      : 'حجز جديد',

    `

      <form
        id="bookingForm"
        class="form-grid">


        <label>

          اسم العميل

          <input
            name="name"
            required
            value="${esc(
              booking.name
            )}">

        </label>


        <label>

          رقم الجوال

          <input
            name="phone"
            type="tel"
            inputmode="numeric"
            autocomplete="tel"
            value="${esc(
              booking.phone || ''
            )}"
            placeholder="05xxxxxxxx">

        </label>


        <label>

          نوع المناسبة

          <input
            name="eventType"
            value="${esc(
              booking.eventType || ''
            )}"
            placeholder="مثال: زواج">

        </label>


        <label class="device-package-field">

          <span class="device-package-label-line">
            <span>
              نوع الأجهزة / الباقة
            </span>

            <span class="optional-badge">
              اختياري
            </span>
          </span>


          <div class="device-mode-tabs">

            <button
              type="button"
              id="deviceListMode"
              class="device-mode-btn ${
                initialDeviceMode === 'list'
                  ? 'active'
                  : ''
              }">
              ${
                currentPackageIndex >= 0
                  ? `الباقة ${currentPackageIndex + 1} محددة ✓`
                  : 'اختيار الباقة'
              }
            </button>


            <button
              type="button"
              id="deviceManualMode"
              class="device-mode-btn ${
                initialDeviceMode === 'manual'
                  ? 'active'
                  : ''
              }">
              كتابة يدوية
            </button>

          </div>


          <div
            id="deviceListSection"
            class="device-list-section ${
              initialDeviceMode === 'list'
                ? ''
                : 'hidden'
            }"
            style="display:${
              initialDeviceMode === 'list'
                ? 'block'
                : 'none'
            }">

            <div class="device-package-list">

              ${
                devicePackages
                  .map(
                    (
                      packageText,
                      index
                    ) => `

                      <button
                        type="button"
                        class="device-package ${
                          currentPackageIndex === index
                            ? 'selected'
                            : ''
                        }"
                        data-device-value="${esc(
                          packageText
                        )}">

                        <span class="device-package-number">
                          ${index + 1}
                        </span>

                        <span class="device-package-text">
                          ${esc(
                            packageText
                          )}
                        </span>

                      </button>

                    `
                  )
                  .join('')
              }

            </div>

          </div>


          <div
            id="deviceManualSection"
            class="device-manual-section ${
              initialDeviceMode === 'manual'
                ? ''
                : 'hidden'
            }"
            style="display:${
              initialDeviceMode === 'manual'
                ? 'block'
                : 'none'
            }">

            <input
              id="deviceManualInput"
              type="text"
              autocomplete="off"
              value="${
                initialDeviceMode === 'manual'
                  ? esc(currentDevice)
                  : ''
              }"
              placeholder="اكتب نوع الأجهزة أو تفاصيل الباقة">

          </div>


          <input
            id="deviceValue"
            name="device"
            type="hidden"
            value="${esc(
              currentDevice
            )}">

        </label>


        <label>

          الموقع

          <input
            name="location"
            required
            value="${esc(
              booking.location || ''
            )}"
            placeholder="مثال: أبها - حي العرين">

        </label>


        ${hijriDateFields(
          booking.date,
          'booking'
        )}


        <div class="form-row">


          <label>

            المبلغ المتفق عليه

            <input
              name="agreed"
              type="number"
              inputmode="decimal"
              min="0"
              required
              value="${booking.agreed}">

          </label>


          <label>

            الواصل

            <input
              name="paid"
              type="number"
              inputmode="decimal"
              min="0"
              required
              value="${booking.paid}">

          </label>


        </div>


        <label>

          ملاحظات

          <textarea
            name="notes"
            rows="3">${esc(
              booking.notes || ''
            )}</textarea>

        </label>


        <button
          type="submit"
          class="submit-btn">

          ${
            existing
              ? 'حفظ التعديلات'
              : 'إضافة الحجز'
          }

        </button>

      </form>

    `

  );


  const deviceValue =
    $('#deviceValue');

  const deviceListMode =
    $('#deviceListMode');

  const deviceManualMode =
    $('#deviceManualMode');

  const deviceListSection =
    $('#deviceListSection');

  const deviceManualSection =
    $('#deviceManualSection');

  const deviceManualInput =
    $('#deviceManualInput');


  function setDeviceMode(
    mode
  ) {

    const listMode =
      mode === 'list';

    const manualMode =
      mode === 'manual';


    deviceListMode
      ?.classList.toggle(
        'active',
        listMode
      );


    deviceManualMode
      ?.classList.toggle(
        'active',
        manualMode
      );


    deviceListSection
      ?.classList.toggle(
        'hidden',
        !listMode
      );

    if (deviceListSection) {
      deviceListSection.style.display =
        listMode ? 'block' : 'none';
    }


    deviceManualSection
      ?.classList.toggle(
        'hidden',
        !manualMode
      );

    if (deviceManualSection) {
      deviceManualSection.style.display =
        manualMode ? 'block' : 'none';
    }


    if (
      manualMode &&
      deviceManualInput &&
      deviceValue
    ) {

      if (
        !deviceManualInput.value
      ) {

        deviceManualInput.value =
          deviceValue.value || '';

      }


      setTimeout(
        () =>
          deviceManualInput.focus(),
        40
      );

    }

  }


  if (deviceListMode) {

    deviceListMode.onclick =
      () => {

        const isOpen =
          deviceListSection &&
          !deviceListSection.classList.contains(
            'hidden'
          );


        setDeviceMode(
          isOpen
            ? 'closed'
            : 'list'
        );

      };

  }


  if (deviceManualMode) {

    deviceManualMode.onclick =
      () =>
        setDeviceMode(
          'manual'
        );

  }


  $$('.device-package')
    .forEach(
      button => {

        button.onclick =
          () => {

            const value =
              String(
                button.dataset
                  .deviceValue || ''
              );


            $$('.device-package')
              .forEach(
                item =>
                  item.classList.remove(
                    'selected'
                  )
              );


            button.classList.add(
              'selected'
            );


            if (deviceValue) {

              deviceValue.value =
                value;

            }


            if (deviceManualInput) {

              deviceManualInput.value =
                value;

            }


            deviceListMode.textContent =
              `الباقة ${
                Number(
                  [...$$('.device-package')]
                    .indexOf(button)
                ) + 1
              } محددة ✓`;

            // إغلاق قائمة الباقات مباشرة بعد الاختيار
            setDeviceMode(
              'closed'
            );

          };

      }
    );


  if (
    deviceManualInput
  ) {

    deviceManualInput.oninput =
      () => {

        if (deviceValue) {

          deviceValue.value =
            deviceManualInput.value;

        }


        $$('.device-package')
          .forEach(
            item =>
              item.classList.remove(
                'selected'
              )
          );

      };

  }


  $('#bookingForm').onsubmit =
    event => {

      event.preventDefault();


      const form =
        new FormData(
          event.target
        );


      const date =
        hijriToGregorian(

          form.get(
            'booking_year'
          ),

          form.get(
            'booking_month'
          ),

          form.get(
            'booking_day'
          )

        );


      if (!date) {

        toast(
          'تعذر تحويل التاريخ الهجري'
        );

        return;

      }


      const agreed =
        Number(
          form.get('agreed') || 0
        );


      const paid =
        Number(
          form.get('paid') || 0
        );


      if (
        paid > agreed
      ) {

        toast(
          'الواصل لا يمكن أن يكون أكبر من المبلغ المتفق عليه'
        );

        return;

      }


      const data = {

        id:
          existing
            ? existing.id
            : Date.now(),

        name:
          String(
            form.get('name') || ''
          ).trim(),

        phone:
          String(
            form.get('phone') || ''
          ).trim(),

        eventType:
          String(
            form.get('eventType') || ''
          ).trim(),

        device:
          String(
            form.get('device') || ''
          ).trim(),

        location:
          String(
            form.get('location') || ''
          ).trim(),

        date,

        agreed,

        paid,

        notes:
          String(
            form.get('notes') || ''
          ).trim()

      };


      if (existing) {

        const index =
          db.bookings.findIndex(
            item =>
              Number(item.id) ===
              Number(existing.id)
          );


        if (
          index !== -1
        ) {

          db.bookings[index] =
            data;

        }

      } else {

        db.bookings.push(
          data
        );

      }


      save();

      closeModal();

      render();


      toast(
        existing
          ? 'تم تعديل الحجز'
          : 'تم إضافة الحجز'
      );

    };

}


/* =====================================================
   نموذج المصروف
===================================================== */

function openExpenseForm(
  existing = null
) {

  const expense =
    existing || {

      item: '',

      amount: '',

      date: todayISO()

    };


  openModal(

    existing
      ? 'تعديل المصروف'
      : 'إضافة مصروف',

    `

      <form
        id="expenseForm"
        class="form-grid">


        <label>

          اسم المصروف

          <input
            name="item"
            required
            value="${esc(
              expense.item || ''
            )}"
            placeholder="مثال: وقود">

        </label>


        <label>

          المبلغ

          <input
            name="amount"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            required
            value="${expense.amount}">

        </label>


        ${hijriDateFields(
          expense.date,
          'expense'
        )}


        <button
          type="submit"
          class="submit-btn">

          ${
            existing
              ? 'حفظ التعديلات'
              : 'إضافة المصروف'
          }

        </button>

      </form>

    `

  );


  $('#expenseForm').onsubmit =
    event => {

      event.preventDefault();


      const form =
        new FormData(
          event.target
        );


      const date =
        hijriToGregorian(

          form.get(
            'expense_year'
          ),

          form.get(
            'expense_month'
          ),

          form.get(
            'expense_day'
          )

        );


      if (!date) {

        toast(
          'تعذر تحويل التاريخ الهجري'
        );

        return;

      }


      const data = {

        id:
          existing
            ? existing.id
            : Date.now(),

        item:
          String(
            form.get('item') || ''
          ).trim(),

        amount:
          Number(
            form.get('amount') || 0
          ),

        date

      };


      if (existing) {

        const index =
          db.expenses.findIndex(
            item =>
              Number(item.id) ===
              Number(existing.id)
          );


        if (
          index !== -1
        ) {

          db.expenses[index] =
            data;

        }

      } else {

        db.expenses.push(
          data
        );

      }


      save();

      closeModal();

      render();


      toast(
        existing
          ? 'تم تعديل المصروف'
          : 'تم إضافة المصروف'
      );

    };

}


/* =====================================================
   تعديل وحذف المصروف
===================================================== */

function editExpense(id) {

  const expense =
    db.expenses.find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!expense) {
    return;
  }


  openExpenseForm(
    expense
  );

}


function deleteExpense(id) {

  const expense =
    db.expenses.find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!expense) {
    return;
  }


  if (
    !confirm(
      `هل تريد حذف المصروف "${expense.item}"؟`
    )
  ) {

    return;

  }


  db.expenses =
    db.expenses.filter(
      item =>
        Number(item.id) !==
        Number(id)
    );


  save();

  render();


  toast(
    'تم حذف المصروف'
  );

}


/* =====================================================
   نموذج مسحوبات الشركاء
===================================================== */

function openWithdrawalForm(
  existing = null,
  selectedPartner = ''
) {

  const withdrawal =
    existing || {

      partner:
        selectedPartner ||
        'عبدالله',

      amount: '',

      date: todayISO(),

      note: ''

    };


  const partner =
    existing
      ? withdrawal.partner
      : (
          selectedPartner ||
          withdrawal.partner ||
          'عبدالله'
        );


  openModal(

    existing
      ? `تعديل مسحوب ${partner}`
      : `إضافة مسحوب لـ ${partner}`,

    `

      <form
        id="withdrawalForm"
        class="form-grid">


        <div class="withdrawal-partner-display">

          <span>
            الشريك
          </span>

          <strong>
            ${esc(partner)}
          </strong>

        </div>


        <input
          type="hidden"
          name="partner"
          value="${esc(partner)}">


        <label>

          مبلغ المسحوب

          <input
            name="amount"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            required
            value="${withdrawal.amount}">

        </label>


        ${hijriDateFields(
          withdrawal.date,
          'withdrawal'
        )}


        <label>

          ملاحظة

          <textarea
            name="note"
            rows="3"
            placeholder="مثال: سحب شخصي">${esc(
              withdrawal.note || ''
            )}</textarea>

        </label>


        <div class="withdrawal-form-note">

          هذا المبلغ لا يعتبر مصروفاً
          ولا يخصم من صافي الربح.

        </div>


        <button
          type="submit"
          class="submit-btn withdrawal-submit">

          ${
            existing
              ? 'حفظ التعديلات'
              : 'إضافة المسحوب'
          }

        </button>

      </form>

    `

  );


  $('#withdrawalForm').onsubmit =
    event => {

      event.preventDefault();


      const form =
        new FormData(
          event.target
        );


      const date =
        hijriToGregorian(

          form.get(
            'withdrawal_year'
          ),

          form.get(
            'withdrawal_month'
          ),

          form.get(
            'withdrawal_day'
          )

        );


      if (!date) {

        toast(
          'تعذر تحويل التاريخ الهجري'
        );

        return;

      }


      const amount =
        Number(
          form.get('amount') || 0
        );


      if (
        amount <= 0
      ) {

        toast(
          'أدخل مبلغ المسحوب'
        );

        return;

      }


      const data = {

        id:
          existing
            ? existing.id
            : Date.now(),

        partner:
          String(
            form.get('partner') || ''
          ).trim(),

        amount,

        date,

        note:
          String(
            form.get('note') || ''
          ).trim()

      };


      if (existing) {

        const index =
          db.withdrawals.findIndex(
            item =>
              Number(item.id) ===
              Number(existing.id)
          );


        if (
          index !== -1
        ) {

          db.withdrawals[index] =
            data;

        }

      } else {

        db.withdrawals.push(
          data
        );

      }


      save();

      closeModal();

      render();


      toast(
        existing
          ? 'تم تعديل المسحوب'
          : `تم إضافة مسحوب ${partner}`
      );

    };

}


/* =====================================================
   تعديل مسحوب
===================================================== */

function editWithdrawal(id) {

  const withdrawal =
    (
      db.withdrawals || []
    ).find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!withdrawal) {

    return;

  }


  openWithdrawalForm(
    withdrawal,
    withdrawal.partner
  );

}


/* =====================================================
   حذف مسحوب
===================================================== */

function deleteWithdrawal(id) {

  const withdrawal =
    (
      db.withdrawals || []
    ).find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!withdrawal) {

    return;

  }


  if (
    !confirm(
      `هل تريد حذف مسحوب ${withdrawal.partner}؟`
    )
  ) {

    return;

  }


  db.withdrawals =
    (
      db.withdrawals || []
    ).filter(
      item =>
        Number(item.id) !==
        Number(id)
    );


  save();

  render();


  toast(
    'تم حذف المسحوب'
  );

}
/* =====================================================
   تحويل الرقم إلى كلمات عربية
===================================================== */

function numberToArabicWords(number) {

  number =
    Math.floor(
      Number(number || 0)
    );


  if (number === 0) {
    return 'صفر';
  }


  const ones = [
    '',
    'واحد',
    'اثنان',
    'ثلاثة',
    'أربعة',
    'خمسة',
    'ستة',
    'سبعة',
    'ثمانية',
    'تسعة',
    'عشرة',
    'أحد عشر',
    'اثنا عشر',
    'ثلاثة عشر',
    'أربعة عشر',
    'خمسة عشر',
    'ستة عشر',
    'سبعة عشر',
    'ثمانية عشر',
    'تسعة عشر'
  ];


  const tens = [
    '',
    '',
    'عشرون',
    'ثلاثون',
    'أربعون',
    'خمسون',
    'ستون',
    'سبعون',
    'ثمانون',
    'تسعون'
  ];


  const hundreds = [
    '',
    'مائة',
    'مائتان',
    'ثلاثمائة',
    'أربعمائة',
    'خمسمائة',
    'ستمائة',
    'سبعمائة',
    'ثمانمائة',
    'تسعمائة'
  ];


  function under1000(n) {

    const parts = [];


    if (n >= 100) {

      parts.push(
        hundreds[
          Math.floor(n / 100)
        ]
      );

      n %= 100;
    }


    if (n > 0) {

      if (n < 20) {

        parts.push(
          ones[n]
        );

      } else {

        const unit =
          n % 10;

        const ten =
          Math.floor(n / 10);


        if (unit) {

          parts.push(
            `${ones[unit]} و${tens[ten]}`
          );

        } else {

          parts.push(
            tens[ten]
          );

        }

      }

    }


    return parts.join(' و');
  }


  const parts = [];


  if (number >= 1000000) {

    const millions =
      Math.floor(
        number / 1000000
      );


    parts.push(
      `${under1000(millions)} مليون`
    );


    number %=
      1000000;
  }


  if (number >= 1000) {

    const thousands =
      Math.floor(
        number / 1000
      );


    if (thousands === 1) {

      parts.push('ألف');

    } else if (thousands === 2) {

      parts.push('ألفان');

    } else {

      parts.push(
        `${under1000(thousands)} ألف`
      );

    }


    number %=
      1000;
  }


  if (number > 0) {

    parts.push(
      under1000(number)
    );

  }


  return parts.join(' و');
}


function amountInWords(amount) {

  const value =
    Math.floor(
      Number(amount || 0)
    );


  return (
    `${numberToArabicWords(value)} ريال سعودي فقط لا غير`
  );

}


/* =====================================================
   الفاتورة
===================================================== */

function showInvoice(id) {

  const booking =
    db.bookings.find(
      item =>
        Number(item.id) ===
        Number(id)
    );

  if (!booking) {
    return;
  }

  const agreed =
    Number(
      booking.agreed || 0
    );

  const paid =
    Number(
      booking.paid || 0
    );

  const remaining =
    Math.max(
      0,
      agreed - paid
    );

  const invoiceNumber =
    'INV-' +
    String(
      booking.id
    ).slice(-8);

  openModal(
    '',
    `
      <div class="invoice-preview-scroll">

        <div
          id="invoicePaper"
          class="invoice-a4">

          <div class="wc-invoice">

            <div class="wc-top-waves" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div class="wc-audio-corner" aria-hidden="true">

              <div class="wc-waveform">
                <i></i><i></i><i></i><i></i><i></i>
                <i></i><i></i><i></i><i></i><i></i>
                <i></i><i></i><i></i><i></i><i></i>
              </div>

              <div class="wc-mixer">
                <span class="wc-mixer-line"></span>
                <span class="wc-mixer-line"></span>
                <span class="wc-mixer-line"></span>
                <span class="wc-mixer-line"></span>
              </div>

            </div>

            <header class="wc-invoice-header">

              <img
                src="invoice_logo.png"
                onerror="this.onerror=null;this.src='logo.png';"
                class="wc-invoice-logo"
                alt="Winter Camp">

              <div class="wc-brand-name">
                Winter Camp
              </div>

              <div class="wc-brand-ar">
                للصوتيات والإنتاج الصوتي
              </div>

              <div class="wc-invoice-title">
                ‹ فاتورة ›
              </div>

            </header>

            <section class="wc-meta">

              <div class="wc-meta-card">

                <div class="wc-meta-icon">
                  ▣
                </div>

                <div>
                  <span class="wc-meta-label">
                    رقم الفاتورة
                  </span>

                  <strong class="wc-meta-value">
                    ${invoiceNumber}
                  </strong>
                </div>

              </div>

              <div class="wc-meta-card">

                <div class="wc-meta-icon">
                  ▦
                </div>

                <div>
                  <span class="wc-meta-label">
                    تاريخ الفاتورة
                  </span>

                  <strong class="wc-meta-value">
                    ${hijriFull(
                      booking.date
                    )}
                    <br>
                    ${dayName(
                      booking.date
                    )}
                  </strong>
                </div>

              </div>

            </section>

            <section class="wc-info-grid">

              <div class="wc-info-card">

                <div class="wc-info-tab">
                  بيانات العميل
                </div>

                <div class="wc-data-row">

                  <span class="wc-data-label">
                    اسم العميل
                  </span>

                  <span class="wc-data-value">
                    ${esc(
                      booking.name || '-'
                    )}
                  </span>

                </div>

                <div class="wc-data-row">

                  <span class="wc-data-label">
                    رقم التواصل
                  </span>

                  <span
                    class="wc-data-value wc-phone-value"
                    dir="ltr">
                    ${esc(
                      booking.phone || '-'
                    )}
                  </span>

                </div>

                <div class="wc-data-row">

                  <span class="wc-data-label">
                    العنوان
                  </span>

                  <span class="wc-data-value">
                    ${esc(
                      booking.location || '-'
                    )}
                  </span>

                </div>

              </div>

              <div class="wc-info-card">

                <div class="wc-info-tab">
                  بيانات الفعالية
                </div>

                <div class="wc-data-row">

                  <span class="wc-data-label">
                    نوع الفعالية
                  </span>

                  <span class="wc-data-value">
                    ${esc(
                      booking.eventType || '-'
                    )}
                  </span>

                </div>

                <div class="wc-data-row">

                  <span class="wc-data-label">
                    تاريخ الفعالية
                  </span>

                  <span class="wc-data-value">
                    ${hijriFull(
                      booking.date
                    )}
                  </span>

                </div>

                <div class="wc-data-row">

                  <span class="wc-data-label">
                    مكان الفعالية
                  </span>

                  <span class="wc-data-value">
                    ${esc(
                      booking.location || '-'
                    )}
                  </span>

                </div>

              </div>

            </section>

            <div class="wc-section-title">
              تفاصيل المنتجات والخدمات
            </div>

            <table class="wc-products">

              <thead>
                <tr>
                  <th class="wc-small">م</th>

                  <th class="wc-item">
                    المنتج / الخدمة
                  </th>

                  <th class="wc-small">
                    الكمية
                  </th>

                  <th class="wc-money">
                    سعر الوحدة
                  </th>

                  <th class="wc-money">
                    الإجمالي
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>

                  <td>
                    1
                  </td>

                  <td class="wc-item-cell">
                    ${esc(
                      booking.device || '-'
                    )}
                  </td>

                  <td>
                    1
                  </td>

                  <td>
                    ${money(
                      agreed
                    )}
                  </td>

                  <td>
                    ${money(
                      agreed
                    )}
                  </td>

                </tr>
              </tbody>

            </table>

            <section class="wc-bottom-grid">

              <div class="wc-totals">

                <div class="wc-total-row">
                  <span>
                    المبلغ المتفق عليه
                  </span>

                  <strong>
                    ${money(
                      agreed
                    )}
                  </strong>
                </div>

                <div class="wc-total-row">
                  <span>
                    الواصل
                  </span>

                  <strong>
                    ${money(
                      paid
                    )}
                  </strong>
                </div>

                <div class="wc-total-row">
                  <span>
                    المتبقي
                  </span>

                  <strong>
                    ${money(
                      remaining
                    )}
                  </strong>
                </div>

                <div class="wc-total-row wc-grand">
                  <span>
                    المبلغ الإجمالي
                  </span>

                  <strong>
                    ${money(
                      agreed
                    )}
                  </strong>
                </div>

              </div>

              <div class="wc-amount-card">

                <div class="wc-words-label">
                  المبلغ كتابة
                </div>

                <div class="wc-words">
                  ${amountInWords(
                    agreed
                  )}
                </div>

              </div>

            </section>

            <div class="wc-stamp-center">

              <img
                src="stamp.png?v=117"
                class="wc-stamp"
                alt="ختم Winter Camp">

            </div>

            <section class="wc-notes">

              <div class="wc-notes-label">
                ملاحظات
              </div>

              <div class="wc-notes-text">
                ${esc(
                  booking.notes ||
                  'نعتز بخدمتكم ونسعى لتقديم الأفضل دائماً'
                )}
              </div>

            </section>

            <footer class="wc-footer">

              <div class="wc-footer-brand">
                Winter Camp
              </div>

              <div class="wc-footer-location">
                أبها - المملكة العربية السعودية
              </div>

              <div class="wc-footer-phone">

                <svg
                  class="wc-whatsapp-svg"
                  viewBox="0 0 32 32"
                  aria-hidden="true">

                  <path
                    fill="currentColor"
                    d="M16 3C8.82 3 3 8.82 3 16c0 2.5.7 4.84 1.91 6.83L3 29l6.35-1.83A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Zm0 23.64c-2.05 0-4.04-.55-5.78-1.59l-.41-.24-3.77 1.09 1.01-3.68-.27-.42A10.58 10.58 0 1 1 16 26.64Zm5.8-7.94c-.32-.16-1.88-.93-2.17-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1.01 1.25-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.56-1.57-.95-.85-1.59-1.89-1.78-2.21-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.36-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.15 3.09 1.31 3.3.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.88-.77 2.15-1.51.26-.74.26-1.38.18-1.51-.08-.14-.29-.21-.61-.37Z">
                  </path>

                </svg>

                <span>
                  0573757275
                </span>

              </div>

            </footer>

          </div>

        </div>

      </div>

      <div class="invoice-actions">

        <button
          id="shareInvoice"
          class="invoice-share-btn">
          مشاركة PDF
        </button>

        <button id="printInvoice">
          طباعة
        </button>

        <button id="closeInvoice">
          إغلاق
        </button>

      </div>
    `
  );

  function fitInvoicePreview() {

    const preview =
      $('.invoice-preview-scroll');

    const paper =
      $('#invoicePaper');

    const actions =
      $('.invoice-actions');

    if (!preview || !paper) {
      return;
    }

    const paperWidth =
      794;

    const paperHeight =
      1123;

    const availableWidth =
      Math.max(
        240,
        preview.clientWidth - 8
      );

    const viewportHeight =
      Math.max(
        420,
        window.innerHeight || 0
      );

    const actionsHeight =
      actions
        ? actions.offsetHeight
        : 86;

    const availableHeight =
      Math.max(
        320,
        viewportHeight -
          actionsHeight -
          190
      );

    const scale =
      Math.min(
        1,
        availableWidth / paperWidth,
        availableHeight / paperHeight
      );

    paper.style.setProperty(
      'transform',
      `translateX(-50%) scale(${scale})`,
      'important'
    );

    paper.style.setProperty(
      'transform-origin',
      'top center',
      'important'
    );

    preview.style.height =
      `${Math.ceil(
        paperHeight * scale
      )}px`;

    preview.style.maxHeight =
      `${Math.ceil(
        paperHeight * scale
      )}px`;

  }

  requestAnimationFrame(
    () => {

      fitInvoicePreview();

      setTimeout(
        fitInvoicePreview,
        80
      );

    }
  );

  window.addEventListener(
    'resize',
    fitInvoicePreview,
    { passive:true }
  );

  $('#shareInvoice').onclick =
    () =>
      shareInvoicePDF(
        booking
      );

  $('#printInvoice').onclick =
    () =>
      window.print();

  $('#closeInvoice').onclick =
    closeModal;

}


/* =====================================================
   تحميل مكتبات PDF
===================================================== */

function loadExternalScript(
  url
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const existing =
        [...document.scripts]
          .find(
            script =>
              script.src === url
          );


      if (existing) {

        resolve();

        return;

      }


      const script =
        document.createElement(
          'script'
        );


      script.src =
        url;


      script.onload =
        resolve;


      script.onerror =
        reject;


      document.head.appendChild(
        script
      );

    }
  );

}


async function ensurePDFLibraries() {

  if (
    !window.html2canvas
  ) {

    await loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    );

  }


  if (
    !window.jspdf
  ) {

    await loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    );

  }

}


async function waitForImages(
  element
) {

  const images =
    [
      ...element.querySelectorAll(
        'img'
      )
    ];


  await Promise.all(

    images.map(
      image => {

        if (
          image.complete &&
          image.naturalWidth > 0
        ) {

          return Promise.resolve();

        }


        return new Promise(
          resolve => {

            image.onload =
              resolve;

            image.onerror =
              resolve;

          }
        );

      }
    )

  );

}


/* =====================================================
   مشاركة الفاتورة PDF
===================================================== */

async function shareInvoicePDF(
  booking
) {

  const paper =
    $('#invoicePaper');


  const button =
    $('#shareInvoice');


  if (!paper) {
    return;
  }


  const oldButtonText =
    button
      ? button.textContent
      : 'مشاركة PDF';


  let exportContainer =
    null;


  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        'جاري تجهيز الفاتورة...';

    }


    toast(
      'جاري تجهيز الفاتورة PDF'
    );


    await ensurePDFLibraries();

    await waitForImages(
      paper
    );


    exportContainer =
      document.createElement(
        'div'
      );


    Object.assign(
      exportContainer.style,
      {

        position:
          'fixed',

        left:
          '-10000px',

        top:
          '0',

        width:
          '794px',

        height:
          '1123px',

        background:
          '#ffffff',

        zIndex:
          '-9999',

        overflow:
          'hidden'

      }
    );


    const exportPaper =
      paper.cloneNode(
        true
      );


    exportPaper.removeAttribute(
      'id'
    );


    exportPaper.style.setProperty(
      'width',
      '794px',
      'important'
    );


    exportPaper.style.setProperty(
      'height',
      '1123px',
      'important'
    );


    exportPaper.style.setProperty(
      'min-width',
      '794px',
      'important'
    );


    exportPaper.style.setProperty(
      'min-height',
      '1123px',
      'important'
    );


    exportPaper.style.setProperty(
      'max-width',
      '794px',
      'important'
    );


    exportPaper.style.setProperty(
      'max-height',
      '1123px',
      'important'
    );


    exportPaper.style.setProperty(
      'margin',
      '0',
      'important'
    );


    exportPaper.style.setProperty(
      'padding',
      '0',
      'important'
    );


    exportPaper.style.setProperty(
      'transform',
      'none',
      'important'
    );

    const exportInvoiceContent =
      exportPaper.querySelector(
        '.wc-invoice'
      );

    if (exportInvoiceContent) {

      exportInvoiceContent.style.setProperty(
        'transform',
        'none',
        'important'
      );

      exportInvoiceContent.style.setProperty(
        'transform-origin',
        'top left',
        'important'
      );

      exportInvoiceContent.style.setProperty(
        'width',
        '100%',
        'important'
      );

      exportInvoiceContent.style.setProperty(
        'height',
        '100%',
        'important'
      );

    }


    exportPaper.style.setProperty(
      'transform-origin',
      'top left',
      'important'
    );


    exportPaper.style.setProperty(
      'position',
      'relative',
      'important'
    );


    exportPaper.style.setProperty(
      'overflow',
      'hidden',
      'important'
    );


    exportPaper.style.setProperty(
      'box-shadow',
      'none',
      'important'
    );


    exportContainer.appendChild(
      exportPaper
    );


    document.body.appendChild(
      exportContainer
    );


    await waitForImages(
      exportPaper
    );


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          150
        )
    );


    const canvas =
      await window.html2canvas(
        exportPaper,
        {
          scale: 2,
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: false,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0
        }
      );


    const {
      jsPDF
    } =
      window.jspdf;


    const pdf =
      new jsPDF({
        orientation:
          'portrait',

        unit:
          'mm',

        format:
          'a4',

        compress:
          true
      });


    pdf.addImage(
      canvas.toDataURL(
        'image/jpeg',
        0.98
      ),
      'JPEG',
      0,
      0,
      210,
      297,
      undefined,
      'FAST'
    );


    const blob =
      pdf.output(
        'blob'
      );


    const invoiceNumber =
      String(
        booking.id
      ).slice(-8);


    const fileName =
      `WinterCamp-Invoice-${invoiceNumber}.pdf`;


    const file =
      new File(
        [blob],
        fileName,
        {
          type:
            'application/pdf'
        }
      );


    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file]
      })
    ) {

      await navigator.share({
        files:
          [file],

        title:
          'فاتورة Winter Camp',

        text:
          `فاتورة ${booking.name || ''}`
      });


      return;
    }


    const url =
      URL.createObjectURL(
        blob
      );
          const link =
      document.createElement(
        'a'
      );


    link.href =
      url;


    link.download =
      fileName;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      2000
    );


    toast(
      'تم تجهيز الفاتورة PDF'
    );

  } catch (error) {

    console.error(
      'PDF Error:',
      error
    );


    alert(
      'تعذر تجهيز الفاتورة PDF، حاول مرة أخرى.'
    );

  } finally {

    if (
      exportContainer &&
      exportContainer.parentNode
    ) {

      exportContainer
        .parentNode
        .removeChild(
          exportContainer
        );

    }


    if (button) {

      button.disabled =
        false;


      button.textContent =
        oldButtonText;

    }

  }

}


/* =====================================================
   النسخة الاحتياطية
===================================================== */

function exportData() {

  const blob =
    new Blob(
      [
        JSON.stringify(
          db,
          null,
          2
        )
      ],
      {
        type:
          'application/json'
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      'a'
    );


  link.href =
    url;


  link.download =
    'wintercamp-backup.json';


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  setTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    1000
  );


  toast(
    'تم تجهيز النسخة الاحتياطية'
  );

}


/* =====================================================
   إشعار
===================================================== */

function toast(message) {

  const element =
    $('#toast');


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.classList.remove(
    'hidden'
  );


  setTimeout(
    () => {

      element.classList.add(
        'hidden'
      );

    },
    1800
  );

}


/* =====================================================
   القائمة الجانبية
===================================================== */

function toggleMenu(show) {

  $('#sideSheet')
    ?.classList
    .toggle(
      'hidden',
      !show
    );


  $('#sheetBackdrop')
    ?.classList
    .toggle(
      'hidden',
      !show
    );

}


/* =====================================================
   أزرار التنقل الرئيسية
===================================================== */

$$('.nav-item')
  .forEach(
    button => {

      button.onclick =
        () =>
          go(
            button.dataset.page
          );

    }
  );


/* =====================================================
   زر الإضافة الأخضر
===================================================== */

if ($('#fabBtn')) {

  $('#fabBtn').onclick =
    () => {

      if (
        currentPage ===
        'expenses'
      ) {

        openExpenseForm();

      } else {

        openBookingForm();

      }

    };

}


/* =====================================================
   القائمة
===================================================== */

if ($('#menuBtn')) {

  $('#menuBtn').onclick =
    () =>
      toggleMenu(
        true
      );

}


if ($('#closeMenu')) {

  $('#closeMenu').onclick =
    () =>
      toggleMenu(
        false
      );

}


if ($('#sheetBackdrop')) {

  $('#sheetBackdrop').onclick =
    () =>
      toggleMenu(
        false
      );

}


/* =====================================================
   صفحات القائمة الجانبية
===================================================== */

$$('[data-sheet-page]')
  .forEach(
    button => {

      button.onclick =
        () => {

          toggleMenu(
            false
          );


          go(
            button.dataset
              .sheetPage
          );

        };

    }
  );


/* =====================================================
   إغلاق النافذة
===================================================== */

if ($('#modalClose')) {

  $('#modalClose').onclick =
    closeModal;

}


if ($('#modalBackdrop')) {

  $('#modalBackdrop').onclick =
    closeModal;

}


/* =====================================================
   النسخة الاحتياطية من القائمة
===================================================== */

if ($('#exportBtn')) {

  $('#exportBtn').onclick =
    exportData;

}


if ($('#backupBtn')) {

  $('#backupBtn').onclick =
    exportData;

}


/* =====================================================
   استيراد نسخة احتياطية
===================================================== */

if ($('#importInput')) {

  $('#importInput').onchange =
    async event => {

      const file =
        event.target.files[0];


      if (!file) {
        return;
      }


      try {

        const imported =
          JSON.parse(
            await file.text()
          );


        if (
          !Array.isArray(
            imported.bookings
          )
          ||
          !Array.isArray(
            imported.expenses
          )
        ) {

          throw new Error();

        }


        if (
          !Array.isArray(
            imported.devices
          )
        ) {

          imported.devices =
            clone(
              seed.devices
            );

        }


        if (
          !Array.isArray(
            imported.withdrawals
          )
        ) {

          imported.withdrawals =
            [];

        }


        db =
          imported;


        save();


        render();


        toggleMenu(
          false
        );


        toast(
          'تم استيراد البيانات'
        );

      } catch {

        alert(
          'ملف النسخة الاحتياطية غير صالح'
        );

      }

    };

}


/* =====================================================
   تاريخ اليوم
===================================================== */

if ($('#hijriToday')) {

  $('#hijriToday')
    .textContent =
      hijriWithDay(
        todayISO()
      );

}


/* =====================================================
   Service Worker
===================================================== */

if (
  'serviceWorker' in navigator
) {

  window.addEventListener(
    'load',
    () => {

      navigator
        .serviceWorker
        .register(
          './sw.js?v=117'
        )
        .catch(
          console.error
        );

    }
  );

}


/* =====================================================
   تشغيل البرنامج
===================================================== */

render();