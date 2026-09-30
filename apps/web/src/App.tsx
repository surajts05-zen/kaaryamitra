import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { MobileAppShell } from '@/components/layout/mobile-app-shell';
import { DesktopGuardLayout, DesktopOnlyGuard } from '@/components/auth/desktop-only-route';
import { useIsMobile } from '@/hooks/use-mobile';
import { UiDemoPage } from '@/pages/ui-demo';
import { LoginPage } from '@/pages/login';
import { ContactPage } from '@/pages/contact';
import { ProtectedRoute, TenantResolver } from '@/components/auth/protected-route';
import { AdminDashboardPage } from '@/pages/admin/dashboard';
import { AdminTenantsPage } from '@/pages/admin/tenants';
import { AdminSettingsPage } from '@/pages/admin/settings';
import { AdminBillingDashboard } from '@/pages/admin/billing';
import { AdminBillingPlans } from '@/pages/admin/billing/plans';
import { AdminBillingSettings } from '@/pages/admin/billing/settings';

import { DashboardPage } from '@/pages/dashboard';
import { DepartmentsPage } from '@/pages/company/departments';
import { LocationsPage } from '@/pages/company/locations';
import { DesignationsPage } from '@/pages/company/designations';
import { CompanySettingsPage } from '@/pages/company/settings';
import { AdminShiftsPage } from '@/pages/company/settings/shifts';
import { AdminAttendancePage } from '@/pages/company/attendance/index';
import { AttendancePolicyPage } from '@/pages/company/settings/attendance';

// Phase 5 - Core HR (Employee Management)
import { DirectoryPage } from '@/pages/company/employees/directory';
import { AddEmployeePage } from '@/pages/company/employees/add';
import { EmployeeProfilePage } from '@/pages/company/employees/profile';
import { EditEmployeePage } from '@/pages/company/employees/edit';
import { LeaveApprovalsPage } from '@/pages/company/approvals/leave';

// Phase 6 - Employee Self Service
import { LeaveTypesPage } from '@/pages/company/leave-types';
import { EssDashboardPage } from '@/pages/ess/dashboard';
import { MobileEssDashboard } from '@/pages/ess/mobile/dashboard';
import { EssProfilePage } from '@/pages/ess/my-profile';
import { MobileEssProfile } from '@/pages/ess/mobile/my-profile';
import { EssLeavePage } from '@/pages/ess/leave';
import { MobileEssLeave } from '@/pages/ess/mobile/leave';
import { MyAttendancePage } from '@/pages/ess/attendance';
import { MobileMyAttendance } from '@/pages/ess/mobile/attendance';
import { MyShiftsPage } from '@/pages/ess/shifts';
import { MobileMyShifts } from '@/pages/ess/mobile/shifts';
import { MyTimesheetsPage } from '@/pages/ess/timesheets';
import { MobileMyTimesheets } from '@/pages/ess/mobile/timesheets';

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
import { MobileEssHelpdesk } from '@/pages/ess/mobile/helpdesk';
import { EssHelpdeskThreadPage } from '@/pages/ess/helpdesk-thread';
import { AdminHelpdeskPage } from '@/pages/company/helpdesk';
import { AdminHelpdeskThreadPage } from '@/pages/company/helpdesk/thread';

// Phase 16 - Performance
import { CompanyGoalsPage } from '@/pages/company/performance/goals';
import { CompanyReviewsPage } from '@/pages/company/performance/reviews';
import { EssMyGoalsPage } from '@/pages/ess/performance/my-goals';
import { EssMyReviewsPage } from '@/pages/ess/performance/my-reviews';

// Phase 15 - Asset Management
import AssetDirectory from '@/pages/company/assets';
import AssetDetails from '@/pages/company/assets/asset-details';
import MyAssets from '@/pages/ess/assets';
import { MobileMyAssets } from '@/pages/ess/mobile/assets';

// Phase 28 - Compensation
import SalaryComponentsPage from '@/pages/company/compensation/salary-components';
import SalaryStructuresPage from '@/pages/company/compensation/salary-structures';
import { SalarySettingsHubPage } from '@/pages/company/compensation/salary-settings-hub';
import MyCompensationPage from '@/pages/ess/compensation';
import MyPayslipsPage from '@/pages/ess/payslips';
import { MobileMyPayslips } from '@/pages/ess/mobile/payslips';

// Phase 29 - Payroll
import PayrollRunsPage from '@/pages/company/payroll/payroll-runs';
import PayrollRunDetailPage from '@/pages/company/payroll/payroll-run-detail';
import PayrollSettingsPage from '@/pages/company/payroll/settings';
import { StatutorySettingsPage } from '@/pages/company/settings/statutory';

// Help & Resources
import { UserGuidePage } from '@/pages/user-guide';

