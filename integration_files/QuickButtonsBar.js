import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { quickButtonsAPI, terminalAPI } from '../services/api';

const QuickButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #080f1a;
  padding: 12px 16px;
  border-bottom: 1px solid #1f2937;
  overflow-x: auto;
  white-space: nowrap;
`;

const Title = styled.h3`
  margin: 0;
  padding: 8px 16px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  background-color: #4f46e5;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-right: 12px;
  white-space: nowrap;
`;

const AddButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid #4f46e5;
  background-color: transparent;
  color: #4f46e5;
  font-weight: 600;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.3s;
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
    background: rgba(79, 70, 229, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }
  
  &:focus:not(:active)::after {
    animation: ripple 1s ease-out;
  }
  
  &:hover {
    background-color: rgba(79, 70, 229, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #1f2937;
    border-radius: 4px;
  }
`;

const ButtonWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const QuickButton = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
  background-color: ${props => props.side === 'long' ? '#10b981' : '#ef4444'};
  color: white;
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
    opacity: 0.9;
    background-color: ${props => props.side === 'long' ? '#0ea5e9' : '#dc2626'};
  }
  
  &:active {
    transform: scale(0.97);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RemoveButton = styled.button`
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background-color: rgba(0, 0, 0, 0.3);
  color: #f1f5f9;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(239, 68, 68, 0.9);
    color: white;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #1f2937;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: white;
  font-size: 18px;
`;

const CloseModalButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 24px;
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
  color: #d1d5db;
  font-size: 14px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #4b5563;
  background-color: #374151;
  color: white;
  font-size: 14px;
  margin-bottom: 12px;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d1d5db;
  font-size: 14px;
  cursor: pointer;
`;

const RadioInput = styled.input`
  cursor: pointer;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: none;
  background-color: #4f46e5;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #4338ca;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuickButtonsBar = () => {
  const [quickButtons, setQuickButtons] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newButton, setNewButton] = useState({
    symbol: '',
    amount: '',
    side: 'long'
  });
  const [processingOrder, setProcessingOrder] = useState(false);
  const [processingButtonId, setProcessingButtonId] = useState(null);
  
  // Load quick buttons from localStorage
  const loadQuickButtonsFromLocalStorage = () => {
    try {
      const savedButtons = localStorage.getItem('quickButtons');
      if (savedButtons) {
        return JSON.parse(savedButtons);
      }
    } catch (err) {
      console.error('Error loading quick buttons from localStorage:', err);
    }
    return [];
  };
  
  // Save quick buttons to localStorage
  const saveQuickButtonsToLocalStorage = (buttons) => {
    try {
      localStorage.setItem('quickButtons', JSON.stringify(buttons));
    } catch (err) {
      console.error('Error saving quick buttons to localStorage:', err);
    }
  };
  
  // Sync quick buttons with backend
  const syncQuickButtonsWithBackend = async (buttons) => {
    try {
      await quickButtonsAPI.syncQuickButtons(buttons);
    } catch (err) {
      console.error('Error syncing quick buttons with backend:', err);
    }
  };
  
  // Load quick buttons
  useEffect(() => {
    const fetchQuickButtons = async () => {
      try {
        // Önce localStorage'dan yükle
        const localButtons = loadQuickButtonsFromLocalStorage();
        
        if (localButtons && localButtons.length > 0) {
          // localStorage'dan yüklenen veriyi kullan
          setQuickButtons(localButtons);
          
          // Backend ile senkronize et
          await syncQuickButtonsWithBackend(localButtons);
        } else {
          try {
            // Backend'den yükle
            const buttons = await quickButtonsAPI.getQuickButtons();
            setQuickButtons(buttons);
            
            // localStorage'a kaydet
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
  }, []);
  
  // Open add modal
  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setNewButton({
      symbol: '',
      amount: '',
      side: 'long'
    });
  };
  
  // Close add modal
  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewButton(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add new quick button
  const handleAddQuickButton = async () => {
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
      const buttonData = {
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
    } catch (err) {
      console.error('Error adding quick button:', err);
      alert(`Error: ${err.message}`);
    }
  };
  
  // Remove quick button
  const handleRemoveQuickButton = async (id, e) => {
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
    } catch (err) {
      console.error('Error removing quick button:', err);
      alert(`Error: ${err.message}`);
    }
  };
  
  // Execute quick button action
  const handleExecuteQuickButton = async (button) => {
    if (processingOrder) return;
    
    try {
      setProcessingOrder(true);
      setProcessingButtonId(button.id);
      
      // Kısaltılmış komut kullan (l/s)
      const shortCommand = button.side === 'long' ? 'l' : 's';
      const symbolBase = button.symbol.replace('USDT', '');
      const command = `${shortCommand} ${symbolBase} ${button.amount}`;
      
      console.log(`Executing command: ${command}`);
      const result = await terminalAPI.executeCommand(command);
      
      console.log('Position opened:', result);
      
    } catch (err) {
      console.error('Error executing quick button:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingOrder(false);
      setProcessingButtonId(null);
    }
  };
  
  // Format button label
  const formatButtonLabel = (button) => {
    const symbolBase = button.symbol.replace('USDT', '');
    const amountStr = button.amount >= 1000 
      ? `${(button.amount / 1000).toFixed(1)}K` 
      : button.amount.toString();
    
    return `${symbolBase} ${amountStr}`;
  };
  
  return (
    <QuickButtonsContainer>
      <Title>Quick Positions</Title>
      <AddButton onClick={handleOpenAddModal}>+</AddButton>
      
      <ButtonsWrapper>
        {quickButtons.map(button => (
          <ButtonWrapper key={button.id}>
            <QuickButton
              side={button.side}
              onClick={() => handleExecuteQuickButton(button)}
              disabled={processingOrder && processingButtonId === button.id}
            >
              <ButtonContent>
                {formatButtonLabel(button)}
              </ButtonContent>
            </QuickButton>
            <RemoveButton 
              onClick={(e) => handleRemoveQuickButton(button.id, e)}
              title="Remove button"
            >
              ×
            </RemoveButton>
          </ButtonWrapper>
        ))}
      </ButtonsWrapper>
      
      {showAddModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Add Quick Button</ModalTitle>
              <CloseModalButton onClick={handleCloseAddModal}>×</CloseModalButton>
            </ModalHeader>
            
            <FormGroup>
              <FormLabel>Symbol</FormLabel>
              <FormInput
                type="text"
                name="symbol"
                placeholder="E.g. BTC or BTCUSDT"
                value={newButton.symbol}
                onChange={handleInputChange}
              />
            </FormGroup>
            
            <FormGroup>
              <FormLabel>Amount (USDT)</FormLabel>
              <FormInput
                type="number"
                name="amount"
                placeholder="E.g. 1000"
                value={newButton.amount}
                onChange={handleInputChange}
              />
            </FormGroup>
            
            <FormGroup>
              <FormLabel>Side</FormLabel>
              <RadioGroup>
                <RadioLabel>
                  <RadioInput
                    type="radio"
                    name="side"
                    value="long"
                    checked={newButton.side === 'long'}
                    onChange={handleInputChange}
                  />
                  Long
                </RadioLabel>
                <RadioLabel>
                  <RadioInput
                    type="radio"
                    name="side"
                    value="short"
                    checked={newButton.side === 'short'}
                    onChange={handleInputChange}
                  />
                  Short
                </RadioLabel>
              </RadioGroup>
            </FormGroup>
            
            <SaveButton onClick={handleAddQuickButton}>Add</SaveButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </QuickButtonsContainer>
  );
};

export default QuickButtonsBar; 