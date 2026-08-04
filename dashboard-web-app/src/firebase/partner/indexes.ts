/**
 * 📇 Partner App Firestore Composite Indexes Documentation
 */

export const compositeIndexes = [
  {
    collectionGroup: "tasks",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "assignedTo", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "dueDate", order: "ASCENDING" }
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
