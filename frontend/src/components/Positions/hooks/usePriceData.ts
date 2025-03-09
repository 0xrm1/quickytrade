import { useState, useEffect, useCallback } from 'react';
import { watchlistAPI } from '../../../services/api';
import { Position, TickerData } from '../types';

interface UsePriceDataReturn {
  liveTickerData: TickerData;
}

export const usePriceData = (positions: Position[]): UsePriceDataReturn => {
  const [liveTickerData, setLiveTickerData] = useState<TickerData>({});

  // Anlık fiyat bilgilerini çek
  const fetchTickerData = useCallback(async () => {
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
  }, [positions]);

  // İlk yükleme ve periyodik güncelleme
  useEffect(() => {
    // İlk yükleme
    if (positions.length > 0) {
      fetchTickerData();
      
      // 5 saniyede bir güncelle
      const interval = setInterval(fetchTickerData, 5000);
      return () => clearInterval(interval);
    }
  }, [positions, fetchTickerData]);

  return {
    liveTickerData
  };
}; 