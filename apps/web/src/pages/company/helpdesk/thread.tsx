import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAdminTicketDetails, useAddAdminComment, useUpdateTicket } from '@/features/company/hooks/use-helpdesk-queries';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { format, isPast } from 'date-fns';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

export function AdminHelpdeskThreadPage() {
  const { id } = useParams();
  const { data: ticket, isLoading } = useAdminTicketDetails(id as string);
  const { data: employees } = useEmployees(); // for assignee dropdown
  
  const addCommentMutation = useAddAdminComment();
  const updateTicketMutation = useUpdateTicket();
  
  const { user } = useAuthStore();
  
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  if (isLoading) return <div className="p-8">Loading ticket details...</div>;
  if (!ticket) return <div className="p-8">Ticket not found.</div>;

  const handleSend = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate(
      { ticketId: ticket.id, content: comment, isInternal },
      { onSuccess: () => {
          setComment('');
          setIsInternal(false);
          toast.success('Reply sent');
        }
      }
    );
  };

  const handleStatusChange = (val: string) => {
    updateTicketMutation.mutate({ id: ticket.id, status: val }, {
      onSuccess: () => toast.success('Status updated')
    });
  };

  const handleAssigneeChange = (val: string) => {
    updateTicketMutation.mutate({ id: ticket.id, assignedToId: val === 'UNASSIGNED' ? null : val }, {
      onSuccess: () => toast.success('Assignee updated')
    });
  };

  const handlePriorityChange = (val: string) => {
    updateTicketMutation.mutate({ id: ticket.id, priority: val }, {
      onSuccess: () => toast.success('Priority updated')
    });
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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'LOW': return <Badge variant="outline">Low</Badge>;
      case 'MEDIUM': return <Badge variant="outline" className="text-blue-500">Medium</Badge>;
      case 'HIGH': return <Badge variant="destructive">High</Badge>;
      case 'URGENT': return <Badge variant="destructive" className="animate-pulse">Urgent</Badge>;
      default: return <Badge>{p}</Badge>;
    }
  };

  const isSlaBreached = ticket.slaDeadline && isPast(new Date(ticket.slaDeadline)) && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED';

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex gap-6">
      
      {/* LEFT COLUMN: Chat */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="..">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">#{ticket.id.slice(-6).toUpperCase()}</span>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
              <Badge variant="secondary">{ticket.category?.name}</Badge>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">{ticket.employee?.firstName} {ticket.employee?.lastName}</CardTitle>
                <CardDescription>Requester • {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}</CardDescription>
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
                <Card className={`max-w-[80%] ${isMe ? 'bg-primary/5 border-primary/20' : ''} ${c.isInternal ? 'border-amber-500 bg-amber-500/5' : ''}`}>
                  <CardHeader className="p-3 pb-0">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm font-semibold flex items-center gap-2">
                        {isMe ? 'You' : `${c.author.firstName} ${c.author.lastName}`}
                        {c.isInternal && <Badge variant="outline" className="text-amber-600 border-amber-600 h-5 px-1.5"><ShieldAlert className="h-3 w-3 mr-1"/> Internal Note</Badge>}
                      </span>
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

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="internal" 
                checked={isInternal} 
                onCheckedChange={(c) => setIsInternal(c as boolean)} 
              />
              <Label htmlFor="internal" className="text-sm cursor-pointer text-muted-foreground">Add as internal note (invisible to employee)</Label>
            </div>
            <Textarea 
              placeholder={isInternal ? "Type an internal note to your team..." : "Type your reply to the employee..."} 
              rows={3} 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`resize-none ${isInternal ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
            />
          </CardContent>
          <CardFooter className="p-4 pt-0 justify-end">
            <Button 
              onClick={handleSend} 
              disabled={!comment.trim() || addCommentMutation.isPending}
              variant={isInternal ? 'secondary' : 'default'}
            >
              <Send className="mr-2 h-4 w-4" /> {isInternal ? 'Save Internal Note' : 'Send Public Reply'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* RIGHT COLUMN: Controls */}
      <div className="w-80 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={ticket.assignedToId || 'UNASSIGNED'} onValueChange={handleAssigneeChange}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                  {employees?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ticket.slaDeadline && (
              <div className="space-y-1 pt-2 border-t">
                <Label className="text-xs text-muted-foreground">SLA Deadline</Label>
                <div className={`text-sm font-medium flex items-center gap-2 ${isSlaBreached ? 'text-destructive' : ''}`}>
                  {isSlaBreached && <AlertTriangle className="h-4 w-4" />}
                  {format(new Date(ticket.slaDeadline), 'MMM d, yyyy h:mm a')}
                </div>
                {isSlaBreached && <div className="text-xs text-destructive">SLA Breached!</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
