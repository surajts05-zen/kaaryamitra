import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminRazorpaySettings, useUpdateRazorpaySettings } from '@/features/billing/hooks/use-billing-queries';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { KeyRound, ShieldAlert } from 'lucide-react';

const razorpaySettingsSchema = z.object({
  razorpayKeyId: z.string().min(1, 'Key ID is required'),
  razorpayKeySecret: z.string().min(1, 'Key Secret is required'),
  razorpayWebhookSecret: z.string().optional(),
});

type RazorpaySettingsForm = z.infer<typeof razorpaySettingsSchema>;

export function AdminBillingSettings() {
  const { data: settings, isLoading } = useAdminRazorpaySettings();
  const updateMutation = useUpdateRazorpaySettings();

  const form = useForm<RazorpaySettingsForm>({
    resolver: zodResolver(razorpaySettingsSchema),
    defaultValues: {
      razorpayKeyId: '',
      razorpayKeySecret: '',
      razorpayWebhookSecret: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        razorpayKeyId: settings.razorpayKeyId || '',
        razorpayKeySecret: settings.razorpayKeySecret || '',
        razorpayWebhookSecret: settings.razorpayWebhookSecret || '',
      });
    }
  }, [settings, form]);

  const onSubmit = (data: RazorpaySettingsForm) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Razorpay credentials updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Failed to update credentials');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure payment gateways and global billing settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle>Razorpay Configuration</CardTitle>
          </div>
          <CardDescription>
            Enter your Razorpay API keys to enable payments and subscription processing across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="razorpayKeyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key ID</FormLabel>
                    <FormControl>
                      <Input placeholder="rzp_live_..." {...field} />
                    </FormControl>
                    <FormDescription>Your Razorpay API Key ID</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="razorpayKeySecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Secret</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••••••••••" {...field} />
                    </FormControl>
                    <FormDescription>Your Razorpay API Key Secret (keep this secure)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="razorpayWebhookSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Secret</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••••••••••" {...field} />
                    </FormControl>
                    <FormDescription>The secret used to verify webhook payloads from Razorpay</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!settings?.razorpayKeyId && (
                <div className="rounded-md bg-amber-500/10 p-4 border border-amber-500/20">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        Configuration Required
                      </h3>
                      <div className="mt-2 text-sm text-amber-600/90 dark:text-amber-400/90">
                        <p>
                          Payments are currently disabled because Razorpay keys are not configured. Tenants will not be able to upgrade their plans until you save these credentials.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
