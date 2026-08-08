/* =========================================================
   WINTER CAMP - RENTAL MANAGEMENT
   النسخة الكاملة
========================================================= */

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
    {
      id: 1,
      name: 'RCF ART 715-A MK5',
      qty: 2
    },
    {
      id: 2,
      name: 'سماعة بلوتوث',
      qty: 1
    },
    {
      id: 3,
      name: 'MG-12XU ميكسر',
      qty: 1
    },
    {
      id: 4,
      name: 'ميكروفون',
      qty: 4
    }
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


/* =========================================================
   التخزين
========================================================= */

function clone(object) {
  return JSON.parse(
    JSON.stringify(object)
  );
}

function load() {

  try {

    const saved =
      localStorage.getItem(DB_KEY);

    if (!saved) {
      return clone(seed);
    }

    const data =
      JSON.parse(saved);

    if (!Array.isArray(data.bookings)) {
      data.bookings = [];
    }

    if (!Array.isArray(data.expenses)) {
      data.expenses = [];
    }

    if (!Array.isArray(data.devices)) {
      data.devices =
        clone(seed.devices);
    }

    return data;

  } catch (error) {

    console.error(
      'خطأ في قراءة البيانات',
      error
    );

    return clone(seed);
  }
}

function save() {

  localStorage.setItem(
    DB_KEY,
    JSON.stringify(db)
  );
}


/* =========================================================
   المبالغ
========================================================= */

function money(value) {

  return (
    new Intl.NumberFormat(
      'ar-SA'
    ).format(
      Number(value || 0)
    ) +
    ' ر.س'
  );
}


/* =========================================================
   التاريخ
========================================================= */

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

  return (
    `${year}-${month}-${day}`
  );
}


