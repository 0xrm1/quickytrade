import { useState, useCallback } from 'react';
import { Position, InputValues, PercentageValues, ShowPercentInput, ShowPercentSelector } from '../types';

interface UseInputHandlersReturn {
  percentageValues: PercentageValues;
  showPercentInput: ShowPercentInput;
  showPercentSelector: ShowPercentSelector;
  handleInputChange: (symbol: string, field: string, value: string) => void;
  togglePercentInput: (symbol: string) => void;
  togglePercentSelector: (symbol: string) => void;
  handleQuickPercentSelect: (symbol: string, percent: number) => void;
  handlePercentageInputChange: (symbol: string, value: string) => void;
}

export const useInputHandlers = (
  positions: Position[],
  inputValues: InputValues,
  setInputValues: React.Dispatch<React.SetStateAction<InputValues>>
): UseInputHandlersReturn => {
  const [percentageValues, setPercentageValues] = useState<PercentageValues>({});
  const [showPercentInput, setShowPercentInput] = useState<ShowPercentInput>({});
  const [showPercentSelector, setShowPercentSelector] = useState<ShowPercentSelector>({});

  // Input değerini güncelle
  const handleInputChange = useCallback((symbol: string, field: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        [field]: value
      }
    }));
  }, [setInputValues]);
  
  // Yüzde input gösterimini aç/kapat
  const togglePercentInput = useCallback((symbol: string) => {
    setShowPercentInput(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  }, []);
  
  // Yüzde seçici gösterimini aç/kapat
  const togglePercentSelector = useCallback((symbol: string) => {
    setShowPercentSelector(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  }, []);
  
  // Hızlı yüzde seçimi
  const handleQuickPercentSelect = useCallback((symbol: string, percent: number) => {
    const position = positions.find(p => p.symbol === symbol);
    if (!position) return;
    
    const totalQuantity = Math.abs(parseFloat(position.positionAmt));
    const calculatedQuantity = (totalQuantity * percent) / 100;
    
    // Quantity değerini güncelle
    setInputValues(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        quantity: calculatedQuantity.toString()
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
  }, [positions, setInputValues]);
  
  // Yüzde input değerini güncelle
  const handlePercentageInputChange = useCallback((symbol: string, value: string) => {
    // Değer 0-100 arasında olmalı
    let percentValue = parseInt(value);
    if (isNaN(percentValue)) percentValue = 0;
    if (percentValue < 0) percentValue = 0;
    if (percentValue > 100) percentValue = 100;
    
    setPercentageValues(prev => ({
      ...prev,
      [symbol]: percentValue
    }));
    
    // Eğer geçerli bir yüzde değeri varsa, quantity'yi güncelle
    if (!isNaN(percentValue)) {
      const position = positions.find(p => p.symbol === symbol);
      if (!position) return;
      
      const totalQuantity = Math.abs(parseFloat(position.positionAmt));
      const calculatedQuantity = (totalQuantity * percentValue) / 100;
      
      setInputValues(prev => ({
        ...prev,
        [symbol]: {
          ...prev[symbol],
          quantity: calculatedQuantity.toString()
        }
      }));
    }
  }, [positions, setInputValues]);

  return {
    percentageValues,
    showPercentInput,
    showPercentSelector,
    handleInputChange,
    togglePercentInput,
    togglePercentSelector,
    handleQuickPercentSelect,
    handlePercentageInputChange
  };
}; 