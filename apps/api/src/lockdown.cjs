const fs = require('fs');
const path = require('path');

const appTsPath = path.join(__dirname, 'app.ts');
let content = fs.readFileSync(appTsPath, 'utf-8');

const mappings = {
  'orgRouter': 'core_hr',
  'employeesRouter': 'core_hr',
  'employeeAssetsRouter': 'assets',
  'employeeChecklistsRouter': 'core_hr',
  'resignationsRouter': 'core_hr',
  'essLeaveRouter': 'leave',
  'meAttendanceRouter': 'attendance',
  'adminAttendanceRouter': 'attendance',
  'timesheetsRouter': 'attendance',
  'leaveRouter': 'leave',
  'leaveApprovalsRouter': 'leave',
  'workflowRouter': 'core_hr',
  'rolesRouter': 'core_hr',
  'shiftsRouter': 'attendance',
  'shiftSwapsRouter': 'attendance',
  'documentsRouter': 'core_hr',
  'assetsRouter': 'assets',
  'templatesRouter': 'core_hr',
  'holidaysRouter': 'core_hr',
  'helpdeskAdminRouter': 'helpdesk',
  'helpdeskEssRouter': 'helpdesk',
  'performanceRouter': 'performance',
  'compensationRouter': 'payroll',
  'payrollRouter': 'payroll',
  'policiesRouter': 'library',
  'libraryRouter': 'library',
  'meetingsRouter': 'core_hr',
  'roomsRouter': 'core_hr',
  'reportsRouter': 'reports',
  'costCentersRouter': 'projects',
  'budgetCategoriesRouter': 'projects',
  'projectsRouter': 'projects',
  'milestonesRouter': 'projects',
  'budgetAllocationsRouter': 'projects',
  'budgetRequestsRouter': 'projects',
  'projectExpensesRouter': 'projects',
  'budgetDashboardRouter': 'projects',
  'apiKeysRouter': 'developer',
  'webhooksRouter': 'developer',
  'integrationsRouter': 'developer',
};

// We will find lines matching: app.use(..., requireAuth, resolveTenant, [Router]);
// And replace them with: app.use(..., requireAuth, resolveTenant, requireFeature('...'), [Router]);

// We need to carefully only modify if not already modified
for (const [routerName, featureKey] of Object.entries(mappings)) {
  const regex = new RegExp(`(app\\.use\\([^,]+,\\s*requireAuth,\\s*resolveTenant,\\s*)(?!requireFeature)(${routerName}\\);?)`, 'g');
  content = content.replace(regex, `$1requireFeature('${featureKey}'), $2`);
  
  // also handle the case where it might have an extra middleware like aiRateLimiter (though not in mappings)
}

fs.writeFileSync(appTsPath, content, 'utf-8');
console.log('Done!');
