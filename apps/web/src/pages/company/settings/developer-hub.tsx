import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Webhook, Plug, Plus, Trash2, Copy, CheckCircle2, Play, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useToggleWebhook,
  useIntegrations,
  useConfigureIntegration,
  useDeleteIntegration,
} from '@/features/developer/hooks/use-developer-queries';
import { format } from 'date-fns';
import { toast } from 'sonner';

const INTEGRATION_PROVIDERS = [
  { id: 'SLACK', name: 'Slack', description: 'Send notifications to channels.', icon: '💬' },
  { id: 'GOOGLE_WORKSPACE', name: 'Google Workspace', description: 'Sync users and calendars.', icon: '📅' },
  { id: 'TEAMS', name: 'Microsoft Teams', description: 'Send notifications to Teams.', icon: '👥' },
  { id: 'GREYTHR', name: 'Greythr', description: 'Sync payroll and attendance.', icon: '💰' },
  { id: 'TALLY', name: 'Tally', description: 'Sync accounting records.', icon: '📊' },
];

const WEBHOOK_EVENTS = [
  'EMPLOYEE_CREATED',
  'EMPLOYEE_UPDATED',
  'EMPLOYEE_OFFBOARDED',
  'LEAVE_APPROVED',
  'LEAVE_REJECTED',
  'PAYROLL_FINALIZED',
  'ATTENDANCE_MARKED',
  'RESIGNATION_SUBMITTED',
  'CUSTOM',
];

