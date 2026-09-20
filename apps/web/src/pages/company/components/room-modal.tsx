import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MeetingRoom, useCreateMeetingRoom, useUpdateMeetingRoom } from '@/features/company/hooks/use-room-queries';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  location: z.string().optional(),
  equipment: z.string().optional(), // We'll parse this to an array for the backend
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit: MeetingRoom | null;
}

export function RoomModal({ isOpen, onClose, roomToEdit }: RoomModalProps) {
  const createMutation = useCreateMeetingRoom();
  const updateMutation = useUpdateMeetingRoom();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      capacity: 10,
      location: '',
      equipment: '',
      isActive: true,
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (roomToEdit) {
        reset({
          name: roomToEdit.name,
          capacity: roomToEdit.capacity,
          location: roomToEdit.location || '',
          equipment: roomToEdit.equipment?.join(', ') || '',
          isActive: roomToEdit.isActive,
        });
      } else {
        reset({
          name: '',
          capacity: 10,
          location: '',
          equipment: '',
          isActive: true,
        });
      }
    }
  }, [isOpen, roomToEdit, reset]);

  const onSubmit = (data: FormValues) => {
    // Convert equipment string to array
    const equipmentArray = data.equipment 
      ? data.equipment.split(',').map(item => item.trim()).filter(Boolean)
      : [];

    const payload: any = {
      name: data.name,
      capacity: data.capacity,
      isActive: data.isActive,
      equipment: equipmentArray
    };
    if (data.location) {
      payload.location = data.location;
    }

    if (roomToEdit) {
      updateMutation.mutate(
        { id: roomToEdit.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Meeting room updated');
            onClose();
          },
          onError: () => toast.error('Failed to update meeting room')
        }
      );
    } else {
      createMutation.mutate(
        payload,
        {
          onSuccess: () => {
            toast.success('Meeting room created');
            onClose();
          },
          onError: () => toast.error('Failed to create meeting room')
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{roomToEdit ? 'Edit Meeting Room' : 'Add Meeting Room'}</DialogTitle>
          <DialogDescription>
            {roomToEdit ? 'Update the details for this meeting room.' : 'Add a new physical room for meetings and scheduling.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name</Label>
            <Input id="name" placeholder="e.g. Boardroom A" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (People)</Label>
            <Input id="capacity" type="number" {...register('capacity', { valueAsNumber: true })} />
            {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location / Building (Optional)</Label>
            <Input id="location" placeholder="e.g. 2nd Floor, West Wing" {...register('location')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment (Comma separated)</Label>
            <Input id="equipment" placeholder="e.g. Whiteboard, Projector, TV" {...register('equipment')} />
            <p className="text-xs text-muted-foreground">List the amenities available in this room.</p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isActive" className="text-sm font-medium leading-none cursor-pointer">
              Room is Active (bookable)
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
