import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, MapPin, Calendar, Clock, Video, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { format, addHours, parseISO } from 'date-fns';

interface ScheduleMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function ScheduleMeetingModal({ open, onOpenChange, onCreated }: ScheduleMeetingModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingTypeId, setMeetingTypeId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('virtual');
  const [agenda, setAgenda] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantInput, setParticipantInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'loading' | 'free' | 'conflict'>('idle');

  // Fetch employees from directory
  const { data: employees = [] } = useEmployees();

  // Fetch meeting types from API
  const { data: meetingTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['meeting-types'],
    queryFn: async () => {
      const res = await apiClient.get('/meeting-types');
      return res.data.data ?? [];
    },
    enabled: open,
  });

  // Fetch rooms from API
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await apiClient.get('/rooms');
      return res.data.data ?? [];
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/meetings', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      onCreated?.();
      handleClose();
    },
  });

  const filteredEmployees = useMemo(() =>
    (employees as any[]).filter(
      (emp: any) =>
        !participants.some(p => p.id === emp.id) &&
        ((emp.firstName || '').toLowerCase().includes(participantInput.toLowerCase()) ||
         (emp.lastName || '').toLowerCase().includes(participantInput.toLowerCase()) ||
         (emp.workEmail || emp.user?.email || '').toLowerCase().includes(participantInput.toLowerCase()))
    ),
    [employees, participants, participantInput]
  );

  const handleAddParticipant = (emp: any) => {
    setParticipants(prev => [...prev, emp]);
    setParticipantInput('');
    setIsDropdownOpen(false);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleClose = () => {
    setStep(1);
    setTitle(''); setDate(''); setStartTime(''); setEndTime(''); setMeetingTypeId('');
    setSelectedRoom('virtual'); setAgenda(''); setParticipants([]); setAvailabilityStatus('idle');
    onOpenChange(false);
  };

  const handleCheckAvailability = async () => {
    if (!date || !startTime || !endTime || participants.length === 0) return;
    setAvailabilityStatus('loading');
    try {
      const startISO = new Date(`${date}T${startTime}`).toISOString();
      const endISO = new Date(`${date}T${endTime}`).toISOString();
      const durationMin = (new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000;
      const res = await apiClient.post('/meetings/availability', {
        participantIds: participants.map(p => p.id),
        startDate: startISO,
        endDate: endISO,
        durationMin,
      });
      const slots: any[] = res.data.data ?? [];
      setAvailabilityStatus(slots.length > 0 ? 'free' : 'conflict');
    } catch {
      setAvailabilityStatus('conflict');
    }
  };

  const handleAdvanceToStep2 = async () => {
    if (!title || !date || !startTime || !endTime || !meetingTypeId) return;
    setStep(2);
    await handleCheckAvailability();
  };

  const handleSubmit = async () => {
    if (createMutation.isPending) return;
    const startISO = new Date(`${date}T${startTime}`).toISOString();
    const endISO = new Date(`${date}T${endTime}`).toISOString();

    await createMutation.mutateAsync({
      title,
      description: agenda || undefined,
      meetingTypeId,
      startTime: startISO,
      endTime: endISO,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      roomId: selectedRoom !== 'virtual' ? selectedRoom : undefined,
      meetingLink: selectedRoom === 'virtual' ? 'https://meet.google.com/pending' : undefined,
      participants: participants.map(p => ({ employeeId: p.id })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule a Meeting</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Set the meeting details and invite participants.' : 'Choose a room or virtual option and confirm.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-2 mb-2">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input id="title" placeholder="e.g. Q3 Product Roadmap Sync" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="date" className="pl-9" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="time" className="pl-9" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="time" className="pl-9" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Meeting Type *</Label>
                {loadingTypes ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
                ) : (
                  <Select value={meetingTypeId} onValueChange={setMeetingTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No types configured.</div>
                      ) : (
                        meetingTypes.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Participants</Label>
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {participants.map(p => (
                    <Badge key={p.id} variant="secondary" className="flex items-center gap-1">
                      {p.firstName || 'Unknown'} {p.lastName || 'User'}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveParticipant(p.id)} />
                    </Badge>
                  ))}
                </div>
              )}
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={participantInput}
                  onChange={e => { setParticipantInput(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                />
                {isDropdownOpen && filteredEmployees.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg overflow-y-auto max-h-48">
                    {filteredEmployees.map((emp: any) => (
                      <div
                        key={emp.id}
                        className="px-3 py-2 cursor-pointer hover:bg-accent flex justify-between items-center text-sm"
                        onMouseDown={e => { e.preventDefault(); handleAddParticipant(emp); }}
                      >
                        <span className="font-medium">{emp.firstName || 'Unknown'} {emp.lastName || 'User'}</span>
                        <span className="text-muted-foreground text-xs">{emp.workEmail || emp.user?.email || ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                type="button"
                onClick={handleAdvanceToStep2}
                disabled={!title || !date || !startTime || !endTime || !meetingTypeId}
              >
                Next: Book Room
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            {/* Availability result */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Availability Check</span>
                {availabilityStatus === 'loading' && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Checking...</span>
                )}
                {availabilityStatus === 'free' && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> Everyone is free
                  </span>
                )}
                {availabilityStatus === 'conflict' && (
                  <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    <AlertCircle className="h-3 w-3" /> Conflict detected
                  </span>
                )}
                {availabilityStatus === 'idle' && (
                  <span className="text-xs text-muted-foreground">Not checked</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Select Location / Room</Label>
              {loadingRooms ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading rooms...</div>
              ) : (
                <div className="grid gap-2">
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${selectedRoom === 'virtual' ? 'border-primary bg-primary/5' : ''}`}>
                    <input type="radio" name="locationType" value="virtual" checked={selectedRoom === 'virtual'} onChange={() => setSelectedRoom('virtual')} className="accent-primary" />
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Virtual Meeting</span>
                      <span className="text-xs text-muted-foreground">Google Meet link will be generated</span>
                    </div>
                  </label>

                  {rooms.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2">No physical rooms configured. Ask your admin to add rooms.</p>
                  ) : rooms.map((room: any) => (
                    <label key={room.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${selectedRoom === room.id ? 'border-primary bg-primary/5' : ''}`}>
                      <input type="radio" name="locationType" value={room.id} checked={selectedRoom === room.id} onChange={() => setSelectedRoom(room.id)} className="accent-primary" />
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between w-full">
                          <span className="text-sm font-medium">{room.name}</span>
                          <span className="text-xs text-muted-foreground">Cap: {room.capacity}</span>
                        </div>
                        {room.equipment?.length > 0 && (
                          <span className="text-xs text-muted-foreground">{room.equipment.join(' • ')}</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Agenda (Optional)</Label>
              <Textarea placeholder="Brief description or agenda for this meeting..." rows={3} value={agenda} onChange={e => setAgenda(e.target.value)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</> : 'Schedule Meeting'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
