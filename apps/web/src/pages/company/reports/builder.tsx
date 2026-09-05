import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Save, Download, FileText, Settings, Play, ArrowLeft, Plus, Trash2, Clock, FileSpreadsheet, SlidersHorizontal, Filter } from 'lucide-react';
import { useReportsMeta, useExecuteReport, useCreateSavedReport, useUpdateSavedReport, useSavedReports, ReportConfig, FilterRule } from '@/features/company/hooks/use-reports-queries';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportBuilder() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('reportId') || searchParams.get('edit');
  
  const { data: meta } = useReportsMeta(slug!);
  const { data: savedReports } = useSavedReports(slug!);
  const executeMutation = useExecuteReport(slug!);
  const saveMutation = useCreateSavedReport(slug!);
  const updateMutation = useUpdateSavedReport(slug!);

  // UI View Mode State — collapse sidebar by default when viewing a saved report
  const [isSidebarOpen, setIsSidebarOpen] = useState(!reportId);

  // Builder State
  const [dataset, setDataset] = useState<string>('EMPLOYEES');
  const [config, setConfig] = useState<ReportConfig>({
    fields: [],
    filters: [],
    groupBys: [],
    sortBys: [],
    chartType: 'TABLE'
  });
  
  // Results State
  const [results, setResults] = useState<any[]>([]);
  const [hasRun, setHasRun] = useState(false);

  // Save Modal State
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [cron, setCron] = useState('0 9 * * 1'); // Every Monday 9AM
  const [emails, setEmails] = useState('');
  const [loadedReportId, setLoadedReportId] = useState<string | null>(null);

  const currentDatasetMeta = meta ? meta[dataset] : null;

  // Auto-load and execute saved report if reportId query param is present
  useEffect(() => {
    if (!reportId || !savedReports || loadedReportId === reportId) return;

    const report = savedReports.find((r) => r.id === reportId);
    if (report) {
      setDataset(report.dataset);
      setConfig(report.config);
      setSaveName(report.name);
      setSaveDesc(report.description || '');
      setIsScheduled(report.isScheduled);
      if (report.cronSchedule) setCron(report.cronSchedule);
      if (report.emails) setEmails(report.emails);
      setLoadedReportId(report.id);
      setIsSidebarOpen(false); // Clean viewer view by default

      executeMutation.mutateAsync({ dataset: report.dataset, config: report.config })
        .then((data) => {
          setResults(data);
          setHasRun(true);
        })
        .catch((err: any) => {
          toast.error(err.response?.data?.message || 'Failed to execute saved report');
        });
    }
  }, [reportId, savedReports, loadedReportId]);

  // Handlers
  const handleRunQuery = async () => {
    if (!dataset || (config.fields.length === 0 && config.groupBys?.length === 0)) {
      toast.error('Select at least one field or grouping column');
      return;
    }
    
    try {
      const data = await executeMutation.mutateAsync({ dataset, config });
      setResults(data);
      setHasRun(true);
      toast.success('Report executed successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to execute query');
    }
  };

  const handleSaveReport = async () => {
    if (!saveName.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      if (reportId) {
        await updateMutation.mutateAsync({
          id: reportId,
          data: {
            name: saveName,
            description: saveDesc,
            dataset,
            config,
            isScheduled,
            ...(isScheduled ? { cronSchedule: cron, emails } : {}),
          },
        });
        toast.success('Report updated successfully');
      } else {
        await saveMutation.mutateAsync({
          name: saveName,
          description: saveDesc,
          dataset,
          config,
          isScheduled,
          ...(isScheduled ? { cronSchedule: cron, emails } : {}),
        });
        toast.success('Report saved successfully');
      }
      navigate(`/t/${slug}/reports`);
    } catch (err: any) {
      toast.error('Failed to save report');
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = Object.keys(results[0]);
    const csvRows = results.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','));
    const csvString = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.toLowerCase()}_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!results.length) return;
    const doc = new jsPDF();
    
    // Branding
    doc.setFontSize(18);
    doc.text('KaaryaMitra Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Dataset: ${currentDatasetMeta?.label || dataset}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    const headers = Object.keys(results[0]);
    const body = results.map(row => headers.map(h => String(row[h] || '')));

    autoTable(doc, {
      startY: 45,
      head: [headers.map(h => h.replace(/([A-Z])/g, ' $1').toUpperCase())],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`${dataset.toLowerCase()}_report.pdf`);
  };

  // Render Helpers
  const renderChart = () => {
    if (!results.length || !config.groupBys?.length) {
      return <div className="text-center py-10 text-muted-foreground">Add a Grouping field and run the query to see a chart.</div>;
    }
    
    const xField = config.groupBys[0] || '';
    const yField = '_count';

    if (config.chartType === 'BAR') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={results}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yField} name="Count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (config.chartType === 'PIE') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie data={results} dataKey={yField} nameKey={xField} cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label>
              {results.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length] || '#3b82f6'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (config.chartType === 'LINE') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={results}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yField} name="Count" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return null;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 bg-background">
      {/* Sidebar Configurations */}
      {isSidebarOpen && (
        <div className="w-80 border-r bg-card p-5 overflow-y-auto flex flex-col gap-6 shrink-0 transition-all">
          <div className="flex items-center gap-2 pb-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
            <h2 className="font-semibold text-lg">Report Builder</h2>
          </div>

          {/* Dataset */}
          <div className="space-y-3">
            <Label className="font-bold text-foreground">Dataset</Label>
            <Select 
              value={dataset} 
              onValueChange={(val) => {
                setDataset(val);
                setConfig({ fields: [], filters: [], groupBys: [], sortBys: [], chartType: 'TABLE' });
                setResults([]);
                setHasRun(false);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select Dataset" /></SelectTrigger>
              <SelectContent>
                {meta && Object.entries(meta).map(([key, value]: any) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group By */}
          {currentDatasetMeta && (
            <div className="space-y-3">
              <Label className="font-bold text-foreground">Group By (Optional)</Label>
              <Select 
                value={config.groupBys?.[0] || "NONE"} 
                onValueChange={(val) => {
                  setConfig({ ...config, groupBys: val === "NONE" ? [] : [val], chartType: 'TABLE' });
                  setResults([]);
                  setHasRun(false);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select Grouping" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">-- No Grouping --</SelectItem>
                  {currentDatasetMeta.fields.map((f: any) => (
                    <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Groups data and counts records. <strong className="text-primary">Required for charts.</strong></p>
            </div>
          )}

          {/* Fields */}
          {currentDatasetMeta && (!config.groupBys || config.groupBys.length === 0) && (
            <div className="space-y-3">
              <Label className="font-bold text-foreground">Select Fields</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border rounded-md p-3 bg-muted/50">
                {currentDatasetMeta.fields.map((f: any) => (
                  <label key={f.name} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary"
                      checked={config.fields.includes(f.name)}
                      onChange={(e) => {
                        const fields = e.target.checked 
                          ? [...config.fields, f.name]
                          : config.fields.filter(x => x !== f.name);
                        setConfig({ ...config, fields });
                      }}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          {currentDatasetMeta && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-foreground">Filters</Label>
                <Button 
                  variant="ghost" size="sm" className="h-6 text-xs px-2"
                  onClick={() => setConfig({ ...config, filters: [...(config.filters||[]), { field: currentDatasetMeta.fields[0].name, operator: 'equals', value: '' }] })}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-3">
                {config.filters?.map((filter, idx) => (
                  <div key={idx} className="bg-muted/30 p-2 rounded-md border space-y-2 relative">
                    <div className="flex gap-2 items-center">
                      <Select value={filter.field} onValueChange={(val) => {
                        const filters = [...(config.filters || [])];
                        if (filters[idx]) filters[idx].field = val;
                        setConfig({ ...config, filters });
                      }}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {currentDatasetMeta.fields.map((f: any) => (
                            <SelectItem key={f.name} value={f.name} className="text-xs">{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => {
                          const filters = [...(config.filters || [])];
                          filters.splice(idx, 1);
                          setConfig({ ...config, filters });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Select value={filter.operator} onValueChange={(val: any) => {
                        const filters = [...(config.filters || [])];
                        if (filters[idx]) filters[idx].operator = val;
                        setConfig({ ...config, filters });
                      }}>
                        <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals" className="text-xs">Equals</SelectItem>
                          <SelectItem value="contains" className="text-xs">Contains</SelectItem>
                          <SelectItem value="gt" className="text-xs">{'>'}</SelectItem>
                          <SelectItem value="lt" className="text-xs">{'<'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        className="h-7 text-xs flex-1" 
                        placeholder="Value" 
                        value={filter.value}
                        onChange={(e) => {
                          const filters = [...(config.filters || [])];
                          if (filters[idx]) filters[idx].value = e.target.value;
                          setConfig({ ...config, filters });
                        }}
                      />
                    </div>
                  </div>
                ))}
                {config.filters?.length === 0 && <p className="text-xs text-muted-foreground italic">No filters applied</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Actions */}
        <div className="h-16 border-b bg-card flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => navigate(`/t/${slug}/reports`)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-lg font-semibold">{saveName ? saveName : (currentDatasetMeta?.label || 'Custom Report')}</h1>
            {saveName && currentDatasetMeta?.label && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                {currentDatasetMeta.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {isSidebarOpen ? 'Hide Parameters' : 'Edit Parameters'}
            </Button>

            <Button onClick={handleRunQuery} className="gap-2" disabled={executeMutation.isPending}>
              <Play className="w-4 h-4" /> {executeMutation.isPending ? 'Running...' : 'Run Query'}
            </Button>
            
            <div className="h-6 w-px bg-border mx-1"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!hasRun || results.length === 0} title="Download Report">
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCSV} className="cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" /> Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2 bg-primary hover:bg-primary/90" disabled={!hasRun}>
                  <Save className="w-4 h-4" /> Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Report Name</Label>
                    <Input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="e.g. Monthly Policy Acknowledgements" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={saveDesc} onChange={e => setSaveDesc(e.target.value)} placeholder="Optional context..." />
                  </div>
                  
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Schedule Delivery
                      </Label>
                      <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
                    </div>
                    {isScheduled && (
                      <div className="space-y-3 bg-primary/5 p-4 rounded-md border border-primary/20">
                        <div className="space-y-1">
                          <Label className="text-xs">Cron Schedule</Label>
                          <Input value={cron} onChange={e => setCron(e.target.value)} placeholder="0 9 * * 1" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Email Recipients (comma separated)</Label>
                          <Input value={emails} onChange={e => setEmails(e.target.value)} placeholder="admin@kaaryamitra.com" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveReport} disabled={saveMutation.isPending}>Save Report</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Active Parameters / Filter Summary Bar */}
        <div className="bg-muted/40 border-b px-6 py-2.5 flex items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Selected Parameters:
            </span>
            <span className="bg-card px-2.5 py-1 rounded-md border text-foreground font-medium shadow-xs">
              Dataset: {currentDatasetMeta?.label || dataset}
            </span>
            {config.groupBys && config.groupBys.length > 0 && (
              <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md font-medium">
                Group By: {currentDatasetMeta?.fields?.find((f: any) => f.name === config.groupBys![0])?.label || config.groupBys[0]}
              </span>
            )}
            {config.filters && config.filters.length > 0 ? (
              config.filters.map((f, i) => (
                <span key={i} className="bg-card px-2.5 py-1 rounded-md border text-foreground font-medium shadow-xs">
                  Filter: {currentDatasetMeta?.fields?.find((field: any) => field.name === f.field)?.label || f.field} {f.operator} "{f.value}"
                </span>
              ))
            ) : (
              <span className="text-muted-foreground italic">No filters applied</span>
            )}
          </div>
          {saveDesc && <p className="text-muted-foreground italic text-xs hidden md:block line-clamp-1">{saveDesc}</p>}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {!hasRun ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card/50">
              <Settings className="w-12 h-12 mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-foreground">Configure your report and click Run Query</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              No results found for the selected criteria.
            </div>
          ) : (
            <Tabs 
              value={config.chartType || 'TABLE'} 
              onValueChange={(val: any) => setConfig({ ...config, chartType: val })} 
              className="flex-1 flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground font-medium">Found {results.length} record(s)</p>
                <TabsList>
                  <TabsTrigger value="TABLE">Table</TabsTrigger>
                  <TabsTrigger value="BAR" disabled={!config.groupBys?.length} title={!config.groupBys?.length ? "Select a 'Group By' field to enable charts" : ""}>Bar Chart</TabsTrigger>
                  <TabsTrigger value="PIE" disabled={!config.groupBys?.length} title={!config.groupBys?.length ? "Select a 'Group By' field to enable charts" : ""}>Pie Chart</TabsTrigger>
                  <TabsTrigger value="LINE" disabled={!config.groupBys?.length} title={!config.groupBys?.length ? "Select a 'Group By' field to enable charts" : ""}>Line Chart</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <TabsContent value="TABLE" className="flex-1 overflow-auto p-0 m-0 border-0 outline-none">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted sticky top-0 z-10 shadow-sm">
                      <tr>
                        {Object.keys(results[0]).map((key) => (
                          <th key={key} className="px-6 py-3 font-semibold">{key.replace(/([A-Z])/g, ' $1')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {results.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          {Object.keys(results[0]).map((key) => (
                            <td key={key} className="px-6 py-4 whitespace-nowrap text-foreground">
                              {String(row[key] ?? '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TabsContent>

                <TabsContent value="BAR" className="flex-1 p-6 m-0 border-0 outline-none flex items-center justify-center">
                  {renderChart()}
                </TabsContent>
                <TabsContent value="PIE" className="flex-1 p-6 m-0 border-0 outline-none flex items-center justify-center">
                  {renderChart()}
                </TabsContent>
                <TabsContent value="LINE" className="flex-1 p-6 m-0 border-0 outline-none flex items-center justify-center">
                  {renderChart()}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
