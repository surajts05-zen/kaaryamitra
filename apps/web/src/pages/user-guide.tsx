import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Settings,
  BookOpen,
  Image as ImageIcon,
  Target,
  ArrowUp,
  ShieldCheck
} from 'lucide-react';

export function UserGuidePage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    const top = document.getElementById('user-guide-top');
    if (top) {
      top.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="user-guide-top" className="flex-1 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          <BookOpen className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">KaaryaMitra User Guide</h2>
          <p className="text-muted-foreground mt-1">Your comprehensive step-by-step manual for the KaaryaMitra HRMS platform.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start relative">
        {/* Left Column: Topic Index */}
        <div className="w-64 shrink-0 hidden md:block sticky top-0 pt-2">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Topic Index</h3>
          <nav className="flex flex-col space-y-4 border-l-2 border-muted/60 pl-4">
            <button onClick={() => scrollToSection('getting-started')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              1. Getting Started: App Shell
            </button>
            <button onClick={() => scrollToSection('admin-guide')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              2. Platform & Company Admin
            </button>
            <button onClick={() => scrollToSection('core-hr')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              3. Core HR: Directory & Profiles
            </button>
            <button onClick={() => scrollToSection('ess')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              4. Employee Self-Service (ESS)
            </button>
            <button onClick={() => scrollToSection('performance')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              5. Performance & Goals
            </button>
            <button onClick={() => scrollToSection('user-roles')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              6. User Types & Roles Matrix
            </button>
            <button onClick={() => scrollToSection('payroll')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              7. Payroll & Compensation
            </button>
            <button onClick={() => scrollToSection('billing')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              8. SaaS Billing & Subscriptions
            </button>
            <button onClick={() => scrollToSection('projects')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              9. Projects & Budgeting
            </button>
            <button onClick={() => scrollToSection('workflows')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              10. Workflow Engine & Approvals
            </button>
            <button onClick={() => scrollToSection('assets')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              11. Asset Management
            </button>
            <button onClick={() => scrollToSection('helpdesk')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              12. HR Helpdesk
            </button>
            <button onClick={() => scrollToSection('library')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              13. Content Library & Policies
            </button>
            <button onClick={() => scrollToSection('resignations')} className="text-left text-sm text-muted-foreground hover:text-primary transition-colors">
              14. Resignations & Offboarding
            </button>
          </nav>
        </div>

        {/* Right Column: Content */}
        <div className="flex-1">
          <div className="space-y-12 pb-12 pt-2">
          
          {/* Section 1: Getting Started */}
          <section id="getting-started" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
              <h3 className="text-2xl font-semibold tracking-tight">Getting Started: Navigating the Multi-tenant App Shell</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              When you log into KaaryaMitra, you are routed to your specific tenant workspace. The application shell is context-aware, meaning the navigation sidebar dynamically adjusts based on your role (e.g., Company Admin, HR Manager, or Employee).
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              
              <CardContent className="p-6 bg-card">
                <h4 className="font-semibold flex items-center gap-2 text-lg">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  Step-by-Step: Navigation Basics
                </h4>
                <ol className="mt-4 space-y-4 list-decimal list-inside text-sm text-muted-foreground marker:text-primary marker:font-semibold">
                  <li className="pl-2">
                    <strong className="text-foreground">Log In:</strong> Enter your credentials to access your secure Tenant Dashboard.
                  </li>
                  <li className="pl-2">
                    <strong className="text-foreground">Use the Sidebar:</strong> On the left, expand or collapse groups like "My Workspace" (for personal tasks) or "Organization" (for admin tasks) by clicking the group headers.
                  </li>
                  <li className="pl-2">
                    <strong className="text-foreground">Global Search:</strong> Press <kbd className="font-mono text-xs bg-muted px-1 mx-1 rounded border">Cmd/Ctrl + K</kbd> to open the command palette and instantly search for employees, departments, or settings.
                  </li>
                  <li className="pl-2">
                    <strong className="text-foreground">AI Assistant:</strong> Look for the chat widget in the bottom right corner (if enabled by your plan) to ask natural language HR questions.
                  </li>
                  <li className="pl-2">
                    <strong className="text-foreground">Theme Toggle:</strong> Click the Sun/Moon icon in the top right header to switch between Light and Dark mode depending on your preference.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </section>

          {/* Section 2: Platform & Company Admin */}
          <section id="admin-guide" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
              <h3 className="text-2xl font-semibold tracking-tight">Platform & Company Admin Guide: Departments, Locations, Roles, and Settings</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              For Company Admins, the initial setup involves modeling the organizational structure. The "Organization" and "Settings" navigation groups provide the tools to build your company hierarchy.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              
              <CardContent className="p-6 bg-card">
                <h4 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Settings className="h-5 w-5 text-primary" />
                  Step-by-Step: Organization Setup
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Add a Department</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Organization {'>'} Departments</strong> using the sidebar.</li>
                      <li className="pl-2">Click the <strong>Add Department</strong> button in the top right.</li>
                      <li className="pl-2">Enter the Department Name and select a Parent Department (if this is a sub-team).</li>
                      <li className="pl-2">Click <strong>Save</strong>. The department is now available for assigning to employees.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Add a Location</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Organization {'>'} Locations</strong>.</li>
                      <li className="pl-2">Click <strong>Add Location</strong>.</li>
                      <li className="pl-2">Fill out the physical address, city, and select the correct timezone.</li>
                      <li className="pl-2">Click <strong>Save</strong>. You can now link specific holiday calendars to this location.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Configure Roles & Permissions</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Settings {'>'} Roles & Permissions</strong>.</li>
                      <li className="pl-2">Select an existing role or click <strong>Create Role</strong>.</li>
                      <li className="pl-2">Check the specific modules and actions (View, Edit, Delete) this role should have access to.</li>
                      <li className="pl-2">Click <strong>Save Role</strong>. Employees assigned this role will immediately inherit these permissions.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 3: Core HR Guide */}
          <section id="core-hr" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
              <h3 className="text-2xl font-semibold tracking-tight">Core HR Guide: Employee Directory and Profiles</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              HR Managers can access the Employee Directory to oversee the entire workforce, manage reporting lines, and update comprehensive employee profiles.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              
              <CardContent className="p-6 bg-card">
                <h4 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  Step-by-Step: Managing Employees
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to View the Org Chart</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Organization {'>'} Emp Directory</strong>.</li>
                      <li className="pl-2">At the top of the directory, click the <strong>Org Chart</strong> tab (next to the List tab).</li>
                      <li className="pl-2">Expand or collapse nodes to visualize reporting hierarchies across the company.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Add a New Employee</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">From the <strong>Emp Directory</strong>, click <strong>Add Employee</strong>.</li>
                      <li className="pl-2">Fill in their personal details (Name, Work Email) and job details (Title, Join Date).</li>
                      <li className="pl-2">Assign them to a <strong>Department</strong>, a <strong>Location</strong>, and select their <strong>Reporting Manager</strong>.</li>
                      <li className="pl-2">Click <strong>Save</strong>. The system will create their profile and they will appear in the directory.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Manage an Employee Profile</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Click on any employee's name in the directory to open their full profile.</li>
                      <li className="pl-2">Use the profile tabs to navigate between <strong>Personal Info</strong>, <strong>Job History</strong>, and <strong>Documents</strong>.</li>
                      <li className="pl-2">Click the <strong>Edit</strong> button in any section to update their records (e.g., changing their manager or department).</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 4: Employee Self-Service (ESS) */}
          <section id="ess" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">4</div>
              <h3 className="text-2xl font-semibold tracking-tight">Employee Self-Service (ESS): My Leaves, Shifts, Timesheets, and Helpdesk</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              The "My Workspace" section empowers employees to handle day-to-day HR tasks independently without needing to contact HR.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              
              <CardContent className="p-6 bg-card">
                <h4 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Step-by-Step: Self-Service Modules
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Apply for Leave</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>My Workspace {'>'} My Leaves</strong>.</li>
                      <li className="pl-2">Review your available leave balances in the top cards.</li>
                      <li className="pl-2">Click <strong>Apply Leave</strong>.</li>
                      <li className="pl-2">Select the <strong>Leave Type</strong> (e.g., Sick, Casual), choose the start/end dates, and optionally add a reason.</li>
                      <li className="pl-2">Click <strong>Submit</strong>. Your request is automatically routed to your manager for approval.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Log Timesheets</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>My Workspace {'>'} My Timesheets</strong>.</li>
                      <li className="pl-2">Select the current week from the date picker.</li>
                      <li className="pl-2">Enter the hours worked per day against your assigned projects or generic work tasks.</li>
                      <li className="pl-2">Click <strong>Submit Timesheet</strong> at the end of the week.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Raise a Helpdesk Ticket</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>My Workspace {'>'} My Helpdesk</strong>.</li>
                      <li className="pl-2">Click <strong>New Ticket</strong>.</li>
                      <li className="pl-2">Select the relevant category (e.g., IT Support, Payroll Issue, Facilities).</li>
                      <li className="pl-2">Provide a descriptive subject and detailed explanation. You can also attach screenshots.</li>
                      <li className="pl-2">Click <strong>Submit</strong>. You can track the status and communicate with the support agent directly in the thread.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 5: Performance & Goals */}
          <section id="performance" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">5</div>
              <h3 className="text-2xl font-semibold tracking-tight">Performance & Goals: Navigating Review Cycles</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              The Performance management module enables goal-setting and structured feedback across the organization.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              
              <CardContent className="p-6 bg-card">
                <h4 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  Step-by-Step: Reviews and Feedback
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Create and Track a Goal</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>My Workspace {'>'} My Goals</strong>.</li>
                      <li className="pl-2">Click <strong>Create Goal</strong>.</li>
                      <li className="pl-2">Define the Objective, assign a Target Date, and establish measurable Key Results (OKRs).</li>
                      <li className="pl-2">Click <strong>Save</strong>.</li>
                      <li className="pl-2">Periodically return to this page to update your progress percentage and add comments.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Participate in a Review Cycle</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">When HR launches a review cycle (e.g., Annual Appraisals), you will receive a notification in the top bar.</li>
                      <li className="pl-2">Navigate to <strong>My Workspace {'>'} My Reviews</strong>.</li>
                      <li className="pl-2">Click on the active review cycle to open your appraisal form.</li>
                      <li className="pl-2">Complete the self-evaluation questions, rating your performance and providing comments.</li>
                      <li className="pl-2">Click <strong>Submit to Manager</strong>.</li>
                      <li className="pl-2">If you are a manager, navigate to <strong>My Team {'>'} Team Reviews</strong> to see pending appraisals from your direct reports. Fill out your evaluation and click <strong>Complete Review</strong>.</li>
                      <li className="pl-2">Once finalized, both you and HR can view the historical ratings in your Employee Profile.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 6: User Types & Roles */}
          <section id="user-roles" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">6</div>
              <h3 className="text-2xl font-semibold tracking-tight">User Types, Roles, & Permission Guidelines</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              KaaryaMitra uses a fine-grained Role-Based Access Control (RBAC) model to ensure security, privacy, and appropriate access across multi-tenant workspaces.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              
              <CardContent className="p-6 bg-card">
                <h4 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Role Breakdown & Usage Scenarios
                </h4>
                
                <div className="space-y-6">
                  {/* Super Admin */}
                  <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-base">1. Super Admin (Platform Level)</span>
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">Platform Scope</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Who it's for:</strong> System Engineers and Platform Owners.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Key Capabilities:</strong> Multi-tenant workspace creation, global platform settings, system subscription management, database diagnostics, and cross-tenant maintenance.
                    </p>
                    <p className="text-xs text-foreground/80 font-medium">
                      👉 <strong>When to use:</strong> When onboarding a brand new company onto KaaryaMitra or modifying global system architecture.
                    </p>
                  </div>

                  {/* Company Admin */}
                  <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-base">2. Company Admin (Tenant Level)</span>
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">Full Tenant Scope</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Who it's for:</strong> Executive Officers, COOs, and HR Directors.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Key Capabilities:</strong> Full access to company configuration including Departments, Locations, Designations, Workflows, Custom Roles, and Security Settings.
                    </p>
                    <p className="text-xs text-foreground/80 font-medium">
                      👉 <strong>When to use:</strong> Initial company setup, establishing approval hierarchies, configuring custom workflows, or assigning roles to HR staff.
                    </p>
                  </div>

                  {/* HR Manager */}
                  <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-base">3. HR Manager</span>
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">HR & Ops Scope</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Who it's for:</strong> HR Personnel, People Operations, and Personnel Officers.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Key Capabilities:</strong> Employee Directory management, onboarding new hires, asset allocation, resignation processing, company helpdesk oversight, and appraisal cycle management.
                    </p>
                    <p className="text-xs text-foreground/80 font-medium">
                      👉 <strong>When to use:</strong> For day-to-day workforce management, maintaining employee profiles, managing company assets, and launching annual review cycles.
                    </p>
                  </div>

                  {/* Reporting Manager */}
                  <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-base">4. Reporting Manager / Line Manager</span>
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">Team Scope</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Who it's for:</strong> Team Leads, Engineering Leads, and Department Managers.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Key Capabilities:</strong> Reviewing and approving direct reports' leave requests, weekly timesheets, shift changes, and resignation requests via the Approvals Inbox. Conducting manager performance reviews.
                    </p>
                    <p className="text-xs text-foreground/80 font-medium">
                      👉 <strong>When to use:</strong> When managing direct reports, reviewing team attendance/timesheets, and completing team performance assessments.
                    </p>
                  </div>

                  {/* Employee */}
                  <div className="p-4 rounded-lg border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-base">5. Employee (Standard User)</span>
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">Self Scope (ESS)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Who it's for:</strong> All individual contributors and team members.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Key Capabilities:</strong> Employee Self-Service (ESS) features: applying for leave, logging project timesheets, viewing shift schedules, raising helpdesk tickets, managing personal documents, and setting performance goals.
                    </p>
                    <p className="text-xs text-foreground/80 font-medium">
                      👉 <strong>When to use:</strong> Daily work activities, requesting time off, logging weekly work hours, and self-evaluations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 7: Payroll & Compensation */}
          <section id="payroll" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">7</div>
              <h3 className="text-2xl font-semibold tracking-tight">Payroll & Compensation</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              The Payroll module automates payslip generation, statutory compliance, and payroll lifecycle management.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              
              <CardContent className="p-6 bg-card">
                <h4 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  Step-by-Step: Managing Payroll
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Run Payroll</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Payroll {'>'} Payroll Runs</strong>.</li>
                      <li className="pl-2">Click <strong>Run Payroll</strong> and provide details such as Name, Period, and Payment Date. You can also provide manual overrides for <strong>Loss of Pay (LOP)</strong> days if needed.</li>
                      <li className="pl-2">The system will automatically query the Leave module for any <strong>Unpaid Leaves</strong> overlapping with the payroll period. If no manual override is provided, these Unpaid Leaves will be automatically deducted.</li>
                      <li className="pl-2">The system then calculates prorated working days, applies statutory rules, and generates DRAFT payslips.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Update/Override a DRAFT Payroll (CSV Upload)</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Click <strong>View</strong> on a DRAFT payroll run.</li>
                      <li className="pl-2">Click the <strong>Upload CSV</strong> button.</li>
                      <li className="pl-2">Upload a CSV containing <code className="text-xs bg-muted p-0.5 rounded">EmployeeEmail</code>, <code className="text-xs bg-muted p-0.5 rounded">WorkingDays</code>, <code className="text-xs bg-muted p-0.5 rounded">GrossEarnings</code>, <code className="text-xs bg-muted p-0.5 rounded">TotalDeductions</code>, <code className="text-xs bg-muted p-0.5 rounded">NetPay</code> and any additional columns for dynamic components.</li>
                      <li className="pl-2">The system will validate the file, apply updates, and show you a summary of successful or skipped records.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Finalize Payroll</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Once accurate, change the DRAFT status to <strong>REVIEW</strong>.</li>
                      <li className="pl-2">After finance review, update to <strong>APPROVED</strong>.</li>
                      <li className="pl-2">Click <strong>Finalize (Lock)</strong> to freeze the records permanently. No further edits can be made.</li>
                      <li className="pl-2">Finally, mark it as <strong>PAID</strong> once salaries are disbursed. This action will automatically release the Payslips to all employees.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How Employees Access Payslips</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Employees can navigate to <strong>My Workspace {'>'} Payslips</strong>.</li>
                      <li className="pl-2">Here, they can view their comprehensive salary history and click the <strong>Download PDF</strong> button for any finalized month to get a branded, professional payslip.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 8: SaaS Billing & Subscriptions */}
          <section id="billing" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">8</div>
              <h3 className="text-2xl font-semibold tracking-tight">SaaS Billing & Subscriptions (Razorpay Integration)</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              KaaryaMitra includes a full-fledged billing module. Super Admins configure global subscription plans and payment gateways, while Company Admins can self-serve their subscription upgrades.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              
              <CardContent className="p-6 bg-card">
                <h4 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  Step-by-Step: Managing Billing
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">For Super Admins: Configuring Razorpay & Plans</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Platform Billing {'>'} Razorpay Settings</strong>.</li>
                      <li className="pl-2">Enter your Razorpay Key ID and Key Secret to enable payment processing globally.</li>
                      <li className="pl-2">Navigate to <strong>Platform Billing {'>'} Plans & Add-ons</strong>.</li>
                      <li className="pl-2">Edit the prices for the STARTER, GROWTH, and ENTERPRISE plans and insert the corresponding Razorpay Plan IDs.</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">For Company Admins: Upgrading Your Plan</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Settings {'>'} Billing & Plans</strong> in your Workspace.</li>
                      <li className="pl-2">Click <strong>Upgrade Plan</strong> to open the Plan Comparison page.</li>
                      <li className="pl-2">Select a plan (e.g., STARTER) and choose any optional Add-ons (like Payroll).</li>
                      <li className="pl-2">Click <strong>Proceed to Payment</strong>. You will be redirected to the secure Razorpay checkout.</li>
                      <li className="pl-2">Once the payment is successful, your tenant's feature flags are automatically unlocked!</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">For Company Admins: Downloading Invoices</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Settings {'>'} Billing & Plans</strong>.</li>
                      <li className="pl-2">Scroll down to the <strong>Billing History</strong> table.</li>
                      <li className="pl-2">Click the download icon next to any PAID invoice to save a PDF copy for your accounting records.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Section 9: Projects & Budgeting */}
          <section id="projects" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">9</div>
              <h3 className="text-2xl font-semibold tracking-tight">Projects & Budgeting</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              Track project progress, allocate budgets, and manage clients and vendors directly within KaaryaMitra to ensure accurate cost tracking and resource management.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              <CardContent className="p-6 bg-card">
                <h4 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  Step-by-Step: Managing Projects & Budgets
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Create and Configure a Project</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Projects</strong> via the main sidebar.</li>
                      <li className="pl-2">Click <strong>New Project</strong> and enter the project Name, assigned Client, Start/End Dates, and the overall allocated Budget.</li>
                      <li className="pl-2">Assign internal team members or external vendors to the project. Once assigned, employees can seamlessly log timesheets against this specific project in their ESS portal.</li>
                      <li className="pl-2">Define project milestones and link them to budget release phases if applicable.</li>
                    </ol>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Track Budgets and Expenses</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to the <strong>Budgets Dashboard</strong> to see a macro view of all project finances.</li>
                      <li className="pl-2">View real-time <strong>burn rates</strong> and profitability analytics, which are automatically calculated based on approved expenses, vendor invoices, and employee timesheets.</li>
                      <li className="pl-2">Managers can submit <strong>Purchase Orders</strong> or <strong>Expense Requests</strong> directly against specific project budgets.</li>
                      <li className="pl-2">Set up automated alerts when a project's budget crosses 80% or 90% utilization.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 10: Workflow Engine & Approvals */}
          <section id="workflows" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">10</div>
              <h3 className="text-2xl font-semibold tracking-tight">Workflow Engine & Approvals</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              A highly configurable routing engine that centralizes approvals for all company-wide requests—eliminating email chains and ensuring compliance.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              <CardContent className="p-6 bg-card">
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">Configuring Workflows (For Admins)</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Settings {'>'} Workflows</strong>.</li>
                      <li className="pl-2">Create a new workflow by defining a <strong>Trigger</strong> (e.g., Expense Request &gt; $500).</li>
                      <li className="pl-2">Set up multi-level approval chains (e.g., Line Manager -&gt; Department Head -&gt; Finance). You can use parallel or sequential routing.</li>
                      <li className="pl-2">Configure <strong>Escalation Rules</strong> (e.g., auto-escalate to the next approver if no action is taken within 48 hours).</li>
                    </ol>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">Using the Unified Approvals Inbox</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Approvals</strong> in the sidebar. This inbox aggregates pending requests across Leave, Budgets, Policies, and more.</li>
                      <li className="pl-2">Review the request details and audit trail. Add optional comments for context.</li>
                      <li className="pl-2">Click <strong>Approve</strong>, <strong>Reject</strong>, or <strong>Request Clarification</strong>.</li>
                      <li className="pl-2">If you are going on leave, use the <strong>Delegation</strong> feature to temporarily route your approvals to a trusted colleague.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 11: Asset Management */}
          <section id="assets" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">11</div>
              <h3 className="text-2xl font-semibold tracking-tight">Asset Management</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              Keep a rigorous inventory of company hardware, software licenses, and access cards assigned to employees throughout their lifecycle.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              <CardContent className="p-6 bg-card">
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Inventory and Assign an Asset</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Assets {'>'} Asset Catalog</strong>.</li>
                      <li className="pl-2">Click <strong>Add Asset</strong> (e.g., MacBook Pro, Adobe Creative Cloud License) and record its serial number, purchase date, warranty expiry, and current condition.</li>
                      <li className="pl-2">Click <strong>Assign</strong> and select an employee. The employee will receive an ESS notification requiring them to digitally acknowledge receipt of the asset.</li>
                    </ol>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">Asset Maintenance and Offboarding</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Use the <strong>Maintenance</strong> tab to log repair history and associated costs for physical assets.</li>
                      <li className="pl-2">When an employee resigns, any assets assigned to them are <strong>automatically flagged</strong> in the IT Clearance Checklist, ensuring no equipment is lost during offboarding.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 12: HR Helpdesk */}
          <section id="helpdesk" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">12</div>
              <h3 className="text-2xl font-semibold tracking-tight">HR Helpdesk</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              A built-in ticketing system designed to streamline employee queries, resolve grievances, and manage IT support without external tools.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              <CardContent className="p-6 bg-card">
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How Employees Raise Tickets</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Employees navigate to <strong>My Workspace {'>'} My Helpdesk</strong>.</li>
                      <li className="pl-2">Click <strong>New Ticket</strong> and select a category (e.g., Payroll Issue, Hardware Repair, Policy Query). Categories dictate the target SLA.</li>
                      <li className="pl-2">Provide a description and attach relevant screenshots, then submit.</li>
                    </ol>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How HR/Admins Resolve Tickets</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Company Helpdesk</strong> (visible to Admins and HR only).</li>
                      <li className="pl-2">View the centralized queue. Tickets are automatically sorted by Priority and SLA breach proximity.</li>
                      <li className="pl-2">Click a ticket to view the conversation thread. Use the rich text editor to reply to the employee.</li>
                      <li className="pl-2">Once the issue is fixed, update the ticket status to <strong>Resolved</strong>. Helpdesk analytics will track average resolution times.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 13: Content Library, Policies & Announcements */}
          <section id="library" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">13</div>
              <h3 className="text-2xl font-semibold tracking-tight">Content Library, Policies & Announcements</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              A powerful CMS for drafting organizational policies, compiling employee handbooks, and broadcasting company-wide announcements.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              <CardContent className="p-6 bg-card">
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Publish Company-Wide Announcements</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Library {'>'} Announcements</strong>.</li>
                      <li className="pl-2">Click <strong>New Announcement</strong> and use the rich-text block editor to craft your message (e.g., Townhall updates, holiday greetings, system downtime notices). You can embed images and tables.</li>
                      <li className="pl-2">Select the target audience (Entire Company, Specific Departments, or Specific Locations).</li>
                      <li className="pl-2">Click <strong>Publish Now</strong> or <strong>Schedule for Later</strong>. Once published, the announcement will prominently display on the targeted employees' ESS Dashboard.</li>
                    </ol>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">How to Draft and Enforce Policies</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Navigate to <strong>Library {'>'} Editor</strong>. Choose to start from scratch or use one of the 25+ standard HR templates (e.g., Remote Work Policy, Code of Conduct).</li>
                      <li className="pl-2">Use the drag-and-drop editor to organize headings, FAQs, and callouts.</li>
                      <li className="pl-2">Click <strong>Submit for Approval</strong>. The policy is routed through the Workflow Engine to the required executives.</li>
                      <li className="pl-2">Once approved, the policy becomes <strong>Published</strong> with a specific effective date. Historical versions are automatically preserved for auditing.</li>
                      <li className="pl-2"><strong>Employee Acknowledgement:</strong> You can enforce digital signatures. Employees will be prompted to read and acknowledge the new policy, and the system will send automated overdue reminders to non-compliant staff.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 14: Resignations & Offboarding */}
          <section id="resignations" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">14</div>
              <h3 className="text-2xl font-semibold tracking-tight">Resignations & Offboarding</h3>
            </div>
            <p className="text-muted-foreground ml-11">
              Securely manage the employee exit lifecycle, ensuring a smooth transition from resignation submission to final settlement and account deactivation.
            </p>
            <Card className="ml-11 overflow-hidden border-muted/60 shadow-sm">
              <CardContent className="p-6 bg-card">
                <div className="space-y-6">
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">Initiating the Exit Process</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">Employees submit a formal resignation request via <strong>My Workspace {'>'} Resign</strong>, specifying their reason and requested last working day.</li>
                      <li className="pl-2">The Reporting Manager receives an immediate notification. They must review the request, negotiate or confirm the Last Working Day (based on the company notice period policy), and approve it.</li>
                      <li className="pl-2">Once manager-approved, HR is notified to take over the offboarding pipeline.</li>
                    </ol>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground text-sm mb-2">Clearance Checklists & Final Settlement</h5>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li className="pl-2">HR navigates to <strong>Resignations</strong> to monitor the employee's notice period countdown.</li>
                      <li className="pl-2">The system automatically triggers the <strong>Clearance Checklist</strong>, alerting IT to collect assets, Finance to clear dues, and Admin to revoke access cards.</li>
                      <li className="pl-2">HR schedules and logs notes from the Exit Interview.</li>
                      <li className="pl-2">On the last working day, HR finalizes the <strong>Full and Final (F&F) Settlement</strong>, which integrates with the Payroll Engine to disburse remaining leave encashments and deduct outstanding loans.</li>
                      <li className="pl-2">The employee's KaaryaMitra account is automatically deactivated upon completion of the F&F workflow.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-24 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all z-50 flex items-center justify-center"
        title="Back to Topic Index"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
