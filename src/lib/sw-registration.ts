// Service Worker Registration Utility
export class ServiceWorkerManager {
  private static registration: ServiceWorkerRegistration | null = null;

  static async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      console.log('Registering Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.registration = registration;

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.showUpdateNotification();
            }
          });
        }
      });

      // Handle messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleMessage(event);
      });

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  static async unregister(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.unregister();
      this.registration = null;
      console.log('Service Worker unregistered');
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }

  private static showUpdateNotification(): void {
    // Show update notification to user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Update Available', {
        body: 'A new version of FyKing Men is available. Refresh to update.',
        icon: '/icon-192.png',
      });
    }
  }

  private static handleMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        console.log('Background sync completed');
        // Show success notification
        break;
      case 'SYNC_FAILED':
        console.error('Background sync failed:', data);
        // Show error notification
        break;
      default:
        console.log('Unknown message from SW:', type, data);
    }
  }

  // Request background sync
  static async requestBackgroundSync(tag: string = 'background-sync'): Promise<void> {
    if (!this.registration) return;

    try {
      // Background sync is not widely supported, use message passing instead
      await this.sendMessage({ type: 'REQUEST_SYNC', tag });
      console.log('Background sync requested:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  // Request notification permission
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  // Send message to service worker
  static async sendMessage(message: any): Promise<void> {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage(message);
  }
}

// Auto-register on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    ServiceWorkerManager.register();
  });
}