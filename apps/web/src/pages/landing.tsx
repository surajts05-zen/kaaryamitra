import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  CheckCircle2, 
  Check, 
  Users, 
  HardDrive, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Building2, 
  Briefcase, 
  HelpCircle, 
  BarChart3, 
  Cpu 
} from 'lucide-react';

export function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Free',
      slug: 'FREE',
      monthlyPrice: 0,
      description: 'Essential HR & Leave management for small teams getting started.',
      maxEmployees: '10 employees',
      maxStorage: '500MB Storage',
      popular: false,
      buttonText: 'Get Started Free',
      buttonVariant: 'outline' as const,
      features: [
        'Core HR & Employee Profiles',
        'Leave Management & Approvals',
        'Employee Self Service (ESS)',
        'BYO Gemini AI Key Integration',
        'Community Support',
      ],
    },
    {
      name: 'Starter',
      slug: 'STARTER',
      monthlyPrice: 2999,
      description: 'Complete attendance and helpdesk for growing organizations.',
      maxEmployees: 'Up to 50 employees',
      maxStorage: '5GB Storage',
      popular: false,
      buttonText: 'Start Free Trial',
      buttonVariant: 'default' as const,
      features: [
        'Everything in Free',
        'Attendance & Shift Scheduling',
        'Timesheets & Tracking',
        'Internal Helpdesk & Support Tickets',
        'Overage Rate: ₹59/extra employee',
      ],
    },
    {
      name: 'Growth',
      slug: 'GROWTH',
      monthlyPrice: 7999,
      description: 'Advanced assets, performance, projects, and content library.',
      maxEmployees: 'Up to 250 employees',
      maxStorage: '25GB Storage',
      popular: true,
      buttonText: 'Start Free Trial',
      buttonVariant: 'default' as const,
      features: [
        'Everything in Starter',
        'Asset Management & Allocation',
        'Performance Reviews & Goals',
        'Project & Budget Tracking',
        'Content Library & Policy Center',
        'Advanced Reports & Analytics',
        'Overage Rate: ₹39/extra employee',
      ],
    },
    {
      name: 'Enterprise',
      slug: 'ENTERPRISE',
      monthlyPrice: 24999,
      description: 'Unlimited power with full payroll, AI assistant, and developer API.',
      maxEmployees: 'Unlimited employees',
      maxStorage: 'Unlimited Storage',
      popular: false,
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const,
      features: [
        'Everything in Growth',
        'Automated Payroll & Payslips',
        'Managed KaaryaMitra AI Assistant',
        'Developer Hub & Webhook APIs',
        'Dedicated Account Manager',
        'Custom SLA & 24/7 Priority Support',
      ],
    },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-background text-foreground flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="KaaryaMitra Logo" className="h-9 w-auto object-contain rounded-lg shadow-sm" />
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
              KaaryaMitra
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="transition hover:text-primary">Features</a>
            <a href="#pricing" className="transition hover:text-primary">Pricing</a>
            <a href="#modules" className="transition hover:text-primary">Modules</a>
            <Link to="/privacy" className="transition hover:text-primary">Privacy</Link>
            <Link to="/terms" className="transition hover:text-primary">Terms</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-semibold">Login</Button>
            </Link>
            <Link to="/register">
              <Button className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-b from-slate-50 via-emerald-50/20 to-background dark:from-slate-950 dark:via-emerald-950/10 dark:to-background">
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Next-Gen AI-Powered HR Operating System
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
              Empower Your Workforce with <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 dark:from-emerald-400 dark:to-teal-300">KaaryaMitra</span>
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto font-normal leading-relaxed">
              All-in-one HR platform for Attendance, Leave, Payroll, Performance, and Employee Self-Service. Built for modern businesses powered by Vyoma Labs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all">
                  Start Free Workspace <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#pricing" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 font-semibold border-slate-300 dark:border-slate-800">
                  Explore Plans & Pricing
                </Button>
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Free 14-day trial</span>
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Google SSO Enabled</span>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="py-20 border-t border-b bg-card/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                Everything You Need to Scale Your HR
              </h2>
              <p className="text-muted-foreground text-lg">
                Integrated modules designed to eliminate manual spreadsheet work and streamline your operations.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
                  title: 'Core HR & Self-Service',
                  description: 'Centralize employee records, documents, bank details, and personal profiles with role-based access control.'
                },
                {
                  icon: <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
                  title: 'Attendance & Leave Tracking',
                  description: 'Manage shifts, geo-fenced check-ins, leave balances, holiday calendars, and instant manager approval flows.'
                },
                {
                  icon: <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
                  title: 'Automated Payroll & Slips',
                  description: 'Calculate salary structures, statutory compliance, tax deductions, and distribute digital payslips in seconds.'
                },
                {
                  icon: <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
                  title: 'Performance & Goals',
                  description: 'Set company goals, conduct quarterly performance reviews, track KPIs, and foster employee continuous growth.'
                },
                {
                  icon: <HelpCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
                  title: 'Internal Ticket Helpdesk',
                  description: 'Enable employees to submit HR & IT support tickets with custom assignment and SLA resolution tracking.'
                },
                {
                  icon: <Cpu className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
                  title: 'AI HR Assistant',
                  description: 'Leverage embedded Gemini AI to draft policy documents, analyze employee sentiment, and query HR guidelines.'
                },
              ].map((item, index) => (
                <div key={index} className="p-8 border rounded-2xl bg-background hover:shadow-lg transition-all duration-200">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-gradient-to-b from-background to-slate-50 dark:to-slate-950">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Choose the right plan for your business. Upgrade or downgrade anytime.
              </p>

              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-4 bg-muted/50 p-2 rounded-full w-fit mx-auto border">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-all ${!isAnnual ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                  Monthly Billing
                </span>
                <Switch
                  checked={isAnnual}
                  onCheckedChange={setIsAnnual}
                  id="billing-cycle"
                />
                <Label htmlFor="billing-cycle" className={`text-sm font-semibold cursor-pointer px-3 py-1 rounded-full transition-all ${isAnnual ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground'}`}>
                  Annual Billing <span className="text-[11px] bg-emerald-400/20 px-2 py-0.5 rounded-full ml-1 text-emerald-300 font-bold">Save 16%</span>
                </Label>
              </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
              {plans.map((plan) => {
                const finalPrice = isAnnual && plan.monthlyPrice > 0 
                  ? Math.round(plan.monthlyPrice * 0.84) 
                  : plan.monthlyPrice;

                return (
                  <Card 
                    key={plan.slug} 
                    className={`flex flex-col relative transition-all duration-300 hover:shadow-2xl border-2 ${
                      plan.popular 
                        ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500/20 dark:bg-slate-900/80' 
                        : 'border-border bg-card'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                        Most Popular
                      </div>
                    )}
                    
                    <CardHeader className="pt-8">
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <CardDescription className="text-xs min-h-[36px] mt-1">{plan.description}</CardDescription>
                      <div className="mt-6">
                        {plan.slug === 'ENTERPRISE' ? (
                          <div className="text-4xl font-extrabold tracking-tight">Custom</div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight">
                              ₹{finalPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-muted-foreground text-sm font-medium">/month</span>
                          </div>
                        )}
                        {isAnnual && plan.monthlyPrice > 0 && plan.slug !== 'ENTERPRISE' && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                            Billed annually (₹{(finalPrice * 12).toLocaleString('en-IN')}/yr)
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-6">
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{plan.maxEmployees}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <HardDrive className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{plan.maxStorage}</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What's Included:</p>
                        <ul className="space-y-2.5 text-xs">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-muted-foreground leading-tight">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-6">
                      <Link to="/register" className="w-full">
                        <Button 
                          variant={plan.buttonVariant} 
                          className={`w-full font-semibold py-5 ${
                            plan.popular 
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg' 
                              : ''
                          }`}
                        >
                          {plan.buttonText}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="border-t py-12 bg-slate-900 text-slate-300">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <img src="/icon.png" alt="KaaryaMitra" className="h-8 w-auto object-contain rounded-md" />
                <span className="text-xl font-bold text-white tracking-tight">KaaryaMitra</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Next-generation HR operating system powering businesses worldwide. Powered by Vyoma Labs.
              </p>
              <p className="text-xs text-slate-500">
                https://kaaryamitra.vyomalabs.online
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing Plans</a></li>
                <li><Link to="/register" className="hover:text-white transition">Self Service Registration</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal & Compliance</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy & Consent</Link></li>
                <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Support & Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Vyoma Labs Ecosystem</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                KaaryaMitra is built with enterprise security, OAuth 2.0 integration, and GDPR/IT Act compliance standards.
              </p>
              <a href="https://vyomalabs.online" target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline">
                Visit Vyoma Labs Portal →
              </a>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Vyoma Labs / KaaryaMitra Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
              <Link to="/terms" className="hover:text-slate-300">Terms</Link>
              <Link to="/contact" className="hover:text-slate-300">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

