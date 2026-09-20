import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Editor } from '@/components/ui/editor';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Plus, CheckCircle2, Play, Square, Video, Loader2, Save, Link } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { format, parseISO } from 'date-fns';

export function MeetingWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('agenda');
  const [agendaContent, setAgendaContent] = useState('');
  const [momContent, setMomContent] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [newActionItem, setNewActionItem] = useState('');

  // Fetch real meeting from API using the route param id
  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const res = await apiClient.get(`/meetings/${id}`);
      const m = res.data.data;
      // Hydrate editor states from fetched data
      setAgendaContent(m.agendaContent || '');
      setMomContent(m.momContent || '');
      setNotesContent(m.notesContent || '');
      return m;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: any) => {
      const res = await apiClient.patch(`/meetings/${id}`, patch);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/meetings/${id}/cancel`, { cancelReason: 'Ended by organizer' });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  const handleSaveSection = useCallback(async (section: 'agenda' | 'mom' | 'notes') => {
    const content = section === 'agenda' ? agendaContent : section === 'mom' ? momContent : notesContent;
    await updateMutation.mutateAsync({ [`${section}Content`]: content });
  }, [agendaContent, momContent, notesContent, updateMutation]);

  const handleStartMeeting = () => updateMutation.mutate({ status: 'IN_PROGRESS' });
  const handleEndMeeting = () => cancelMutation.mutate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-muted-foreground">Meeting not found or you don't have access.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isEditable = meeting.status !== 'CLOSED' && meeting.status !== 'CANCELLED';
  const locationLabel = meeting.room?.name ?? meeting.location ?? '';
  const isVirtual = !meeting.room && meeting.meetingLink;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                meeting.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                meeting.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                'bg-muted text-muted-foreground'
              }`}>{meeting.status}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(parseISO(meeting.startTime), 'PPP')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(parseISO(meeting.startTime), 'hh:mm a')} – {format(parseISO(meeting.endTime), 'hh:mm a')}
              </span>
              {locationLabel && (
                <span className="flex items-center gap-1">
                  {isVirtual ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  {locationLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {meeting.meetingLink && (
            <Button variant="outline" onClick={() => window.open(meeting.meetingLink, '_blank')}>
              <Link className="mr-2 h-4 w-4" /> Join Meeting
            </Button>
          )}
          {meeting.status === 'SCHEDULED' && (
            <Button className="bg-primary hover:bg-primary/90" onClick={handleStartMeeting} disabled={updateMutation.isPending}>
              <Play className="mr-2 h-4 w-4" /> Start Meeting
            </Button>
          )}
          {meeting.status === 'IN_PROGRESS' && (
            <Button variant="destructive" onClick={handleEndMeeting} disabled={cancelMutation.isPending}>
              <Square className="mr-2 h-4 w-4" /> End Meeting
            </Button>
          )}
          {isEditable && (
            <Button variant="outline" onClick={() => handleSaveSection(activeTab as any)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 h-full min-h-0">
        {/* Left: Editor */}
        <div className="md:col-span-3 flex flex-col min-h-0 bg-card border rounded-xl overflow-hidden shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 py-2 border-b bg-muted/20">
              <TabsList className="bg-transparent space-x-2">
                <TabsTrigger value="agenda" className="data-[state=active]:bg-background">Agenda</TabsTrigger>
                <TabsTrigger value="mom" className="data-[state=active]:bg-background">Minutes (MoM)</TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-background">Shared Notes</TabsTrigger>
                <TabsTrigger value="action-items" className="data-[state=active]:bg-background">
                  Action Items {meeting.actionItems?.length > 0 && (
                    <Badge className="ml-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">{meeting.actionItems.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <TabsContent value="agenda" className="h-full m-0">
                <Editor
                  value={agendaContent}
                  onChange={setAgendaContent}
                  placeholder="Outline the agenda for this meeting..."
                  editable={isEditable}
                />
              </TabsContent>

              <TabsContent value="mom" className="h-full m-0">
                <Editor
                  value={momContent}
                  onChange={setMomContent}
                  placeholder="Record official meeting minutes here..."
                  editable={isEditable}
                />
              </TabsContent>

              <TabsContent value="notes" className="h-full m-0">
                <Editor
                  value={notesContent}
                  onChange={setNotesContent}
                  placeholder="Jot down notes during the meeting..."
                  editable={isEditable}
                />
              </TabsContent>

              <TabsContent value="action-items" className="h-full m-0">
                <div className="border rounded-md divide-y">
                  {meeting.actionItems?.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-6">No action items yet.</p>
                  )}
                  {meeting.actionItems?.map((item: any) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`h-5 w-5 ${item.status === 'DONE' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-sm font-medium ${item.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>{item.title}</p>
                          {item.assignee && <p className="text-xs text-muted-foreground">Assigned to: {item.assignee.firstName} {item.assignee.lastName}</p>}
                          {item.dueDate && <p className="text-xs text-muted-foreground">Due: {format(parseISO(item.dueDate), 'PP')}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {isEditable && (
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={newActionItem}
                      onChange={e => setNewActionItem(e.target.value)}
                      placeholder="Add an action item..."
                      className="flex-1 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && newActionItem.trim()) {
                          await updateMutation.mutateAsync({ actionItems: { create: { title: newActionItem.trim(), tenantId: meeting.tenantId } } });
                          setNewActionItem('');
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={async () => {
                      if (newActionItem.trim()) {
                        await updateMutation.mutateAsync({ actionItems: { create: { title: newActionItem.trim(), tenantId: meeting.tenantId } } });
                        setNewActionItem('');
                      }
                    }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right: Participants & Details */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" /> Participants ({meeting.participants?.length ?? 0})
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {meeting.participants?.map((p: any, i: number) => {
                const name = p.employee
                  ? `${p.employee.firstName} ${p.employee.lastName}`
                  : p.externalName ?? p.externalEmail ?? 'Unknown';
                const initial = name.charAt(0).toUpperCase();
                return (
                  <div key={p.id ?? i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                        {initial}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{name}</span>
                        {p.role === 'ORGANIZER' && <p className="text-xs text-muted-foreground">Organizer</p>}
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      p.responseStatus === 'ACCEPTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      p.responseStatus === 'DECLINED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {p.responseStatus ?? 'PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-sm flex-1">
            <h3 className="font-semibold mb-3">Meeting Details</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Organizer:</strong> {meeting.organizer?.firstName} {meeting.organizer?.lastName}</p>
              {meeting.meetingType && <p><strong className="text-foreground">Type:</strong> {meeting.meetingType.name}</p>}
              {meeting.timezone && <p><strong className="text-foreground">Timezone:</strong> {meeting.timezone}</p>}
              {meeting.room && <p><strong className="text-foreground">Room:</strong> {meeting.room.name} (Cap: {meeting.room.capacity})</p>}
              {meeting.meetingLink && (
                <p className="flex items-center gap-1">
                  <strong className="text-foreground">Link:</strong>
                  <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{meeting.meetingLink}</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
