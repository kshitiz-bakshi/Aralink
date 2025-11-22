import { useState } from 'react';
import LoginScreen from './login';
import RegisterScreen from './register';

type AuthMode = 'login' | 'register';

export default function AuthIndexScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleSwitchToRegister = () => {
    setAuthMode('register');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  if (authMode === 'register') {
    return <RegisterScreen onSwitchToLogin={handleSwitchToLogin} />;
  }

  return <LoginScreen onSwitchToRegister={handleSwitchToRegister} />;
}
