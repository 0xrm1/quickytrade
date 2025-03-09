import React from 'react';
import { InfoTooltipProps } from '../types';
import * as S from '../styles';

/**
 * Terminal komutları hakkında bilgi veren tooltip bileşeni
 */
const InfoTooltip: React.FC<InfoTooltipProps> = ({ show }) => {
  if (!show) return null;
  
  return (
    <S.InfoTooltip>
      <strong style={{ color: '#ffffff' }}>Commands:</strong>
      <ul>
        <li><code>l btc 10000</code> - Long BTC with 10000 USDT</li>
        <li><code>s btc 10000</code> - Short BTC with 10000 USDT</li>
        <li><code>close btcusdt</code> - Close position</li>
        <li><code>positions</code> - List open positions</li>
        <li><code>price btc</code> - Show current price</li>
        <li><code>help</code> - Show all commands</li>
      </ul>
    </S.InfoTooltip>
  );
};

export default InfoTooltip; 