import React from 'react';
import { usePayrollSettings, useUpdatePayrollSettings } from '@/features/company/hooks/use-payroll-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, Palette, Receipt, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function PayrollSettingsPage() {
  const { data: settings, isLoading } = usePayrollSettings();
  const updateMutation = useUpdatePayrollSettings();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      companyLogoUrl: formData.get('companyLogoUrl') as string || null,
      authorizedSignatoryName: formData.get('authorizedSignatoryName') as string || null,
      authorizedSignatoryDesignation: formData.get('authorizedSignatoryDesignation') as string || null,
      themeColor: formData.get('themeColor') as string || '#000000',
      customMessage: formData.get('customMessage') as string || null,
    };

    try {
      await updateMutation.mutateAsync(data);
      toast.success('Payslip settings updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const themeColor = settings?.themeColor || '#000000';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payslip Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize the design and content of the employee payslips.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> Design Configuration
            </CardTitle>
            <CardDescription>Configure logos, colors, and signatories.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyLogoUrl" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Company Logo URL
                </Label>
                <Input 
                  id="companyLogoUrl" 
                  name="companyLogoUrl" 
                  type="url"
                  placeholder="https://example.com/logo.png" 
                  defaultValue={settings?.companyLogoUrl || ''} 
                />
                <p className="text-xs text-muted-foreground">Provide a public URL to your company logo image.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="themeColor">Theme Color (Hex)</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    id="themeColor" 
                    name="themeColor" 
                    type="color" 
                    className="w-16 h-10 p-1 cursor-pointer"
                    defaultValue={themeColor} 
                  />
                  <Input 
                    type="text" 
                    placeholder="#000000" 
                    className="font-mono uppercase w-32" 
                    defaultValue={themeColor} 
                    onChange={(e) => {
                      const colorInput = document.getElementById('themeColor') as HTMLInputElement;
                      if (colorInput && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
                        colorInput.value = e.target.value;
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm">Authorized Signatory</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="authorizedSignatoryName">Name</Label>
                    <Input 
                      id="authorizedSignatoryName" 
                      name="authorizedSignatoryName" 
                      placeholder="e.g. John Doe" 
                      defaultValue={settings?.authorizedSignatoryName || ''} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authorizedSignatoryDesignation">Designation</Label>
                    <Input 
                      id="authorizedSignatoryDesignation" 
                      name="authorizedSignatoryDesignation" 
                      placeholder="e.g. Director" 
                      defaultValue={settings?.authorizedSignatoryDesignation || ''} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="customMessage">Footer Message (Optional)</Label>
                <Input 
                  id="customMessage" 
                  name="customMessage" 
                  placeholder="e.g. For any queries, contact HR." 
                  defaultValue={settings?.customMessage || ''} 
                />
              </div>

              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Design Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Receipt className="w-4 h-4" /> Live Preview (Approximate)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background border rounded-lg p-6 shadow-sm pointer-events-none select-none">
              <div className="flex justify-between border-b pb-4" style={{ borderColor: themeColor }}>
                <div>
                  {settings?.companyLogoUrl ? (
                    <img src={settings.companyLogoUrl} alt="Logo" className="h-10 object-contain mb-2" />
                  ) : (
                    <h3 className="font-bold text-xl" style={{ color: themeColor }}>Acme Corp Ltd.</h3>
                  )}
                  <p className="text-xs text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right text-sm">
                  <p><span className="font-medium">Period:</span> 2026-09</p>
                  <p><span className="font-medium">Status:</span> FINALIZED</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div>
                  <h4 className="font-semibold pb-1 mb-2 border-b">Earnings</h4>
                  <div className="flex justify-between"><span className="text-muted-foreground">Basic</span><span>₹40,000</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">HRA</span><span>₹20,000</span></div>
                </div>
                <div>
                  <h4 className="font-semibold pb-1 mb-2 border-b">Deductions</h4>
                  <div className="flex justify-between"><span className="text-muted-foreground">PF</span><span>₹1,800</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₹2,500</span></div>
                </div>
              </div>

              <div className="bg-primary/5 p-3 rounded-lg flex justify-between items-center mt-6">
                <span className="font-bold">Net Payable</span>
                <span className="font-bold text-lg" style={{ color: themeColor }}>₹55,700</span>
              </div>

              <div className="mt-12 flex justify-between items-end text-sm">
                <p className="text-xs text-muted-foreground italic w-2/3">
                  {settings?.customMessage || 'This is a system generated document. No signature is required.'}
                </p>
                
                {(settings?.authorizedSignatoryName || settings?.authorizedSignatoryDesignation) && (
                  <div className="text-center w-1/3 border-t pt-2 border-dashed">
                    <p className="font-bold">{settings?.authorizedSignatoryName}</p>
                    <p className="text-xs text-muted-foreground">{settings?.authorizedSignatoryDesignation}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
