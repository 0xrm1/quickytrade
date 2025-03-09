import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

/**
 * Login page component
 */
const LoginPage: React.FC = () => {
  return (
    <div className="login-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-header">
            <h1>OrionTrade Platform</h1>
            <p>Login to your account</p>
          </div>
          
          <LoginForm />
          
          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 