import styled, { css, keyframes, createGlobalStyle } from 'styled-components';

// Global stil tanımlaması
export const GlobalStyle = createGlobalStyle`
  .position-row {
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .position-row:hover {
    border: 1px solid #d7fb73 !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 10;
    position: relative;
  }
`;

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

// Buton stilleri için ortak CSS
export const buttonStyles = css`
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  
  &:active {
    transform: scale(0.97);
  }
`;

export const PositionsContainer = styled.div`
  background-color: #1b2839;
  border-radius: 8px;
  border: 1px solid #2c3142;
  padding: 10px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

export const PositionsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px 8px 0;
  margin-bottom: 8px;
`;

export const Title = styled.div`
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

export const CloseAllButton = styled.button`
  ${buttonStyles}
  background-color: transparent;
  color: #ef4444;
  font-size: 11px;
  font-weight: 400;
  padding: 4px 8px;
  border-radius: 3px;
  height: 22px;
  border: 1px solid #ef4444;
  
  &:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }
`;

export const PositionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Özel scrollbar stili */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1b2839;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #d7fb73;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: #c8ec64;
  }
`;

export const PositionsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  
  th, td {
    padding: 4px 6px;
    text-align: left;
    border-bottom: 1px solid #374151;
  }
  
  th {
    color: #9ca3af;
    font-weight: 500;
    font-size: 10px;
    padding-bottom: 6px;
  }
`;

export const TableHead = styled.thead`
  position: sticky;
  top: 0;
  background-color: #1b2839;
  z-index: 1;
  
  th {
    padding: 4px 6px;
    font-size: 9px;
    white-space: nowrap;
    letter-spacing: 0.5px;
  }
`;

export const TableBody = styled.tbody`
  tr {
    height: 60px;
    transition: all 0.2s;
    border: 1px solid transparent;
    border-bottom: 1px solid rgba(55, 65, 81, 0.3);
    border-radius: 6px;
    position: relative;
    
    &:hover {
      border: 1px solid #d7fb73;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 1;
    }
  }
`;

export const SymbolContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

export const Symbol = styled.div`
  font-weight: 500;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const LivePrice = styled.div`
  font-size: 9px;
  color: #9ca3af;
`;

export const Side = styled.span<{ side: string }>`
  color: ${props => props.side === 'LONG' ? '#4ade80' : '#ef4444'};
  font-size: 9px;
  font-weight: ${props => props.side === 'LONG' ? 'bold' : 'normal'};
`;

export const PnL = styled.div<{ value: number }>`
  display: flex;
  flex-direction: column;
  color: ${props => props.value > 0 ? '#4ade80' : '#ef4444'};
  font-size: 10px;
  gap: 1px;
  font-weight: ${props => props.value > 0 ? 'bold' : 'normal'};
`;

export const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 3px;
`;

export const TopActionButtons = styled.div`
  display: flex;
  gap: 2px;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

export const ActionButton = styled.button`
  ${buttonStyles}
`;

export const MarketButton = styled(ActionButton)`
  background-color: transparent;
  color: #d7fb73;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  padding: 4px 8px;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

export const LimitButton = styled(ActionButton)`
  background-color: transparent;
  color: #d7fb73;
  border: none;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

export const StopLossButton = styled(ActionButton)`
  background-color: transparent;
  color: #d7fb73;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  padding: 4px 8px;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

export const StopEntryButton = styled.button`
  ${buttonStyles}
  background-color: transparent;
  color: #d7fb73;
  border: none;
  width: 100%;
  height: 24px;
  font-size: 10px;
  font-weight: 400;
  border-radius: 4px;
  letter-spacing: 0.3px;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

export const CancelButton = styled.button`
  ${buttonStyles}
  background-color: #ef4444;
  color: #fff;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 3px;
  
  &:hover {
    background-color: #b91c1c;
  }
`;

export const CancelOrderButton = styled(CancelButton)`
  font-size: 9px;
  padding: 2px 6px;
  height: 18px;
`;

