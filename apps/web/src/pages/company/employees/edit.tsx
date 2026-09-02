import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod';
import { useEmployee, useUpdateEmployee, useEmployees } from '@/features/company/hooks/use-employee-queries';
import { useDepartments, useLocations, useDesignations } from '@/features/company/hooks/use-org-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  employeeCode: z.string().optional(),
  workEmail: z.string().email('Invalid email address'),
  personalEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  locationId: z.string().optional(),
  managerId: z.string().optional(),
  joiningDate: z.string().min(1, 'Joining date is required'),
  employmentType: z.string().optional(),
  employmentStatus: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditEmployeePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateMutation = useUpdateEmployee();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employee, isLoading } = useEmployee(id as string);
  const { data: departments } = useDepartments();
  const { data: locations } = useLocations();
  const { data: designations } = useDesignations();
  const { data: employees } = useEmployees();

  // Avatar preview state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeCode: employee.employeeCode || '',
        workEmail: employee.workEmail,
        personalEmail: employee.personalEmail || '',
        phone: employee.phone || '',
        departmentId: employee.departmentId || 'none',
        designationId: employee.designationId || 'none',
        locationId: employee.locationId || 'none',
        managerId: employee.managerId || 'none',
        joiningDate: (employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '') as string,
        employmentType: employee.employmentType || 'FULL_TIME',
        employmentStatus: employee.employmentStatus || 'ACTIVE',
      } as Partial<FormValues>);
      setAvatarPreview(employee.avatarUrl || null);
    }
  }, [employee, reset]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      setAvatarBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: FormValues) => {
    const payload: any = {
      ...data,
      joiningDate: new Date(data.joiningDate).toISOString(),
    };

    if (avatarBase64) {
      payload.avatarUrl = avatarBase64;
    }

    updateMutation.mutate({ id: id as string, data: payload }, {
      onSuccess: () => {
        toast.success('Employee updated successfully');
        navigate(`../${id}`);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || 'Failed to update employee');
      }
    });
  };

  const initials = employee
    ? `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!employee) return <div className="p-8 text-center text-muted-foreground">Employee not found.</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`../${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Employee</h2>
          <p className="text-muted-foreground">Update employee profile and work details.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Photo Upload ── */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Upload a photo for this employee. Max 2MB.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={employee.firstName}
                  className="h-24 w-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary/10 border-2 border-dashed border-primary/40 flex items-center justify-center text-2xl font-bold text-primary">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Camera className="mr-2 h-4 w-4" /> Change Photo
              </Button>
              {avatarPreview && employee.avatarUrl !== avatarPreview && (
                <p className="text-xs text-green-500">New photo selected — save to apply.</p>
              )}
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive text-xs"
                  onClick={() => { setAvatarPreview(null); setAvatarBase64(''); }}
                >
                  Remove photo
                </Button>
              )}
              <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Max 2MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </CardContent>
        </Card>

        {/* ── Personal Information ── */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details about the employee.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name <span className="text-destructive">*</span></Label>
              <Input placeholder="John" {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Last Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Doe" {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Personal Email</Label>
              <Input type="email" placeholder="john.doe@gmail.com" {...register('personalEmail')} />
              {errors.personalEmail && <p className="text-xs text-destructive">{errors.personalEmail.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+1 234 567 890" {...register('phone')} />
            </div>
          </CardContent>
        </Card>

        {/* ── Work Information ── */}
        <Card>
          <CardHeader>
            <CardTitle>Work Information</CardTitle>
            <CardDescription>Employment details and organizational placement.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Work Email <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="john.doe@company.com" {...register('workEmail')} />
              <p className="text-[10px] text-muted-foreground">Updating work email also updates the employee's login email.</p>
              {errors.workEmail && <p className="text-xs text-destructive">{errors.workEmail.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Employee ID / Code</Label>
              <Input placeholder="EMP-001" {...register('employeeCode')} />
            </div>

            <div className="space-y-2">
              <Label>Joining Date <span className="text-destructive">*</span></Label>
              <Input type="date" {...register('joiningDate')} />
              {errors.joiningDate && <p className="text-xs text-destructive">{errors.joiningDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select defaultValue={employee.departmentId || 'none'} onValueChange={(val) => setValue('departmentId', val)}>
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Designation</Label>
              <Select defaultValue={employee.designationId || 'none'} onValueChange={(val) => setValue('designationId', val)}>
                <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {designations?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select onValueChange={(val) => setValue('locationId', val)} defaultValue={employee.locationId || 'none'}>
                <SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {locations?.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reporting Manager</Label>
              <Select onValueChange={(val) => setValue('managerId', val)} defaultValue={employee.managerId || 'none'}>
                <SelectTrigger><SelectValue placeholder="Select Manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {employees?.filter((e: any) => e.id !== employee.id).map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Employment Status & Type ── */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Classification</CardTitle>
            <CardDescription>Set the employee's current status and contract type. These appear as tags on the employee card.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employment Status</Label>
              <Select defaultValue={employee.employmentStatus || 'ACTIVE'} onValueChange={(val) => setValue('employmentStatus', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PROBATION">Probation</SelectItem>
                  <SelectItem value="NOTICE_PERIOD">Notice Period</SelectItem>
                  <SelectItem value="OFFBOARDED">Offboarded</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Shown as a coloured tag on the employee card.</p>
            </div>

            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select defaultValue={employee.employmentType || 'FULL_TIME'} onValueChange={(val) => setValue('employmentType', val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERN">Intern</SelectItem>
                  <SelectItem value="CONSULTANT">Consultant</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Shown as a coloured tag on the employee card.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate(`../${id}`)}>Cancel</Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
