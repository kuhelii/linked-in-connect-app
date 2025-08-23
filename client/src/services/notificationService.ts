import api from "./api";

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string | null = null;

  async initialize() {
    try {
      // Register service worker
      if ("serviceWorker" in navigator) {
        this.registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered successfully");
      }

      // Get VAPID public key
      const response = await api.get("/notifications/vapid-public-key");
      this.vapidPublicKey = response.data.publicKey;

      // Request notification permission
      await this.requestPermission();
    } catch (error) {
      console.error("Error initializing notification service:", error);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  async subscribeToPush(): Promise<boolean> {
    try {
      if (!this.registration || !this.vapidPublicKey) {
        throw new Error("Service worker or VAPID key not available");
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error("Notification permission denied");
      }

      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            this.vapidPublicKey
          ) as BufferSource,
        });
      }

      // Send subscription to server
      await api.post("/notifications/subscribe", {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(
            String.fromCharCode(
              ...new Uint8Array(subscription.getKey("p256dh")!)
            )
          ),
          auth: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))
          ),
        },
      });

      console.log("Successfully subscribed to push notifications");
      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.registration) {
        throw new Error("Service worker not available");
      }

      const subscription =
        await this.registration.pushManager.getSubscription();
      if (!subscription) {
        return true; // Already unsubscribed
      }

      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Notify server
      await api.post("/notifications/unsubscribe", {
        endpoint: subscription.endpoint,
      });

      console.log("Successfully unsubscribed from push notifications");
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.registration) return false;

      const subscription =
        await this.registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    // Ensure the returned value is a plain Uint8Array (not a subclass or generic)
    return new Uint8Array(outputArray.buffer);
  }

  // Show local notification (fallback)
  showLocalNotification(title: string, options: NotificationOptions = {}) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        ...options,
      });
    }
  }
}

export const notificationService = new NotificationService();