export const InputGroup = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  height: 16px;
  margin-bottom: 1px;
  flex-direction: row;
  width: 100%;
`;

export const InputLabel = styled.div`
  font-size: 9px;
  color: #9ca3af;
  width: 30px;
  text-align: right;
  margin-right: 4px;
  margin-left: -5px;
`;

export const InputField = styled.input`
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 3px;
  color: #fff;
  padding: 1px 4px;
  width: 55px;
  height: 16px;
  font-size: 9px;
  margin-top: 12px;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
  
  &::placeholder {
    color: #6b7280;
  }
  
  /* Sayı arttırma/azaltma oklarını gizle */
  &::-webkit-inner-spin-button, 
  &::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

export const Loading = styled.div`
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 14px;
`;

export const Error = styled.div`
  text-align: center;
  padding: 20px;
  color: #ef4444;
`;

export const TabContainer = styled.div`
  display: flex;
  height: 100%;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
`;

export const Tab = styled.div<{ active: boolean }>`
  margin: 0;
  padding: 6px 12px;
  color: ${props => props.active ? '#ffffff' : '#9ca3af'};
  font-size: 14px;
  font-weight: 500;
  background-color: transparent;
  border: 1px solid ${props => props.active ? '#d7fb73' : '#2c3142'};
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #ffffff;
    border-color: #d7fb73;
  }
`;

export const OrderCount = styled.span`
  font-size: 11px;
  color: #ffffff;
  margin-left: 4px;
  font-weight: 400;
`;

export const QuantityInputContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

export const PercentLabel = styled.span`
  color: #9ca3af;
  font-size: 12px;
  margin-left: 2px;
`;

export const PercentSelectorContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 5px;
  background-color: #1b2839;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 6px;
  z-index: 100;
  display: flex;
  gap: 3px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

export const PercentButton = styled.button`
  background-color: #242842;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #fff;
  padding: 3px 6px;
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2d3748;
  }
  
  &:active {
    background-color: #d7fb73;
    color: #1b2839;
  }
`;

export const PercentageInputField = styled.input`
  background-color: #242842;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #fff;
  padding: 3px;
  width: 40px;
  font-size: 11px;
  text-align: center;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #d7fb73;
  }
  
  /* Sayı arttırma/azaltma oklarını gizle */
  &::-webkit-inner-spin-button, 
  &::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
`;

export const PercentageInputWrapper = styled.div`
  position: relative;
  cursor: pointer;
`;

// Yeni buton düzeni için stil bileşenleri
export const OrderControlsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
`;

export const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2px;
  align-items: center;
  height: 100%;
`;

export const BasicOrderButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 45px;
  justify-content: center;
  height: 100%;
`;

export const OrderButton = styled.button`
  ${buttonStyles}
  width: 45px;
  height: 16px;
  font-size: 8px;
  font-weight: 400;
  border-radius: 4px;
  letter-spacing: 0.5px;
`;

export const LimitOrderButton = styled(OrderButton)`
  background-color: transparent;
  color: #d7fb73;
  border: none;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

export const StopOrderButton = styled(OrderButton)`
  background-color: transparent;
  color: #d7fb73;
  border: none;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

export const MarketOrderButton = styled(OrderButton)`
  background-color: transparent;
  color: #d7fb73;
  border: none;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

export const QuickOrdersSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 70px;
`;

export const QuickOrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 6px;
  width: 100%;
`;

export const QuickOrderButton = styled.button`
  ${buttonStyles}
  width: 100%;
  height: 20px;
  font-size: 9px;
  font-weight: 400;
  border-radius: 4px;
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 6px;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

export const StopEntryOrderButton = styled(QuickOrderButton)`
  background-color: transparent;
  color: #ffffff;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
`;

export const PercentStopOrderButton = styled(QuickOrderButton)`
  background-color: transparent;
  color: #ffffff;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
`;

export const OrderInputsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 85px;
  margin-left: 20px;
  margin-right: auto;
  position: relative;
  justify-content: center;
  height: 100%;
`;