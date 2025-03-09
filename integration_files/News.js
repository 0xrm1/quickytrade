import React from 'react';
import styled from 'styled-components';

const NewsContainer = styled.div`
  background-color: #111827;
  border-radius: 8px;
  border: 1px solid #1f2937;
  padding: 12px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const NewsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.div`
  background-color: rgba(79, 70, 229, 0.8);
  color: white;
  padding: 4px 16px;
  border-radius: 6px;
  font-weight: 600;
`;

const PlaceholderContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #9ca3af;
`;

const ComingSoonText = styled.div`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const DescriptionText = styled.div`
  font-size: 14px;
  max-width: 80%;
`;

const News = () => {
  return (
    <NewsContainer>
      <NewsHeader>
        <Title>News & Notifications</Title>
      </NewsHeader>
      
      <PlaceholderContent>
        <ComingSoonText>Coming soon...</ComingSoonText>
        <DescriptionText>
          This module is currently under development. Crypto news, Twitter and Telegram notifications will be displayed here.
        </DescriptionText>
      </PlaceholderContent>
    </NewsContainer>
  );
};

export default News; 