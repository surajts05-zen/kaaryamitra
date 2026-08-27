import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMyProfile, useUpdateMyProfile } from '@/features/ess/hooks/use-ess-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Mail, Phone, Building2, MapPin, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  personalEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function EssProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateMyProfile();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        personalEmail: profile.personalEmail || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Profile updated successfully');
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || 'Failed to update profile');
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-muted-foreground">Profile not found. Please contact your HR.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl mb-4">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                  `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
                )}
              </div>
              <h3 className="font-semibold text-xl">{profile.firstName} {profile.lastName}</h3>
              <p className="text-muted-foreground">{profile.designation?.name || 'No Designation'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Work Information</CardTitle>
              <CardDescription>Your organizational details. Contact HR to change these.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Mail className="h-4 w-4" /> Work Email
                </div>
                <p>{profile.workEmail}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" /> Department
                </div>
                <p>{profile.department?.name || 'Not assigned'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4" /> Location
                </div>
                <p>{profile.location?.name || 'Not assigned'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Briefcase className="h-4 w-4" /> Employee ID
                </div>
                <p>{profile.employeeCode || 'Not assigned'}</p>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Personal Email</Label>
                    <Input type="email" placeholder="john.doe@gmail.com" {...register('personalEmail')} />
                    {errors.personalEmail && <p className="text-xs text-destructive">{errors.personalEmail.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="+1 234 567 890" {...register('phone')} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
