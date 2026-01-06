import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Mail, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '../ThemeToggle';

interface EmailVerificationProps {
  email: string;
  onVerified: (token?: string, adminStatus?: boolean) => void;
  onBackToLogin: () => void;
}

export function EmailVerification({ email, onVerified, onBackToLogin }: EmailVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isResending]);

  const handleVerify = async () => {
    setIsVerifying(true);
    
    // Simulate verification check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Email verified successfully!');
    onVerified();
    
    setIsVerifying(false);
  };

  const handleResend = async () => {
    setIsResending(true);
    
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Verification email sent!');
    setCanResend(false);
    setCountdown(60);
    setIsResending(false);
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
                  <li>Click the verification link in the email</li>
                  <li>Return here and click "I've Verified My Email"</li>
                </ol>
              </div>
            </div>
          </div>

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