// Phase 26 - Policies
import { PoliciesAdminList } from '@/pages/company/settings/policies/index';
import { PolicyEditor } from '@/pages/company/settings/policies/editor';
import { ESSPoliciesList } from '@/pages/ess/policies/index';
import { MobileESSPoliciesList } from '@/pages/ess/mobile/policies';
import { ESSPolicyViewer } from '@/pages/ess/policies/viewer';
import { MobileESSPolicyViewer } from '@/pages/ess/mobile/policy-viewer';

// Phase 30 - Content Library
import { LibraryExplorerPage } from '@/pages/company/library';
import { LibraryEditorPage } from '@/pages/company/library/editor';
import { LibraryViewerPage } from '@/pages/company/library/viewer';
import ReportsDashboard from '@/pages/company/reports/index';
import ReportBuilder from '@/pages/company/reports/builder';

// Meetings & Calendar
import { MeetingsDashboardPage } from '@/pages/company/meetings';
import { MeetingWorkspacePage } from '@/pages/company/meetings/workspace';

// Projects & Budgets
import { ProjectsPage } from '@/pages/company/projects';
import { ProjectDetailPage } from '@/pages/company/projects/detail';
import { BudgetsDashboardPage } from '@/pages/company/budgets';
import { BudgetRequestsPage } from '@/pages/company/budgets/requests';

// Finance Settings
import { FinanceSettingsPage } from '@/pages/company/settings/finance';

// Developer Hub
import { DeveloperHubPage } from '@/pages/company/settings/developer-hub';

// Meeting Rooms Configuration
import { MeetingRoomsPage } from '@/pages/company/rooms';

// Phase 24 - SaaS Billing
import { CompanyBillingPage } from '@/pages/company/settings/billing';
import { CompanyPlanComparePage } from '@/pages/company/settings/billing/plan-compare';

import { LandingPage } from '@/pages/landing';
import { RegisterPage } from '@/pages/register';
import { PrivacyPage } from '@/pages/privacy';
import { TermsPage } from '@/pages/terms';
import { CompleteSetupPage } from '@/pages/complete-setup';

/**
 * KaaryaMitra App Router
 */
