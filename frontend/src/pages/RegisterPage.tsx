import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';

/**
 * Register page component
 */
const RegisterPage: React.FC = () => {
  return (
    <div className="register-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-header">
            <h1>OrionTrade Platform</h1>
            <p>Create your account to get started</p>
          </div>
          
          <RegisterForm />
          
          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 