let admin: any;
try {
  admin = require("firebase-admin");
} catch (e) {
  admin = null;
}

let firebaseAdminApp: any = null;

if (admin) {
  try {
    if (!admin.apps || admin.apps.length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccountJson) {
        try {
          const serviceAccount = JSON.parse(serviceAccountJson);
          firebaseAdminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || "orbit-99e42",
          });
          console.log("✅ Firebase Admin SDK initialized with Service Account Key");
        } catch (e) {
          console.warn("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON; falling back to default credentials");
          firebaseAdminApp = admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || "orbit-99e42",
          });
        }
      } else {
        firebaseAdminApp = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || "orbit-99e42",
        });
        console.log("✅ Firebase Admin SDK initialized with Default Project Credentials (orbit-99e42)");
      }
    } else {
      firebaseAdminApp = admin.app();
    }
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error);
  }
}

export const adminAuth = admin && firebaseAdminApp ? admin.auth(firebaseAdminApp) : null;
export const adminFirestore = admin && firebaseAdminApp ? admin.firestore(firebaseAdminApp) : null;
export const adminMessaging = admin && firebaseAdminApp ? admin.messaging(firebaseAdminApp) : null;

/**
 * Verifies a Firebase ID token sent from client mobile or web apps.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<any | null> {
  if (!adminAuth) return null;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("❌ [FirebaseAdmin] ID Token verification failed:", error);
    return null;
  }
}

/**
 * Sends FCM push notification to a target device FCM token.
 */
export async function sendFcmNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  if (!fcmToken || !adminMessaging) return false;

  try {
    const message: any = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "orbit_dispatch_alerts",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await adminMessaging.send(message);
    console.log(`[FCM] Successfully sent notification: ${response}`);
    return true;
  } catch (error) {
    console.error("[FCM] Error sending push notification:", error);
    return false;
  }
}

export default firebaseAdminApp;
