import React from 'react';
import { AddSymbolFormProps } from '../types';
import * as S from '../styles';

/**
 * Sembol ekleme formu bileşeni
 */
const AddSymbolForm: React.FC<AddSymbolFormProps> = ({
  showAddForm,
  newSymbol,
  setNewSymbol,
  handleAddSymbol
}) => {
  return (
    <S.AddSymbolForm isVisible={showAddForm}>
      <S.SymbolInput
        type="text"
        placeholder="Symbol (e.g. BTCUSDT)"
        value={newSymbol}
        onChange={(e) => setNewSymbol(e.target.value)}
      />
      <S.SubmitButton onClick={handleAddSymbol}>Add</S.SubmitButton>
    </S.AddSymbolForm>
  );
};

export default AddSymbolForm; 