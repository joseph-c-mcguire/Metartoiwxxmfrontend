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
    if (!envValid) return;
    // Check if this is an email confirmation callback (can be from /auth/callback path or from hash at root)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    const isAuthCallbackPath = window.location.pathname.includes('/auth/callback');

    console.log('Path:', window.location.pathname, 'Hash accessToken:', !!accessToken, 'Type:', type);

    if ((accessToken && (type === 'signup' || type === 'recovery')) || isAuthCallbackPath) {
      // User clicked email confirmation or recovery link, or was redirected to /auth/callback
      // AuthCallback component will handle this - don't set up the auth listener
      console.log('Auth callback detected, showing callback view');
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

      // Skip if this is a callback-triggered event (AuthCallback handles those)
      if (currentView === 'callback') {
        console.log('Skipping - in callback view');
        return;
      }

      // Process SIGNED_IN and INITIAL_SESSION events (new login and existing session)
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // Skip if we just processed this user AND we're already authenticated
        // (allow reprocessing if not yet authenticated)
        if (lastProcessedUserId === session.user.id && isAuthenticated) {
          console.log('Skipping - already processed this user and authenticated');
          return;
        }
        setLastProcessedUserId(session.user.id);

        // Only process if email is confirmed (not from email link - those go through AuthCallback)
        if (session.user.email_confirmed_at && currentView !== 'converter' && currentView !== 'admin' && currentView !== 'callback') {
          console.log('User signed in with confirmed email');
          
          // Check approval status before allowing access
          let profile = null;
          let profileError = null;
          
          console.log(`📋 Fetching profile for user: ${session.user.id}`);
          const profileQuery = await supabase
            .from('user_profiles')
            .select('approval_status, is_admin')
            .eq('id', session.user.id)
            .single();
          
          profile = profileQuery.data;
          profileError = profileQuery.error;
          console.log(`📋 Profile query result:`, { data: profile, error: profileError });

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
              .select('approval_status, is_admin')
              .single();

            if (createError) {
              console.error('Error creating profile:', createError);
              await supabase.auth.signOut();
              lastProcessedUserId = null;
              return;
            }
            
            profile = newProfile;
          } else if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
            await supabase.auth.signOut();
            lastProcessedUserId = null;
            return;
          }

          if (!profile) {
            console.error('Profile not found after creation attempt');
            await supabase.auth.signOut();
            lastProcessedUserId = null;
            return;
          }

          // Only allow access if approved
          if (profile.approval_status !== 'approved') {
            console.log(`❌ User not approved: ${profile.approval_status}. Current profile state:`, { 
              id: profile?.id,
              email: session.user.email,
              approval_status: profile?.approval_status,
              is_admin: profile?.is_admin
            });
            // Don't show messages here - user should use AuthCallback or Login flow
            await supabase.auth.signOut();
            setLastProcessedUserId(null);
            return;
          }

          // User is approved and email is verified - allow access
          console.log(`✅ User approved and verified. Routing to: ${profile.is_admin ? 'admin' : 'converter'}`, { 
            email: session.user.email,
            approval_status: profile.approval_status,
            is_admin: profile.is_admin,
            profile_object: profile
          });
          console.log(`DEBUG: Setting isAdmin to ${profile.is_admin}`);
          setUserEmail(session.user.email || '');
          setAccessToken(session.access_token);
          setIsAuthenticated(true);
          setIsAdmin(profile.is_admin || false);
          setCurrentView(profile.is_admin ? 'admin' : 'converter');
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
        <AuthCallback />
      )}

      <Toaster />
    </ThemeProvider>
  );
}

export default App;