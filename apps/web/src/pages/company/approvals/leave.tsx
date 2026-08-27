import React, { useState } from 'react';
import { usePendingLeaveApprovals, useReviewLeaveApplication } from '@/features/leave/leave.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function LeaveApprovalsPage() {
  const { data: applications, isLoading } = usePendingLeaveApprovals();
  const reviewMutation = useReviewLeaveApplication();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [action, setAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [managerNote, setManagerNote] = useState('');

  const handleOpenReview = (app: any, type: 'APPROVED' | 'REJECTED') => {
    setSelectedApp(app);
    setAction(type);
    setManagerNote('');
    setIsDialogOpen(true);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    await reviewMutation.mutateAsync({
      id: selectedApp.id,
      data: { status: action, managerNote }
    });
    
    setIsDialogOpen(false);
    setSelectedApp(null);
  };

  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Leave Approvals</h1>
          <p className="text-muted-foreground">Review and manage leave requests from your team.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
        ) : applications?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4 opacity-20" />
              <p>You're all caught up!</p>
              <p className="text-sm">No pending leave requests to review.</p>
            </CardContent>
          </Card>
        ) : (
          applications?.map((app) => (
            <Card key={app.id} className="relative overflow-hidden group">
              <div 
                className="absolute top-0 left-0 w-1 h-full" 
                style={{ backgroundColor: app.leaveType.color || '#4CAF50' }}
              />
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={app.employee?.avatarUrl} alt={app.employee?.firstName} />
                      <AvatarFallback>{getInitials(app.employee?.firstName || '', app.employee?.lastName || '')}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold text-base">{app.employee?.firstName} {app.employee?.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{app.leaveType.name} &bull; {app.totalDays} Days {app.isHalfDay ? '(Half Day)' : ''}</p>
                      
                      <div className="mt-2 text-sm bg-muted/50 p-2 rounded-md">
                        <span className="font-medium text-foreground">Dates:</span> {format(new Date(app.startDate), 'MMM d, yyyy')} 
                        {app.startDate !== app.endDate && ` - ${format(new Date(app.endDate), 'MMM d, yyyy')}`}
                      </div>
                      
                      {app.reason && (
                        <p className="mt-2 text-sm italic text-muted-foreground">"{app.reason}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 self-start md:self-center shrink-0">
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleOpenReview(app, 'REJECTED')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button 
                      className="bg-km-forest hover:bg-km-forest/90"
                      onClick={() => handleOpenReview(app, 'APPROVED')}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleReview}>
            <DialogHeader>
              <DialogTitle>{action === 'APPROVED' ? 'Approve' : 'Reject'} Leave Request</DialogTitle>
              <DialogDescription>
                You are about to {action.toLowerCase()} the request for {selectedApp?.totalDays} days from {selectedApp?.employee?.firstName}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Note to Employee (Optional)</Label>
                <Textarea 
                  value={managerNote} 
                  onChange={e => setManagerNote(e.target.value)} 
                  placeholder={action === 'REJECTED' ? "Please provide a reason for rejection..." : "Add a note..."}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                variant={action === 'REJECTED' ? 'destructive' : 'default'}
                className={action === 'APPROVED' ? 'bg-km-forest hover:bg-km-forest/90' : ''}
                disabled={reviewMutation.isPending}
              >
                Confirm {action === 'APPROVED' ? 'Approval' : 'Rejection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
