import React from 'react';
import LoginModule from '@/components/LoginModule';

interface LoginPageProps {
  onLogin: (user: { username: string; role: 'ADMIN' | 'CASHIER' }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return <LoginModule onLogin={onLogin} />;
};

export default LoginPage;
