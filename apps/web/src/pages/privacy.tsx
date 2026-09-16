import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrivacyPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-background text-foreground">
      <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" /> Vyoma Labs Compliance Verified
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Privacy Policy & Data Consent</h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: September 16, 2026 | Domain: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">kaaryamitra.vyomalabs.online</code>
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed border-t pt-8">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">1. Introduction & Ecosystem Overview</h2>
              <p>
                KaaryaMitra ("the Platform", "we", "us", or "our"), hosted at <code>kaaryamitra.vyomalabs.online</code>, is an AI-powered enterprise HR Operating System developed and operated under the <strong>Vyoma Labs</strong> digital ecosystem. We respect your privacy and are committed to protecting personal data collected through your use of our websites, application, and self-service portals.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
              <p>We collect information to provide, maintain, and enhance our services to your organization:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account & Organization Information:</strong> Name, work email address, company name, department, designation, and contact details provided during tenant setup or account creation.</li>
                <li><strong>Employee Self-Service (ESS) Data:</strong> Attendance logs, shift preferences, leave applications, timesheets, reimbursement receipts, asset allocations, and support ticket descriptions.</li>
                <li><strong>Single Sign-On (Google OAuth 2.0):</strong> When you log in or register using Google SSO, we request access to your primary email address (<code>https://www.googleapis.com/auth/userinfo.email</code>) and profile information (<code>https://www.googleapis.com/auth/userinfo.profile</code>).</li>
                <li><strong>Technical & Usage Data:</strong> IP address, device type, browser user-agent, session identifiers, and security logs for audit trailing.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">3. Google User Data Policy & Limited Use Disclosure</h2>
              <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-2">
                <p className="font-semibold text-foreground">Google OAuth Data Usage Commitment:</p>
                <p>
                  KaaryaMitra's use and transfer of information received from Google APIs to any other app will adhere to the <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>We strictly use your Google profile email and name to verify user identity and create/authenticate your user account within your company's tenant workspace.</li>
                  <li>We <strong>DO NOT</strong> sell, rent, or trade your Google user data to advertisers or data brokers.</li>
                  <li>We <strong>DO NOT</strong> use Google user data for training AI models or artificial intelligence foundation models without explicit organizational opt-in.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">4. How We Use Your Data</h2>
              <p>Your data is processed strictly for legitimate business HR operations:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Managing tenant provisioning and user role assignments (Super Admin, Company Admin, Employee).</li>
                <li>Processing leave approvals, attendance check-ins, shift schedules, and payroll generation.</li>
                <li>Delivering support ticket resolution via the internal helpdesk.</li>
                <li>Generating anonymized usage metrics and system performance diagnostics.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">5. Data Isolation & Security Standards</h2>
              <p>
                KaaryaMitra employs strict multi-tenant architecture with logical database separation (Row-Level Security and Tenant ID isolation). All data transmitted between your browser and our servers is encrypted using industry-standard TLS 1.3 encryption. Data stored at rest is encrypted using AES-256 standards.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">6. Data Retention & Deletion Rights</h2>
              <p>
                We retain personal data as long as your tenant account remains active or as required by applicable labor and tax laws. Organization administrators may export employee records or request permanent account deletion by contacting <code>privacy@vyomalabs.online</code>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">7. Contact & Grievance Redressal</h2>
              <p>
                If you have questions regarding this Privacy Policy, your consent preferences, or wish to exercise data subject rights, please contact our privacy officer:
              </p>
              <div className="bg-muted p-4 rounded-lg text-xs space-y-1 font-mono">
                <p><strong>Vyoma Labs Privacy & Legal Operations</strong></p>
                <p>Domain: kaaryamitra.vyomalabs.online</p>
                <p>Email: privacy@vyomalabs.online / support@kaaryamitra.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

