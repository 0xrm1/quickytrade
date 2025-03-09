import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ApiKeyManager from '../components/ApiKeyManager';
import apiService from '../services/api';

/**
 * Profile page component
 */
const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        await apiService.user.getProfile();
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>Your Profile</h1>
          <div className="profile-actions">
            <Link to="/dashboard" className="dashboard-button">
              Go to Dashboard
            </Link>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="profile-content">
          <div className="profile-info">
            <h2>Account Information</h2>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Account Created:</strong>{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>

          <div className="api-keys-section">
            <ApiKeyManager />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 