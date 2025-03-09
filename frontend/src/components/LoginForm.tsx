import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as S from '../styles/PageStyles';

/**
 * Login form component
 */
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    // Validate form
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Login user
      await login(email, password);
      
      // Redirect to profile page
      navigate('/profile');
    } catch (err: any) {
      // Handle error
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Login failed');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <S.FormContainer>
      <S.FormTitle>Login</S.FormTitle>
      
      {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
      
      <form onSubmit={handleSubmit}>
        <S.FormGroup>
          <S.FormLabel htmlFor="email">Email</S.FormLabel>
          <S.FormInput
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </S.FormGroup>
        
        <S.FormGroup>
          <S.FormLabel htmlFor="password">Password</S.FormLabel>
          <S.FormInput
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </S.FormGroup>
        
        <S.FormButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </S.FormButton>
      </form>
    </S.FormContainer>
  );
};

export default LoginForm; 