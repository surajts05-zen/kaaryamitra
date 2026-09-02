import React, { useState } from 'react';
import { useEmployeeDocuments, useUploadDocument, useDocumentCategories, useVerifyDocument, usePreviewDocument, type EmployeeDocument } from '@/features/company/hooks/use-documents-queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Eye, CheckCircle, XCircle, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAiExtract } from '@/features/ai/hooks/use-ai-chat';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function EmployeeDocumentsTab({ employeeId }: { employeeId: string }) {
  const { data: documents = [], isLoading } = useEmployeeDocuments(employeeId);
  const { data: categories = [] } = useDocumentCategories();
  const uploadDoc = useUploadDocument(employeeId);
  const verifyDoc = useVerifyDocument(employeeId);
  const previewDoc = usePreviewDocument();
  const extractMutation = useAiExtract();

  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleUpload = async () => {
    if (!file || !categoryId || !title) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', categoryId);
    formData.append('title', title);
    if (expiresAt) formData.append('expiresAt', expiresAt);

    await uploadDoc.mutateAsync(formData);
    setIsOpen(false);
    setFile(null);
    setCategoryId('');
    setTitle('');
    setExpiresAt('');
  };

  const handlePreview = async (doc: EmployeeDocument) => {
    const url = await previewDoc.mutateAsync(doc.id);
    if (url) window.open(url, '_blank');
  };

  const handleVerify = async (id: string, status: string) => {
    await verifyDoc.mutateAsync({ id, status });
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', 'Extract the document title and guess the category. Return a JSON object with "title" (string) and "category" (string). Examples of categories might be ID Proof, Resume, Offer Letter, Address Proof.');
    
    toast.promise(extractMutation.mutateAsync(formData), {
      loading: 'Extracting document details...',
      success: (data) => {
        if (data.title) setTitle(data.title);
        // We can't perfectly auto-select category because we need the category ID, but we can set the title
        return `Extracted title: ${data.title}`;
      },
      error: 'Failed to extract document details',
    });
  };

  if (isLoading) return <div>Loading documents...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Documents</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2 flex flex-col gap-2">
                <Label>File (Max 5MB)</Label>
                <div className="flex gap-2 items-center">
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="flex-1" />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="text-km-forest"
                    disabled={!file || extractMutation.isPending}
                    onClick={handleExtract}
                  >
                    <Sparkles className="h-4 w-4 mr-2 text-km-lime" />
                    Auto-fill Title
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Passport Front Page" />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!file || !categoryId || !title || uploadDoc.isPending}>
                {uploadDoc.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {doc.title}
                </CardTitle>
                <Badge variant={doc.status === 'VALID' ? 'default' : 'destructive'}>
                  {doc.status}
                </Badge>
              </div>
              <CardDescription>{doc.category.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</p>
                {doc.expiresAt && <p>Expires: {new Date(doc.expiresAt).toLocaleDateString()}</p>}
                <p>Status: {doc.isVerified ? <span className="text-green-600">Verified</span> : <span className="text-orange-500">Pending Verification</span>}</p>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => handlePreview(doc)}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
                
                {!doc.isVerified && (
                  <>
                    <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleVerify(doc.id, 'VALID')}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleVerify(doc.id, 'ARCHIVED')}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground border rounded-lg border-dashed">
            No documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
