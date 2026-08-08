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

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  [...document.querySelectorAll(selector)];


/* =========================
   التخزين
========================= */

function clone(object) {
  return JSON.parse(
    JSON.stringify(object)
  );
}

function load() {
  try {

    const saved =
      localStorage.getItem(DB_KEY);

    if (saved) {

      const data =
        JSON.parse(saved);

      if (!data.bookings) {
        data.bookings = [];
      }

      if (!data.expenses) {
        data.expenses = [];
      }

      if (!data.devices) {
        data.devices =
          clone(seed.devices);
      }

      return data;
    }

    return clone(seed);

  } catch (error) {

    return clone(seed);
  }
}

function save() {

  localStorage.setItem(
    DB_KEY,
    JSON.stringify(db)
  );
}


/* =========================
   المبالغ
========================= */

function money(value) {

  return new Intl.NumberFormat(
    'ar-SA'
  ).format(
    Number(value || 0)
  ) + ' ر.س';
}


/* =========================
   التاريخ
========================= */

function todayISO() {

  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getHijriParts(isoDate) {

  try {

    const date =
      new Date(
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
        parts.find(
          item =>
            item.type === 'day'
        )?.value
      ),

      month: Number(
        parts.find(
          item =>
            item.type === 'month'
        )?.value
      ),

      year: Number(
        parts.find(
          item =>
            item.type === 'year'
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

  const hijri =
    getHijriParts(isoDate);

  return (
    `${hijri.day} ` +
    `${HIJRI_MONTHS[hijri.month]} ` +
    `${hijri.year} هـ`
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
      new Date(
        isoDate + 'T12:00:00'
      )
    );

  } catch {

    return '';
  }
}

function hijriWithDay(isoDate) {

  return (
    `${dayName(isoDate)} ` +
    `${hijriFull(isoDate)}`
  );
}


/* =========================
   تحويل هجري إلى ميلادي
   داخلي فقط
========================= */

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
      hijriYear * 0.970224 +
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

    const hijri =
      getHijriParts(iso);

    if (
      hijri.year === hijriYear &&
      hijri.month === hijriMonth &&
      hijri.day === hijriDay
    ) {
      return iso;
    }
  }

  return null;
}


/* =========================
   حقول التاريخ الهجري
========================= */

function hijriDateFields(
  isoDate = todayISO(),
  prefix = 'date'
) {

  const selected =
    getHijriParts(isoDate);

  const current =
    currentHijri();

  let days = '';

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

  let months = '';

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

  let years = '';

  const startYear = 1446;
  const endYear =
    current.year + 5;

  for (
    let year = startYear;
    year <= endYear;
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


/* =========================
   الحسابات
========================= */

function totals(
  bookings = db.bookings,
  expenses = db.expenses
) {

  const revenue =
    bookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.agreed || 0
        ),
      0
    );

  const paid =
    bookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.paid || 0
        ),
      0
    );

  const expensesTotal =
    expenses.reduce(
      (total, expense) =>
        total +
        Number(
          expense.amount || 0
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
      revenue - expensesTotal
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


/* =========================
   الرئيسية
========================= */

function homeView() {

  const totalsData =
    totals();

  const upcoming =
    [...db.bookings]
      .filter(
        booking =>
          booking.date >=
          todayISO()
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

        <h2>
          مرحباً بك
        </h2>

        <p>
          ${hijriWithDay(
            todayISO()
          )}
        </p>

      </div>

    </section>


    <div class="cards">

      <div class="stat-card">

        <span class="label">
          إجمالي الإيرادات
        </span>

        <span class="value green">
          ${money(
            totalsData.revenue
          )}
        </span>

      </div>


      <div class="stat-card">

        <span class="label">
          إجمالي المصاريف
        </span>

        <span class="value red">
          ${money(
            totalsData.expenses
          )}
        </span>

      </div>


      <div class="stat-card">

        <span class="label">
          صافي الربح
        </span>

        <span class="value blue">
          ${money(
            totalsData.profit
          )}
        </span>

      </div>


      <div class="stat-card">

        <span class="label">
          المتبقي للتحصيل
        </span>

        <span class="value gold">
          ${money(
            totalsData.remaining
          )}
        </span>

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


/* =========================
   بطاقة الحجز
========================= */

function bookingCard(
  booking
) {

  const [
    statusText,
    statusClass
  ] =
    status(booking);

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


          <span
            class="badge ${statusClass}">

            ${statusText}

          </span>

        </div>


        <div class="amount">

          ${money(
            booking.agreed
          )}

          <small>

            المتبقي

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


/* =========================
   البحث في الحجوزات
========================= */

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
        booking =>
          booking.date >= today
      );
  }

  if (
    bookingFilter ===
    'past'
  ) {

    bookings =
      bookings.filter(
        booking =>
          booking.date < today
      );
  }

  const search =
    bookingSearch
      .trim()
      .toLowerCase();

  if (search) {

    bookings =
      bookings.filter(
        booking => {

          const name =
            String(
              booking.name || ''
            )
              .toLowerCase();

          const phone =
            String(
              booking.phone || ''
            )
              .replace(/\s+/g, '');

          const cleanSearch =
            search.replace(
              /\s+/g,
              ''
            );

          return (
            name.includes(
              search
            ) ||
            phone.includes(
              cleanSearch
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


/* =========================
   صفحة الحجوزات
========================= */

function bookingsView() {

  const bookings =
    getFilteredBookings();

  return `

    <div class="bookings-tools">

      <div class="booking-search-box">

        <span class="search-icon">
          ⌕
        </span>

        <input
          id="bookingSearch"
          type="search"
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

        ${
          bookingFilter === 'upcoming'
            ? 'الحجوزات القادمة'
            : bookingFilter === 'past'
              ? 'الحجوزات السابقة'
              : 'جميع الحجوزات'
        }

      </h3>

      <span class="count-badge">

        ${bookings.length}

      </span>

    </div>


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
  `;
}


/* =========================
   المصاريف
========================= */

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

        ${money(
          totals().expenses
        )}

      </strong>

    </div>


    ${
      expenses.length

        ? expenses.map(
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


/* =========================
   سنوات التقارير
========================= */

function getAvailableHijriYears() {

  const currentYear =
    currentHijri().year;

  const startYear = 1446;

  const endYear =
    currentYear + 5;

  const years = [];

  for (
    let year = startYear;
    year <= endYear;
    year++
  ) {

    years.push(year);
  }

  return years;
}


/* =========================
   فلترة التقارير
========================= */

function filterByHijriPeriod(
  items,
  month = reportMonth,
  year = reportYear
) {

  return items.filter(
    item => {

      const hijri =
        getHijriParts(
          item.date
        );

      const monthMatch =
        month === 'all' ||
        hijri.month ===
        Number(month);

      const yearMatch =
        year === 'all' ||
        hijri.year ===
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

    return (
      'جميع الأشهر وجميع السنوات'
    );
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


/* =========================
   تفاصيل أشهر السنة
========================= */

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
        أشهر سنة
        ${reportYear} هـ
      </h3>

    </div>

    <div class="months-list">
  `;

  for (
    let month = 1;
    month <= 12;
    month++
  ) {

    const monthBookings =
      filterByHijriPeriod(
        db.bookings,
        String(month),
        reportYear
      );

    const monthExpenses =
      filterByHijriPeriod(
        db.expenses,
        String(month),
        reportYear
      );

    const monthTotals =
      totals(
        monthBookings,
        monthExpenses
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
            ${monthBookings.length}
            حجز
          </small>

        </div>


        <div class="month-report-money">

          <span class="green">

            ${money(
              monthTotals.revenue
            )}

          </span>

          <small>

            المصاريف:
            ${money(
              monthTotals.expenses
            )}

            <br>

            الصافي:
            ${money(
              monthTotals.profit
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


/* =========================
   التقارير
========================= */

function reportsView() {

  const bookings =
    filterByHijriPeriod(
      db.bookings
    );

  const expenses =
    filterByHijriPeriod(
      db.expenses
    );

  const reportTotals =
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
            years.map(
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
            ).join('')
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
          ${money(
            reportTotals.revenue
          )}
        </span>

      </div>


      <div class="stat-card">

        <span class="label">
          المصاريف
        </span>

        <span class="value red">
          ${money(
            reportTotals.expenses
          )}
        </span>

      </div>


      <div class="stat-card">

        <span class="label">
          صافي الربح
        </span>

        <span class="value blue">
          ${money(
            reportTotals.profit
          )}
        </span>

      </div>


      <div class="stat-card">

        <span class="label">
          المتبقي
        </span>

        <span class="value gold">
          ${money(
            reportTotals.remaining
          )}
        </span>

      </div>

    </div>


    ${monthlyBreakdownView()}
  `;
}


/* =========================
   الأجهزة
========================= */

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


/* =========================
   قائمة الفواتير
========================= */

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
                    #${String(
                      booking.id
                    ).slice(-6)}

                  </strong>

                  <small>

                    ${esc(
                      booking.name
                    )}

                    <br>

                    ${hijriWithDay(
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
          ).join('')

        : `
          <div class="empty">
            لا توجد فواتير
          </div>
        `
    }
  `;
}


/* =========================
   الإعدادات
========================= */

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
        هجري - أم القرى
      </small>

    </div>


    <div class="settings-card">

      <strong>
        حفظ البيانات
      </strong>

      <small>
        البيانات محفوظة
        داخل الجهاز
      </small>

    </div>


    <button
      id="settingsExport"
      class="submit-btn">

      تصدير نسخة احتياطية

    </button>
  `;
}


/* =========================
   عرض الصفحات
========================= */

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

  $('#pageTitle').textContent =
    titles[currentPage] ||
    'الرئيسية';

  $$('.nav-item').forEach(
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

  $('#mainContent').innerHTML =
    (
      views[currentPage] ||
      homeView
    )();

  bindViewEvents();
}

function go(page) {

  currentPage = page;

  render();
}


/* =========================
   الأحداث
========================= */

function bindViewEvents() {

  $$('[data-go]')
    .forEach(
      button => {

        button.onclick = () => {

          go(
            button.dataset.go
          );
        };
      }
    );


  $$('[data-detail]')
    .forEach(
      button => {

        button.onclick = () => {

          showDetail(
            Number(
              button.dataset.detail
            )
          );
        };
      }
    );


  $$('[data-invoice]')
    .forEach(
      button => {

        button.onclick = () => {

          showInvoice(
            Number(
              button.dataset.invoice
            )
          );
        };
      }
    );


  $$('[data-del-expense]')
    .forEach(
      button => {

        button.onclick = () => {

          deleteExpense(
            Number(
              button.dataset.delExpense
            )
          );
        };
      }
    );


  const searchInput =
    $('#bookingSearch');

  if (searchInput) {

    searchInput.oninput =
      event => {

        bookingSearch =
          event.target.value;

        const value =
          bookingSearch;

        const position =
          event.target
            .selectionStart;

        render();

        const newInput =
          $('#bookingSearch');

        if (newInput) {

          newInput.focus();

          newInput.value =
            value;

          try {

            newInput.setSelectionRange(
              position,
              position
            );

          } catch {}
        }
      };
  }


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
              button.dataset
                .reportMonth;

            render();
          };
      }
    );


  const exportButton =
    $('#settingsExport');

  if (exportButton) {

    exportButton.onclick =
      exportData;
  }
}


/* =========================
   تنظيف النص
========================= */

function esc(text = '') {

  return String(text).replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character])
  );
}


/* =========================
   النوافذ
========================= */

function openModal(
  title,
  content
) {

  $('#modalTitle')
    .textContent =
    title;

  $('#modalBody')
    .innerHTML =
    content;

  $('#modalBackdrop')
    .classList
    .remove('hidden');

  $('#modal')
    .classList
    .remove('hidden');
}

function closeModal() {

  $('#modalBackdrop')
    .classList
    .add('hidden');

  $('#modal')
    .classList
    .add('hidden');
}


/* =========================
   تفاصيل الحجز
========================= */

function showDetail(id) {

  const booking =
    db.bookings.find(
      item =>
        item.id === id
    );

  if (!booking) {
    return;
  }

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

  openModal(
    'تفاصيل الحجز',

    `

      <div class="detail-list">

        <div>

          <span>
            اسم العميل
          </span>

          <strong>
            ${esc(
              booking.name
            )}
          </strong>

        </div>


        <div>

          <span>
            رقم التواصل
          </span>

          <strong>
            ${esc(
              booking.phone || '-'
            )}
          </strong>

        </div>


        <div>

          <span>
            الجهاز
          </span>

          <strong>
            ${esc(
              booking.device
            )}
          </strong>

        </div>


        <div>

          <span>
            الموقع
          </span>

          <strong>
            ${esc(
              booking.location
            )}
          </strong>

        </div>


        <div>

          <span>
            التاريخ
          </span>

          <strong>
            ${hijriWithDay(
              booking.date
            )}
          </strong>

        </div>


        <div>

          <span>
            المتفق عليه
          </span>

          <strong class="green">
            ${money(
              booking.agreed
            )}
          </strong>

        </div>


        <div>

          <span>
            الواصل
          </span>

          <strong class="blue">
            ${money(
              booking.paid
            )}
          </strong>

        </div>


        <div>

          <span>
            المتبقي
          </span>

          <strong class="red">
            ${money(
              remaining
            )}
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

  $('#detailInvoice')
    .onclick =
    () =>
      showInvoice(id);

  $('#editBooking')
    .onclick =
    () =>
      openBookingForm(
        booking
      );

  $('#deleteBooking')
    .onclick =
    () => {

      if (
        confirm(
          'هل تريد حذف الحجز؟'
        )
      ) {

        db.bookings =
          db.bookings.filter(
            item =>
              item.id !== id
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


/* =========================
   نموذج الحجز
========================= */

function openBookingForm(
  existing = null
) {

  const booking =
    existing || {
      name: '',
      phone: '',
      device: '',
      location: '',
      eventType: '',
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
            value="${esc(
              booking.name
            )}">

        </label>


        <label>

          رقم الجوال

          <input
            name="phone"
            inputmode="tel"
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


        <label>

          نوع الجهاز / الباقة

          <input
            name="device"
            required
            value="${esc(
              booking.device || ''
            )}"
            placeholder="مثال: 2 سماعات">

        </label>


        <label>

          الموقع

          <input
            name="location"
            required
            value="${esc(
              booking.location || ''
            )}">

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
              min="0"
              required
              value="${booking.agreed}">

          </label>


          <label>

            الواصل

            <input
              name="paid"
              type="number"
              min="0"
              value="${booking.paid}">

          </label>

        </div>


        <label>

          ملاحظات

          <textarea
            name="notes">${esc(
              booking.notes || ''
            )}</textarea>

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

  $('#bookingForm')
    .onsubmit =
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


/* =========================
   إضافة مصروف
========================= */

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

  $('#expenseForm')
    .onsubmit =
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

      data.date =
        date;

      data.id =
        Date.now();

      data.amount =
        Number(
          data.amount || 0
        );

      db.expenses.push(
        data
      );

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
    confirm(
      'هل تريد حذف المصروف؟'
    )
  ) {

    db.expenses =
      db.expenses.filter(
        item =>
          item.id !== id
      );

    save();

    render();

    toast(
      'تم حذف المصروف'
    );
  }
}


/* =========================
   تحويل الرقم للحروف
========================= */

function amountInWords(
  amount
) {

  const value =
    Number(amount || 0);

  if (value === 0) {

    return (
      'صفر ريال سعودي فقط لا غير'
    );
  }

  return (
    `${money(value)} فقط لا غير`
  );
}


/* =========================
   الفاتورة الجديدة
========================= */

function showInvoice(id) {

  const booking =
    db.bookings.find(
      item =>
        item.id === id
    );

  if (!booking) {
    return;
  }

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

  const invoiceNumber =
    String(
      booking.id
    ).slice(-6);

  openModal(
    'الفاتورة',

    `

      <div
        class="wc-invoice"
        id="invoicePaper">


        <div class="invoice-wave wave-left">
        </div>

        <div class="invoice-wave wave-right">
        </div>


        <div class="wc-invoice-header">

          <img
            src="wintercamp_icon.png"
            class="wc-invoice-logo"
            alt="Winter Camp">


          <div class="wc-brand-en">
            Winter Camp
          </div>


          <div class="wc-brand-ar">

            للصوتيات والإنتاج الصوتي

          </div>


          <div class="wc-invoice-title">

            فاتورة

          </div>

        </div>


        <div class="wc-invoice-number">

          <div>

            <span>
              رقم الفاتورة
            </span>

            <strong>
              INV-${invoiceNumber}
            </strong>

          </div>


          <div>

            <span>
              التاريخ الهجري
            </span>

            <strong>
              ${hijriFull(
                booking.date
              )}
            </strong>

          </div>

        </div>


        <div class="wc-client-box">

          <div>

            <p>

              <span>
                اسم العميل :
              </span>

              <strong>
                ${esc(
                  booking.name
                )}
              </strong>

            </p>


            <p>

              <span>
                رقم التواصل :
              </span>

              <strong>
                ${esc(
                  booking.phone || '-'
                )}
              </strong>

            </p>


            <p>

              <span>
                الموقع :
              </span>

              <strong>
                ${esc(
                  booking.location
                )}
              </strong>

            </p>

          </div>


          <div>

            <p>

              <span>
                نوع المناسبة :
              </span>

              <strong>

                ${esc(
                  booking.eventType ||
                  '-'
                )}

              </strong>

            </p>


            <p>

              <span>
                ملاحظات :
              </span>

              <strong>

                ${esc(
                  booking.notes ||
                  'شكراً لثقتكم بنا'
                )}

              </strong>

            </p>

          </div>

        </div>


        <table class="wc-items-table">

          <thead>

            <tr>

              <th>
                م
              </th>

              <th>
                الصنف
              </th>

              <th>
                الكمية
              </th>

              <th>
                سعر الوحدة
              </th>

              <th>
                الإجمالي
              </th>

            </tr>

          </thead>


          <tbody>

            <tr>

              <td>
                1
              </td>

              <td>
                ${esc(
                  booking.device
                )}
              </td>

              <td>
                1
              </td>

              <td>
                ${money(
                  booking.agreed
                )}
              </td>

              <td>
                ${money(
                  booking.agreed
                )}
              </td>

            </tr>

          </tbody>

        </table>


        <div class="wc-invoice-bottom">


          <div class="wc-summary-table">

            <div>

              <span>
                المبلغ المتفق عليه
              </span>

              <strong>
                ${money(
                  booking.agreed
                )}
              </strong>

            </div>


            <div>

              <span>
                الواصل
              </span>

              <strong>
                ${money(
                  booking.paid
                )}
              </strong>

            </div>


            <div>

              <span>
                المتبقي
              </span>

              <strong class="red">

                ${money(
                  remaining
                )}

              </strong>

            </div>


            <div class="wc-total">

              <span>
                الإجمالي
              </span>

              <strong>
                ${money(
                  booking.agreed
                )}
              </strong>

            </div>

          </div>


          <div class="wc-words-stamp">

            <div>

              <p class="wc-words-title">

                المبلغ بالحروف :

              </p>

              <div class="wc-amount-words">

                ${amountInWords(
                  booking.agreed
                )}

              </div>

            </div>


            <img
              src="stamp.png"
              class="wc-stamp"
              alt="ختم Winter Camp"
              onerror="
                this.style.display='none'
              ">

          </div>

        </div>


        <div class="wc-footer">

          <span>
            ☎ 0573757275
          </span>

          <span>
            📍 أبها - المملكة العربية السعودية
          </span>

          <span>
            Winter Camp
          </span>

        </div>

      </div>


      <div class="invoice-actions">

        <button
          id="printInvoice">

          طباعة

        </button>

        <button
          id="shareInvoice">

          مشاركة

        </button>

        <button
          id="closeInvoice">

          إغلاق

        </button>

      </div>
    `
  );

  $('#printInvoice')
    .onclick =
    () => window.print();

  $('#shareInvoice')
    .onclick =
    () =>
      shareBooking(
        booking
      );

  $('#closeInvoice')
    .onclick =
    closeModal;
}


/* =========================
   مشاركة الفاتورة
========================= */

function shareBooking(
  booking
) {

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

  const text = `
Winter Camp
للصوتيات والإنتاج الصوتي

العميل:
${booking.name}

رقم الجوال:
${booking.phone || '-'}

التاريخ:
${hijriWithDay(booking.date)}

الموقع:
${booking.location}

المناسبة:
${booking.eventType || '-'}

الصنف:
${booking.device}

المبلغ:
${money(booking.agreed)}

الواصل:
${money(booking.paid)}

المتبقي:
${money(remaining)}
`;

  if (
    navigator.share
  ) {

    navigator.share({
      title:
        'فاتورة Winter Camp',
      text
    });

  } else {

    navigator.clipboard
      ?.writeText(text);

    toast(
      'تم نسخ بيانات الفاتورة'
    );
  }
}


/* =========================
   النسخة الاحتياطية
========================= */

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

  link.click();

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


/* =========================
   إشعار
========================= */

function toast(
  message
) {

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


/* =========================
   القائمة الجانبية
========================= */

function toggleMenu(show) {

  $('#sideSheet')
    .classList.toggle(
      'hidden',
      !show
    );

  $('#sheetBackdrop')
    .classList.toggle(
      'hidden',
      !show
    );
}


/* =========================
   الأزرار الرئيسية
========================= */

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


$('#menuBtn').onclick =
  () =>
    toggleMenu(true);


$('#closeMenu').onclick =
  () =>
    toggleMenu(false);


$('#sheetBackdrop').onclick =
  () =>
    toggleMenu(false);


$$('[data-sheet-page]')
  .forEach(
    button => {

      button.onclick =
        () => {

          toggleMenu(false);

          go(
            button.dataset
              .sheetPage
          );
        };
    }
  );


$('#modalClose').onclick =
  closeModal;


$('#modalBackdrop').onclick =
  closeModal;


$('#exportBtn').onclick =
  exportData;


$('#backupBtn').onclick =
  exportData;


/* =========================
   استيراد نسخة
========================= */

$('#importInput')
  .onchange =
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
        !imported.devices
      ) {

        imported.devices =
          clone(
            seed.devices
          );
      }

      db =
        imported;

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


/* =========================
   تاريخ الأعلى
========================= */

if (
  $('#hijriToday')
) {

  $('#hijriToday')
    .textContent =
    hijriWithDay(
      todayISO()
    );
}


/* =========================
   Service Worker
========================= */

if (
  'serviceWorker'
  in navigator
) {

  window.addEventListener(
    'load',
    () => {

      navigator
        .serviceWorker
        .register(
          './sw.js?v=30'
        )
        .catch(
          console.error
        );
    }
  );
}


render();
