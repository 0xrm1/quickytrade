import { useState, useEffect, useCallback } from 'react';
import { QuickButtonType, NewButtonType } from '../types';
import { quickButtonsAPI, terminalAPI } from '../../../services/api';

interface UseQuickButtonsReturn {
  quickButtons: QuickButtonType[];
  processingOrder: boolean;
  processingButtonId: string | null;
  newButton: NewButtonType;
  showAddModal: boolean;
  handleOpenAddModal: () => void;
  handleCloseAddModal: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddQuickButton: () => Promise<void>;
  handleRemoveQuickButton: (id: string, e: React.MouseEvent) => Promise<void>;
  handleExecuteQuickButton: (button: QuickButtonType) => Promise<void>;
}

export const useQuickButtons = (): UseQuickButtonsReturn => {
  const [quickButtons, setQuickButtons] = useState<QuickButtonType[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newButton, setNewButton] = useState<NewButtonType>({
    symbol: '',
    amount: '',
    side: 'long'
  });
  const [processingOrder, setProcessingOrder] = useState<boolean>(false);
  const [processingButtonId, setProcessingButtonId] = useState<string | null>(null);
  
  // Load quick buttons from localStorage
  const loadQuickButtonsFromLocalStorage = useCallback(() => {
    try {
      const savedButtons = localStorage.getItem('quickButtons');
      if (savedButtons) {
        return JSON.parse(savedButtons);
      }
    } catch (err) {
      console.error('Error loading quick buttons from localStorage:', err);
    }
    return [];
  }, []);
  
  // Save quick buttons to localStorage
  const saveQuickButtonsToLocalStorage = useCallback((buttons: QuickButtonType[]) => {
    try {
      localStorage.setItem('quickButtons', JSON.stringify(buttons));
    } catch (err) {
      console.error('Error saving quick buttons to localStorage:', err);
    }
  }, []);
  
  // Sync quick buttons with backend
  const syncQuickButtonsWithBackend = useCallback(async (buttons: QuickButtonType[]) => {
    try {
      await quickButtonsAPI.syncQuickButtons(buttons);
    } catch (err) {
      console.error('Error syncing quick buttons with backend:', err);
    }
  }, []);
  
  // Load quick buttons
  useEffect(() => {
    const fetchQuickButtons = async () => {
      try {
        // First load from localStorage
        const localButtons = loadQuickButtonsFromLocalStorage();
        
        if (localButtons && localButtons.length > 0) {
          // Use data loaded from localStorage
          setQuickButtons(localButtons);
          
          // Sync with backend
          await syncQuickButtonsWithBackend(localButtons);
        } else {
          try {
            // Load from backend
            const buttons = await quickButtonsAPI.getQuickButtons();
            setQuickButtons(buttons);
            
            // Save to localStorage
            saveQuickButtonsToLocalStorage(buttons);
          } catch (apiErr) {
            console.error('API error, using empty buttons list:', apiErr);
            setQuickButtons([]);
          }
        }
      } catch (err) {
        console.error('Error loading quick buttons:', err);
      }
    };
    
    fetchQuickButtons();
  }, [loadQuickButtonsFromLocalStorage, saveQuickButtonsToLocalStorage, syncQuickButtonsWithBackend]);
  
  // Open add modal
  const handleOpenAddModal = useCallback(() => {
    setShowAddModal(true);
    setNewButton({
      symbol: '',
      amount: '',
      side: 'long'
    });
  }, []);
  
  // Close add modal
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);
  
  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewButton(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Add new quick button
  const handleAddQuickButton = useCallback(async () => {
    try {
      // Validate inputs
      if (!newButton.symbol.trim()) {
        alert('Please enter a symbol');
        return;
      }
      
      if (!newButton.amount || isNaN(parseFloat(newButton.amount)) || parseFloat(newButton.amount) <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      // Format symbol
      const formattedSymbol = newButton.symbol.toUpperCase();
      const finalSymbol = formattedSymbol.endsWith('USDT') ? formattedSymbol : `${formattedSymbol}USDT`;
      
      // Create new button
      const buttonData: QuickButtonType = {
        id: Date.now().toString(),
        symbol: finalSymbol,
        amount: parseFloat(newButton.amount),
        side: newButton.side,
        createdAt: new Date().toISOString()
      };
      
      // Update state
      const updatedButtons = [...quickButtons, buttonData];
      setQuickButtons(updatedButtons);
      
      // Save to localStorage
      saveQuickButtonsToLocalStorage(updatedButtons);
      
      // Try to save to backend
      try {
        await quickButtonsAPI.addQuickButton(finalSymbol, parseFloat(newButton.amount), newButton.side);
      } catch (apiErr) {
        console.error('Backend API error (continuing with local storage):', apiErr);
      }
      
      // Close modal
      handleCloseAddModal();
    } catch (err: any) {
      console.error('Error adding quick button:', err);
      alert(`Error: ${err.message}`);
    }
  }, [newButton, quickButtons, saveQuickButtonsToLocalStorage, handleCloseAddModal]);
  
  // Remove quick button
  const handleRemoveQuickButton = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the button click
    
    try {
      // Update state
      const updatedButtons = quickButtons.filter(button => button.id !== id);
      setQuickButtons(updatedButtons);
      
      // Save to localStorage
      saveQuickButtonsToLocalStorage(updatedButtons);
      
      // Try to remove from backend
      try {
        await quickButtonsAPI.removeQuickButton(id);
      } catch (apiErr) {
        console.error('Backend API error (continuing with local storage):', apiErr);
      }
    } catch (err: any) {
      console.error('Error removing quick button:', err);
      alert(`Error: ${err.message}`);
    }
  }, [quickButtons, saveQuickButtonsToLocalStorage]);
  
  // Execute quick button action
  const handleExecuteQuickButton = useCallback(async (button: QuickButtonType) => {
    if (processingOrder) return;
    
    try {
      setProcessingOrder(true);
      setProcessingButtonId(button.id);
      
      // Use shorthand command (l/s)
      const shortCommand = button.side === 'long' ? 'l' : 's';
      const symbolBase = button.symbol.replace('USDT', '');
      const command = `${shortCommand} ${symbolBase} ${button.amount}`;
      
      console.log(`Executing command: ${command}`);
      const result = await terminalAPI.executeCommand(command);
      
      console.log('Position opened:', result);
      
    } catch (err: any) {
      console.error('Error executing quick button:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingOrder(false);
      setProcessingButtonId(null);
    }
  }, [processingOrder]);
  
  return {
    quickButtons,
    processingOrder,
    processingButtonId,
    newButton,
    showAddModal,
    handleOpenAddModal,
    handleCloseAddModal,
    handleInputChange,
    handleAddQuickButton,
    handleRemoveQuickButton,
    handleExecuteQuickButton
  };
}; 