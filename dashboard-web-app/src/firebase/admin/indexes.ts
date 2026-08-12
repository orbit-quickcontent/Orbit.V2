/**
 * 📇 Orbit SaaS Firestore Composite Indexes Documentation
 * 
 * This file lists all composite indexes required by the Firestore database
 * queries in the SaaS Admin dashboard.
 * 
 * Deploy using: firebase deploy --only firestore:indexes
 */

export const compositeIndexes = [
  {
    collectionGroup: "projects",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "organizationId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "tasks",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "projectId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "dueDate", order: "ASCENDING" }
    ]
  },
  {
    collectionGroup: "invoices",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "organizationId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "dueDate", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "chatMessages",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "roomId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "activityLogs",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "auditLogs",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "organizationId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  }
];
