import { useState } from 'react';
import {
  useMyPendingApprovals,
  useProcessWorkflowAction,
  type PendingApproval,
} from '@/features/company/hooks/use-workflow-queries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Inbox,
  User,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── Action Dialog ────────────────────────────────────────────────────────────

function ActionDialog({
  approval,
  action,
  onClose,
}: {
  approval: PendingApproval | null;
  action: 'APPROVED' | 'REJECTED' | null;
  onClose: () => void;
}) {
  const [comment, setComment] = useState('');
  const processMutation = useProcessWorkflowAction();

  if (!approval || !action) return null;

  const app = approval.instance.leaveApplication;
  const correction = approval.instance.attendanceCorrection;
  const swap = approval.instance.shiftSwapRequest;
  const ts = approval.instance.timesheet;
  if (!app && !correction && !swap && !ts) return null;

  const handleConfirm = () => {
    const payload: { instanceId: string; action: 'APPROVED' | 'REJECTED'; comment?: string } = {
      instanceId: approval.instance.id,
      action,
    };
    if (comment) {
      payload.comment = comment;
    }

    processMutation.mutate(
      payload,
      {
        onSuccess: () => {
          toast.success(action === 'APPROVED' ? 'Application approved ✅' : 'Application rejected');
          onClose();
          setComment('');
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error?.message || 'Action failed');
        },
      },
    );
  };

  const isApproving = action === 'APPROVED';

  return (
    <Dialog open={!!approval && !!action} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isApproving ? 'text-emerald-500' : 'text-destructive'}`}>
            {isApproving ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {isApproving ? 'Approve Request' : 'Reject Request'}
          </DialogTitle>
          <DialogDescription>
            {isApproving
              ? 'Approving this request will advance it to the next step (or complete it if this is the last step).'
              : 'Rejecting this request will terminate the workflow.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {app && (
            <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
              <p className="font-medium">
                {app.employee.firstName} {app.employee.lastName}
              </p>
              <p className="text-muted-foreground">
                {app.leaveType.name} · {app.totalDays} day{app.totalDays !== 1 ? 's' : ''}
              </p>
              <p className="text-muted-foreground">
                {format(new Date(app.startDate), 'MMM d')} – {format(new Date(app.endDate), 'MMM d, yyyy')}
              </p>
              {app.reason && (
                <p className="text-muted-foreground italic">"{app.reason}"</p>
              )}
            </div>
          )}
          {correction && (
            <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
              <p className="font-medium">
                {correction.record.employee.firstName} {correction.record.employee.lastName}
              </p>
              <p className="text-muted-foreground font-semibold">Attendance Regularization</p>
              <p className="text-muted-foreground">
                Date: {format(new Date(correction.record.date), 'MMM d, yyyy')}
              </p>
              {correction.requestedCheckIn && (
                <p className="text-muted-foreground">
                  Check In: {format(new Date(correction.requestedCheckIn), 'hh:mm a')}
                </p>
              )}
              {correction.requestedCheckOut && (
                <p className="text-muted-foreground">
                  Check Out: {format(new Date(correction.requestedCheckOut), 'hh:mm a')}
                </p>
              )}
              {correction.reason && (
                <p className="text-muted-foreground italic mt-2">"{correction.reason}"</p>
              )}
            </div>
          )}
          {swap && (
            <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
              <p className="font-medium">
                {swap.requestingEmployee.firstName} {swap.requestingEmployee.lastName}
              </p>
              <p className="text-muted-foreground font-semibold">Shift Swap Request</p>
              <p className="text-muted-foreground">
                Date: {format(new Date(swap.date), 'MMM d, yyyy')}
              </p>
              {swap.reason && (
                <p className="text-muted-foreground italic mt-2">"{swap.reason}"</p>
              )}
            </div>
          )}
          {ts && (
            <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
              <p className="font-medium">
                {ts.employee.firstName} {ts.employee.lastName}
              </p>
              <p className="text-muted-foreground font-semibold">Timesheet Submission</p>
              <p className="text-muted-foreground">
                Period: {format(new Date(ts.startDate), 'MMM d')} – {format(new Date(ts.endDate), 'MMM d, yyyy')}
              </p>
              <p className="text-muted-foreground">
                Total Reg: {Math.floor(ts.totalRegularMinutes / 60)}h {ts.totalRegularMinutes % 60}m | OT: {Math.floor(ts.totalOvertimeMinutes / 60)}h {ts.totalOvertimeMinutes % 60}m
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{isApproving ? 'Comment (Optional)' : 'Reason for Rejection'}</Label>
            <Textarea
              placeholder={isApproving ? 'Add a note...' : 'Please provide a reason...'}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className={`flex-1 ${isApproving ? '' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}`}
              onClick={handleConfirm}
              disabled={processMutation.isPending || (!isApproving && !comment)}
            >
              {processMutation.isPending
                ? 'Processing...'
                : isApproving
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Approval Card ────────────────────────────────────────────────────────────

function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: PendingApproval;
  onApprove: () => void;
  onReject: () => void;
}) {
  const app = approval.instance.leaveApplication;
  const correction = approval.instance.attendanceCorrection;
  const swap = approval.instance.shiftSwapRequest;
  const ts = approval.instance.timesheet;
  if (!app && !correction && !swap && !ts) return null;

  const employee = app ? app.employee : correction ? correction.record.employee : swap ? swap.requestingEmployee : ts!.employee;
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
  const stepLabel = approval.currentStep.label;
  const stepIndex = approval.instance.currentStepIndex + 1;
  const badgeColor = app ? (app.leaveType?.color ?? '#4CAF50') : swap ? '#9c27b0' : ts ? '#2196f3' : '#ff9800';
  const badgeLabel = app ? app.leaveType.name : swap ? 'Shift Swap' : ts ? 'Timesheet' : 'Attendance Regularization';

  return (
    <Card className="hover:shadow-md transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Employee Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold">
                  {employee.firstName} {employee.lastName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {employee.employeeCode && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {employee.employeeCode}
                    </span>
                  )}
                  {employee.department && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {employee.department.name}
                    </span>
                  )}
                </div>
              </div>
              {/* Badge */}
              <Badge
                variant="secondary"
                className="text-xs flex-shrink-0"
                style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
              >
                {badgeLabel}
              </Badge>
            </div>

            {app ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(app.startDate), 'MMM d')}
                      {app.startDate !== app.endDate &&
                        ` – ${format(new Date(app.endDate), 'MMM d, yyyy')}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {app.totalDays} day{app.totalDays !== 1 ? 's' : ''}
                      {app.isHalfDay && ' (half-day)'}
                    </span>
                  </div>
                </div>

                {app.reason && (
                  <p className="text-sm text-muted-foreground italic mb-3 truncate">
                    "{app.reason}"
                  </p>
                )}
              </>
            ) : correction ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(correction.record.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {correction.requestedCheckIn && <span>In: {format(new Date(correction.requestedCheckIn), 'hh:mm a')}</span>}
                    {correction.requestedCheckOut && <span>Out: {format(new Date(correction.requestedCheckOut), 'hh:mm a')}</span>}
                  </div>
                </div>

                {correction.reason && (
                  <p className="text-sm text-muted-foreground italic mb-3 truncate">
                    "{correction.reason}"
                  </p>
                )}
              </>
            ) : swap ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(swap.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {swap.reason && (
                  <p className="text-sm text-muted-foreground italic mb-3 truncate">
                    "{swap.reason}"
                  </p>
                )}
              </>
            ) : ts ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(ts.startDate), 'MMM d')} – {format(new Date(ts.endDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span>Reg: {Math.floor(ts.totalRegularMinutes / 60)}h {ts.totalRegularMinutes % 60}m</span>
                    <span>OT: {Math.floor(ts.totalOvertimeMinutes / 60)}h {ts.totalOvertimeMinutes % 60}m</span>
                  </div>
                </div>
              </>
            ) : null}

            {/* Current Step */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3" />
                <span>
                  Step {stepIndex}: <strong className="text-foreground">{stepLabel}</strong>
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onReject}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={onApprove}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ApprovalsInboxPage() {
  const { data: approvals, isLoading } = useMyPendingApprovals();
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const handleAction = (approval: PendingApproval, action: 'APPROVED' | 'REJECTED') => {
    setSelectedApproval(approval);
    setActionType(action);
  };

  const handleClose = () => {
    setSelectedApproval(null);
    setActionType(null);
  };

  const pendingCount = approvals?.length ?? 0;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Approvals Inbox
            {pendingCount > 0 && (
              <Badge className="text-sm px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                {pendingCount}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground mt-1">
            Review and action pending requests from your team.
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : !approvals || approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Inbox className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-xl mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground max-w-sm">
            No pending approvals. When team members submit requests, they'll appear here for your
            review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.instance.id}
              approval={approval}
              onApprove={() => handleAction(approval, 'APPROVED')}
              onReject={() => handleAction(approval, 'REJECTED')}
            />
          ))}
        </div>
      )}

      <ActionDialog
        approval={selectedApproval}
        action={actionType}
        onClose={handleClose}
      />
    </div>
  );
}
