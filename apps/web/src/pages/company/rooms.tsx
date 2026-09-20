import { useState } from 'react';
import { useMeetingRooms, useDeleteMeetingRoom, MeetingRoom } from '@/features/company/hooks/use-room-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, CalendarClock, Users, MapPin, Monitor } from 'lucide-react';
import { RoomModal } from './components/room-modal';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function MeetingRoomsPage() {
  const { data: rooms = [], isLoading } = useMeetingRooms();
  const deleteMutation = useDeleteMeetingRoom();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<MeetingRoom | null>(null);
  
  const [roomToDelete, setRoomToDelete] = useState<MeetingRoom | null>(null);

  const handleEdit = (room: MeetingRoom) => {
    setRoomToEdit(room);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setRoomToEdit(null);
    setIsModalOpen(true);
  };

  const confirmDelete = (room: MeetingRoom) => {
    setRoomToDelete(room);
  };

  const handleDelete = () => {
    if (!roomToDelete) return;
    deleteMutation.mutate(roomToDelete.id, {
      onSuccess: () => {
        toast.success('Room deleted successfully');
        setRoomToDelete(null);
      },
      onError: () => {
        toast.error('Failed to delete room');
        setRoomToDelete(null);
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading rooms...</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-primary" />
            Meeting Rooms
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure physical rooms available for booking during meetings.
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Room
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Physical Rooms ({rooms.length})</CardTitle>
          <CardDescription>Rooms appear in the location dropdown when scheduling a meeting.</CardDescription>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No meeting rooms configured yet.</p>
              <Button variant="link" onClick={handleAddNew}>Add your first room</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div key={room.id} className={`border rounded-lg p-4 flex flex-col justify-between ${room.isActive ? 'bg-card' : 'bg-muted/50 opacity-70'}`}>
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      {!room.isActive && <span className="text-xs bg-muted px-2 py-1 rounded-md">Inactive</span>}
                    </div>
                    
                    <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Capacity: {room.capacity}</span>
                      </div>
                      
                      {room.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{room.location}</span>
                        </div>
                      )}
                      
                      {room.equipment && room.equipment.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Monitor className="h-4 w-4 mt-0.5" />
                          <span className="line-clamp-2">{room.equipment.join(' • ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(room)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => confirmDelete(room)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RoomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        roomToEdit={roomToEdit} 
      />

      <Dialog open={!!roomToDelete} onOpenChange={(open: boolean) => !open && setRoomToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the room "{roomToDelete?.name}". Employees will no longer be able to book it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
