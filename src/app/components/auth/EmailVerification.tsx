import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Mail, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '../ThemeToggle';
import { supabase } from '/utils/supabase/client';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface EmailVerificationProps {
  email: string;
  onVerified: (token?: string, adminStatus?: boolean) => void;
  onBackToLogin: () => void;
}

export function EmailVerification({
  email,
  onVerified,
  onBackToLogin,
}: EmailVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [emailStatus, setEmailStatus] = useState<'not_verified' | 'verified_pending' | 'verified_approved'>('not_verified');

  // Check initial email verification status
  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
        // Email is verified! Check approval status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('approval_status')
          .eq('id', session.user.id)
          .single();

        if (profile?.approval_status === 'approved') {
          setEmailStatus('verified_approved');
        } else {
          setEmailStatus('verified_pending');
        }
      } else {
        setEmailStatus('not_verified');
      }
    } catch (error) {
      console.error('Error checking initial status:', error);
    }
  };

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleVerify = async () => {
    setIsVerifying(true);
    
    try {
      // Check current session to see if email is verified
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error checking session:', sessionError);
        toast.error('Unable to check verification status. Please try again.');
        setIsVerifying(false);
        return;
      }

      if (!session || !session.user) {
        toast.info('Please click the verification link in your email first, then try again.');
        setIsVerifying(false);
        return;
      }

      if (!session.user.email_confirmed_at) {
        toast.info('Email not verified yet. Please click the link in your email first.');
        setIsVerifying(false);
        return;
      }

      // Email is verified! Now check approval status from database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('approval_status, is_admin, username')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Error loading user profile. Please try again.');
        setIsVerifying(false);
        return;
      }

      if (!profile) {
        toast.error('User profile not found. Please contact support.');
        setIsVerifying(false);
        return;
      }

      if (profile.approval_status === 'approved') {
        // Both verified and approved
        toast.success('Email verified and account approved! Logging you in...');
        onVerified(session.access_token, profile.is_admin);
      } else if (profile.approval_status === 'pending') {
        // Verified but not approved yet
        toast.success('Email verified! Your account is pending admin approval.');
        await supabase.auth.signOut();
        onBackToLogin();
      } else {
        // Rejected
        toast.error('Your account registration was not approved. Please contact support.');
        await supabase.auth.signOut();
        onBackToLogin();
      }
      
    } catch (error) {
      console.error('Verification check error:', error);
      toast.error('An error occurred while checking verification status.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('Resend error:', error);
        toast.error(error.message || 'Failed to resend verification email.');
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }

      setCanResend(false);
      setCountdown(60);
      
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('An error occurred while resending the email.');
    } finally {
      setIsResending(false);
    }
  };

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart.substring(0, 3)}***@${domain}`;
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
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Verify Your Email
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
              We've sent a verification link to
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {maskEmail(email)}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">To verify your email:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Check your inbox (and spam folder)</li>
                  <li>Click the "Confirm your email address" button in the email</li>
                  <li>You'll be redirected back to this page automatically</li>
                  <li>Click "I've Verified My Email" below to check your approval status</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Email Status Indicator */}
          {emailStatus === 'verified_pending' && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-medium text-green-900 dark:text-green-100">Email Verified! ✓</p>
                  <p className="text-green-700 dark:text-green-300 mt-1">
                    Your account is now pending admin approval. You'll be able to login once approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {emailStatus === 'verified_approved' && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-medium text-green-900 dark:text-green-100">Ready to Login! ✓</p>
                  <p className="text-green-700 dark:text-green-300 mt-1">
                    Your email is verified and your account is approved. Click below to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isVerifying ? 'Checking verification status' : "Check if email has been verified"}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  Checking...
                </>
              ) : (
                "I've Verified My Email"
              )}
            </Button>

            <Button
              onClick={handleResend}
              disabled={!canResend || isResending}
              variant="outline"
              className="w-full h-11 text-base dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={canResend ? 'Resend verification email' : `Resend available in ${countdown} seconds`}
            >
              {isResending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" />
                  {canResend ? 'Resend Email' : `Resend in ${countdown}s`}
                </>
              )}
            </Button>
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium focus:outline-none focus:underline"
              aria-label="Return to login page"
            >
              Back to Login
            </button>
          </div>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Didn't receive the email?
          </p>
          <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure {maskEmail(email)} is correct</li>
            <li>• Wait a few minutes and try resending</li>
          </ul>
        </div>
      </div>
    </div>
  );
}