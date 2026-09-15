import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Loader2, ArrowLeft, Info, Receipt } from 'lucide-react';
import { usePlans, useSubscription, useCreateSubscription } from '@/features/billing/hooks/use-billing-queries';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { toast } from 'sonner';

export function CompanyPlanComparePage() {
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const { data: plansData, isLoading: loadingPlans } = usePlans();
  const { data: subData, isLoading: loadingSub } = useSubscription();
  const createMutation = useCreateSubscription();

  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [billingEmail, setBillingEmail] = useState(user?.email || '');
  
  // Track selected plan instead of instantly checking out
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string | null>(null);

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
  const currentPlanModules = subData.subscription.plan.modules || [];

  // Initialize selected plan once data is loaded if not set
  const activePlanSlug = selectedPlanSlug ?? currentPlanSlug;
  const selectedPlan = plans.find(p => p.slug === activePlanSlug);

  const toggleAddon = (key: string) => {
    const next = new Set(selectedAddons);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedAddons(next);
  };

  // Calculate Cart Totals
  let basePlanPrice = 0;
  if (selectedPlan && selectedPlan.slug !== 'ENTERPRISE') {
    basePlanPrice = Number(selectedPlan.monthlyPriceInr) || 0;
  }
  
  let addOnPrice = 0;
  selectedAddons.forEach(key => {
    const a = addons.find(a => a.key === key);
    if (a) addOnPrice += Number(a.monthlyPriceInr) || 0;
  });

  let monthlyTotal = basePlanPrice + addOnPrice;
  let finalTotal = monthlyTotal;

  let discountAmount = 0;
  if (isAnnual && selectedPlan && selectedPlan.slug !== 'ENTERPRISE') {
    const discountPct = selectedPlan.annualDiscountPct ?? 16;
    // Calculate total for 1 year
    const yearlySubtotal = monthlyTotal * 12;
    discountAmount = yearlySubtotal * (discountPct / 100);
    finalTotal = yearlySubtotal - discountAmount;
  }

  const handleCheckout = () => {
    if (!selectedPlan) return;
    
    if (selectedPlan.slug === 'ENTERPRISE') {
      navigate('/contact');
      return;
    }

    createMutation.mutate(
      {
        planSlug: selectedPlan.slug as any,
        billingCycle: isAnnual ? 'ANNUAL' : 'MONTHLY',
        currency: 'INR',
        addonKeys: Array.from(selectedAddons),
        customerEmail: billingEmail,
      },
      {
        onSuccess: (data) => {
          if (data.razorpayPaymentUrl) {
            window.location.href = data.razorpayPaymentUrl; // Redirect to Razorpay checkout
          } else {
            // If total > 0 but no URL returned, gateway is missing
            if (finalTotal > 0) {
              toast.error('Payment gateway is not configured. Please contact support.');
            } else {
              toast.success('Subscription updated successfully');
              navigate(`/t/${tenant?.slug}/settings/billing`);
            }
          }
        },
      }
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] pb-20">
      <div className="flex-1 space-y-10">
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

        <div className="flex justify-center items-center space-x-4 py-4 bg-muted/30 rounded-xl max-w-md mx-auto border border-border/50">
          <Label htmlFor="billing-cycle" className={`text-lg cursor-pointer ${!isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </Label>
          <Switch
            id="billing-cycle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="billing-cycle" className={`text-lg flex items-center space-x-2 cursor-pointer ${isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
            <span>Annual</span>
            <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold">Save 16%</span>
          </Label>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.slug === currentPlanSlug;
            const isCustom = plan.slug === 'ENTERPRISE';
            const isSelected = plan.slug === activePlanSlug;
            
            let displayPrice = plan.monthlyPriceInr;
            if (isAnnual && !isCustom) {
              displayPrice = displayPrice * (1 - ((plan.annualDiscountPct ?? 16) / 100));
            }

            return (
              <Card 
                key={plan.id} 
                className={`flex flex-col relative transition-all duration-200 cursor-pointer hover:border-primary/50 ${isSelected ? 'border-primary ring-2 ring-primary shadow-md' : ''}`}
                onClick={() => setSelectedPlanSlug(plan.slug)}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-muted text-muted-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                    Current Plan
                  </div>
                )}
                {isSelected && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    Selected
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
                        <span className="text-4xl font-bold tracking-tight">{formatCurrency(displayPrice, 'INR')}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-primary shrink-0" />
                      {plan.maxEmployees ? `Up to ${plan.maxEmployees} employees` : 'Unlimited employees'}
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-primary shrink-0" />
                      {plan.maxStorageMb ? `${plan.maxStorageMb / 1000}GB Storage` : 'Unlimited Storage'}
                    </li>
                    {plan.modules.map((mod) => (
                      <li key={mod} className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-primary shrink-0" />
                        {addons.find(a => a.key === mod)?.name || mod.replace('_', ' ')}
                      </li>
                    ))}
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-primary shrink-0" />
                      Bring Your Own (BYO) AI API Key
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <div className={`w-full text-center text-sm font-medium py-2 rounded-md ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Optional Add-ons</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addons.filter(a => a.monthlyPriceInr > 0).map((addon) => {
              const isSelected = selectedAddons.has(addon.key);
              // Check if addon is already included in the selected plan
              const isIncluded = selectedPlan?.modules.includes(addon.key) ?? false;

              let price = Number(addon.monthlyPriceInr);
              if (isAnnual) price = price * 0.84; // apply 16% discount assumption for display

              return (
                <Card 
                  key={addon.id} 
                  className={`transition-all ${isSelected && !isIncluded ? 'border-primary ring-1 ring-primary/50' : ''} ${isIncluded ? 'opacity-70 bg-muted/50' : 'cursor-pointer hover:border-primary/40'}`}
                  onClick={() => {
                    if (!isIncluded) toggleAddon(addon.key);
                  }}
                >
                  <CardHeader className="pb-3 px-4 pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{addon.name}</CardTitle>
                        <div className="text-sm font-semibold text-primary mt-1">
                          {isIncluded ? 'Included in Plan' : `+ ${formatCurrency(price, 'INR')}/mo`}
                        </div>
                      </div>
                      <Switch 
                        disabled={isIncluded}
                        checked={isIncluded || isSelected} 
                        onCheckedChange={() => {
                          if (!isIncluded) toggleAddon(addon.key);
                        }} 
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground">
                      {addon.key === 'ai' ? 'Use KaaryaMitra\'s managed platform API keys instead of your own. ' : ''}
                      {addon.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart Summary Sidebar */}
      <div className="lg:w-[350px] shrink-0">
        <div className="sticky top-20">
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <CardTitle>Order Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Plan Row */}
              <div className="flex justify-between items-start text-sm">
                <div>
                  <div className="font-medium">{selectedPlan?.name || 'No Plan Selected'} Plan</div>
                  <div className="text-muted-foreground text-xs">{isAnnual ? 'Billed annually' : 'Billed monthly'}</div>
                </div>
                <div className="font-medium">
                  {selectedPlan?.slug === 'ENTERPRISE' ? 'Custom' : formatCurrency(basePlanPrice * (isAnnual ? 12 : 1), 'INR')}
                </div>
              </div>

              {/* Addons Rows */}
              {selectedAddons.size > 0 && selectedPlan?.slug !== 'ENTERPRISE' && (
                <div className="space-y-2 pt-2 border-t border-dashed">
                  {Array.from(selectedAddons).map(key => {
                    const a = addons.find(a => a.key === key);
                    if (!a) return null;
                    // Skip if included in plan (should auto-uncheck, but just in case)
                    if (selectedPlan?.modules.includes(key)) return null;
                    return (
                      <div key={key} className="flex justify-between text-sm text-muted-foreground">
                        <span>+ {a.name}</span>
                        <span>{formatCurrency(Number(a.monthlyPriceInr) * (isAnnual ? 12 : 1), 'INR')}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Discounts */}
              {discountAmount > 0 && selectedPlan?.slug !== 'ENTERPRISE' && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-medium pt-2 border-t border-dashed">
                  <span>Annual Discount</span>
                  <span>- {formatCurrency(discountAmount, 'INR')}</span>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-base font-semibold">Total Due Today</span>
                  <span className="text-xl font-bold text-primary">
                    {selectedPlan?.slug === 'ENTERPRISE' ? 'Custom' : formatCurrency(finalTotal, 'INR')}
                  </span>
                </div>
                {selectedPlan?.slug !== 'ENTERPRISE' && finalTotal > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    Plus applicable taxes
                  </p>
                )}
              </div>
              
              <div className="pt-2">
                <Label htmlFor="billingEmail" className="text-xs">Billing Email (Invoices will be sent here)</Label>
                <div className="mt-1">
                  <input 
                    id="billingEmail"
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="admin@company.com"
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-muted/10 pt-4 flex-col gap-3">
              <Button 
                className="w-full h-12 text-base" 
                size="lg"
                disabled={!selectedPlan || (selectedPlan.slug === currentPlanSlug && selectedAddons.size === 0) || createMutation.isPending}
                onClick={handleCheckout}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {selectedPlan?.slug === 'ENTERPRISE' 
                  ? 'Contact Sales' 
                  : finalTotal === 0 
                    ? 'Confirm Changes' 
                    : 'Proceed to Checkout'}
              </Button>
              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/30 rounded-md">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  You can change or cancel your subscription at any time. By proceeding, you agree to our Terms of Service.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
