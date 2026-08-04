import { collection, CollectionReference, DocumentData } from "firebase/firestore";
import { db } from "./app";
import {
  Organization,
  User,
  UserRoleDoc,
  Permission,
  Project,
  ProjectTask,
  Subscription,
  Invoice,
  PaymentRecord,
  Document as DocumentDoc,
  StorageFile,
  ChatRoom,
  ChatMessage,
  Notification,
  ActivityLog,
  AuditLog,
  DashboardAnalyticsSummary,
  TenantUsage,
  SupportTicket,
  SaaSSetting,
  APIKey
} from "../admin/types"; // Import schemas

const getCollectionRef = <T = DocumentData>(name: string) => {
  return collection(db, name) as CollectionReference<T>;
};

export const partnerCollections = {
  organizations: () => getCollectionRef<Organization>("organizations"),
  users: () => getCollectionRef<User>("users"),
  roles: () => getCollectionRef<UserRoleDoc>("roles"),
  permissions: () => getCollectionRef<Permission>("permissions"),
  projects: () => getCollectionRef<Project>("projects"),
  tasks: () => getCollectionRef<ProjectTask>("tasks"),
  subscriptions: () => getCollectionRef<Subscription>("subscriptions"),
  invoices: () => getCollectionRef<Invoice>("invoices"),
  payments: () => getCollectionRef<PaymentRecord>("payments"),
  documents: () => getCollectionRef<DocumentDoc>("documents"),
  files: () => getCollectionRef<StorageFile>("files"),
  chatRooms: () => getCollectionRef<ChatRoom>("chatRooms"),
  messages: () => getCollectionRef<ChatMessage>("messages"),
  notifications: () => getCollectionRef<Notification>("notifications"),
  activityLogs: () => getCollectionRef<ActivityLog>("activityLogs"),
  auditLogs: () => getCollectionRef<AuditLog>("auditLogs"),
  analytics: () => getCollectionRef<DashboardAnalyticsSummary>("analytics"),
  usage: () => getCollectionRef<TenantUsage>("usage"),
  supportTickets: () => getCollectionRef<SupportTicket>("supportTickets"),
  settings: () => getCollectionRef<SaaSSetting>("settings"),
  apiKeys: () => getCollectionRef<APIKey>("apiKeys")
};
