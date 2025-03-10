import React from 'react';
import { AddButtonModalProps } from '../types';
import * as S from '../styles';

/**
 * Buton ekleme modalı bileşeni
 */
const AddButtonModal: React.FC<AddButtonModalProps> = ({
  show,
  newButton,
  onClose,
  onInputChange,
  onAdd
}) => {
  if (!show) return null;
  
  return (
    <S.ModalOverlay>
      <S.ModalContent>
        <S.ModalHeader>
          <S.ModalTitle>Add Quicky Positions</S.ModalTitle>
          <S.CloseModalButton onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </S.CloseModalButton>
        </S.ModalHeader>
        
        <S.FormGroup>
          <S.FormLabel>Symbol</S.FormLabel>
          <S.FormInput
            type="text"
            name="symbol"
            placeholder="E.g. BTC or BTCUSDT"
            value={newButton.symbol}
            onChange={onInputChange}
          />
        </S.FormGroup>
        
        <S.FormGroup>
          <S.FormLabel>Amount (USDT)</S.FormLabel>
          <S.FormInput
            type="number"
            name="amount"
            placeholder="E.g. 1000"
            value={newButton.amount}
            onChange={onInputChange}
          />
        </S.FormGroup>
        
        <S.FormGroup>
          <S.FormLabel>Side</S.FormLabel>
          <S.RadioGroup>
            <S.RadioLabel>
              <S.RadioInput
                type="radio"
                name="side"
                value="long"
                checked={newButton.side === 'long'}
                onChange={onInputChange}
              />
              Long
            </S.RadioLabel>
            <S.RadioLabel>
              <S.RadioInput
                type="radio"
                name="side"
                value="short"
                checked={newButton.side === 'short'}
                onChange={onInputChange}
              />
              Short
            </S.RadioLabel>
          </S.RadioGroup>
        </S.FormGroup>
        
        <S.SaveButton onClick={onAdd}>Add</S.SaveButton>
      </S.ModalContent>
    </S.ModalOverlay>
  );
};

export default AddButtonModal; 