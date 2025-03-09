import { useState, useEffect } from 'react';
import { watchlistAPI, terminalAPI } from '../../../services/api';
import { WatchlistItem, TickerData, ButtonSettings } from '../types';

/**
 * Watchlist verilerini ve işlevlerini yöneten hook
 */
export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [tickerData, setTickerData] = useState<TickerData>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderSymbol, setOrderSymbol] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState(1); // Active tab (1, 2, 3)
  
  // Load button settings from localStorage or use defaults
  const getButtonSettings = (): ButtonSettings => {
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
  
  const [buttonSettings, setButtonSettings] = useState<ButtonSettings>(getButtonSettings());
  const [formSettings, setFormSettings] = useState<ButtonSettings>({...buttonSettings});
  
  // Save settings to localStorage
  const saveButtonSettings = (settings: ButtonSettings): void => {
    try {
      localStorage.setItem('watchlistButtonSettings', JSON.stringify(settings));
    } catch (err) {
      console.error('Error saving button settings:', err);
    }
  };
  
  // Load watchlist from localStorage
  const loadWatchlistFromLocalStorage = (): WatchlistItem[] => {
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
  const saveWatchlistToLocalStorage = (list: WatchlistItem[]): void => {
    try {
      localStorage.setItem('watchlist', JSON.stringify(list));
      console.log('Saved watchlist to localStorage:', list);
    } catch (err) {
      console.error('Error saving watchlist to localStorage:', err);
    }
  };
  
  // Sync watchlist with backend
  const syncWatchlistWithBackend = async (list: WatchlistItem[]): Promise<void> => {
    try {
      await watchlistAPI.syncWatchlist(list);
      console.log('Synced watchlist with backend');
    } catch (err) {
      console.error('Error syncing watchlist with backend:', err);
      // Continue even if there's an error, just log it
    }
  };
  
  // Load watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setLoading(true);
        
        // First load from localStorage
        const localWatchlist = loadWatchlistFromLocalStorage();
        
        if (localWatchlist && localWatchlist.length > 0) {
          // Use data loaded from localStorage
          setWatchlist(localWatchlist);
          
          // Sync with backend (continue even if there's an error)
          try {
            await syncWatchlistWithBackend(localWatchlist);
          } catch (syncErr) {
            console.error('Backend sync error (non-critical):', syncErr);
          }
        } else {
          try {
            // Load from backend
            const data = await watchlistAPI.getWatchlist(activeTab);
            
            // Create symbol list
            const symbols = Array.isArray(data) && data.length > 0 
              ? data.map((item: any) => typeof item === 'object' ? item : { symbol: item, listId: activeTab })
              : [];
            
            setWatchlist(symbols);
            
            // Save to localStorage
            saveWatchlistToLocalStorage(symbols);
          } catch (apiErr) {
            console.error('API error, using empty watchlist:', apiErr);
            // Use empty list if API fails
            setWatchlist([]);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error in fetchWatchlist:', err);
        setError('Error loading watchlist. Using local data if available.');
        
        // Try loading from localStorage in case of error
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
        // Filter symbols for active tab
        const activeWatchlist = watchlist.filter(item => item.listId === activeTab);
        
        if (activeWatchlist.length === 0) return;
        
        console.log('Fetching ticker data for:', activeWatchlist.map(item => item.symbol));
        
        // Get ticker data for each symbol separately
        for (const item of activeWatchlist) {
          try {
            const ticker = await watchlistAPI.getTicker(item.symbol);
            
            if (ticker && ticker.symbol) {
              setTickerData(prev => ({
                ...prev,
                [ticker.symbol]: {
                  price: ticker.lastPrice || ticker.price || '0',
                  priceChangePercent: ticker.priceChangePercent || '0'
                }
              }));
            }
          } catch (symbolError) {
            console.error(`Error fetching ticker for ${item.symbol}:`, symbolError);
            // Skip this symbol and continue with others
          }
        }
      } catch (err) {
        console.error('Error loading ticker data:', err);
      }
    };
    
    // Initial load
    if (watchlist.length > 0) {
      fetchTickerData();
      
      // Update every 5 seconds
      const interval = setInterval(fetchTickerData, 5000);
      return () => clearInterval(interval);
    }
  }, [watchlist, activeTab]);
  
  // Add symbol
  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSymbol.trim()) return;
    
    try {
      // Convert symbol to uppercase
      const symbolUpper = newSymbol.toUpperCase();
      
      // Add USDT if not already present
      const formattedSymbol = symbolUpper.endsWith('USDT') ? symbolUpper : `${symbolUpper}USDT`;
      
      // Add new symbol to watchlist
      const newSymbolObj: WatchlistItem = {
        symbol: formattedSymbol,
        listId: activeTab,
        addedAt: new Date().toISOString()
      };
      
      // Add to current watchlist
      const updatedWatchlist = [...watchlist, newSymbolObj];
      setWatchlist(updatedWatchlist);
      
      // Save to localStorage
      saveWatchlistToLocalStorage(updatedWatchlist);
      
      // Try saving to backend (optional)
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
      alert(`Error adding symbol: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Remove symbol
  const handleRemoveSymbol = async (symbol: string) => {
    try {
      // First remove from local list
      const updatedWatchlist = watchlist.filter(item => 
        !(item.symbol === symbol && item.listId === activeTab)
      );
      
      // Update state
      setWatchlist(updatedWatchlist);
      
      // Save to localStorage
      saveWatchlistToLocalStorage(updatedWatchlist);
      
      // Try removing from backend (optional)
      try {
        await watchlistAPI.removeSymbol(symbol, activeTab);
        console.log(`Symbol ${symbol} removed from backend`);
      } catch (apiErr) {
        console.error('Backend API error (continuing with local storage):', apiErr);
      }
    } catch (err) {
      console.error('Error removing symbol:', err);
      alert(`Error removing symbol: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Open position with shortened command (l/s)
  const handleOpenPosition = async (symbol: string, amount: number, side: 'long' | 'short') => {
    if (processingOrder) return;
    
    try {
      setProcessingOrder(true);
      setOrderSymbol(symbol);
      
      // Use shortened command (l/s)
      const shortCommand = side === 'long' ? 'l' : 's';
      const symbolBase = symbol.replace('USDT', '');
      const command = `${shortCommand} ${symbolBase} ${amount}`;
      
      console.log(`Executing command: ${command}`);
      const result = await terminalAPI.executeCommand(command);
      
      console.log('Position opened:', result);
      
    } catch (err) {
      console.error('Error opening position:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessingOrder(false);
      setOrderSymbol('');
    }
  };
  
  // Get appropriate decimal precision for the symbol
  const getDecimalPrecision = (symbol: string): number => {
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
  const handleSettingsChange = (type: 'long' | 'short', index: number, field: 'amount' | 'label', value: string) => {
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
  const handleTabChange = (tabId: number) => {
    setActiveTab(tabId);
  };
  
  return {
    watchlist,
    tickerData,
    showAddForm,
    setShowAddForm,
    newSymbol,
    setNewSymbol,
    loading,
    error,
    processingOrder,
    orderSymbol,
    showSettingsModal,
    activeTab,
    buttonSettings,
    formSettings,
    handleAddSymbol,
    handleRemoveSymbol,
    handleOpenPosition,
    getDecimalPrecision,
    openSettingsModal,
    closeSettingsModal,
    handleSettingsChange,
    saveSettings,
    handleTabChange
  };
}; 