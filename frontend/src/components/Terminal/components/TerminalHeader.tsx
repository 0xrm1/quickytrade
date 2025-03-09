import React from 'react';
import { TerminalHeaderProps } from '../types';
import InfoTooltip from './InfoTooltip';
import * as S from '../styles';

/**
 * Terminal başlığı bileşeni
 */
const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  showInfo,
  loading,
  toggleInfo,
  clearHistory,
  infoButtonRef
}) => {
  return (
    <S.TerminalHeader>
      <S.TitleContainer>
        <S.Title>Terminal</S.Title>
      </S.TitleContainer>
      <S.ButtonsContainer>
        <div style={{ position: 'relative' }} ref={infoButtonRef}>
          <S.InfoButton onClick={toggleInfo}>
            i
          </S.InfoButton>
          <InfoTooltip show={showInfo} />
        </div>
        <S.ClearButton onClick={clearHistory}>Clear</S.ClearButton>
      </S.ButtonsContainer>
    </S.TerminalHeader>
  );
};

export default TerminalHeader; 