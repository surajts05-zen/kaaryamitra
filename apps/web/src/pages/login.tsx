import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ssoOptions, setSsoOptions] = useState({ enableGoogleSso: true, enableZohoSso: false });

  useEffect(() => {
    apiClient.get('/auth/sso-options').then(res => {
      if (res.data?.success) setSsoOptions(res.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const requiresSetup = searchParams.get('requiresSetup') === 'true';
    const error = searchParams.get('error');

    if (error) {
      if (error === 'AUTH_RATE_LIMITED') {
        toast.error('Too many login attempts. Please try again in 15 minutes.');
      } else if (error === 'Zoho_OAuth_Failed') {
        toast.error('Zoho authentication failed or was cancelled.');
      } else if (error === 'Google_OAuth_Failed') {
        toast.error('Google authentication failed or was cancelled.');
      } else {
        toast.error(`Authentication failed: ${error}`);
      }
    } else if (accessToken) {
      localStorage.setItem('km_access_token', accessToken);
      refreshUser().then(() => {
        if (requiresSetup) {
          navigate('/complete-setup');
        } else {
          const user = useAuthStore.getState().user;
          if (user?.isSuperAdmin) {
            navigate('/admin');
          } else if (user?.tenantSlug) {
            navigate(`/t/${user.tenantSlug}/dashboard`);
          } else {
            navigate('/');
          }
        }
      });
    }
  }, [searchParams, navigate, refreshUser]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const res = await apiClient.post('/auth/login', data);
      
      if (res.data.success) {
        const { user, accessToken } = res.data.data;
        login(accessToken, user);
        
        // Route based on role
        if (user.isSuperAdmin) {
          navigate('/admin');
        } else if (user.tenantSlug) {
          navigate(`/t/${user.tenantSlug}/dashboard`);
        } else {
          toast.error('No workspace assigned');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side — Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-4">
          <img src="/icon.png" alt="KaaryaMitra Logo" className="h-14 w-auto object-contain rounded-lg shadow-md" />
          <span className="text-3xl font-bold tracking-tight">KaaryaMitra</span>
        </div>
        
        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            The modern HR platform for the modern workforce.
          </h1>
          <p className="text-lg text-sidebar-foreground/70">
            Streamline your HR processes, empower your employees, and get actionable insights — all in one place.
          </p>
        </div>
        
        <div className="text-sm text-sidebar-foreground/50">
          © {new Date().getFullYear()} KaaryaMitra Inc. All rights reserved.
        </div>
      </div>

      {/* Right side — Login Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            
            {(ssoOptions.enableGoogleSso || ssoOptions.enableZohoSso) && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {ssoOptions.enableGoogleSso && (
                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full" 
                  disabled={isLoading}
                  onClick={() => {
                    window.location.href = `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google`;
                  }}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
              )}

              {ssoOptions.enableZohoSso && (
                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full" 
                  disabled={isLoading}
                  onClick={() => {
                    window.location.href = `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/zoho`;
                  }}
                >
                  <svg className="mr-2 h-4 w-11" viewBox="0 0 1024 366" xmlns="http://www.w3.org/2000/svg">
                    <title>Zoho</title>
                    <path fill="#089949" d="M458.1,353c-7.7,0-15.5-1.6-23-4.9l0,0l-160-71.3c-28.6-12.7-41.5-46.4-28.8-75l71.3-160c12.7-28.6,46.4-41.5,75-28.8l160,71.3c28.6,12.7,41.5,46.4,28.8,75l-71.3,160C500.6,340.5,479.8,353,458.1,353z M448.4,318.1c12.1,5.4,26.3-0.1,31.7-12.1l71.3-160c5.4-12.1-0.1-26.3-12.1-31.7L379.2,43c-12.1-5.4-26.3,0.1-31.7,12.1l-71.3,160c-5.4,12.1,0.1,26.3,12.1,31.7L448.4,318.1z"/>
                    <path fill="#F9B21D" d="M960,353.1H784.8c-31.3,0-56.8-25.5-56.8-56.8V121.1c0-31.3,25.5-56.8,56.8-56.8H960c31.3,0,56.8,25.5,56.8,56.8v175.2C1016.8,327.6,991.3,353.1,960,353.1z M784.8,97.1c-13.2,0-24,10.8-24,24v175.2c0,13.2,10.8,24,24,24H960c13.2,0,24-10.8,24-24V121.1c0-13.2-10.8-24-24-24H784.8z"/>
                    <path fill="#E42527" d="M303.9,153.2L280.3,206c-0.3,0.6-0.6,1.1-0.9,1.6l9.2,56.8c2.1,13.1-6.8,25.4-19.8,27.5l-173,28c-6.3,1-12.7-0.5-17.9-4.2c-5.2-3.7-8.6-9.3-9.6-15.6l-28-173c-1-6.3,0.5-12.7,4.2-17.9c3.7-5.2,9.3-8.6,15.6-9.6l173-28c1.3-0.2,2.6-0.3,3.8-0.3c11.5,0,21.8,8.4,23.7,20.2l9.3,57.2L294.3,94l-1.3-7.7c-5-30.9-34.2-52-65.1-47l-173,28C40,69.6,26.8,77.7,18,90c-8.9,12.3-12.4,27.3-10,42.3l28,173c2.4,15,10.5,28.1,22.8,37C68.5,349.4,80,353,91.9,353c3,0,6.1-0.2,9.2-0.7l173-28c30.9-5,52-34.2,47-65.1L303.9,153.2z"/>
                    <path fill="#226DB4" d="M511.4,235.8l25.4-56.9l-7.2-52.9c-0.9-6.3,0.8-12.6,4.7-17.7c3.9-5.1,9.5-8.4,15.9-9.2l173.6-23.6c1.1-0.1,2.2-0.2,3.3-0.2c5.2,0,10.2,1.7,14.5,4.9c0.8,0.6,1.5,1.3,2.2,1.9c7.7-8.1,17.8-13.9,29.1-16.4c-3.2-4.4-7-8.3-11.5-11.7c-12.1-9.2-27-13.1-42-11.1L545.6,66.5c-15,2-28.4,9.8-37.5,21.9c-9.2,12.1-13.1,27-11.1,42L511.4,235.8z"/>
                    <path fill="#226DB4" d="M806.8,265.1l-22.8-168c-12.8,0.4-23.1,11-23.1,23.9v49.3l13.5,99.2c0.9,6.3-0.8,12.6-4.7,17.7s-9.5,8.4-15.9,9.2l-173.6,23.6c-6.3,0.9-12.6-0.8-17.7-4.7c-5.1-3.9-8.4-9.5-9.2-15.9l-8-58.9l-25.4,56.9l0.9,6.4c2,15,9.8,28.4,21.9,37.5c10,7.6,21.9,11.6,34.3,11.6c2.6,0,5.2-0.2,7.8-0.5L758.2,329c15-2,28.4-9.8,37.5-21.9C804.9,295,808.8,280.1,806.8,265.1z"/>
                  </svg>
                  Zoho
                </Button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="underline underline-offset-4 hover:text-primary">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
