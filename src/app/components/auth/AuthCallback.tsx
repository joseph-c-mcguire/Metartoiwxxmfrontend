import { useEffect, useState } from 'react';
import { supabase } from '/utils/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../ui/card';

interface AuthCallbackProps {
  onRegister?: (email: string) => void;
}

export function AuthCallback({ onRegister }: AuthCallbackProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session - Supabase automatically processes the auth hash
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('AuthCallback: Got session', !!session, 'error:', error?.message);

        if (error) {
          console.error('Error getting session:', error);
          setStatus('error');
          setMessage('Failed to confirm email. Please try again.');
          toast.error('Email confirmation failed');
          setTimeout(() => {
            window.location.hash = '';
            window.location.href = '/';
          }, 2000);
          return;
        }

        if (!session?.user) {
          console.error('No session or user found');
          setStatus('error');
          setMessage('No confirmation data found. Please try again.');
          toast.error('Email confirmation failed');
          setTimeout(() => {
            window.location.hash = '';
            window.location.href = '/';
          }, 2000);
          return;
        }

        // Check if email was confirmed
        if (!session.user.email_confirmed_at) {
          console.error('Email not confirmed');
          setStatus('error');
          setMessage('Email not confirmed. Please check your inbox.');
          toast.error('Email not confirmed');
          setTimeout(() => {
            window.location.hash = '';
            window.location.href = '/';
          }, 2000);
          return;
        }

        // Check approval status from database
        let profile = null;
        let profileError = null;
        
        const profileQuery = await supabase
          .from('user_profiles')
          .select('approval_status')
          .eq('id', session.user.id)
          .single();
        
        profile = profileQuery.data;
        profileError = profileQuery.error;

        // If profile doesn't exist, try to create it (fallback if trigger didn't fire)
        if (!profile && profileError?.code === 'PGRST116') {
          console.log('Profile not found, creating...');
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
              approval_status: 'pending',
              is_admin: false,
            })
            .select('approval_status')
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            setStatus('error');
            setMessage('Error creating user profile. Please contact support.');
            toast.error('Error creating user profile');
            await supabase.auth.signOut();
            setTimeout(() => {
              window.location.hash = '';
              window.location.href = '/';
            }, 2000);
            return;
          }
          
          profile = newProfile;
        } else if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          setStatus('error');
          setMessage('Error loading profile. Please contact support.');
          toast.error('Error loading user profile');
          await supabase.auth.signOut();
          setTimeout(() => {
            window.location.hash = '';
            window.location.href = '/';
          }, 2000);
          return;
        }

        if (!profile) {
          console.error('Profile not found after creation attempt');
          setStatus('error');
          setMessage('Error loading profile. Please contact support.');
          toast.error('Error loading user profile');
          await supabase.auth.signOut();
          setTimeout(() => {
            window.location.hash = '';
            window.location.href = '/';
          }, 2000);
          return;
        }

        // Check if user is approved
        if (profile.approval_status === 'pending') {
          console.log('User email verified but account pending approval');
          setStatus('success');
          setMessage('Email verified! Your account is pending admin approval.');
          toast.success('Email verified! Your account is pending admin approval.');
          // Sign out the user - they need to wait for approval
          await supabase.auth.signOut();
          setTimeout(() => {
            window.location.hash = '';
            window.location.href = '/';
          }, 2000);
          return;
        }

        if (profile.approval_status === 'rejected') {
          console.log('User account was rejected');
          setStatus('error');
          setMessage('Your account registration was not approved. Please contact support.');
          toast.error('Account registration was not approved');
          // Sign out the user
          await supabase.auth.signOut();
          setTimeout(() => {
            window.location.hash = '';
            window.location.href = '/';
          }, 2000);
          return;
        }

        // Success - email verified AND account approved!
        console.log('Email confirmed and account approved:', session.user.email);
        setStatus('success');
        setMessage('Email confirmed! Redirecting...');
        toast.success('Email verified and account approved!');

        // Clear the hash from URL
        window.location.hash = '';

        // Wait for token to be properly stored then redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);

      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again.');
        toast.error('Email confirmation failed');
        setTimeout(() => {
          window.location.hash = '';
          window.location.href = '/';
        }, 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8 transition-colors">
      <Card className="w-full max-w-md p-8 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Confirming Email
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {message}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Confirmed!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600 dark:text-red-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Confirmation Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {message}
              </p>
              <button
                onClick={() => {
                  window.location.hash = '';
                  onRegister('');
                }}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Return to Login
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
