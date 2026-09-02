import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminTickets } from '@/features/company/hooks/use-helpdesk-queries';
import { format, isPast } from 'date-fns';
import { MessageSquare, AlertTriangle } from 'lucide-react';

export function AdminHelpdeskPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const filters = statusFilter !== 'ALL' ? { status: statusFilter } : {};
  const { data: tickets, isLoading } = useAdminTickets(filters);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Helpdesk</h2>
          <p className="text-muted-foreground">Manage and resolve employee support requests</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Tickets</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading tickets...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>SLA Deadline</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center">No tickets found.</TableCell></TableRow>
                ) : (
                  tickets?.map((t: any) => {
                    const isSlaBreached = t.slaDeadline && isPast(new Date(t.slaDeadline)) && t.status !== 'RESOLVED' && t.status !== 'CLOSED';
                    
                    return (
                      <TableRow key={t.id} className={isSlaBreached ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium text-xs text-muted-foreground">
                          #{t.id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{t.employee?.firstName} {t.employee?.lastName}</div>
                          <div className="text-xs text-muted-foreground">{t.employee?.employeeCode}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{t.subject}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MessageSquare className="h-3 w-3" /> {t._count?.comments} replies
                          </div>
                        </TableCell>
                        <TableCell>{t.category?.name}</TableCell>
                        <TableCell>{getStatusBadge(t.status)}</TableCell>
                        <TableCell>{getPriorityBadge(t.priority)}</TableCell>
                        <TableCell>
                          {t.assignedTo ? (
                            <span className="text-sm">{t.assignedTo.firstName} {t.assignedTo.lastName}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {t.slaDeadline && (
                            <div className={`text-sm flex items-center gap-1 ${isSlaBreached ? 'text-destructive font-bold' : ''}`}>
                              {isSlaBreached && <AlertTriangle className="h-3 w-3" />}
                              {format(new Date(t.slaDeadline), 'MMM d, h:mm a')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={t.id}>
                            <Button variant="outline" size="sm">Manage</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
