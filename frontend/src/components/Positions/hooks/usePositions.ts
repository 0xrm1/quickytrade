import { useState, useEffect, useCallback } from 'react';
import { positionsAPI } from '../../../services/api';
import { Position, InputValues } from '../types';

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
      console.log('İlk pozisyonlar yüklendi:', data);
      
      const positionsArray = data.positions || [];
      
      // Input değerlerini sadece ilk kez veya yeni pozisyonlar için ayarla
      const newInputValues = { ...inputValues };
      positionsArray.forEach((position: Position) => {
        const symbol = position.symbol;
        // Eğer bu sembol için henüz input değeri yoksa, varsayılan değeri ayarla
        if (!newInputValues[symbol]) {
          newInputValues[symbol] = {
            price: position.markPrice,
            quantity: Math.abs(parseFloat(position.positionAmt)).toString()
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
  }, [inputValues]);
  
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
      
      // Pozisyonları güncelle
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
          
          // Sadece yeni semboller için input değerleri oluştur
          // (mevcut sembollerin input değerlerini güncelleme)
          if (!existingPositionsMap[newPos.symbol] && !inputValues[newPos.symbol]) {
            setInputValues(prev => ({
              ...prev,
              [newPos.symbol]: {
                price: newPos.markPrice,
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
      console.error('Pozisyon güncelleme hatası:', err);
      // Hata olsa bile mevcut pozisyonları silme
    }
  }, [positions, initialLoadComplete, inputValues, fetchPositions]);

  // Pozisyonu kapat
  const handleClosePosition = useCallback(async (symbol: string) => {
    try {
      await positionsAPI.closePosition(symbol);
      // Pozisyonları yeniden yükle
      fetchPositions();
    } catch (err) {
      console.error('Pozisyon kapatılırken hata:', err);
    }
  }, [fetchPositions]);
  
  // Kısmi pozisyon kapatma (Market)
  const handlePartialClosePosition = useCallback(async (symbol: string) => {
    try {
      const quantity = inputValues[symbol]?.quantity;
      if (!quantity) {
        console.error('Miktar belirtilmedi');
        return;
      }
      
      await positionsAPI.closePartialPosition(symbol, parseFloat(quantity));
      // Pozisyonları yeniden yükle
      fetchPositions();
    } catch (err) {
      console.error('Kısmi pozisyon kapatılırken hata:', err);
    }
  }, [inputValues, fetchPositions]);
  
  // Tüm pozisyonları kapat
  const handleCloseAllPositions = useCallback(async () => {
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
  }, [positions, fetchPositions]);

  // İlk yükleme
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

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
    handleCloseAllPositions
  };
}; 