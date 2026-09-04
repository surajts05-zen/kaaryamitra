import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useESSPolicies } from '@/features/company/hooks/use-policies-queries';

export function ESSPoliciesList() {
  const { slug } = useParams();
  const { data: policies, isLoading } = useESSPolicies();

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Group by category
  const categories = policies?.reduce((acc: any, policy: any) => {
    const catId = policy.category.id;
    if (!acc[catId]) {
      acc[catId] = {
        name: policy.category.name,
        policies: []
      };
    }
    acc[catId].policies.push(policy);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Policies</h1>
        <p className="text-muted-foreground mt-1">Review and acknowledge important company policies and guidelines.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {Object.values(categories || {}).map((category: any, i: number) => (
          <div key={i} className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.policies.map((policy: any) => {
                const needsAck = policy.requiresAck && (!policy.myAcknowledgement || policy.myAcknowledgement.status === 'PENDING');
                const isAcknowledged = policy.requiresAck && policy.myAcknowledgement?.status === 'ACKNOWLEDGED';

                return (
                  <Card key={policy.id} className={`flex flex-col hover:border-primary/50 transition-colors ${needsAck ? 'border-amber-500/50 dark:border-amber-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{policy.title}</CardTitle>
                        {needsAck && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                            Action Required
                          </Badge>
                        )}
                        {isAcknowledged && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {policy.description && <CardDescription>{policy.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end">
                      <div className="flex items-center text-sm text-muted-foreground mt-4 mb-4">
                        <FileText className="w-4 h-4 mr-1.5" />
                        v{policy.activeVersion?.versionNumber || 1}
                      </div>
                      <Button variant={needsAck ? "default" : "secondary"} className="w-full" asChild>
                        <Link to={`/t/${slug}/my-policies/${policy.activeVersion?.id}`}>
                          {needsAck ? 'Review & Acknowledge' : 'Read Policy'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {policies?.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No published policies available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
