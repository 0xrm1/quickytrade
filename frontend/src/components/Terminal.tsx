import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { terminalAPI } from '../services/api';

// Styled Components
const TerminalContainer = styled.div`
  background-color: #111827;
  border-radius: 8px;
  border: 1px solid #1f2937;
  padding: 12px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const TerminalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Title = styled.div`
  background-color: rgba(79, 70, 229, 0.8);
  color: white;
  padding: 4px 16px;
  border-radius: 6px;
  font-weight: 600;
`;

const InfoButton = styled.button`
  background-color: rgba(79, 70, 229, 0.8);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: rgba(79, 70, 229, 1);
  }
`;

const InfoTooltip = styled.div`
  position: absolute;
  top: 40px;
  left: 0;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 12px;
  width: 300px;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  
  ul {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 6px;
  }
  
  code {
    background-color: #111827;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
`;

const ClearButton = styled.button`
  background-color: transparent;
  color: #93c5fd;
  border: none;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    color: #60a5fa;
  }
`;

const TerminalOutput = styled.div`
  flex: 1;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 8px;
  background-color: #030712;
  border-radius: 6px;
  margin-bottom: 12px;
  min-height: 200px;
  
  /* Webkit scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.5);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(79, 70, 229, 0.6);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(79, 70, 229, 0.8);
  }
  
  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(79, 70, 229, 0.6) rgba(31, 41, 55, 0.5);
`;

const OutputLine = styled.div`
  padding-bottom: 4px;
  margin-bottom: 4px;
  border-bottom: 1px solid #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CommandLine = styled.div`
  color: #93c5fd;
  font-weight: bold;
`;

const ResultLine = styled.div<{ success?: boolean }>`
  color: ${props => props.success !== false ? '#10b981' : '#ef4444'};
`;

const TerminalInput = styled.div`
  display: flex;
  align-items: center;
  background-color: #1f2937;
  border-radius: 6px;
  overflow: hidden;
`;

const Prompt = styled.span`
  color: #9ca3af;
  padding: 0 8px;
  font-family: 'Courier New', monospace;
`;

const Input = styled.input`
  flex: 1;
  background-color: transparent;
  border: none;
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 8px 0;
  
  &:focus {
    outline: none;
  }
`;

const RunButton = styled.button`
  background-color: #4f46e5;
  color: white;
  border: none;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #4338ca;
  }
  
  &:disabled {
    background-color: #6b7280;
    cursor: not-allowed;
  }
`;

const CommandForm = styled.form`
  width: 100%;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background-color: transparent;
  color: #93c5fd;
  border: none;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    color: #60a5fa;
  }
`;

// TypeScript interfaces
interface OutputItem {
  type: 'user' | 'system';
  content: string;
  timestamp?: number;
  success?: boolean;
}

// Terminal component
const Terminal: React.FC = () => {
  const [command, setCommand] = useState<string>('');
  const [output, setOutput] = useState<OutputItem[]>([
    { type: 'system', content: 'Welcome to OrionTrade Terminal' },
    { type: 'system', content: 'Type "help" for available commands' },
    { type: 'system', content: 'Example commands:' },
    { type: 'system', content: '- "l btc 10000" (Open long position)' },
    { type: 'system', content: '- "s btc 10000" (Open short position)' },
    { type: 'system', content: '- "close btcusdt" (Close position)' },
    { type: 'system', content: 'IMPORTANT: Make sure your Binance API has permissions for Futures trading and the server IP is whitelisted.' }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const infoButtonRef = useRef<HTMLDivElement>(null);
  
  // Load command history
  useEffect(() => {
    const fetchCommandHistory = async () => {
      try {
        const data = await terminalAPI.getCommandHistory();
        if (data && data.length > 0) {
          // Keep welcome messages and add history commands
          setOutput(prev => [
            ...prev,
            ...data.map((item: any) => ({
              type: 'user',
              content: item.command,
              timestamp: item.timestamp
            })).reverse()
          ]);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load command history');
        console.error(err);
      }
    };
    
    fetchCommandHistory();
  }, []);
  
  // Auto scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);
  
  // Close info tooltip when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoButtonRef.current && !infoButtonRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Execute command
  const executeCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    try {
      setLoading(true);
      
      // Add command to output
      setOutput(prev => [
        ...prev,
        { type: 'user', content: command, timestamp: Date.now() }
      ]);
      
      // Execute command
      const result = await terminalAPI.executeCommand(command);
      
      // Add result to output
      setOutput(prev => [
        ...prev,
        { 
          type: 'system', 
          content: result.message || JSON.stringify(result),
          success: result.success !== false
        }
      ]);
      
      // Clear command
      setCommand('');
      setError(null);
      
    } catch (err: any) {
      console.error('Command execution error:', err);
      
      // Check for API key IP restriction error
      const errorMessage = err.response?.data?.error || err.message;
      let displayError = errorMessage;
      
      if (errorMessage && errorMessage.includes("Invalid API-key, IP, or permissions")) {
        displayError = `${errorMessage}\n\nBinance API IP Restriction Error: You need to whitelist the server IP in your Binance API settings. Go to your Binance account > API Management and add this IP to the whitelist.`;
      }
      
      // Add error message to output
      setOutput(prev => [
        ...prev,
        { 
          type: 'system', 
          content: displayError,
          success: false
        }
      ]);
      
      setError('Error executing command');
    } finally {
      setLoading(false);
      
      // Focus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  // Clear output
  const clearHistory = () => {
    setOutput([
      { type: 'system', content: 'Terminal cleared' },
      { type: 'system', content: 'Type "help" for available commands' }
    ]);
  };
  
  // Format time
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}]`;
  };
  
  // Toggle info tooltip
  const toggleInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowInfo(prev => !prev);
  };
  
  // Get server IP
  const getServerIp = async () => {
    try {
      setLoading(true);
      const result = await terminalAPI.getServerIp();
      
      // Add result to output
      setOutput(prev => [
        ...prev,
        { 
          type: 'system', 
          content: `Server IP: ${result.serverIp}\n\nYou need to whitelist this IP in your Binance API settings.\nGo to your Binance account > API Management and add this IP to the whitelist.`,
          success: true
        }
      ]);
      
    } catch (err: any) {
      console.error('Error getting server IP:', err);
      
      // Add error message to output
      setOutput(prev => [
        ...prev,
        { 
          type: 'system', 
          content: `Failed to get server IP: ${err.message}`,
          success: false
        }
      ]);
      
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <TerminalContainer>
      <TerminalHeader>
        <TitleContainer>
          <Title>Terminal</Title>
          <div style={{ position: 'relative' }} ref={infoButtonRef}>
            <InfoButton onClick={toggleInfo}>
              i
            </InfoButton>
            {showInfo && (
              <InfoTooltip>
                <strong>Available Commands:</strong>
                <ul>
                  <li><code>l btc 10000</code> - Open long position for BTC with 10000 USDT</li>
                  <li><code>s btc 10000</code> - Open short position for BTC with 10000 USDT</li>
                  <li><code>close btcusdt</code> - Close position for BTCUSDT</li>
                  <li><code>positions</code> - List all open positions</li>
                  <li><code>price btc</code> - Show current price for BTC</li>
                  <li><code>balance</code> - Show account balance</li>
                  <li><code>help</code> - Show all available commands</li>
                </ul>
                <p style={{ marginTop: '10px', color: '#ef4444' }}>
                  <strong>Note:</strong> Make sure your Binance API has permissions for Futures trading and the server IP is whitelisted.
                </p>
              </InfoTooltip>
            )}
          </div>
        </TitleContainer>
        <ButtonsContainer>
          <ActionButton onClick={getServerIp} disabled={loading}>Show Server IP</ActionButton>
          <ActionButton onClick={clearHistory}>Clear</ActionButton>
        </ButtonsContainer>
      </TerminalHeader>
      
      <TerminalOutput ref={outputRef}>
        {output.map((item, index) => (
          <OutputLine key={index}>
            {item.timestamp && (
              <span style={{ color: '#6b7280', marginRight: '8px' }}>{formatTime(item.timestamp)}</span>
            )}
            {item.type === 'user' ? (
              <CommandLine>$ {item.content}</CommandLine>
            ) : (
              <ResultLine success={item.success}>{item.content}</ResultLine>
            )}
          </OutputLine>
        ))}
      </TerminalOutput>
      
      <CommandForm onSubmit={executeCommand}>
        <TerminalInput>
          <Prompt>$</Prompt>
          <Input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command (ex: l btc 10000)"
            disabled={loading}
            autoFocus
          />
          <RunButton type="submit" disabled={loading}>
            Run
          </RunButton>
        </TerminalInput>
      </CommandForm>
    </TerminalContainer>
  );
};

export default Terminal; 