import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Watchlist from '../components/Watchlist';
import Positions from '../components/Positions';
import Terminal from '../components/Terminal';
import News from '../components/News';
import SolanaDex from '../components/SolanaDex';
import QuickButtonsBar from '../components/QuickButtonsBar';
import { createWebSocketConnection } from '../services/api';

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
  height: calc(100vh - 160px); /* Header, QuickButtonsBar ve Footer için yer ayır */
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
  height: 320px;
`;

const NewsContainer = styled.div`
  grid-column: 3;
  grid-row: 1 / span 3;
  height: 100%;
`;

const SolanaDexContainer = styled.div`
  grid-column: 1 / span 2;
  grid-row: 3;
  height: 100%;
`;

const Footer = styled.footer`
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #4b5563;
`;

const Dashboard = () => {
  const [ws, setWs] = useState(null);
  
  // WebSocket bağlantısı oluştur
  useEffect(() => {
    const websocket = createWebSocketConnection();
    setWs(websocket);
    
    // Component unmount olduğunda bağlantıyı kapat
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);
  
  return (
    <DashboardContainer>
      <Header>
        <Logo>X-PR Trading Platform</Logo>
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
          © 2023 X-PR Trading Platform | All rights reserved
        </Footer>
      </ContentContainer>
    </DashboardContainer>
  );
};

export default Dashboard; 