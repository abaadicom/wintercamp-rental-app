/* ================================
   Winter Camp - Modern SVG Icons
================================ */

const WC_ICONS = {
  home: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5"/>
      <path d="M5 9.8V21h14V9.8"/>
      <path d="M9 21v-7h6v7"/>
    </svg>`,

  bookings: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M16 3v4M8 3v4M3 10h18"/>
      <path d="m9 15 2 2 4-4"/>
    </svg>`,

  expenses: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="6" width="18" height="14" rx="2"/>
      <path d="M3 10h18"/>
      <path d="M7 15h3"/>
    </svg>`,

  reports: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V10"/>
      <path d="M10 20V4"/>
      <path d="M16 20v-7"/>
      <path d="M22 20H2"/>
    </svg>`,

  devices: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="3" width="12" height="18" rx="2"/>
      <circle cx="12" cy="15" r="3"/>
      <circle cx="12" cy="8" r="1"/>
    </svg>`,

  invoices: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h9l4 4v16H6z"/>
      <path d="M14 2v5h5"/>
      <path d="M9 12h6M9 16h6"/>
    </svg>`,

  settings: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>
    </svg>`,

  backup: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12"/>
      <path d="m7 10 5 5 5-5"/>
      <path d="M5 21h14"/>
    </svg>`,

  plus: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14"/>
    </svg>`
};

function wcAddIcon(el, iconName) {
  if (!el || !WC_ICONS[iconName]) return;

  const oldIcon = el.querySelector(".wc-svg-icon");
  if (oldIcon) oldIcon.remove();

  const holder = document.createElement("span");
  holder.className = "wc-svg-icon";
  holder.innerHTML = WC_ICONS[iconName];

  el.prepend(holder);
}

function wcInstallIcons() {

  /* القائمة السفلية */
  wcAddIcon(
    document.querySelector('[data-page="home"]'),
    "home"
  );

  wcAddIcon(
    document.querySelector('[data-page="bookings"]'),
    "bookings"
  );

  wcAddIcon(
    document.querySelector('[data-page="expenses"]'),
    "expenses"
  );

  wcAddIcon(
    document.querySelector('[data-page="reports"]'),
    "reports"
  );

  /* القائمة الجانبية */
  wcAddIcon(
    document.querySelector('[data-sheet-page="devices"]'),
    "devices"
  );

  wcAddIcon(
    document.querySelector('[data-sheet-page="invoices"]'),
    "invoices"
  );

  wcAddIcon(
    document.querySelector('[data-sheet-page="settings"]'),
    "settings"
  );

  wcAddIcon(
    document.querySelector('#exportBtn'),
    "backup"
  );

  /* زر الإضافة الأخضر */
  const fab = document.querySelector('#fabBtn');

  if (fab) {
    fab.innerHTML = `
      <span class="wc-svg-icon wc-plus-icon">
        ${WC_ICONS.plus}
      </span>
    `;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wcInstallIcons);
} else {
  wcInstallIcons();
}
