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
  bookings: [
    {
      id: 1001,
      name: 'أحمد الشهري',
      phone: '0555123456',
      device: '2 سماعات',
      location: 'أبها - حي العرين',
      date: '2026-08-08',
      agreed: 500,
      paid: 200,
      notes: ''
    },
    {
      id: 1002,
      name: 'محمد القحطاني',
      phone: '',
      device: 'سماعة بلوتوث',
      location: 'خميس مشيط',
      date: '2026-08-09',
      agreed: 300,
      paid: 300,
      notes: ''
    }
  ],

  expenses: [
    {
      id: 1,
      item: 'صيانة سماعات',
      amount: 300,
      date: '2026-08-03'
    },
    {
      id: 2,
      item: 'وقود',
      amount: 150,
      date: '2026-08-04'
    }
  ],

  devices: [
    { id: 1, name: 'RCF 715-A', qty: 2 },
    { id: 2, name: 'سماعة بلوتوث', qty: 1 },
    { id: 3, name: 'MG-12XU ميكسر', qty: 1 },
    { id: 4, name: 'ميكروفون', qty: 4 }
  ]
};

let db = load();
let currentPage = 'home';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function load() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    return saved ? JSON.parse(saved) : clone(seed);
  } catch {
    return clone(seed);
  }
}

function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function money(n) {
  return new Intl.NumberFormat('ar-SA').format(Number(n || 0)) + ' ر.س';
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;
}

/* ==============================
   التاريخ الهجري - أم القرى
================================ */

function getHijriParts(isoDate) {
  try {
    const date = new Date(isoDate + 'T12:00:00');

    const formatter = new Intl.DateTimeFormat(
      'en-u-ca-islamic-umalqura',
      {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Riyadh'
      }
    );

    const parts = formatter.formatToParts(date);

    const day = Number(
      parts.find(x => x.type === 'day')?.value
    );

    const month = Number(
      parts.find(x => x.type === 'month')?.value
    );

    const year = Number(
      parts.find(x => x.type === 'year')?.value
    );

    return {
      day,
      month,
      year
    };

  } catch {
    return {
      day: 1,
      month: 1,
      year: 1448
    };
  }
}

function hijriFull(isoDate) {
  const h = getHijriParts(isoDate);

  return `${h.day} ${HIJRI_MONTHS[h.month]} ${h.year} هـ`;
}

function hijriShort(isoDate) {
  const h = getHijriParts(isoDate);

  return `${h.day}/${h.month}/${h.year} هـ`;
}

function dayName(isoDate) {
  return new Intl.DateTimeFormat(
    'ar-SA',
    {
      weekday: 'long',
      timeZone: 'Asia/Riyadh'
    }
  ).format(
    new Date(isoDate + 'T12:00:00')
  );
}

function hijriWithDay(isoDate) {
  return `${dayName(isoDate)} ${hijriFull(isoDate)}`;
}

/*
  تحويل التاريخ الهجري إلى ميلادي داخلياً.
  المستخدم لن يرى التاريخ الميلادي.
*/

