import React from 'react';
import { Order } from '../types';
import * as S from './styles';

interface OpenOrdersListProps {
  openOrders: Order[];
}

const OpenOrdersList: React.FC<OpenOrdersListProps> = ({ openOrders }) => {
  if (openOrders.length === 0) {
    return <S.Loading>No open orders</S.Loading>;
  }
  
  return (
    <S.PositionsList>
      <S.PositionsTable>
        <S.TableHead>
          <tr>
            <th style={{ width: '70px' }}>SYMBOL</th>
            <th style={{ width: '60px', textAlign: 'center' }}>TYPE</th>
            <th style={{ width: '60px', textAlign: 'center' }}>SIDE</th>
            <th style={{ width: '70px', textAlign: 'right' }}>PRICE</th>
            <th style={{ width: '70px', textAlign: 'center' }}>AMOUNT</th>
            <th style={{ width: '70px', textAlign: 'center' }}>FILLED</th>
            <th style={{ width: '70px', textAlign: 'center' }}>REDUCE</th>
            <th style={{ width: '70px', textAlign: 'center' }}>ACTION</th>
          </tr>
        </S.TableHead>
        <S.TableBody>
          {openOrders.map((order) => {
            const side = order.side;
            const isLong = side === 'BUY';
            const rowBgColor = isLong ? 'rgba(74, 222, 128, 0.08)' : 'rgba(239, 68, 68, 0.05)';
            
            return (
              <tr key={order.orderId} style={{ backgroundColor: rowBgColor }}>
                <td>{order.symbol.replace('USDT', '')}</td>
                <td style={{ textAlign: 'center' }}>{order.type}</td>
                <td style={{ textAlign: 'center' }}>
                  <S.Side side={isLong ? 'LONG' : 'SHORT'}>{isLong ? 'BUY' : 'SELL'}</S.Side>
                </td>
                <td style={{ textAlign: 'right' }}>{parseFloat(order.price).toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>{parseFloat(order.origQty).toFixed(3)}</td>
                <td style={{ textAlign: 'center' }}>{parseFloat(order.executedQty).toFixed(3)}</td>
                <td style={{ textAlign: 'center' }}>{order.reduceOnly ? 'YES' : 'NO'}</td>
                <td style={{ textAlign: 'center' }}>
                  <S.CancelOrderButton 
                    onClick={() => console.log(`Cancel order ${order.orderId}`)}
                    title="Cancel Order"
                  >
                    Cancel
                  </S.CancelOrderButton>
                </td>
              </tr>
            );
          })}
        </S.TableBody>
      </S.PositionsTable>
    </S.PositionsList>
  );
};

export default OpenOrdersList; 