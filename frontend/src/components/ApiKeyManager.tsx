import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import * as S from '../styles/PageStyles';
import styled from 'styled-components';

// Özel stiller
const ApiKeyContainer = styled.div`
  margin-top: 0;
`;

const ApiKeyInfo = styled.div`
  margin-top: 16px;
  color: #8f9bba;
  font-size: 14px;
  line-height: 1.5;
  
  p {
    margin-bottom: 12px;
  }
  
  strong {
    color: #ffffff;
    font-weight: 500;
  }
`;

// API Guide styles
const ApiGuideContainer = styled.div`
  margin-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
`;

const ApiGuideTitle = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 16px;
`;

const ApiGuideStep = styled.div`
  margin-bottom: 24px;
`;

const ApiGuideStepTitle = styled.h4`
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  
  span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background-color: #d7fb73;
    color: #000000;
    border-radius: 50%;
    margin-right: 12px;
    font-size: 14px;
  }
`;

const ApiGuideStepDescription = styled.p`
  color: #8f9bba;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
`;

const ApiGuideImage = styled.img`
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 12px;
`;

// TextButton component
const TextButton = styled.button`
  background: none;
  border: none;
  color: #d7fb73;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  
  &:hover {
    color: #ffffff;
  }
`;

// Contact section styles
const ContactSection = styled.div`
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const ContactText = styled.p`
  color: #8f9bba;
  font-size: 14px;
  margin-bottom: 12px;
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
  font-size: 14px;
  
  &:hover {
    color: #d7fb73;
  }
`;

const SocialIcon = styled.span`
  margin-right: 8px;
  font-size: 16px;
`;

/**
 * API key management component
 */
const ApiKeyManager: React.FC = () => {
  const [binanceApiKey, setBinanceApiKey] = useState('');
  const [binanceSecretKey, setBinanceSecretKey] = useState('');
  const [hasKeys, setHasKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.user.getApiKeys();
        const { binanceApiKey, binanceSecretKey } = response.data.data;
        
        if (binanceApiKey && binanceSecretKey) {
          setBinanceApiKey(binanceApiKey);
          setBinanceSecretKey(binanceSecretKey);
          setHasKeys(true);
        }
      } catch (err) {
        console.error('Error fetching API keys:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!binanceApiKey || !binanceSecretKey) {
      setError('Both API key and Secret key are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update API keys
      await apiService.user.updateApiKeys(binanceApiKey, binanceSecretKey);
      
      setSuccess('API keys updated successfully');
      setHasKeys(true);
    } catch (err: any) {
      // Handle error
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Failed to update API keys');
      } else {
        setError('Failed to update API keys. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle email copy
  const handleEmailCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('support@quickytrade.com');
    setCopied(true);
    
    // Reset copied state after 1 second
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ApiKeyContainer>
      <S.CardTitle>Binance API Keys</S.CardTitle>
      
      {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
      {success && <S.SuccessMessage>{success}</S.SuccessMessage>}
      
      <form onSubmit={handleSubmit}>
        <S.FormGroup>
          <S.FormLabel htmlFor="binanceApiKey">API Key</S.FormLabel>
          <S.FormInput
            type="text"
            id="binanceApiKey"
            value={binanceApiKey}
            onChange={(e) => setBinanceApiKey(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </S.FormGroup>
        
        <S.FormGroup>
          <S.FormLabel htmlFor="binanceSecretKey">Secret Key</S.FormLabel>
          <S.FormInput
            type="password"
            id="binanceSecretKey"
            value={binanceSecretKey}
            onChange={(e) => setBinanceSecretKey(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </S.FormGroup>
        
        <S.FormButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : hasKeys ? 'Update Keys' : 'Save Keys'}
        </S.FormButton>
      </form>
      
      <ApiKeyInfo>
        <p>
        Your security is our priority. We use AES encryption to securely store your Binance API keys, and we only use them for Futures trades you initiate. No other permissions (such as withdrawals) are granted, and you can revoke or modify your API access at any time from your Binance account.
        </p>
        <p>
          <TextButton onClick={() => setShowGuide(!showGuide)}>
            {showGuide ? 'Hide API Setup Guide' : 'Show API Setup Guide'}
          </TextButton>
        </p>
      </ApiKeyInfo>

      {showGuide && (
        <ApiGuideContainer>
          <ApiGuideTitle>How to Create Binance API Keys</ApiGuideTitle>
          
          <ApiGuideStep>
            <ApiGuideStepTitle><span>1</span>Go to Binance API Management</ApiGuideStepTitle>
            <ApiGuideStepDescription>
              Visit <a href="https://www.binance.com/en/my/settings/api-management" target="_blank" rel="noopener noreferrer">https://www.binance.com/en/my/settings/api-management</a> and click on "Create API".
            </ApiGuideStepDescription>
            <ApiGuideImage src="/api_guide_images/api1.png" alt="Create API button" />
          </ApiGuideStep>
          
          <ApiGuideStep>
            <ApiGuideStepTitle><span>2</span>Enter API Key Label</ApiGuideStepTitle>
            <ApiGuideStepDescription>
              Enter a name for your API key and click "Next" to proceed.
            </ApiGuideStepDescription>
            <ApiGuideImage src="/api_guide_images/api2.png" alt="Enter API Key Label" />
          </ApiGuideStep>
          
          <ApiGuideStep>
            <ApiGuideStepTitle><span>3</span>Choose API Key Type</ApiGuideStepTitle>
            <ApiGuideStepDescription>
              Select "System generated" option and click "Next".
            </ApiGuideStepDescription>
            <ApiGuideImage src="/api_guide_images/api3.png" alt="Choose API Key Type" />
          </ApiGuideStep>
          
          <ApiGuideStep>
            <ApiGuideStepTitle><span>4</span>Edit Restrictions</ApiGuideStepTitle>
            <ApiGuideStepDescription>
              Click on "Edit restrictions" button to configure API permissions.
            </ApiGuideStepDescription>
            <ApiGuideImage src="/api_guide_images/api4.png" alt="Edit Restrictions" />
          </ApiGuideStep>
          
          <ApiGuideStep>
            <ApiGuideStepTitle><span>5</span>Set IP Restrictions</ApiGuideStepTitle>
            <ApiGuideStepDescription>
              Select "Restrict access to trusted IPs only (Recommended)" and enter "35.157.117.28" in the field. Click "Confirm".
            </ApiGuideStepDescription>
            <ApiGuideImage src="/api_guide_images/api5.png" alt="Set IP Restrictions" />
          </ApiGuideStep>
          
          <ApiGuideStep>
            <ApiGuideStepTitle><span>6</span>Enable Futures Trading</ApiGuideStepTitle>
            <ApiGuideStepDescription>
              Check the "Enable Futures" option and click "Save".
            </ApiGuideStepDescription>
            <ApiGuideImage src="/api_guide_images/api6.png" alt="Enable Futures Trading" />
          </ApiGuideStep>
          
          <ApiGuideStep>
            <ApiGuideStepTitle><span>7</span>Save Your API Keys</ApiGuideStepTitle>
            <ApiGuideStepDescription>
              Congratulations! You can now copy your API Key and Secret Key and paste them into the fields above to start using Quicky's services.
            </ApiGuideStepDescription>
          </ApiGuideStep>
          
          <ContactSection>
            <ContactText>If you encounter any issues, please feel free to contact us:</ContactText>
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
          </ContactSection>
        </ApiGuideContainer>
      )}
    </ApiKeyContainer>
  );
};

export default ApiKeyManager; 