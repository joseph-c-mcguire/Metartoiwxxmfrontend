import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '../ThemeToggle';
import { supabase } from '/utils/supabase/client';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface LoginFormData {
  emailOrUsername: string;
  password: string;
}

interface LoginProps {
  onLogin: (email: string, needsVerification: boolean, token?: string, adminStatus?: boolean) => void;
  onSwitchToRegister: () => void;
}

export function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      let email = data.emailOrUsername;

      // If user entered username instead of email, look up their email
      if (!email.includes('@')) {
        // It's a username, need to fetch the email from database
        const { data: profileData, error: lookupError } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('username', email)
          .single();

        if (lookupError || !profileData) {
          console.error('Username lookup error:', lookupError);
          toast.error('Invalid username or password');
          setIsLoading(false);
          return;
        }

        email = profileData.email;
      }

      // Login directly with Supabase using email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: data.password,
      });

      if (authError) {
        console.error('Login error:', authError);
        // Better error messages
        if (authError.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials and try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before logging in.');
        } else {
          toast.error(authError.message || 'Invalid email or password');
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user || !authData.session) {
        toast.error('Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Check if email is verified
      if (!authData.user.email_confirmed_at) {
        toast.info('Please verify your email before logging in. Check your inbox for the verification link.');
        onLogin(authData.user.email || '', true);
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Check approval status from database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('approval_status, is_admin, username')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Error loading user profile. Please try again.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      if (!profile) {
        toast.error('User profile not found. Please contact support.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Check approval status
      if (profile.approval_status === 'pending') {
        toast.info('Your account is pending admin approval. Please wait for approval before logging in.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      } else if (profile.approval_status === 'rejected') {
        toast.error('Your account registration was not approved. Please contact support.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Update last_login
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

      // User is approved and email is verified - proceed with login
      toast.success(`Welcome back, ${profile.username}!`);
      
      onLogin(authData.user.email || '', false, authData.session.access_token, profile.is_admin);
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 transition-colors">
      <div className="w-full max-w-md">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Display Mode</span>
            <ThemeToggle />
          </div>
        </div>

        <Card className="p-8 bg-card border-border">
          {/* Header */}
          <div className="mb-8 border-b border-border pb-6">
            <h1 className="text-xl font-semibold text-foreground mb-1 tracking-tight uppercase">
              METAR Converter
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Authentication System v1.0
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="emailOrUsername" className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Email / Username
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="user@domain.com or username"
                  className={`pl-10 h-10 text-sm font-mono bg-background border-border focus:border-primary ${errors.emailOrUsername ? 'border-destructive' : ''}`}
                  {...register('emailOrUsername', {
                    required: 'Email or username is required',
                    minLength: {
                      value: 3,
                      message: 'Must be at least 3 characters'
                    }
                  })}
                  aria-invalid={errors.emailOrUsername ? 'true' : 'false'}
                  aria-describedby={errors.emailOrUsername ? 'emailOrUsername-error' : undefined}
                />
              </div>
              {errors.emailOrUsername && (
                <p id="emailOrUsername-error" className="text-xs text-destructive mt-1 font-mono" role="alert">
                  {errors.emailOrUsername.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={`pl-10 h-10 text-sm font-mono bg-background border-border focus:border-primary ${errors.password ? 'border-destructive' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive mt-1 font-mono" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-border focus:ring-2 focus:ring-primary"
                  aria-label="Remember me"
                />
                <span className="ml-2 text-xs text-muted-foreground uppercase tracking-wide">Remember</span>
              </label>
              <button
                type="button"
                className="text-xs text-primary hover:text-primary/80 focus:outline-none focus:underline uppercase tracking-wide"
                aria-label="Forgot password"
              >
                Reset Password
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 text-xs"
              aria-label={isLoading ? 'Signing in, please wait' : 'Sign in to account'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Authenticating...
                </>
              ) : (
                'Authenticate'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              No account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary hover:text-primary/80 font-medium focus:outline-none focus:underline uppercase tracking-wide"
                aria-label="Go to registration page"
              >
                Register
              </button>
            </p>
          </div>

          {/* Admin Access Link */}
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground font-mono">
              <span className="text-secondary">ADMIN:</span> Login to access dashboard
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 font-mono">
          Terms of Service • Privacy Policy
        </p>
      </div>
    </div>
  );
}