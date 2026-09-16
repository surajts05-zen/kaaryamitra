import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TermsPage() {
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
            <ShieldCheck className="h-3.5 w-3.5" /> Vyoma Labs Legal Policy
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: September 16, 2026 | Domain: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">kaaryamitra.vyomalabs.online</code>
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed border-t pt-8">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">1. Agreement to Terms</h2>
              <p>
                By creating an account, registering a company tenant, or accessing KaaryaMitra ("the Platform") at <code>kaaryamitra.vyomalabs.online</code>, you agree to be bound by these Terms of Service ("Terms") provided by <strong>Vyoma Labs</strong>. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">2. Tenant Workspaces & User Roles</h2>
              <p>
                KaaryaMitra operates on a multi-tenant model where organizations are provisioned dedicated workspaces identified by a unique company slug.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Tenant Administrators:</strong> Company Admins are responsible for managing employee provisioning, assign roles, setting up attendance policies, and ensuring subscription compliance.</li>
                <li><strong>Account Credentials:</strong> You are responsible for maintaining the confidentiality of your login credentials, including passwords and OAuth tokens. You must notify us immediately of any unauthorized account access.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">3. Subscription Plans & Billing Terms</h2>
              <p>
                KaaryaMitra offers tier-based plans (Free, Starter, Growth, Enterprise) as detailed on our Pricing page:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Free Plan:</strong> Provided for small teams up to 10 active employees. Subject to fair usage storage limits (500MB).</li>
                <li><strong>Paid Subscriptions:</strong> Billed on a recurring monthly or annual basis. Subscriptions automatically renew unless canceled prior to the renewal date.</li>
                <li><strong>Overage Rates:</strong> Additional employee allocations above plan limits will be billed at the stated per-employee overage rate (e.g., ₹59/employee/mo for Starter).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">4. Acceptable Use Policy</h2>
              <p>You agree not to use KaaryaMitra to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Upload malicious software, virus payloads, or engage in denial-of-service attacks.</li>
                <li>Attempt to bypass multi-tenant isolation barriers or access data belonging to another tenant.</li>
                <li>Reverse engineer, decompile, or attempt to extract source code from the Platform.</li>
                <li>Use automated bots or scrapers to extract platform data without authorization.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">5. Intellectual Property Rights</h2>
              <p>
                All rights, title, and interest in and to KaaryaMitra, including software code, branding, logos, design elements, and AI assistant integrations, remain the exclusive property of Vyoma Labs. You retain full ownership of all data, files, and employee records uploaded to your workspace.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Vyoma Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or related to your use of or inability to use the Platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">7. Service Modifications & Termination</h2>
              <p>
                We reserve the right to modify or discontinue features with reasonable notice. We may suspend or terminate your workspace access if you commit a material breach of these Terms or fail to pay subscription fees.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">8. Governing Law & Dispute Resolution</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the courts in India.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">9. Contact Us</h2>
              <p>
                For any questions or legal inquiries regarding these Terms of Service, please contact:
              </p>
              <div className="bg-muted p-4 rounded-lg text-xs space-y-1 font-mono">
                <p><strong>Vyoma Labs Legal Operations</strong></p>
                <p>Domain: kaaryamitra.vyomalabs.online</p>
                <p>Email: legal@vyomalabs.online / support@kaaryamitra.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

