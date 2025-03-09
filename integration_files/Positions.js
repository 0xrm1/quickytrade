import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { positionsAPI, watchlistAPI } from '../services/api';

// Ripple animasyonu için keyframes tanımlaması
const ripple = keyframes`
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

const PositionsContainer = styled.div`
  background-color: #111827;
  border-radius: 8px;
  border: 1px solid #1f2937;
  padding: 12px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PositionsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.div`
  background-color: rgba(79, 70, 229, 0.8);
  color: white;
  padding: 4px 16px;
  border-radius: 6px;
  font-weight: 600;
`;

const CloseAllButton = styled.button`
  background-color: #ef4444;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: background-color 0.3s;
  position: relative;
  overflow: hidden;

  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }
  
  &:focus:not(:active)::after {
    animation: ${ripple} 1s ease-out;
  }

  &:hover {
    background-color: #dc2626;
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const PositionsList = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  max-height: 250px;
  
  /* Webkit scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.5);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(79, 70, 229, 0.6);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(79, 70, 229, 0.8);
  }
  
  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(79, 70, 229, 0.6) rgba(31, 41, 55, 0.5);
`;

const PositionsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: #fff;
  font-size: 12px;
  table-layout: fixed;
`;

const TableHead = styled.thead`
  border-bottom: 1px solid #1f2937;
  position: sticky;
  top: 0;
  background-color: #111827;
  z-index: 10;
  
  th {
    text-align: left;
    padding: 4px 4px;
    font-size: 10px;
    color: #9ca3af;
    font-weight: 500;
    white-space: nowrap;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid #1f2937;
  }
  
  tr:nth-child(odd) {
    background-color: rgba(31, 41, 55, 0.3);
  }
  
  td {
    padding: 4px 4px;
    font-size: 11px;
    vertical-align: middle;
  }
`;

const SymbolContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Symbol = styled.div`
  font-weight: 600;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const LivePrice = styled.span`
  font-size: 9px;
  color: #9ca3af;
  font-weight: normal;
`;

const Side = styled.span`
  font-size: 10px;
  color: ${props => props.side === 'LONG' ? '#10b981' : '#ef4444'};
`;

const PnL = styled.div`
  color: ${props => props.value >= 0 ? '#10b981' : '#ef4444'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  
  span:first-child {
    font-weight: bold;
    font-size: 10px;
  }
  
  span:last-child {
    font-size: 8px;
    width: 100%;
  }
`;

const ActionButtons = styled.div`
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

const TopActionButtons = styled.div`
  display: flex;
  gap: 2px;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const buttonStyles = css`
  border: none;
  border-radius: 3px;
  width: 22px;
  height: 22px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
  
  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }
  
  &:focus:not(:active)::after {
    animation: ${ripple} 1s ease-out;
  }
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0.1);
  }
`;

const ActionButton = styled.button`
  ${buttonStyles}
`;

const MarketButton = styled(ActionButton)`
  background-color: #ef4444;
  color: #fff;
  
  &:hover {
    background-color: #b91c1c;
  }
`;

const LimitButton = styled(ActionButton)`
  background-color: #3b82f6;
  color: #fff;
  
  &:hover {
    background-color: #2563eb;
  }
`;

const StopLossButton = styled(ActionButton)`
  background-color: #f97316;
  color: #fff;
  
  &:hover {
    background-color: #c2410c;
  }
`;

const StopEntryButton = styled.button`
  ${buttonStyles}
  background-color: #dc2626;
  color: #fff;
  width: 100%;
  height: 24px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 3px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  
  &:hover {
    background-color: #991b1b;
  }
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0.1);
  }
`;

const CancelButton = styled.button`
  ${buttonStyles}
  background-color: rgba(79, 70, 229, 0.8);
  font-size: 12px;
  padding: 4px 8px;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  &:hover {
    background-color: rgba(79, 70, 229, 1);
  }
`;

const InputField = styled.input`
  width: 60px;
  height: 22px;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #fff;
  font-size: 9px;
  padding: 0 6px;
  text-align: right;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
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

const Loading = styled.div`
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 14px;
`;

const Error = styled.div`
  text-align: center;
  padding: 20px;
  color: #ef4444;
`;

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
  position: relative;
  overflow: hidden;
  
  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.3);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }
  
  &:focus:not(:active)::after {
    animation: ${ripple} 1s ease-out;
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  background-color: #2a2e3e;
  border: 1px solid #3a3f56;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #5a75f6;
  }
`;

