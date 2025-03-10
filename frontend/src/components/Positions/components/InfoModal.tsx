import React from 'react';
import styled from 'styled-components';
import { InfoModalProps } from '../types';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #1e2130;
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
`;

const ModalHeader = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  border-bottom: 1px solid #2a2e3e;
  padding-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseModalButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #fff;
  
  &:active {
    transform: scale(0.97);
  }
`;

const InfoModal: React.FC<InfoModalProps> = ({ show, title, children, onClose }) => {
  if (!show) return null;
  
  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          {title}
          <CloseModalButton onClick={onClose}>&times;</CloseModalButton>
        </ModalHeader>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
};

export default InfoModal; 