function hijriToGregorian(hYear, hMonth, hDay) {

  hYear = Number(hYear);
  hMonth = Number(hMonth);
  hDay = Number(hDay);

  const estimatedGregorianYear =
    Math.floor(
      hYear * 0.970224 + 621.5774
    );

  const start = new Date(
    estimatedGregorianYear - 1,
    0,
    1,
    12,
    0,
    0
  );

  for (let i = 0; i < 900; i++) {

    const d = new Date(start);

    d.setDate(
      start.getDate() + i
    );

    const iso =
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, '0')}-` +
      `${String(d.getDate()).padStart(2, '0')}`;

    const h = getHijriParts(iso);

    if (
      h.year === hYear &&
      h.month === hMonth &&
      h.day === hDay
    ) {
      return iso;
    }
  }

  return null;
}

function currentHijri() {
  return getHijriParts(todayISO());
}

function hijriMonthTitle(month, year) {
  return `${HIJRI_MONTHS[month]} ${year} هـ`;
}

/* ==============================
   حقول اختيار التاريخ الهجري
================================ */

function hijriDateFields(isoDate = todayISO(), prefix = 'date') {

  const selected = getHijriParts(isoDate);
  const current = currentHijri();

  let dayOptions = '';

  for (let d = 1; d <= 30; d++) {
    dayOptions += `
      <option
        value="${d}"
        ${d === selected.day ? 'selected' : ''}>
        ${d}
      </option>
    `;
  }

  let monthOptions = '';

  for (let m = 1; m <= 12; m++) {
    monthOptions += `
      <option
        value="${m}"
        ${m === selected.month ? 'selected' : ''}>
        ${HIJRI_MONTHS[m]}
      </option>
    `;
  }

  let yearOptions = '';

  for (
    let y = current.year - 2;
    y <= current.year + 5;
    y++
  ) {
    yearOptions += `
      <option
        value="${y}"
        ${y === selected.year ? 'selected' : ''}>
        ${y} هـ
      </option>
    `;
  }

  return `
    <label>
      التاريخ الهجري

      <div class="form-row hijri-date-row">

        <select name="${prefix}_day" required>
          ${dayOptions}
        </select>

        <select name="${prefix}_month" required>
          ${monthOptions}
        </select>

      </div>

      <select name="${prefix}_year" required>
        ${yearOptions}
      </select>

    </label>
  `;
}

/* ==============================
   العمليات المالية
================================ */

function totals(bookings = db.bookings, expenses = db.expenses) {

  const revenue = bookings.reduce(
    (sum, booking) =>
      sum + Number(booking.agreed || 0),
    0
  );

  const paid = bookings.reduce(
    (sum, booking) =>
      sum + Number(booking.paid || 0),
    0
  );

  const expenseTotal = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.amount || 0),
    0
  );

  return {
    revenue,
    paid,
    remaining: revenue - paid,
    expenses: expenseTotal,
    profit: revenue - expenseTotal
  };
}

function status(booking) {

  const remaining =
    Number(booking.agreed) -
    Number(booking.paid);

  if (remaining <= 0) {
    return [
      'مدفوعة بالكامل',
      'paid'
    ];
  }

  if (Number(booking.paid) > 0) {
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

/* ==============================
   عرض الصفحات
================================ */

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
    titles[currentPage] || 'الرئيسية';

  $$('.nav-item').forEach(button => {

    button.classList.toggle(
      'active',
      button.dataset.page === currentPage
    );

  });

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
    (views[currentPage] || homeView)();

  bindViewEvents();
}

function homeView() {

  const t = totals();

  const upcoming = [...db.bookings]
    .filter(
      booking =>
        booking.date >= todayISO()
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date)
    )
    .slice(0, 5);

  return `
    <section class="hero">

      <div>
        <h2>مرحباً بك 👋</h2>

        <p>
          ${hijriWithDay(todayISO())}
        </p>
      </div>

    </section>

    <div class="cards">

      <div class="stat-card">

        <span class="label">
          إجمالي الإيرادات
        </span>

        <span class="value green">
          ${money(t.revenue)}
        </span>

        <span class="unit">
          جميع الحجوزات
        </span>

      </div>

      <div class="stat-card">

        <span class="label">
          إجمالي المصاريف
        </span>

        <span class="value red">
          ${money(t.expenses)}
        </span>

        <span class="unit">
          المصاريف المسجلة
        </span>

      </div>

      <div class="stat-card">

        <span class="label">
          صافي الربح
        </span>

        <span class="value blue">
          ${money(t.profit)}
        </span>

        <span class="unit">
          الإيرادات - المصاريف
        </span>

      </div>

      <div class="stat-card">

        <span class="label">
          المبالغ المتبقية
        </span>

        <span class="value gold">
          ${money(t.remaining)}
        </span>

        <span class="unit">
          المطلوب تحصيلها
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
        ? upcoming.map(bookingCard).join('')
        : `
          <div class="empty">
            لا توجد حجوزات قادمة
          </div>
        `
    }
  `;
}

function bookingCard(booking) {

  const [statusText, statusClass] =
    status(booking);

  const remaining = Math.max(
    0,
    Number(booking.agreed) -
    Number(booking.paid)
  );

  return `
    <article class="booking-card">

      <div class="booking-top">

        <div>

          <div class="booking-name">
            ${esc(booking.name)}
          </div>

          <div class="booking-meta">

            ${esc(booking.device)}

            <br>

            📍 ${esc(booking.location)}

            <br>

            📅 ${hijriWithDay(booking.date)}

          </div>

          <span class="badge ${statusClass}">
            ${statusText}
          </span>

        </div>

        <div class="amount">

          ${money(booking.agreed)}

          <div class="booking-meta">

            المتبقي

            <span class="red">
              ${money(remaining)}
            </span>

          </div>

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

function bookingsView() {

  return `
    <div class="section-head">

      <h3>
        جميع الحجوزات
      </h3>

      <span>
        ${db.bookings.length} حجز
      </span>

    </div>

    ${
      db.bookings.length
        ? [...db.bookings]
            .sort(
              (a, b) =>
                b.date.localeCompare(a.date)
            )
            .map(bookingCard)
            .join('')
        : `
          <div class="empty">
            لم تسجل حجوزات بعد
          </div>
        `
    }
  `;
}

