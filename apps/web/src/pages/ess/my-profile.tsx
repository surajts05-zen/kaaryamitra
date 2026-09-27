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
import { Save, Mail, Phone, Building2, MapPin, Briefcase, DoorOpen, AlertTriangle, Loader2 } from 'lucide-react';
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

export function EssProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateMyProfile();
  const { slug } = useParams();
  const { user } = useAuthStore();

  // Admins and HR managers manage resignations — they don't submit them
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
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Banking Details</CardTitle>
                <CardDescription>Update your salary account and banking information for payroll.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Bank Account Name</Label>
                  <Input placeholder="Name as per bank records" {...register('bankAccountName')} />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input placeholder="Account number" {...register('bankAccountNumber')} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>IFSC Code</Label>
                    {isFetchingIfsc && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  <Input placeholder="IFSC code" {...register('bankIfscCode')} />
                </div>
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input placeholder="e.g. HDFC Bank" {...register('bankName')} />
                </div>
                <div className="space-y-2">
                  <Label>Bank Branch</Label>
                  <Input placeholder="Branch location" {...register('bankBranch')} />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Identity & Compliance</CardTitle>
                <CardDescription>Update your national IDs and compliance identifiers.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aadhar Number</Label>
                  <Input placeholder="12-digit Aadhar number" {...register('aadharNumber')} />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input placeholder="10-character PAN" {...register('panNumber')} />
                </div>
                <div className="space-y-2">
                  <Label>UAN Number</Label>
                  <Input placeholder="Universal Account Number (EPFO)" {...register('uanNumber')} />
                </div>
                <div className="space-y-2">
                  <Label>PF Number</Label>
                  <Input placeholder="Provident Fund Number" {...register('pfNumber')} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-6">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Resignation (hidden for admins/HR) ── */}
        {!isAdminUser && (
          <div className="md:col-span-3">
            <Card className="border-rose-200/60 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                    <DoorOpen className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-rose-700 dark:text-rose-300">Leaving the Organization?</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Submit a formal resignation request for HR review.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground max-w-xl">
                  This will notify your manager and HR team. Your last working day will be determined based on your notice period and approval.
                </p>
                <Link
                  to={slug ? `/t/${slug}/me/resignation` : '#'}
                  className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-rose-300 dark:border-rose-700 px-4 py-2 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                >
                  <DoorOpen className="h-4 w-4" />
                  Go to Resignation
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
