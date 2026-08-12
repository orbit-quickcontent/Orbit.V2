/**
 * 📦 Orbit SaaS Schema Types
 * 
 * Comprehensive TypeScript interface declarations for all SaaS Firestore
 * collections and documents. Supports multi-tenancy, RBAC, billing, projects,
 * chat, support, settings, and usage metrics.
 */

// ─── UTILS & ENUMS ───────────────────────────────────────────────────────────
export type UserRole = 
  | "owner" 
  | "super_admin" 
  | "admin" 
  | "manager" 
  | "editor" 
  | "employee" 
  | "partner" 
  | "client" 
  | "viewer";

export type ProjectStatus = "draft" | "active" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type PaymentStatus = "pending" | "processing" | "success" | "failed";
export type SubscriptionTier = "free" | "starter" | "growth" | "enterprise";

// ─── ORGANIZATIONS & TENANTS ──────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  status: "active" | "suspended";
}

export interface OrganizationMember {
  id: string; // User ID
  organizationId: string;
  role: UserRole;
  joinedAt: string;
  status: "active" | "invited" | "suspended";
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  members: string[]; // User IDs
  createdAt: string;
  updatedAt: string;
}

// ─── USER & SECURITY ─────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  defaultOrganizationId: string | null;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleDoc {
  id: string; // role ID (e.g. role name or composite)
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  createdAt: string;
}

export interface Permission {
  id: string; // e.g. "project:create", "billing:view"
  name: string;
  module: string;
  description: string;
}

export interface UserDevice {
  id: string; // Token / Token hash
  userId: string;
  platform: "ios" | "android" | "web";
  pushToken: string;
  lastActiveAt: string;
}

// ─── CLIENTS, PARTNERS, EMPLOYEES ───────────────────────────────────────────
export interface ClientProfile {
  id: string;
  organizationId: string;
  companyName: string;
  website: string | null;
  billingAddress: string | null;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: string;
}

export interface PartnerProfile {
  id: string;
  userId: string;
  organizationId: string | null;
  skills: string[];
  rating: number;
  completedJobsCount: number;
  availabilityStatus: "available" | "busy" | "offline";
  payoutDetails: Record<string, any> | null;
  createdAt: string;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  organizationId: string;
  department: string | null;
  title: string | null;
  managerId: string | null; // User ID of manager
  joinedAt: string;
}

// ─── PROJECTS & WORKFLOW ─────────────────────────────────────────────────────
export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  clientId: string | null;
  ownerId: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  assignedTo: string | null; // User ID
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  taskId: string | null; // Optional link to task
  authorId: string;
  content: string;
  createdAt: string;
}

// ─── INVOICES & PAYMENTS ─────────────────────────────────────────────────────
export interface Subscription {
  id: string; // Doc ID (Organization ID for 1:1 billing relationship)
  organizationId: string;
  tier: SubscriptionTier;
  status: "active" | "canceled" | "past_due" | "trialing";
  stripeSubscriptionId: string | null;
  billingPeriod: "monthly" | "yearly";
  price: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  organizationId: string;
  clientId: string | null;
  amount: number;
  currency: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  items: { description: string; quantity: number; unitPrice: number }[];
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  organizationId: string;
  invoiceId: string | null;
  amount: number;
  currency: string;
  paymentMethod: "card" | "bank_transfer" | "upi" | "stripe";
  status: PaymentStatus;
  gatewayTransactionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ─── DOCUMENTS & STORAGE ─────────────────────────────────────────────────────
export interface Document {
  id: string;
  organizationId: string;
  projectId: string | null;
  title: string;
  body: string | null; // Rich text or editor schema
  isTemplate: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageFile {
  id: string;
  organizationId: string;
  projectId: string | null;
  name: string;
  sizeBytes: number;
  mimeType: string;
  storagePath: string; // Firebase storage location path
  downloadUrl: string;
  uploadedBy: string;
  createdAt: string;
}

// ─── CHAT & COMMUNICATION ────────────────────────────────────────────────────
export interface ChatRoom {
  id: string;
  organizationId: string;
  projectId: string | null;
  name: string | null;
  type: "direct" | "group" | "project";
  participantIds: string[]; // User IDs
  lastMessageText: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  text: string | null;
  attachments: { fileId: string; name: string; url: string; type: string }[] | null;
  createdAt: string;
}

// ─── NOTIFICATIONS & AUDITS ──────────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "alert";
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  organizationId: string | null;
  action: string; // e.g. "user.login", "project.create"
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  entityType: string; // e.g. "Invoice", "Payment", "APIKey"
  entityId: string;
  changes: { field: string; oldVal: any; newVal: any }[] | null;
  createdAt: string;
}

// ─── ANALYTICS & BILLING USAGE ──────────────────────────────────────────────
export interface DashboardAnalyticsSummary {
  id: string; // Date or Tenant composite (e.g. "org_123_2026-07")
  organizationId: string;
  activeProjectsCount: number;
  tasksCompletedCount: number;
  totalRevenue: number;
  activeUsersCount: number;
  storageUsedBytes: number;
  updatedAt: string;
}

export interface TenantUsage {
  id: string; // Month identifier e.g. "org_123_2026-07"
  organizationId: string;
  apiCallsCount: number;
  emailsSentCount: number;
  storageBytesUsed: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  organizationId: string | null;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface SaaSSetting {
  id: string; // "global_config" or Org ID
  billingEnabled: boolean;
  maintenanceMode: boolean;
  supportedLocales: string[];
  maxUploadSizeBytes: number;
  featuresEnabled: Record<string, boolean>;
}

export interface APIKey {
  id: string; // API Key hash
  organizationId: string;
  name: string;
  prefix: string; // e.g. "orb_live_"
  scopes: string[]; // Allowed permissions
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}
