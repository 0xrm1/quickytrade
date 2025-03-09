import React from 'react';
import { useWatchlist } from './hooks/useWatchlist';
import WatchlistHeader from './components/WatchlistHeader';
import AddSymbolForm from './components/AddSymbolForm';
import SymbolList from './components/SymbolList';
import SettingsModal from './components/SettingsModal';
import * as S from './styles';

/**
 * Watchlist bileşeni - İzleme listesi ve hızlı işlem butonları
 */
const Watchlist: React.FC = () => {
  const {
    watchlist,
    tickerData,
    showAddForm,
    setShowAddForm,
    newSymbol,
    setNewSymbol,
    loading,
    error,
    processingOrder,
    orderSymbol,
    showSettingsModal,
    activeTab,
    buttonSettings,
    formSettings,
    handleAddSymbol,
    handleRemoveSymbol,
    handleOpenPosition,
    getDecimalPrecision,
    openSettingsModal,
    closeSettingsModal,
    handleSettingsChange,
    saveSettings,
    handleTabChange
  } = useWatchlist();

  return (
    <S.WatchlistContainer>
      <WatchlistHeader 
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        openSettingsModal={openSettingsModal}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
      />
      
      <AddSymbolForm 
        showAddForm={showAddForm}
        newSymbol={newSymbol}
        setNewSymbol={setNewSymbol}
        handleAddSymbol={handleAddSymbol}
      />
      
      <SymbolList 
        loading={loading}
        error={error}
        watchlist={watchlist}
        activeTab={activeTab}
        tickerData={tickerData}
        processingOrder={processingOrder}
        orderSymbol={orderSymbol}
        buttonSettings={buttonSettings}
        handleRemoveSymbol={handleRemoveSymbol}
        handleOpenPosition={handleOpenPosition}
        getDecimalPrecision={getDecimalPrecision}
      />
      
      <SettingsModal 
        showSettingsModal={showSettingsModal}
        formSettings={formSettings}
        handleSettingsChange={handleSettingsChange}
        saveSettings={saveSettings}
        closeSettingsModal={closeSettingsModal}
      />
    </S.WatchlistContainer>
  );
};

export default Watchlist; 