import React from 'react';
import { useTerminal } from './hooks/useTerminal';
import TerminalHeader from './components/TerminalHeader';
import TerminalOutput from './components/TerminalOutput';
import TerminalInput from './components/TerminalInput';
import * as S from './styles';

/**
 * Terminal bileşeni
 */
const Terminal: React.FC = () => {
  const {
    command,
    output,
    loading,
    error,
    showInfo,
    outputRef,
    inputRef,
    infoButtonRef,
    setCommand,
    executeCommand,
    clearHistory,
    formatTime,
    toggleInfo
  } = useTerminal();
  
  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommand(e.target.value);
  };
  
  return (
    <S.TerminalContainer>
      <TerminalHeader
        showInfo={showInfo}
        loading={loading}
        toggleInfo={toggleInfo}
        clearHistory={clearHistory}
        infoButtonRef={infoButtonRef}
      />
      
      <TerminalOutput
        ref={outputRef}
        output={output}
        formatTime={formatTime}
      />
      
      <TerminalInput
        command={command}
        loading={loading}
        inputRef={inputRef}
        onCommandChange={handleCommandChange}
        onSubmit={executeCommand}
      />
    </S.TerminalContainer>
  );
};

export default Terminal; 