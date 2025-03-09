import React from 'react';
import { SettingsModalProps } from '../types';
import * as S from '../styles';

/**
 * Ayarlar modalı bileşeni
 */
const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettingsModal,
  formSettings,
  handleSettingsChange,
  saveSettings,
  closeSettingsModal
}) => {
  if (!showSettingsModal) return null;
  
  return (
    <S.ModalOverlay>
      <S.ModalContent>
        <S.ModalHeader>
          <S.ModalTitle>Button Settings</S.ModalTitle>
          <S.CloseModalButton onClick={closeSettingsModal}>×</S.CloseModalButton>
        </S.ModalHeader>
        
        <S.FormGroupContainer>
          <S.FormGroup>
            <S.FormLabel>LONG</S.FormLabel>
            {formSettings.longAmounts.map((amount, index) => (
              <S.FormInput
                key={`long-${index}`}
                type="text"
                placeholder="USDT"
                value={amount}
                onChange={(e) => handleSettingsChange('long', index, 'amount', e.target.value)}
              />
            ))}
          </S.FormGroup>
          
          <S.FormGroup>
            <S.FormLabel>SHORT</S.FormLabel>
            {formSettings.shortAmounts.map((amount, index) => (
              <S.FormInput
                key={`short-${index}`}
                type="text"
                placeholder="USDT"
                value={amount}
                onChange={(e) => handleSettingsChange('short', index, 'amount', e.target.value)}
              />
            ))}
          </S.FormGroup>
        </S.FormGroupContainer>
        
        <S.SaveButton onClick={saveSettings}>Save</S.SaveButton>
      </S.ModalContent>
    </S.ModalOverlay>
  );
};

export default SettingsModal; 