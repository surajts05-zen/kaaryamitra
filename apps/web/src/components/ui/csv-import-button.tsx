import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

interface CsvImportButtonProps {
  onDataParsed: (data: any[]) => void;
  isLoading?: boolean;
  label?: string;
  title?: string;
  sampleCsv?: string;
}

export function CsvImportButton({ onDataParsed, isLoading, label = 'Import CSV', title = 'Import Data', sampleCsv }: CsvImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().toLowerCase(),
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file');
          console.error(results.errors);
          return;
        }
        
        console.log("CSV Parsed fields:", results.meta.fields);
        console.log("CSV Parsed data[0]:", results.data[0]);

        onDataParsed(results.data);
        
        // Reset input and close modal
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsOpen(false);
      },
      error: (error) => {
        toast.error('Failed to read file');
        console.error(error);
      }
    });
  };

  const handleDownloadSample = () => {
    if (!sampleCsv) return;
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          <UploadCloud className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import records. Please ensure your CSV matches the required format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <UploadCloud className="h-10 w-10 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
            Click below to select a CSV file from your computer.
          </p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            Select File
          </Button>
        </div>

        {sampleCsv && (
          <div className="flex justify-between items-center mt-2 p-3 bg-muted/50 rounded-md">
            <span className="text-sm text-muted-foreground">Need a template?</span>
            <Button variant="ghost" size="sm" onClick={handleDownloadSample}>
              <Download className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
