// ─────────────────────────────────────────────────────────────────────────────
// KaaryaMitra Shared Types
// Used by both apps/api and apps/web
// ─────────────────────────────────────────────────────────────────────────────

// ── Tenant ──────────────────────────────────────────────────────────────────

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
export type TenantPlan = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface Tenant {
  id: string;
  name: string;
  slug: string; // URL-safe: /t/{slug}/
  status: TenantStatus;
  plan: TenantPlan;
  logoUrl: string | null;
  primaryColor: string | null;
  domain: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── User ─────────────────────────────────────────────────────────────────────

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_SETUP';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface User {
  id: string;
  tenantId: string | null; // null = Super Admin
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: UserStatus;
  authProvider: AuthProvider;
  isSuperAdmin: boolean;
  roleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  roles: Role[];
  permissions: Permission[];
}

// ── RBAC ─────────────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  tenantId: string | null; // null = platform-level role
  name: string;
  description: string | null;
  isSystem: boolean; // System roles cannot be deleted
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export type PermissionAction =
  // Employee
  | 'employee:read'
  | 'employee:create'
  | 'employee:update'
  | 'employee:delete'
  | 'employee:import'
  | 'employee:export'
  // Organization
  | 'org:read'
  | 'org:manage'
  // Leave
  | 'leave:read'
  | 'leave:apply'
  | 'leave:approve'
  | 'leave:manage_types'
  | 'leave:manage_policies'
  // Attendance
  | 'attendance:read'
  | 'attendance:checkin'
  | 'attendance:manage'
  | 'attendance:manage_locations'
  // Documents
  | 'document:read'
  | 'document:upload'
  | 'document:delete'
  | 'document:manage'
  // Reports
  | 'report:read'
  | 'report:create'
  | 'report:export'
  // Settings
  | 'settings:read'
  | 'settings:manage'
  // Super Admin
  | 'tenant:manage'
  | 'platform:manage';

export interface Permission {
  id: string;
  action: PermissionAction;
  description: string;
}

// ── API Response Envelopes ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  tenantId: string | null;
  actorId: string;
  actorEmail: string;
  action: string; // e.g. 'employee.created', 'leave.approved'
  entityType: string; // e.g. 'Employee', 'LeaveApplication'
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS';
export type NotificationType =
  | 'leave.applied'
  | 'leave.approved'
  | 'leave.rejected'
  | 'leave.cancelled'
  | 'attendance.correction_requested'
  | 'attendance.correction_approved'
  | 'workflow.pending_approval'
  | 'workflow.completed'
  | 'document.expiry_warning'
  | 'announcement.new'
  | 'system.account_created';

export interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  channel: NotificationChannel;
  readAt: string | null;
  createdAt: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
  userId: string;
  tenantId: string | null;
  email: string;
  isSuperAdmin: boolean;
  sessionId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string; // Optional: pre-select tenant
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: UserProfile;
  tenant: Tenant | null;
  accessToken: string;
}
