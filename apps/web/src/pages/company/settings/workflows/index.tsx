import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useWorkflowTemplates,
  useCreateWorkflowTemplate,
  useUpdateWorkflowTemplate,
  useSeedWorkflows,
  type WorkflowTemplate,
} from '@/features/company/hooks/use-workflow-queries';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { useRoles } from '@/features/company/hooks/use-role-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  GitBranch,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Schema ───────────────────────────────────────────────────────────────────

const stepSchema = z.object({
  label: z.string().min(1, 'Step label is required'),
  assigneeType: z.enum(['MANAGER', 'DEPARTMENT_HEAD', 'ROLE', 'SPECIFIC_USER', 'HR']),
  assigneeId: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  triggerType: z.enum([
    'LEAVE_REQUEST',
    'EXPENSE_REQUEST',
    'OFFBOARDING_REQUEST',
    'DOCUMENT_REQUEST',
    'ATTENDANCE_REGULARIZATION',
    'TIMESHEET_APPROVAL',
    'SHIFT_SWAP_REQUEST',
    'CUSTOM',
  ]),
  steps: z.array(stepSchema).min(1, 'At least one step is required'),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  LEAVE_REQUEST: 'Leave Request',
  EXPENSE_REQUEST: 'Expense Request',
  OFFBOARDING_REQUEST: 'Offboarding Request',
  DOCUMENT_REQUEST: 'Document Request',
  ATTENDANCE_REGULARIZATION: 'Attendance Regularization',
  TIMESHEET_APPROVAL: 'Timesheet Approval',
  SHIFT_SWAP_REQUEST: 'Shift Swap Request',
  CUSTOM: 'Custom',
};

const ASSIGNEE_LABELS: Record<string, string> = {
  MANAGER: 'Direct Manager',
  DEPARTMENT_HEAD: 'Department Head',
  HR: 'HR Team',
  ROLE: 'Specific Role',
  SPECIFIC_USER: 'Specific User',
};

const TRIGGER_ICONS: Record<string, string> = {
  LEAVE_REQUEST: '🏖️',
  EXPENSE_REQUEST: '💳',
  OFFBOARDING_REQUEST: '👋',
  DOCUMENT_REQUEST: '📄',
  ATTENDANCE_REGULARIZATION: '⏱️',
  TIMESHEET_APPROVAL: '📅',
  SHIFT_SWAP_REQUEST: '🔄',
  CUSTOM: '⚙️',
};

// ─── Workflow Form Dialog ──────────────────────────────────────────────────────

function WorkflowFormDialog({
  open,
  onOpenChange,
  editingTemplate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingTemplate: WorkflowTemplate | null;
}) {
  const createMutation = useCreateWorkflowTemplate();
  const updateMutation = useUpdateWorkflowTemplate();
  const { data: employees } = useEmployees();
  const { data: roles } = useRoles();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editingTemplate
      ? {
          name: editingTemplate.name,
          description: editingTemplate.description ?? '',
          triggerType: editingTemplate.triggerType,
          steps: editingTemplate.steps.map((s) => ({
            label: s.label,
            assigneeType: s.assigneeType,
            assigneeId: s.assigneeId ?? '',
          })),
        }
      : {
          name: '',
          description: '',
          triggerType: 'LEAVE_REQUEST',
          steps: [{ label: 'Manager Approval', assigneeType: 'MANAGER', assigneeId: '' }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'steps' });

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      steps: data.steps.map((s, i) => ({
        ...s,
        stepOrder: i + 1,
        assigneeId: s.assigneeId || undefined,
      })),
    };

    if (editingTemplate) {
      updateMutation.mutate(
        { id: editingTemplate.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Workflow updated successfully');
            onOpenChange(false);
          },
          onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || 'Failed to update workflow');
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Workflow created successfully');
          reset();
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error?.message || 'Failed to create workflow');
        },
      });
    }
  };

  const watchedSteps = watch('steps');
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            {editingTemplate ? 'Edit Workflow' : 'Create Workflow'}
          </DialogTitle>
          <DialogDescription>
            Define sequential approval steps that will be triggered automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Workflow Name <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="e.g. Leave Approval Chain" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Trigger Event <span className="text-destructive">*</span>
              </Label>
              <Select
                defaultValue={editingTemplate?.triggerType ?? 'LEAVE_REQUEST'}
                onValueChange={(val) => setValue('triggerType', val as any)}
                disabled={!!editingTemplate}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {TRIGGER_ICONS[val]} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingTemplate && (
                <p className="text-[10px] text-muted-foreground">
                  Trigger type cannot be changed after creation.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="Optional description..." {...register('description')} />
          </div>

          {/* Steps Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Approval Steps</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  append({ label: `Step ${fields.length + 1}`, assigneeType: 'MANAGER' })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Step
              </Button>
            </div>

            {errors.steps && (
              <p className="text-xs text-destructive">{errors.steps.message}</p>
            )}

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="relative">
                  {/* Step connector arrow */}
                  {index > 0 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30 group">
                    <div className="flex items-center gap-2 mt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Step Label</Label>
                        <Input
                          placeholder="e.g. Manager Approval"
                          {...register(`steps.${index}.label`)}
                          className="h-8 text-sm"
                        />
                        {errors.steps?.[index]?.label && (
                          <p className="text-xs text-destructive">
                            {errors.steps[index].label?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Approver</Label>
                        <Select
                          defaultValue={field.assigneeType}
                          onValueChange={(val) =>
                            setValue(`steps.${index}.assigneeType`, val as any)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ASSIGNEE_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Select Dropdown for ROLE */}
                      {watchedSteps[index]?.assigneeType === 'ROLE' && (
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs">Select Role</Label>
                          <Select
                            value={watchedSteps[index]?.assigneeId || ''}
                            onValueChange={(val) => setValue(`steps.${index}.assigneeId`, val)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Choose a role..." />
                            </SelectTrigger>
                            <SelectContent>
                              {roles?.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name} {r.description ? `(${r.description})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Select Dropdown for SPECIFIC_USER */}
                      {watchedSteps[index]?.assigneeType === 'SPECIFIC_USER' && (
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs">Select Employee / User</Label>
                          <Select
                            value={watchedSteps[index]?.assigneeId || ''}
                            onValueChange={(val) => setValue(`steps.${index}.assigneeId`, val)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Choose an employee..." />
                            </SelectTrigger>
                            <SelectContent>
                              {employees?.map((e: any) => {
                                const targetUserId = e.userId || e.user?.id || e.id;
                                return (
                                  <SelectItem key={e.id} value={targetUserId}>
                                    {e.firstName} {e.lastName} ({e.workEmail || e.user?.email})
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : editingTemplate
                  ? 'Save Changes'
                  : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function WorkflowsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const updateMutation = useUpdateWorkflowTemplate();
  const seedMutation = useSeedWorkflows();

  const { data: templates, isLoading } = useWorkflowTemplates();

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (template: WorkflowTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleToggleActive = (template: WorkflowTemplate) => {
    updateMutation.mutate(
      { id: template.id, data: { isActive: !template.isActive } },
      {
        onSuccess: () => {
          toast.success(`Workflow ${template.isActive ? 'deactivated' : 'activated'}`);
        },
      },
    );
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <Breadcrumb
        items={[
          { label: 'Settings', path: 'settings' },
          { label: 'Workflow Engine' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflow Engine</h2>
          <p className="text-muted-foreground mt-1">
            Configure multi-step approval chains triggered by HR events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              seedMutation.mutate(undefined, {
                onSuccess: () => toast.success('Standard workflows loaded')
              });
            }}
            disabled={seedMutation.isPending}
            className="gap-2"
          >
            <Zap className="h-4 w-4 text-primary" />
            {seedMutation.isPending ? 'Loading...' : 'Load Examples'}
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Explainer */}
      <div className="rounded-xl border bg-primary/5 p-4 flex items-start gap-3">
        <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-primary">How workflows work</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            When an employee submits a request (e.g. leave), it automatically triggers the matching
            workflow. Each approver in the chain must approve before the next step activates. A
            single rejection cancels the entire workflow.
          </p>
        </div>
      </div>

      {/* Templates */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <GitBranch className="h-14 w-14 mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-xl mb-2">No Workflows Yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Create your first workflow to automate approvals. Start with a Leave Request approval
            chain.
          </p>
          <Button className="mt-6 gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const steps = template.steps;
            return (
              <Card
                key={template.id}
                className={`transition-all hover:shadow-md ${!template.isActive ? 'opacity-60' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{TRIGGER_ICONS[template.triggerType]}</span>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {template.description || TRIGGER_LABELS[template.triggerType]}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={template.isActive ? 'default' : 'secondary'} className="text-xs">
                        {template.isActive ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" />Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Steps visualization */}
                  <div className="space-y-1.5 mb-4">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {i > 0 && (
                          <div className="w-4 flex justify-center">
                            <div className="w-px h-3 bg-border" />
                          </div>
                        )}
                        <div className={`flex items-center gap-2 ${i > 0 ? '' : ''}`}>
                          {i > 0 && <div className="w-4" />}
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-xs text-foreground">{step.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({ASSIGNEE_LABELS[step.assigneeType]})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={template.isActive ? 'ghost' : 'outline'}
                      className="h-7 text-xs flex-1"
                      onClick={() => handleToggleActive(template)}
                      disabled={updateMutation.isPending}
                    >
                      {template.isActive ? (
                        <><XCircle className="h-3 w-3 mr-1" />Deactivate</>
                      ) : (
                        <><CheckCircle2 className="h-3 w-3 mr-1" />Activate</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <WorkflowFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTemplate={editingTemplate}
      />
    </div>
  );
}
