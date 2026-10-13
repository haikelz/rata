self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((key) => /^rata-\d+$/.test(key)).map((key) => caches.delete(key)))
		)
	);
});
