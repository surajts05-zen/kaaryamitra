import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { usePlans, useSubscription, useCreateSubscription } from '@/features/billing/hooks/use-billing-queries';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function CompanyPlanComparePage() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { data: plansData, isLoading: loadingPlans } = usePlans();
  const { data: subData, isLoading: loadingSub } = useSubscription();
  const createMutation = useCreateSubscription();

  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  if (loadingPlans || loadingSub) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!plansData || !subData) return null;

  const { plans, addons } = plansData;
  const currentPlanSlug = subData.subscription.plan.slug;

  const toggleAddon = (key: string) => {
    const next = new Set(selectedAddons);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedAddons(next);
  };

  const handleSubscribe = (planSlug: string) => {
    createMutation.mutate(
      {
        planSlug: planSlug as any,
        billingCycle: isAnnual ? 'ANNUAL' : 'MONTHLY',
        currency: 'INR', // TODO: user pref currency
        addonKeys: Array.from(selectedAddons),
      },
      {
        onSuccess: (data) => {
          if (data.razorpayPaymentUrl) {
            window.location.href = data.razorpayPaymentUrl; // Redirect to Razorpay checkout
          } else {
            navigate(`/t/${tenant?.slug}/settings/billing`);
          }
        },
      }
    );
  };

  return (
    <div className="space-y-10 max-w-7xl pb-20">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/t/${tenant?.slug}/settings/billing`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upgrade Your Plan</h1>
          <p className="text-muted-foreground mt-2">
            Choose the right plan and add-ons for your growing team.
          </p>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-4 py-4">
        <Label htmlFor="billing-cycle" className={`text-lg ${!isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
          Monthly
        </Label>
        <Switch
          id="billing-cycle"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <Label htmlFor="billing-cycle" className={`text-lg flex items-center space-x-2 ${isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
          <span>Annual</span>
          <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">Save 16%</span>
        </Label>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug;
          const isCustom = plan.slug === 'ENTERPRISE';
          
          let monthlyPrice = plan.monthlyPriceInr;
          if (isAnnual && !isCustom) {
            monthlyPrice = monthlyPrice * (1 - (plan.annualDiscountPct / 100));
          }

          return (
            <Card key={plan.id} className={`flex flex-col relative ${isCurrent ? 'border-primary ring-1 ring-primary' : ''}`}>
              {isCurrent && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Current Plan
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="h-10">{plan.description}</CardDescription>
                <div className="mt-4">
                  {isCustom ? (
                    <span className="text-4xl font-bold tracking-tight">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold tracking-tight">{formatCurrency(monthlyPrice, 'INR')}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    {plan.maxEmployees ? `Up to ${plan.maxEmployees} employees` : 'Unlimited employees'}
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    {plan.maxStorageMb ? `${plan.maxStorageMb / 1000}GB Storage` : 'Unlimited Storage'}
                  </li>
                  {plan.modules.slice(0, 5).map((mod) => (
                    <li key={mod} className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      {addons.find(a => a.key === mod)?.name || mod.replace('_', ' ')}
                    </li>
                  ))}
                  {plan.modules.length > 5 && (
                    <li className="text-muted-foreground italic ml-6">
                      + {plan.modules.length - 5} more features
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || createMutation.isPending}
                  onClick={() => handleSubscribe(plan.slug)}
                >
                  {createMutation.isPending && !isCurrent ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isCurrent ? 'Current Plan' : isCustom ? 'Contact Sales' : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-16 border-t pt-10">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Optional Add-ons</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addons.filter(a => a.monthlyPriceInr > 0).map((addon) => {
            const isSelected = selectedAddons.has(addon.key);
            // Some plans include addons by default. We should ideally check `subData.subscription.plan.modules`
            // But for simplicity in the UI, if they are already on a high tier, they don't need to check these.
            const isIncluded = subData.subscription.plan.modules.includes(addon.key);

            let price = addon.monthlyPriceInr;
            if (isAnnual) price = price * 0.84; // apply same 16% discount assumption for simplicity

            return (
              <Card key={addon.id} className={isSelected ? 'border-primary ring-1 ring-primary/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{addon.name}</CardTitle>
                    <Switch 
                      disabled={isIncluded}
                      checked={isIncluded || isSelected} 
                      onCheckedChange={() => toggleAddon(addon.key)} 
                    />
                  </div>
                  <CardDescription>{addon.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {isIncluded ? (
                      <span className="text-primary text-sm uppercase">Included in plan</span>
                    ) : (
                      <>+{formatCurrency(price, 'INR')}<span className="text-sm font-normal text-muted-foreground">/mo</span></>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
