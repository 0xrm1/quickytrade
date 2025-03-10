import styled, { keyframes } from 'styled-components';

// Ripple animasyonu için keyframes tanımlaması
export const ripple = keyframes`
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  20% {
    transform: scale(25, 25);
    opacity: 0.3;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
`;

// Ana container
export const QuickButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #1b2839;
  padding: 0px 16px 2px 21px;
  border-radius: 8px;
  border: 1px solid #2c3142;
  overflow-x: auto;
  white-space: nowrap;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(215, 251, 115, 0.1);
  position: relative;
  margin-bottom: 12px;
  
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

// Başlık
export const Title = styled.h3`
  margin: 0;
  padding: 4px 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  background-color: transparent;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-right: 12px;
  white-space: nowrap;
`;

// Buton ekleme butonu
export const AddButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid #d7fb73;
  background-color: transparent;
  color: #ffffff;
  font-weight: 600;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 16px;
  position: relative;
  overflow: hidden;
  
  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(108, 141, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }
  
  &:focus:not(:active)::after {
    animation: ${ripple} 1s ease-out;
  }
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// Butonlar wrapper
export const ButtonsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 20px;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #2c3142;
    border-radius: 4px;
  }
`;

// Buton wrapper
export const ButtonWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 8px;
  margin-bottom: 10px;
  padding-top: 26px;
`;

// Hızlı buton
export const QuickButton = styled.button<{ side: 'long' | 'short' }>`
  width: 50px;
  height: 50px;
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ffffff;
  font-weight: 400;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background-color: transparent;
  color: ${props => props.side === 'long' ? '#22c55e' : '#ef4444'};
  
  &:hover {
    background-color: ${props => props.side === 'long' 
      ? 'rgba(34, 197, 94, 0.1)' 
      : 'rgba(239, 68, 68, 0.1)'};
    border-color: ${props => props.side === 'long' ? '#22c55e' : '#ef4444'};
  }
  
  &:active {
    transform: scale(0.97);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Buton içeriği
export const ButtonContent = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.2;
`;

// Silme butonu
export const RemoveButton = styled.button`
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  background-color: transparent;
  color: #8f9bba;
  border: 1px solid #2c3142;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  
  &:hover {
    color: #d7fb73;
    border-color: #d7fb73;
    background-color: transparent;
  }
`;

// Modal overlay
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 15, 30, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

// Modal içeriği
export const ModalContent = styled.div`
  background-color: #1b2839;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #2c3142;
`;

// Modal başlığı
export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

// Modal başlık metni
export const ModalTitle = styled.h3`
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
`;

// Modal kapatma butonu
export const CloseModalButton = styled.button`
  appearance: none;
  -webkit-appearance: none;
  background-color: transparent;
  border: 1px solid #2c3142;
  color: #8f9bba;
  cursor: pointer;
  transition: all 0.2s;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 0;
  margin: 0;
  outline: none;
  box-shadow: none;
  
  &:hover {
    color: #d7fb73;
    border-color: #d7fb73;
    background-color: transparent;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:focus {
    outline: none;
    background-color: transparent;
  }
`;

// Form grubu
export const FormGroup = styled.div`
  margin-bottom: 16px;
`;

// Form etiketi
export const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #8f9bba;
  font-size: 14px;
`;

// Form input
export const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #2c3142;
  background-color: #1b2839;
  color: white;
  font-size: 14px;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #d7fb73;
  }
  
  &::placeholder {
    color: #4a5568;
  }
  
  /* Chrome, Safari, Edge, Opera için ok işaretlerini kaldır */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  /* Firefox için ok işaretlerini kaldır */
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

// Radio grup
export const RadioGroup = styled.div`
  display: flex;
  gap: 16px;
`;

// Radio label
export const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #8f9bba;
`;

// Radio input
export const RadioInput = styled.input`
  cursor: pointer;
  accent-color: #d7fb73;
`;

// Kaydetme butonu
export const SaveButton = styled.button`
  width: 100%;
  padding: 10px 16px;
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.98);
  }
`; 