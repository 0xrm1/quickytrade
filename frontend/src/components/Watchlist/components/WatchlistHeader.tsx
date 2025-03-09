import React from 'react';
import { WatchlistHeaderProps } from '../types';
import * as S from '../styles';

/**
 * Watchlist başlık bileşeni
 */
const WatchlistHeader: React.FC<WatchlistHeaderProps> = ({
  showAddForm,
  setShowAddForm,
  openSettingsModal,
  activeTab,
  handleTabChange
}) => {
  return (
    <S.WatchlistHeader>
      <S.HeaderLeft>
        <S.Title>Watchlist</S.Title>
        <S.InlineTabs>
          <S.InlineTab isActive={activeTab === 1} onClick={() => handleTabChange(1)}>List 1</S.InlineTab>
          <S.InlineTab isActive={activeTab === 2} onClick={() => handleTabChange(2)}>List 2</S.InlineTab>
          <S.InlineTab isActive={activeTab === 3} onClick={() => handleTabChange(3)}>List 3</S.InlineTab>
        </S.InlineTabs>
      </S.HeaderLeft>
      <div style={{ display: 'flex', gap: '8px' }}>
        <S.SettingsButton onClick={openSettingsModal}>
          ⚙
        </S.SettingsButton>
        <S.AddButton onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '×' : '+'}
        </S.AddButton>
      </div>
    </S.WatchlistHeader>
  );
};

export default WatchlistHeader; 