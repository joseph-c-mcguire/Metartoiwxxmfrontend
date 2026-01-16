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
  onForgotPassword: () => void;
}

export function Login({ onLogin, onSwitchToRegister, onForgotPassword }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const handleMagicLink = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Magic link error:', error);
        toast.error(error.message || 'Failed to send magic link');
        setIsLoading(false);
        return;
      }

      toast.success('✨ Magic link sent! Check your email for a login link.');
      setUseMagicLink(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Magic link error:', error);
      toast.error('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      let email = data.emailOrUsername;

      // If user entered username instead of email, look up their email
      if (!email.includes('@')) {
        // It's a username, use the RPC function to look up email
        const { data: emailResult, error: lookupError } = await supabase
          .rpc('lookup_email_by_username', { p_username: email });

        if (lookupError || !emailResult) {
          console.error('Username lookup error:', lookupError);
          toast.error('Invalid username or password');
          setIsLoading(false);
          return;
        }

        email = emailResult;
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
        toast.info('✋ Account Pending Approval\n\nYour email is verified, but an administrator needs to approve your account before you can login. You will be notified once approved.', {
          duration: 8000,
        });
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      } else if (profile.approval_status === 'rejected') {
        toast.error('❌ Account Not Approved\n\nYour account registration was not approved. Please contact support for more information.');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8 transition-colors">
      <div className="w-full max-w-md">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        <Card className="p-8 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Sign in to your METAR Converter account
            </p>
          </div>

          {/* Auth Method Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setUseMagicLink(false)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !useMagicLink
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-pressed={!useMagicLink}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setUseMagicLink(true)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                useMagicLink
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-pressed={useMagicLink}
            >
              Magic Link
            </button>
          </div>

          {/* Magic Link Form */}
          {useMagicLink && (
            <form onSubmit={(e) => { e.preventDefault(); handleMagicLink(register('emailOrUsername').name ? '' : 'test@example.com'); }} className="space-y-5">
              <div>
                <Label htmlFor="magicEmail" className="text-base dark:text-white">
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" aria-hidden="true" />
                  <Input
                    id="magicEmail"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-11 text-base dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    aria-label="Email address for magic link"
                    required
                    onChange={(e) => {
                      if (e.currentTarget.value) {
                        setTimeout(() => {}, 0);
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ✨ We'll send you a secure login link via email. No password needed!
                </p>
              </div>

              <Button
                type="button"
                onClick={(e) => {
                  const emailInput = (e.currentTarget.closest('form')?.querySelector('#magicEmail') as HTMLInputElement)?.value;
                  if (emailInput) {
                    handleMagicLink(emailInput);
                  }
                }}
                disabled={isLoading}
                className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isLoading ? 'Sending magic link' : 'Send magic link'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  '✨ Send Magic Link'
                )}
              </Button>
            </form>
          )}

          {/* Login Form */}
          {!useMagicLink && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="emailOrUsername" className="text-base dark:text-white">
                Email or Username
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" aria-hidden="true" />
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="Enter email or username"
                  className={`pl-10 h-11 text-base dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 ${
                    errors.emailOrUsername ? 'border-red-500 dark:border-red-500' : ''
                  }`}
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
                <p id="emailOrUsername-error" className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                  {errors.emailOrUsername.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-base dark:text-white">
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  className={`pl-10 h-11 text-base dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500 dark:border-red-500' : ''
                  }`}
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
                <p id="password-error" className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  aria-label="Remember me"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Remember me</span>
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline"
                aria-label="Forgot password"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isLoading ? 'Signing in, please wait' : 'Sign in to account'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          )}

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium focus:outline-none focus:underline"
                aria-label="Go to registration page"
              >
                Sign up
              </button>
            </p>
          </div>

          {/* Admin Access Link */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Administrator?{' '}
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                Login above to access admin dashboard
              </span>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}