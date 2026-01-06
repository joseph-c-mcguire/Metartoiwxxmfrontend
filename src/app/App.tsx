import { useState } from 'react';
import { FileConverter } from "./components/FileConverter";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { EmailVerification } from "./components/auth/EmailVerification";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";

type AuthView = 'login' | 'register' | 'verify' | 'converter' | 'admin';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleLogout = () => {
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

      <Toaster />
    </ThemeProvider>
  );
}

export default App;