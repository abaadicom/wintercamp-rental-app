Const DB_KEY = 'wintercamp_rental_v1';

Const HIJRI_MONTHS = [
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

Const seed = {
  Bookings: [],
  Expenses: [],
  Devices: [
    { id: 1, name: 'RCF ART 715-A MK5', qty: 2 },
    { id: 2, name: 'سماعة بلوتوث', qty: 1 },
    { id: 3, name: 'MG-12XU ميكسر', qty: 1 },
    { id: 4, name: 'ميكروفون', qty: 4 }
  ]
};

Let db = load();

Let currentPage = 'home';
Let reportMonth = 'all';
Let reportYear = String(currentHijri().year);
Let bookingSearch = '';
Let bookingFilter = 'all';

Const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];


/* =====================================================
   التخزين
===================================================== */

Function clone(obj) {
  Return JSON.parse(JSON.stringify(obj));
}

Function load() {
  Try {
    Const saved = localStorage.getItem(DB_KEY);

    If (!saved) {
      Return clone(seed);
    }

    Const data = JSON.parse(saved);

    If (!Array.isArray(data.bookings)) {
      Data.bookings = [];
    }

    If (!Array.isArray(data.expenses)) {
      Data.expenses = [];
    }

    If (!Array.isArray(data.devices)) {
      Data.devices = clone(seed.devices);
    }

    Return data;

  } catch (error) {
    Console.error(error);
    Return clone(seed);
  }
}

Function save() {
  LocalStorage.setItem(
    DB_KEY,
    JSON.stringify(db)
  );
}


/* =====================================================
   أدوات عامة
===================================================== */

