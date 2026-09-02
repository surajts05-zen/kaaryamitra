import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMyTicketDetails, useAddMyComment } from '@/features/company/hooks/use-helpdesk-queries';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/auth.store';

export function EssHelpdeskThreadPage() {
  const { id } = useParams();
  const { data: ticket, isLoading } = useMyTicketDetails(id as string);
  const addCommentMutation = useAddMyComment();
  const { user } = useAuthStore();
  
  const [comment, setComment] = useState('');

  if (isLoading) return <div className="p-8">Loading ticket details...</div>;
  if (!ticket) return <div className="p-8">Ticket not found.</div>;

  const handleSend = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate(
      { ticketId: ticket.id, content: comment },
      { onSuccess: () => setComment('') }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="outline" className="text-blue-500">Open</Badge>;
      case 'IN_PROGRESS': return <Badge variant="outline" className="text-amber-500">In Progress</Badge>;
      case 'RESOLVED': return <Badge variant="outline" className="text-green-500">Resolved</Badge>;
      case 'CLOSED': return <Badge variant="outline" className="text-gray-500">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="..">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{ticket.subject}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">#{ticket.id.slice(-6).toUpperCase()}</span>
            {getStatusBadge(ticket.status)}
            <Badge variant="secondary">{ticket.category?.name}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{ticket.employee?.firstName} {ticket.employee?.lastName}</CardTitle>
              <CardDescription>{format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="whitespace-pre-wrap text-sm">{ticket.description}</div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold px-1 text-muted-foreground">Conversation Thread</h3>
        {ticket.comments?.map((c: any) => {
          const isMe = c.author.userId === user?.id;
          return (
            <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <Card className={`max-w-[80%] ${isMe ? 'bg-primary/5 border-primary/20' : ''}`}>
                <CardHeader className="p-3 pb-0">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-sm font-semibold">{isMe ? 'You' : `${c.author.firstName} ${c.author.lastName}`}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {!isClosed && (
        <Card>
          <CardContent className="p-4">
            <Textarea 
              placeholder="Type your reply here..." 
              rows={3} 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
            />
          </CardContent>
          <CardFooter className="p-4 pt-0 justify-end">
            <Button onClick={handleSend} disabled={!comment.trim() || addCommentMutation.isPending}>
              <Send className="mr-2 h-4 w-4" /> Send Reply
            </Button>
          </CardFooter>
        </Card>
      )}

      {isClosed && (
        <div className="text-center p-4 text-muted-foreground bg-muted/50 rounded-lg border">
          This ticket has been marked as {ticket.status.toLowerCase()}. The thread is locked.
        </div>
      )}
    </div>
  );
}