export function DeveloperHubPage() {
  const [activeTab, setActiveTab] = useState('api-keys');

  // API Keys
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState('');

  // Webhooks
  const { data: webhooks, isLoading: hooksLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();
  const toggleWebhook = useToggleWebhook();
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvent, setWebhookEvent] = useState<string>(WEBHOOK_EVENTS[3]!); // Default to LEAVE_APPROVED
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);

  // Integrations
  const { data: integrations, isLoading: intsLoading } = useIntegrations();
  const configureIntegration = useConfigureIntegration();
  const deleteIntegration = useDeleteIntegration();
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  
  // Integration form state (simple mapped key-values)
  const [integrationForm, setIntegrationForm] = useState<Record<string, string>>({});

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyName.trim()) {
      createKey.mutate(
        { name: apiKeyName, scopes: [] },
        {
          onSuccess: (data: any) => {
            // Backend returns { apiKey, rawKey } — show the rawKey once
            setNewKey(data.rawKey || data.key || null);
            toast.success('API Key generated successfully');
            setIsApiKeyDialogOpen(false);
            setApiKeyName('');
          },
        }
      );
    }
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (webhookName && webhookUrl && webhookEvent) {
      createWebhook.mutate(
        { name: webhookName, url: webhookUrl, events: [webhookEvent] },
        {
          onSuccess: (data: any) => {
            toast.success('Webhook created successfully');
            // Show the signing secret once — it cannot be retrieved again
            if (data?.secret) setNewWebhookSecret(data.secret);
            setIsWebhookDialogOpen(false);
            setWebhookName('');
            setWebhookUrl('');
          },
          onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed to create webhook'),
        }
      );
    }
  };

  const handleTestWebhook = (id: string) => {
    toast.promise(testWebhook.mutateAsync(id), {
      loading: 'Sending test payload...',
      success: 'Test payload sent and accepted (200 OK)!',
      error: 'Failed to deliver test payload.',
    });
  };

  const handleConfigureIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProvider) {
      // Basic split between config and secrets
      // Usually, things like 'token' or 'secret' go to secrets.
      const secrets: Record<string, string> = {};
      const config: Record<string, any> = {};
      
      Object.entries(integrationForm).forEach(([k, v]) => {
        if (k.toLowerCase().includes('token') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('password')) {
          secrets[k] = v;
        } else {
          config[k] = v;
        }
      });

      configureIntegration.mutate(
        { provider: selectedProvider, config, secrets },
        {
          onSuccess: () => {
            toast.success('Integration configured successfully');
            setIsIntegrationDialogOpen(false);
            setSelectedProvider(null);
            setIntegrationForm({});
          },
        }
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developer Hub</h1>
        <p className="text-muted-foreground mt-1">
          Manage API Keys, Webhooks, and Third-Party Integrations to connect KaaryaMitra to your ecosystem.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-4 m-0">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Generate API keys to authenticate your custom applications.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <a href="/api/v1/docs" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Swagger UI
                  </Button>
                </a>
                <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Generate Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateApiKey}>
                      <DialogHeader>
                        <DialogTitle>Generate New API Key</DialogTitle>
                        <DialogDescription>
                          This key will grant full REST API access for this workspace.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Key Name</Label>
                          <Input 
                            value={apiKeyName} 
                            onChange={(e) => setApiKeyName(e.target.value)}
                            placeholder="e.g. Zapier Integration" 
                            required 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsApiKeyDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createKey.isPending}>Generate Key</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {newKey && (
                <div className="mb-6 p-4 border border-emerald-200 bg-emerald-50 rounded-lg dark:bg-emerald-950/40 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    New API Key Generated
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-4">
                    Please copy this key now. You will not be able to see it again!
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-white dark:bg-black px-3 py-2 rounded border text-sm">{newKey}</code>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(newKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {keysLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : apiKeys?.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  No API keys generated yet.
                </div>
              ) : (
                <div className="border rounded-md divide-y">
                  {apiKeys?.map((key: any) => (
                    <div key={key.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-medium">{key.name}</div>
                        <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                          <span>Prefix: <code>{key.prefix}...</code></span>
                          <span>Created: {format(new Date(key.createdAt), 'MMM d, yyyy')}</span>
                          <span className={`px-2 rounded-full text-xs ${key.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {key.status}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                        if(window.confirm('Permanently delete this API key? This cannot be undone.')) revokeKey.mutate(key.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 m-0">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>Configure webhook endpoints to receive real-time event notifications.</CardDescription>
              </div>
              <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Endpoint
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateWebhook}>
                    <DialogHeader>
                      <DialogTitle>Add Webhook Endpoint</DialogTitle>
                      <DialogDescription>
                        Receive real-time HTTP POST payloads when events occur.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Webhook Name</Label>
                        <Input 
                          value={webhookName} 
                          onChange={(e) => setWebhookName(e.target.value)}
                          placeholder="e.g. Main Slack Alert" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payload URL</Label>
                        <Input 
                          value={webhookUrl} 
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://example.com/webhook" 
                          required 
                          type="url"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Event Trigger</Label>
                        <Select value={webhookEvent} onValueChange={setWebhookEvent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an event" />
                          </SelectTrigger>
                          <SelectContent>
                            {WEBHOOK_EVENTS.map(evt => (
                              <SelectItem key={evt} value={evt}>{evt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsWebhookDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createWebhook.isPending}>Save Webhook</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {newWebhookSecret && (
                <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg dark:bg-amber-950/40 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Signing Secret (shown once)
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                    Use this secret to verify incoming payloads via the <code>X-KM-Signature</code> header. It will not be shown again.
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-white dark:bg-black px-3 py-2 rounded border text-sm">{newWebhookSecret}</code>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(newWebhookSecret)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {hooksLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : webhooks?.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  No webhook endpoints configured.
                </div>
              ) : (
                <div className="border rounded-md divide-y">
                  {webhooks?.map((hook: any) => (
                    <div key={hook.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {hook.name}
                          <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase tracking-wider ${hook.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>
                            {hook.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{hook.url}</div>
                        <div className="flex gap-2 mt-2">
                          {hook.events.map((e: string) => (
                            <span key={e} className="px-2 py-0.5 rounded-full bg-secondary text-xs">{e}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={hook.isActive ? 'Disable webhook' : 'Enable webhook'}
                          onClick={() => toggleWebhook.mutate({ id: hook.id, isActive: !hook.isActive })}
                        >
                          {hook.isActive
                            ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                            : <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                          }
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleTestWebhook(hook.id)}>
                          <Play className="h-3 w-3" /> Test
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                          if(window.confirm('Delete webhook?')) deleteWebhook.mutate(hook.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 m-0">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Active Integrations</CardTitle>
                <CardDescription>Manage connections to third-party services.</CardDescription>
              </div>
              <Dialog open={isIntegrationDialogOpen} onOpenChange={(open) => {
                setIsIntegrationDialogOpen(open);
                if (!open) {
                  setSelectedProvider(null);
                  setIntegrationForm({});
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Integration
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  {!selectedProvider ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>Integration Catalog</DialogTitle>
                        <DialogDescription>
                          Select a provider to connect your workspace.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        {INTEGRATION_PROVIDERS.map((provider) => (
                          <Card 
                            key={provider.id} 
                            className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                            onClick={() => setSelectedProvider(provider.id)}
                          >
                            <CardHeader className="p-4">
                              <div className="text-3xl mb-2">{provider.icon}</div>
                              <CardTitle className="text-base">{provider.name}</CardTitle>
                              <CardDescription className="text-xs">{provider.description}</CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleConfigureIntegration}>
                      <DialogHeader>
                        <DialogTitle>Configure {INTEGRATION_PROVIDERS.find(p => p.id === selectedProvider)?.name}</DialogTitle>
                        <DialogDescription>
                          Provide the required credentials to connect this integration. All secrets are encrypted at rest.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-6 space-y-4">
                        {selectedProvider === 'SLACK' && (
                          <>
                            <div className="space-y-2">
                              <Label>Bot Token</Label>
                              <Input 
                                type="password" 
                                placeholder="xoxb-..." 
                                required 
                                value={integrationForm['botToken'] || ''}
                                onChange={(e) => setIntegrationForm({ ...integrationForm, botToken: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Default Channel ID</Label>
                              <Input 
                                placeholder="C01234567" 
                                required 
                                value={integrationForm['channelId'] || ''}
                                onChange={(e) => setIntegrationForm({ ...integrationForm, channelId: e.target.value })}
                              />
                            </div>
                          </>
                        )}
                        {selectedProvider === 'GOOGLE_WORKSPACE' && (
                          <div className="space-y-2">
                            <Label>Service Account JSON</Label>
                            <Input 
                              type="password"
                              placeholder='{"type": "service_account", ...}' 
                              required 
                              value={integrationForm['serviceAccountJson'] || ''}
                              onChange={(e) => setIntegrationForm({ ...integrationForm, serviceAccountJson: e.target.value })}
                            />
                          </div>
                        )}
                        {/* Fallback for others */}
                        {selectedProvider !== 'SLACK' && selectedProvider !== 'GOOGLE_WORKSPACE' && (
                          <div className="space-y-2">
                            <Label>API Key / Token</Label>
                            <Input 
                              type="password"
                              placeholder="Enter token..." 
                              required 
                              value={integrationForm['token'] || ''}
                              onChange={(e) => setIntegrationForm({ ...integrationForm, token: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setSelectedProvider(null)}>Back</Button>
                        <Button type="submit" disabled={configureIntegration.isPending}>Connect</Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {intsLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : integrations?.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  No active integrations.
                </div>
              ) : (
                <div className="border rounded-md divide-y">
                  {integrations?.map((int: any) => (
                    <div key={int.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-medium text-lg flex items-center gap-2">
                          {INTEGRATION_PROVIDERS.find(p => p.id === int.provider)?.icon || '🔌'}
                          {INTEGRATION_PROVIDERS.find(p => p.id === int.provider)?.name || int.provider}
                        </div>
                        <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                          <span className={`px-2 rounded-full text-xs font-medium ${int.status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {int.status}
                          </span>
                          <span>Last updated: {format(new Date(int.updatedAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                        if(window.confirm('Disconnect this integration?')) deleteIntegration.mutate(int.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