Function esc(text = '') {
  Return String(text).replace(
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

Function money(value) {
  Return new Intl.NumberFormat(
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

Function todayISO() {
  Const d = new Date();

  Return (
    D.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

Function getHijriParts(isoDate) {
  Try {
    Const date = new Date(
      IsoDate + 'T12:00:00'
    );

    Const formatter =
      new Intl.DateTimeFormat(
        'en-u-ca-islamic-umalqura',
        {
          Day: 'numeric',
          Month: 'numeric',
          Year: 'numeric',
          TimeZone: 'Asia/Riyadh'
        }
      );

    Const parts =
      formatter.formatToParts(date);

    Return {
      Day: Number(
        Parts.find(x => x.type === 'day')?.value
      ),
      Month: Number(
        Parts.find(x => x.type === 'month')?.value
      ),
      Year: Number(
        Parts.find(x => x.type === 'year')?.value
      )
    };

  } catch {
    Return {
      Day: 1,
      Month: 1,
      Year: 1448
    };
  }
}

Function currentHijri() {
  Return getHijriParts(todayISO());
}

Function hijriFull(isoDate) {
  Const h = getHijriParts(isoDate);

  Return (
    `${h.day} ` +
    `${HIJRI_MONTHS[h.month]} ` +
    `${h.year} هـ`
  );
}

Function dayName(isoDate) {
  Try {
    Return new Intl.DateTimeFormat(
      'ar-SA',
      {
        Weekday: 'long',
        TimeZone: 'Asia/Riyadh'
      }
    ).format(
      New Date(isoDate + 'T12:00:00')
    );

  } catch {
    Return '';
  }
}

Function hijriWithDay(isoDate) {
  Return (
    `${dayName(isoDate)}، ` +
    `${hijriFull(isoDate)}`
  );
}

Function hijriToGregorian(
  HijriYear,
  HijriMonth,
  HijriDay
) {
  HijriYear = Number(hijriYear);
  HijriMonth = Number(hijriMonth);
  HijriDay = Number(hijriDay);

  Const estimatedYear =
    Math.floor(
      HijriYear * 0.970224 +
      621.5774
    );

  Const start = new Date(
    EstimatedYear - 1,
    0,
    1,
    12,
    0,
    0
  );

  For (
    Let offset = 0;
    Offset < 900;
    Offset++
  ) {
    Const date = new Date(start);

    Date.setDate(
      Start.getDate() + offset
    );

    Const iso =
      `${date.getFullYear()}-` +
      `${String(date.getMonth() + 1).padStart(2, '0')}-` +
      `${String(date.getDate()).padStart(2, '0')}`;

    Const h = getHijriParts(iso);

    If (
      H.year === hijriYear &&
      H.month === hijriMonth &&
      H.day === hijriDay
    ) {
      Return iso;
    }
  }

  Return null;
}


/* =====================================================
   حقول التاريخ
===================================================== */

Function hijriDateFields(
  IsoDate = todayISO(),
  Prefix = 'date'
) {
  Const selected =
    GetHijriParts(isoDate);

  Const current =
    CurrentHijri();

  Let days = '';
  Let months = '';
  Let years = '';

  For (let day = 1; day <= 30; day++) {
    Days += `
      <option
        Value="${day}"
        ${day === selected.day ? 'selected' : ''}>
        ${day}
      </option>
    `;
  }

  For (
    Let month = 1;
    Month <= 12;
    Month++
  ) {
    Months += `
      <option
        Value="${month}"
        ${month === selected.month ? 'selected' : ''}>
        ${HIJRI_MONTHS[month]}
      </option>
    `;
  }

  For (
    Let year = 1446;
    Year <= current.year + 5;
    Year++
  ) {
    Years += `
      <option
        Value="${year}"
        ${year === selected.year ? 'selected' : ''}>
        ${year} هـ
      </option>
    `;
  }

  Return `
    <label>
      التاريخ الهجري

      <div class="hijri-selects">

        <select
          Name="${prefix}_day"
          Required>
          ${days}
        </select>

        <select
          Name="${prefix}_month"
          Required>
          ${months}
        </select>

        <select
          Name="${prefix}_year"
          Required>
          ${years}
        </select>

      </div>
    </label>
  `;
}


/* =====================================================
   الحسابات
===================================================== */

Function totals(
  Bookings = db.bookings,
  Expenses = db.expenses
) {
  Const revenue =
    Bookings.reduce(
      (sum, item) =>
        Sum +
        Number(item.agreed || 0),
      0
    );

  Const paid =
    Bookings.reduce(
      (sum, item) =>
        Sum +
        Number(item.paid || 0),
      0
    );

  Const expensesTotal =
    Expenses.reduce(
      (sum, item) =>
        Sum +
        Number(item.amount || 0),
      0
    );

  Return {
    Revenue,
    Paid,
    Remaining:
      Revenue - paid,
    Expenses:
      ExpensesTotal,
    Profit:
      Revenue - expensesTotal
  };
}

Function status(booking) {
  Const remaining =
    Number(booking.agreed || 0) -
    Number(booking.paid || 0);

  If (remaining <= 0) {
    Return [
      'مدفوعة بالكامل',
      'paid'
    ];
  }

  If (Number(booking.paid || 0) > 0) {
    Return [
      'مدفوعة جزئياً',
      'partial'
    ];
  }

  Return [
    'لم يتم الدفع',
    'unpaid'
  ];
}


/* =====================================================
   الرئيسية
===================================================== */

Function homeView() {
  Const t = totals();

  Const upcoming =
    [...db.bookings]
      .filter(
        B =>
          B.date >= todayISO()
      )
      .sort(
        (a, b) =>
          A.date.localeCompare(
            B.date
          )
      )
      .slice(0, 5);

  Return `

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
                X="3"
                Y="6"
                Width="18"
                Height="14"
                Rx="3"/>

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
          الإيرادات ناقص المصاريف
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
                Cx="12"
                Cy="12"
                R="9"/>

              <path d="M12 7V12L15 14"/>

            </svg>

          </span>

        </div>

        <span class="value gold">
          ${money(t.remaining)}
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
        Class="link-btn"
        Data-go="bookings">
        عرض الكل
      </button>

    </div>


    ${
      Upcoming.length

        ? Upcoming
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

Function bookingCard(booking) {
  Const [
    StatusText,
    StatusClass
  ] = status(booking);

  Const remaining =
    Math.max(
      0,
      Number(booking.agreed || 0) -
      Number(booking.paid || 0)
    );

  Return `

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
              Booking.phone
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
          Class="small-btn"
          Data-detail="${booking.id}">
          تفاصيل
        </button>

        <button
          Class="small-btn primary"
          Data-invoice="${booking.id}">
          عرض الفاتورة
        </button>

      </div>

    </article>
  `;
}


/* =====================================================
   البحث
===================================================== */

Function normalizePhone(value) {
  Return String(value || '')
    .replace(/[^\d٠-٩]/g, '');
}

Function normalizeSearch(value) {
  Return String(value || '')
    .trim()
    .toLowerCase();
}

Function getFilteredBookings() {
  Let bookings =
    [...db.bookings];

  Const today =
    TodayISO();

  If (
    BookingFilter ===
    'upcoming'
  ) {
    Bookings =
      Bookings.filter(
        Item =>
          Item.date >= today
      );
  }

  If (
    BookingFilter ===
    'past'
  ) {
    Bookings =
      Bookings.filter(
        Item =>
          Item.date < today
      );
  }

  Const search =
    NormalizeSearch(
      BookingSearch
    );

  Const phoneSearch =
    NormalizePhone(
      BookingSearch
    );

  If (search) {
    Bookings =
      Bookings.filter(
        Item => {

          Const name =
            NormalizeSearch(
              Item.name
            );

          Const phone =
            NormalizePhone(
              Item.phone
            );

          Return (
            Name.includes(search) ||
            (
              PhoneSearch &&
              Phone.includes(
                PhoneSearch
              )
            )
          );
        }
      );
  }

  Bookings.sort(
    (a, b) =>
      B.date.localeCompare(
        A.date
      )
  );

  Return bookings;
}


/* =====================================================
   صفحة الحجوزات
===================================================== */

Function bookingsView() {
  Const bookings =
    GetFilteredBookings();

  Const title =
    BookingFilter === 'upcoming'
      ? 'الحجوزات القادمة'
      : bookingFilter === 'past'
        ? 'الحجوزات السابقة'
        : 'جميع الحجوزات';

  Return `

    <div class="bookings-tools">

      <div class="booking-search-box">

        <span class="search-icon">

          <svg viewBox="0 0 24 24">

            <circle
              Cx="11"
              Cy="11"
              R="7"/>

            <path d="M20 20L16.5 16.5"/>

          </svg>

        </span>

        <input
          Id="bookingSearch"
          Type="text"
          Inputmode="search"
          Autocomplete="off"
          Autocorrect="off"
          Spellcheck="false"
          Enterkeyhint="search"
          Placeholder="بحث بالاسم أو رقم الجوال"
          Value="${esc(bookingSearch)}">

      </div>


      <div class="booking-filter-tabs">

        <button
          Data-booking-filter="all"
          Class="${
            BookingFilter === 'all'
              ? 'active'
              : ''
          }">
          الكل
        </button>

        <button
          Data-booking-filter="upcoming"
          Class="${
            BookingFilter === 'upcoming'
              ? 'active'
              : ''
          }">
          القادمة
        </button>

        <button
          Data-booking-filter="past"
          Class="${
            BookingFilter === 'past'
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
        Id="bookingCount"
        Class="count-badge">
        ${bookings.length}
      </span>

    </div>


    <div id="bookingResults">

      ${
        Bookings.length
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

Function refreshBookingResults() {
  Const bookings =
    GetFilteredBookings();

  Const list =
    $('#bookingResults');

  Const count =
    $('#bookingCount');

  If (list) {
    List.innerHTML =
      Bookings.length
        ? bookings
            .map(bookingCard)
            .join('')
        : `
          <div class="empty">
            لا توجد نتائج مطابقة
          </div>
        `;
  }

  If (count) {
    Count.textContent =
      Bookings.length;
  }

  BindBookingResultEvents();
}


/* =====================================================
   المصاريف
===================================================== */

Function expensesView() {
  Const expenses =
    [...db.expenses]
      .sort(
        (a, b) =>
          B.date.localeCompare(
            A.date
          )
      );

  Return `

    <div class="section-head">

      <h3>
        المصاريف
      </h3>

      <strong class="red">
        ${money(totals().expenses)}
      </strong>

    </div>


    ${
      Expenses.length

        ? expenses.map(
            Expense => `

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


                  <div
                    Style="
                      Display:flex;
                      Align-items:center;
                      Gap:16px;
                      Margin-top:7px;
                    ">

                    <button
                      Type="button"
                      Onclick="editExpense(${Number(expense.id)})"
                      Style="
                        Border:0;
                        Padding:2px 0;
                        Background:none;
                        Color:#25c16f;
                        Font-size:11px;
                        Cursor:pointer;
                      ">
                      تعديل
                    </button>


                    <button
                      Type="button"
                      Class="delete-mini"
                      Data-del-expense="${expense.id}">
                      حذف
                    </button>

                  </div>

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

Function getAvailableHijriYears() {
  Const current =
    CurrentHijri().year;

  Const years = [];

  For (
    Let year = 1446;
    Year <= current + 5;
    Year++
  ) {
    Years.push(year);
  }

  Return years;
}

Function filterByHijriPeriod(
  Items,
  Month = reportMonth,
  Year = reportYear
) {
  Return items.filter(
    Item => {

      Const h =
        GetHijriParts(
          Item.date
        );

      Const monthMatch =
        Month === 'all' ||
        H.month ===
        Number(month);

      Const yearMatch =
        Year === 'all' ||
        H.year ===
        Number(year);

      Return (
        MonthMatch &&
        YearMatch
      );
    }
  );
}

Function reportPeriodTitle() {
  If (
    ReportMonth === 'all' &&
    ReportYear === 'all'
  ) {
    Return 'جميع الأشهر وجميع السنوات';
  }

  If (
    ReportMonth === 'all'
  ) {
    Return `جميع أشهر سنة ${reportYear} هـ`;
  }

  If (
    ReportYear === 'all'
  ) {
    Return (
      `${HIJRI_MONTHS[Number(reportMonth)]}` +
      ' - جميع السنوات'
    );
  }

  Return (
    `${HIJRI_MONTHS[Number(reportMonth)]} ` +
    `${reportYear} هـ`
  );
}

Function monthlyBreakdownView() {
  If (
    ReportMonth !== 'all' ||
    ReportYear === 'all'
  ) {
    Return '';
  }

  Let html = `

    <div class="section-head">

      <h3>
        أشهر سنة ${reportYear} هـ
      </h3>

    </div>

    <div class="months-list">
  `;

  For (
    Let month = 1;
    Month <= 12;
    Month++
  ) {
    Const bookings =
      FilterByHijriPeriod(
        Db.bookings,
        String(month),
        reportYear
      );

    Const expenses =
      FilterByHijriPeriod(
        Db.expenses,
        String(month),
        reportYear
      );

    Const t =
      Totals(
        Bookings,
        Expenses
      );

    Html += `

      <button
        Class="month-report-card"
        Data-report-month="${month}">

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

  Html += `
    </div>
  `;

  Return html;
}

Function reportsView() {
  Const bookings =
    FilterByHijriPeriod(
      Db.bookings
    );

  Const expenses =
    FilterByHijriPeriod(
      Db.expenses
    );

  Const t =
    Totals(
      Bookings,
      Expenses
    );

  Const years =
    GetAvailableHijriYears();

  Return `

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
          Id="reportMonthFilter">

          <option
            Value="all"
            ${
              ReportMonth === 'all'
                ? 'selected'
                : ''
            }>
            جميع الأشهر
          </option>

          ${
            HIJRI_MONTHS
              .map(
                (month, index) => {

                  If (!index) {
                    Return '';
                  }

                  Return `
                    <option
                      Value="${index}"
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
          Id="reportYearFilter">

          <option
            Value="all"
            ${
              ReportYear === 'all'
                ? 'selected'
                : ''
            }>
            جميع السنوات
          </option>

          ${
            Years
              .map(
                Year => `
                  <option
                    Value="${year}"
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

Function devicesView() {
  Return `

    <div class="section-head">

      <h3>
        الأجهزة
      </h3>

    </div>

    ${
      Db.devices
        .map(
          Device => `

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

Function invoicesView() {
  Const bookings =
    [...db.bookings]
      .sort(
        (a, b) =>
          B.date.localeCompare(
            A.date
          )
      );

  Return `

    <div class="section-head">

      <h3>
        الفواتير
      </h3>

    </div>


    ${
      Bookings.length
        ? bookings.map(
            Booking => `

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
                  Class="small-btn primary"
                  Data-invoice="${booking.id}">
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

Function settingsView() {
  Return `

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
      Id="settingsExport"
      Class="submit-btn">
      تصدير نسخة احتياطية
    </button>
  `;
}


/* =====================================================
   العرض
===================================================== */

Function render() {
  Const titles = {
    Home: 'الرئيسية',
    Bookings: 'الحجوزات',
    Expenses: 'المصاريف',
    Reports: 'التقارير',
    Devices: 'الأجهزة',
    Invoices: 'الفواتير',
    Settings: 'الإعدادات'
  };

  Const pageTitle =
    $('#pageTitle');

  If (pageTitle) {
    PageTitle.textContent =
      Titles[currentPage] ||
      'الرئيسية';
  }

  $$('.nav-item')
    .forEach(
      Button => {
        Button.classList.toggle(
          'active',
          Button.dataset.page ===
          CurrentPage
        );
      }
    );

  Const views = {
    Home: homeView,
    Bookings: bookingsView,
    Expenses: expensesView,
    Reports: reportsView,
    Devices: devicesView,
    Invoices: invoicesView,
    Settings: settingsView
  };

  Const main =
    $('#mainContent');

  If (main) {
    Main.innerHTML =
      (
        Views[currentPage] ||
        homeView
      )();
  }

  BindViewEvents();
}

Function go(page) {
  CurrentPage = page;
  Render();
}


/* =====================================================
   أحداث الصفحة
===================================================== */

Function bindBookingResultEvents() {
  $$('[data-detail]')
    .forEach(
      Button => {
        Button.onclick =
          () =>
            showDetail(
              Number(
                Button.dataset.detail
              )
            );
      }
    );

  $$('[data-invoice]')
    .forEach(
      Button => {
        Button.onclick =
          () =>
            showInvoice(
              Number(
                Button.dataset.invoice
              )
            );
      }
    );
}

Function bindViewEvents() {
  $$('[data-go]')
    .forEach(
      Button => {
        Button.onclick =
          () =>
            go(
              Button.dataset.go
            );
      }
    );

  BindBookingResultEvents();

  $$('[data-del-expense]')
    .forEach(
      Button => {
        Button.onclick =
          () =>
            deleteExpense(
              Number(
                Button.dataset.delExpense
              )
            );
      }
    );

  Const searchInput = $('#bookingSearch');

  If (searchInput) {
    SearchInput.addEventListener(
      'input',
      Event => {

        BookingSearch =
          Event.target.value;

        RefreshBookingResults();
      }
    );
  }

  $$('[data-booking-filter]')
    .forEach(
      Button => {
        Button.onclick =
          () => {
            BookingFilter =
              Button.dataset.bookingFilter;

            Render();
          };
      }
    );

  Const monthFilter =
    $('#reportMonthFilter');

  If (monthFilter) {
    MonthFilter.onchange =
      Event => {
        ReportMonth =
          Event.target.value;

        Render();
      };
  }

  Const yearFilter =
    $('#reportYearFilter');

  If (yearFilter) {
    YearFilter.onchange =
      Event => {
        ReportYear =
          Event.target.value;

        Render();
      };
  }

  $$('[data-report-month]')
    .forEach(
      Button => {
        Button.onclick =
          () => {
            ReportMonth =
              Button.dataset.reportMonth;

            Render();
          };
      }
    );

  Const settingsExport =
    $('#settingsExport');

  If (settingsExport) {
    SettingsExport.onclick =
      exportData;
  }
}


/* =====================================================
   النوافذ
===================================================== */

Function openModal(
  Title,
  Content
) {
  If ($('#modalTitle')) {
    $('#modalTitle').textContent =
      Title;
  }

  If ($('#modalBody')) {
    $('#modalBody').innerHTML =
      Content;
  }

  $('#modalBackdrop')
    ?.classList
    .remove('hidden');

  $('#modal')
    ?.classList
    .remove('hidden');
}

Function closeModal() {
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

Function showDetail(id) {
  Const booking =
    Db.bookings.find(
      Item =>
        Number(item.id) ===
        Number(id)
    );

  If (!booking) {
    Return;
  }

  Const remaining =
    Math.max(
      0,
      Number(booking.agreed || 0) -
      Number(booking.paid || 0)
    );

  OpenModal(
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
          Id="detailInvoice"
          Class="small-btn primary">
          عرض الفاتورة
        </button>

        <button
          Id="editBooking"
          Class="small-btn">
          تعديل
        </button>

      </div>


      <button
        Id="deleteBooking"
        Class="delete-full">
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
      If (
        Confirm(
          'هل تريد حذف الحجز؟'
        )
      ) {
        Db.bookings =
          Db.bookings.filter(
            Item =>
              Number(item.id) !==
              Number(id)
          );

        Save();
        CloseModal();
        Render();

        Toast(
          'تم حذف الحجز'
        );
      }
    };
}


/* =====================================================
   نموذج الحجز
===================================================== */

Function openBookingForm(
  Existing = null
) {
  Const booking =
    Existing || {
      Name: '',
      Phone: '',
      EventType: '',
      Device: '',
      Location: '',
      Date: todayISO(),
      Agreed: '',
      Paid: '',
      Notes: ''
    };

  OpenModal(
    Existing
      ? 'تعديل الحجز'
      : 'حجز جديد',

    `

      <form
        Id="bookingForm"
        Class="form-grid">

        <label>
          اسم العميل

          <input
            Name="name"
            Required
            Value="${esc(booking.name)}">
        </label>


        <label>
          رقم الجوال

          <input
            Name="phone"
            Type="tel"
            Inputmode="numeric"
            Autocomplete="tel"
            Value="${esc(booking.phone || '')}"
            Placeholder="05xxxxxxxx">
        </label>


        <label>
          نوع المناسبة

          <input
            Name="eventType"
            Value="${esc(booking.eventType || '')}"
            Placeholder="مثال: زواج">
        </label>


        <label>
          نوع الأجهزة / الباقة

          <input
            Name="device"
            Required
            Value="${esc(booking.device || '')}"
            Placeholder="مثال: سماعتين + ميكسر">
        </label>


        <label>
          الموقع

          <input
            Name="location"
            Required
            Value="${esc(booking.location || '')}"
            Placeholder="مثال: أبها - حي العرين">
        </label>


        ${hijriDateFields(
          Booking.date,
          'booking'
        )}


        <div class="form-row">

          <label>
            المبلغ المتفق عليه

            <input
              Name="agreed"
              Type="number"
              Inputmode="decimal"
              Min="0"
              Required
              Value="${booking.agreed}">
          </label>

          <label>
            الواصل

            <input
              Name="paid"
              Type="number"
              Inputmode="decimal"
              Min="0"
              Value="${booking.paid}">
          </label>

        </div>


        <label>
          ملاحظات

          <textarea
            Name="notes"
            Placeholder="ملاحظات اختيارية">${esc(booking.notes || '')}</textarea>
        </label>


        <button
          Class="submit-btn"
          Type="submit">

          ${
            Existing
              ? 'حفظ التعديلات'
              : 'حفظ الحجز'
          }

        </button>

      </form>
    `
  );

  $('#bookingForm').onsubmit =
    Event => {
      Event.preventDefault();

      Const formData =
        Object.fromEntries(
          New FormData(
            Event.currentTarget
          ).entries()
        );

      Const date =
        HijriToGregorian(
          FormData.booking_year,
          FormData.booking_month,
          FormData.booking_day
        );

      If (!date) {
        Alert(
          'التاريخ الهجري غير صحيح'
        );
        Return;
      }

      Delete formData.booking_day;
      Delete formData.booking_month;
      Delete formData.booking_year;

      FormData.date = date;

      FormData.agreed =
        Number(
          FormData.agreed || 0
        );

      FormData.paid =
        Number(
          FormData.paid || 0
        );

      If (existing) {
        Object.assign(
          Existing,
          formData
        );
      } else {
        FormData.id =
          Date.now();

        Db.bookings.push(
          formData
        );
      }

      Save();
      CloseModal();
      Render();

      Toast(
        Existing
          ? 'تم تحديث الحجز'
          : 'تم حفظ الحجز'
      );
    };
}


/* =====================================================
   إضافة / تعديل المصروف
===================================================== */

Function openExpenseForm(existing = null) {
  Const isEdit = Boolean(existing);
  Const expense = existing || {
    Item: '',
    Amount: '',
    Date: todayISO()
  };

  OpenModal(
    IsEdit ? 'تعديل المصروف' : 'إضافة مصروف',
    `
      <form id="expenseForm" class="form-grid">
        <label>
          بند المصروف
          <input name="item" required value="${esc(expense.item || '')}">
        </label>

        <label>
          المبلغ
          <input name="amount" type="number" inputmode="decimal" min="0" required value="${esc(expense.amount || '')}">
        </label>

        ${hijriDateFields(expense.date || todayISO(), 'expense')}

        <button class="submit-btn" type="submit">
          ${IsEdit ? 'حفظ التعديلات' : 'حفظ المصروف'}
        </button>
      </form>
    `
  );

  Const form = $('#expenseForm');
  If (!form) return;

  Form.onsubmit = event => {
    Event.preventDefault();

    Const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    Const date = hijriToGregorian(data.expense_year, data.expense_month, data.expense_day);

    If (!date) {
      Alert('التاريخ الهجري غير صحيح');
      Return;
    }

    Const item = String(data.item || '').trim();
    Const amount = Number(data.amount || 0);

    If (!item) {
      Alert('يرجى كتابة بند المصروف');
      Return;
    }

    If (!Number.isFinite(amount) || amount < 0) {
      Alert('المبلغ غير صحيح');
      Return;
    }

    If (isEdit) {
      Existing.item = item;
      Existing.amount = amount;
      Existing.date = date;
    } else {
      Db.expenses.push({
        Id: Date.now(),
        Item,
        Amount,
        Date
      });
    }

    Save();
    CloseModal();
    Render();
    Toast(isEdit ? 'تم تعديل المصروف' : 'تم حفظ المصروف');
  };
}

Function editExpense(id) {
  Const expense = db.expenses.find(item => Number(item.id) === Number(id));
  If (!expense) {
    Alert('لم يتم العثور على المصروف');
    Return;
  }
  OpenExpenseForm(expense);
}

Function deleteExpense(id) {
  If (!confirm('هل تريد حذف المصروف؟')) {
    Return;
  }
  Db.expenses = db.expenses.filter(item => Number(item.id) !== Number(id));
  Save();
  Render();
  Toast('تم حذف المصروف');
}


/* =====================================================
   المبلغ بالحروف
===================================================== */

Function numberToArabicWords(number) {
  Number =
    Math.floor(
      Number(number || 0)
    );

  If (number === 0) {
    Return 'صفر';
  }

  Const ones = [
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

  Const tens = [
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

  Const hundreds = [
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

  Function under1000(n) {
    Const parts = [];

    If (n >= 100) {
      Parts.push(
        Hundreds[
          Math.floor(n / 100)
        ]
      );

      N %= 100;
    }

    If (n > 0) {
      If (n < 20) {
        Parts.push(
          Ones[n]
        );
      } else {
        Const unit =
          N % 10;

        Const ten =
          Math.floor(n / 10);

        If (unit) {
          Parts.push(
            `${ones[unit]} و${tens[ten]}`
          );
        } else {
          Parts.push(
            Tens[ten]
          );
        }
      }
    }

    Return parts.join(' و');
  }

  Const parts = [];

  If (number >= 1000000) {
    Const millions =
      Math.floor(
        Number / 1000000
      );

    Parts.push(
      `${under1000(millions)} مليون`
    );

    Number %=
      1000000;
  }

  If (number >= 1000) {
    Const thousands =
      Math.floor(
        Number / 1000
      );

    If (thousands === 1) {
      Parts.push('ألف');
    } else if (thousands === 2) {
      Parts.push('ألفان');
    } else {
      Parts.push(
        `${under1000(thousands)} ألف`
      );
    }

    Number %= 1000;
  }

  If (number > 0) {
    Parts.push(
      Under1000(number)
    );
  }

  Return parts.join(' و');
}

Function amountInWords(amount) {
  Const value =
    Math.floor(
      Number(amount || 0)
    );

  Return (
    `${numberToArabicWords(value)} ` +
    `ريال سعودي فقط لا غير`
  );
}


/* =====================================================
   الفاتورة الجديدة
===================================================== */

Function showInvoice(id) {
  Const booking =
    Db.bookings.find(
      Item =>
        Number(item.id) ===
        Number(id)
    );

  If (!booking) {
    Return;
  }

  Const agreed =
    Number(
      Booking.agreed || 0
    );

  Const paid =
    Number(
      Booking.paid || 0
    );

  Const remaining =
    Math.max(
      0,
      Agreed - paid
    );

  Const invoiceNumber =
    'INV-' +
    String(
      Booking.id
    ).slice(-8);

  OpenModal(
    '',
    `

    <div class="invoice-preview-scroll">

      <div
        Id="invoicePaper"
        Class="invoice-a4">


        <div class="invoice-frame">


          <!-- تموجات الصوت -->

          <div class="sound-wave wave-left">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>


          <div class="sound-wave wave-right">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>


          <!-- الشعار -->

          <header class="invoice-header">

            <img
              Src="invoice_logo.png"
              Class="invoice-logo"
              Alt="Winter Camp">


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


          <!-- معلومات الفاتورة -->

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
                ${hijriFull(booking.date)}
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
                ${dayName(booking.date)}
              </b>

            </div>

          </section>


          <!-- بيانات العميل -->

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
                  ${esc(booking.name)}
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
                  Class="customer-phone"
                  Dir="ltr">

                  ${esc(
                    Booking.phone || '-'
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
                  ${esc(booking.location)}
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
                    Booking.eventType || '-'
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
                    Booking.notes ||
                    'شكراً لثقتكم بنا'
                  )}
                </b>

              </div>

            </div>

          </section>


          <!-- جدول الصنف -->

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
                    ${esc(booking.device)}
                  </strong>
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


          <!-- أسفل الفاتورة -->

          <section class="invoice-lower">


            <!-- المبلغ بالحروف والختم -->

            <div class="invoice-words-side">

              <strong class="amount-words-label">
                المبلغ بالحروف :
              </strong>


              <div class="amount-words-box">

                ${amountInWords(agreed)}

              </div>


              <div class="stamp-holder">

                <img
                  Src="stamp.png?v=60"
                  Class="invoice-full-stamp"
                  Alt="ختم Winter Camp">

              </div>

            </div>


            <!-- الحسابات -->

            <div class="invoice-totals">


              <div class="total-row">

                <span>
                  المبلغ المتفق عليه
                </span>

                <strong>
                  ${money(agreed)}
                </strong>

              </div>


              <div class="total-row">

                <span>
                  الواصل
                </span>

                <strong>
                  ${money(paid)}
                </strong>

              </div>


              <div class="total-row">

                <span>
                  المتبقي
                </span>

                <strong class="remaining-number">
                  ${money(remaining)}
                </strong>

              </div>


              <div class="total-row grand-total">

                <span>
                  الإجمالي
                </span>

                <strong>
                  ${money(agreed)}
                </strong>

              </div>

            </div>

          </section>


          <!-- أسفل الصفحة -->

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
        Id="shareInvoice"
        Class="invoice-share-btn">

        مشاركة PDF

      </button>


      <button
        Id="printInvoice">

        طباعة

      </button>


      <button
        Id="closeInvoice">

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
   PDF
===================================================== */

Function loadExternalScript(url) {
  Return new Promise(
    (resolve, reject) => {

      Const existing =
        [...document.scripts]
          .find(
            Script =>
              Script.src === url
          );

      If (existing) {
        Resolve();
        Return;
      }

      Const script =
        Document.createElement(
          'script'
        );

      Script.src = url;

      Script.onload =
        Resolve;

      Script.onerror =
        Reject;

      Document.head.appendChild(
        script
      );
    }
  );
}

Async function ensurePDFLibraries() {
  If (!window.html2canvas) {
    Await loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    );
  }

  If (!window.jspdf) {
    Await loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    );
  }
}

Async function waitForImages(element) {
  Const images =
    [
      ...element.querySelectorAll(
        'img'
      )
    ];

  Await Promise.all(
    Images.map(
      Image => {

        If (
          Image.complete &&
          Image.naturalWidth > 0
        ) {
          Return Promise.resolve();
        }

        Return new Promise(
          Resolve => {

            Image.onload =
              Resolve;

            Image.onerror =
              Resolve;
          }
        );
      }
    )
  );
}

Async function shareInvoicePDF(booking) {
  Const paper =
    $('#invoicePaper');

  Const button =
    $('#shareInvoice');

  If (!paper) {
    Return;
  }

  Const oldButtonText =
    Button
      ? button.textContent
      : 'مشاركة PDF';

  Let exportContainer = null;

  Try {
    If (button) {
      Button.disabled = true;

      Button.textContent =
        'جاري تجهيز الفاتورة...';
    }

    Toast(
      'جاري تجهيز الفاتورة PDF'
    );

    Await ensurePDFLibraries();
    Await waitForImages(
      paper
    );

    ExportContainer =
      Document.createElement(
        'div'
      );

    ExportContainer.style.position =
      'fixed';

    ExportContainer.style.left =
      '-10000px';

    ExportContainer.style.top =
      '0';

    ExportContainer.style.width =
      '794px';

    ExportContainer.style.height =
      '1123px';

    ExportContainer.style.background =
      '#ffffff';

    ExportContainer.style.zIndex =
      '-9999';

    ExportContainer.style.overflow =
      'hidden';

    Const exportPaper =
      Paper.cloneNode(
        true
      );

    ExportPaper.removeAttribute(
      'id'
    );

    ExportPaper.style.setProperty(
      'width',
      '794px',
      'important'
    );

    ExportPaper.style.setProperty(
      'height',
      '1123px',
      'important'
    );

    ExportPaper.style.setProperty(
      'min-width',
      '794px',
      'important'
    );

    ExportPaper.style.setProperty(
      'min-height',
      '1123px',
      'important'
    );

    ExportPaper.style.setProperty(
      'max-width',
      '794px',
      'important'
    );

    ExportPaper.style.setProperty(
      'max-height',
      '1123px',
      'important'
    );

    ExportPaper.style.setProperty(
      'margin',
      '0',
      'important'
    );

    ExportPaper.style.setProperty(
      'padding',
      '0',
      'important'
    );

    ExportPaper.style.setProperty(
      'transform',
      'none',
      'important'
    );

    ExportPaper.style.setProperty(
      'transform-origin',
      'top left',
      'important'
    );

    ExportPaper.style.setProperty(
      'position',
      'relative',
      'important'
    );

    ExportPaper.style.setProperty(
      'overflow',
      'hidden',
      'important'
    );

    ExportPaper.style.setProperty(
      'box-shadow',
      'none',
      'important'
    );

    ExportContainer.appendChild(
      exportPaper
    );

    Document.body.appendChild(
      exportContainer
    );

    Await waitForImages(
      exportPaper
    );

    Await new Promise(
      Resolve =>
        setTimeout(
          Resolve,
          150
        )
    );

    Const canvas =
      Await window.html2canvas(
        ExportPaper,
        {
          Scale: 2,
          Width: 794,
          Height: 1123,
          WindowWidth: 794,
          WindowHeight: 1123,
          BackgroundColor:
            '#ffffff',
          UseCORS: true,
          AllowTaint: false,
          Logging: false,
          ScrollX: 0,
          ScrollY: 0,
          X: 0,
          Y: 0
        }
      );

    Const {
      JsPDF
    } =
      Window.jspdf;

    Const pdf =
      new jsPDF({
        Orientation:
          'portrait',
        Unit:
          'mm',
        Format:
          'a4',
        Compress:
          true
      });

    Pdf.addImage(
      Canvas.toDataURL(
        'image/jpeg',
        0.98
      ),
      'JPEG',
      0,
      0,
      210,
      297,
      Undefined,
      'FAST'
    );

    Const blob =
      Pdf.output(
        'blob'
      );

    Const invoiceNumber =
      String(
        Booking.id
      ).slice(-8);

    Const fileName =
      `WinterCamp-Invoice-${invoiceNumber}.pdf`;

    Const file =
      new File(
        [blob],
        FileName,
        {
          Type:
            'application/pdf'
        }
      );

    If (
      Navigator.share &&

      Navigator.canShare &&

      Navigator.canShare({
        Files: [file]
      })
    ) {
      Await navigator.share({
        Files:
          [file],
        Title:
          'فاتورة Winter Camp',
        Text:
          `فاتورة ${booking.name || ''}`
      });

      Return;
    }

    Const url =
      URL.createObjectURL(
        Blob
      );

    Const link =
      Document.createElement(
        'a'
      );

    Link.href =
      url;

    Link.download =
      FileName;

    Document.body.appendChild(
      link
    );

    Link.click();

    Link.remove();

    SetTimeout(
      () => {
        URL.revokeObjectURL(
          url
        );
      },
      2000
    );

    Toast(
      'تم تجهيز الفاتورة PDF'
    );

  } catch (error) {
    Console.error(
      'PDF Error:',
      error
    );

    Alert(
      'تعذر تجهيز الفاتورة PDF، حاول مرة أخرى.'
    );

  } finally {
    If (
      ExportContainer &&
      ExportContainer.parentNode
    ) {
      ExportContainer.parentNode
        .removeChild(
          exportContainer
        );
    }

    If (button) {
      Button.disabled =
        false;

      Button.textContent =
        oldButtonText;
    }
  }
}


/* =====================================================
   النسخة الاحتياطية
===================================================== */

Function exportData() {
  Const blob =
    new Blob(
      [
        JSON.stringify(
          Db,
          Null,
          2
        )
      ],
      {
        Type:
          'application/json'
      }
    );

  Const url =
    URL.createObjectURL(
      Blob
    );

  Const link =
    Document.createElement(
      'a'
    );

  Link.href = url;

  Link.download =
    'wintercamp-backup.json';

  Document.body.appendChild(
    link
  );

  Link.click();

  Link.remove();

  SetTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    1000
  );

  Toast(
    'تم تجهيز النسخة الاحتياطية'
  );
}


/* =====================================================
   إشعار
===================================================== */

Function toast(message) {
  Const element =
    $('#toast');

  If (!element) {
    Return;
  }

  Element.textContent =
    message;

  Element.classList.remove(
    'hidden'
  );

  SetTimeout(
    () => {
      Element.classList.add(
        'hidden'
      );
    },
    1800
  );
}


/* =====================================================
   القائمة
===================================================== */

Function toggleMenu(show) {
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
    Button => {
      Button.onclick =
        () =>
          go(
            Button.dataset.page
          );
    }
  );

If ($('#fabBtn')) {
  $('#fabBtn').onclick =
    () => {
      If (
        CurrentPage ===
        'expenses'
      ) {
        OpenExpenseForm();
      } else {
        OpenBookingForm();
      }
    };
}

If ($('#menuBtn')) {
  $('#menuBtn').onclick =
    () =>
      toggleMenu(true);
}

If ($('#closeMenu')) {
  $('#closeMenu').onclick =
    () =>
      toggleMenu(false);
}

If ($('#sheetBackdrop')) {
  $('#sheetBackdrop').onclick =
    () =>
      toggleMenu(false);
}

$$('[data-sheet-page]')
  .forEach(
    Button => {
      Button.onclick =
        () => {
          ToggleMenu(false);

          Go(
            Button.dataset.sheetPage
          );
        };
    }
  );

If ($('#modalClose')) {
  $('#modalClose').onclick =
    closeModal;
}

If ($('#modalBackdrop')) {
  $('#modalBackdrop').onclick =
    closeModal;
}

If ($('#exportBtn')) {
  $('#exportBtn').onclick =
    exportData;
}

If ($('#backupBtn')) {
  $('#backupBtn').onclick =
    exportData;
}


/* =====================================================
   استيراد نسخة احتياطية
===================================================== */

If ($('#importInput')) {
  $('#importInput').onchange =
    Async event => {
      Const file =
        Event.target.files[0];

      If (!file) {
        Return;
      }

      Try {
        Const imported =
          JSON.parse(
            Await file.text()
          );

        If (
          !Array.isArray(
            Imported.bookings
          ) ||
          !Array.isArray(
            Imported.expenses
          )
        ) {
          Throw new Error();
        }

        If (
          !Array.isArray(
            Imported.devices
          )
        ) {
          Imported.devices =
            Clone(seed.devices);
        }

        Db =
          imported;

        Save();

        Render();

        ToggleMenu(
          false
        );

        Toast(
          'تم استيراد البيانات'
        );

      } catch {
        Alert(
          'ملف النسخة الاحتياطية غير صالح'
        );
      }
    };
}


/* =====================================================
   تاريخ اليوم في الأعلى
===================================================== */

If ($('#hijriToday')) {
  $('#hijriToday').textContent =
    hijriWithDay(
      todayISO()
    );
}


/* =====================================================
   Service Worker
===================================================== */

If (
  'serviceWorker' in navigator
) {
  Window.addEventListener(
    'load',
    () => {
      Navigator.serviceWorker
        .register(
          './sw.js?v=60'
        )
        .catch(
          Console.error
        );
    }
  );
}


/* =====================================================
   تشغيل البرنامج الأول
===================================================== */
Render();
