/**
 * 📇 Client App Firestore Composite Indexes Documentation
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
    collectionGroup: "chatMessages",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "roomId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  }
];
