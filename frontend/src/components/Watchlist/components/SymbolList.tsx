import React from 'react';
import { SymbolListProps } from '../types';
import SymbolItem from './SymbolItem';
import * as S from '../styles';

/**
 * Sembol listesi bileşeni
 */
const SymbolList: React.FC<SymbolListProps> = ({
  loading,
  error,
  watchlist,
  activeTab,
  tickerData,
  processingOrder,
  orderSymbol,
  buttonSettings,
  handleRemoveSymbol,
  handleOpenPosition,
  getDecimalPrecision
}) => {
  if (loading) {
    return <S.EmptyState>Loading...</S.EmptyState>;
  }
  
  if (error) {
    return <S.EmptyState>{error}</S.EmptyState>;
  }
  
  const filteredWatchlist = watchlist.filter(item => item.listId === activeTab);
  
  if (filteredWatchlist.length === 0) {
    return (
      <S.EmptyState>
        Watchlist is empty. Click + button to add symbols.
      </S.EmptyState>
    );
  }
  
  return (
    <S.SymbolList>
      {filteredWatchlist.map(item => {
        const symbolStr = item.symbol;
        const ticker = tickerData[symbolStr] || { price: '0', priceChangePercent: '0' };
        
        return (
          <SymbolItem
            key={`${symbolStr}-${item.listId}`}
            item={item}
            ticker={ticker}
            processingOrder={processingOrder}
            orderSymbol={orderSymbol}
            buttonSettings={buttonSettings}
            handleRemoveSymbol={handleRemoveSymbol}
            handleOpenPosition={handleOpenPosition}
            getDecimalPrecision={getDecimalPrecision}
          />
        );
      })}
      
      {/* Empty space at the bottom for better scrolling */}
      <div style={{ height: '16px' }}></div>
    </S.SymbolList>
  );
};

export default SymbolList; 