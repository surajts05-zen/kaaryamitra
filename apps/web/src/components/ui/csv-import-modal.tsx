import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { parseCsv, downloadSampleCsv } from '@/lib/csv-utils';
import { toast } from 'sonner';

export interface CsvHeaderConfig {
  key: string;
  label: string;
  required?: boolean;
}

interface CsvImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  sampleFilename: string;
  headers: CsvHeaderConfig[];
  sampleRows: string[][];
  onImport: (rows: Record<string, string>[]) => Promise<void>;
  isLoading?: boolean;
}

export function CsvImportModal({
  isOpen,
  onOpenChange,
  title,
  description,
  sampleFilename,
  headers,
  sampleRows,
  onImport,
  isLoading = false,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [parsing, setParsing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const normalizeRows = (rawRows: Record<string, string>[]) => {
    return rawRows.map((raw) => {
      const normalized: Record<string, string> = { ...raw };
      
      headers.forEach((h) => {
        const currentVal = normalized[h.key];
        if (currentVal !== undefined && currentVal.trim() !== '') {
          return;
        }

        const targetCleanKey = h.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const targetCleanLabel = h.label.toLowerCase().replace(/[^a-z0-9]/g, '');

        const matchingRawKey = Object.keys(raw).find((rawKey) => {
          const cleanRawKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanRawKey === targetCleanKey || cleanRawKey === targetCleanLabel || cleanRawKey.startsWith(targetCleanKey);
        });

        if (matchingRawKey && raw[matchingRawKey] !== undefined) {
          normalized[h.key] = raw[matchingRawKey];
        }
      });

      return normalized;
    });
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a valid .csv file');
      return;
    }
    setFile(file);
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const rawRows = parseCsv(text);
      const rows = normalizeRows(rawRows);
      setParsedRows(rows);
      setParsing(false);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const headerKeys = headers.map((h) => h.key);
    downloadSampleCsv(sampleFilename, headerKeys, sampleRows);
    toast.success('Sample CSV downloaded');
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
  };

  // Check row validity
  const isRowValid = (row: Record<string, string>) => {
    return headers.every((h) => {
      if (h.required) {
        const val = row[h.key];
        return val !== undefined && val.trim() !== '';
      }
      return true;
    });
  };

  const validRows = parsedRows.filter(isRowValid);

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      toast.error('No valid rows found to import');
      return;
    }
    try {
      await onImport(validRows);
      handleReset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Import failed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pr-6">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSample}
              className="gap-1.5 shrink-0 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
            >
              <Download className="h-3.5 w-3.5" />
              Download Sample CSV
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3">
          {!file ? (
            <div className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-8 text-center space-y-3 bg-muted/20 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-0.5">CSV files up to 5MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {parsedRows.length} rows found • {validRows.length} valid
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Change File
                </Button>
              </div>

              {parsing ? (
                <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                  Parsing CSV contents...
                </div>
              ) : parsedRows.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                  No rows detected in the uploaded CSV file.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <TableRow>
                        <TableHead className="w-[70px]">Status</TableHead>
                        {headers.map((h) => (
                          <TableHead key={h.key} className="text-xs font-semibold">
                            {h.label} {h.required && <span className="text-destructive">*</span>}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.slice(0, 50).map((row, idx) => {
                        const valid = isRowValid(row);
                        return (
                          <TableRow key={idx} className={!valid ? 'bg-destructive/5' : undefined}>
                            <TableCell>
                              {valid ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0 px-1.5 font-medium">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Valid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] py-0 px-1.5 font-medium">
                                  <AlertCircle className="h-3 w-3 mr-1" /> Invalid
                                </Badge>
                              )}
                            </TableCell>
                            {headers.map((h) => (
                              <TableCell key={h.key} className="text-xs text-foreground">
                                {row[h.key] || <span className="text-muted-foreground italic">empty</span>}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || validRows.length === 0 || isLoading}>
            {isLoading ? 'Importing...' : `Import ${validRows.length} Items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
