import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import News from '../components/News';
import Watchlist from '../components/Watchlist';
import Terminal from '../components/Terminal';
import QuickButtonsBar from '../components/QuickButtonsBar';
import Positions from '../components/Positions';
import { createWebSocketConnection } from '../services/api';

// These components will be implemented later
// const Positions = () => <div>Positions Component</div>;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #1b2839;
  color: #fff;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background-color: #1b2839;
  border-bottom: 1px solid #2c3142;
  height: 70px;
  box-sizing: border-box;
`;

const Logo = styled.div`
  margin: 0;
  display: flex;
  align-items: center;
  height: 100%;
  overflow: visible;
`;

const LogoImage = styled.img`
  height: 150px;
  width: auto;
  margin-top: -3px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #1b2839;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #2c3142;
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

const UserEmail = styled.span`
  color: #ffffff;
  font-size: 14px;
  margin-right: 4px;
  font-weight: 500;
`;

const ProfileButton = styled.button`
  margin-left: 12px;
  padding: 6px 12px;
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 400;

  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const LogoutButton = styled.button`
  margin-left: 12px;
  padding: 6px 12px;
  background-color: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 400;

  &:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px;
  overflow: hidden;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 350px) minmax(0, 350px) 1fr;
  grid-template-rows: minmax(0, auto) 1fr;
  gap: 16px;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 160px); /* Reserve space for Header, QuickButtonsBar and Footer */
`;

const WatchlistContainer = styled.div`
  grid-column: 1;
  grid-row: 1;
  height: 320px;
`;

const TerminalContainer = styled.div`
  grid-column: 2;
  grid-row: 1;
  height: 320px;
`;

const PositionsContainer = styled.div`
  grid-column: 1 / span 2;
  grid-row: 2;
  height: 100%;
  min-height: 0; /* Bu önemli, overflow'un çalışması için */
  display: flex;
  flex-direction: column;
`;

const NewsContainer = styled.div`
  grid-column: 3;
  grid-row: 1 / span 2;
  height: 100%;
`;

const Footer = styled.footer`
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #4b5563;
`;

const DashboardPage: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Create WebSocket connection
  useEffect(() => {
    const websocket = createWebSocketConnection();
    setWs(websocket);
    
    // Close connection when component unmounts
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle profile navigation
  const handleProfileClick = () => {
    navigate('/profile');
  };
  
  return (
    <DashboardContainer>
      <Header>
        <Logo>
          <LogoImage src="/Dashlogo.png" alt="QuickyTrade Logo" />
        </Logo>
        <UserInfo>
          <UserEmail>{user?.email}</UserEmail>
          <ProfileButton onClick={handleProfileClick}>Profile</ProfileButton>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </UserInfo>
      </Header>
      
      <QuickButtonsBar />
      
      <ContentContainer>
        <MainContent>
          <WatchlistContainer>
            <Watchlist />
          </WatchlistContainer>
          
          <TerminalContainer>
            <Terminal />
          </TerminalContainer>
          
          <PositionsContainer>
            <Positions />
          </PositionsContainer>
          
          <NewsContainer>
            <News />
          </NewsContainer>
        </MainContent>
        
        <Footer>
          © {new Date().getFullYear()} QuickyTrade Platform | All rights reserved
        </Footer>
      </ContentContainer>
    </DashboardContainer>
  );
};

export default DashboardPage;