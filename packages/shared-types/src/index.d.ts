export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
export type TenantPlan = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    plan: TenantPlan;
    logoUrl: string | null;
    primaryColor: string | null;
    domain: string | null;
    trialEndsAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_SETUP';
export type AuthProvider = 'LOCAL' | 'GOOGLE';
export interface User {
    id: string;
    tenantId: string | null;
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
export interface Role {
    id: string;
    tenantId: string | null;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: Permission[];
    createdAt: string;
    updatedAt: string;
}
export type PermissionAction = 'employee:read' | 'employee:create' | 'employee:update' | 'employee:delete' | 'employee:import' | 'employee:export' | 'org:read' | 'org:manage' | 'leave:read' | 'leave:apply' | 'leave:approve' | 'leave:manage_types' | 'leave:manage_policies' | 'attendance:read' | 'attendance:checkin' | 'attendance:manage' | 'attendance:manage_locations' | 'document:read' | 'document:upload' | 'document:delete' | 'document:manage' | 'report:read' | 'report:create' | 'report:export' | 'settings:read' | 'settings:manage' | 'tenant:manage' | 'platform:manage';
export interface Permission {
    id: string;
    action: PermissionAction;
    description: string;
}
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
export interface AuditLog {
    id: string;
    tenantId: string | null;
    actorId: string;
    actorEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
}
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS';
export type NotificationType = 'leave.applied' | 'leave.approved' | 'leave.rejected' | 'leave.cancelled' | 'attendance.correction_requested' | 'attendance.correction_approved' | 'workflow.pending_approval' | 'workflow.completed' | 'document.expiry_warning' | 'announcement.new' | 'system.account_created';
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
    tenantSlug?: string;
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
//# sourceMappingURL=index.d.ts.map