import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="api-key-manager">
      <h2>Binance API Keys</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="binanceApiKey">API Key</label>
          <input
            type="text"
            id="binanceApiKey"
            value={binanceApiKey}
            onChange={(e) => setBinanceApiKey(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="binanceSecretKey">Secret Key</label>
          <input
            type="password"
            id="binanceSecretKey"
            value={binanceSecretKey}
            onChange={(e) => setBinanceSecretKey(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : hasKeys ? 'Update Keys' : 'Save Keys'}
        </button>
      </form>
      
      <div className="api-key-info">
        <p>
          Your API keys are encrypted and stored securely. They are only used to interact with the Binance API on your behalf.
        </p>
        <p>
          <strong>Note:</strong> For security reasons, we recommend creating API keys with read-only permissions if you don't need trading functionality.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyManager; 