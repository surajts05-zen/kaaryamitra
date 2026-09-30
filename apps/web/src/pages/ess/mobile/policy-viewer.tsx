import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useESSPolicies, useAcknowledgePolicy } from '@/features/company/hooks/use-policies-queries';
import { PolicyRenderer } from '@/components/policies/policy-renderer';
import { toast } from 'sonner';

export function MobileESSPolicyViewer() {
  const { slug, versionId } = useParams();
  const navigate = useNavigate();
  const { data: policies, isLoading } = useESSPolicies();
  const acknowledgePolicy = useAcknowledgePolicy();

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const policy = policies?.find((p: any) => p.activeVersion?.id === versionId);
  const version = policy?.activeVersion;

  if (!policy || !version) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <h2 className="text-xl font-bold">Policy Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2">The requested policy could not be found.</p>
        <Button onClick={() => navigate(`/t/${slug}/my-policies`)} className="mt-6" variant="outline">Go Back</Button>
      </div>
    );
  }

  const needsAck = policy.requiresAck && (!policy.myAcknowledgement || policy.myAcknowledgement.status === 'PENDING');
  const isAcknowledged = policy.requiresAck && policy.myAcknowledgement?.status === 'ACKNOWLEDGED';

  const handleAcknowledge = async () => {
    try {
      await acknowledgePolicy.mutateAsync(versionId as string);
      toast.success('Policy acknowledged');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to acknowledge policy');
    }
  };

  const blocks = Array.isArray(version.blocks) ? version.blocks : [];

  return (
    <div className="flex flex-col pb-24 space-y-4">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 -ml-2 rounded-full h-9 w-9" onClick={() => navigate(`/t/${slug}/my-policies`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold leading-tight">{policy.title}</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">Version {version.versionNumber} • {policy.category.name}</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 shadow-sm min-h-[300px]">
        <PolicyRenderer blocks={blocks} />
      </div>

      {policy.requiresAck && (
        <div className={`p-4 border rounded-lg flex flex-col space-y-3 ${isAcknowledged ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50' : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'}`}>
          {isAcknowledged ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-300">Acknowledged</h3>
                <p className="text-green-700 dark:text-green-400 mt-0.5 text-[10px]">
                  On {new Date(policy.myAcknowledgement.acknowledgedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold">Acknowledgement Required</h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  By clicking below, you confirm you have read and agree to abide by this policy.
                </p>
              </div>
              <Button onClick={handleAcknowledge} disabled={acknowledgePolicy.isPending} className="w-full h-10">
                {acknowledgePolicy.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Acknowledge Policy
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
