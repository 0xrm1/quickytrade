import React from 'react';
import { useQuickButtons } from './hooks/useQuickButtons';
import QuickButton from './components/QuickButton';
import AddButtonModal from './components/AddButtonModal';
import * as S from './styles';

/**
 * Hızlı pozisyon butonları çubuğu bileşeni
 */
const QuickButtonsBar: React.FC = () => {
  const {
    quickButtons,
    processingOrder,
    processingButtonId,
    newButton,
    showAddModal,
    handleOpenAddModal,
    handleCloseAddModal,
    handleInputChange,
    handleAddQuickButton,
    handleRemoveQuickButton,
    handleExecuteQuickButton
  } = useQuickButtons();
  
  return (
    <S.QuickButtonsContainer>
      <S.Title>Quicky Positions</S.Title>
      <S.AddButton onClick={handleOpenAddModal}>+</S.AddButton>
      
      <S.ButtonsWrapper>
        {quickButtons.map(button => (
          <QuickButton
            key={button.id}
            button={button}
            processingOrder={processingOrder}
            processingButtonId={processingButtonId}
            onExecute={handleExecuteQuickButton}
            onRemove={handleRemoveQuickButton}
          />
        ))}
      </S.ButtonsWrapper>
      
      <AddButtonModal
        show={showAddModal}
        newButton={newButton}
        onClose={handleCloseAddModal}
        onInputChange={handleInputChange}
        onAdd={handleAddQuickButton}
      />
    </S.QuickButtonsContainer>
  );
};

export default QuickButtonsBar; 