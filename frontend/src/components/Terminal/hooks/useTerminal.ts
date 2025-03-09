import { useState, useEffect, useRef, useCallback } from 'react';
import { OutputItem } from '../types';
import { terminalAPI } from '../../../services/api';

interface UseTerminalReturn {
  command: string;
  output: OutputItem[];
  loading: boolean;
  error: string | null;
  showInfo: boolean;
  outputRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  infoButtonRef: React.RefObject<HTMLDivElement | null>;
  setCommand: React.Dispatch<React.SetStateAction<string>>;
  executeCommand: (e: React.FormEvent) => Promise<void>;
  clearHistory: () => void;
  formatTime: (timestamp?: number) => string;
  toggleInfo: (e: React.MouseEvent) => void;
  getServerIp: () => Promise<void>;
}

export const useTerminal = (): UseTerminalReturn => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<OutputItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  // Refs
  const outputRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const infoButtonRef = useRef<HTMLDivElement | null>(null);
  
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
  const executeCommand = useCallback(async (e: React.FormEvent) => {
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
  }, [command]);
  
  // Clear command history
  const clearHistory = () => {
    setOutput([{
      type: 'system',
      content: 'Terminal cleared',
      timestamp: Date.now(),
      success: true
    }, {
      type: 'system',
      content: 'Type "help" for available commands',
      timestamp: Date.now(),
      success: true
    }]);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Format time
  const formatTime = useCallback((timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}]`;
  }, []);
  
  // Toggle info tooltip
  const toggleInfo = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowInfo(prev => !prev);
  }, []);
  
  // Get server IP
  const getServerIp = useCallback(async () => {
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
  }, []);
  
  return {
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
    toggleInfo,
    getServerIp
  };
}; 