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

// Phase 5 - Core HR (Employee Management)
import { DirectoryPage } from '@/pages/company/employees/directory';
import { AddEmployeePage } from '@/pages/company/employees/add';
import { EmployeeProfilePage } from '@/pages/company/employees/profile';
import { EditEmployeePage } from '@/pages/company/employees/edit';

// Phase 6 - Employee Self Service
import { EssDashboardPage } from '@/pages/ess/dashboard';
import { EssProfilePage } from '@/pages/ess/my-profile';

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

            {/* Phase 5 - Core HR */}
            <Route path="directory" element={<DirectoryPage />} />
            <Route path="directory/new" element={<AddEmployeePage />} />
            <Route path="directory/:id" element={<EmployeeProfilePage />} />
            <Route path="directory/:id/edit" element={<EditEmployeePage />} />

            {/* Phase 6 - ESS */}
            <Route path="me/dashboard" element={<EssDashboardPage />} />
            <Route path="me/profile" element={<EssProfilePage />} />
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