const SubmitButton = styled.button`
  background-color: #5a75f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  position: relative;
  overflow: hidden;
  
  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }
  
  &:focus:not(:active)::after {
    animation: ${ripple} 1s ease-out;
  }
  
  &:hover {
    background-color: #4a65e6;
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const Tab = styled.button`
  background-color: ${props => props.active ? '#4f46e5' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#9ca3af'};
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  position: relative;
  overflow: hidden;
  
  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }
  
  &:focus:not(:active)::after {
    animation: ${ripple} 1s ease-out;
  }
  
  &:hover {
    background-color: ${props => props.active ? '#4338ca' : 'rgba(79, 70, 229, 0.1)'};
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const QuantityInputContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const PercentLabel = styled.span`
  color: #9ca3af;
  font-size: 12px;
  margin-left: 2px;
`;

const PercentageSelector = styled.div`
  position: absolute;
  top: 100%;
  left: -80px;
  margin-top: 5px;
  background-color: #111827;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 6px;
  z-index: 100;
  display: flex;
  gap: 3px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const PercentButton = styled.button`
  background-color: #1f2937;
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
    background-color: #4f46e5;
  }
`;

const PercentageInputField = styled.input`
  background-color: #1f2937;
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
    border-color: #4f46e5;
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

const PercentageInputWrapper = styled.div`
  position: relative;
  cursor: pointer;
`;

