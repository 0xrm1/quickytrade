import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { watchlistAPI, terminalAPI } from '../services/api';

const WatchlistContainer = styled.div`
  background-color: #111827; /* darker background */
  border-radius: 8px;
  border: 1px solid #1f2937;
  padding: 12px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const WatchlistHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  background-color: rgba(79, 70, 229, 0.8); /* indigo color */
  padding: 4px 16px;
  border-radius: 6px;
`;

const AddButton = styled.button`
  background-color: rgba(79, 70, 229, 0.8);
  color: white;
  border: none;
  border-radius: 6px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s;
  
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
    animation: ripple 1s ease-out;
  }
  
  @keyframes ripple {
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
  }
  
  &:hover {
    background-color: rgba(79, 70, 229, 1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const SymbolList = styled.div`
  overflow-y: auto;
  flex: 1;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: calc(4 * 88px); /* Limit height to show 4 items */
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
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
  
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(79, 70, 229, 0.6) rgba(31, 41, 55, 0.5);
`;

const SymbolItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  border: 1px solid #1f2937;
  border-radius: 6px;
  background-color: rgba(17, 24, 39, 0.5);
  
  &:hover {
    background-color: rgba(31, 41, 55, 0.5);
  }
`;

const SymbolHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SymbolInfo = styled.div`
  display: flex;
  align-items: center;
`;

const RemoveButton = styled.div`
  width: 20px;
  height: 20px;
  background-color: rgba(79, 70, 229, 0.5);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 12px;
  color: white;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s;
  
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
    animation: ripple 1s ease-out;
  }
  
  &:hover {
    background-color: rgba(79, 70, 229, 0.8);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const SymbolName = styled.div`
  font-weight: 600;
  font-family: monospace;
  color: #818cf8; /* indigo-400 */
`;

const PriceChange = styled.div`
  margin-left: 8px;
  font-size: 12px;
  color: ${props => props.isPositive ? '#10b981' : '#ef4444'};
`;

const Price = styled.div`
  font-weight: 600;
  font-family: monospace;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex: 1;
  gap: 4px;
`;

const LongButton = styled.button`
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 4px;
  cursor: pointer;
  font-size: 12px;
  flex: 1;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s;
  
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
    animation: ripple 1s ease-out;
  }
  
  &:hover {
    background-color: #059669;
  }
  
  &:active {
    transform: scale(0.97);
  }
  
  &:disabled {
    background-color: #6b7280;
    cursor: not-allowed;
  }
`;

const ShortButton = styled.button`
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 4px;
  cursor: pointer;
  font-size: 12px;
  flex: 1;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s;
  
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
    animation: ripple 1s ease-out;
  }
  
  &:hover {
    background-color: #dc2626;
  }
  
  &:active {
    transform: scale(0.97);
  }
  
  &:disabled {
    background-color: #6b7280;
    cursor: not-allowed;
  }
`;

const AddSymbolForm = styled.div`
  display: ${props => props.isVisible ? 'flex' : 'none'};
  margin-bottom: 12px;
  gap: 8px;
`;

const SymbolInput = styled.input`
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #1f2937;
  background-color: #1f2937;
  color: white;
