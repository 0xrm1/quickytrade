import { useState, useEffect, useCallback } from 'react';
import { positionsAPI } from '../../../services/api';
import { Position, InputValues } from '../types';
import { getSymbolPricePrecision } from '../utils';

interface UsePositionsReturn {
  positions: Position[];
  loading: boolean;
  error: string | null;
  initialLoadComplete: boolean;
  inputValues: InputValues;
  setInputValues: React.Dispatch<React.SetStateAction<InputValues>>;
  fetchPositions: () => Promise<void>;
  fetchPositionsUpdate: () => Promise<void>;
  handleClosePosition: (symbol: string) => Promise<void>;
  handlePartialClosePosition: (symbol: string) => Promise<void>;
  handleCloseAllPositions: () => Promise<void>;
  handleLimitClosePosition: (symbol: string, side: string) => Promise<void>;
  handleStopClosePosition: (symbol: string, side: string) => Promise<void>;
  handleStopEntryOrder: (symbol: string) => Promise<void>;
  handlePercentStopOrder: (symbol: string) => Promise<void>;
  handlePercentTwoStopOrder: (symbol: string) => Promise<void>;
}

export const usePositions = (): UsePositionsReturn => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [inputValues, setInputValues] = useState<InputValues>({});

  // İlk kez pozisyonları yükle
  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await positionsAPI.getPositions();
      console.log('Positions were loaded:', data);
      
      const positionsArray = data.positions || [];
      
      // Input değerlerini sadece ilk kez veya yeni pozisyonlar için ayarla
      // Mevcut pozisyonlar için kullanıcının girdiği değerleri koru
      setInputValues(prevInputValues => {
        const newInputValues = { ...prevInputValues };
        
        positionsArray.forEach((position: Position) => {
          const symbol = position.symbol;
          // Eğer bu sembol için henüz input değeri yoksa, varsayılan değeri ayarla
          if (!newInputValues[symbol]) {
            const markPrice = parseFloat(position.markPrice);
            const precision = getSymbolPricePrecision(symbol);
            
            newInputValues[symbol] = {
              price: markPrice.toFixed(precision),
              quantity: Math.abs(parseFloat(position.positionAmt)).toString()
            };
          }
        });
        
        return newInputValues;
      });
      
      setPositions(positionsArray);
      setInitialLoadComplete(true);
      setError(null);
    } catch (err) {
      console.error('Position Loading Error:', err);
      setError('Please make your API connection to see your positions.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Pozisyonları güncelle (loading durmunu değiştirmeden)
  const fetchPositionsUpdate = useCallback(async () => {
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
      
      // Pozisyonları güncelle ama input değerlerini koruyarak
      setPositions(prevPositions => {
        // Mevcut tüm pozisyonlar için bir kopya oluştur
        const existingPositionsMap: Record<string, Position> = {};
        prevPositions.forEach(pos => {
          existingPositionsMap[pos.symbol] = pos;
        });
        
        // Yeni pozisyonlarla güncelle
        const updatedPositions: Position[] = [];
        const newSymbols: string[] = [];
        
        positionsArray.forEach((newPos: Position) => {
          newSymbols.push(newPos.symbol);
          updatedPositions.push(newPos);
          
          // SADECE YENİ SEMBOLLER için input değerleri oluştur
          // Mevcut sembollerin input değerlerini güncelleme
          if (!existingPositionsMap[newPos.symbol] && !inputValues[newPos.symbol]) {
            // Yeni pozisyon için ilk kez input değerlerini ayarla
            const markPrice = parseFloat(newPos.markPrice);
            const symbol = newPos.symbol;
            const precision = getSymbolPricePrecision(symbol);
            
            setInputValues(prev => ({
              ...prev,
              [symbol]: {
                price: markPrice.toFixed(precision),
                quantity: Math.abs(parseFloat(newPos.positionAmt)).toString()
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
      console.error('Position update error:', err);
      // Hata olsa bile mevcut pozisyonları silme
    }
  }, [positions, initialLoadComplete, inputValues, fetchPositions]);

  // Pozisyonu kapat
  const handleClosePosition = useCallback(async (symbol: string) => {
    try {
      await positionsAPI.closePosition(symbol);
      // Pozisyonları yeniden yükle (input değerlerini koruyarak)
      fetchPositionsUpdate();
    } catch (err) {
      console.error('Error closing a position:', err);
    }
  }, [fetchPositionsUpdate]);
  
  // Kısmi pozisyon kapatma (Market)
  const handlePartialClosePosition = useCallback(async (symbol: string) => {
    try {
      const quantity = inputValues[symbol]?.quantity;
      if (!quantity) {
        console.error('Amount not specified');
        return;
      }
      
      await positionsAPI.closePartialPosition(symbol, parseFloat(quantity));
      // Pozisyonları yeniden yükle (input değerlerini koruyarak)
      fetchPositionsUpdate();
    } catch (err) {
      console.error('Error closing a partial position:', err);
    }
  }, [inputValues, fetchPositionsUpdate]);
  
  // Tüm pozisyonları kapat
  const handleCloseAllPositions = useCallback(async () => {
    try {
      // Her bir pozisyonu sırayla kapat
      for (const position of positions) {
        await positionsAPI.closePosition(position.symbol);
      }
      // Pozisyonları yeniden yükle (input değerlerini koruyarak)
      fetchPositionsUpdate();
    } catch (err) {
      console.error('Error closing all positions:', err);
    }
  }, [positions, fetchPositionsUpdate]);

  // İlk yükleme
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Limit emri ile pozisyon kapatma
  const handleLimitClosePosition = useCallback(async (symbol: string, side: string) => {
    try {
      const price = inputValues[symbol]?.price;
      const quantity = inputValues[symbol]?.quantity;
      
      if (!price || !quantity) {
        console.error('Price or quantity not specified');
        return;
      }
      
      await positionsAPI.limitClosePosition(symbol, parseFloat(price), parseFloat(quantity));
      // Pozisyonları yeniden yükle (input değerlerini koruyarak)
      fetchPositionsUpdate();
    } catch (err) {
      console.error('Error placing limit order:', err);
    }
  }, [inputValues, fetchPositionsUpdate]);
  
  // Stop emri ile pozisyon kapatma
  const handleStopClosePosition = useCallback(async (symbol: string, side: string) => {
    try {
      const stopPrice = inputValues[symbol]?.price;
      const quantity = inputValues[symbol]?.quantity;
      
      if (!stopPrice || !quantity) {
        console.error('Stop price or quantity not specified');
        return;
      }
      
      // Pozisyon yönüne göre stop fiyatını kontrol et
      const position = positions.find(p => p.symbol === symbol);
      if (!position) return;
      
      const currentPrice = parseFloat(position.markPrice);
      const stopPriceValue = parseFloat(stopPrice);
      
      // Long pozisyon için stop fiyatı mevcut fiyattan düşük olmalı
      if (side === 'LONG' && stopPriceValue >= currentPrice) {
        alert(`Stop price (${stopPriceValue}) must be below current price (${currentPrice}) for LONG positions`);
        return;
      }
      
      // Short pozisyon için stop fiyatı mevcut fiyattan yüksek olmalı
      if (side === 'SHORT' && stopPriceValue <= currentPrice) {
        alert(`Stop price (${stopPriceValue}) must be above current price (${currentPrice}) for SHORT positions`);
        return;
      }
      
      await positionsAPI.stopClosePosition(symbol, stopPriceValue, parseFloat(quantity));
      // Pozisyonları yeniden yükle (input değerlerini koruyarak)
      fetchPositionsUpdate();
    } catch (err) {
      console.error('Error placing stop order:', err);
    }
  }, [inputValues, positions, fetchPositionsUpdate]);

  // Stop entry order
  const handleStopEntryOrder = useCallback(async (symbol: string) => {
    try {
      await positionsAPI.stopEntryOrder(symbol);
      // Pozisyonları yeniden yükle (input değerlerini koruyarak)
      fetchPositionsUpdate();
    } catch (err: any) {
      console.error('Error placing stop entry order:', err);
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert('Error placing stop entry order');
      }
    }
  }, [fetchPositionsUpdate]);

  // Percent stop order
  const handlePercentStopOrder = useCallback(async (symbol: string) => {
    try {
      await positionsAPI.percentStopOrder(symbol);
      // Pozisyonları yeniden yükle (input değerlerini koruyarak)
      fetchPositionsUpdate();
    } catch (err: any) {
      console.error('Error placing 1% stop order:', err);
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert('Error placing 1% stop order');
      }
    }
  }, [fetchPositionsUpdate]);

  // Percent 2% stop order
  const handlePercentTwoStopOrder = useCallback(async (symbol: string) => {
    try {
      await positionsAPI.percentTwoStopOrder(symbol);
      // Pozisyonları yeniden yükle (input değerlerini koruyarak)
      fetchPositionsUpdate();
    } catch (err: any) {
      console.error('Error placing 2% stop order:', err);
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert('Error placing 2% stop order');
      }
    }
  }, [fetchPositionsUpdate]);

  return {
    positions,
    loading,
    error,
    initialLoadComplete,
    inputValues,
    setInputValues,
    fetchPositions,
    fetchPositionsUpdate,
    handleClosePosition,
    handlePartialClosePosition,
    handleCloseAllPositions,
    handleLimitClosePosition,
    handleStopClosePosition,
    handleStopEntryOrder,
    handlePercentStopOrder,
    handlePercentTwoStopOrder
  };
}; 