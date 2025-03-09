import React from 'react';
import { TerminalInputProps } from '../types';
import * as S from '../styles';

/**
 * Terminal girişi bileşeni
 */
const TerminalInput: React.FC<TerminalInputProps> = ({
  command,
  loading,
  inputRef,
  onCommandChange,
  onSubmit
}) => {
  return (
    <S.CommandForm onSubmit={onSubmit}>
      <S.TerminalInputContainer>
        <S.Prompt>$</S.Prompt>
        <S.Input
          ref={inputRef}
          type="text"
          value={command}
          onChange={onCommandChange}
          placeholder="Enter command"
          disabled={loading}
          autoFocus
          style={{ lineHeight: '36px' }}
        />
        <S.RunButton type="submit" disabled={loading}>
          Run
        </S.RunButton>
      </S.TerminalInputContainer>
    </S.CommandForm>
  );
};

export default TerminalInput; 