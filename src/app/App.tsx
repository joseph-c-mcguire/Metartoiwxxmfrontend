import { useState, useEffect } from 'react';
import { FileConverter } from "./components/FileConverter";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { EmailVerification } from "./components/auth/EmailVerification";
import { AuthCallback } from "./components/auth/AuthCallback";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { supabase } from '/utils/supabase/client';

type AuthView = 'login' | 'register' | 'verify' | 'converter' | 'admin' | 'callback';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <ThemeProvider>
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

      <Toaster />
    </ThemeProvider>
  );
}

export default App;