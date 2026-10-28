const CACHE_NAME =
  'wintercamp-v136';

const APP_FILES = [
  './',
  './index.html',
  './styles.css?v=136',
  './contract-print.css?v=136',
  './app.js?v=136',
  './contracts.js?v=136',
  './contract-pdf.js?v=136',
  './remote.js?v=136',
  './sign.html',
  './sign.js?v=136',
  './wk-public-config.json'
];

self.addEventListener(
  'install',
  event => {

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(
          cache =>
            cache.addAll(
              APP_FILES
            )
        )
    );

    self.skipWaiting();
  }
);


self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(
          keys =>
            Promise.all(

              keys
                .filter(
                  key =>
                    key !==
                    CACHE_NAME
                )
                .map(
                  key =>
                    caches.delete(
                      key
                    )
                )

            )
        )

    );

    self.clients.claim();
  }
);


self.addEventListener(
  'fetch',
  event => {

    if (
      event.request.method !==
      'GET'
    ) {
      return;
    }

    event.respondWith(

      fetch(
        event.request
      )

        .then(
          response => {

            const copy =
              response.clone();

            caches
              .open(
                CACHE_NAME
              )
              .then(
                cache =>
                  cache.put(
                    event.request,
                    copy
                  )
              );

            return response;
          }
        )

        .catch(
          () =>
            caches.match(
              event.request
            )
        )

    );
  }
);
