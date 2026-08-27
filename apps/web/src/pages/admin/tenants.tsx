import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminTenants, useCreateTenant, useResetTenantPassword } from '@/features/admin/hooks/use-admin-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyRound, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Lowercase, alphanumeric and dashes only'),
  plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']),
  adminFirstName: z.string().min(1, 'First name required'),
  adminLastName: z.string().min(1, 'Last name required'),
  adminEmail: z.string().email('Invalid email'),
});

type CreateTenantFormValues = z.infer<typeof createTenantSchema>;

export function AdminTenantsPage() {
  const { data: tenants, isLoading } = useAdminTenants();
  const createTenant = useCreateTenant();
  const resetPasswordMutation = useResetTenantPassword();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{ tenantName: string; email: string; generatedPassword: string } | null>(null);

  const copyToClipboard = (email: string, password: string) => {
    const text = `Admin Email: ${email}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard!');
  };

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { plan: 'FREE' },
  });

  const onSubmit = (data: CreateTenantFormValues) => {
    createTenant.mutate(data, {
      onSuccess: (res) => {
        toast.success(`Tenant ${res.tenant.name} created successfully!`);
        setNewCredentials({
          email: res.adminUser.email,
          password: res.adminUser.generatedPassword,
        });
        reset();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || 'Failed to create tenant');
      }
    });
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">Create Workspace</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Provision a new tenant. An initial admin account will be automatically generated.
              </DialogDescription>
            </DialogHeader>

            {newCredentials ? (
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20">
                  <h4 className="text-sm font-semibold text-emerald-600 mb-2">Workspace Created Successfully!</h4>
                  <p className="text-sm text-muted-foreground mb-4">Please copy these credentials immediately. The password is not stored in plaintext.</p>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="font-medium">Admin Email:</span>
                    <span className="font-mono">{newCredentials.email}</span>
                    <span className="font-medium">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{newCredentials.password}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(newCredentials.email, newCredentials.password)}
                        title="Copy credentials"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(newCredentials.email, newCredentials.password)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Credentials
                  </Button>
                  <Button onClick={() => { setNewCredentials(null); setIsCreateModalOpen(false); }}>Close</Button>
                </DialogFooter>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Workspace Name</Label>
                    <Input placeholder="Acme Corp" {...register('name')} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>URL Slug</Label>
                    <Input placeholder="acme" {...register('slug')} />
                    {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select onValueChange={(val: string) => setValue('plan', val as any)} defaultValue="FREE">
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="STARTER">Starter</SelectItem>
                      <SelectItem value="GROWTH">Growth</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.plan && <p className="text-xs text-destructive">{errors.plan.message}</p>}
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Admin Account</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input placeholder="John" {...register('adminFirstName')} />
                    {errors.adminFirstName && <p className="text-xs text-destructive">{errors.adminFirstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input placeholder="Doe" {...register('adminLastName')} />
                    {errors.adminLastName && <p className="text-xs text-destructive">{errors.adminLastName.message}</p>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Admin Email</Label>
                  <Input type="email" placeholder="admin@acmecorp.com" {...register('adminEmail')} />
                  {errors.adminEmail && <p className="text-xs text-destructive">{errors.adminEmail.message}</p>}
                </div>

                <DialogFooter className="pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createTenant.isPending}>
                    {createTenant.isPending ? 'Creating...' : 'Create Workspace'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workspaces</CardTitle>
          <CardDescription>Manage and monitor all tenant instances on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                </TableRow>
              ) : !tenants?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No tenants found.</TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell><code className="bg-muted px-1 py-0.5 rounded text-xs">{tenant.slug}</code></TableCell>
                    <TableCell><Badge variant="outline">{tenant.plan}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'destructive'}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{tenant._count?.users ?? 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          resetPasswordMutation.mutate(tenant.id, {
                            onSuccess: (data) => {
                              setResetCredentials({ tenantName: tenant.name, ...data });
                            },
                            onError: (err: any) => {
                              toast.error(err.response?.data?.error?.message || 'Failed to reset password');
                            },
                          });
                        }}
                        disabled={resetPasswordMutation.isPending}
                      >
                        <KeyRound className="h-3.5 w-3.5 mr-1" />
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Password Reset Modal */}
      <Dialog open={!!resetCredentials} onOpenChange={(open) => !open && setResetCredentials(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
            <DialogDescription>
              New credentials generated for {resetCredentials?.tenantName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20">
              <h4 className="text-sm font-semibold text-emerald-600 mb-2">New Password Generated</h4>
              <p className="text-sm text-muted-foreground mb-4">Please copy and share this password securely with the workspace administrator.</p>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className="font-medium">Admin Email:</span>
                <span className="font-mono">{resetCredentials?.email}</span>
                <span className="font-medium">New Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-600">{resetCredentials?.generatedPassword}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => resetCredentials && copyToClipboard(resetCredentials.email, resetCredentials.generatedPassword)}
                    title="Copy credentials"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => resetCredentials && copyToClipboard(resetCredentials.email, resetCredentials.generatedPassword)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Credentials
            </Button>
            <Button onClick={() => setResetCredentials(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
