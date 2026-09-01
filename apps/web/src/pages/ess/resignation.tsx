import { useState } from 'react';
import { useMyResignation, useSubmitResignation } from '@/features/company/hooks/use-resignations-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function MyResignationPage() {
  const { data: resignation, isLoading } = useMyResignation();
  const submitMutation = useSubmitResignation();
  
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = () => {
    if (!reason || !date) return toast.error('Please fill all fields');
    
    submitMutation.mutate({ reason, requestedLastWorkingDay: date }, {
      onSuccess: () => {
        toast.success('Resignation submitted successfully');
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Resignation</h2>
      </div>

      {resignation ? (
        <Card>
          <CardHeader>
            <CardTitle>Resignation Status</CardTitle>
            <CardDescription>Your current resignation request details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={resignation.status === 'APPROVED' ? 'default' : resignation.status === 'PENDING' ? 'outline' : 'destructive'}>
                {resignation.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Submitted On</span>
              <span className="font-medium">{format(new Date(resignation.submittedAt), 'PP')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Requested Last Working Day</span>
              <span className="font-medium">{format(new Date(resignation.requestedLastWorkingDay), 'PP')}</span>
            </div>
            {resignation.approvedLastWorkingDay && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Approved Last Working Day</span>
                <span className="font-medium">{format(new Date(resignation.approvedLastWorkingDay), 'PP')}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Clearance Status</span>
              {resignation.isClearanceCompleted ? (
                <Badge variant="default" className="bg-green-600">Cleared</Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-600">Pending</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Submit Resignation</CardTitle>
            <CardDescription>This will initiate your offboarding workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for leaving</Label>
              <Textarea 
                placeholder="Please provide your reason..." 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                rows={4} 
              />
            </div>
            <div className="space-y-2">
              <Label>Requested Last Working Day</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                min={new Date().toISOString().split('T')[0]} 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending} variant="destructive">
              {submitMutation.isPending ? 'Submitting...' : 'Submit Resignation'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
