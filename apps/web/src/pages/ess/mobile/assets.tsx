import React from 'react';
import { useMyAssets, useAcknowledgeAsset } from '@/features/company/hooks/use-asset-queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Laptop, AlertTriangle, Monitor, Smartphone, Key, Info, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function MobileMyAssets() {
  const { slug } = useParams();
  const { data: assets, isLoading } = useMyAssets();
  const acknowledge = useAcknowledgeAsset();

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('laptop') || name.includes('computer')) return <Laptop className="h-5 w-5" />;
    if (name.includes('monitor') || name.includes('display')) return <Monitor className="h-5 w-5" />;
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone className="h-5 w-5" />;
    if (name.includes('access') || name.includes('card') || name.includes('key')) return <Key className="h-5 w-5" />;
    return <Laptop className="h-5 w-5" />;
  };

  return (
    <div className="flex flex-col space-y-4 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Laptop className="w-5 h-5 text-primary" /> My Assets
        </h2>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : assets?.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="bg-muted p-3 rounded-full mb-3">
                <Info className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No Assets Assigned</h3>
              <p className="text-xs text-muted-foreground px-4">
                You do not have any company assets assigned to you yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assets?.map((asset: any) => {
              const currentAssignment = asset.assignments?.[0];
              const isPending = currentAssignment?.status === 'PENDING_ACKNOWLEDGEMENT';

              return (
                <Card key={asset.id} className={cn("overflow-hidden border-muted/60 shadow-sm transition-all", isPending ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "")}>
                  <CardContent className="p-0">
                    <div className="p-4 flex gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", isPending ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                        {getCategoryIcon(asset.category?.name || '')}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{asset.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{asset.category?.name}</p>
                        
                        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          {asset.assetTag && (
                            <span className="bg-muted/50 px-2 py-1 rounded font-mono border">
                              {asset.assetTag}
                            </span>
                          )}
                          {asset.serialNumber && (
                            <span className="bg-muted/50 px-2 py-1 rounded font-mono border">
                              SN: {asset.serialNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isPending ? (
                      <div className="bg-primary/5 border-t border-primary/20 p-3">
                        <div className="flex items-start gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <p className="text-[11px] text-primary/90 font-medium">
                            Please acknowledge receipt of this asset.
                          </p>
                        </div>
                        <Button 
                          className="w-full h-9 text-xs font-bold" 
                          onClick={() => acknowledge.mutate(asset.id)}
                          disabled={acknowledge.isPending}
                        >
                          {acknowledge.isPending ? 'Acknowledging...' : 'Acknowledge Receipt'}
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-muted/20 border-t p-3 flex items-center justify-between">
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Acknowledged
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-primary" asChild>
                          <Link to={`/t/${slug}/me/helpdesk`}>Report Issue</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
