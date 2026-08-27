-- Phase 8: Workflow Engine
-- Add WorkflowTriggerType and WorkflowAssigneeType enums
-- Update WorkflowTemplate with triggerType, description and unique constraint

-- Create enums
CREATE TYPE "WorkflowTriggerType" AS ENUM ('LEAVE_REQUEST', 'EXPENSE_REQUEST', 'OFFBOARDING_REQUEST', 'DOCUMENT_REQUEST', 'CUSTOM');
CREATE TYPE "WorkflowAssigneeType" AS ENUM ('MANAGER', 'DEPARTMENT_HEAD', 'ROLE', 'SPECIFIC_USER', 'HR');

-- Alter workflow_templates table to add new columns
ALTER TABLE "workflow_templates"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "triggerType" "WorkflowTriggerType" NOT NULL DEFAULT 'CUSTOM';

-- Add unique constraint on (tenantId, triggerType)
ALTER TABLE "workflow_templates"
  ADD CONSTRAINT "workflow_templates_tenantId_triggerType_key" UNIQUE ("tenantId", "triggerType");