export function App() {
  const isMobile = useIsMobile();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/complete-setup" element={<CompleteSetupPage />} />
      <Route path="/contact" element={<ContactPage />} />

      <Route element={<ProtectedRoute />}>
        {/* Super Admin Routes */}
        <Route path="/admin" element={<DesktopGuardLayout />}>
          <Route element={<AppShell />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="tenants" element={<AdminTenantsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="billing">
              <Route index element={<AdminBillingDashboard />} />
              <Route path="plans" element={<AdminBillingPlans />} />
              <Route path="settings" element={<AdminBillingSettings />} />
            </Route>
          </Route>
        </Route>

        {/* Workspace Routes */}
        <Route path="/t/:slug" element={<TenantResolver />}>
          <Route element={isMobile ? <MobileAppShell /> : <AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Desktop Only Routes */}
            <Route element={<DesktopGuardLayout />}>
              {/* Phase 4 - Company Administration */}
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="designations" element={<DesignationsPage />} />
            <Route path="settings" element={<CompanySettingsPage />} />
            <Route path="settings/billing" element={<CompanyBillingPage />} />
            <Route path="settings/billing/compare" element={<CompanyPlanComparePage />} />
            <Route path="settings/leave" element={<LeaveTypesPage />} />
            <Route path="settings/attendance" element={<AttendancePolicyPage />} />
            <Route path="settings/shifts" element={<AdminShiftsPage />} />
            <Route path="settings/workflows" element={<WorkflowsPage />} />
            <Route path="settings/roles" element={<RolesPage />} />
            <Route path="settings/documents" element={<DocumentSettings />} />
            <Route path="settings/assets" element={<AssetSettings />} />
            <Route path="settings/checklists" element={<ChecklistSettings />} />
            <Route path="settings/holidays" element={<HolidaysSettingsPage />} />
            <Route path="settings/helpdesk" element={<HelpdeskSettingsPage />} />
            <Route path="settings/salary" element={<SalarySettingsHubPage />} />
            <Route path="settings/salary-components" element={<SalarySettingsHubPage defaultTab="components" />} />
            <Route path="settings/salary-structures" element={<SalarySettingsHubPage defaultTab="structures" />} />
            <Route path="settings/statutory" element={<SalarySettingsHubPage defaultTab="statutory" />} />
            <Route path="settings/finance" element={<FinanceSettingsPage />} />
            <Route path="settings/developer" element={<DeveloperHubPage />} />
            <Route path="settings/rooms" element={<MeetingRoomsPage />} />
            {/* Phase 26 - Policies */}
            <Route path="settings/policies" element={<PoliciesAdminList />} />
            <Route path="settings/policies/:id/edit" element={<PolicyEditor />} />
            
            {/* Content Library */}
            <Route path="library" element={<LibraryExplorerPage />} />
            <Route path="library/editor" element={<LibraryEditorPage />} />
            <Route path="library/editor/:id" element={<LibraryEditorPage />} />
            <Route path="library/viewer/:id" element={<LibraryViewerPage />} />

            {/* Meetings & Calendar */}
            <Route path="meetings">
              <Route index element={<MeetingsDashboardPage />} />
              <Route path="workspace/:id" element={<MeetingWorkspacePage />} />
            </Route>

            {/* Reports */}
            <Route path="reports" element={<ReportsDashboard />} />
            <Route path="reports/builder" element={<ReportBuilder />} />

            {/* Projects & Budgets */}
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="budgets" element={<BudgetsDashboardPage />} />
            <Route path="budgets/requests" element={<BudgetRequestsPage />} />

            {/* Phase 7 - Leave Management */}
            <Route path="approvals/leave" element={<LeaveApprovalsPage />} />

            {/* Phase 29 - Payroll Admin */}
            <Route path="payroll" element={<PayrollRunsPage />} />
            <Route path="payroll/settings" element={<SalarySettingsHubPage defaultTab="payslips" />} />
            <Route path="payroll/:id" element={<PayrollRunDetailPage />} />

            {/* Phase 8 - Workflow Engine */}
            <Route path="approvals" element={<ApprovalsInboxPage />} />

            {/* Attendance Management */}
            <Route path="attendance" element={<AdminAttendancePage />} />

            {/* Phase 13 - Resignations */}
            <Route path="resignations" element={<ResignationsPage />} />
            
            {/* Phase 14 - Helpdesk */}
            <Route path="helpdesk" element={<AdminHelpdeskPage />} />
            <Route path="helpdesk/:id" element={<AdminHelpdeskThreadPage />} />

            {/* Phase 15 - Asset Management */}
            <Route path="assets" element={<AssetDirectory />} />
            <Route path="assets/:id" element={<AssetDetails />} />
            
            {/* Phase 16 - Performance */}
            <Route path="performance/goals" element={<CompanyGoalsPage />} />
            <Route path="performance/reviews" element={<CompanyReviewsPage />} />

            {/* Help & Resources */}
            <Route path="user-guide" element={<UserGuidePage />} />

            {/* RBAC */}
            <Route path="settings/roles" element={<RolesPage />} />

            {/* Catch-all for /t/:slug */}
            {/* Phase 5 - Core HR */}
            <Route path="directory" element={<DirectoryPage />} />
            <Route path="directory/new" element={<AddEmployeePage />} />
            <Route path="directory/:id" element={<EmployeeProfilePage />} />
            <Route path="directory/:id/edit" element={<EditEmployeePage />} />
            </Route>

            {/* Phase 6 - ESS */}
            <Route path="me">
              <Route index element={isMobile ? <MobileEssDashboard /> : <EssDashboardPage />} />
              <Route path="profile" element={isMobile ? <MobileEssProfile /> : <EssProfilePage />} />
              <Route path="attendance" element={isMobile ? <MobileMyAttendance /> : <MyAttendancePage />} />
              <Route path="leave" element={isMobile ? <MobileEssLeave /> : <EssLeavePage />} />
              <Route path="shifts" element={isMobile ? <MobileMyShifts /> : <MyShiftsPage />} />
              <Route path="timesheets" element={isMobile ? <MobileMyTimesheets /> : <MyTimesheetsPage />} />
              <Route path="resignation" element={<DesktopOnlyGuard><MyResignationPage /></DesktopOnlyGuard>} />
              <Route path="helpdesk" element={isMobile ? <MobileEssHelpdesk /> : <EssHelpdeskPage />} />
              <Route path="helpdesk/:id" element={<DesktopOnlyGuard><EssHelpdeskThreadPage /></DesktopOnlyGuard>} />
              <Route path="assets" element={isMobile ? <MobileMyAssets /> : <MyAssets />} />
              <Route path="compensation" element={<DesktopOnlyGuard><MyCompensationPage /></DesktopOnlyGuard>} />
              <Route path="payslips" element={isMobile ? <MobileMyPayslips /> : <MyPayslipsPage />} />

              {/* Phase 16 - Performance */}
              <Route path="performance/goals" element={<DesktopOnlyGuard><EssMyGoalsPage /></DesktopOnlyGuard>} />
              <Route path="performance/reviews" element={<DesktopOnlyGuard><EssMyReviewsPage /></DesktopOnlyGuard>} />
            </Route>

            {/* Phase 26 - Policies (ESS) */}
            <Route path="my-policies">
              <Route index element={isMobile ? <MobileESSPoliciesList /> : <ESSPoliciesList />} />
              <Route path=":versionId" element={isMobile ? <MobileESSPolicyViewer /> : <ESSPolicyViewer />} />
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
