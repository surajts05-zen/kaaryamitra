import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { UiDemoPage } from '@/pages/ui-demo';
import { LoginPage } from '@/pages/login';
import { ProtectedRoute, TenantResolver } from '@/components/auth/protected-route';
import { AdminDashboardPage } from '@/pages/admin/dashboard';
import { AdminTenantsPage } from '@/pages/admin/tenants';

import { DashboardPage } from '@/pages/dashboard';
import { DepartmentsPage } from '@/pages/company/departments';
import { LocationsPage } from '@/pages/company/locations';
import { DesignationsPage } from '@/pages/company/designations';
import { CompanySettingsPage } from '@/pages/company/settings';
import { AdminShiftsPage } from '@/pages/company/settings/shifts';

// Phase 5 - Core HR (Employee Management)
import { DirectoryPage } from '@/pages/company/employees/directory';
import { AddEmployeePage } from '@/pages/company/employees/add';
import { EmployeeProfilePage } from '@/pages/company/employees/profile';
import { EditEmployeePage } from '@/pages/company/employees/edit';
import { LeaveApprovalsPage } from '@/pages/company/approvals/leave';

// Phase 6 - Employee Self Service
import { LeaveTypesPage } from '@/pages/company/leave-types';
import { EssDashboardPage } from '@/pages/ess/dashboard';
import { EssProfilePage } from '@/pages/ess/my-profile';
import { EssLeavePage } from '@/pages/ess/leave';
import { MyAttendancePage } from '@/pages/ess/attendance';
import { MyShiftsPage } from '@/pages/ess/shifts';
import { MyTimesheetsPage } from '@/pages/ess/timesheets';

// Phase 8 - Workflow Engine
import { WorkflowsPage } from '@/pages/company/settings/workflows';
import { ApprovalsInboxPage } from '@/pages/company/approvals';

// RBAC
import { RolesPage } from '@/pages/company/settings/roles';
import { DocumentSettings } from '@/pages/company/settings/documents';
import { AssetSettings } from '@/pages/company/settings/assets';
import { ChecklistSettings } from '@/pages/company/settings/checklists';
import { HolidaysSettingsPage } from '@/pages/company/settings/holidays';
import { HelpdeskSettingsPage } from '@/pages/company/settings/helpdesk';

// Phase 13 - Resignations
import { ResignationsPage } from '@/pages/company/resignations';
import { MyResignationPage } from '@/pages/ess/resignation';

// Phase 14 - Helpdesk
import { EssHelpdeskPage } from '@/pages/ess/helpdesk';
import { EssHelpdeskThreadPage } from '@/pages/ess/helpdesk-thread';
import { AdminHelpdeskPage } from '@/pages/company/helpdesk';
import { AdminHelpdeskThreadPage } from '@/pages/company/helpdesk/thread';

/**
 * KaaryaMitra App Router
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        {/* Super Admin Routes */}
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="tenants" element={<AdminTenantsPage />} />
        </Route>

        {/* Workspace Routes */}
        <Route path="/t/:slug" element={<TenantResolver />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Phase 4 - Company Administration */}
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="designations" element={<DesignationsPage />} />
            <Route path="settings" element={<CompanySettingsPage />} />
            <Route path="settings/leave" element={<LeaveTypesPage />} />
            <Route path="settings/shifts" element={<AdminShiftsPage />} />
            <Route path="settings/workflows" element={<WorkflowsPage />} />
            <Route path="settings/roles" element={<RolesPage />} />
            <Route path="settings/documents" element={<DocumentSettings />} />
            <Route path="settings/assets" element={<AssetSettings />} />
            <Route path="settings/checklists" element={<ChecklistSettings />} />
            <Route path="settings/holidays" element={<HolidaysSettingsPage />} />
            <Route path="settings/helpdesk" element={<HelpdeskSettingsPage />} />

            {/* Phase 7 - Leave Management */}
            <Route path="approvals/leave" element={<LeaveApprovalsPage />} />

            {/* Phase 8 - Workflow Engine */}
            <Route path="approvals" element={<ApprovalsInboxPage />} />

            {/* Phase 13 - Resignations */}
            <Route path="resignations" element={<ResignationsPage />} />
            <Route path="helpdesk" element={<AdminHelpdeskPage />} />
            <Route path="helpdesk/:id" element={<AdminHelpdeskThreadPage />} />

            {/* RBAC */}
            <Route path="settings/roles" element={<RolesPage />} />

            {/* Catch-all for /t/:slug */}
            {/* Phase 5 - Core HR */}
            <Route path="directory" element={<DirectoryPage />} />
            <Route path="directory/new" element={<AddEmployeePage />} />
            <Route path="directory/:id" element={<EmployeeProfilePage />} />
            <Route path="directory/:id/edit" element={<EditEmployeePage />} />

            {/* Phase 6 - ESS */}
            <Route path="me">
              <Route index element={<EssDashboardPage />} />
              <Route path="profile" element={<EssProfilePage />} />
              <Route path="attendance" element={<MyAttendancePage />} />
              <Route path="leave" element={<EssLeavePage />} />
              <Route path="shifts" element={<MyShiftsPage />} />
              <Route path="timesheets" element={<MyTimesheetsPage />} />
              <Route path="resignation" element={<MyResignationPage />} />
              <Route path="helpdesk" element={<EssHelpdeskPage />} />
              <Route path="helpdesk/:id" element={<EssHelpdeskThreadPage />} />
            </Route>
          </Route>
        </Route>
        
        {/* Global UI testing route */}
        <Route path="/ui" element={<AppShell />}>
          <Route index element={<UiDemoPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
