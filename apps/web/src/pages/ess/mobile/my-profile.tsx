import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMyProfile, useUpdateMyProfile } from '@/features/ess/hooks/use-ess-queries';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Mail, Building2, MapPin, Briefcase, DoorOpen, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';

const schema = z.object({
  personalEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable().or(z.literal('')),
  
  // Banking
  bankAccountName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankIfscCode: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankBranch: z.string().optional().nullable(),

  // Identity
  aadharNumber: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  uanNumber: z.string().optional().nullable(),
  pfNumber: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function MobileEssProfile() {
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateMyProfile();
  const { slug } = useParams();
  const { user } = useAuthStore();

  const isAdminUser = user?.roles?.some((r) =>
    ['Company Admin', 'HR Manager'].includes(r)
  ) ?? false;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const [isFetchingIfsc, setIsFetchingIfsc] = useState(false);
  const ifscCode = watch('bankIfscCode');
  
  useEffect(() => {
    const cleanIfsc = ifscCode ? ifscCode.trim().toUpperCase() : '';
    if (cleanIfsc.length === 11) {
      setIsFetchingIfsc(true);
      apiClient.get(`utils/ifsc/${cleanIfsc}`)
        .then((res) => {
          const resData = res.data;
          if (resData.success && resData.data && resData.data.BANK) {
            setValue('bankName', resData.data.BANK, { shouldDirty: true, shouldValidate: true });
            setValue('bankBranch', resData.data.BRANCH, { shouldDirty: true, shouldValidate: true });
          } else {
            toast.error('Could not fetch bank details. Please enter manually.');
          }
        })
        .catch(() => {
          toast.error('Could not fetch bank details. Please enter manually.');
        })
        .finally(() => {
          setIsFetchingIfsc(false);
        });
    }
  }, [ifscCode, setValue]);

  useEffect(() => {
    if (profile) {
      reset({
        personalEmail: profile.personalEmail || '',
        phone: profile.phone || '',
        bankAccountName: profile.bankAccountName || '',
        bankAccountNumber: profile.bankAccountNumber || '',
        bankIfscCode: profile.bankIfscCode || '',
        bankName: profile.bankName || '',
        bankBranch: profile.bankBranch || '',
        aadharNumber: profile.aadharNumber || '',
        panNumber: profile.panNumber || '',
        uanNumber: profile.uanNumber || '',
        pfNumber: profile.pfNumber || '',
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
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Profile not found.</div>;
  }

  return (
    <div className="flex flex-col pb-20 space-y-4">
      <div className="flex items-center gap-3">
        <Link to=".." relative="path" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">My Profile</h1>
          <p className="text-xs text-muted-foreground">Manage your information</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 text-center border">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl mb-3 border-2 border-background shadow-sm">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
          ) : (
            `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
          )}
        </div>
        <h3 className="font-bold text-lg">{profile.firstName} {profile.lastName}</h3>
        <p className="text-sm text-muted-foreground">{profile.designation?.name || 'No Designation'}</p>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Work Information</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <Mail className="h-3 w-3" /> Work Email
              </div>
              <p className="text-xs font-medium truncate" title={profile.workEmail}>{profile.workEmail}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <Briefcase className="h-3 w-3" /> Employee ID
              </div>
              <p className="text-xs font-medium">{profile.employeeCode || '-'}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <Building2 className="h-3 w-3" /> Department
              </div>
              <p className="text-xs font-medium truncate">{profile.department?.name || '-'}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <MapPin className="h-3 w-3" /> Location
              </div>
              <p className="text-xs font-medium truncate">{profile.location?.name || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Personal & Contact</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Personal Email</Label>
              <Input type="email" placeholder="john.doe@gmail.com" className="h-9 text-xs" {...register('personalEmail')} />
              {errors.personalEmail && <p className="text-[10px] text-destructive">{errors.personalEmail.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number</Label>
              <Input placeholder="+1 234 567 890" className="h-9 text-xs" {...register('phone')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Banking Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Account Name</Label>
              <Input placeholder="Name as per bank" className="h-9 text-xs" {...register('bankAccountName')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number</Label>
              <Input placeholder="Account number" className="h-9 text-xs" {...register('bankAccountNumber')} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs">IFSC Code</Label>
                {isFetchingIfsc && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <Input placeholder="IFSC code" className="h-9 text-xs uppercase" {...register('bankIfscCode')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name</Label>
              <Input placeholder="e.g. HDFC Bank" className="h-9 text-xs" {...register('bankName')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Branch</Label>
              <Input placeholder="Branch location" className="h-9 text-xs" {...register('bankBranch')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Identity & Compliance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Aadhar Number</Label>
              <Input placeholder="12-digit number" className="h-9 text-xs" {...register('aadharNumber')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">PAN Number</Label>
              <Input placeholder="10-character PAN" className="h-9 text-xs uppercase" {...register('panNumber')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">UAN Number</Label>
              <Input placeholder="Universal Account Number" className="h-9 text-xs" {...register('uanNumber')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">PF Number</Label>
              <Input placeholder="Provident Fund Number" className="h-9 text-xs" {...register('pfNumber')} />
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-10 pb-6">
          <Button type="submit" disabled={updateMutation.isPending} className="w-full h-11">
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>

      {!isAdminUser && (
        <Card className="border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 mb-10">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50">
                <DoorOpen className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-sm text-rose-700 dark:text-rose-300">Leaving?</CardTitle>
                <CardDescription className="text-[10px] mt-0.5">Submit resignation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Link
              to={slug ? `/t/${slug}/me/resignation` : '#'}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-300 dark:border-rose-700 px-4 py-2 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
            >
              <DoorOpen className="h-3 w-3" />
              Go to Resignation
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
