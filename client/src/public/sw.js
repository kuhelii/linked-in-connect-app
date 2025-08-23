// Service Worker for Push Notifications
const CACHE_NAME = "networkhub-v1";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push event
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let notificationData = {
    title: "New Notification",
    body: "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: {},
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      console.error("[SW] Error parsing push data:", error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    actions: notificationData.actions || [],
    requireInteraction: true,
    tag: notificationData.data.type || "general",
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  event.notification.close();

  const data = event.notification.data;
  let url = "/";

  if (data && data.url) {
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }

      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync (for offline message sending)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync-messages") {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  try {
    // Get pending messages from IndexedDB
    const pendingMessages = await getPendingMessages();

    for (const message of pendingMessages) {
      try {
        // Attempt to send the message
        const response = await fetch("/api/chat/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${message.token}`,
          },
          body: JSON.stringify(message.data),
        });

        if (response.ok) {
          // Remove from pending messages
          await removePendingMessage(message.id);
        }
      } catch (error) {
        console.error("[SW] Error syncing message:", error);
      }
    }
  } catch (error) {
    console.error("[SW] Error in background sync:", error);
  }
}

// IndexedDB helpers (simplified)
async function getPendingMessages() {
  // Implementation would use IndexedDB to get pending messages
  return [];
}

async function removePendingMessage(id) {
  // Implementation would remove message from IndexedDB
}
