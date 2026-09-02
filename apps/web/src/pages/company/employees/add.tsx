import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateEmployee, useEmployees } from '@/features/company/hooks/use-employee-queries';
import { useDepartments, useLocations, useDesignations } from '@/features/company/hooks/use-org-queries';
import { useRoles } from '@/features/company/hooks/use-role-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAiExtract } from '@/features/ai/hooks/use-ai-chat';

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
  roleId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddEmployeePage() {
  const navigate = useNavigate();
  const createMutation = useCreateEmployee();
  
  const { data: departments } = useDepartments();
  const { data: locations } = useLocations();
  const { data: designations } = useDesignations();
  const { data: employees } = useEmployees();
  const { data: roles } = useRoles();
  const extractMutation = useAiExtract();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      joiningDate: new Date().toISOString().split('T')[0] || '',
    } as Partial<FormValues>
  });

  const onSubmit = (data: FormValues) => {
    // Add time component to joiningDate to make it a valid ISO datetime if needed
    const payload = {
      ...data,
      joiningDate: new Date(data.joiningDate).toISOString(),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Employee created successfully');
        navigate('../');
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || 'Failed to create employee');
      }
    });
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', 'Extract the following fields from this resume: firstName, lastName, personalEmail, phone. Return them in a flat JSON object.');

    toast.promise(extractMutation.mutateAsync(formData), {
      loading: 'Extracting data with AI...',
      success: (data) => {
        if (data.firstName) setValue('firstName', data.firstName);
        if (data.lastName) setValue('lastName', data.lastName);
        if (data.personalEmail) setValue('personalEmail', data.personalEmail);
        if (data.phone) setValue('phone', data.phone);
        return 'Data extracted successfully!';
      },
      error: 'Failed to extract data',
    });
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('../')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add Employee</h2>
          <p className="text-muted-foreground">Create a new employee profile and user account.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details about the employee.</CardDescription>
            </div>
            <div>
              <Label htmlFor="resume-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-km-forest/5 hover:bg-km-forest/10 border border-km-forest/20 text-km-forest rounded-md text-sm font-medium transition-colors">
                  <Sparkles className="h-4 w-4 text-km-lime" />
                  Auto-fill from Resume
                </div>
              </Label>
              <Input 
                id="resume-upload" 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg" 
                className="hidden" 
                onChange={handleResumeUpload}
                disabled={extractMutation.isPending}
              />
            </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Work Information</CardTitle>
            <CardDescription>Employment details and organizational placement.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Work Email <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="john.doe@company.com" {...register('workEmail')} />
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
              <Select onValueChange={(val) => setValue('departmentId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Designation</Label>
              <Select onValueChange={(val) => setValue('designationId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {designations?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select onValueChange={(val) => setValue('locationId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {locations?.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reporting Manager</Label>
              <Select onValueChange={(val) => setValue('managerId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {employees?.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>App Role</Label>
              <Select onValueChange={(val) => setValue('roleId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {roles?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate('../')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
