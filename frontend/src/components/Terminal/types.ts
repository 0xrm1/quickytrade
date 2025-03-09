import React from 'react';

/**
 * Terminal çıktı öğesi
 */
export interface OutputItem {
  type: 'user' | 'system';
  content: string;
  timestamp?: number;
  success?: boolean;
}

/**
 * Terminal çıktısı bileşeni props
 */
export interface TerminalOutputProps {
  output: OutputItem[];
  formatTime: (timestamp?: number) => string;
}

/**
 * Terminal girişi bileşeni props
 */
export interface TerminalInputProps {
  command: string;
  loading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onCommandChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Bilgi tooltip bileşeni props
 */
export interface InfoTooltipProps {
  show: boolean;
}

/**
 * Terminal başlığı bileşeni props
 */
export interface TerminalHeaderProps {
  showInfo: boolean;
  loading: boolean;
  toggleInfo: (e: React.MouseEvent) => void;
  getServerIp?: () => Promise<void>;
  clearHistory: () => void;
  infoButtonRef: React.RefObject<HTMLDivElement | null>;
} 