function getHijriParts(
  isoDate
) {

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
          timeZone: 'Asia/Riyadh'
        }
      );

    const parts =
      formatter
        .formatToParts(date);

    return {

      day:
        Number(
          parts.find(
            item =>
              item.type === 'day'
          )?.value
        ),

      month:
        Number(
          parts.find(
            item =>
              item.type === 'month'
          )?.value
        ),

      year:
        Number(
          parts.find(
            item =>
              item.type === 'year'
          )?.value
        )

    };

  } catch (error) {

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


function hijriFull(
  isoDate
) {

  const hijri =
    getHijriParts(
      isoDate
    );

  return (
    `${hijri.day} ` +
    `${HIJRI_MONTHS[hijri.month]} ` +
    `${hijri.year} هـ`
  );
}


function hijriShort(
  isoDate
) {

  const hijri =
    getHijriParts(
      isoDate
    );

  return (
    `${hijri.day}/` +
    `${hijri.month}/` +
    `${hijri.year} هـ`
  );
}


function dayName(
  isoDate
) {

  try {

    return new Intl
      .DateTimeFormat(
        'ar-SA',
        {
          weekday: 'long',
          timeZone: 'Asia/Riyadh'
        }
      )
      .format(
        new Date(
          isoDate +
          'T12:00:00'
        )
      );

  } catch {

    return '';
  }
}


function hijriWithDay(
  isoDate
) {

  return (
    `${dayName(isoDate)} ` +
    `${hijriFull(isoDate)}`
  );
}


/* =========================================================
   تحويل هجري إلى ميلادي داخليًا
========================================================= */

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

    const hijri =
      getHijriParts(
        iso
      );

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


/* =========================================================
   اختيار التاريخ الهجري
========================================================= */

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


/* =========================================================
   الحسابات
========================================================= */

function totals(
  bookings = db.bookings,
  expenses = db.expenses
) {

  const revenue =
    bookings.reduce(
      (
        total,
        booking
      ) =>
        total +
        Number(
          booking.agreed || 0
        ),
      0
    );


  const paid =
    bookings.reduce(
      (
        total,
        booking
      ) =>
        total +
        Number(
          booking.paid || 0
        ),
      0
    );


  const expensesTotal =
    expenses.reduce(
      (
        total,
        expense
      ) =>
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
      revenue -
      expensesTotal

  };
}


function status(
  booking
) {

  const remaining =
    Number(
      booking.agreed || 0
    ) -
    Number(
      booking.paid || 0
    );

  if (remaining <= 0) {

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


/* =========================================================
   الرئيسية + الأيقونات الجديدة
========================================================= */

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


      <!-- الإيرادات -->

      <div
        class="
          stat-card
          stat-revenue
        ">

        <div class="stat-card-top">

          <span class="label">
            إجمالي الإيرادات
          </span>


          <span
            class="
              dashboard-icon
              green-icon
            ">

            <svg
              viewBox="0 0 24 24">

              <path
                d="
                  M4 18
                  L10 12
                  L14 16
                  L21 7
                "
              />

              <path
                d="
                  M15 7
                  H21
                  V13
                "
              />

            </svg>

          </span>

        </div>


        <span
          class="value green">

          ${money(
            totalsData.revenue
          )}

        </span>


        <small
          class="stat-description">

          إجمالي قيمة الحجوزات

        </small>

      </div>



      <!-- المصروفات -->

      <div
        class="
          stat-card
          stat-expenses
        ">

        <div class="stat-card-top">

          <span class="label">
            إجمالي المصروفات
          </span>


          <span
            class="
              dashboard-icon
              red-icon
            ">

            <svg
              viewBox="0 0 24 24">

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

              <path
                d="M8 3V7"
              />

            </svg>

          </span>

        </div>


        <span
          class="value red">

          ${money(
            totalsData.expenses
          )}

        </span>


        <small
          class="stat-description">

          جميع المصروفات المسجلة

        </small>

      </div>



      <!-- صافي الربح -->

      <div
        class="
          stat-card
          stat-profit
        ">

        <div class="stat-card-top">

          <span class="label">
            صافي الربح
          </span>


          <span
            class="
              dashboard-icon
              blue-icon
            ">

            <svg
              viewBox="0 0 24 24">

              <path d="M4 20V13"/>

              <path d="M10 20V8"/>

              <path d="M16 20V4"/>

              <path d="M22 20H2"/>

            </svg>

          </span>

        </div>


        <span
          class="value blue">

          ${money(
            totalsData.profit
          )}

        </span>


        <small
          class="stat-description">

          الإيرادات ناقص المصروفات

        </small>

      </div>



      <!-- المتبقي -->

      <div
        class="
          stat-card
          stat-remaining
        ">

        <div class="stat-card-top">

          <span class="label">
            المتبقي للتحصيل
          </span>


          <span
            class="
              dashboard-icon
              gold-icon
            ">

            <svg
              viewBox="0 0 24 24">

              <circle
                cx="12"
                cy="12"
                r="9"
              />

              <path
                d="
                  M12 7
                  V12
                  L15 14
                "
              />

            </svg>

          </span>

        </div>


        <span
          class="value gold">

          ${money(
            totalsData.remaining
          )}

        </span>


        <small
          class="stat-description">

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


/* =========================================================
   بطاقة الحجز
========================================================= */

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
            class="
              badge
              ${statusClass}
            ">

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
          class="
            small-btn
            primary
          "
          data-invoice="${booking.id}">

          عرض الفاتورة

        </button>

      </div>

    </article>

  `;
}


/* =========================================================
   البحث
========================================================= */

function normalizeSearchText(
  text
) {

  return String(
    text || ''
  )
    .trim()
    .toLowerCase();
}


function normalizePhone(
  text
) {

  return String(
    text || ''
  )
    .replace(/[^\d٠-٩]/g, '');
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


  const searchText =
    normalizeSearchText(
      bookingSearch
    );

  const phoneSearch =
    normalizePhone(
      bookingSearch
    );


  if (searchText) {

    bookings =
      bookings.filter(
        booking => {

          const name =
            normalizeSearchText(
              booking.name
            );

          const phone =
            normalizePhone(
              booking.phone
            );

          return (
            name.includes(
              searchText
            ) ||
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


/* =========================================================
   صفحة الحجوزات
========================================================= */

function bookingsView() {

  const bookings =
    getFilteredBookings();


  let title =
    'جميع الحجوزات';

  if (
    bookingFilter ===
    'upcoming'
  ) {

    title =
      'الحجوزات القادمة';
  }

  if (
    bookingFilter ===
    'past'
  ) {

    title =
      'الحجوزات السابقة';
  }


  return `

    <div class="bookings-tools">


      <div class="booking-search-box">

        <span class="search-icon">

          <svg
            viewBox="0 0 24 24"
            style="
              width:21px;
              height:21px;
              fill:none;
              stroke:currentColor;
              stroke-width:2;
            ">

            <circle
              cx="11"
              cy="11"
              r="7"
            />

            <path
              d="
                M20 20
                L16.5 16.5
              "
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
          )}"
        >

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


/* =========================================================
   تحديث نتائج البحث بدون إعادة إنشاء خانة البحث
========================================================= */

function refreshBookingResults() {

  const bookings =
    getFilteredBookings();


  const container =
    $('#bookingResults');

  const count =
    $('#bookingCount');


  if (container) {

    container.innerHTML =
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


/* =========================================================
   المصاريف
========================================================= */

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


                    <button
                      class="delete-mini"
                      data-del-expense="${expense.id}">

                      حذف

                    </button>

                  </div>

                </div>

              `
            )
            .join('')

        : `
          <div class="empty">

            لا توجد مصاريف

          </div>
        `
    }

  `;
}


/* =========================================================
   سنوات التقارير
========================================================= */

function getAvailableHijriYears() {

  const current =
    currentHijri().year;

  const start = 1446;

  const end =
    current + 5;

  const years = [];


  for (
    let year = start;
    year <= end;
    year++
  ) {

    years.push(
      year
    );
  }


  return years;
}


/* =========================================================
   فلترة التقارير
========================================================= */

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
        Number(reportMonth)
      ]} - جميع السنوات`
    );
  }


  return (
    `${HIJRI_MONTHS[
      Number(reportMonth)
    ]} ${reportYear} هـ`
  );
}


/* =========================================================
   تفاصيل الأشهر
========================================================= */

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


    const monthTotals =
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

            ${bookings.length}
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


/* =========================================================
   التقارير
========================================================= */

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


/* =========================================================
   الأجهزة
========================================================= */

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


/* =========================================================
   الفواتير
========================================================= */

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
                    class="
                      small-btn
                      primary
                    "
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


/* =========================================================
   الإعدادات
========================================================= */

function settingsView() {

  return `

    <div class="section-head">

      <h3>
        الإعدادات
      </h3>

    </div>


    <div class="settings-card">

      <strong>
        التاريخ
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
        تبدأ من سنة 1446 هـ
      </small>

    </div>


    <div class="settings-card">

      <strong>
        حفظ البيانات
      </strong>

      <small>
        محفوظة داخل الجهاز
      </small>

    </div>


    <button
      id="settingsExport"
      class="submit-btn">

      تصدير نسخة احتياطية

    </button>

  `;
}


/* =========================================================
   عرض الصفحات
========================================================= */

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
        views[currentPage] ||
        homeView
      )();
  }


  bindViewEvents();
}


function go(
  page
) {

  currentPage =
    page;

  render();
}


/* =========================================================
   أحداث العناصر الناتجة
========================================================= */

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


/* =========================================================
   أحداث الصفحة
========================================================= */

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
                button.dataset
                  .delExpense
              )
            );
      }
    );


  /* -------------------------
     البحث
  ------------------------- */

  const searchInput =
    $('#bookingSearch');


  if (searchInput) {

    searchInput
      .addEventListener(
        'input',
        event => {

          bookingSearch =
            event.target.value;

          /*
             لا نستخدم render هنا.
             لذلك لوحة مفاتيح الآيفون
             لن تتغير بعد كل رقم.
          */

          refreshBookingResults();
        }
      );
  }


  /* -------------------------
     فلتر الحجوزات
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
     الضغط على شهر
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


  const exportButton =
    $('#settingsExport');


  if (exportButton) {

    exportButton.onclick =
      exportData;
  }

}


/* =========================================================
   تنظيف النص
========================================================= */

function esc(
  text = ''
) {

  return String(text)
    .replace(
      /[&<>"']/g,
      character => ({

        '&':
          '&amp;',

        '<':
          '&lt;',

        '>':
          '&gt;',

        '"':
          '&quot;',

        "'":
          '&#039;'

      }[character])
    );
}


/* =========================================================
   النوافذ
========================================================= */

function openModal(
  title,
  content
) {

  const titleElement =
    $('#modalTitle');

  const body =
    $('#modalBody');


  if (titleElement) {

    titleElement.textContent =
      title;
  }


  if (body) {

    body.innerHTML =
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


/* =========================================================
   تفاصيل الحجز
========================================================= */

function showDetail(
  id
) {

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
            رقم الجوال
          </span>

          <strong>
            ${esc(
              booking.phone || '-'
            )}
          </strong>

        </div>


        <div>

          <span>
            نوع المناسبة
          </span>

          <strong>
            ${esc(
              booking.eventType ||
              '-'
            )}
          </strong>

        </div>


        <div>

          <span>
            الأجهزة
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
            السعر المتفق عليه
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
          class="
            small-btn
            primary
          ">

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
      showInvoice(
        id
      );


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


/* =========================================================
   نموذج الحجز
========================================================= */

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

      date:
        todayISO(),

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
            )}"
          >

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
            placeholder="05xxxxxxxx"
          >

        </label>


        <label>

          نوع المناسبة

          <input
            name="eventType"
            value="${esc(
              booking.eventType || ''
            )}"
            placeholder="مثال: زواج أو مناسبة خاصة"
          >

        </label>


        <label>

          نوع الأجهزة / الباقة

          <input
            name="device"
            required
            value="${esc(
              booking.device || ''
            )}"
            placeholder="مثال: سماعتين + ميكسر"
          >

        </label>


        <label>

          الموقع

          <input
            name="location"
            required
            value="${esc(
              booking.location || ''
            )}"
            placeholder="مثال: أبها - حي العرين"
          >

        </label>


        ${hijriDateFields(
          booking.date,
          'booking'
        )}


        <div class="form-row">


          <label>

            السعر المتفق عليه

            <input
              name="agreed"
              type="number"
              inputmode="decimal"
              min="0"
              required
              value="${booking.agreed}"
            >

          </label>


          <label>

            الواصل

            <input
              name="paid"
              type="number"
              inputmode="decimal"
              min="0"
              value="${booking.paid}"
            >

          </label>

        </div>


        <label>

          ملاحظات

          <textarea
            name="notes"
            placeholder="ملاحظات اختيارية"
          >${esc(
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


      formData.date =
        date;


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


/* =========================================================
   المصروف
========================================================= */

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
            required
            placeholder="مثال: وقود"
          >

        </label>


        <label>

          المبلغ

          <input
            name="amount"
            type="number"
            inputmode="decimal"
            min="0"
            required
          >

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


      data.id =
        Date.now();


      data.date =
        date;


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


function deleteExpense(
  id
) {

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


/* =========================================================
   كتابة المبلغ
========================================================= */

function amountInWords(
  amount
) {

  const value =
    Number(
      amount || 0
    );


  if (value === 0) {

    return (
      'صفر ريال سعودي فقط لا غير'
    );
  }


  return (
    `${money(value)} فقط لا غير`
  );
}


/* =========================================================
   الفاتورة
========================================================= */

function showInvoice(
  id
) {

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


        <div
          class="
            invoice-wave
            wave-left
          ">
        </div>


        <div
          class="
            invoice-wave
            wave-right
          ">
        </div>


        <div class="wc-invoice-header">


          <img
            src="wintercamp_icon.png"
            class="wc-invoice-logo"
            alt="Winter Camp"
          >


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
              التاريخ
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
            >

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

          مشاركة PDF

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
    () =>
      window.print();


  $('#shareInvoice')
    .onclick =
    () =>
      shareInvoicePDF(
        booking
      );


  $('#closeInvoice')
    .onclick =
    closeModal;
}


/* =========================================================
   تحميل مكتبة خارجية
========================================================= */

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


      document.head
        .appendChild(
          script
        );
    }
  );
}


/* =========================================================
   تجهيز مكتبات PDF
========================================================= */

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


/* =========================================================
   إنشاء PDF ومشاركته
========================================================= */

async function shareInvoicePDF(
  booking
) {

  const paper =
    $('#invoicePaper');


  if (!paper) {
    return;
  }


  const shareButton =
    $('#shareInvoice');


  const oldText =
    shareButton
      ? shareButton.textContent
      : '';


  try {

    if (shareButton) {

      shareButton.disabled =
        true;

      shareButton.textContent =
        'جاري تجهيز PDF...';
    }


    toast(
      'جاري تجهيز الفاتورة'
    );


    await ensurePDFLibraries();


    /*
       ننتظر تحميل الشعار والختم
    */

    const images =
      [
        ...paper.querySelectorAll(
          'img'
        )
      ];


    await Promise.all(
      images.map(
        image => {

          if (image.complete) {
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


    const canvas =
      await window
        .html2canvas(
          paper,
          {
            scale: 2,
            backgroundColor:
              '#ffffff',
            useCORS: true,
            logging: false
          }
        );


    const imageData =
      canvas.toDataURL(
        'image/jpeg',
        0.96
      );


    const {
      jsPDF
    } =
      window.jspdf;


    const pdf =
      new jsPDF(
        {
          orientation:
            'portrait',

          unit:
            'mm',

          format:
            'a4'
        }
      );


    const pageWidth =
      210;

    const pageHeight =
      297;


    const margin =
      7;


    const maxWidth =
      pageWidth -
      margin * 2;


    const maxHeight =
      pageHeight -
      margin * 2;


    const ratio =
      Math.min(
        maxWidth /
          canvas.width,

        maxHeight /
          canvas.height
      );


    const width =
      canvas.width *
      ratio;


    const height =
      canvas.height *
      ratio;


    const x =
      (
        pageWidth -
        width
      ) / 2;


    const y =
      margin;


    pdf.addImage(
      imageData,
      'JPEG',
      x,
      y,
      width,
      height
    );


    const blob =
      pdf.output(
        'blob'
      );


    const invoiceNumber =
      String(
        booking.id
      ).slice(-6);


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


    /*
       iPhone / iOS:
       نفتح نافذة المشاركة
       ويظهر WhatsApp ضمن الخيارات.
    */

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(
        {
          files: [file]
        }
      )
    ) {

      await navigator.share(
        {
          files: [file],

          title:
            'فاتورة Winter Camp',

          text:
            `فاتورة ${booking.name}`
        }
      );

      return;
    }


    /*
       في حال الجهاز لا يدعم
       مشاركة ملفات مباشرة:
       ننزل PDF.
    */

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


    document.body
      .appendChild(
        link
      );


    link.click();


    link.remove();


    setTimeout(
      () => {

        URL.revokeObjectURL(
          url
        );

      },
      2000
    );


    toast(
      'تم تجهيز ملف PDF'
    );


  } catch (error) {

    console.error(
      error
    );


    alert(
      'تعذر تجهيز PDF. تأكد أن الجهاز متصل بالإنترنت ثم حاول مرة أخرى.'
    );

  } finally {

    if (shareButton) {

      shareButton.disabled =
        false;

      shareButton.textContent =
        oldText ||
        'مشاركة PDF';
    }
  }
}


/* =========================================================
   النسخة الاحتياطية
========================================================= */

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


  document.body
    .appendChild(
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


/* =========================================================
   إشعار
========================================================= */

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


  element.classList
    .remove(
      'hidden'
    );


  setTimeout(
    () => {

      element.classList
        .add(
          'hidden'
        );

    },
    1800
  );
}


/* =========================================================
   القائمة
========================================================= */

function toggleMenu(
  show
) {

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


/* =========================================================
   أزرار البرنامج
========================================================= */

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


/* =========================================================
   استيراد نسخة احتياطية
========================================================= */

if ($('#importInput')) {

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

          throw new Error(
            'Invalid backup'
          );
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


/* =========================================================
   تاريخ اليوم في الأعلى
========================================================= */

if (
  $('#hijriToday')
) {

  $('#hijriToday')
    .textContent =
    hijriWithDay(
      todayISO()
    );
}


/* =========================================================
   Service Worker
========================================================= */

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
          './sw.js?v=40'
        )
        .catch(
          error =>
            console.log(
              error
            )
        );
    }
  );
}


/* =========================================================
   تشغيل البرنامج
========================================================= */

render();
