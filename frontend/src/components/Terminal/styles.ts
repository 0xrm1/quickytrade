import styled from 'styled-components';

// Ana container
export const TerminalContainer = styled.div`
  background-color: #1b2839;
  border-radius: 8px;
  border: 1px solid #2c3142;
  padding: 10px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(215, 251, 115, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;
    border: 1px solid rgba(215, 251, 115, 0.1);
    pointer-events: none;
  }
`;

// Terminal başlığı
export const TerminalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

// Başlık container
export const TitleContainer = styled.div`
  display: flex;
  align-items: center;
`;

// Başlık
export const Title = styled.div`
  margin: 0;
  padding: 6px 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  background-color: transparent;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
`;

// Bilgi butonu
export const InfoButton = styled.button`
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  cursor: pointer;
  font-size: 14px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// Bilgi tooltip
export const InfoTooltip = styled.div`
  position: absolute;
  top: 32px;
  right: 0;
  background-color: #1b2839;
  border: 1px solid #2c3142;
  border-radius: 6px;
  padding: 16px;
  width: 280px;
  z-index: 10;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(215, 251, 115, 0.1);
  font-size: 12px;
  
  ul {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 6px;
    color: #8f9bba;
  }
  
  code {
    background-color: rgba(215, 251, 115, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    color: #d7fb73;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 6px;
    border: 1px solid rgba(215, 251, 115, 0.1);
    pointer-events: none;
  }
`;

// Temizleme butonu
export const ClearButton = styled.button`
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// Terminal çıktısı
export const TerminalOutputContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 8px;
  background-color: #1b2839;
  border-radius: 6px;
  margin-bottom: 10px;
  min-height: 200px;
  border: 1px solid #2c3142;
  
  /* Webkit scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1b2839;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d7fb73;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #c8ec64;
  }
  
  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #d7fb73 #1b2839;
`;

// Çıktı satırı
export const OutputLine = styled.div`
  padding-bottom: 4px;
  margin-bottom: 4px;
  border-bottom: 1px solid #2c3142;
  white-space: pre-wrap;
  word-break: break-word;
`;

// Komut satırı
export const CommandLine = styled.div`
  color: #d7fb73;
  font-weight: bold;
`;

// Sonuç satırı
export const ResultLine = styled.div<{ success?: boolean }>`
  color: ${props => props.success !== false ? '#e2e8f0' : '#ef4444'};
`;

// Terminal girişi
export const TerminalInputContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #1b2839;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #2c3142;
  width: 100%;
  margin-bottom: 2px;
  height: 36px;
`;

// Prompt
export const Prompt = styled.span`
  color: #d7fb73;
  padding: 0 8px;
  font-family: 'Courier New', monospace;
  display: flex;
  align-items: center;
  height: 100%;
  font-weight: bold;
`;

// Giriş
export const Input = styled.input`
  flex: 1;
  background-color: transparent;
  border: none;
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 0;
  min-width: 0;
  height: 100%;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #4a5568;
  }
`;

// Çalıştır butonu
export const RunButton = styled.button`
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  height: calc(100% - 6px);
  min-width: 45px;
  border-radius: 4px;
  margin-right: 3px;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Komut formu
export const CommandForm = styled.form`
  width: 100%;
`;

// Butonlar container
export const ButtonsContainer = styled.div`
  display: flex;
  gap: 6px;
`;

// Aksiyon butonu
export const ActionButton = styled.button`
  background-color: transparent;
  color: #d7fb73;
  border: 1px solid #2c3142;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    border-color: #d7fb73;
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`; 