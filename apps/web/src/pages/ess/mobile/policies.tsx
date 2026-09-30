import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useESSPolicies } from '@/features/company/hooks/use-policies-queries';

export function MobileESSPoliciesList() {
  const { slug } = useParams();
  const { data: policies, isLoading } = useESSPolicies();

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

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
    <div className="flex flex-col pb-20 space-y-4">
      <div className="flex items-center gap-3">
        <Link to=".." relative="path" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Policies</h1>
          <p className="text-xs text-muted-foreground">Company rules & guidelines</p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.values(categories || {}).map((category: any, i: number) => (
          <div key={i} className="space-y-3">
            <h2 className="text-sm font-semibold border-b pb-1.5">{category.name}</h2>
            <div className="grid grid-cols-1 gap-3">
              {category.policies.map((policy: any) => {
                const needsAck = policy.requiresAck && (!policy.myAcknowledgement || policy.myAcknowledgement.status === 'PENDING');
                const isAcknowledged = policy.requiresAck && policy.myAcknowledgement?.status === 'ACKNOWLEDGED';

                return (
                  <Card key={policy.id} className={`flex flex-col ${needsAck ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' : ''}`}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-sm leading-tight">{policy.title}</CardTitle>
                        {needsAck && (
                          <Badge variant="outline" className="shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 text-[9px] px-1.5 py-0">
                            Action Req.
                          </Badge>
                        )}
                        {isAcknowledged && (
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                      </div>
                      {policy.description && <CardDescription className="text-xs line-clamp-2 mt-1.5">{policy.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="p-4 pt-0 mt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-[10px] text-muted-foreground font-medium">
                          <FileText className="w-3 h-3 mr-1" />
                          v{policy.activeVersion?.versionNumber || 1}
                        </div>
                        <Button variant={needsAck ? "default" : "secondary"} size="sm" className="h-7 text-[10px] px-3" asChild>
                          <Link to={`/t/${slug}/my-policies/${policy.activeVersion?.id}`}>
                            {needsAck ? 'Review' : 'Read'}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {policies?.length === 0 && (
          <div className="text-center py-16 border border-dashed rounded-xl text-muted-foreground bg-muted/20">
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No published policies.</p>
          </div>
        )}
      </div>
    </div>
  );
}
