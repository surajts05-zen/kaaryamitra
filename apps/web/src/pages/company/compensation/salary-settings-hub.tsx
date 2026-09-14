import React, { useState } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Coins, ShieldAlert, CreditCard, Settings as SettingsIcon } from 'lucide-react';
import SalaryComponentsPage from './salary-components';
import SalaryStructuresPage from './salary-structures';
import { StatutorySettingsPage } from '../settings/statutory';
import PayrollSettingsPage from '../payroll/settings';

interface SalarySettingsHubPageProps {
  defaultTab?: 'components' | 'structures' | 'statutory' | 'payslips';
}

export function SalarySettingsHubPage({ defaultTab = 'components' }: SalarySettingsHubPageProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  return (
    <div className="space-y-6 w-full pb-12">
      <Breadcrumb
        items={[
          { label: 'Company Settings', path: '../settings' },
          { label: 'Salary & Payroll Settings' },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Salary &amp; Payroll Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage salary components, pay structures, statutory tax rules, and payslip templates.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="components" className="flex items-center gap-2 py-2.5 text-sm font-medium">
            <Wallet className="h-4 w-4" />
            <span>Salary Components</span>
          </TabsTrigger>

          <TabsTrigger value="structures" className="flex items-center gap-2 py-2.5 text-sm font-medium">
            <Coins className="h-4 w-4" />
            <span>Salary Structures</span>
          </TabsTrigger>

          <TabsTrigger value="statutory" className="flex items-center gap-2 py-2.5 text-sm font-medium">
            <ShieldAlert className="h-4 w-4" />
            <span>Statutory Compliances</span>
          </TabsTrigger>

          <TabsTrigger value="payslips" className="flex items-center gap-2 py-2.5 text-sm font-medium">
            <CreditCard className="h-4 w-4" />
            <span>Payslip Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="mt-0">
          <SalaryComponentsPage />
        </TabsContent>

        <TabsContent value="structures" className="mt-0">
          <SalaryStructuresPage />
        </TabsContent>

        <TabsContent value="statutory" className="mt-0">
          <StatutorySettingsPage />
        </TabsContent>

        <TabsContent value="payslips" className="mt-0">
          <PayrollSettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SalarySettingsHubPage;
