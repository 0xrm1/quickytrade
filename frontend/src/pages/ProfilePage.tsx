import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ApiKeyManager from '../components/ApiKeyManager';
import apiService from '../services/api';
import * as S from '../styles/PageStyles';
import styled from 'styled-components';

// Özel stiller
const ProfileContent = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 2fr;
  }
`;

const ProfileInfo = styled(S.Card)`
  height: fit-content;
  display: flex;
  flex-direction: column;
`;

const ProfileInfoItem = styled.div`
  margin-bottom: 12px;
  color: #8f9bba;
  font-size: 14px;
  line-height: 1.5;
  
  strong {
    color: #ffffff;
    font-weight: 500;
    margin-right: 8px;
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 40px;
  color: #8f9bba;
  font-size: 16px;
`;

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
    return (
      <S.PageContainer>
        <Loading>Loading profile...</Loading>
      </S.PageContainer>
    );
  }

  return (
    <S.PageContainer>
      <S.ContentContainer>
        <S.PageHeader>
          <S.PageTitle>Your Profile</S.PageTitle>
          <S.ButtonContainer>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <S.SecondaryButton>Go to Dashboard</S.SecondaryButton>
            </Link>
            <S.DangerButton onClick={handleLogout}>Logout</S.DangerButton>
          </S.ButtonContainer>
        </S.PageHeader>

        {error && <S.ErrorMessage>{error}</S.ErrorMessage>}

        <ProfileContent>
          <ProfileInfo>
            <S.CardTitle>Account Information</S.CardTitle>
            <S.CardContent>
              <ProfileInfoItem>
                <strong>Email:</strong> {user?.email}
              </ProfileInfoItem>
              <ProfileInfoItem>
                <strong>Account Created:</strong>{' '}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'}
              </ProfileInfoItem>
            </S.CardContent>
          </ProfileInfo>

          <S.Card>
            <ApiKeyManager />
          </S.Card>
        </ProfileContent>
      </S.ContentContainer>
    </S.PageContainer>
  );
};

export default ProfilePage; 