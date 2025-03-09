import React from 'react';
import { SymbolItemProps } from '../types';
import * as S from '../styles';

/**
 * Sembol öğesi bileşeni
 */
const SymbolItem: React.FC<SymbolItemProps> = ({
  item,
  ticker,
  processingOrder,
  orderSymbol,
  buttonSettings,
  handleRemoveSymbol,
  handleOpenPosition,
  getDecimalPrecision
}) => {
  const symbolStr = item.symbol;
  const isPositive = parseFloat(ticker.priceChangePercent) >= 0;
  const precision = getDecimalPrecision(symbolStr);
  const isProcessing = processingOrder && orderSymbol === symbolStr;
  
  return (
    <S.SymbolItem>
      <S.SymbolHeader>
        <S.SymbolInfo>
          <S.RemoveButton onClick={() => handleRemoveSymbol(symbolStr)}>×</S.RemoveButton>
          <S.SymbolName>{symbolStr}</S.SymbolName>
          <S.PriceContainer>
            <S.Price>{parseFloat(ticker.price).toFixed(precision)}</S.Price>
            <S.PriceChange isPositive={isPositive}>
              %{Math.abs(parseFloat(ticker.priceChangePercent)).toFixed(1)}{isPositive ? '' : '-'}
            </S.PriceChange>
          </S.PriceContainer>
        </S.SymbolInfo>
        
        <S.VerticalButtonsContainer>
          <S.LongButtonsGroup>
            {buttonSettings.longAmounts.map((amount, index) => (
              <S.LongButton 
                key={`${symbolStr}-long-${amount}`}
                disabled={isProcessing}
                onClick={() => handleOpenPosition(symbolStr, amount, 'long')}
              >
                {buttonSettings.longLabels[index]}
              </S.LongButton>
            ))}
          </S.LongButtonsGroup>
          
          <S.ShortButtonsGroup>
            {buttonSettings.shortAmounts.map((amount, index) => (
              <S.ShortButton 
                key={`${symbolStr}-short-${amount}`}
                disabled={isProcessing}
                onClick={() => handleOpenPosition(symbolStr, amount, 'short')}
              >
                {buttonSettings.shortLabels[index]}
              </S.ShortButton>
            ))}
          </S.ShortButtonsGroup>
        </S.VerticalButtonsContainer>
      </S.SymbolHeader>
    </S.SymbolItem>
  );
};

export default SymbolItem; 