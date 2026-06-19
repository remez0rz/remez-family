// Service Worker for Remez Family App — Push Notifications
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  if (!e.data) return
  const data = e.data.json()
  const opts = {
    body: data.body,
    // Color logo in the notification; callers may override with e.g. a child's avatar.
    icon: data.icon || '/icon-192.png',
    // Monochrome status-bar icon (Android masks it white) — must be a silhouette.
    badge: '/badge-96.png',
    tag: data.tag || 'remez',
    data: { url: data.url || '/' },
    dir: 'rtl',
    lang: 'he',
    vibrate: [80, 40, 80],
    timestamp: data.timestamp || Date.now(),
    // Re-alert when a notification with the same tag is replaced.
    renotify: !!data.tag,
  }
  // Large hero image (e.g. the photo from a shared moment) — Android only.
  if (data.image) opts.image = data.image
  e.waitUntil(self.registration.showNotification(data.title, opts))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const match = clients.find(c => c.url.includes(self.location.origin))
      if (match) { match.focus(); match.navigate(url) }
      else self.clients.openWindow(url)
    })
  )
})
