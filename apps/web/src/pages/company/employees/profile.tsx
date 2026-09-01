import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEmployee, useResetEmployeePassword } from '@/features/company/hooks/use-employee-queries';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, Building2, MapPin, Briefcase, Calendar, CheckCircle2, UserCircle } from 'lucide-react';
import { format } from 'date-fns';

export function EmployeeProfilePage() {
  const { id } = useParams();
  const { data: employee, isLoading } = useEmployee(id as string);
  const resetPassword = useResetEmployeePassword();
  
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);
  const [sendToAlternate, setSendToAlternate] = React.useState(false);

  const handleResetPassword = () => {
    resetPassword.mutate(
      { id: id as string, sendToAlternate },
      {
        onSuccess: (data: any) => {
          toast.success(data.message || 'Password reset link sent');
          setIsResetPasswordOpen(false);
        },
        onError: () => {
          toast.error('Failed to reset password');
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!employee) {
    return <div className="p-8 text-center text-muted-foreground">Employee not found.</div>;
  }

  const getInitials = (first: string, last: string) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="../">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Employee Profile</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                Reset Password
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  This will generate a secure reset link for {employee?.firstName}.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Use Alternate Email</Label>
                    <p className="text-sm text-muted-foreground">
                      {employee?.personalEmail ? `Send to personal email: ${employee.personalEmail}` : 'No personal email on file. Link will go to work email.'}
                    </p>
                  </div>
                  <Switch
                    checked={sendToAlternate}
                    onCheckedChange={setSendToAlternate}
                    disabled={!employee?.personalEmail}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>Cancel</Button>
                <Button onClick={handleResetPassword} disabled={resetPassword.isPending}>
                  {resetPassword.isPending ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button asChild variant="outline">
            <Link to={`edit`}>
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Summary */}
        <div className="space-y-6 md:col-span-1">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl mb-4">
                {employee.avatarUrl ? (
                  <img src={employee.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                  getInitials(employee.firstName, employee.lastName)
                )}
              </div>
              <h3 className="font-semibold text-xl">{employee.firstName} {employee.lastName}</h3>
              <p className="text-muted-foreground mb-4">{employee.designation?.name || 'No Designation'}</p>
              
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  employee.employmentStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  employee.employmentStatus === 'PROBATION' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {employee.employmentStatus}
                </span>
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {employee.employmentType.replace('_', ' ')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{employee.workEmail}</span>
              </div>
              {employee.personalEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{employee.personalEmail} (Personal)</span>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Work Details</CardTitle>
              <CardDescription>Organizational assignment and role information.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" /> Department
                </div>
                <p>{employee.department?.name || 'Not assigned'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Briefcase className="h-4 w-4" /> Designation
                </div>
                <p>{employee.designation?.name || 'Not assigned'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4" /> Location
                </div>
                <p>{employee.location?.name || 'Not assigned'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <UserCircle className="h-4 w-4" /> Reporting Manager
                </div>
                <p>
                  {employee.manager 
                    ? `${employee.manager.firstName} ${employee.manager.lastName}`
                    : 'None'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline & History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Joined Organization</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(employee.joiningDate), 'MMMM do, yyyy')}
                  </p>
                </div>
              </div>
              
              {employee.user?.status === 'ACTIVE' && (
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Account Activated</p>
                    <p className="text-sm text-muted-foreground">
                      User completed setup
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
