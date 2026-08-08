const CACHE_NAME = 'wintercamp-v10';

const APP_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './wintercamp_icon.png'
];


/* =========================
   تثبيت النسخة الجديدة
========================= */

self.addEventListener('install', event => {

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
  );

  self.skipWaiting();

});


/* =========================
   حذف النسخ القديمة
========================= */

self.addEventListener('activate', event => {

  event.waitUntil(

    caches
      .keys()
      .then(keys =>

        Promise.all(

          keys
            .filter(
              key => key !== CACHE_NAME
            )
            .map(
              key => caches.delete(key)
            )

        )

      )

  );

  self.clients.claim();

});


/* =========================
   تحميل الملفات
========================= */

self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(

    fetch(event.request)

      .then(response => {

        const copy = response.clone();

        caches
          .open(CACHE_NAME)
          .then(cache => {

            cache.put(
              event.request,
              copy
            );

          });

        return response;

      })

      .catch(() =>

        caches.match(event.request)

      )

  );

});
