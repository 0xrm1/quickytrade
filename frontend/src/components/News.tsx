import React from 'react';
import styled from 'styled-components';

const NewsContainer = styled.div`
  background-color: #1b2839;
  border-radius: 8px;
  border: 1px solid #2c3142;
  padding: 12px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
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

const NewsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.div`
  margin: 0;
  padding: 6px 12px;
  color: #d7fb73;
  font-size: 14px;
  font-weight: 500;
  background-color: transparent;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
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
  color: #d7fb73;
`;

const DescriptionText = styled.div`
  font-size: 14px;
  max-width: 80%;
`;

/**
 * News component for displaying crypto news and notifications
 */
const News: React.FC = () => {
  return (
    <NewsContainer>
      <NewsHeader>
        <Title>Dex Trading</Title>
      </NewsHeader>
      
      <PlaceholderContent>
        <ComingSoonText>Multiple Dex Trading</ComingSoonText>
        <DescriptionText>
        Coming Soon... 
        </DescriptionText>
      </PlaceholderContent>
    </NewsContainer>
  );
};

export default News; 