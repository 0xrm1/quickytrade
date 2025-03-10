import React, { useState, useEffect } from 'react';
import { usePositions } from './hooks/usePositions';
import { useOrders } from './hooks/useOrders';
import { usePriceData } from './hooks/usePriceData';
import { useInputHandlers } from './hooks/useInputHandlers';
import PositionList from './components/PositionList';
import OpenOrdersList from './components/OpenOrdersList';
import * as S from './components/styles';

const Positions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' veya 'openOrders'
  
  // Hooks
  const {
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
  } = usePositions();
  
  const { openOrders, fetchOpenOrders, cancelOrder, cancelAllOrders } = useOrders();
  
  const { liveTickerData } = usePriceData(positions);
  
  const {
    percentageValues,
    showPercentInput,
    showPercentSelector,
    handleInputChange,
    togglePercentInput,
    togglePercentSelector,
    handleQuickPercentSelect,
    handlePercentageInputChange
  } = useInputHandlers(positions, inputValues, setInputValues);
  
  // Dışarı tıklandığında yüzde seçiciyi kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Eğer herhangi bir yüzde seçici açıksa ve tıklanan element seçici değilse kapat
      const selectors = document.querySelectorAll('.percent-selector');
      if (selectors.length > 0) {
        let clickedInsideSelector = false;
        selectors.forEach(selector => {
          if (selector.contains(event.target as Node)) {
            clickedInsideSelector = true;
          }
        });
        
        if (!clickedInsideSelector) {
          // Tüm seçicileri kapat
          togglePercentSelector('');
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [togglePercentSelector]);
  
  // Aktif sekmeye göre veri güncelleme
  useEffect(() => {
    // 1 saniyede bir güncelle
    const interval = setInterval(() => {
      // Sadece veri güncellemesi yap, yükleme durumu gösterme
      if (activeTab === 'positions') {
        fetchPositionsUpdate();
      } else {
        fetchOpenOrders();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeTab, fetchPositionsUpdate, fetchOpenOrders]);
  
  // Veri güncelleme
  useEffect(() => {
    // 1 saniyede bir güncelle
    const interval = setInterval(() => {
      // Her iki veriyi de güncelle
      fetchPositionsUpdate();
      fetchOpenOrders();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [fetchPositionsUpdate, fetchOpenOrders]);
  
  return (
    <S.PositionsContainer>
      <S.GlobalStyle />
      <S.PositionsHeader>
        <S.TabContainer>
          <S.Tab 
            active={activeTab === 'positions'} 
            onClick={() => setActiveTab('positions')}
          >
            Positions
          </S.Tab>
          <S.Tab 
            active={activeTab === 'openOrders'} 
            onClick={() => setActiveTab('openOrders')}
          >
            Orders {openOrders.length > 0 && <S.OrderCount>({openOrders.length})</S.OrderCount>}
          </S.Tab>
        </S.TabContainer>
        
        {activeTab === 'positions' && positions.length > 0 && (
          <S.CloseAllButton onClick={handleCloseAllPositions}>Close All</S.CloseAllButton>
        )}
      </S.PositionsHeader>
      
      {activeTab === 'positions' ? (
        <PositionList
          positions={positions}
          loading={loading}
          error={error}
          initialLoadComplete={initialLoadComplete}
          inputValues={inputValues}
          liveTickerData={liveTickerData}
          percentageValues={percentageValues}
          showPercentSelector={showPercentSelector}
          openOrders={openOrders}
          handleInputChange={handleInputChange}
          togglePercentSelector={togglePercentSelector}
          handleQuickPercentSelect={handleQuickPercentSelect}
          handlePercentageInputChange={handlePercentageInputChange}
          handlePartialClosePosition={handlePartialClosePosition}
          handleLimitClosePosition={handleLimitClosePosition}
          handleStopClosePosition={handleStopClosePosition}
          handleStopEntryOrder={handleStopEntryOrder}
          handlePercentStopOrder={handlePercentStopOrder}
          handlePercentTwoStopOrder={handlePercentTwoStopOrder}
        />
      ) : (
        <OpenOrdersList 
          openOrders={openOrders} 
          cancelOrder={cancelOrder} 
          cancelAllOrders={cancelAllOrders} 
        />
      )}
    </S.PositionsContainer>
  );
};

export default Positions; 