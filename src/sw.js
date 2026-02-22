const CACHE_VERSION = 'mycamera-v3';
const APP_SHELL_FILES = [
	'./',
	'./index.html',
	'./sw.js',
	'./public/manifest.webmanifest',
	'./public/browserconfig.xml',
	'./style/style.css',
	'./style/base.css',
	'./style/camera.css',
	'./style/controls.css',
	'./style/modal.css',
	'./style/toast.css',
	'./script/script.js',
	'./script/main.js',
	'./script/camera.js',
	'./script/capture.js',
	'./script/config.js',
	'./script/dom.js',
	'./script/selection.js',
	'./script/settings.js',
	'./script/state.js',
	'./script/toast.js',
	'./script/zoom.js',
	'./public/icon/favicon.ico',
	'./public/icon/favicon-16x16.png',
	'./public/icon/favicon-32x32.png',
	'./public/icon/icon.svg',
	'./public/icon/apple-touch-icon.png',
	'./public/icon/mstile-150x150.png',
	'./public/icon/icon-192.png',
	'./public/icon/icon-256.png',
	'./public/icon/icon-512.png',
	'./public/icon/icon-512-maskable.png',
	'./public/img/settings.svg',
	'./public/img/switch-camera.svg'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL_FILES))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys
					.filter((key) => key !== CACHE_VERSION)
					.map((key) => caches.delete(key))
			)
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') {
		return;
	}

	const requestUrl = new URL(event.request.url);
	if (requestUrl.origin !== self.location.origin) {
		return;
	}

	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request)
				.then((networkResponse) => {
					const responseClone = networkResponse.clone();
					caches.open(CACHE_VERSION).then((cache) => {
						cache.put('./index.html', responseClone);
					});
					return networkResponse;
				})
				.catch(() => caches.match('./index.html'))
		);
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(event.request)
				.then((networkResponse) => {
					if (networkResponse && networkResponse.status === 200) {
						const responseClone = networkResponse.clone();
						caches.open(CACHE_VERSION).then((cache) => {
							cache.put(event.request, responseClone);
						});
					}

					return networkResponse;
				})
				.catch(() => new Response('Offline', { status: 503, statusText: 'Offline' }));
		})
	);
});
