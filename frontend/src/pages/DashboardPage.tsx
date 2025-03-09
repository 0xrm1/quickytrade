import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// These components will be implemented later
const Watchlist = () => <div>Watchlist Component</div>;
const Positions = () => <div>Positions Component</div>;
const Terminal = () => <div>Terminal Component</div>;
const News = () => <div>News Component</div>;
const SolanaDex = () => <div>SolanaDex Component</div>;
const QuickButtonsBar = () => <div>QuickButtonsBar Component</div>;

// This function will be implemented in the API service
const createWebSocketConnection = () => {
  // Placeholder for WebSocket connection
  return new WebSocket('wss://stream.binance.com:9443/ws');
};

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #080f1a;
  color: white;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #1f2937;
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 24px;
  color: #4f46e5;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoutButton = styled.button`
  background-color: transparent;
  color: #4f46e5;
  border: 1px solid #4f46e5;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #4f46e5;
    color: white;
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
  grid-template-rows: minmax(0, auto) minmax(0, auto) 1fr;
  gap: 16px;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 160px); /* Reserve space for Header, QuickButtonsBar and Footer */
`;

const WatchlistContainer = styled.div`
  grid-column: 1;
  grid-row: 1;
  height: 320px;
  background-color: #111827;
  border-radius: 8px;
  padding: 16px;
`;

const TerminalContainer = styled.div`
  grid-column: 2;
  grid-row: 1;
  height: 320px;
  background-color: #111827;
  border-radius: 8px;
  padding: 16px;
`;

const PositionsContainer = styled.div`
  grid-column: 1 / span 2;
  grid-row: 2;
  height: 320px;
  background-color: #111827;
  border-radius: 8px;
  padding: 16px;
`;

const NewsContainer = styled.div`
  grid-column: 3;
  grid-row: 1 / span 3;
  height: 100%;
  background-color: #111827;
  border-radius: 8px;
  padding: 16px;
`;

const SolanaDexContainer = styled.div`
  grid-column: 1 / span 2;
  grid-row: 3;
  height: 100%;
  background-color: #111827;
  border-radius: 8px;
  padding: 16px;
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
  
  return (
    <DashboardContainer>
      <Header>
        <Logo>OrionTrade Platform</Logo>
        <UserInfo>
          <span>{user?.email}</span>
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
          
          <SolanaDexContainer>
            <SolanaDex />
          </SolanaDexContainer>
        </MainContent>
        
        <Footer>
          © {new Date().getFullYear()} OrionTrade Platform | All rights reserved
        </Footer>
      </ContentContainer>
    </DashboardContainer>
  );
};

export default DashboardPage; 