const CACHE_NAME =
  'wintercamp-v124';

const APP_FILES = [
  './',
  './index.html',
  './styles.css?v=124',
  './app.js?v=124',
  './contracts.js?v=124',
  './remote.js?v=124',
  './sign.html',
  './sign.js?v=124',
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
