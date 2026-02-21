import { useState, useEffect } from 'react';
import { FileConverter } from "./components/FileConverter";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { EmailVerification } from "./components/auth/EmailVerification";
import { AuthCallback } from "./components/auth/AuthCallback";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { AccessibilityMenu } from "./components/AccessibilityMenu";
import { AccessibilityProvider } from "./components/AccessibilityAnnouncement";
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { supabase } from '/utils/supabase/client';
import { getRequiredEnvVar, validateRequiredFrontendEnv } from '@/utils/env';

type AuthView = 'login' | 'register' | 'verify' | 'converter' | 'admin' | 'callback';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [preflightDone, setPreflightDone] = useState(false);
  const [preflightError, setPreflightError] = useState<string>('');

  const runPreflight = async () => {
    const validation = validateRequiredFrontendEnv();
    if (!validation.ok) {
      setPreflightError(validation.errors.join('\n'));
      setPreflightDone(true);
      return;
    }

    const supabaseUrl = getRequiredEnvVar('VITE_SUPABASE_URL');
    const healthResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: getRequiredEnvVar('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY'),
      },
    }).catch(() => null);

    if (!healthResponse || !healthResponse.ok) {
      setPreflightError('Supabase connectivity check failed');
      setPreflightDone(true);
      return;
    }

    setPreflightError('');
    setPreflightDone(true);
  };

  // Set HTML lang attribute for screen readers
  useEffect(() => {
    document.documentElement.lang = 'en';
    void runPreflight();
  }, []);

  // Listen for auth state changes (including email confirmation callbacks)
  useEffect(() => {
    // Check if this is an email confirmation callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'signup') {
      // User clicked email confirmation link
      console.log('Email confirmation detected, redirecting to callback handler');
      setCurrentView('callback');
      return;
    }

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('Existing session found:', session.user.email);
        // Don't auto-login here, let the user go through the normal flow
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);

      // When email is confirmed via link, Supabase creates a session
      if (event === 'SIGNED_IN' && session?.user) {
        // User just clicked the email confirmation link
        if (session.user.email_confirmed_at && currentView !== 'converter' && currentView !== 'admin') {
          setUserEmail(session.user.email || '');
          setAccessToken(session.access_token);
          // Redirect to verification view so they can check approval status
          setCurrentView('verify');
        }
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserEmail('');
        setAccessToken('');
        setIsAdmin(false);
        if (currentView !== 'login' && currentView !== 'register') {
          setCurrentView('login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentView]);

  // Keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Alt + A: Open accessibility menu
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        const accessibilityButton = document.querySelector('[aria-label*="accessibility settings"]') as HTMLButtonElement;
        accessibilityButton?.click();
      }
      
      // Alt + T: Toggle theme
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        const themeToggle = document.querySelector('[aria-label*="Toggle theme"]') as HTMLButtonElement;
        themeToggle?.click();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, []);

  const handleLogin = (email: string, needsVerification: boolean, token?: string, adminStatus?: boolean) => {
    setUserEmail(email);
    setAccessToken(token || 'mock-token-123');
    setIsAdmin(adminStatus || false);
    
    if (needsVerification) {
      setCurrentView('verify');
    } else {
      setIsAuthenticated(true);
      // Both admins and regular users start at the converter
      setCurrentView('converter');
    }
  };

  const handleRegister = (email: string) => {
    setUserEmail(email);
    setCurrentView('verify');
  };

  const handleVerified = (token?: string, adminStatus?: boolean) => {
    setIsAuthenticated(true);
    setAccessToken(token || '');
    setIsAdmin(adminStatus || false);
    setCurrentView(adminStatus ? 'admin' : 'converter');
  };

  const handleLogout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    setIsAuthenticated(false);
    setUserEmail('');
    setAccessToken('');
    setIsAdmin(false);
    setCurrentView('login');
  };

  const handleSwitchToAdmin = () => {
    setCurrentView('admin');
  };

  const handleSwitchToConverter = () => {
    setCurrentView('converter');
  };

  if (!preflightDone) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md p-8 bg-card border-border">
            <h2 className="text-lg font-semibold text-foreground mb-2 uppercase tracking-tight">
              Starting Services
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              Running connectivity checks...
            </p>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  if (preflightError) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-xl p-8 bg-card border-border">
            <h2 className="text-lg font-semibold text-destructive mb-3 uppercase tracking-tight">
              Service Preflight Failed
            </h2>
            <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
              {preflightError}
            </p>
            <div className="mt-6">
              <Button onClick={() => {
                setPreflightDone(false);
                void runPreflight();
              }}>
                Retry Checks
              </Button>
            </div>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      {/* Accessibility announcement provider for screen readers */}
      <AccessibilityProvider />
      
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <main id="main-content" role="main" aria-label="Main content">
        {currentView === 'login' && (
          <Login 
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        )}

        {currentView === 'register' && (
          <Register 
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'verify' && (
          <EmailVerification 
            email={userEmail}
            onVerified={handleVerified}
            onBackToLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'converter' && isAuthenticated && (
          <FileConverter 
            onLogout={handleLogout} 
            userEmail={userEmail}
            accessToken={accessToken}
            onSwitchToAdmin={isAdmin ? handleSwitchToAdmin : undefined}
          />
        )}

        {currentView === 'admin' && isAuthenticated && isAdmin && (
          <AdminDashboard
            onLogout={handleLogout}
            userEmail={userEmail}
            accessToken={accessToken}
            onSwitchToConverter={handleSwitchToConverter}
          />
        )}

        {currentView === 'callback' && (
          <AuthCallback
            onLogin={handleLogin}
            onRegister={handleRegister}
            onVerified={handleVerified}
          />
        )}
      </main>

      <Toaster />
      <AccessibilityMenu />
    </ThemeProvider>
  );
}

export default App;