function expensesView() {

  return `
    <div class="section-head">

      <h3>
        المصاريف
      </h3>

      <span class="red">
        ${money(totals().expenses)}
      </span>

    </div>

    ${
      db.expenses.length
        ? [...db.expenses]
            .sort(
              (a, b) =>
                b.date.localeCompare(a.date)
            )
            .map(
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
                      class="icon-btn"
                      data-del-expense="${expense.id}">

                      ⋮

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

/* ==============================
   التقرير الشهري الهجري
================================ */

function reportsView() {

  const current = currentHijri();

  const monthlyBookings =
    db.bookings.filter(
      booking => {

        const h =
          getHijriParts(
            booking.date
          );

        return (
          h.year === current.year &&
          h.month === current.month
        );
      }
    );

  const monthlyExpenses =
    db.expenses.filter(
      expense => {

        const h =
          getHijriParts(
            expense.date
          );

        return (
          h.year === current.year &&
          h.month === current.month
        );
      }
    );

  const t = totals(
    monthlyBookings,
    monthlyExpenses
  );

  const max = Math.max(
    t.revenue,
    t.expenses,
    t.profit,
    t.remaining,
    1
  );

  return `
    <div class="section-head">

      <div>

        <h3>
          التقرير الشهري
        </h3>

        <div class="booking-meta">
          ${hijriMonthTitle(
            current.month,
            current.year
          )}
        </div>

      </div>

    </div>

    <div class="report-box">

      ${reportLine(
        'الإيرادات',
        t.revenue,
        max,
        'var(--green)'
      )}

      ${reportLine(
        'المصاريف',
        t.expenses,
        max,
        'var(--red)'
      )}

      ${reportLine(
        'صافي الربح',
        Math.max(0, t.profit),
        max,
        'var(--blue)'
      )}

      ${reportLine(
        'المتبقي',
        t.remaining,
        max,
        'var(--gold)'
      )}

    </div>

    <div class="section-head">
      <h3>
        ملخص الشهر
      </h3>
    </div>

    <div class="cards">

      <div class="stat-card">

        <span class="label">
          الحجوزات
        </span>

        <span class="value">
          ${monthlyBookings.length}
        </span>

      </div>

      <div class="stat-card">

        <span class="label">
          المصاريف
        </span>

        <span class="value">
          ${monthlyExpenses.length}
        </span>

      </div>

    </div>
  `;
}

function reportLine(
  title,
  value,
  max,
  color
) {

  return `
    <div class="bar-line">

      <span>
        ${title}
      </span>

      <div class="track">

        <div
          class="fill"
          style="
            width:${Math.max(0, value) / max * 100}%;
            background:${color};
          ">
        </div>

      </div>

      <b>
        ${money(value)}
      </b>

    </div>
  `;
}

function devicesView() {

  return `
    <div class="section-head">
      <h3>الأجهزة</h3>
    </div>

    ${
      db.devices.map(
        device => `
          <div class="device-card">

            <div class="booking-top">

              <strong>
                ${esc(device.name)}
              </strong>

              <span>
                ${device.qty} قطعة
              </span>

            </div>

          </div>
        `
      ).join('')
    }
  `;
}

function invoicesView() {

  return `
    <div class="section-head">
      <h3>الفواتير</h3>
    </div>

    ${
      db.bookings.length
        ? [...db.bookings]
            .sort(
              (a, b) =>
                b.date.localeCompare(a.date)
            )
            .map(
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
                      ${hijriWithDay(booking.date)}
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

function settingsView() {

  return `
    <div class="section-head">
      <h3>الإعدادات</h3>
    </div>

    <div class="device-card">

      <strong>
        نظام التاريخ
      </strong>

      <p class="booking-meta">
        التاريخ الهجري
        – تقويم أم القرى
      </p>

    </div>

    <div class="device-card">

      <strong>
        حفظ البيانات
      </strong>

      <p class="booking-meta">
        يتم حفظ البيانات
        داخل الجهاز.
      </p>

    </div>

    <button
      class="submit-btn"
      id="settingsExport">

      تصدير نسخة احتياطية

    </button>
  `;
}

/* ==============================
   الأحداث
================================ */

function bindViewEvents() {

  $$('[data-go]').forEach(
    button => {

      button.onclick =
        () => go(button.dataset.go);

    }
  );

  $$('[data-detail]').forEach(
    button => {

      button.onclick =
        () => showDetail(
          Number(
            button.dataset.detail
          )
        );

    }
  );

  $$('[data-invoice]').forEach(
    button => {

      button.onclick =
        () => showInvoice(
          Number(
            button.dataset.invoice
          )
        );

    }
  );

  $$('[data-del-expense]').forEach(
    button => {

      button.onclick =
        () => deleteExpense(
          Number(
            button.dataset.delExpense
          )
        );

    }
  );

  const exportButton =
    $('#settingsExport');

  if (exportButton) {
    exportButton.onclick =
      exportData;
  }
}

function go(page) {
  currentPage = page;
  render();
}

function esc(text = '') {

  return String(text).replace(
    /[&<>"']/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char])
  );
}

/* ==============================
   النوافذ
================================ */

function openModal(title, html) {

  $('#modalTitle').textContent =
    title;

  $('#modalBody').innerHTML =
    html;

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

function showDetail(id) {

  const booking =
    db.bookings.find(
      item => item.id === id
    );

  if (!booking) {
    return;
  }

  const remaining = Math.max(
    0,
    booking.agreed -
    booking.paid
  );

  openModal(
    'تفاصيل الحجز',
    `
      <div class="device-card">

        <p>
          <b>العميل:</b>
          ${esc(booking.name)}
        </p>

        <p>
          <b>الجهاز:</b>
          ${esc(booking.device)}
        </p>

        <p>
          <b>الموقع:</b>
          ${esc(booking.location)}
        </p>

        <p>
          <b>التاريخ:</b>
          ${hijriWithDay(booking.date)}
        </p>

        <p>
          <b>المتفق عليه:</b>
          <span class="green">
            ${money(booking.agreed)}
          </span>
        </p>

        <p>
          <b>الواصل:</b>
          <span class="blue">
            ${money(booking.paid)}
          </span>
        </p>

        <p>
          <b>المتبقي:</b>
          <span class="red">
            ${money(remaining)}
          </span>
        </p>

      </div>

      <div class="card-actions">

        <button
          class="small-btn primary"
          id="detailInvoice">
          عرض الفاتورة
        </button>

        <button
          class="small-btn"
          id="editBooking">
          تعديل
        </button>

        <button
          class="small-btn danger-btn"
          id="deleteBooking">
          حذف
        </button>

      </div>
    `
  );

  $('#detailInvoice').onclick =
    () => showInvoice(id);

  $('#editBooking').onclick =
    () => openBookingForm(
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

/* ==============================
   إضافة / تعديل حجز
================================ */

function openBookingForm(existing = null) {

  const booking =
    existing || {
      name: '',
      phone: '',
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
      : 'إضافة حجز',

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
          رقم التواصل

          <input
            name="phone"
            inputmode="tel"
            value="${esc(booking.phone)}">
        </label>

        <label>
          نوع الجهاز

          <select
            name="device"
            required>

            <option value="">
              اختر الجهاز
            </option>

            ${
              db.devices.map(
                device => `
                  <option
                    value="${esc(device.name)}"
                    ${
                      booking.device ===
                      device.name
                        ? 'selected'
                        : ''
                    }>

                    ${esc(device.name)}

                  </option>
                `
              ).join('')
            }

            <option
              value="2 سماعات"
              ${
                booking.device ===
                '2 سماعات'
                  ? 'selected'
                  : ''
              }>

              2 سماعات

            </option>

            <option
              value="باقة كاملة"
              ${
                booking.device ===
                'باقة كاملة'
                  ? 'selected'
                  : ''
              }>

              باقة كاملة

            </option>

          </select>

        </label>

        <label>
          الموقع

          <input
            name="location"
            required
            value="${esc(booking.location)}">

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

          <textarea name="notes">${esc(
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

  $('#bookingForm').onsubmit =
    event => {

      event.preventDefault();

      const form =
        new FormData(
          event.currentTarget
        );

      const obj =
        Object.fromEntries(
          form.entries()
        );

      const isoDate =
        hijriToGregorian(
          obj.booking_year,
          obj.booking_month,
          obj.booking_day
        );

      if (!isoDate) {

        alert(
          'التاريخ الهجري غير صحيح. تأكد من اليوم والشهر.'
        );

        return;
      }

      delete obj.booking_day;
      delete obj.booking_month;
      delete obj.booking_year;

      obj.date = isoDate;

      obj.agreed =
        Number(obj.agreed);

      obj.paid =
        Number(obj.paid || 0);

      if (existing) {

        Object.assign(
          existing,
          obj
        );

      } else {

        obj.id =
          Date.now();

        db.bookings.push(
          obj
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

/* ==============================
   إضافة مصروف بالتاريخ الهجري
================================ */

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
            placeholder="مثال: وقود">

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
          class="submit-btn">

          حفظ المصروف

        </button>

      </form>
    `
  );

  $('#expenseForm').onsubmit =
    event => {

      event.preventDefault();

      const obj =
        Object.fromEntries(
          new FormData(
            event.currentTarget
          ).entries()
        );

      const isoDate =
        hijriToGregorian(
          obj.expense_year,
          obj.expense_month,
          obj.expense_day
        );

      if (!isoDate) {

        alert(
          'التاريخ الهجري غير صحيح.'
        );

        return;
      }

      delete obj.expense_day;
      delete obj.expense_month;
      delete obj.expense_year;

      obj.date = isoDate;

      obj.id =
        Date.now();

      obj.amount =
        Number(obj.amount);

      db.expenses.push(obj);

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

/* ==============================
   الفاتورة
================================ */

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
      booking.agreed -
      booking.paid
    );

  openModal(
    'الفاتورة',
    `
      <div
        class="invoice-paper"
        id="invoicePaper">

        <div class="invoice-brand">

          <div>

            <h2 style="margin:0">
              فاتورة
            </h2>

            <small>

              رقم #
              ${String(booking.id).slice(-6)}

              <br>

              ${hijriWithDay(
                booking.date
              )}

            </small>

          </div>

          <img
            src="wintercamp_icon.png"
            alt="Winter Camp">

        </div>

        <p>
          <b>العميل:</b>
          ${esc(booking.name)}
        </p>

        <p>
          <b>الموقع:</b>
          ${esc(booking.location)}
        </p>

        <table>

          <thead>

            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>الإجمالي</th>
            </tr>

          </thead>

          <tbody>

            <tr>

              <td>
                ${esc(booking.device)}
              </td>

              <td>
                1
              </td>

              <td>
                ${money(
                  booking.agreed
                )}
              </td>

            </tr>

          </tbody>

        </table>

        <p>
          المبلغ المتفق عليه:
          <b>
            ${money(
              booking.agreed
            )}
          </b>
        </p>

        <p>
          الواصل:
          <b>
            ${money(
              booking.paid
            )}
          </b>
        </p>

        <p>
          المتبقي:
          <b>
            ${money(
              remaining
            )}
          </b>
        </p>

        <div class="invoice-total">

          <span>
            الإجمالي
          </span>

          <span>
            ${money(
              booking.agreed
            )}
          </span>

        </div>

        <p style="
          margin-bottom:0;
          font-size:12px;
        ">
          شكراً لتعاملكم معنا
        </p>

      </div>

      <div class="invoice-actions">

        <button id="printInvoice">
          طباعة
        </button>

        <button id="shareInvoice">
          مشاركة
        </button>

        <button id="closeInvoice">
          إغلاق
        </button>

      </div>
    `
  );

  $('#printInvoice').onclick =
    () => window.print();

  $('#shareInvoice').onclick =
    () => shareBooking(
      booking
    );

  $('#closeInvoice').onclick =
    closeModal;
}

function shareBooking(booking) {

  const remaining =
    Math.max(
      0,
      booking.agreed -
      booking.paid
    );

  const text =
`Winter Camp

العميل: ${booking.name}

التاريخ:
${hijriWithDay(booking.date)}

الإجمالي:
${money(booking.agreed)}

الواصل:
${money(booking.paid)}

المتبقي:
${money(remaining)}`;

  if (navigator.share) {

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

/* ==============================
   النسخة الاحتياطية
================================ */

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

function toggleMenu(show) {

  $('#sideSheet')
    .classList
    .toggle(
      'hidden',
      !show
    );

  $('#sheetBackdrop')
    .classList
    .toggle(
      'hidden',
      !show
    );
}

/* ==============================
   أزرار البرنامج
================================ */

$$('.nav-item').forEach(
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

$$('[data-sheet-page]').forEach(
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

$('#modalClose').onclick =
  closeModal;

$('#modalBackdrop').onclick =
  closeModal;

$('#exportBtn').onclick =
  exportData;

$('#backupBtn').onclick =
  exportData;

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
        !imported.bookings ||
        !imported.expenses
      ) {

        throw new Error();
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

/* تاريخ اليوم الهجري */

if ($('#hijriToday')) {

  $('#hijriToday').textContent =
    hijriWithDay(
      todayISO()
    );
}

/* PWA */

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
          './sw.js?v=10'
        )
        .catch(
          console.error
        );

    }
  );
}

render();
