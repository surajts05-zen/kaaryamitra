import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, LayoutTemplate, Clock, Trash2, Edit, Play } from 'lucide-react';
import { useSavedReports, useDeleteSavedReport } from '@/features/company/hooks/use-reports-queries';
import { toast } from 'sonner';

export default function ReportsDashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: reports, isLoading } = useSavedReports(slug!);
  const deleteMutation = useDeleteSavedReport(slug!);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved report?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Report deleted successfully');
      } catch (err) {
        toast.error('Failed to delete report');
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="text-muted-foreground">Build, save, and schedule custom analytics reports.</p>
        </div>
        <Button onClick={() => navigate('builder')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Report
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">Loading reports...</div>
      ) : reports?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl border-border bg-muted/50">
          <LayoutTemplate className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No saved reports</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            You haven't created any reports yet. Build your first report to start analyzing data.
          </p>
          <Button onClick={() => navigate('builder')} className="mt-6" variant="outline">
            Open Report Builder
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports?.map((report) => (
            <div 
              key={report.id} 
              onClick={() => navigate(`builder?reportId=${report.id}`)}
              className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col cursor-pointer transition-all hover:border-primary/50 hover:shadow-md group"
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                      {report.dataset.replace(/_/g, ' ')}
                    </span>
                    {report.isScheduled && (
                      <span title={`Scheduled: ${report.cronSchedule}`} className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{report.name}</h3>
                {report.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Fields: {report.config.fields?.length || 0}</span>
                  <span>•</span>
                  <span>Filters: {report.config.filters?.length || 0}</span>
                  <span>•</span>
                  <span>Type: {report.config.chartType || 'TABLE'}</span>
                </div>
              </div>
              <div className="bg-muted/50 px-5 py-3 border-t flex justify-between items-center">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="h-8 text-xs font-medium gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`builder?reportId=${report.id}`);
                  }}
                >
                  <Play className="h-3.5 w-3.5 text-primary" /> View Report
                </Button>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`builder?reportId=${report.id}`);
                    }}
                    title="Edit Report"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    onClick={(e) => handleDelete(e, report.id)}
                    title="Delete Report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
