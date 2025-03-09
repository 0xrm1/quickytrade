import React from 'react';
import { Position, InputValues } from '../types';
import { getSymbolPricePrecision } from '../utils';
import * as S from './styles';

interface PositionListProps {
  positions: Position[];
  loading: boolean;
  error: string | null;
  initialLoadComplete: boolean;
  inputValues: InputValues;
  liveTickerData: any;
  percentageValues: any;
  showPercentSelector: any;
  handleInputChange: (symbol: string, field: string, value: string) => void;
  togglePercentSelector: (symbol: string) => void;
  handleQuickPercentSelect: (symbol: string, percent: number) => void;
  handlePercentageInputChange: (symbol: string, value: string) => void;
  handlePartialClosePosition: (symbol: string) => Promise<void>;
}

const PositionList: React.FC<PositionListProps> = ({
  positions,
  loading,
  error,
  initialLoadComplete,
  inputValues,
  liveTickerData,
  percentageValues,
  showPercentSelector,
  handleInputChange,
  togglePercentSelector,
  handleQuickPercentSelect,
  handlePercentageInputChange,
  handlePartialClosePosition
}) => {
  if (!initialLoadComplete && loading) {
    return <S.Loading>Loading...</S.Loading>;
  }
  
  if (error) {
    return <S.Error>{error}</S.Error>;
  }
  
  if (positions.length === 0) {
    return <S.Loading>No open positions</S.Loading>;
  }
  
  return (
    <S.PositionsList>
      <S.PositionsTable>
        <S.TableHead>
          <tr>
            <th style={{ width: '70px' }}>SYMBOL</th>
            <th style={{ width: '60px', textAlign: 'center' }}>SIZE</th>
            <th style={{ width: '55px', textAlign: 'right' }}>ENTRY</th>
            <th style={{ width: '55px', textAlign: 'center' }}>B/E</th>
            <th style={{ width: '55px', textAlign: 'center' }}>LIQ</th>
            <th style={{ width: '65px', textAlign: 'center' }}>PNL</th>
            <th style={{ width: '120px' }}></th>
            <th style={{ width: '70px', textAlign: 'center' }}>QUICK STOP</th>
          </tr>
        </S.TableHead>
        <S.TableBody>
          {positions.map((position) => {
            // Backend'den gelen side değerini doğrudan kullan
            const side = position.side || (parseFloat(position.positionAmt) > 0 ? 'LONG' : 'SHORT');
            const isLong = side === 'LONG';
            
            // Binance'den gelen doğru PNL değerlerini kullan
            const pnl = parseFloat(position.unRealizedProfit);
            
            // PNL yüzdesini hesapla
            const pnlPercentage = position.roe ? 
              parseFloat(position.roe).toFixed(2) : 
              "0.00";
            
            const markPrice = parseFloat(position.markPrice);
            const positionSize = Math.abs(parseFloat(position.positionAmt));
            const entryPrice = parseFloat(position.entryPrice);
            const leverage = position.leverage || '20'; // Leverage varsayılan 20x
            
            // Likit fiyatı
            const liquidationPrice = position.liquidationPrice && parseFloat(position.liquidationPrice) !== 0 ? 
              parseFloat(position.liquidationPrice).toFixed(2) : 
              "N/A";
            
            // Pozisyon değerini USDT olarak hesapla
            const positionValueUSDT = (positionSize * entryPrice).toFixed(0);
            
            // Satır arka plan rengi
            const rowBgColor = isLong ? 'rgba(74, 222, 128, 0.08)' : 'rgba(239, 68, 68, 0.05)';
            
            return (
              <tr key={position.symbol} style={{ backgroundColor: rowBgColor }} className="position-row">
                <td>
                  <S.SymbolContainer>
                    <S.Symbol>
                      {position.symbol.replace('USDT', '')}
                      <S.Side side={side}>{leverage}x</S.Side>
                    </S.Symbol>
                    {liveTickerData[position.symbol] && (
                      <S.LivePrice>
                        {parseFloat(liveTickerData[position.symbol].price).toFixed(getSymbolPricePrecision(position.symbol))}
                      </S.LivePrice>
                    )}
                  </S.SymbolContainer>
                </td>
                <td style={{ textAlign: 'center' }}>{positionValueUSDT} USDT</td>
                <td style={{ textAlign: 'right' }}>{entryPrice.toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>{entryPrice.toFixed(2)}</td>
                <td style={{ textAlign: 'center', color: '#f97316' }}>{liquidationPrice}</td>
                <td>
                  <S.PnL value={pnl}>
                    <span>{pnl > 0 ? '+' : ''}{pnl.toFixed(1)} USDT</span>
                    <span>{pnl > 0 ? '+' : ''}{pnlPercentage}%</span>
                  </S.PnL>
                </td>
                <td>
                  <S.OrderControlsContainer>
                    <S.ButtonsContainer>
                      <S.BasicOrderButtons>
                        <S.LimitOrderButton 
                          title="Limit Close"
                          onClick={() => console.log("Limit close not implemented")}
                        >
                          Limit
                        </S.LimitOrderButton>
                        <S.StopOrderButton 
                          title="Stop Loss"
                          onClick={() => console.log("Stop loss not implemented")}
                        >
                          Stop
                        </S.StopOrderButton>
                        <S.MarketOrderButton 
                          title="Market Close"
                          onClick={() => handlePartialClosePosition(position.symbol)}
                        >
                          Market
                        </S.MarketOrderButton>
                      </S.BasicOrderButtons>
                      
                      <S.OrderInputsSection>
                        <S.InputGroup>
                          <S.InputLabel>Price:</S.InputLabel>
                          <S.InputField
                            type="text"
                            value={inputValues[position.symbol]?.price || ''}
                            placeholder={markPrice.toFixed(getSymbolPricePrecision(position.symbol))}
                            onChange={(e) => {
                              // Virgülü noktaya çevir
                              const value = e.target.value.replace(',', '.');
                              handleInputChange(position.symbol, 'price', value);
                            }}
                          />
                        </S.InputGroup>
                        
                        <S.InputGroup>
                          <S.InputLabel>Qty:</S.InputLabel>
                          <S.InputField
                            type="text"
                            value={inputValues[position.symbol]?.quantity || ''}
                            placeholder={positionSize.toFixed(3)}
                            onChange={(e) => handleInputChange(position.symbol, 'quantity', e.target.value)}
                          />
                        </S.InputGroup>
                        
                        <S.InputGroup>
                          <S.InputLabel>%:</S.InputLabel>
                          <S.InputField
                            type="number"
                            min="0"
                            max="100"
                            value={percentageValues[position.symbol] || ''}
                            onClick={() => togglePercentSelector(position.symbol)}
                            onChange={(e) => handlePercentageInputChange(position.symbol, e.target.value)}
                            placeholder="0"
                          />
                          {showPercentSelector[position.symbol] && (
                            <S.PercentSelectorContainer className="percent-selector">
                              <S.PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 10)}>10%</S.PercentButton>
                              <S.PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 25)}>25%</S.PercentButton>
                              <S.PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 50)}>50%</S.PercentButton>
                              <S.PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 75)}>75%</S.PercentButton>
                              <S.PercentButton onClick={() => handleQuickPercentSelect(position.symbol, 100)}>100%</S.PercentButton>
                            </S.PercentSelectorContainer>
                          )}
                        </S.InputGroup>
                      </S.OrderInputsSection>
                    </S.ButtonsContainer>
                  </S.OrderControlsContainer>
                </td>
                <td>
                  <S.QuickOrdersSection>
                    <S.QuickOrdersGrid>
                      <S.StopEntryOrderButton 
                        title="Entry fiyatına stop emri"
                        onClick={() => console.log("Stop entry not implemented")}
                      >
                        stop entry
                      </S.StopEntryOrderButton>
                      <S.PercentStopOrderButton 
                        title="Entry fiyatının %1 aşağısına stop emri"
                        onClick={() => console.log("1% stop not implemented")}
                      >
                        %1 stop
                      </S.PercentStopOrderButton>
                    </S.QuickOrdersGrid>
                  </S.QuickOrdersSection>
                </td>
              </tr>
            );
          })}
        </S.TableBody>
      </S.PositionsTable>
    </S.PositionsList>
  );
};

export default PositionList; 