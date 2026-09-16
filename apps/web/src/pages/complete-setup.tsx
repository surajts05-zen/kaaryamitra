import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const setupSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export function CompleteSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, refreshUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
  });

  // Handle OAuth callback parameters if present in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const error = params.get('error');

    if (error) {
      toast.error('Google OAuth failed. Please try again.');
      navigate('/login');
      return;
    }

    if (accessToken) {
      // In a real app, you would verify this token or fetch the user profile.
      // For simplicity, we assume the token is valid and user is fetched later or stored.
      // We'll just fetch `/api/v1/auth/me` to get the user and populate the store.
      const fetchUser = async () => {
        try {
          // Set token temporarily for this request
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          const res = await apiClient.get('/auth/me');
          if (res.data.success) {
            login(accessToken, res.data.data);
            
            // Check if setup is actually required
            if (res.data.data.tenantId || res.data.data.isSuperAdmin) {
              navigate(res.data.data.isSuperAdmin ? '/admin' : `/t/${res.data.data.tenantSlug}/dashboard`);
            }
          }
        } catch (err) {
          console.error('Failed to fetch user after OAuth', err);
          navigate('/login');
        }
      };
      fetchUser();
    } else if (!user) {
      // If no token in URL and no user in store, they shouldn't be here
      navigate('/login');
    } else if (user.tenantId || user.isSuperAdmin) {
      // If user is already set up, redirect them
      navigate(user.isSuperAdmin ? '/admin' : `/t/${user.tenantSlug}/dashboard`);
    }
  }, [location, navigate, login, user]);

  const onSubmit = async (data: SetupFormValues) => {
    try {
      setIsLoading(true);
      const res = await apiClient.post('/auth/complete-setup', data);
      
      if (res.data.success) {
        toast.success('Workspace created successfully!');
        
        // Refresh user profile to get tenant info
        await refreshUser();
        navigate(`/t/${res.data.data.tenantSlug}/dashboard`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-background p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Complete your setup</h2>
          <p className="text-muted-foreground">
            Just one more step to create your workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Acme Corp"
                {...register('companyName')}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !user}>
            {isLoading ? 'Creating workspace...' : 'Complete Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
}
