import { useMyAssets, useAcknowledgeAsset } from '@/features/company/hooks/use-asset-queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Laptop, AlertTriangle, Monitor, Smartphone, Key, Info } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function MyAssets() {
  const { slug } = useParams();
  const { data: assets, isLoading } = useMyAssets();
  const acknowledge = useAcknowledgeAsset();

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('laptop') || name.includes('computer')) return <Laptop className="h-8 w-8" />;
    if (name.includes('monitor') || name.includes('display')) return <Monitor className="h-8 w-8" />;
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="h-8 w-8" />;
    if (name.includes('access') || name.includes('card') || name.includes('key')) return <Key className="h-8 w-8" />;
    return <Laptop className="h-8 w-8" />;
  };

  if (isLoading) return <div className="p-8 text-center">Loading your assets...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: 'My Assets' }]} backPath="dashboard" backLabel="Back to Dashboard" />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assets</h1>
        <p className="text-muted-foreground mt-1">Manage equipment and access cards assigned to you.</p>
      </div>

      {assets?.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No Assets Assigned</h2>
            <p className="text-muted-foreground mt-2 text-center max-w-sm">
              You currently do not have any company assets assigned to you. If you believe this is a mistake, please contact IT or HR.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets?.map((asset: any) => {
            const currentAssignment = asset.assignments?.[0];
            const isPending = currentAssignment?.status === 'PENDING_ACKNOWLEDGEMENT';

            return (
              <Card key={asset.id} className={isPending ? 'border-primary shadow-sm' : ''}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{asset.name}</CardTitle>
                    <CardDescription>{asset.category?.name}</CardDescription>
                  </div>
                  <div className="p-3 bg-primary/10 text-primary rounded-md">
                    {getCategoryIcon(asset.category?.name || '')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {asset.assetTag && (
                      <div>
                        <div className="text-muted-foreground">Asset Tag</div>
                        <div className="font-mono mt-0.5">{asset.assetTag}</div>
                      </div>
                    )}
                    {asset.serialNumber && (
                      <div>
                        <div className="text-muted-foreground">Serial Number</div>
                        <div className="font-mono mt-0.5">{asset.serialNumber}</div>
                      </div>
                    )}
                  </div>
                  
                  {isPending && (
                    <div className="bg-primary/10 text-primary-foreground p-4 rounded-lg flex gap-3 items-start mt-4">
                      <AlertTriangle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-primary">Action Required</h4>
                        <p className="text-sm text-primary/80 mt-1">
                          Please acknowledge that you have received this asset in good working condition.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!isPending && currentAssignment && (
                    <div className="text-xs text-muted-foreground pt-4 border-t">
                      Assigned on {new Date(currentAssignment.assignedAt).toLocaleDateString()}
                      {currentAssignment.acknowledgedAt && ` • Acknowledged on ${new Date(currentAssignment.acknowledgedAt).toLocaleDateString()}`}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between border-t bg-muted/20 pt-4 pb-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/t/${slug}/me/helpdesk`}>Report Issue</Link>
                  </Button>
                  
                  {isPending && (
                    <Button 
                      size="sm" 
                      onClick={() => acknowledge.mutate(asset.id)}
                      disabled={acknowledge.isPending}
                    >
                      {acknowledge.isPending ? 'Acknowledging...' : 'Acknowledge Receipt'}
                    </Button>
                  )}
                  {!isPending && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                      Acknowledged
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
