import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as S from '../styles/PageStyles';
import styled from 'styled-components';

// Özel stiller
const PasswordHint = styled.small`
  display: block;
  color: #8f9bba;
  font-size: 12px;
  margin-top: 6px;
  line-height: 1.4;
  opacity: 0.8;
`;

/**
 * Registration form component
 */
const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    // Validate form
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return;
    }
    
    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Register user
      await register(email, password);
      
      // Redirect to profile page
      navigate('/profile');
    } catch (err: any) {
      // Handle error
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Registration failed');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <S.FormContainer>
      <S.FormTitle>Register</S.FormTitle>
      
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
            minLength={8}
          />
          <PasswordHint>Password must be at least 8 characters long</PasswordHint>
        </S.FormGroup>
        
        <S.FormGroup>
          <S.FormLabel htmlFor="confirmPassword">Confirm Password</S.FormLabel>
          <S.FormInput
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </S.FormGroup>
        
        <S.FormButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </S.FormButton>
      </form>
    </S.FormContainer>
  );
};

export default RegisterForm; 