import * as React from 'react';
import { useGenerateTimesheet, useSubmitTimesheet, useTimesheet } from '@/features/company/hooks/use-timesheets-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { Send, FileClock, Clock, Loader2, CheckCircle2 } from 'lucide-react';

export function MyTimesheetsPage() {
  const [startDate, setStartDate] = React.useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = React.useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [activeTimesheetId, setActiveTimesheetId] = React.useState<string | undefined>();
  const [editedEntries, setEditedEntries] = React.useState<Record<string, any>>({});

  const generateTimesheet = useGenerateTimesheet();
  const submitTimesheet = useSubmitTimesheet();
  const { data: timesheet, isLoading } = useTimesheet(activeTimesheetId);


  const handleGenerate = () => {
    generateTimesheet.mutate(
      { periodStartDate: startDate, periodEndDate: endDate },
      {
        onSuccess: (data) => {
          setActiveTimesheetId(data.id);
          // Initialize edited entries
          const initial = data.entries.reduce((acc, entry) => {
            acc[entry.id] = { ...entry };
            return acc;
          }, {} as Record<string, any>);
          setEditedEntries(initial);
          toast.success('Timesheet generated');
        }
      }
    );
  };

  const handleEntryChange = (id: string, field: string, value: string) => {
    setEditedEntries(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field.includes('Hours') ? parseFloat(value) || 0 : value
      }
    }));
  };

  const handleSubmit = () => {
    if (!activeTimesheetId) return;

    const entriesArray = Object.values(editedEntries).map((e: any) => ({
      id: e.id,
      hours: e.hours,
      overtimeHours: e.overtimeHours,
      description: e.description
    }));

    submitTimesheet.mutate(
      { id: activeTimesheetId, entries: entriesArray },
      {
        onSuccess: () => {
          toast.success('Timesheet submitted successfully');
        }
      }
    );
  };

  const isEditable = timesheet?.status === 'DRAFT' || timesheet?.status === 'REJECTED';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Timesheets</h1>
        <p className="text-muted-foreground">Generate, review, and submit your timesheets.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Period</CardTitle>
          <CardDescription>Select the start and end dates to generate or load your timesheet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-2 flex-1 sm:max-w-[200px]">
              <Label htmlFor="start">Start Date</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1 sm:max-w-[200px]">
              <Label htmlFor="end">End Date</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleGenerate} disabled={generateTimesheet.isPending} className="w-full sm:w-auto">
              {generateTimesheet.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileClock className="mr-2 h-4 w-4" />}
              Generate Timesheet
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {timesheet && !isLoading && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Timesheet Details</CardTitle>
              <CardDescription>
                {format(new Date(timesheet.periodStartDate), 'PPP')} - {format(new Date(timesheet.periodEndDate), 'PPP')}
              </CardDescription>
            </div>
            <div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                timesheet.status === 'DRAFT' ? 'bg-secondary text-secondary-foreground' :
                timesheet.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-500' :
                timesheet.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {timesheet.status}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {timesheet.approverNote && (
              <div className="mb-6 rounded-md bg-muted p-4 border-l-4 border-primary">
                <p className="text-sm font-medium">Approver Note:</p>
                <p className="text-sm text-muted-foreground mt-1">{timesheet.approverNote}</p>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Regular Hours</TableHead>
                    <TableHead>Overtime Hours</TableHead>
                    <TableHead className="w-[40%]">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheet.entries.map((entry) => {
                    const edited = editedEntries[entry.id] || entry;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {format(new Date(entry.date), 'MMM d, EEE')}
                        </TableCell>
                        <TableCell>
                          {isEditable ? (
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={edited.hours}
                              onChange={(e) => handleEntryChange(entry.id, 'hours', e.target.value)}
                              className="w-24"
                            />
                          ) : (
                            <span>{entry.hours}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditable ? (
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={edited.overtimeHours}
                              onChange={(e) => handleEntryChange(entry.id, 'overtimeHours', e.target.value)}
                              className="w-24"
                            />
                          ) : (
                            <span>{entry.overtimeHours}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditable ? (
                            <Input
                              value={edited.description || ''}
                              onChange={(e) => handleEntryChange(entry.id, 'description', e.target.value)}
                              placeholder="Notes (optional)"
                            />
                          ) : (
                            <span className="text-muted-foreground">{entry.description || '-'}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="flex gap-8">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Regular:</span>
                  <span className="font-semibold">
                    {Object.values(editedEntries).reduce((sum, e: any) => sum + (Number(e.hours) || 0), 0)}h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Overtime:</span>
                  <span className="font-semibold">
                    {Object.values(editedEntries).reduce((sum, e: any) => sum + (Number(e.overtimeHours) || 0), 0)}h
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          {isEditable && (
            <CardFooter className="justify-end border-t p-4 bg-muted/20">
              <Button onClick={handleSubmit} disabled={submitTimesheet.isPending}>
                {submitTimesheet.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Timesheet
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