`;

const SubmitButton = styled.button`
  background-color: rgba(79, 70, 229, 0.8);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s;
  
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
    animation: ripple 1s ease-out;
  }
  
  &:hover {
    background-color: rgba(79, 70, 229, 1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: #9ca3af;
`;

const SettingsButton = styled.button`
  background-color: rgba(79, 70, 229, 0.8);
  color: white;
  border: none;
  border-radius: 6px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  margin-right: 8px;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s;
  
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
    animation: ripple 1s ease-out;
  }
  
  &:hover {
    background-color: rgba(79, 70, 229, 1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

// Modal overlay for settings
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
  background-color: #111827;
  border-radius: 8px;
  border: 1px solid #1f2937;
  padding: 20px;
  width: 400px;
  max-width: 90%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 8px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: white;
  font-size: 18px;
`;

const CloseModalButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
  
  &:hover {
    color: white;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #9ca3af;
  font-size: 14px;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`;

const FormInput = styled.input`
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 4px;
  color: white;
  padding: 8px;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const SaveButton = styled.button`
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  width: 100%;
  margin-top: 8px;
  
  &:hover {
    background-color: #4338ca;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 12px;
  border-bottom: 1px solid #1f2937;
`;

const Tab = styled.div`
  padding: 6px 12px;
  cursor: pointer;
  color: ${props => props.active ? '#fff' : '#9ca3af'};
  background-color: ${props => props.active ? 'rgba(79, 70, 229, 0.8)' : 'transparent'};
  border-radius: 6px 6px 0 0;
  font-weight: ${props => props.active ? '600' : '400'};
  
  &:hover {
    background-color: ${props => props.active ? 'rgba(79, 70, 229, 0.8)' : 'rgba(31, 41, 55, 0.5)'};
  }
`;

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [tickerData, setTickerData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderSymbol, setOrderSymbol] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState(1); // Aktif sekme (1, 2, 3)
  
  // Load button settings from localStorage or use defaults
  const getButtonSettings = () => {
    try {
      const savedSettings = localStorage.getItem('watchlistButtonSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (err) {
      console.error('Error loading button settings:', err);
    }
    
    // Default values
    return {
      longAmounts: [10000, 25000, 50000],
      longLabels: ['10K', '25K', '50K'],
      shortAmounts: [10000, 30000, 100000],
      shortLabels: ['10K', '30K', '100K']
    };
  };
  
  const [buttonSettings, setButtonSettings] = useState(getButtonSettings());
  const [formSettings, setFormSettings] = useState({...buttonSettings});
  
  // Save settings to localStorage
  const saveButtonSettings = (settings) => {
    try {
      localStorage.setItem('watchlistButtonSettings', JSON.stringify(settings));
    } catch (err) {
      console.error('Error saving button settings:', err);
    }
  };
  
  // Load watchlist from localStorage
  const loadWatchlistFromLocalStorage = () => {
    try {
      const savedWatchlist = localStorage.getItem('watchlist');
      if (savedWatchlist) {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        console.log('Loaded watchlist from localStorage:', parsedWatchlist);
        return parsedWatchlist;
      }
    } catch (err) {
      console.error('Error loading watchlist from localStorage:', err);
    }
    return [];
  };
  
  // Save watchlist to localStorage
  const saveWatchlistToLocalStorage = (list) => {
    try {
      localStorage.setItem('watchlist', JSON.stringify(list));
      console.log('Saved watchlist to localStorage:', list);
    } catch (err) {
      console.error('Error saving watchlist to localStorage:', err);
    }
  };
  
  // Sync watchlist with backend
  const syncWatchlistWithBackend = async (list) => {
    try {
      await watchlistAPI.syncWatchlist(list);
      console.log('Synced watchlist with backend');
    } catch (err) {
      console.error('Error syncing watchlist with backend:', err);
      // Hata durumunda işlemi devam ettir, sadece log'la
    }
  };
  
  // Load watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setLoading(true);
        
        // Önce localStorage'dan yükle
        const localWatchlist = loadWatchlistFromLocalStorage();
        
        if (localWatchlist && localWatchlist.length > 0) {
          // localStorage'dan yüklenen veriyi kullan
          setWatchlist(localWatchlist);
          
          // Backend ile senkronize et (hata olsa bile devam et)
          try {
            await syncWatchlistWithBackend(localWatchlist);
          } catch (syncErr) {
            console.error('Backend sync error (non-critical):', syncErr);
          }
        } else {
          try {
            // Backend'den yükle
            const data = await watchlistAPI.getWatchlist(activeTab);
            
            // Sembol listesini oluştur
            const symbols = data.watchlist && data.watchlist.length > 0 
              ? data.watchlist.map(item => typeof item === 'object' ? item : { symbol: item, listId: activeTab })
              : [];
            
            setWatchlist(symbols);
            
            // localStorage'a kaydet
            saveWatchlistToLocalStorage(symbols);
          } catch (apiErr) {
            console.error('API error, using empty watchlist:', apiErr);
            // API hatası durumunda boş liste kullan
            setWatchlist([]);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error in fetchWatchlist:', err);
        setError('Error loading watchlist. Using local data if available.');
        
        // Hata durumunda localStorage'dan yüklemeyi dene
        const localWatchlist = loadWatchlistFromLocalStorage();
        if (localWatchlist && localWatchlist.length > 0) {
          setWatchlist(localWatchlist);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchWatchlist();
  }, [activeTab]);
  
  // Load ticker data
  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        // Aktif sekmeye ait sembolleri filtrele
        const activeWatchlist = watchlist.filter(item => item.listId == activeTab);
        
        if (activeWatchlist.length === 0) return;
        
        console.log('Fetching ticker data for:', activeWatchlist.map(item => item.symbol));
        
        // Her sembol için ayrı ayrı ticker verisi al
        for (const item of activeWatchlist) {
          try {
            const ticker = await watchlistAPI.getTicker(item.symbol);
            
            if (ticker && ticker.symbol) {
              setTickerData(prev => ({
                ...prev,
                [ticker.symbol]: {
                  price: ticker.lastPrice || '0',
                  priceChangePercent: ticker.priceChangePercent || '0'
                }
              }));
            }
          } catch (symbolError) {
            console.error(`Error fetching ticker for ${item.symbol}:`, symbolError);
            // Hata durumunda bu sembolü atla ve diğerlerine devam et
          }
        }
      } catch (err) {
        console.error('Error loading ticker data:', err);
      }
    };
    
    // İlk yükleme
    if (watchlist.length > 0) {
      fetchTickerData();
      
      // 5 saniyede bir güncelle
      const interval = setInterval(fetchTickerData, 5000);
      return () => clearInterval(interval);
    }
  }, [watchlist, activeTab]);
  
  // Add symbol
  const handleAddSymbol = async (e) => {
    e.preventDefault();
    
    if (!newSymbol.trim()) return;
    
    try {
      // Sembolü büyük harfe çevir
      const symbolUpper = newSymbol.toUpperCase();
      
      // Sembol USDT ile bitmiyorsa ekle
      const formattedSymbol = symbolUpper.endsWith('USDT') ? symbolUpper : `${symbolUpper}USDT`;
      
      // Yeni sembolü watchlist'e ekle
      const newSymbolObj = {
        symbol: formattedSymbol,
        listId: activeTab,
        addedAt: new Date().toISOString()
      };
      
      // Mevcut watchlist'e ekle
      const updatedWatchlist = [...watchlist, newSymbolObj];
      setWatchlist(updatedWatchlist);
      
      // localStorage'a kaydet
      saveWatchlistToLocalStorage(updatedWatchlist);
      
      // Backend'e kaydetmeyi dene (opsiyonel)
      try {
        await watchlistAPI.addSymbol(formattedSymbol, activeTab);
        console.log(`Symbol ${formattedSymbol} added to backend`);
      } catch (apiErr) {
        console.error('Backend API error (continuing with local storage):', apiErr);
      }
      
      setNewSymbol('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding symbol:', err);
      alert(`Error adding symbol: ${err.message}`);
    }
  };
  
  // Remove symbol
  const handleRemoveSymbol = async (symbol) => {
    try {
      // Önce yerel listeden kaldır
      const updatedWatchlist = watchlist.filter(item => 
        !(item.symbol === symbol && item.listId == activeTab)
      );
      
      // State'i güncelle
      setWatchlist(updatedWatchlist);
      
      // localStorage'a kaydet
      saveWatchlistToLocalStorage(updatedWatchlist);
      
      // Backend'den kaldırmayı dene (opsiyonel)
      try {
        await watchlistAPI.removeSymbol(symbol, activeTab);
        console.log(`Symbol ${symbol} removed from backend`);
      } catch (apiErr) {
        console.error('Backend API error (continuing with local storage):', apiErr);
      }
    } catch (err) {
      console.error('Error removing symbol:', err);
      alert(`Error removing symbol: ${err.message}`);
    }
  };
  
  // Open position with kısaltılmış komut (l/s)
  const handleOpenPosition = async (symbol, amount, side) => {
    if (processingOrder) return;
    
    try {
      setProcessingOrder(true);
      setOrderSymbol(symbol);
      
      // Kısaltılmış komut kullan (l/s)
      const shortCommand = side === 'long' ? 'l' : 's';
      const symbolBase = symbol.replace('USDT', '');
      const command = `${shortCommand} ${symbolBase} ${amount}`;
      
      console.log(`Executing command: ${command}`);
      const result = await terminalAPI.executeCommand(command);
      
      console.log('Position opened:', result);
      
    } catch (err) {
      console.error('Error opening position:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingOrder(false);
      setOrderSymbol('');
    }
  };
  
  // Get appropriate decimal precision for the symbol
  const getDecimalPrecision = (symbol) => {
    // Set different decimal precision based on different symbols
    if (symbol.endsWith('USDT') || symbol.endsWith('BUSD') || symbol.endsWith('USDC')) {
      // High value coins (BTC, ETH, etc.)
      if (symbol.startsWith('BTC') || symbol.startsWith('ETH')) {
        return 2; // 12345.67
      }
      // Medium value coins (SOL, AVAX, etc.)
      else if (symbol.startsWith('SOL') || symbol.startsWith('AVAX') || symbol.startsWith('DOT')) {
        return 3; // 123.456
      }
      // Low value coins (XRP, ADA, etc.)
      else if (symbol.startsWith('XRP') || symbol.startsWith('ADA') || symbol.startsWith('MATIC')) {
        return 4; // 1.2345
      }
      // Very low value coins (SHIB, DOGE, etc.)
      else if (symbol.startsWith('SHIB') || symbol.startsWith('DOGE')) {
        return 6; // 0.001234
      }
    }
    
    // Default precision
    return 4;
  };
  
  // Open settings modal
  const openSettingsModal = () => {
    setFormSettings({...buttonSettings});
    setShowSettingsModal(true);
  };
  
  // Close settings modal
  const closeSettingsModal = () => {
    setShowSettingsModal(false);
  };
  
  // Handle input change in the settings form
  const handleSettingsChange = (type, index, field, value) => {
    setFormSettings(prev => {
      const newSettings = {...prev};
      
      if (field === 'amount') {
        // Remove any non-numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');
        // Convert to number or use 0 if empty
        const numValue = numericValue === '' ? 0 : parseInt(numericValue, 10);
        newSettings[`${type}Amounts`][index] = numValue;
        
        // Automatically update the label based on the amount
        if (numValue >= 1000) {
          newSettings[`${type}Labels`][index] = `${Math.floor(numValue / 1000)}K`;
        } else {
          newSettings[`${type}Labels`][index] = numValue.toString();
        }
      } else if (field === 'label') {
        newSettings[`${type}Labels`][index] = value;
      }
      
      return newSettings;
    });
  };
  
  // Save settings
  const saveSettings = () => {
    setButtonSettings(formSettings);
    saveButtonSettings(formSettings);
    closeSettingsModal();
  };
  
  // Change active tab
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };
  
  return (
    <WatchlistContainer>
      <WatchlistHeader>
        <Title>Watch List</Title>
        <div style={{ display: 'flex', gap: '8px' }}>
          <SettingsButton onClick={openSettingsModal}>
            ⚙️
          </SettingsButton>
          <AddButton onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '×' : '+'}
          </AddButton>
        </div>
      </WatchlistHeader>
      
      <TabsContainer>
        <Tab active={activeTab === 1} onClick={() => handleTabChange(1)}>List 1</Tab>
        <Tab active={activeTab === 2} onClick={() => handleTabChange(2)}>List 2</Tab>
        <Tab active={activeTab === 3} onClick={() => handleTabChange(3)}>List 3</Tab>
      </TabsContainer>
      
      <AddSymbolForm isVisible={showAddForm}>
        <SymbolInput
          type="text"
          placeholder="Symbol (e.g. BTCUSDT)"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
        />
        <SubmitButton onClick={handleAddSymbol}>Add</SubmitButton>
      </AddSymbolForm>
      
      {loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : error ? (
        <EmptyState>{error}</EmptyState>
      ) : (
        <SymbolList>
          {watchlist
            .filter(item => item.listId == activeTab)
            .map(item => {
              const symbolStr = item.symbol;
              const ticker = tickerData[symbolStr] || { price: '0', priceChangePercent: '0' };
              const isPositive = parseFloat(ticker.priceChangePercent) >= 0;
              const precision = getDecimalPrecision(symbolStr);
              const isProcessing = processingOrder && orderSymbol === symbolStr;
              
              return (
                <SymbolItem key={`${symbolStr}-${item.listId}`}>
                  <SymbolHeader>
                    <SymbolInfo>
                      <RemoveButton onClick={() => handleRemoveSymbol(symbolStr)}>--</RemoveButton>
                      <SymbolName>{symbolStr}</SymbolName>
                      <PriceChange isPositive={isPositive}>
                        %{Math.abs(parseFloat(ticker.priceChangePercent)).toFixed(1)}{isPositive ? '' : '-'}
                      </PriceChange>
                    </SymbolInfo>
                    <Price>{parseFloat(ticker.price).toFixed(precision)}</Price>
                  </SymbolHeader>
                  
                  <ButtonsContainer>
                    <ButtonGroup>
                      {buttonSettings.longAmounts.map((amount, index) => (
                        <LongButton 
                          key={`${symbolStr}-long-${amount}`}
                          disabled={isProcessing}
                          onClick={() => handleOpenPosition(symbolStr, amount, 'long')}
                        >
                          {buttonSettings.longLabels[index]}
                        </LongButton>
                      ))}
                    </ButtonGroup>
                    
                    <ButtonGroup>
                      {buttonSettings.shortAmounts.map((amount, index) => (
                        <ShortButton 
                          key={`${symbolStr}-short-${amount}`}
                          disabled={isProcessing}
                          onClick={() => handleOpenPosition(symbolStr, amount, 'short')}
                        >
                          {buttonSettings.shortLabels[index]}
                        </ShortButton>
                      ))}
                    </ButtonGroup>
                  </ButtonsContainer>
                </SymbolItem>
              );
            })}
          
          {watchlist.filter(item => item.listId == activeTab).length === 0 && (
            <EmptyState>
              Watchlist is empty. Click + button to add symbols.
            </EmptyState>
          )}
          
          {/* Empty space at the bottom for better scrolling */}
          <div style={{ height: '16px' }}></div>
        </SymbolList>
      )}
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Quick Trading Button Settings</ModalTitle>
              <CloseModalButton onClick={closeSettingsModal}>×</CloseModalButton>
            </ModalHeader>
            
            <FormGroup>
              <FormLabel>LONG Button Values</FormLabel>
              {formSettings.longAmounts.map((amount, index) => (
                <InputGroup key={`long-${index}`}>
                  <FormInput
                    type="text"
                    placeholder="Amount (USDT)"
                    value={amount}
                    onChange={(e) => handleSettingsChange('long', index, 'amount', e.target.value)}
                  />
                  <FormInput
                    type="text"
                    placeholder="Label"
                    value={formSettings.longLabels[index]}
                    onChange={(e) => handleSettingsChange('long', index, 'label', e.target.value)}
                  />
                </InputGroup>
              ))}
            </FormGroup>
            
            <FormGroup>
              <FormLabel>SHORT Button Values</FormLabel>
              {formSettings.shortAmounts.map((amount, index) => (
                <InputGroup key={`short-${index}`}>
                  <FormInput
                    type="text"
                    placeholder="Amount (USDT)"
                    value={amount}
                    onChange={(e) => handleSettingsChange('short', index, 'amount', e.target.value)}
                  />
                  <FormInput
                    type="text"
                    placeholder="Label"
                    value={formSettings.shortLabels[index]}
                    onChange={(e) => handleSettingsChange('short', index, 'label', e.target.value)}
                  />
                </InputGroup>
              ))}
            </FormGroup>
            
            <SaveButton onClick={saveSettings}>Save Settings</SaveButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </WatchlistContainer>
  );
};

export default Watchlist; 