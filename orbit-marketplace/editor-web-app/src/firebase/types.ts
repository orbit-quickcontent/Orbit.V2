/**
 * 📦 Orbit SaaS Schema Types (Editor Application Context)
 */

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

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "suspended";
}

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
  assignedTo: string | null;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  organizationId: string;
  projectId: string | null;
  title: string;
  body: string | null;
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
  storagePath: string;
  downloadUrl: string;
  uploadedBy: string;
  createdAt: string;
}
