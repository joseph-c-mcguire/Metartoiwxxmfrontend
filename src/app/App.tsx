import { useState, useEffect } from 'react';
import { FileConverter } from "./components/FileConverter";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { EmailVerification } from "./components/auth/EmailVerification";
import { AuthCallback } from "./components/auth/AuthCallback";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { PasswordReset } from "./components/auth/PasswordReset";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { supabase } from '/utils/supabase/client';

// Validate required Supabase environment variables on app load
function validateSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url) {
    const errorMsg = '❌ Missing VITE_SUPABASE_URL environment variable. Please check .env.local file.';
    console.error(errorMsg);
    toast.error(errorMsg);
    return false;
  }

  if (!key) {
    const errorMsg = '❌ Missing VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY environment variable. Please check .env.local file. See .env.example for reference.';
    console.error(errorMsg);
    toast.error(errorMsg);
    return false;
  }

  if (!key.startsWith('eyJ') && !key.startsWith('sb_publishable_')) {
    console.warn('⚠️ VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY does not look like a valid Supabase key. Please verify it in your .env.local file.');
  }

  return true;
}

type AuthView = 'login' | 'register' | 'verify' | 'converter' | 'admin' | 'callback' | 'reset';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [envValid, setEnvValid] = useState(false);
  const [lastProcessedUserId, setLastProcessedUserId] = useState<string | null>(null);

  // Validate environment on mount
  useEffect(() => {
    if (validateSupabaseEnv()) {
      setEnvValid(true);
    }
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

    // Track if we've already processed this user to prevent duplicate processing
    // (this is a state variable now to persist across re-renders)

    // Listen for auth state changes (only for actual login/logout)
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
        setLastProcessedUserId(null);
        if (currentView !== 'login' && currentView !== 'register') {
          setCurrentView('login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentView, lastProcessedUserId]);

  const handleLogin = (email: string, needsVerification: boolean, token?: string, adminStatus?: boolean) => {
    console.log(`🔐 handleLogin called with:`, { email, needsVerification, adminStatus, hasToken: !!token });
    setUserEmail(email);
    setAccessToken(token || 'mock-token-123');
    setIsAdmin(adminStatus || false);
    console.log(`DEBUG: Set isAdmin to ${adminStatus || false}`);
    
    if (needsVerification) {
      setCurrentView('verify');
    } else {
      setIsAuthenticated(true);
      // Route admins to admin view, others to converter
      console.log(`DEBUG: Routing to ${adminStatus ? 'admin' : 'converter'} view`);
      setCurrentView(adminStatus ? 'admin' : 'converter');
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

  return (
    <ThemeProvider>
      {currentView === 'login' && (
        <Login 
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentView('register')}
          onForgotPassword={() => setCurrentView('reset')}
        />
      )}

      {currentView === 'register' && (
        <Register 
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}

      {currentView === 'reset' && (
        <PasswordReset 
          onBackToLogin={() => setCurrentView('login')}
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

      <Toaster />
    </ThemeProvider>
  );
}

export default App;