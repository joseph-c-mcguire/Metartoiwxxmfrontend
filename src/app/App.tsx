import { useState } from 'react';
import { FileConverter } from "./components/FileConverter";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { EmailVerification } from "./components/auth/EmailVerification";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";

type AuthView = 'login' | 'register' | 'verify' | 'converter';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');

  const handleLogin = (email: string, needsVerification: boolean, token?: string) => {
    setUserEmail(email);
    if (needsVerification) {
      setCurrentView('verify');
    } else {
      setIsAuthenticated(true);
      setAccessToken(token || '');
      setCurrentView('converter');
    }
  };

  const handleRegister = (email: string) => {
    setUserEmail(email);
    setCurrentView('verify');
  };

  const handleVerified = (token?: string) => {
    setIsAuthenticated(true);
    setAccessToken(token || '');
    setCurrentView('converter');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setAccessToken('');
    setCurrentView('login');
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
        />
      )}

      <Toaster />
    </ThemeProvider>
  );
}

export default App;