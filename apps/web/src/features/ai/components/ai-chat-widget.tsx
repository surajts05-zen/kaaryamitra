import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, User } from 'lucide-react';
import { useAiChat, type ChatMessage } from '../hooks/use-ai-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([{
    role: 'model',
    parts: [{ text: 'Hello! I am your KaaryaMitra Assistant. How can I help you today?' }]
  }]);
  
  const { mutateAsync: sendMessage, isPending } = useAiChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isPending) return;
    
    const userMsg = input.trim();
    setInput('');
    
    // Optimistically add user message
    const currentHistory = [...history];
    setHistory((prev) => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    
    try {
      const responseText = await sendMessage({ message: userMsg, history: currentHistory });
      setHistory((prev) => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
    } catch (error) {
      setHistory((prev) => [...prev, { role: 'model', parts: [{ text: 'Oops! Something went wrong while communicating with the AI server.' }] }]);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-km-forest text-km-lime hover:bg-km-forest/90 hover:scale-105 transition-all z-50 p-0 flex items-center justify-center border-2 border-km-lime/40"
        title="KaaryaMitra Assistant"
      >
        <Sparkles className="h-7 w-7 text-km-lime animate-pulse" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-km-forest text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-km-lime/20 rounded-lg">
            <Sparkles className="h-4 w-4 text-km-lime animate-pulse" />
          </div>
          <span className="font-semibold text-sm tracking-wide">KaaryaMitra Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10 scroll-smooth"
      >
        {history.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={cn("flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center", 
              msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-km-forest text-km-lime"
            )}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>
            <div className={cn(
              "px-4 py-2 rounded-2xl text-sm max-w-[75%]",
              msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
            )}>
              {msg.role === 'model' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.parts?.[0]?.text || ''}</ReactMarkdown>
                </div>
              ) : (
                msg.parts?.[0]?.text || ''
              )}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex gap-3 flex-row">
            <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-km-forest text-km-lime">
              <Sparkles className="h-4 w-4 animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-muted text-muted-foreground text-sm rounded-tl-sm flex items-center gap-1">
              <span className="animate-bounce">•</span>
              <span className="animate-bounce delay-100">•</span>
              <span className="animate-bounce delay-200">•</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about HR, leaves..."
            className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-km-lime"
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isPending} className="rounded-full bg-km-lime text-km-forest hover:bg-km-green hover:text-white shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
