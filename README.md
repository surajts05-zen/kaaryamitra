# <img src="KM- Logo.png" alt="KaaryaMitra" height="40"/> KaaryaMitra HRMS

> **The single source of truth for the KaaryaMitra Human Resource Management System.**

[![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=flat-square)](.)
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20PostgreSQL-1B5E3B?style=flat-square)](.)
[![Multi-Tenant](https://img.shields.io/badge/Architecture-Multi--Tenant%20SaaS-A8E600?style=flat-square&labelColor=0D4F3C)](.)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](.)

---

## 📋 Table of Contents

1. [Product Vision](#1-product-vision)
2. [Brand Identity](#2-brand-identity)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Multi-Tenant Model](#5-multi-tenant-model)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Phased Implementation Roadmap](#7-phased-implementation-roadmap)
8. [MVP Scope](#8-mvp-scope)
9. [Core Architectural Components](#9-core-architectural-components)
10. [UX / UI Direction](#10-ux--ui-direction)
11. [Directory Structure](#11-directory-structure)
12. [Getting Started](#12-getting-started)
13. [Development Guidelines](#13-development-guidelines)
14. [Long-Term Product Direction](#14-long-term-product-direction)

---

## 1. Product Vision

KaaryaMitra is a **modern, multi-tenant HR management platform** that combines:

- The **functional depth** of enterprise HRMS platforms like OrangeHRM
- The **simplicity and polish** of modern SaaS products
- The **workflow and employee-experience** capabilities of next-generation HR tools

> **Design Principle:** *"Professional enough for enterprise HR, friendly enough for Gen-Z."*

The platform will serve as a **complete HR operating system** — from hire to retire — delivered as a true SaaS product with full tenant isolation, configurable branding, AI-assisted insights, and an open integration ecosystem.

---

## 2. Brand Identity

### Color Palette (from KaaryaMitra Logo)

| Token | Hex | Usage |
|-------|-----|-------|
| `--km-lime` | `#A8E600` | Primary accent, CTAs, highlights |
| `--km-green` | `#4CAF50` | Mid-tone, hover states, success |
| `--km-forest` | `#1B5E3B` | Deep backgrounds, headers |
| `--km-dark` | `#0D4F3C` | Dark mode surfaces, typography |
| `--km-white` | `#FFFFFF` | Light backgrounds, card surfaces |

### Typography

- **Primary:** `Inter` (Google Fonts)
- **Alternative:** `Geist` or `Manrope`
- **Display:** `Inter` with variable font weights (300–800)

### Design Vocabulary

- Rounded cards (`border-radius: 12–16px`)
- Subtle shadows (elevation system)
- Restrained gradients (lime → green)
- Polished micro-interactions and transitions
- Consistent 8px spacing grid

---

## 3. Technology Stack

### Frontend

| Concern | Technology |
|---------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Component System | shadcn/ui |
| Data Fetching | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| State | Zustand (client state) |
| Routing | React Router v6 |

### Backend

| Concern | Technology |
|---------|----------|
| Runtime | Node.js + TypeScript |
| Framework | **Express.js** |
| API Style | REST (OpenAPI-ready conventions) |
| Database | PostgreSQL 15+ |
| ORM | Prisma |
| Authentication | **Email/Password (primary)** + Google OAuth 2.0 / OIDC |
| Storage | S3-compatible abstraction (MinIO / AWS S3) |
| Background Jobs | BullMQ + Redis (when required) |
| Caching | Redis |

### Infrastructure

| Concern | Technology |
|---------|----------|
| Monorepo | **npm workspaces** |
| Initial Deployment | Local dev (no Docker for local) |
| Production Deployment | **Dokploy** (self-hosted PaaS, Docker Compose) |
| Tenant Routing | Path-based `/t/{slug}/` (e.g. `/t/acmecorp/dashboard`) |
| API Docs | OpenAPI / Swagger |
| Testing | Vitest (FE) + Jest (BE) |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    KaaryaMitra Platform                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Super Admin  │  │ Company Admin│  │   Employee   │  │
│  │   Dashboard   │  │  Dashboard   │  │ Self-Service │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         └─────────────────┼──────────────────┘          │
│                     React + TypeScript                    │
│                      (Vite + shadcn/ui)                  │
└─────────────────────────────┬───────────────────────────┘
                              │ REST API (HTTPS)
┌─────────────────────────────▼───────────────────────────┐
│                 Node.js + TypeScript API                 │
│                                                          │
│  Auth │ Tenant Context │ RBAC │ Middleware │ Audit Log   │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Core HR  │ │  Leave   │ │Attendance│ │Workflows │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Documents │ │Onboarding│ │Performance│ │Analytics │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│             Prisma ORM  │  Redis / BullMQ               │
└─────────────────────────┬───────────────────────────────┘
                          │
        ┌─────────────────┼────────────────┐
        ▼                 ▼                ▼
   PostgreSQL           Redis         S3 Storage
  (per-schema or      (Cache +       (Documents,
  shared + RLS)       Queues)        Avatars, Files)
```

---

## 5. Multi-Tenant Model

KaaryaMitra is a **true SaaS multi-tenant platform** from day one:

- **Tenant Isolation:** Every business entity carries `tenant_id`; context is derived **server-side only**
- **Browser Trust:** The browser is never trusted to select or override `tenant_id`
- **Data Separation:** Shared PostgreSQL schema with row-level `tenant_id` enforcement
- **Future-Ready:** Architecture is compatible with schema-per-tenant or database-per-tenant for enterprise isolation
- **Branding:** Each tenant has independent logo, colors, domain, and notification templates

### Tenant Hierarchy

```
Platform (KaaryaMitra)
  └── Tenant / Company
        ├── Departments
        ├── Teams
        ├── Locations
        └── Employees
              ├── Roles & Permissions
              └── Self-Service Portal
```

---

## 6. User Roles & Permissions

| Role | Scope | Capabilities |
|------|-------|-------------|
| **Super Admin** | Platform | Tenant management, plans, feature flags, system config, platform analytics |
| **Company Admin** | Tenant | All HR functions, org settings, reports, employee management |
| **HR Manager** | Tenant | Employee records, leave, attendance, documents, workflows |
| **Manager** | Tenant | Team management, approvals, performance reviews |
| **Employee** | Self | Self-service portal, requests, documents, timesheet |

> RBAC maps roles to **granular permissions** rather than hard-coded access rules. Custom roles can be defined per tenant.

---

## 7. Phased Implementation Roadmap

### 🏗️ Phase 0 — Product & Architecture Foundation
> *Estimated: Weeks 1–2*

**Goal:** Runnable monorepo, clean conventions, core infrastructure.

- [ ] Monorepo setup (frontend + backend + shared types)
- [ ] TypeScript configuration and coding standards (ESLint, Prettier)
- [ ] Environment configuration (`.env` management, config service)
- [ ] PostgreSQL setup + Prisma schema foundation
- [ ] Database migration system
- [ ] React application scaffold (Vite + Tailwind + shadcn/ui)
- [ ] Node.js API scaffold (Express/Fastify + TypeScript)
- [ ] API error handling, structured logging
- [ ] Authentication abstractions (JWT + session management)
- [ ] Multi-tenancy middleware scaffold
- [ ] RBAC / permission engine scaffold
- [ ] S3 storage abstraction
- [ ] Notification service abstraction
- [ ] Audit log engine foundation

---

### 🎨 Phase 1 — Design System & UX Foundation
> *Estimated: Weeks 3–4*

**Goal:** A complete, consistent, on-brand component system.

- [ ] KaaryaMitra design tokens (colors, typography, spacing, shadows)
- [ ] Application shell (sidebar nav, top bar, mobile nav)
- [ ] Light/dark mode with system-preference detection
- [ ] Product branding + tenant branding injection
- [ ] Core component library:
  - Buttons, Badges, Tags, Pills
  - Form inputs, Selects, Date pickers, File upload
  - Tables with sorting, filtering, pagination
  - Modals, Drawers, Popovers, Tooltips
  - Cards, Stats widgets, Timeline
  - Calendar component
  - Notification toasts
  - Skeleton loaders, Empty states, Error states
- [ ] Command palette (`Cmd+K` / `Ctrl+K`)
- [ ] Global search UI
- [ ] Responsive/mobile-first layouts
- [ ] Page transition animations

---

### 🔐 Phase 2 — Authentication & Multi-Tenancy
> *Estimated: Weeks 5–6*

**Goal:** Secure, multi-tenant login and session management.

- [ ] Google OAuth 2.0 / OIDC Sign-In
- [ ] Secure session management (HTTP-only cookies / refresh tokens)
- [ ] Tenant resolution and context middleware
- [ ] User account creation and profile setup
- [ ] Role assignment on tenant joining
- [ ] Permission enforcement middleware
- [ ] Auth error handling (invalid token, suspended account, etc.)
- [ ] Password-less / magic link flow (future-ready scaffold)

---

### 👑 Phase 3 — Super Admin
> *Estimated: Weeks 7–8*

**Goal:** Platform control center for KaaryaMitra operators.

- [ ] Super Admin dashboard (platform KPIs, tenant stats)
- [ ] Tenant creation wizard
- [ ] Tenant list, search, and detail views
- [ ] Tenant activation / suspension / deletion
- [ ] Per-tenant feature flags and plan configuration
- [ ] Tenant usage metrics (employees, storage, API calls)
- [ ] Super Admin audit logs
- [ ] Support impersonation (with audit trail)
- [ ] Platform-level system configuration

---

### 🏢 Phase 4 — Company Administration
> *Estimated: Weeks 9–10*

**Goal:** Organization setup and configuration for each tenant.

- [ ] Company dashboard
- [ ] Company profile and settings
- [ ] Departments CRUD
- [ ] Teams CRUD
- [ ] Locations / Offices management
- [ ] Designations / Job Titles
- [ ] Job Levels / Grades / Bands
- [ ] Cost Centers
- [ ] Organization hierarchy visualization
- [ ] Company policies (working days, hours, probation period)
- [ ] Holiday calendar (per location)

---

### 👥 Phase 5 — Core HR (Employee Management)
> *Estimated: Weeks 11–13*

**Goal:** The employee master — the heart of the HRMS.

- [ ] Employee directory (search, filter, sort, grid/list views)
- [ ] Employee profile (personal, contact, work, emergency info)
- [ ] Employment records (joining date, employment type, status)
- [ ] Manager/reportee relationships
- [ ] Employee history (promotions, transfers, role changes)
- [ ] Employee timeline view
- [ ] Document section per employee
- [ ] Bulk employee import (CSV/Excel)
- [ ] Bulk operations (assign manager, update department, etc.)
- [ ] Employee export (CSV/Excel/PDF)
- [ ] Employee offboarding status

---

### 🙋 Phase 6 — Employee Self-Service
> *Estimated: Weeks 14–15*

**Goal:** Empower employees to manage their own HR needs.

- [ ] Employee dashboard (announcements, quick actions, pending tasks)
- [ ] Profile self-edit (with approval workflow option)
- [ ] Personal document upload and management
- [ ] Leave balance visibility
- [ ] Attendance visibility (own records)
- [ ] Request submission (address/bank/name change)
- [x] Email notification integration (via Nodemailer)
- [x] Webhook infrastructure stub
- [ ] Company announcements feed

---

### 🌴 Phase 7 — Leave Management
> *Estimated: Weeks 16–19*

> **Post-MVP Priority:** After the MVP (Phases 0–9) ships, **Phase 10 (Attendance)** is next, followed by **Phase 10.5 (AI)**. See the Implementation Plan for details on Attendance Tracker Global code reuse.

**Goal:** Best-in-class leave management with policy flexibility.

- [ ] Leave type configuration (casual, sick, earned, etc.)
- [ ] Leave policies (eligibility, max balance, negative balance)
- [ ] Accrual engine (monthly, yearly, custom frequency)
- [ ] Pro-rata rules (mid-month joining)
- [ ] Carry-forward rules and balance expiry
- [ ] Encashment configuration
- [ ] Half-day leave support
- [ ] Holiday calendar integration (weekends + public holidays)
- [ ] Leave application flow (single/multi-day)
- [ ] Approval workflow integration
- [ ] Leave calendar (team/org view)
- [ ] Leave balance adjustments (manual)
- [ ] Leave reports (utilization, balance, trends)
- [ ] Manager leave approval dashboard

---

### ⚙️ Phase 8 — Workflow Engine
> *Estimated: Weeks 20–22*

**Goal:** Flexible, configurable approval and automation engine.

- [ ] Trigger → Condition → Action model
- [ ] Multi-level approval chains (sequential/parallel)
- [ ] Conditional routing (based on employee/department/amount)
- [ ] Task assignment and deadlines
- [ ] Escalation rules (auto-escalate on timeout)
- [ ] Workflow history and audit trail
- [ ] Workflow templates for common HR processes
- [ ] Delegation support (approver away/on-leave)

---

### 🔔 Phase 9 — Notifications & Webhooks
> *Estimated: Week 23*

**Goal:** Multi-channel notification system.

- [x] In-app notification center (real-time, mark read, clear)
- [x] Email notifications (Nodemailer / transactional provider)
- [x] Notification templates (per event type, per tenant branding)
- [x] Employee notification preferences
- [x] Digest email option
- [x] Architecture ready for: Push (FCM), SMS, WhatsApp

---

### 🕐 Phase 10 — Attendance
> *Estimated: Weeks 24–26*

**Goal:** Flexible attendance tracking with multiple capture modes.

- [ ] Check-in / Check-out (web-based)
- [ ] Break tracking
- [ ] Attendance correction requests
- [ ] Late arrival / early departure rules
- [ ] WFH / On-duty marking
- [ ] Overtime tracking foundation
- [ ] Attendance regularization workflow
- [ ] Attendance reports
- [ ] Integration-ready architecture: QR code, GPS, mobile, biometric API, RFID

---

### 🗓️ Phase 11 — Shifts & Timesheets
> *Estimated: Weeks 27–29*

**Goal:** Shift scheduling and timesheet management.

- [ ] Shift types (fixed, flexible, rotating, night shift)
- [ ] Work schedule configuration
- [ ] Shift assignment (individual / bulk)
- [ ] Timesheet submission (daily/weekly)
- [ ] Timesheet approval workflow
- [ ] Overtime calculation rules
- [ ] Compensatory-off (comp-off) management
- [ ] Shift swap requests

---

### 📂 Phase 12 — Documents
> *Estimated: Weeks 30–31*

**Goal:** Centralized document management with access controls.

- [ ] Employee document repository
- [ ] Document categories and tags
- [ ] Document versioning
- [ ] Access control (who can view/edit/delete)
- [ ] Preview (PDF, image) + secure download
- [ ] Document expiry tracking
- [ ] Automated expiry reminder notifications
- [ ] Audit trail per document
- [ ] Company-level document templates

---

### 🚀 Phase 13 — Onboarding & Offboarding
> *Estimated: Weeks 32–34*

**Goal:** Structured, checklist-driven onboarding and exit processes.

**Onboarding:**
- [ ] Reusable onboarding checklist templates
- [ ] Task assignment (HR, IT, Manager, Employee)
- [ ] Document collection during onboarding
- [ ] Asset assignment on joining
- [ ] Welcome email automation

**Offboarding:**
- [ ] Resignation submission and approval
- [ ] Notice period tracking
- [ ] Clearance checklist (IT, Finance, Admin)
- [ ] Exit interview scheduling
- [ ] Final settlement handoff
- [ ] Account deactivation automation

---

### 🎫 Phase 14 — HR Helpdesk
> *Estimated: Weeks 35–36*

**Goal:** Employee HR support ticketing system.

- [ ] Employee HR request submission (query, complaint, request)
- [ ] Ticket categories and priority
- [ ] Assignment to HR agents
- [ ] SLA configuration per category
- [ ] Comment thread on tickets
- [ ] Attachment support
- [ ] Resolution and closure workflow
- [ ] HR agent dashboard and queue
- [ ] Ticket analytics (volume, SLA breach, resolution time)

---

### 💻 Phase 15 — Asset Management
> *Estimated: Weeks 37–38*

**Goal:** Company asset lifecycle tracking.

- [ ] Asset catalog (laptop, phone, monitor, access card, etc.)
- [ ] Asset assignment to employees
- [ ] Acknowledgement workflow
- [ ] Maintenance scheduling and history
- [ ] Asset return on offboarding
- [ ] Asset retirement / disposal
- [ ] Clearance integration with offboarding
- [ ] Asset utilization reports

---

### 🎯 Phase 16 — Performance Management
> *Estimated: Weeks 39–43*

**Goal:** Goal-setting, reviews, and performance cycles.

- [ ] Goal creation (individual, team, company)
- [ ] KPIs and OKRs framework
- [ ] Goal progress tracking and check-ins
- [ ] Self-review forms
- [ ] Manager review forms
- [ ] Peer review (360-degree)
- [ ] Probation review cycle
- [ ] Annual/mid-year performance review cycle
- [ ] Rating scales configuration
- [ ] Performance history and reports

---

### 🎓 Phase 17 — Skills & Training
> *Estimated: Weeks 44–46*

**Goal:** Employee competency and learning management.

- [ ] Skills catalog and employee skills profiles
- [ ] Skill level definitions (beginner → expert)
- [ ] Competency tracking per role/department
- [ ] Training catalog (internal + external)
- [ ] Course enrollment and completion tracking
- [ ] Certificate upload and expiry tracking
- [ ] Mandatory training assignments
- [ ] Training calendar
- [ ] Learning reports

---

### 💚 Phase 18 — Employee Engagement
> *Estimated: Weeks 47–49*

**Goal:** Culture, recognition, and feedback tools.

- [ ] Recognition / Kudos system (peer-to-peer)
- [ ] Milestones and celebrations (birthdays, anniversaries)
- [ ] Pulse surveys (weekly/bi-weekly)
- [ ] Engagement surveys
- [ ] Satisfaction surveys
- [ ] Anonymous survey support
- [ ] Custom survey builder
- [ ] Survey analytics and sentiment trends

---

### 📊 Phase 19 — Analytics & Dashboards
> *Estimated: Weeks 50–52*

**Goal:** Data-driven HR insights at every level.

**Dashboards:**
- [ ] Employee Dashboard (personal metrics)
- [ ] Manager Dashboard (team metrics)
- [ ] HR Dashboard (org-wide metrics)
- [ ] Company Dashboard (executive view)
- [ ] Super Admin Dashboard (platform metrics)

**Analytics Modules:**
- [ ] Headcount analytics (current, historical, growth)
- [ ] Attrition analytics (voluntary, involuntary, trends)
- [ ] Absenteeism analytics
- [ ] Leave utilization analytics
- [ ] Attendance analytics
- [ ] Workforce composition (gender, age, tenure, department)

---

### 📈 Phase 20 — Custom Report Builder
> *Estimated: Weeks 53–55*

**Goal:** Self-serve reporting for HR teams.

- [ ] Dataset selection (employees, leave, attendance, performance, etc.)
- [ ] Field/column selection and ordering
- [ ] Filter builder (multi-condition)
- [ ] Grouping and aggregation
- [ ] Sorting configuration
- [ ] Table and chart visualization
- [ ] Saved report library
- [ ] Export: Excel, CSV, PDF
- [ ] Scheduled report delivery (email)

---

### 🔧 Phase 21 — Custom Fields & Forms
> *Estimated: Weeks 56–57*

**Goal:** Tenant-specific data extensibility.

- [ ] Dynamic employee custom fields
- [ ] Field types: text, number, date, select, multi-select, file
- [ ] Custom forms (for requests, surveys, onboarding)
- [ ] Configurable request forms
- [ ] Field-level validation rules
- [ ] Field-level permissions (who can view/edit)
- [ ] Custom field values in reports

---

### 🔌 Phase 22 — API & Integrations
> *Estimated: Weeks 58–60*

**Goal:** Open platform with integration ecosystem.

- [ ] Public REST API (versioned, OpenAPI-documented)
- [ ] API key management (per tenant)
- [ ] Webhook support (configurable event subscriptions)
- [ ] Integration connectors (readiness):
  - Google Workspace (users, calendar, drive)
  - Microsoft 365 (users, calendar, Teams)
  - Slack / Microsoft Teams (notifications, bot)
  - Payroll systems (data export/sync)
  - Accounting systems
  - Biometric / attendance devices
  - Calendar sync (Google, Outlook)

---

### 🤖 Phase 23 — AI Features
> *Estimated: Weeks 61–64*

**Goal:** Intelligent HR assistant and analytics.

- [ ] HR AI Assistant (natural-language Q&A about HR data)
- [ ] Natural-language HR queries ("Who is on leave this week?")
- [ ] Workforce insights and anomaly detection
- [ ] Document information extraction (ID, joining letter parsing)
- [ ] Explainable analytics (why did attrition spike?)
- [ ] Human-in-the-loop safeguards for all AI actions
- [ ] AI suggestion confidence scoring

---

### 💳 Phase 24 — SaaS Billing
> *Estimated: Weeks 65–67*

**Goal:** Monetization and subscription management.

- [ ] Plan definitions (Free, Starter, Growth, Enterprise)
- [ ] Free trial management (duration, credit card requirement)
- [ ] Subscription creation and management
- [ ] Usage metering (employees, storage, API calls)
- [ ] Feature flag enforcement by plan
- [ ] Invoice generation and history
- [ ] Payment method management (Stripe integration)
- [ ] Plan upgrade/downgrade flows
- [ ] Dunning and payment failure handling

---

### 🛡️ Phase 25 — Production Hardening
> *Estimated: Weeks 68–72*

**Goal:** Enterprise-grade security, reliability, and observability.

- [ ] Tenant isolation penetration testing
- [ ] Security audit (OWASP Top 10)
- [ ] Rate limiting (per tenant, per endpoint)
- [ ] Database backup automation and recovery testing
- [ ] Performance profiling and query optimization
- [ ] Observability stack (structured logs, metrics, traces)
- [ ] Queue monitoring and dead-letter handling
- [ ] Load testing
- [ ] Production runbooks
- [ ] Disaster recovery plan

---

## 8. MVP Scope

The **first production-quality release** must include the following (Phases 0–7 + Notifications):

| Feature | Phase |
|---------|-------|
| Google Authentication | Phase 2 |
| Multi-tenancy & tenant isolation | Phase 0 + 2 |
| Super Admin portal | Phase 3 |
| Company Admin portal | Phase 4 |
| RBAC & permissions | Phase 2 |
| Product & tenant branding | Phase 1 |
| Organization & employee management | Phase 5 |
| Employee self-service | Phase 6 |
| Documents & audit logs | Phase 12 (core) |
| Leave types, policies, accrual | Phase 7 |
| Leave application & approval | Phase 7 + 8 |
| Leave calendar | Phase 7 |
| Notifications | Phase 9 |
| Analytics (basic) | Phase 19 (basic) |
| Responsive / mobile-first modern UI | Phase 1 |
| Light/dark mode | Phase 1 |
| Global search & command palette | Phase 1 |

---

## 9. Core Architectural Components

These **cross-cutting engines** must be built correctly from Phase 0 and extended throughout:

| Component | Description |
|-----------|-------------|
| **Tenant Isolation Engine** | Server-side `tenant_id` derivation, middleware enforcement, row-level scoping |
| **RBAC & Permission Engine** | Role → Permission mapping, granular action-based permissions, middleware guards |
| **Workflow Engine** | Trigger → Condition → Action, multi-level approvals, escalations, audit |
| **Notification Engine** | Multi-channel (in-app, email, push), templated, per-tenant branding |
| **Audit Engine** | Immutable audit log for all state-changing operations |
| **Document / File Engine** | S3 abstraction, versioning, access control, preview, expiry |
| **Custom Fields Engine** | Dynamic schema extension per tenant, type-safe field system |
| **Reporting / Analytics Engine** | Query builder, aggregation, export pipeline |
| **Feature Flag System** | Per-tenant plan enforcement, gradual feature rollout |

---

## 10. UX / UI Direction

### Design Language

- **Modern SaaS + Professional HR + Gen-Z Friendly**
- Clean, spacious layouts with strong typography hierarchy
- Rounded cards with consistent `12–16px` border radius
- Subtle depth through shadows (not borders)
- Restrained gradients (lime → green brand palette)
- Polished micro-interactions on all interactive elements

### What to Avoid

❌ Dated enterprise styling  
❌ Excessive grey/neutral-only palettes  
❌ Tiny or dense typography  
❌ Generic Bootstrap-like layouts  
❌ Clutter and information overload on a single screen  

### Key UX Features

- ⚡ **Command Palette** (`Ctrl+K`) — navigate anywhere instantly
- 🔍 **Global Search** — search across employees, docs, tickets
- 📱 **Mobile-First** — all core flows work on mobile
- 🌙 **Light/Dark Mode** — system-preference aware
- 💀 **Skeleton Loading** — no layout shift on data load
- 🎭 **Beautiful Empty States** — guide users on first use
- 🚨 **Useful Error States** — actionable, human-friendly errors

---

## 11. Directory Structure

> Every feature is a **self-contained module** in both `apps/api/src/modules/` and `apps/web/src/features/`. No cross-module direct imports — communicate via shared types only.

```
kaaryamitra/
├── apps/
│   ├── web/                         # React + TypeScript frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/          # Shared UI components (design system)
│   │   │   ├── pages/               # Route-level page wrappers
│   │   │   ├── features/            # Feature-scoped MODULES
│   │   │   │   ├── employee/        # Employee module
│   │   │   │   ├── leave/           # Leave module
│   │   │   │   ├── attendance/      # Attendance module (AT Global logic ported)
│   │   │   │   ├── ai/              # AI assistant module (Phase 10.5)
│   │   │   │   └── .../            # One folder per domain
│   │   │   ├── hooks/               # Shared React hooks
│   │   │   ├── lib/                 # Utilities, API client, config
│   │   │   ├── store/               # Zustand state stores
│   │   │   └── types/               # Shared TypeScript types
│   │   └── public/                  # Static assets
│   └── api/                         # Node.js + Express backend
│       ├── src/
│       │   ├── modules/             # Feature MODULES (self-contained)
│       │   │   ├── employee/        #  employee.router / controller / service / schema
│       │   │   ├── leave/           #  leave.router / controller / service / schema
│       │   │   ├── attendance/      #  attendance module (geofence, QR, punch)
│       │   │   ├── ai/              #  AI module (Gemini, Phase 10.5)
│       │   │   └── .../            #  One folder per domain
│       │   ├── middleware/          # Auth, tenant resolution, RBAC, rate-limit
│       │   ├── services/            # Cross-cutting services (email, storage, audit)
│       │   ├── prisma/              # Prisma schema + migrations
│       │   ├── jobs/                # BullMQ job definitions
│       │   └── lib/                 # Shared utilities
│       └── tests/                   # API tests
├── packages/
│   ├── shared-types/                # Shared TypeScript types (FE + BE)
│   └── ui/                          # Optional: extracted component library
├── docs/                            # Architecture decision records (ADRs)
│   ├── adr/
│   └── api/                         # OpenAPI spec
├── docker-compose.yml               # Dokploy production deployment
├── scripts/                         # Dev, deployment, migration scripts
├── README.md                        # ← YOU ARE HERE
└── package.json                     # npm workspaces root
```

---

## 12. Getting Started

> **Prerequisites:** Node.js 20+, PostgreSQL 15+, Redis (optional for queues)

### 1. Clone the Repository

```bash
git clone https://github.com/kaaryamitra/kaaryamitra.git
cd kaaryamitra
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
# Copy environment templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit and set your values:
# DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
# SESSION_SECRET, S3_* variables, etc.
```

### 4. Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev --schema=apps/api/src/prisma/schema.prisma

# Seed initial Super Admin
npm run seed --workspace=apps/api
```

### 5. Run Development Servers

```bash
# Start both frontend and backend in parallel
npm run dev

# Or individually:
npm run dev --workspace=apps/web    # http://localhost:5173
npm run dev --workspace=apps/api    # http://localhost:3000
```

### 6. Dokploy Production Deployment

```bash
# Ensure docker-compose.yml is configured for Dokploy
# Push to your Dokploy-connected Git repo
# Dokploy handles build, deploy, SSL, and reverse proxy automatically
git push origin main
```

---

## 13. Development Guidelines

### Phase-by-Phase Rules

1. **One phase at a time** — Do not implement future phases prematurely
2. **Each phase must be complete and runnable** before moving to the next
3. **Never replace working functionality** with a shortcut implementation
4. **Preserve backward compatibility** with previously implemented modules
5. **Maintain database migrations** — no destructive schema resets
6. **Every feature = its own module** — `apps/api/src/modules/{feature}/` + `apps/web/src/features/{feature}/`
7. **No cross-module direct imports** — share through `packages/shared-types/` only

### Code Standards

- All code in **TypeScript** (strict mode enabled)
- **ESLint + Prettier** enforced via pre-commit hooks
- **Conventional Commits** for all commit messages
- **PR reviews** required before merging to `main`
- Component naming: PascalCase for components, camelCase for hooks/utils

### Testing Requirements

- Unit tests for all **business logic** (especially leave calculations)
- Integration tests for **tenant isolation** and **permission enforcement**
- E2E tests for critical user flows (login, leave application, approval)
- All tests must pass before phase completion

### Architecture Decision Records (ADRs)

All significant architectural decisions must be documented in `/docs/adr/` using the format:
```
/docs/adr/YYYY-MM-DD-short-title.md
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `EmployeeCard.tsx` |
| Hooks | camelCase with `use` prefix | `useLeaveBalance.ts` |
| API routes | kebab-case | `/api/v1/leave-types` |
| DB tables | snake_case | `leave_applications` |
| Env vars | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Types/Interfaces | PascalCase | `LeaveApplication` |

---

## 14. Long-Term Product Direction

The final KaaryaMitra product will combine the **HR depth** of traditional enterprise HRMS platforms with the **simplicity and polish** of modern SaaS products.

### Key Differentiators

| Differentiator | Description |
|----------------|-------------|
| 🌴 **Leave Management** | Industry-leading flexibility — accruals, pro-rata, carry-forward, encashment, multi-policy |
| 👤 **Employee Self-Service** | Beautiful, mobile-first self-service portal employees actually want to use |
| ⚙️ **Workflow Automation** | Configurable approval chains for any HR process without code |
| 🎨 **Tenant Branding** | Full white-label capability with per-tenant logo, colors, and domain |
| 📊 **Analytics** | Role-appropriate dashboards with actionable workforce insights |
| 🤖 **AI HR Assistant** | Natural-language access to HR data with human-in-the-loop safeguards |

### The North Star

> *"A tool that HR teams love to configure, employees love to use, and executives trust for workforce decisions."*

---

## Implementation Principle

> **Architect broadly. Implement deliberately. Test every phase.**

---

*Last updated: August 2026 | KaaryaMitra HRMS v1.0 Roadmap*
#   k a a r y a m i t r a  
 