import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useAdminPolicy,
  useSaveDraftVersion,
  usePublishVersion,
  useCreateDraftVersion,
  useAiGeneratePolicy
} from '@/features/company/hooks/use-policies-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, GripVertical, Trash2, Save, Send, AlertTriangle, ArrowLeft, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { PolicyRenderer } from '@/components/policies/policy-renderer';

type BlockType = 'heading' | 'paragraph' | 'alert' | 'faq' | 'list';

interface Block {
  id: string;
  type: BlockType;
  content?: string;
  question?: string;
  answer?: string;
  variant?: 'default' | 'destructive';
  items?: string[];
}

export function PolicyEditor() {
  const { slug, id: policyId } = useParams();
  const navigate = useNavigate();
  const { data: policy, isLoading, refetch } = useAdminPolicy(policyId as string);
  const saveDraft = useSaveDraftVersion();
  const publishVersion = usePublishVersion();
  const createDraft = useCreateDraftVersion();
  const aiGenerate = useAiGeneratePolicy();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedResult, setAiGeneratedResult] = useState<any>(null);

  const latestVersion = policy?.versions?.[0];
  const isDraft = latestVersion?.status === 'DRAFT';

  useEffect(() => {
    if (latestVersion?.blocks) {
      const initialBlocks = Array.isArray(latestVersion.blocks) ? latestVersion.blocks : [];
      setBlocks(initialBlocks);
    }
  }, [latestVersion]);

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substring(7),
      type,
      ...(type === 'alert' && { variant: 'default' }),
      ...(type === 'faq' && { question: '', answer: '' }),
      ...(type === 'list' && { items: [''] }),
      ...((type === 'heading' || type === 'paragraph' || type === 'alert') && { content: '' }),
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex]!, newBlocks[index]!];
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    if (!latestVersion) return;
    try {
      await saveDraft.mutateAsync({
        policyId: policyId!,
        versionId: latestVersion.id,
        blocks
      });
      toast.success('Draft saved');
    } catch (err: any) {
      toast.error('Failed to save draft');
    }
  };

  const handlePublish = async () => {
    if (!latestVersion) return;
    if (!confirm('Are you sure you want to publish this version? This will become the active policy.')) return;
    
    try {
      await saveDraft.mutateAsync({
        policyId: policyId!,
        versionId: latestVersion.id,
        blocks
      });
      
      await publishVersion.mutateAsync({
        policyId: policyId!,
        versionId: latestVersion.id
      });
      toast.success('Policy published successfully');
      navigate(`/t/${slug}/settings/policies`);
    } catch (err: any) {
      toast.error('Failed to publish');
    }
  };

  const handleCreateDraft = async () => {
    try {
      await createDraft.mutateAsync(policyId!);
      toast.success('New draft created');
      refetch();
    } catch (err: any) {
      toast.error('Failed to create draft');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI');
      return;
    }
    try {
      const res = await aiGenerate.mutateAsync(aiPrompt);
      setAiGeneratedResult(res);
      toast.success('AI content generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to generate AI policy content');
    }
  };

  const applyAiBlocks = (mode: 'replace' | 'append') => {
    if (!aiGeneratedResult?.blocks) return;
    const newBlocks: Block[] = aiGeneratedResult.blocks.map((b: any) => ({
      id: Math.random().toString(36).substring(7),
      type: b.type || 'paragraph',
      content: b.content,
      items: b.items,
      question: b.question,
      answer: b.answer,
      variant: b.variant || (b.alertType === 'warning' || b.alertType === 'danger' ? 'destructive' : 'default')
    }));

    if (mode === 'replace') {
      setBlocks(newBlocks);
    } else {
      setBlocks([...blocks, ...newBlocks]);
    }

    setAiModalOpen(false);
    setAiGeneratedResult(null);
    setAiPrompt('');
    toast.success(mode === 'replace' ? 'Replaced policy blocks with AI content' : 'Appended AI content to policy');
  };

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!policy) return <div>Policy not found</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pt-4 pb-4 mb-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/t/${slug}/settings/policies`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{policy.title}</h1>
            <p className="text-sm text-muted-foreground">
              Version {latestVersion?.versionNumber || 1} • {latestVersion?.status || 'Draft'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-purple-200 hover:border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                  <Sparkles className="w-4 h-4 mr-2" /> AI Assist
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-600" /> AI Policy Generator & Assistant
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prompt / Instructions for AI</Label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Draft a policy section on Remote Work guidelines, core working hours (10 AM - 4 PM), equipment stipend, and security rules."
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button
                    onClick={handleAiGenerate}
                    disabled={aiGenerate.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {aiGenerate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate Policy Content
                  </Button>

                  {aiGeneratedResult && (
                    <div className="mt-4 border p-4 rounded-lg bg-muted/40 space-y-3">
                      <h4 className="font-semibold text-sm">AI Output Preview ({aiGeneratedResult.blocks?.length || 0} blocks)</h4>
                      <p className="text-xs text-muted-foreground">{aiGeneratedResult.description}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={() => applyAiBlocks('append')}>
                          Append to Current Draft
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => applyAiBlocks('replace')}>
                          Replace Entire Draft
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
            {isPreview ? 'Edit Mode' : 'Preview'}
          </Button>

          {!isDraft ? (
            <Button onClick={handleCreateDraft}>
              <Plus className="w-4 h-4 mr-2" /> New Draft Version
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleSave} disabled={saveDraft.isPending || publishVersion.isPending}>
                {saveDraft.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Draft
              </Button>
              <Button onClick={handlePublish} disabled={saveDraft.isPending || publishVersion.isPending}>
                <Send className="w-4 h-4 mr-2" /> Publish Version
              </Button>
            </>
          )}
        </div>
      </div>

      {!isDraft && !isPreview && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-200">This version is Published</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">You cannot edit a published version. Click "New Draft Version" to make changes.</p>
          </div>
        </div>
      )}

      {isPreview ? (
        <div className="border rounded-xl p-8 bg-card shadow-sm min-h-[500px]">
          <PolicyRenderer blocks={blocks} />
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
              <p className="mb-2">No content yet. Add blocks manually or use AI Assist to draft this policy.</p>
              {isDraft && (
                <Button variant="outline" size="sm" onClick={() => setAiModalOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-2 text-purple-600" /> Draft with AI Assist
                </Button>
              )}
            </div>
          )}

          {blocks.map((block, index) => (
            <div key={block.id} className={`group relative border rounded-lg p-4 bg-card shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 ${!isDraft ? 'opacity-70 pointer-events-none' : ''}`}>
              <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                <button onClick={() => moveBlock(index, 'up')} className="p-1 hover:bg-muted rounded" disabled={index === 0}>▲</button>
                <button onClick={() => moveBlock(index, 'down')} className="p-1 hover:bg-muted rounded" disabled={index === blocks.length - 1}>▼</button>
              </div>

              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  <GripVertical className="w-4 h-4 opacity-50" />
                  {block.type.toUpperCase()}
                </div>
                {isDraft && (
                  <Button variant="ghost" size="sm" onClick={() => removeBlock(block.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {block.type === 'heading' && (
                <Input 
                  value={block.content || ''} 
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })} 
                  placeholder="Heading text..." 
                  className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
                />
              )}

              {block.type === 'paragraph' && (
                <Textarea 
                  value={block.content || ''} 
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })} 
                  placeholder="Type your paragraph here..." 
                  className="min-h-[100px] border-none shadow-none focus-visible:ring-0 px-0 resize-none"
                />
              )}

              {block.type === 'alert' && (
                <div className="space-y-3">
                  <Select value={block.variant || 'default'} onValueChange={(val: any) => updateBlock(block.id, { variant: val })}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Information (Blue)</SelectItem>
                      <SelectItem value="destructive">Warning (Red)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea 
                    value={block.content || ''} 
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })} 
                    placeholder="Alert message..." 
                    className="min-h-[80px]"
                  />
                </div>
              )}

              {block.type === 'faq' && (
                <div className="space-y-3">
                  <Input 
                    value={block.question || ''} 
                    onChange={(e) => updateBlock(block.id, { question: e.target.value })} 
                    placeholder="Question..." 
                    className="font-medium"
                  />
                  <Textarea 
                    value={block.answer || ''} 
                    onChange={(e) => updateBlock(block.id, { answer: e.target.value })} 
                    placeholder="Answer..." 
                    className="min-h-[80px]"
                  />
                </div>
              )}

              {block.type === 'list' && (
                <div className="space-y-2">
                  {(block.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 text-center text-muted-foreground">•</span>
                      <Input 
                        value={item} 
                        onChange={(e) => {
                          const newItems = [...(block.items || [])];
                          newItems[i] = e.target.value;
                          updateBlock(block.id, { items: newItems });
                        }} 
                        placeholder={`List item ${i + 1}`}
                        className="border-none shadow-none focus-visible:ring-0 px-0"
                      />
                    </div>
                  ))}
                  {isDraft && (
                    <Button variant="ghost" size="sm" onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] })} className="ml-8 mt-1 h-7">
                      <Plus className="w-3 h-3 mr-1" /> Add item
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {isDraft && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => addBlock('heading')} size="sm">Add Heading</Button>
              <Button variant="outline" onClick={() => addBlock('paragraph')} size="sm">Add Paragraph</Button>
              <Button variant="outline" onClick={() => addBlock('list')} size="sm">Add List</Button>
              <Button variant="outline" onClick={() => addBlock('alert')} size="sm">Add Alert</Button>
              <Button variant="outline" onClick={() => addBlock('faq')} size="sm">Add FAQ</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

