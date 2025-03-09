import React from 'react';
import { WatchlistTabsProps } from '../types';
import * as S from '../styles';

/**
 * Watchlist tab'lar bileşeni
 */
const WatchlistTabs: React.FC<WatchlistTabsProps> = ({
  activeTab,
  handleTabChange
}) => {
  return (
    <S.TabsContainer>
      <S.Tab isActive={activeTab === 1} onClick={() => handleTabChange(1)}>List 1</S.Tab>
      <S.Tab isActive={activeTab === 2} onClick={() => handleTabChange(2)}>List 2</S.Tab>
      <S.Tab isActive={activeTab === 3} onClick={() => handleTabChange(3)}>List 3</S.Tab>
    </S.TabsContainer>
  );
};

export default WatchlistTabs; 