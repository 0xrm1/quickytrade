import React, { ReactElement } from 'react';
import { QuickButtonProps } from '../types';
import * as S from '../styles';

/**
 * Buton etiketini formatla
 */
const formatButtonLabel = (symbol: string, amount: number): ReactElement => {
  const symbolBase = symbol.replace('USDT', '');
  const amountStr = amount >= 1000 
    ? `${(amount / 1000).toFixed(1)}K` 
    : amount.toString();
  
  return (
    <>
      <div>{symbolBase}</div>
      <div>{amountStr}</div>
    </>
  );
};

/**
 * Hızlı buton bileşeni
 */
const QuickButton: React.FC<QuickButtonProps> = ({ 
  button, 
  processingOrder, 
  processingButtonId, 
  onExecute, 
  onRemove 
}) => {
  return (
    <S.ButtonWrapper>
      <S.QuickButton
        side={button.side}
        onClick={() => onExecute(button)}
        disabled={processingOrder && processingButtonId === button.id}
      >
        <S.ButtonContent>
          {formatButtonLabel(button.symbol, button.amount)}
        </S.ButtonContent>
      </S.QuickButton>
      <S.RemoveButton 
        onClick={(e) => onRemove(button.id, e)}
        title="Remove button"
      >
        ×
      </S.RemoveButton>
    </S.ButtonWrapper>
  );
};

export default QuickButton; 