import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as S from '../styles/PageStyles';
import styled from 'styled-components';

// Özel stiller
const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1px solid rgba(215, 251, 115, 0.2);
`;

const Logo = styled.div`
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  overflow: visible;
  margin-bottom: 24px;
`;

const LogoImage = styled.img`
  height: 120px;
  width: auto;
`;

const BetaTag = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #d7fb73;
  margin-left: -5px;
  margin-top: 10px;
`;

const HeroTitle = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
`;

const HeroSubtitle = styled.p`
  font-size: 18px;
  color: #8f9bba;
  margin-bottom: 32px;
  max-width: 600px;
  line-height: 1.5;
`;

const CTAButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
`;

const CTALink = styled(Link)`
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const DashboardButton = styled(S.PrimaryButton)`
  background-color: #d7fb73;
  color: #1b2839;
  
  &:hover {
    background-color: #c8ec64;
    border-color: #c8ec64;
  }
`;

const FeaturesSection = styled.div`
  padding: 40px 0;
`;

const FeaturesSectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 32px;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(215, 251, 115, 0.2);
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
`;

const Footer = styled.footer`
  margin-top: 40px;
  padding: 20px 0;
  border-top: 1px solid rgba(215, 251, 115, 0.2);
  text-align: center;
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
`;

const SocialLink = styled.a`
  color: #8f9bba;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: color 0.2s;
  
  &:hover {
    color: #d7fb73;
  }
`;

const SocialIcon = styled.span`
  margin-right: 8px;
  font-size: 18px;
`;

const Copyright = styled.p`
  color: #4b5563;
  font-size: 14px;
  margin-top: 16px;
`;

/**
 * Home page component
 */
const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  
  // Handle email copy
  const handleEmailCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('support@quickytrade.com');
    setCopied(true);
    
    // Reset copied state after 1 seconds
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <S.PageContainer>
      <S.ContentContainer>
        <HeroSection>
          <Logo>
            <LogoImage src="/Dashlogo.png" alt="QuickyTrade Logo" />
            <BetaTag>(beta)</BetaTag>
          </Logo>
          <HeroTitle>Welcome to QuickyTrade Platform</HeroTitle>
          <HeroSubtitle>Trade faster with our advanced trading platform</HeroSubtitle>
          
          <CTAButtons>
            {isAuthenticated ? (
              <>
                <CTALink to="/dashboard">
                  <DashboardButton>Go to Dashboard</DashboardButton>
                </CTALink>
                <CTALink to="/profile">
                  <S.SecondaryButton>View Profile</S.SecondaryButton>
                </CTALink>
              </>
            ) : (
              <>
                <CTALink to="/login">
                  <S.PrimaryButton>Login</S.PrimaryButton>
                </CTALink>
                <CTALink to="/register">
                  <S.SecondaryButton>Register</S.SecondaryButton>
                </CTALink>
              </>
            )}
          </CTAButtons>
        </HeroSection>
        
        <FeaturesSection>
          <FeaturesSectionTitle>Platform Features</FeaturesSectionTitle>
          
          <S.Grid>
            <S.Card>
              <S.CardTitle>Secure Authentication</S.CardTitle>
              <S.CardContent>
                <p>
                  Your account is protected with industry-standard security measures
                  including password hashing and JWT authentication.
                </p>
              </S.CardContent>
            </S.Card>
            
            <S.Card>
              <S.CardTitle>API Key Management</S.CardTitle>
              <S.CardContent>
                <p>
                  Securely store your Binance API keys with AES encryption for
                  seamless trading integration.
                </p>
              </S.CardContent>
            </S.Card>
            
            <S.Card>
              <S.CardTitle>One-click Positions</S.CardTitle>
              <S.CardContent>
                <p>
                Create custom shortcuts and open/close positions with one click.
                </p>
              </S.CardContent>
            </S.Card>
            
            <S.Card>
              <S.CardTitle>Dex and Cex Together</S.CardTitle>
              <S.CardContent>
                <p>
                Use both your cex and dex account on the same page.
                </p>
              </S.CardContent>
            </S.Card>
          </S.Grid>
        </FeaturesSection>
        
        <Footer>
          <SocialLinks>
            <SocialLink href="https://x.com/quicky_trade" target="_blank" rel="noopener noreferrer">
              <SocialIcon>𝕏</SocialIcon>
              @quicky_trade
            </SocialLink>
            <SocialLink href="#" onClick={handleEmailCopy}>
              <SocialIcon>✉️</SocialIcon>
              {copied ? "Copied!" : "support@quickytrade.com"}
            </SocialLink>
          </SocialLinks>
          <Copyright>© {new Date().getFullYear()} QuickyTrade. All rights reserved.</Copyright>
        </Footer>
      </S.ContentContainer>
    </S.PageContainer>
  );
};

export default HomePage; 