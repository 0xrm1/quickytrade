import styled, { keyframes } from 'styled-components';

/**
 * Watchlist bileşeni için styled components - Minimal tasarım
 */

// Ana container
export const WatchlistContainer = styled.div`
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

// Başlık kısmı
export const WatchlistHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const Title = styled.h2`
  margin: 0;
  padding: 6px 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  background-color: transparent;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
`;

export const InlineTabs = styled.div`
  display: flex;
  gap: 12px;
`;

export const InlineTab = styled.div<{ isActive: boolean }>`
  font-size: 13px;
  color: ${props => props.isActive ? '#ffffff' : '#8f9bba'};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.isActive ? '#d7fb73' : 'transparent'};
  padding-bottom: 2px;
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.isActive ? '#ffffff' : '#d7fb73'};
  }
`;

export const AddButton = styled.button`
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
    border-color: #d7fb73;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

export const SettingsButton = styled.button`
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// Sembol listesi
export const SymbolList = styled.div`
  overflow-y: auto;
  flex: 1;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1b2839;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d7fb73;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #c8ec64;
  }
  
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: #d7fb73 #1b2839;
`;

// Sembol öğesi
export const SymbolItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  border: 1px solid #2c3142;
  border-radius: 6px;
  background-color: #1b2839;
  transition: all 0.2s;
  
  &:hover {
    border-color: #d7fb73;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

export const SymbolHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SymbolInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 15px;
  flex: 1;
`;

export const RemoveButton = styled.div`
  width: 18px;
  height: 18px;
  background-color: transparent;
  border: 1px solid #2c3142;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 10px;
  color: #8f9bba;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #d7fb73;
    border-color: #d7fb73;
  }
`;

export const SymbolName = styled.div`
  font-weight: 600;
  font-family: monospace;
  color: #ffffff;
  font-size: 14px;
`;

export const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 8px;
`;

export const PriceChange = styled.div<{ isPositive: boolean }>`
  font-size: 11px;
  color: ${props => props.isPositive ? '#22c55e' : '#ef4444'};
`;

export const Price = styled.div`
  font-weight: 600;
  font-family: monospace;
  color: #8f9bba;
  font-size: 12px;
`;

// Butonlar
export const ButtonsContainer = styled.div`
  display: flex;
  gap: 4px;
`;

export const VerticalButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const LongButtonsGroup = styled.div`
  display: flex;
  gap: 4px;
`;

export const ShortButtonsGroup = styled.div`
  display: flex;
  gap: 4px;
`;

export const LongButton = styled.button`
  background-color: transparent;
  color: #22c55e;
  border: 1px solid #ffffff;
  border-radius: 4px;
  padding: 3px 4px;
  cursor: pointer;
  font-size: 11px;
  flex: 1;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;
  }
  
  &:active {
    transform: scale(0.97);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ShortButton = styled.button`
  background-color: transparent;
  color: #ef4444;
  border: 1px solid #ffffff;
  border-radius: 4px;
  padding: 3px 4px;
  cursor: pointer;
  font-size: 11px;
  flex: 1;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
  }
  
  &:active {
    transform: scale(0.97);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Sembol ekleme formu
export const AddSymbolForm = styled.div<{ isVisible: boolean }>`
  display: ${props => props.isVisible ? 'flex' : 'none'};
  margin-bottom: 10px;
  gap: 6px;
`;

export const SymbolInput = styled.input`
  flex: 1;
  padding: 5px 8px;
  border-radius: 4px;
  border: 1px solid #2c3142;
  background-color: #1a1e2e;
  color: white;
  font-size: 12px;
  height: 26px;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #6c8dff;
  }
`;

export const SubmitButton = styled.button`
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 12px;
  height: 26px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

// Boş durum
export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8f9bba;
  font-size: 14px;
  text-align: center;
  padding: 20px;
`;

// Tabs
export const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 12px;
  border-bottom: 1px solid #2c3142;
`;

export const Tab = styled.div<{ isActive: boolean }>`
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  border-bottom: 2px solid ${props => props.isActive ? '#d7fb73' : 'transparent'};
  color: ${props => props.isActive ? '#ffffff' : '#8f9bba'};
  transition: all 0.2s;
  
  &:hover {
    color: #ffffff;
  }
`;

// Modal
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

export const ModalContent = styled.div`
  background-color: #1b2839;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #2c3142;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const ModalTitle = styled.h3`
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
`;

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

// Form elemanları
export const FormGroup = styled.div`
  margin-bottom: 12px;
  flex: 1;
`;

export const FormGroupContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

export const FormLabel = styled.label`
  display: block;
  margin-bottom: 6px;
  color: #8f9bba;
  font-size: 13px;
`;

export const FormInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #2c3142;
  background-color: #1b2839;
  color: white;
  font-size: 13px;
  transition: border-color 0.3s;
  margin-bottom: 6px;
  
  &:focus {
    outline: none;
    border-color: #d7fb73;
  }
  
  &::placeholder {
    color: #4a5568;
  }
`;

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