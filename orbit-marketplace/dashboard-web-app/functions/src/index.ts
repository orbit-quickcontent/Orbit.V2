import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. User Creation Trigger
 * Instantiates the User profile in Firestore when a user registers via Auth
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, phoneNumber, photoURL } = user;
  
  const userPayload = {
    id: uid,
    email: email || "",
    name: displayName || null,
    phone: phoneNumber || null,
    avatarUrl: photoURL || null,
    defaultOrganizationId: null,
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection("users").doc(uid).set(userPayload);
  console.log(`[Functions] User profile created for UID: ${uid}`);
});

/**
 * 2. Organization Creation (Callable)
 * Generates a new organization tenant, configures free subscription, and sets owner role
 */
export const createOrganization = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { name, slug } = data;
  const uid = context.auth.uid;

  const orgRef = db.collection("organizations").doc();
  const orgId = orgRef.id;

  const batch = db.batch();

  // Create Organization Doc
  batch.set(orgRef, {
    id: orgId,
    name,
    slug,
    logoUrl: null,
    createdBy: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "active"
  });

  // Add Member Doc with 'owner' role
  const memberRef = orgRef.collection("members").doc(uid);
  batch.set(memberRef, {
    id: uid,
    organizationId: orgId,
    role: "owner",
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "active"
  });

  // Set defaultOrganizationId for User
  const userRef = db.collection("users").doc(uid);
  batch.update(userRef, { defaultOrganizationId: orgId });

  // Initialize Free Tier Subscription Doc
  const subRef = db.collection("subscriptions").doc(orgId);
  batch.set(subRef, {
    id: orgId,
    organizationId: orgId,
    tier: "free",
    status: "active",
    stripeSubscriptionId: null,
    billingPeriod: "monthly",
    price: 0,
    currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
    currentPeriodEnd: admin.firestore.FieldValue.serverTimestamp(),
    cancelAtPeriodEnd: false
  });

  await batch.commit();

  return { success: true, organizationId: orgId };
});

/**
 * 3. Subscription Activation (Callable / Mock webhook receiver)
 * Activates or upgrades an organization subscription plan
 */
export const activateSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { organizationId, tier, billingPeriod, price, stripeSubId } = data;

  // Only Owner or Admin can update subscription details
  const memberSnap = await db.collection("organizations").doc(organizationId).collection("members").doc(context.auth.uid).get();
  if (!memberSnap.exists() || !["owner", "admin"].includes(memberSnap.data()?.role)) {
    throw new functions.https.HttpsError("permission-denied", "Only organization owners/admins can update billing.");
  }

  await db.collection("subscriptions").doc(organizationId).set({
    organizationId,
    tier,
    status: "active",
    stripeSubscriptionId: stripeSubId || `mock_stripe_${Date.now()}`,
    billingPeriod,
    price,
    currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
    currentPeriodEnd: admin.firestore.FieldValue.serverTimestamp(),
    cancelAtPeriodEnd: false
  }, { merge: true });

  return { success: true };
});

/**
 * 4. Invoice Generation Trigger
 * Automatically runs daily or on project completion to compile details and send invoices
 */
export const generateInvoice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { organizationId, clientId, amount, currency, items } = data;

  const invoiceRef = db.collection("organizations").doc(organizationId).collection("invoices").doc();
  const invoiceId = invoiceRef.id;

  const invoicePayload = {
    id: invoiceId,
    organizationId,
    clientId: clientId || null,
    amount,
    currency: currency || "INR",
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    status: "sent",
    items,
    pdfUrl: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await invoiceRef.set(invoicePayload);
  return { success: true, invoiceId };
});

/**
 * 5 & 6. Push and Email Notifications triggers
 * Triggered on new task assignment or chat messages to dispatch notification alerts
 */
export const onNotificationCreated = functions.firestore
  .document("notifications/{notificationId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const { userId, title, body } = data;

    // Fetch user device push token
    const devicesSnap = await db.collection("users").doc(userId).collection("devices").limit(1).get();
    if (!devicesSnap.empty) {
      const device = devicesSnap.docs[0].data();
      const token = device.pushToken;

      const message = {
        notification: { title, body },
        token: token
      };

      try {
        await admin.messaging().send(message);
        console.log(`[Push Notification] Dispatched successfully to UID: ${userId}`);
      } catch (err) {
        console.error("[Push Notification] Failed to send push message:", err);
      }
    }
  });

/**
 * 7. Analytics Aggregator (Scheduled / Daily)
 * Aggregates logs, payments, active projects and creates summary report for dashboard
 */
export const dailyAnalyticsAggregator = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    console.log("[Analytics] Running daily aggregation job...");
    const orgsSnap = await db.collection("organizations").get();

    for (const orgDoc of orgsSnap.docs) {
      const orgId = orgDoc.id;

      const projectsSnap = await db.collection("projects").where("organizationId", "==", orgId).where("status", "==", "active").get();
      const revenueSnap = await db.collection("payments").where("organizationId", "==", orgId).where("status", "==", "success").get();

      let totalRevenue = 0;
      revenueSnap.forEach(p => {
        totalRevenue += (p.data().amount || 0);
      });

      const todayStr = new Date().toISOString().split("T")[0];

      await db.collection("analytics").doc(`${orgId}_${todayStr}`).set({
        organizationId: orgId,
        activeProjectsCount: projectsSnap.size,
        totalRevenue,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return null;
  });

/**
 * 8. Soft Delete Purge (Scheduled / Weekly GDPR compliance)
 * Permanently deletes user records that have been soft-deleted for over 30 days
 */
export const gdprCleanupPurge = functions.pubsub
  .schedule("every 7 days")
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const staleUsersSnap = await db.collection("users")
      .where("status", "==", "disabled")
      .where("updatedAt", "<", thirtyDaysAgo.toISOString())
      .get();

    const batch = db.batch();
    staleUsersSnap.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`[GDPR Cleanup] Purged ${staleUsersSnap.size} disabled accounts.`);
    return null;
  });

/**
 * 9. Immutable Audit Trails Logger
 * Automatically logs document write changes to ensure auditable transparency
 */
export const auditTrailLogger = functions.firestore
  .document("projects/{projectId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) return;

    const projectId = context.params.projectId;
    const organizationId = after.organizationId;

    const changes: { field: string; oldVal: any; newVal: any }[] = [];

    // Capture specific status/name modifications
    if (before.status !== after.status) {
      changes.push({ field: "status", oldVal: before.status, newVal: after.status });
    }
    if (before.name !== after.name) {
      changes.push({ field: "name", oldVal: before.name, newVal: after.name });
    }

    if (changes.length > 0) {
      const logRef = db.collection("auditLogs").doc();
      await logRef.set({
        id: logRef.id,
        userId: after.ownerId || "system",
        organizationId,
        action: "project.update",
        entityType: "Project",
        entityId: projectId,
        changes,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[Audit Logs] Logged update event for project: ${projectId}`);
    }
  });