const InfoModal = ({ show, title, children, onClose }) => {
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

const StopLossModal = ({ show, symbol, currentPrice, onClose, onSubmit }) => {
  if (!show) return null;
  
  return (
    <InfoModal show={show} title={`Add Stop Loss for ${symbol}`} onClose={onClose}>
      <Form onSubmit={onSubmit}>
        <FormGroup>
          <Label>Current Price: {currentPrice}</Label>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="stopPrice">Stop Price</Label>
          <Input 
            id="stopPrice"
            name="stopPrice"
            type="number"
            step="0.0001"
            required
          />
        </FormGroup>
        <SubmitButton type="submit">Add Stop Loss</SubmitButton>
      </Form>
    </InfoModal>
  );
};

const TakeProfitModal = ({ show, symbol, currentPrice, onClose, onSubmit }) => {
  if (!show) return null;
  
  return (
    <InfoModal show={show} title={`Add Take Profit for ${symbol}`} onClose={onClose}>
      <Form onSubmit={onSubmit}>
        <FormGroup>
          <Label>Current Price: {currentPrice}</Label>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="takeProfitPrice">Take Profit Price</Label>
          <Input 
            id="takeProfitPrice"
            name="takeProfitPrice"
            type="number"
            step="0.0001"
            required
          />
        </FormGroup>
        <SubmitButton type="submit">Add Take Profit</SubmitButton>
      </Form>
    </InfoModal>
  );
};

// Yeni buton düzeni için stil bileşenleri
const OrderControlsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: flex-start;
  width: 100%;
  padding: 2px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 6px;
`;

const BasicOrderButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 50px;
`;

const OrderButton = styled.button`
  ${buttonStyles}
  width: 50px;
  height: 22px;
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: none;
  letter-spacing: 0.5px;
`;

const LimitOrderButton = styled(OrderButton)`
  background-color: #3b82f6;
  color: #fff;
  
  &:hover {
    background-color: #2563eb;
  }
`;

const StopOrderButton = styled(OrderButton)`
  background-color: #f97316;
  color: #fff;
  
  &:hover {
    background-color: #ea580c;
  }
`;

const MarketOrderButton = styled(OrderButton)`
  background-color: #ef4444;
  color: #fff;
  
  &:hover {
    background-color: #b91c1c;
  }
`;

const QuickOrdersSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 75px;
  margin-left: -5px;
`;

const QuickOrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 3px;
  width: 100%;
`;

const QuickOrderButton = styled.button`
  ${buttonStyles}
  width: 35px;
  height: 35px;
  font-size: 8px;
  font-weight: 600;
  border-radius: 4px;
  background-color: #4b5563;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.1;
  padding: 0;
  
  &:hover {
    background-color: #374151;
  }
`;

const StopEntryOrderButton = styled(QuickOrderButton)`
  background-color: rgba(79, 70, 229, 0.8);
  
  &:hover {
    background-color: rgba(79, 70, 229, 1);
  }
`;

const PercentStopOrderButton = styled(QuickOrderButton)`
  background-color: rgba(79, 70, 229, 0.8);
  
  &:hover {
    background-color: rgba(79, 70, 229, 1);
  }
`;

const OrderInputsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 90px;
  margin-left: auto;
  margin-right: auto;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  position: relative;
`;

const InputLabel = styled.div`
  font-size: 10px;
  color: #9ca3af;
  width: 30px;
  text-align: left;
`;

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [inputValues, setInputValues] = useState({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' veya 'openOrders'
  const [openOrders, setOpenOrders] = useState([]);
  const [showPercentInput, setShowPercentInput] = useState({});
  const [percentageValues, setPercentageValues] = useState({});
  const [showPercentSelector, setShowPercentSelector] = useState({});
  const [liveTickerData, setLiveTickerData] = useState({});
  
  // Pozisyonları yükle
  useEffect(() => {
    fetchPositions();
    
    // 1 saniyede bir güncelle
    const interval = setInterval(() => {
      // Sadece veri güncellemesi yap, yükleme durumu gösterme
      if (activeTab === 'positions') {
        fetchPositionsUpdate();
      } else {
        fetchOpenOrders();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeTab]);
  
  // Dışarı tıklandığında yüzde seçiciyi kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Eğer herhangi bir yüzde seçici açıksa ve tıklanan element seçici değilse kapat
      const selectors = document.querySelectorAll('.percent-selector');
      if (selectors.length > 0) {
        let clickedInsideSelector = false;
        selectors.forEach(selector => {
          if (selector.contains(event.target)) {
            clickedInsideSelector = true;
          }
        });
        
        if (!clickedInsideSelector) {
          setShowPercentSelector({});
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Anlık fiyat bilgilerini çek
  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        if (positions.length === 0) return;
        
        // Her sembol için ayrı ayrı ticker verisi al
        for (const position of positions) {
          try {
            const ticker = await watchlistAPI.getTicker(position.symbol);
            
            if (ticker && ticker.symbol) {
              setLiveTickerData(prev => ({
                ...prev,
                [ticker.symbol]: {
                  price: ticker.lastPrice || '0',
                  priceChangePercent: ticker.priceChangePercent || '0'
                }
              }));
            }
          } catch (symbolError) {
            console.error(`Error fetching ticker for ${position.symbol}:`, symbolError);
            // Hata durumunda bu sembolü atla ve diğerlerine devam et
          }
        }
      } catch (err) {
        console.error('Error loading ticker data:', err);
      }
    };
    
    // İlk yükleme
    if (positions.length > 0) {
      fetchTickerData();
      
      // 5 saniyede bir güncelle
      const interval = setInterval(fetchTickerData, 5000);
      return () => clearInterval(interval);
    }
  }, [positions]);
  
  // İlk kez pozisyonları yükle
  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await positionsAPI.getPositions();
      console.log('İlk pozisyonlar yüklendi:', data);
      
      const positionsArray = data.positions || [];
      
      // Input değerlerini sadece ilk kez veya yeni pozisyonlar için ayarla
      const newInputValues = { ...inputValues };
      positionsArray.forEach(position => {
        const symbol = position.symbol;
        // Eğer bu sembol için henüz input değeri yoksa, varsayılan değeri ayarla
        if (!newInputValues[symbol]) {
          newInputValues[symbol] = {
            price: position.markPrice,
            quantity: Math.abs(parseFloat(position.positionAmt))
          };
        }
      });
      
      setPositions(positionsArray);
      setInputValues(newInputValues);
      setInitialLoadComplete(true);
      setError(null);
    } catch (err) {
      console.error('İlk pozisyon yükleme hatası:', err);
      setError('Pozisyonlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Açık emirleri yükle
  const fetchOpenOrders = async () => {
    try {
      const data = await positionsAPI.getOpenOrders();
      console.log('Açık emirler yüklendi:', data);
      
      setOpenOrders(data.orders || []);
      setError(null);
    } catch (err) {
      console.error('Açık emirler yüklenirken hata:', err);
      // Hata olsa bile mevcut emirleri silme
    }
  };
  
  // Pozisyonları güncelle (loading durmunu değiştirmeden)
  const fetchPositionsUpdate = async () => {
    try {
      // Mevcut pozisyonlar yoksa normal fetchPositions'ı çağır
      if (positions.length === 0 && initialLoadComplete) {
        await fetchPositions();
        return;
      }
      
      const data = await positionsAPI.getPositions();
      const positionsArray = data.positions || [];
      
      if (positionsArray.length === 0 && positions.length > 0) {
        // Tüm pozisyonlar kapatılmışsa, state'i güncelle
        setPositions([]);
        return;
      }
      
      // Pozisyonları güncelle
      setPositions(prevPositions => {
        // Mevcut tüm pozisyonlar için bir kopya oluştur
        const existingPositionsMap = {};
        prevPositions.forEach(pos => {
          existingPositionsMap[pos.symbol] = pos;
        });
        
        // Yeni pozisyonlarla güncelle
        const updatedPositions = [];
        const newSymbols = [];
        
        positionsArray.forEach(newPos => {
          newSymbols.push(newPos.symbol);
          updatedPositions.push(newPos);
          
          // Sadece yeni semboller için input değerleri oluştur
          // (mevcut sembollerin input değerlerini güncelleme)
          if (!existingPositionsMap[newPos.symbol] && !inputValues[newPos.symbol]) {
            setInputValues(prev => ({
              ...prev,
              [newPos.symbol]: {
                price: newPos.markPrice,
                quantity: Math.abs(parseFloat(newPos.positionAmt))
              }
            }));
          }
        });
        
        // Kapatılan pozisyonları input değerlerinden temizle
        Object.keys(existingPositionsMap).forEach(symbol => {
          if (!newSymbols.includes(symbol)) {
            setInputValues(prev => {
              const newValues = { ...prev };
              delete newValues[symbol];
              return newValues;
            });
          }
        });
        
        return updatedPositions;
      });
    } catch (err) {
      console.error('Pozisyon güncelleme hatası:', err);
      // Hata olsa bile mevcut pozisyonları silme
    }
  };
  
  // Pozisyonu kapat
  const handleClosePosition = async (symbol) => {
    try {
      await positionsAPI.closePosition(symbol);
      // Pozisyonları yeniden yükle
      fetchPositions();
    } catch (err) {
      console.error('Pozisyon kapatılırken hata:', err);
    }
  };
  
  // Kısmi pozisyon kapatma (Market)
  const handlePartialClosePosition = async (symbol) => {
    try {
      const quantity = inputValues[symbol]?.quantity;
      if (!quantity) {
        console.error('Miktar belirtilmedi');
        return;
      }
      
      await positionsAPI.closePartialPosition(symbol, quantity);
      // Pozisyonları yeniden yükle
      fetchPositions();
    } catch (err) {
      console.error('Kısmi pozisyon kapatılırken hata:', err);
    }
  };
  
  // Limit emir ile pozisyon kapatma
  const handleLimitClosePosition = async (symbol) => {
    try {
      const price = inputValues[symbol]?.price;
      const quantity = inputValues[symbol]?.quantity;
      
      if (!price || !quantity) {
        console.error('Fiyat veya miktar belirtilmedi');
        return;
      }
      
      await positionsAPI.limitClosePosition(symbol, price, quantity);
      // Açık emirleri yeniden yükle
      fetchOpenOrders();
    } catch (err) {
      console.error('Limit emir oluşturulurken hata:', err);
    }
  };
  
  // Stop Loss emri ile pozisyon kapatma
  const handleStopLossPosition = async (symbol) => {
    try {
      const price = inputValues[symbol]?.price;
      const quantity = inputValues[symbol]?.quantity;
      
      if (!price || !quantity) {
        console.error('Fiyat veya miktar belirtilmedi');
        return;
      }
      
      await positionsAPI.addPartialStopLoss(symbol, price, quantity);
      // Açık emirleri yeniden yükle
      fetchOpenOrders();
    } catch (err) {
      console.error('Stop Loss emri oluşturulurken hata:', err);
    }
  };
  
  // Entry fiyatına stop market emri ekleme
  const handleStopEntryPosition = async (symbol) => {
    try {
      const quantity = inputValues[symbol]?.quantity;
      
      // Eğer miktar belirtilmişse onu kullan, aksi takdirde tüm pozisyonu kapat
      await positionsAPI.stopEntry(symbol, quantity);
      // Açık emirleri yeniden yükle
      fetchOpenOrders();
    } catch (err) {
      console.error('Entry fiyatına stop emri oluşturulurken hata:', err);
    }
  };
  
  // Entry fiyatının %1 aşağısına stop market emri ekleme
  const handlePercentStopPosition = async (symbol, percent) => {
    try {
      const quantity = inputValues[symbol]?.quantity;
      
      // Pozisyon bilgilerini bul
      const position = positions.find(pos => pos.symbol === symbol);
      if (!position) {
        console.error(`${symbol} için pozisyon bulunamadı`);
        return;
      }
      
      const entryPrice = parseFloat(position.entryPrice);
      const isLong = position.side === 'LONG' || parseFloat(position.positionAmt) > 0;
      
      // Long pozisyonlar için entry fiyatının belirli bir yüzde aşağısı
      // Short pozisyonlar için entry fiyatının belirli bir yüzde yukarısı
      const percentDecimal = percent / 100;
      let stopPrice;
      
      if (isLong) {
        // Long pozisyonlar için entry fiyatının belirli bir yüzde aşağısı
        stopPrice = entryPrice * (1 - percentDecimal);
      } else {
        // Short pozisyonlar için entry fiyatının belirli bir yüzde yukarısı
        stopPrice = entryPrice * (1 + percentDecimal);
      }
      
      // Fiyatı doğru formata çevir
      const formattedStopPrice = stopPrice.toFixed(getSymbolPricePrecision(symbol));
      
      // Stop emri gönder
      await positionsAPI.addPartialStopLoss(symbol, formattedStopPrice, quantity);
      
      // Açık emirleri yeniden yükle
      fetchOpenOrders();
    } catch (err) {
      console.error(`Entry fiyatının %${percent} stop emri oluşturulurken hata:`, err);
    }
  };
  
  // %1 Stop butonu için handler
  const handleOnePercentStopPosition = (symbol) => {
    handlePercentStopPosition(symbol, 1);
  };
  
  // %2 Stop butonu için handler
  const handleTwoPercentStopPosition = (symbol) => {
    handlePercentStopPosition(symbol, 2);
  };
  
  // %3 Stop butonu için handler
  const handleThreePercentStopPosition = (symbol) => {
    handlePercentStopPosition(symbol, 3);
  };
  
  // Emri iptal et
  const handleCancelOrder = async (symbol, orderId) => {
    try {
      await positionsAPI.cancelOrder(symbol, orderId);
      // Açık emirleri yeniden yükle
      fetchOpenOrders();
    } catch (err) {
      console.error('Emir iptal edilirken hata:', err);
    }
  };

  // Tüm pozisyonları kapat
  const handleCloseAllPositions = async () => {
    try {
      // Her bir pozisyonu sırayla kapat
      for (const position of positions) {
        await positionsAPI.closePosition(position.symbol);
      }
      // Pozisyonları yeniden yükle
      fetchPositions();
    } catch (err) {
      console.error('Tüm pozisyonlar kapatılırken hata:', err);
    }
  };
  
  // Input değerini güncelle
  const handleInputChange = (symbol, field, value) => {
    setInputValues(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        [field]: value
      }
    }));
  };
  
  // Yüzde input gösterimini aç/kapat
  const togglePercentInput = (symbol) => {
    setShowPercentInput(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  };
  
  // Yüzde seçici gösterimini aç/kapat
  const togglePercentSelector = (symbol) => {
    setShowPercentSelector(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  };
  
  // Hızlı yüzde seçimi
  const handleQuickPercentSelect = (symbol, percent) => {
    const position = positions.find(p => p.symbol === symbol);
    if (!position) return;
    
    const totalQuantity = Math.abs(parseFloat(position.positionAmt));
    const calculatedQuantity = (totalQuantity * percent) / 100;
    
    // Quantity değerini güncelle
    setInputValues(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        quantity: calculatedQuantity
      }
    }));
    
    // Yüzde değerini güncelle
    setPercentageValues(prev => ({
      ...prev,
      [symbol]: percent
    }));
    
    // Seçiciyi kapat
    setShowPercentSelector(prev => ({
      ...prev,
      [symbol]: false
    }));
  };
  
  // Yüzde input değerini güncelle
  const handlePercentageInputChange = (symbol, value) => {
    // Değer 0-100 arasında olmalı
    let percentValue = parseInt(value);
    if (isNaN(percentValue)) percentValue = '';
    if (percentValue < 0) percentValue = 0;
    if (percentValue > 100) percentValue = 100;
    
    setPercentageValues(prev => ({
      ...prev,
      [symbol]: percentValue
    }));
    
    // Eğer geçerli bir yüzde değeri varsa, quantity'yi güncelle
    if (percentValue !== '' && !isNaN(percentValue)) {
      const position = positions.find(p => p.symbol === symbol);
      if (!position) return;
      
      const totalQuantity = Math.abs(parseFloat(position.positionAmt));
      const calculatedQuantity = (totalQuantity * percentValue) / 100;
      
      setInputValues(prev => ({
        ...prev,
        [symbol]: {
          ...prev[symbol],
          quantity: calculatedQuantity
        }
      }));
    }
  };
  
  // Yüzde değerine göre miktar hesapla
  const handlePercentChange = (symbol, percent) => {
    const position = positions.find(p => p.symbol === symbol);
    if (!position) return;
    
    const totalQuantity = Math.abs(parseFloat(position.positionAmt));
    const calculatedQuantity = (totalQuantity * parseFloat(percent)) / 100;
    
    setInputValues(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        quantity: calculatedQuantity
      }
    }));
    
    // Yüzde input'u kapat
    setShowPercentInput(prev => ({
      ...prev,
      [symbol]: false
    }));
  };
  
  // Stop Loss modalını aç
  const openStopLossModal = (symbol, currentPrice) => {
    setSelectedSymbol(symbol);
    setCurrentPrice(currentPrice);
    setModalType('stopLoss');
  };
  
  // Take Profit modalını aç
  const openTakeProfitModal = (symbol, currentPrice) => {
    setSelectedSymbol(symbol);
    setCurrentPrice(currentPrice);
    setModalType('takeProfit');
  };
  
  // Modalı kapat
  const closeModal = () => {
    setModalType(null);
    setSelectedSymbol('');
    setCurrentPrice(0);
  };
  
  // Stop Loss ekle
  const handleAddStopLoss = async (e) => {
    e.preventDefault();
    try {
      const price = e.target.stopPrice.value;
      await positionsAPI.addStopLoss(selectedSymbol, price);
      closeModal();
      fetchPositions();
    } catch (err) {
      console.error('Stop Loss eklenirken hata:', err);
    }
  };
  
  // Take Profit ekle
  const handleAddTakeProfit = async (e) => {
    e.preventDefault();
    try {
      const price = e.target.takeProfitPrice.value;
      await positionsAPI.addTakeProfit(selectedSymbol, price);
      closeModal();
      fetchPositions();
    } catch (err) {
      console.error('Take Profit eklenirken hata:', err);
    }
  };

  // Break Even hesapla (giriş fiyatı)
  const calculateBreakEven = (position) => {
    const entryPrice = parseFloat(position.entryPrice);
    // Basit implementasyon - daha gelişmiş hesaplama yapılabilir
    return entryPrice.toFixed(3);
  };
  
  // Sembol için doğru ondalık hassasiyetini belirle
  const getSymbolPricePrecision = (symbol) => {
    // Bilinen semboller için hassasiyet değerleri
    const precisionMap = {
      'BTCUSDT': 1,    // Bitcoin genellikle 1 ondalık basamak (örn: 42345.5)
      'ETHUSDT': 2,    // Ethereum genellikle 2 ondalık basamak (örn: 2345.25)
      'SOLUSDT': 3,    // Solana genellikle 3 ondalık basamak (örn: 145.240)
      'XRPUSDT': 5,    // XRP genellikle 5 ondalık basamak (örn: 0.52345)
      'DOGEUSDT': 6,   // Doge genellikle 6 ondalık basamak (örn: 0.123456)
      'BNBUSDT': 2,    // BNB genellikle 2 ondalık basamak (örn: 345.25)
    };
    
    // Eğer sembol bilinen bir sembolse, hassasiyet değerini döndür
    if (precisionMap[symbol]) {
      return precisionMap[symbol];
    }
    
    // Bilinmeyen semboller için varsayılan değer
    return 3;
  };
  
  return (
    <PositionsContainer>
      <PositionsHeader>
        <TabContainer>
          <Tab 
            active={activeTab === 'positions'} 
            onClick={() => setActiveTab('positions')}
          >
            Positions
          </Tab>
          <Tab 
            active={activeTab === 'openOrders'} 
            onClick={() => setActiveTab('openOrders')}
          >
            Open Orders {openOrders.length > 0 && `(${openOrders.length})`}
          </Tab>
        </TabContainer>
        
        {activeTab === 'positions' && positions.length > 0 && (
          <CloseAllButton onClick={handleCloseAllPositions}>CLOSE ALL</CloseAllButton>
        )}
      </PositionsHeader>
      
      {activeTab === 'positions' ? (
        // Positions Tab
        !initialLoadComplete && loading ? (
          <Loading>Loading...</Loading>
        ) : error ? (
          <Error>{error}</Error>
        ) : positions.length === 0 ? (
          <Loading>No open positions</Loading>
        ) : (
          <PositionsList>
            <PositionsTable>
              <TableHead>
                <tr>
                  <th style={{ width: '80px' }}>SYMBOL</th>
                  <th style={{ width: '70px', textAlign: 'center', whiteSpace: 'pre-line' }}>SIZE{'\n'}(USDT)</th>
                  <th style={{ width: '60px', textAlign: 'right' }}>ENTRY</th>
                  <th style={{ width: '60px', textAlign: 'center', whiteSpace: 'pre-line' }}>BREAK{'\n'}EVEN</th>
                  <th style={{ width: '60px', textAlign: 'center', whiteSpace: 'pre-line' }}>LIQ{'\n'}PRICE</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>PNL</th>
                  <th style={{ width: '120px' }}></th>
                  <th style={{ width: '80px', textAlign: 'center' }}>QUICK STOP</th>
                </tr>
              </TableHead>
              <TableBody>
                {positions.map((position) => {
                  // Backend'den gelen side değerini doğrudan kullan
                  const side = position.side || (parseFloat(position.positionAmt) > 0 ? 'LONG' : 'SHORT');
                  const isLong = side === 'LONG';
                  
                  // Binance'den gelen doğru PNL değerlerini kullan
                  const pnl = parseFloat(position.unRealizedProfit);
                  
                  // PNL yüzdesini hesapla
                  const pnlPercentage = position.roe ? 
                    parseFloat(position.roe).toFixed(2) : 
                    "0.00";
                  
                  const markPrice = parseFloat(position.markPrice);
                  const positionSize = Math.abs(parseFloat(position.positionAmt));
                  const entryPrice = parseFloat(position.entryPrice);
                  const leverage = position.leverage || '20'; // Leverage varsayılan 20x
                  const breakEven = calculateBreakEven(position);
                  
                  // Likit fiyatı
                  const liquidationPrice = position.liquidationPrice && parseFloat(position.liquidationPrice) !== 0 ? 
                    parseFloat(position.liquidationPrice).toFixed(3) : 
                    "N/A";
                  
                  // Pozisyon değerini USDT olarak hesapla
                  const positionValueUSDT = (positionSize * entryPrice).toFixed(2);
                  
                  // Satır arka plan rengi
                  const rowBgColor = isLong ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                  
                  return (
                    <tr key={position.symbol} style={{ backgroundColor: rowBgColor }}>
                      <td>
                        <SymbolContainer>
                          <Symbol>
                            {position.symbol}
                            <Side side={side}>({leverage}x)</Side>
                          </Symbol>
                          {liveTickerData[position.symbol] && (
                            <LivePrice>
                              {parseFloat(liveTickerData[position.symbol].price).toFixed(getSymbolPricePrecision(position.symbol))}
                            </LivePrice>
                          )}
                        </SymbolContainer>
                      </td>
                      <td style={{ textAlign: 'center' }}>{positionValueUSDT} USDT</td>
                      <td style={{ textAlign: 'right' }}>{entryPrice.toFixed(3)}</td>
                      <td style={{ textAlign: 'center' }}>{breakEven}</td>
                      <td style={{ textAlign: 'center', color: '#f97316' }}>{liquidationPrice}</td>
                      <td>
                        <PnL value={pnl}>
                          <span>{pnl > 0 ? '+' : ''}{pnl.toFixed(2)} USDT</span>
                          <span>({pnl > 0 ? '+' : ''}{pnlPercentage}%)</span>
                        </PnL>
                      </td>
                      <td colSpan="2">
                        <OrderControlsContainer>
                          <ButtonsContainer>
                            <BasicOrderButtons>
                              <LimitOrderButton 
                                title="Limit Close"
                                onClick={() => handleLimitClosePosition(position.symbol)}
                              >
                                Limit
                              </LimitOrderButton>
                              <StopOrderButton 
                                title="Stop Loss"
                                onClick={() => handleStopLossPosition(position.symbol)}
                              >
                                Stop
                              </StopOrderButton>
                              <MarketOrderButton 
                                title="Market Close"
                                onClick={() => handlePartialClosePosition(position.symbol)}
                              >
                                Market
                              </MarketOrderButton>
                            </BasicOrderButtons>
                            
                            <OrderInputsSection>
                              <InputGroup>
                                <InputField
                                  type="text"
                                  value={inputValues[position.symbol]?.price || ''}
                                  placeholder={markPrice.toFixed(getSymbolPricePrecision(position.symbol))}
                                  onChange={(e) => {
                                    // Virgülü noktaya çevir
                                    const value = e.target.value.replace(',', '.');
                                    handleInputChange(position.symbol, 'price', value);
                                  }}
                                />
                                <InputLabel>Price</InputLabel>
                              </InputGroup>
                              
                              <InputGroup>
                                <InputField
                                  type="text"
                                  value={inputValues[position.symbol]?.quantity || ''}
                                  placeholder={positionSize.toFixed(3)}
                                  onChange={(e) => handleInputChange(position.symbol, 'quantity', e.target.value)}
                                />
                                <InputLabel>Qty</InputLabel>
                              </InputGroup>
                              
                              <InputGroup>
                                <InputField
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={percentageValues[position.symbol] || ''}
                                  onClick={() => togglePercentSelector(position.symbol)}
                                  onChange={(e) => handlePercentageInputChange(position.symbol, e.target.value)}
                                  placeholder="0"
                                />
                                <InputLabel>%</InputLabel>
                                {showPercentSelector[position.symbol] && (
                                  <PercentageSelector className="percent-selector">
                                    <PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 10)}>10%</PercentButton>
                                    <PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 25)}>25%</PercentButton>
                                    <PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 50)}>50%</PercentButton>
                                    <PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 75)}>75%</PercentButton>
                                    <PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 100)}>100%</PercentButton>
                                  </PercentageSelector>
                                )}
                              </InputGroup>
                            </OrderInputsSection>
                            
                            <QuickOrdersSection>
                              <QuickOrdersGrid>
                                <StopEntryOrderButton 
                                  title="Entry fiyatına stop emri"
                                  onClick={() => handleStopEntryPosition(position.symbol)}
                                >
                                  <span>stop</span>
                                  <span>entry</span>
                                </StopEntryOrderButton>
                                <PercentStopOrderButton 
                                  title="Entry fiyatının %2 aşağısına stop emri"
                                  onClick={() => handleTwoPercentStopPosition(position.symbol)}
                                >
                                  <span>%2</span>
                                  <span>stop</span>
                                </PercentStopOrderButton>
                                <PercentStopOrderButton 
                                  title="Entry fiyatının %1 aşağısına stop emri"
                                  onClick={() => handleOnePercentStopPosition(position.symbol)}
                                >
                                  <span>%1</span>
                                  <span>stop</span>
                                </PercentStopOrderButton>
                                <PercentStopOrderButton 
                                  title="Entry fiyatının %3 aşağısına stop emri"
                                  onClick={() => handleThreePercentStopPosition(position.symbol)}
                                >
                                  <span>%3</span>
                                  <span>stop</span>
                                </PercentStopOrderButton>
                              </QuickOrdersGrid>
                            </QuickOrdersSection>
                          </ButtonsContainer>
                        </OrderControlsContainer>
                      </td>
                    </tr>
                  );
                })}
              </TableBody>
            </PositionsTable>
          </PositionsList>
        )
      ) : (
        // Open Orders Tab
        <PositionsList>
          {openOrders.length === 0 ? (
            <Loading>No open orders</Loading>
          ) : (
            <PositionsTable>
              <TableHead>
                <tr>
                  <th>SYMBOL</th>
                  <th>TYPE</th>
                  <th>SIDE</th>
                  <th>PRICE</th>
                  <th>QUANTITY</th>
                  <th>TIME</th>
                  <th>ACTION</th>
                </tr>
              </TableHead>
              <TableBody>
                {openOrders.map((order) => {
                  const orderType = order.type;
                  const side = order.side;
                  const isLong = side === 'BUY';
                  
                  // Emir tipine göre fiyat gösterimi
                  let price;
                  let priceDisplay;
                  if (orderType === 'MARKET') {
                    price = 'MARKET';
                    priceDisplay = 'MARKET';
                  } else if (orderType === 'STOP_MARKET' || orderType === 'TAKE_PROFIT_MARKET') {
                    price = parseFloat(order.stopPrice);
                    priceDisplay = `${price.toFixed(getSymbolPricePrecision(order.symbol))} (Stop)`;
                  } else {
                    price = parseFloat(order.price);
                    priceDisplay = price.toFixed(getSymbolPricePrecision(order.symbol));
                  }
                  
                  const quantity = parseFloat(order.origQty);
                  const time = new Date(order.time).toLocaleTimeString();
                  
                  // Satır arka plan rengi
                  const rowBgColor = isLong ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                  
                  return (
                    <tr key={order.orderId} style={{ backgroundColor: rowBgColor }}>
                      <td>{order.symbol}</td>
                      <td>{orderType}</td>
                      <td style={{ color: isLong ? '#10b981' : '#ef4444' }}>{side}</td>
                      <td>{priceDisplay}</td>
                      <td>{quantity}</td>
                      <td>{time}</td>
                      <td>
                        <CancelButton 
                          onClick={() => handleCancelOrder(order.symbol, order.orderId)}
                        >
                          Cancel
                        </CancelButton>
                      </td>
                    </tr>
                  );
                })}
              </TableBody>
            </PositionsTable>
          )}
        </PositionsList>
      )}
      
      <StopLossModal
        show={modalType === 'stopLoss'}
        symbol={selectedSymbol}
        currentPrice={currentPrice}
        onClose={closeModal}
        onSubmit={handleAddStopLoss}
      />
      
      <TakeProfitModal
        show={modalType === 'takeProfit'}
        symbol={selectedSymbol}
        currentPrice={currentPrice}
        onClose={closeModal}
        onSubmit={handleAddTakeProfit}
      />
    </PositionsContainer>
  );
};

export default Positions; 