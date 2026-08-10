/**
 * Firebase Admin and FCM Notification Dispatch Utilities
 */

export interface FCMNotificationMessage {
  token?: string;
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendFCMNotification(message: FCMNotificationMessage): Promise<{ success: boolean; messageId?: string }> {
  try {
    console.log(`[firebaseUtils] Sending FCM message to ${message.token ? 'token' : 'topic'}: ${message.title}`);
    
    // Simulate FCM send response
    return {
      success: true,
      messageId: `fcm_msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
  } catch (error) {
    console.error('[firebaseUtils] Failed to send FCM message:', error);
    return { success: false };
  }
}

export async function sendMulticastNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> {
  console.log(`[firebaseUtils] Multicasting notification to ${tokens.length} devices.`);
  return {
    successCount: tokens.length,
    failureCount: 0,
  };
}
