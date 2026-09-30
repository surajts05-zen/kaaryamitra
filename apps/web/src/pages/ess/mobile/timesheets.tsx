import * as React from 'react';
import { useGenerateTimesheet, useSubmitTimesheet, useTimesheet } from '@/features/company/hooks/use-timesheets-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { Send, FileClock, Clock, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MobileMyTimesheets() {
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
          const initial = data.entries.reduce((acc: any, entry: any) => {
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
    <div className="flex flex-col pb-20 space-y-4">
      <div className="flex items-center gap-3">
        <Link to=".." relative="path" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">My Timesheets</h1>
          <p className="text-xs text-muted-foreground">Log your work hours</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generateTimesheet.isPending} className="w-full">
            {generateTimesheet.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileClock className="mr-2 h-4 w-4" />}
            Generate Timesheet
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {timesheet && !isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {format(new Date(timesheet.periodStartDate), 'MMM d')} - {format(new Date(timesheet.periodEndDate), 'MMM d')}
            </h2>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              timesheet.status === 'DRAFT' ? 'bg-secondary text-secondary-foreground' :
              timesheet.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-500' :
              timesheet.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
              'bg-red-500/10 text-red-500'
            }`}>
              {timesheet.status}
            </span>
          </div>

          {timesheet.approverNote && (
            <div className="rounded-md bg-red-500/10 p-3 border-l-2 border-red-500 flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">Approver Note</p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">{timesheet.approverNote}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {timesheet.entries.map((entry: any) => {
              const edited = editedEntries[entry.id] || entry;
              return (
                <Card key={entry.id}>
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm">{format(new Date(entry.date), 'EEEE, MMM d')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-2 space-y-3">
                    <div className="flex gap-3">
                      <div className="space-y-1 flex-1">
                        <Label className="text-[10px]">Regular (hrs)</Label>
                        {isEditable ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={edited.hours}
                            onChange={(e) => handleEntryChange(entry.id, 'hours', e.target.value)}
                            className="h-8 text-xs"
                          />
                        ) : (
                          <div className="h-8 flex items-center px-3 text-xs bg-muted/50 rounded-md border border-transparent">
                            {entry.hours}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label className="text-[10px]">OT (hrs)</Label>
                        {isEditable ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={edited.overtimeHours}
                            onChange={(e) => handleEntryChange(entry.id, 'overtimeHours', e.target.value)}
                            className="h-8 text-xs"
                          />
                        ) : (
                          <div className="h-8 flex items-center px-3 text-xs bg-muted/50 rounded-md border border-transparent">
                            {entry.overtimeHours}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Description</Label>
                      {isEditable ? (
                        <Input
                          value={edited.description || ''}
                          onChange={(e) => handleEntryChange(entry.id, 'description', e.target.value)}
                          placeholder="Notes (optional)"
                          className="h-8 text-xs"
                        />
                      ) : (
                        <div className="min-h-8 flex items-center px-3 py-1 text-xs bg-muted/50 rounded-md border border-transparent">
                          {entry.description || '-'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-card border rounded-lg p-3 flex justify-around items-center sticky bottom-20 shadow-lg shadow-background/50">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> Regular
              </p>
              <p className="text-sm font-bold mt-0.5">
                {Object.values(editedEntries).reduce((sum, e: any) => sum + (Number(e.hours) || 0), 0)}h
              </p>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> OT
              </p>
              <p className="text-sm font-bold mt-0.5">
                {Object.values(editedEntries).reduce((sum, e: any) => sum + (Number(e.overtimeHours) || 0), 0)}h
              </p>
            </div>
          </div>

          {isEditable && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10 pb-6">
              <Button onClick={handleSubmit} disabled={submitTimesheet.isPending} className="w-full">
                {submitTimesheet.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Timesheet
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
