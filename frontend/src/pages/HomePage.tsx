import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Home page component
 */
const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      <div className="container">
        <div className="hero-section">
          <h1>Welcome to OrionTrade Platform</h1>
          <p>Your advanced trading platform for cryptocurrency markets</p>
          
          <div className="cta-buttons">
            {isAuthenticated ? (
              <Link to="/profile" className="cta-button primary">
                Go to Profile
              </Link>
            ) : (
              <>
                <Link to="/login" className="cta-button primary">
                  Login
                </Link>
                <Link to="/register" className="cta-button secondary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
        
        <div className="features-section">
          <h2>Platform Features</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <h3>Secure Authentication</h3>
              <p>
                Your account is protected with industry-standard security measures
                including password hashing and JWT authentication.
              </p>
            </div>
            
            <div className="feature-card">
              <h3>API Key Management</h3>
              <p>
                Securely store your Binance API keys with AES encryption for
                seamless trading integration.
              </p>
            </div>
            
            <div className="feature-card">
              <h3>Trading Tools</h3>
              <p>
                Access advanced trading tools and analytics to make informed
                decisions in the cryptocurrency market.
              </p>
            </div>
            
            <div className="feature-card">
              <h3>User-Friendly Interface</h3>
              <p>
                Enjoy a clean and intuitive interface designed for both beginners
                and experienced traders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 