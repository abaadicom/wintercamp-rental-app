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

    if (!Array.isArray(data.devices)) {
      data.devices = clone(seed.devices);
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
  ).format(Number(value || 0)) + ' ر.س';
}


/* =====================================================
   التاريخ
===================================================== */

function todayISO() {
  const d = new Date();

  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function getHijriParts(isoDate) {
  try {
    const date = new Date(
      isoDate + 'T12:00:00'
    );

    const formatter =
      new Intl.DateTimeFormat(
        'en-u-ca-islamic-umalqura',
        {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          timeZone: 'Asia/Riyadh'
        }
      );

    const parts =
      formatter.formatToParts(date);

    return {
      day: Number(
        parts.find(x => x.type === 'day')?.value
      ),
      month: Number(
        parts.find(x => x.type === 'month')?.value
      ),
      year: Number(
        parts.find(x => x.type === 'year')?.value
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
  return getHijriParts(todayISO());
}

function hijriFull(isoDate) {
  const h = getHijriParts(isoDate);

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
        timeZone: 'Asia/Riyadh'
      }
    ).format(
      new Date(isoDate + 'T12:00:00')
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
  hijriYear = Number(hijriYear);
  hijriMonth = Number(hijriMonth);
  hijriDay = Number(hijriDay);

  const estimatedYear =
    Math.floor(
      hijriYear * 0.970224 +
      621.5774
    );

  const start = new Date(
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
    const date = new Date(start);

    date.setDate(
      start.getDate() + offset
    );

    const iso =
      `${date.getFullYear()}-` +
      `${String(date.getMonth() + 1).padStart(2, '0')}-` +
      `${String(date.getDate()).padStart(2, '0')}`;

    const h = getHijriParts(iso);

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
    getHijriParts(isoDate);

  const current =
    currentHijri();

  let days = '';
  let months = '';
  let years = '';

  for (let day = 1; day <= 30; day++) {
    days += `
      <option
        value="${day}"
        ${day === selected.day ? 'selected' : ''}>
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
        ${month === selected.month ? 'selected' : ''}>
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
        ${year === selected.year ? 'selected' : ''}>
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
        Number(item.agreed || 0),
      0
    );

  const paid =
    bookings.reduce(
      (sum, item) =>
        sum +
        Number(item.paid || 0),
      0
    );

  const expensesTotal =
    expenses.reduce(
      (sum, item) =>
        sum +
        Number(item.amount || 0),
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
      revenue - expensesTotal
  };
}

function status(booking) {
  const remaining =
    Number(booking.agreed || 0) -
    Number(booking.paid || 0);

  if (remaining <= 0) {
    return [
      'مدفوعة بالكامل',
      'paid'
    ];
  }

  if (Number(booking.paid || 0) > 0) {
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
  const t = totals();

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
      .slice(0, 5);

  return `

    <section class="hero">

      <div>
        <h2>مرحباً بك 👋</h2>

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

              <path d="M4 18L10 12L14 16L21 7"/>

              <path d="M15 7H21V13"/>

            </svg>

          </span>

        </div>

        <span class="value green">
          ${money(t.revenue)}
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

          <span class="dashboard-icon red-icon">

            <svg viewBox="0 0 24 24">

              <rect
                x="3"
                y="6"
                width="18"
                height="14"
                rx="3"/>

              <path d="M3 10H21"/>

              <path d="M16 15H18"/>

            </svg>

          </span>

        </div>

        <span class="value red">
          ${money(t.expenses)}
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

              <path d="M4 20V13"/>

              <path d="M10 20V8"/>

              <path d="M16 20V4"/>

              <path d="M22 20H2"/>

            </svg>

          </span>

        </div>

        <span class="value blue">
          ${money(t.profit)}
        </span>

        <small class="stat-description">
          قبل التحصيل
        </small>

      </div>


      <div class="stat-card stat-remaining">

        <div class="stat-card-top">

          <span class="label">
            المتبقي للتحصيل
          </span>

          <span class="dashboard-icon gold-icon">

            <svg viewBox="0 0 24 24">

              <circle
                cx="12"
                cy="12"
                r="9"/>

              <path d="M12 7V12L15 14"/>

            </svg>

          </span>

        </div>

        <span class="value gold">
          ${money(t.remaining)}
        </span>

        <small class="stat-description">
          من العملاء
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
            .map(bookingCard)
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

function bookingCard(booking) {
  const [
    statusText,
    statusClass
  ] = status(booking);

  const remaining =
    Math.max(
      0,
      Number(booking.agreed || 0) -
      Number(booking.paid || 0)
    );

  return `

    <article class="booking-card">

      <div class="booking-top">

        <div>

          <div class="booking-name">
            ${esc(booking.name)}
          </div>

          <div class="booking-meta">

            <div>
              🔊 ${esc(booking.device)}
            </div>

            <div>
              📍 ${esc(booking.location)}
            </div>

            <div>
              📅 ${hijriWithDay(booking.date)}
            </div>

            ${
              booking.phone
                ? `
                  <div>
                    ☎ ${esc(booking.phone)}
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

          ${money(booking.agreed)}

          <small>
            متبقي
            <span class="red">
              ${money(remaining)}
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

function normalizePhone(value) {
  return String(value || '')
    .replace(/[^\d٠-٩]/g, '');
}

function normalizeSearch(value) {
  return String(value || '')
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
            name.includes(search) ||
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
    bookingFilter === 'upcoming'
      ? 'الحجوزات القادمة'
      : bookingFilter === 'past'
        ? 'الحجوزات السابقة'
        : 'جميع الحجوزات';

  return `

    <div class="bookings-tools">

      <div class="booking-search-box">

        <span class="search-icon">
          🔍
        </span>

        <input
          id="bookingSearch"
          type="text"
          inputmode="search"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          placeholder="بحث بالاسم أو رقم الجوال"
          value="${esc(bookingSearch)}">

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
            bookingFilter === 'upcoming'
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
          ? bookings.map(bookingCard).join('')
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
            .map(bookingCard)
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
   المصاريف
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

  return `

    <div class="section-head">

      <h3>
        المصاريف
      </h3>

      <strong class="red">
        ${money(totals().expenses)}
      </strong>

    </div>


    ${
      expenses.length

        ? expenses.map(
            expense => `

              <div class="expense-row">

                <div>

                  <strong>
                    ${esc(expense.item)}
                  </strong>

                  <small>
                    ${hijriWithDay(expense.date)}
                  </small>

                </div>

                <div>

                  <strong class="red">
                    ${money(expense.amount)}
                  </strong>

                  <button
                    class="delete-mini"
                    data-del-expense="${expense.id}">
                    حذف
                  </button>

                </div>

              </div>
            `
          ).join('')

        : `
          <div class="empty">
            لا توجد مصاريف
          </div>
        `
    }
  `;
}


/* =====================================================
   التقارير
===================================================== */

function getAvailableHijriYears() {
  const current =
    currentHijri().year;

  const years = [];

  for (
    let year = 1446;
    year <= current + 5;
    year++
  ) {
    years.push(year);
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
        month === 'all' ||
        h.month ===
        Number(month);

      const yearMatch =
        year === 'all' ||
        h.year ===
        Number(year);

      return (
        monthMatch &&
        yearMatch
      );
    }
  );
}

function reportPeriodTitle() {
  if (
    reportMonth === 'all' &&
    reportYear === 'all'
  ) {
    return 'جميع الأشهر وجميع السنوات';
  }

  if (
    reportMonth === 'all'
  ) {
    return `جميع أشهر سنة ${reportYear} هـ`;
  }

  if (
    reportYear === 'all'
  ) {
    return (
      `${HIJRI_MONTHS[Number(reportMonth)]}` +
      ' - جميع السنوات'
    );
  }

  return (
    `${HIJRI_MONTHS[Number(reportMonth)]} ` +
    `${reportYear} هـ`
  );
}

function monthlyBreakdownView() {
  if (
    reportMonth !== 'all' ||
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
        String(month),
        reportYear
      );

    const expenses =
      filterByHijriPeriod(
        db.expenses,
        String(month),
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
            ${money(t.revenue)}
          </span>

          <small>
            المصاريف:
            ${money(t.expenses)}
            <br>
            الصافي:
            ${money(t.profit)}
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

        <select
          id="reportMonthFilter">

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
                (month, index) => {

                  if (!index) {
                    return '';
                  }

                  return `
                    <option
                      value="${index}"
                      ${
                        String(index) ===
                        String(reportMonth)
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

        <select
          id="reportYearFilter">

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
                      String(year) ===
                      String(reportYear)
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

      <div class="stat-card">

        <span class="label">
          الإيرادات
        </span>

        <span class="value green">
          ${money(t.revenue)}
        </span>

      </div>

      <div class="stat-card">

        <span class="label">
          المصاريف
        </span>

        <span class="value red">
          ${money(t.expenses)}
        </span>

      </div>

      <div class="stat-card">

        <span class="label">
          صافي الربح
        </span>

        <span class="value blue">
          ${money(t.profit)}
        </span>

      </div>

      <div class="stat-card">

        <span class="label">
          المتبقي
        </span>

        <span class="value gold">
          ${money(t.remaining)}
        </span>

      </div>

    </div>

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
                ${esc(device.name)}
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
        ? bookings.map(
            booking => `

              <div class="invoice-row">

                <div>

                  <strong>
                    فاتورة
                    #${String(booking.id).slice(-6)}
                  </strong>

                  <small>
                    ${esc(booking.name)}
                    <br>
                    ${hijriFull(booking.date)}
                  </small>

                </div>

                <button
                  class="small-btn primary"
                  data-invoice="${booking.id}">
                  عرض
                </button>

              </div>
            `
          ).join('')
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
    home: 'الرئيسية',
    bookings: 'الحجوزات',
    expenses: 'المصاريف',
    reports: 'التقارير',
    devices: 'الأجهزة',
    invoices: 'الفواتير',
    settings: 'الإعدادات'
  };

  const pageTitle =
    $('#pageTitle');

  if (pageTitle) {
    pageTitle.textContent =
      titles[currentPage] ||
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
    home: homeView,
    bookings: bookingsView,
    expenses: expensesView,
    reports: reportsView,
    devices: devicesView,
    invoices: invoicesView,
    settings: settingsView
  };

  const main =
    $('#mainContent');

  if (main) {
    main.innerHTML =
      (
        views[currentPage] ||
        homeView
      )();
  }

  bindViewEvents();
}

function go(page) {
  currentPage = page;
  render();
}


/* =====================================================
   أحداث الصفحة
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

function bindViewEvents() {
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

  $$('[data-del-expense]')
    .forEach(
      button => {
        button.onclick =
          () =>
            deleteExpense(
              Number(
                button.dataset.delExpense
              )
            );
      }
    );

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

  $$('[data-booking-filter]')
    .forEach(
      button => {
        button.onclick =
          () => {
            bookingFilter =
              button.dataset.bookingFilter;

            render();
          };
      }
    );

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

  $$('[data-report-month]')
    .forEach(
      button => {
        button.onclick =
          () => {
            reportMonth =
              button.dataset.reportMonth;

            render();
          };
      }
    );

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
  if ($('#modalTitle')) {
    $('#modalTitle').textContent =
      title;
  }

  if ($('#modalBody')) {
    $('#modalBody').innerHTML =
      content;
  }

  $('#modalBackdrop')
    ?.classList
    .remove('hidden');

  $('#modal')
    ?.classList
    .remove('hidden');
}

function closeModal() {
  $('#modalBackdrop')
    ?.classList
    .add('hidden');

  $('#modal')
    ?.classList
    .add('hidden');
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
          <strong>
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
            value="${esc(booking.name)}">
        </label>


        <label>
          رقم الجوال

          <input
            name="phone"
            type="tel"
            inputmode="numeric"
            autocomplete="tel"
            value="${esc(booking.phone || '')}"
            placeholder="05xxxxxxxx">
        </label>


        <label>
          نوع المناسبة

          <input
            name="eventType"
            value="${esc(booking.eventType || '')}"
            placeholder="مثال: زواج">
        </label>


        <label>
          نوع الأجهزة / الباقة

          <input
            name="device"
            required
            value="${esc(booking.device || '')}"
            placeholder="مثال: سماعتين + ميكسر">
        </label>


        <label>
          الموقع

          <input
            name="location"
            required
            value="${esc(booking.location || '')}"
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
              value="${booking.paid}">
          </label>

        </div>


        <label>
          ملاحظات

          <textarea
            name="notes"
            placeholder="ملاحظات اختيارية">${esc(booking.notes || '')}</textarea>
        </label>


        <button
          class="submit-btn"
          type="submit">

          ${
            existing
              ? 'حفظ التعديلات'
              : 'حفظ الحجز'
          }

        </button>

      </form>
    `
  );

  $('#bookingForm').onsubmit =
    event => {
      event.preventDefault();

      const formData =
        Object.fromEntries(
          new FormData(
            event.currentTarget
          ).entries()
        );

      const date =
        hijriToGregorian(
          formData.booking_year,
          formData.booking_month,
          formData.booking_day
        );

      if (!date) {
        alert(
          'التاريخ الهجري غير صحيح'
        );
        return;
      }

      delete formData.booking_day;
      delete formData.booking_month;
      delete formData.booking_year;

      formData.date = date;

      formData.agreed =
        Number(
          formData.agreed || 0
        );

      formData.paid =
        Number(
          formData.paid || 0
        );

      if (existing) {
        Object.assign(
          existing,
          formData
        );
      } else {
        formData.id =
          Date.now();

        db.bookings.push(
          formData
        );
      }

      save();
      closeModal();
      render();

      toast(
        existing
          ? 'تم تحديث الحجز'
          : 'تم حفظ الحجز'
      );
    };
}


/* =====================================================
   المصروف
===================================================== */

function openExpenseForm() {
  openModal(
    'إضافة مصروف',
    `

      <form
        id="expenseForm"
        class="form-grid">

        <label>
          بند المصروف

          <input
            name="item"
            required>
        </label>

        <label>
          المبلغ

          <input
            name="amount"
            type="number"
            inputmode="decimal"
            min="0"
            required>
        </label>

        ${hijriDateFields(
          todayISO(),
          'expense'
        )}

        <button
          class="submit-btn"
          type="submit">
          حفظ المصروف
        </button>

      </form>
    `
  );

  $('#expenseForm').onsubmit =
    event => {
      event.preventDefault();

      const data =
        Object.fromEntries(
          new FormData(
            event.currentTarget
          ).entries()
        );

      const date =
        hijriToGregorian(
          data.expense_year,
          data.expense_month,
          data.expense_day
        );

      if (!date) {
        alert(
          'التاريخ الهجري غير صحيح'
        );
        return;
      }

      delete data.expense_day;
      delete data.expense_month;
      delete data.expense_year;

      data.id =
        Date.now();

      data.date =
        date;

      data.amount =
        Number(
          data.amount || 0
        );

      db.expenses.push(data);

      save();
      closeModal();
      render();

      toast(
        'تم حفظ المصروف'
      );
    };
}

function deleteExpense(id) {
  if (
    !confirm(
      'هل تريد حذف المصروف؟'
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
   المبلغ بالحروف
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

    number %= 1000;
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
    `${numberToArabicWords(value)} ` +
    `ريال سعودي فقط لا غير`
  );
}


/* =====================================================
   الفاتورة الرسمية
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
          class="invoice-a4"
          id="invoicePaper">


          <!-- الإطار الداخلي -->

          <div class="invoice-inner-frame">


            <!-- الموجات -->

            <div class="invoice-sound-wave wave-a">
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
            </div>


            <div class="invoice-sound-wave wave-b">
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
              <span></span><span></span><span></span>
            </div>


            <!-- الشعار -->

            <header class="invoice-main-header">

              <img
                src="wintercamp_icon.png"
                alt="Winter Camp"
                class="invoice-main-logo">


              <div class="invoice-company-en">
                Winter Camp
              </div>


              <div class="invoice-company-ar">
                للصوتيات والإنتاج الصوتي
              </div>


              <div class="invoice-title-pill">

                <span class="invoice-title-wave">
                  )))
                </span>

                <strong>
                  فاتورة
                </strong>

                <span class="invoice-title-wave">
                  (((
                </span>

              </div>

            </header>


            <!-- بيانات الفاتورة -->

            <section class="invoice-meta">

              <div class="meta-row">

                <span class="meta-icon">
                  ▣
                </span>

                <span class="meta-label">
                  رقم الفاتورة
                </span>

                <span class="meta-colon">
                  :
                </span>

                <strong class="meta-value">
                  ${invoiceNumber}
                </strong>

              </div>


              <div class="meta-row">

                <span class="meta-icon">
                  ◫
                </span>

                <span class="meta-label">
                  التاريخ الهجري
                </span>

                <span class="meta-colon">
                  :
                </span>

                <strong class="meta-value">
                  ${hijriFull(booking.date)}
                </strong>

              </div>


              <div class="meta-row">

                <span class="meta-icon">
                  ◷
                </span>

                <span class="meta-label">
                  اليوم
                </span>

                <span class="meta-colon">
                  :
                </span>

                <strong class="meta-value">
                  ${dayName(booking.date)}
                </strong>

              </div>

            </section>


            <!-- العميل -->

            <section class="invoice-client-box">


              <div class="invoice-client-right">


                <div class="client-field">

                  <span class="client-icon">
                    ♙
                  </span>

                  <span class="client-label">
                    اسم العميل
                  </span>

                  <span>:</span>

                  <strong>
                    ${esc(booking.name)}
                  </strong>

                </div>


                <div class="client-field">

                  <span class="client-icon">
                    ☎
                  </span>

                  <span class="client-label">
                    رقم التواصل
                  </span>

                  <span>:</span>

                  <strong dir="ltr">
                    ${esc(booking.phone || '-')}
                  </strong>

                </div>


                <div class="client-field">

                  <span class="client-icon">
                    ●
                  </span>

                  <span class="client-label">
                    الموقع
                  </span>

                  <span>:</span>

                  <strong>
                    ${esc(booking.location)}
                  </strong>

                </div>

              </div>


              <div class="invoice-client-left">


                <div class="client-field">

                  <span class="client-label">
                    نوع المناسبة
                  </span>

                  <span>:</span>

                  <strong>
                    ${esc(booking.eventType || '-')}
                  </strong>

                </div>


                <div class="client-field">

                  <span class="client-label">
                    ملاحظات
                  </span>

                  <span>:</span>

                  <strong>
                    ${esc(
                      booking.notes ||
                      'شكراً لثقتكم بنا'
                    )}
                  </strong>

                </div>

              </div>

            </section>


            <!-- جدول الأصناف -->

            <section class="invoice-items-wrap">

              <table class="invoice-items-table">

                <thead>

                  <tr>

                    <th class="col-no">
                      م
                    </th>

                    <th>
                      الصنف
                    </th>

                    <th class="col-qty">
                      الكمية
                    </th>

                    <th class="col-price">
                      سعر الوحدة
                    </th>

                    <th class="col-total">
                      الإجمالي
                    </th>

                  </tr>

                </thead>


                <tbody>

                  <tr>

                    <td>
                      1
                    </td>

                    <td class="invoice-product-name">

                      <strong>
                        ${esc(booking.device)}
                      </strong>

                      <small>
                        خدمة صوتية
                      </small>

                    </td>

                    <td>
                      1
                    </td>

                    <td>
                      ${money(agreed)}
                    </td>

                    <td>
                      ${money(agreed)}
                    </td>

                  </tr>

                </tbody>

              </table>

            </section>


            <!-- الجزء السفلي -->

            <section class="invoice-bottom-grid">


              <!-- المبالغ -->

              <div class="invoice-summary">

                <div class="summary-row">

                  <span>
                    المبلغ المتفق عليه
                  </span>

                  <strong>
                    ${money(agreed)}
                  </strong>

                </div>


                <div class="summary-row">

                  <span>
                    الواصل
                  </span>

                  <strong>
                    ${money(paid)}
                  </strong>

                </div>


                <div class="summary-row">

                  <span>
                    المتبقي
                  </span>

                  <strong class="summary-remaining">
                    ${money(remaining)}
                  </strong>

                </div>


                <div class="summary-row summary-total">

                  <span>
                    الإجمالي
                  </span>

                  <strong>
                    ${money(agreed)}
                  </strong>

                </div>

              </div>


              <!-- الحروف والختم -->

              <div class="invoice-words-area">

                <div class="words-label">
                  المبلغ بالحروف :
                </div>

                <div class="words-box">
                  ${amountInWords(agreed)}
                </div>


                <img
                  src="stamp.png"
                  alt="ختم Winter Camp"
                  class="invoice-stamp">

              </div>

            </section>


            <!-- التذييل -->

            <footer class="invoice-footer">

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
          id="printInvoice">
          طباعة
        </button>

        <button
          id="shareInvoice"
          class="invoice-share-btn">
          مشاركة PDF
        </button>

        <button
          id="closeInvoice">
          إغلاق
        </button>

      </div>
    `
  );


  $('#printInvoice').onclick =
    () =>
      window.print();


  $('#shareInvoice').onclick =
    () =>
      shareInvoicePDF(
        booking
      );


  $('#closeInvoice').onclick =
    closeModal;
}


/* =====================================================
   PDF
===================================================== */

function loadExternalScript(url) {
  return new Promise(
    (resolve, reject) => {

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

      script.src = url;
      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(
        script
      );
    }
  );
}


async function ensurePDFLibraries() {
  if (!window.html2canvas) {
    await loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    );
  }

  if (!window.jspdf) {
    await loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    );
  }
}


async function waitForImages(element) {
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

  const previous =
    button?.textContent ||
    'مشاركة PDF';

  try {
    if (button) {
      button.disabled = true;
      button.textContent =
        'جاري تجهيز الفاتورة...';
    }

    await ensurePDFLibraries();
    await waitForImages(paper);

    const canvas =
      await window.html2canvas(
        paper,
        {
          scale: 2.2,
          backgroundColor:
            '#ffffff',
          useCORS: true,
          logging: false
        }
      );

    const {
      jsPDF
    } =
      window.jspdf;

    const pdf =
      new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

    const pageWidth = 210;
    const pageHeight = 297;

    pdf.addImage(
      canvas.toDataURL(
        'image/jpeg',
        0.97
      ),
      'JPEG',
      0,
      0,
      pageWidth,
      pageHeight,
      undefined,
      'FAST'
    );

    const blob =
      pdf.output('blob');

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
        files: [file],
        title:
          'فاتورة Winter Camp'
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

    link.href = url;
    link.download = fileName;

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

  } catch (error) {
    console.error(error);

    alert(
      'تعذر تجهيز الفاتورة PDF. تأكد من اتصال الإنترنت وحاول مرة أخرى.'
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        previous;
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

  link.href = url;

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
   القائمة
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
   الأزرار
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

if ($('#menuBtn')) {
  $('#menuBtn').onclick =
    () =>
      toggleMenu(true);
}

if ($('#closeMenu')) {
  $('#closeMenu').onclick =
    () =>
      toggleMenu(false);
}

if ($('#sheetBackdrop')) {
  $('#sheetBackdrop').onclick =
    () =>
      toggleMenu(false);
}

$$('[data-sheet-page]')
  .forEach(
    button => {
      button.onclick =
        () => {
          toggleMenu(false);

          go(
            button.dataset.sheetPage
          );
        };
    }
  );

if ($('#modalClose')) {
  $('#modalClose').onclick =
    closeModal;
}

if ($('#modalBackdrop')) {
  $('#modalBackdrop').onclick =
    closeModal;
}

if ($('#exportBtn')) {
  $('#exportBtn').onclick =
    exportData;
}

if ($('#backupBtn')) {
  $('#backupBtn').onclick =
    exportData;
}


/* =====================================================
   استيراد نسخة
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
          ) ||
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
            clone(seed.devices);
        }

        db = imported;

        save();
        render();
        toggleMenu(false);

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
   Service Worker
===================================================== */

if (
  'serviceWorker' in navigator
) {
  window.addEventListener(
    'load',
    () => {
      navigator.serviceWorker
        .register(
          './sw.js?v=51'
        )
        .catch(
          console.error
        );
    }
  );
}

render();
