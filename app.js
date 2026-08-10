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

    .device-package-field{
      display:block;
    }

    .device-package-label-line{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:8px;
    }

    .optional-badge{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:24px;
      padding:3px 9px;
      border:1px solid #33424a;
      border-radius:999px;
      color:#8f9aa1;
      background:#0d1418;
      font-size:11px;
      font-weight:700;
      white-space:nowrap;
    }

    .device-mode-tabs{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
      margin-bottom:10px;
    }

    .device-mode-btn{
      min-height:42px;
      border:1px solid #2b3941;
      border-radius:12px;
      background:#0d1418;
      color:#98a3a9;
      font-weight:800;
      cursor:pointer;
    }

    .device-mode-btn.active{
      border-color:#25c16f;
      background:rgba(37,193,111,.10);
      color:#dff8e9;
      box-shadow:inset 0 0 0 1px rgba(37,193,111,.12);
    }

    .device-list-section,
    .device-manual-section{
      margin-top:4px;
    }

    .device-list-section.hidden,
    .device-manual-section.hidden{
      display:none !important;
    }

    .device-package-list{
      display:grid;
      gap:8px;
    }

    .device-package{
      width:100%;
      display:grid;
      grid-template-columns:38px 1fr;
      align-items:center;
      gap:10px;
      min-height:58px;
      padding:9px 11px;
      border:1px solid #2b3941;
      border-radius:13px;
      background:#0d1418;
      color:#e8eeee;
      text-align:right;
      cursor:pointer;
    }

    .device-package.selected{
      border-color:#25c16f;
      background:rgba(37,193,111,.09);
      box-shadow:inset 0 0 0 1px rgba(37,193,111,.10);
    }

    .device-package-number{
      width:34px;
      height:34px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:10px;
      background:#172129;
      color:#25c16f;
      font-size:15px;
      font-weight:900;
    }

    .device-package.selected
    .device-package-number{
      background:#25c16f;
      color:#07130c;
    }

    .device-package-text{
      line-height:1.65;
      font-size:12px;
      font-weight:700;
    }

    .device-manual-section input{
      width:100%;
    }

    /* الفاتورة */
    .invoice-header{
      min-height:230px !important;
      overflow:hidden;
    }

    .invoice-logo{
      width:270px !important;
      height:125px !important;
      max-width:74% !important;
      margin:0 auto 4px !important;
      object-fit:contain !important;
      object-position:center !important;
    }

    .customer-extra
    .customer-row:first-child{
      white-space:nowrap;
    }

    .customer-extra
    .customer-row:first-child strong,
    .customer-extra
    .customer-row:first-child b{
      white-space:nowrap;
      overflow-wrap:normal !important;
    }

    @media (max-width:600px){

      .device-package{
        grid-template-columns:34px 1fr;
      }

      .device-package-text{
        font-size:11.5px;
      }

      .invoice-logo{
        width:240px !important;
        height:112px !important;
      }

    }

  `;

  document.head.appendChild(
    style
  );

})();



/* =====================================================
   التخزين
===================================================== */

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
    currentDevice &&
    currentPackageIndex === -1
      ? 'manual'
      : 'list';


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
              اختيار من القائمة
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


    deviceListMode
      ?.classList.toggle(
        'active',
        listMode
      );


    deviceManualMode
      ?.classList.toggle(
        'active',
        !listMode
      );


    deviceListSection
      ?.classList.toggle(
        'hidden',
        !listMode
      );


    deviceManualSection
      ?.classList.toggle(
        'hidden',
        listMode
      );


    if (
      !listMode &&
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
      () =>
        setDeviceMode(
          'list'
        );

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


// إغلاق قائمة الباقات بعد الاختيار
deviceListSection?.classList.add(
  'hidden'
); } محددة ✓`;

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

          <div class="invoice-frame">


            <div class="sound-wave wave-left">
              <i></i><i></i><i></i><i></i><i></i>
              <i></i><i></i><i></i><i></i><i></i>
              <i></i><i></i><i></i><i></i><i></i>
            </div>


            <div class="sound-wave wave-right">
              <i></i><i></i><i></i><i></i><i></i>
              <i></i><i></i><i></i><i></i><i></i>
              <i></i><i></i><i></i><i></i><i></i>
            </div>


            <header class="invoice-header">

              <img
                src="invoice_logo.png"
                onerror="this.onerror=null;this.src='logo.png';"
                class="invoice-logo"
                alt="Winter Camp">


              <div class="invoice-brand-en">
                Winter Camp
              </div>


              <div class="invoice-brand-ar">
                للصوتيات والإنتاج الصوتي
              </div>


              <div class="invoice-title">

                <span>
                  )))
                </span>

                <strong>
                  فاتورة
                </strong>

                <span>
                  (((
                </span>

              </div>

            </header>


            <section class="invoice-info">

              <div class="invoice-info-row">

                <span class="invoice-info-icon">
                  ▣
                </span>

                <strong class="invoice-info-label">
                  رقم الفاتورة
                </strong>

                <span>
                  :
                </span>

                <b class="invoice-info-value invoice-number-value">
                  ${invoiceNumber}
                </b>

              </div>


              <div class="invoice-info-row">

                <span class="invoice-info-icon">
                  ▦
                </span>

                <strong class="invoice-info-label">
                  التاريخ الهجري
                </strong>

                <span>
                  :
                </span>

                <b class="invoice-info-value">
                  ${hijriFull(
                    booking.date
                  )}
                </b>

              </div>


              <div class="invoice-info-row">

                <span class="invoice-info-icon">
                  ◷
                </span>

                <strong class="invoice-info-label">
                  اليوم
                </strong>

                <span>
                  :
                </span>

                <b class="invoice-info-value">
                  ${dayName(
                    booking.date
                  )}
                </b>

              </div>

            </section>


            <section class="invoice-customer">

              <div class="customer-main">


                <div class="customer-row">

                  <span class="customer-symbol">
                    ●
                  </span>

                  <strong>
                    اسم العميل
                  </strong>

                  <span>
                    :
                  </span>

                  <b>
                    ${esc(
                      booking.name
                    )}
                  </b>

                </div>


                <div class="customer-row">

                  <span class="customer-symbol">
                    ☎
                  </span>

                  <strong>
                    رقم التواصل
                  </strong>

                  <span>
                    :
                  </span>

                  <b
                    class="customer-phone"
                    dir="ltr">

                    ${esc(
                      booking.phone || '-'
                    )}

                  </b>

                </div>


                <div class="customer-row">

                  <span class="customer-symbol">
                    ●
                  </span>

                  <strong>
                    الموقع
                  </strong>

                  <span>
                    :
                  </span>

                  <b>
                    ${esc(
                      booking.location
                    )}
                  </b>

                </div>

              </div>


              <div class="customer-extra">


                <div class="customer-row customer-row-simple">

                  <strong>
                    نوع المناسبة
                  </strong>

                  <span>
                    :
                  </span>

                  <b>
                    ${esc(
                      booking.eventType || '-'
                    )}
                  </b>

                </div>


                <div class="customer-row customer-row-simple">

                  <strong>
                    ملاحظات
                  </strong>

                  <span>
                    :
                  </span>

                  <b>
                    ${esc(
                      booking.notes ||
                      'شكراً لثقتكم بنا'
                    )}
                  </b>

                </div>

              </div>

            </section>


            <table class="invoice-products">

              <thead>

                <tr>

                  <th class="invoice-no">
                    م
                  </th>

                  <th>
                    الصنف
                  </th>

                  <th class="invoice-qty">
                    الكمية
                  </th>

                  <th class="invoice-price">
                    سعر الوحدة
                  </th>

                  <th class="invoice-price">
                    الإجمالي
                  </th>

                </tr>

              </thead>


              <tbody>

                <tr>

                  <td>
                    1
                  </td>


                  <td class="product-title">

                    <strong>
                      ${esc(
                        booking.device
                      )}
                    </strong>

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


            <section class="invoice-lower">


              <div class="invoice-words-side">

                <strong class="amount-words-label">
                  المبلغ بالحروف :
                </strong>


                <div class="amount-words-box">

                  ${amountInWords(
                    agreed
                  )}

                </div>


                <div class="stamp-holder">

                  <img
                    src="stamp.png?v=100"
                    class="invoice-full-stamp"
                    alt="ختم Winter Camp">

                </div>

              </div>


              <div class="invoice-totals">


                <div class="total-row">

                  <span>
                    المبلغ المتفق عليه
                  </span>

                  <strong>
                    ${money(
                      agreed
                    )}
                  </strong>

                </div>


                <div class="total-row">

                  <span>
                    الواصل
                  </span>

                  <strong>
                    ${money(
                      paid
                    )}
                  </strong>

                </div>


                <div class="total-row">

                  <span>
                    المتبقي
                  </span>

                  <strong class="remaining-number">

                    ${money(
                      remaining
                    )}

                  </strong>

                </div>


                <div class="total-row grand-total">

                  <span>
                    الإجمالي
                  </span>

                  <strong>
                    ${money(
                      agreed
                    )}
                  </strong>

                </div>

              </div>

            </section>


            <footer class="invoice-green-footer">

              <div>

                ☎

                <span dir="ltr">
                  0573757275
                </span>

              </div>


              <div>
                ● أبها - المملكة العربية السعودية
              </div>


              <div>
                Winter Camp
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
          './sw.js?v=103'
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