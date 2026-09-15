import { useState } from 'react';
import { useAdminPlans, useAdminAddons, useUpdateAdminPlan, useUpdateAdminAddon } from '@/features/billing/hooks/use-billing-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Edit2 } from 'lucide-react';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export function AdminBillingPlans() {
  const { data: plans, isLoading: loadingPlans } = useAdminPlans();
  const { data: addons, isLoading: loadingAddons } = useAdminAddons();
  
  const updatePlan = useUpdateAdminPlan();
  const updateAddon = useUpdateAdminAddon();

  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingAddon, setEditingAddon] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<any>({});

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      monthlyPriceInr: plan.monthlyPriceInr,
      monthlyPriceUsd: plan.monthlyPriceUsd,
      razorpayMonthlyPlanId: plan.razorpayMonthlyPlanId || '',
      razorpayAnnualPlanId: plan.razorpayAnnualPlanId || '',
    });
  };

  const handleEditAddon = (addon: any) => {
    setEditingAddon(addon);
    setFormData({
      monthlyPriceInr: addon.monthlyPriceInr,
      monthlyPriceUsd: addon.monthlyPriceUsd,
      razorpayMonthlyPlanId: addon.razorpayMonthlyPlanId || '',
    });
  };

  const savePlan = () => {
    if (!editingPlan) return;
    updatePlan.mutate(
      { id: editingPlan.id, data: formData },
      {
        onSuccess: () => {
          toast.success('Plan updated successfully');
          setEditingPlan(null);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error?.message || 'Failed to update plan');
        },
      }
    );
  };

  const saveAddon = () => {
    if (!editingAddon) return;
    updateAddon.mutate(
      { id: editingAddon.id, data: formData },
      {
        onSuccess: () => {
          toast.success('Add-on updated successfully');
          setEditingAddon(null);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error?.message || 'Failed to update add-on');
        },
      }
    );
  };

  if (loadingPlans || loadingAddons) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plans & Add-ons</h1>
        <p className="text-muted-foreground mt-2">
          Configure subscription plans, pricing, and map them to Razorpay Plan IDs.
        </p>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="addons">Module Add-ons</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          {plans?.map((plan: any) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {plan.isPublic ? <Badge variant="secondary">Public</Badge> : <Badge variant="outline">Hidden</Badge>}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Configuration
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Monthly Price (INR)</span>
                    <span className="font-medium">{formatCurrency(plan.monthlyPriceInr, 'INR')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Monthly Price (USD)</span>
                    <span className="font-medium">{formatCurrency(plan.monthlyPriceUsd, 'USD')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Razorpay Monthly ID</span>
                    <span className="font-mono text-xs">{plan.razorpayMonthlyPlanId || 'Not Configured'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Razorpay Annual ID</span>
                    <span className="font-mono text-xs">{plan.razorpayAnnualPlanId || 'Not Configured'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="addons" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {addons?.map((addon: any) => (
              <Card key={addon.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{addon.name}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleEditAddon(addon)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{addon.description}</CardDescription>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Monthly Price</span>
                      <span className="font-medium">{formatCurrency(addon.monthlyPriceInr, 'INR')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Razorpay Plan ID</span>
                      <span className="font-mono text-xs">{addon.razorpayMonthlyPlanId || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Plan Drawer */}
      <Drawer open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg p-6">
            <DrawerHeader>
              <DrawerTitle>Edit {editingPlan?.name} Plan</DrawerTitle>
              <DrawerDescription>Update pricing and Razorpay integration IDs for this plan.</DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price (INR)</Label>
                  <Input 
                    type="number" 
                    value={formData.monthlyPriceInr || ''} 
                    onChange={e => setFormData({ ...formData, monthlyPriceInr: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Price (USD)</Label>
                  <Input 
                    type="number" 
                    value={formData.monthlyPriceUsd || ''} 
                    onChange={e => setFormData({ ...formData, monthlyPriceUsd: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Razorpay Monthly Plan ID</Label>
                <Input 
                  placeholder="plan_..."
                  value={formData.razorpayMonthlyPlanId || ''} 
                  onChange={e => setFormData({ ...formData, razorpayMonthlyPlanId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Razorpay Annual Plan ID</Label>
                <Input 
                  placeholder="plan_..."
                  value={formData.razorpayAnnualPlanId || ''} 
                  onChange={e => setFormData({ ...formData, razorpayAnnualPlanId: e.target.value })}
                />
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={savePlan} disabled={updatePlan.isPending}>
                {updatePlan.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit Add-on Drawer */}
      <Drawer open={!!editingAddon} onOpenChange={(open) => !open && setEditingAddon(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg p-6">
            <DrawerHeader>
              <DrawerTitle>Edit {editingAddon?.name}</DrawerTitle>
              <DrawerDescription>Update pricing and Razorpay mapping for this add-on.</DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price (INR)</Label>
                  <Input 
                    type="number" 
                    value={formData.monthlyPriceInr || ''} 
                    onChange={e => setFormData({ ...formData, monthlyPriceInr: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Price (USD)</Label>
                  <Input 
                    type="number" 
                    value={formData.monthlyPriceUsd || ''} 
                    onChange={e => setFormData({ ...formData, monthlyPriceUsd: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Razorpay Plan ID</Label>
                <Input 
                  placeholder="plan_..."
                  value={formData.razorpayMonthlyPlanId || ''} 
                  onChange={e => setFormData({ ...formData, razorpayMonthlyPlanId: e.target.value })}
                />
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={saveAddon} disabled={updateAddon.isPending}>
                {updateAddon.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
