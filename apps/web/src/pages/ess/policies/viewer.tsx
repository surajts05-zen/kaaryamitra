import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useESSPolicies, useAcknowledgePolicy } from '@/features/company/hooks/use-policies-queries';
import { PolicyRenderer } from '@/components/policies/policy-renderer';
import { toast } from 'sonner';

export function ESSPolicyViewer() {
  const { slug, versionId } = useParams();
  const navigate = useNavigate();
  const { data: policies, isLoading } = useESSPolicies();
  const acknowledgePolicy = useAcknowledgePolicy();

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Find the policy that corresponds to this version
  const policy = policies?.find((p: any) => p.activeVersion?.id === versionId);
  const version = policy?.activeVersion;

  if (!policy || !version) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold">Policy Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested policy could not be found or you do not have access.</p>
        <Button onClick={() => navigate(`/t/${slug}/my-policies`)} className="mt-6">Back to Policies</Button>
      </div>
    );
  }

  const needsAck = policy.requiresAck && (!policy.myAcknowledgement || policy.myAcknowledgement.status === 'PENDING');
  const isAcknowledged = policy.requiresAck && policy.myAcknowledgement?.status === 'ACKNOWLEDGED';

  const handleAcknowledge = async () => {
    try {
      await acknowledgePolicy.mutateAsync(versionId as string);
      toast.success('Policy acknowledged successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to acknowledge policy');
    }
  };

  const blocks = Array.isArray(version.blocks) ? version.blocks : [];

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/t/${slug}/my-policies`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{policy.title}</h1>
          <p className="text-sm text-muted-foreground">Version {version.versionNumber} • Category: {policy.category.name}</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-8 md:p-12 shadow-sm min-h-[500px] mb-8">
        <PolicyRenderer blocks={blocks} />
      </div>

      {policy.requiresAck && (
        <div className={`p-6 border rounded-xl flex flex-col items-center text-center space-y-4 ${isAcknowledged ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'}`}>
          {isAcknowledged ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">Policy Acknowledged</h3>
                <p className="text-green-700 dark:text-green-400 mt-1 text-sm">
                  You acknowledged this policy on {new Date(policy.myAcknowledgement.acknowledgedAt).toLocaleDateString()}.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold">Acknowledgement Required</h3>
                <p className="text-muted-foreground mt-1 max-w-lg mx-auto">
                  By clicking the button below, you confirm that you have read, understood, and agree to abide by the terms of this policy.
                </p>
              </div>
              <Button size="lg" onClick={handleAcknowledge} disabled={acknowledgePolicy.isPending} className="w-full sm:w-auto mt-2">
                {acknowledgePolicy.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                I have read and acknowledge this policy
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
