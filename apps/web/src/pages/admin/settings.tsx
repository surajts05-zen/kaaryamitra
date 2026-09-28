import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlatformSettings, useUpdatePlatformSettings } from '@/features/admin/hooks/use-admin-queries';
import { Mail, Sparkles, Save, CheckCircle2, Server } from 'lucide-react';

const settingsSchema = z.object({
  smtpHost: z.string().optional().or(z.literal('')),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional().or(z.literal('')),
  smtpPass: z.string().optional().or(z.literal('')),
  smtpFrom: z.string().optional().or(z.literal('')),
  enableGoogleSso: z.boolean().default(true),
  enableZohoSso: z.boolean().default(false),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function AdminSettingsPage() {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSettingsMutation = useUpdatePlatformSettings();
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (settings) {
      reset({
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || '',
        smtpPass: settings.smtpPass || '',
        smtpFrom: settings.smtpFrom || '',
        enableGoogleSso: settings.enableGoogleSso ?? true,
        enableZohoSso: settings.enableZohoSso ?? false,
      });
    }
  }, [settings, reset]);

  const onSubmit = (values: SettingsFormValues) => {
    setSuccessMsg(false);
    updateSettingsMutation.mutate(values, {
      onSuccess: () => {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Global platform settings for email dispatch and AI models (Super Admin access only).
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 text-sm font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span>Platform settings updated successfully! All workspace services will use these credentials.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Server Settings */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Email Server (SMTP) Configuration</CardTitle>
                <CardDescription>
                  Configure global outbound SMTP server for tenant welcome emails, notifications, and alerts.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                  {...register('smtpHost')}
                />
                {errors.smtpHost && <p className="text-xs text-destructive">{errors.smtpHost.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPort">Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  placeholder="587"
                  {...register('smtpPort')}
                />
                {errors.smtpPort && <p className="text-xs text-destructive">{errors.smtpPort.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP Username / Email</Label>
                <Input
                  id="smtpUser"
                  placeholder="user@example.com"
                  {...register('smtpUser')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPass">SMTP Password</Label>
                <Input
                  id="smtpPass"
                  type="password"
                  placeholder="••••••••••••"
                  {...register('smtpPass')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpFrom">Sender Email (From Address)</Label>
              <Input
                id="smtpFrom"
                placeholder="e.g. KaaryaMitra HR <noreply@kaaryamitra.com>"
                {...register('smtpFrom')}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to fall back to the SMTP Username.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SSO Settings */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Single Sign-On (SSO)</CardTitle>
                <CardDescription>
                  Enable or disable global SSO providers for all workspaces.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Google Workspace SSO</Label>
                <p className="text-sm text-muted-foreground">Allow users to sign in with their Google accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" {...register('enableGoogleSso')} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Zoho Accounts SSO</Label>
                <p className="text-sm text-muted-foreground">Allow users to sign in with their Zoho Mail/Workplace accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" {...register('enableZohoSso')} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </CardContent>
        </Card>



        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="flex items-center gap-2"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Server className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Platform Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
