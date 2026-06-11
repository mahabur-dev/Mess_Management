self.addEventListener('push', (event) => {
  const fallback = {
    title: 'Mess Management',
    body: 'You have a new notification.',
    url: '/dashboard',
    data: {},
  }

  const payload = event.data ? event.data.json() : fallback
  const title = payload.title || fallback.title

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || fallback.body,
      icon: '/mess_logo.png',
      badge: '/icon-192.png',
      data: {
        url: payload.url || fallback.url,
        ...(payload.data || {}),
      },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find((item) => item.url === targetUrl)
      if (client) return client.focus()
      return clients.openWindow(targetUrl)
    }),
  )
})
