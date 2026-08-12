/**
 * Firebase Cloud Messaging (FCM) and Real-Time Notification Utilities
 */

export interface NotificationPayload {
  title: string;
  body: string;
  bookingId?: string;
  type?: 'DISPATCH' | 'ACCEPTANCE' | 'STATUS_CHANGE' | 'REEL_DELIVERY';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[FCM] Notifications not supported in current environment.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('[FCM] Permission request failed:', error);
    return false;
  }
}

export function displayDesktopNotification(payload: NotificationPayload): void {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
    });
  }
}

export function setupFCMListener(onMessageCallback: (payload: NotificationPayload) => void): () => void {
  console.log('[FCM] Initializing Cloud Messaging listener...');

  // Handler for custom browser message events
  const handleCustomMessage = (event: Event) => {
    const customEvt = event as CustomEvent<NotificationPayload>;
    if (customEvt.detail) {
      console.log('[FCM] Message arrived:', customEvt.detail);
      displayDesktopNotification(customEvt.detail);
      onMessageCallback(customEvt.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('orbit:fcm-message', handleCustomMessage);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('orbit:fcm-message', handleCustomMessage);
    }
  };
}
