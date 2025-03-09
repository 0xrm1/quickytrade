import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import * as S from '../styles/PageStyles';
import styled from 'styled-components';

// Özel stiller
const AuthContainer = styled.div`
  max-width: 500px;
  margin: 40px auto;
  background-color: #1b2839;
  border-radius: 8px;
  border: 1px solid #2c3142;
  padding: 24px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(215, 251, 115, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;
    border: 1px solid rgba(215, 251, 115, 0.1);
    pointer-events: none;
  }
`;

const AuthHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(215, 251, 115, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Logo = styled.div`
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  overflow: visible;
  margin-bottom: 16px;
`;

const LogoImage = styled.img`
  height: 80px;
  width: auto;
`;

const AuthSubtitle = styled.p`
  font-size: 16px;
  color: #8f9bba;
  line-height: 1.5;
`;

/**
 * Register page component
 */
const RegisterPage: React.FC = () => {
  return (
    <S.PageContainer>
      <AuthContainer>
        <AuthHeader>
          <Logo>
            <LogoImage src="/Dashlogo.png" alt="QuickyTrade Logo" />
          </Logo>
          <AuthSubtitle>Create your account to get started</AuthSubtitle>
        </AuthHeader>
        
        <RegisterForm />
        
        <S.FormFooter>
          Already have an account? <Link to="/login">Login</Link>
        </S.FormFooter>
      </AuthContainer>
    </S.PageContainer>
  );
};

export default RegisterPage; 