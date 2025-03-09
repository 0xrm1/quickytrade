/**
 * Watchlist bileşeni için tip tanımları
 */

// Watchlist öğesi
export interface WatchlistItem {
  symbol: string;
  listId: number;
  addedAt?: string;
}

// Ticker verisi
export interface TickerData {
  [symbol: string]: {
    price: string;
    priceChangePercent: string;
  };
}

// Buton ayarları
export interface ButtonSettings {
  longAmounts: number[];
  longLabels: string[];
  shortAmounts: number[];
  shortLabels: string[];
}

// Watchlist Header Props
export interface WatchlistHeaderProps {
  showAddForm: boolean;
  setShowAddForm: React.Dispatch<React.SetStateAction<boolean>>;
  openSettingsModal: () => void;
  activeTab: number;
  handleTabChange: (tabId: number) => void;
}

// Watchlist Tabs Props
export interface WatchlistTabsProps {
  activeTab: number;
  handleTabChange: (tabId: number) => void;
}

// Add Symbol Form Props
export interface AddSymbolFormProps {
  showAddForm: boolean;
  newSymbol: string;
  setNewSymbol: React.Dispatch<React.SetStateAction<string>>;
  handleAddSymbol: (e: React.FormEvent) => Promise<void>;
}

// Symbol Item Props
export interface SymbolItemProps {
  item: WatchlistItem;
  ticker: {
    price: string;
    priceChangePercent: string;
  };
  processingOrder: boolean;
  orderSymbol: string;
  buttonSettings: ButtonSettings;
  handleRemoveSymbol: (symbol: string) => Promise<void>;
  handleOpenPosition: (symbol: string, amount: number, side: 'long' | 'short') => Promise<void>;
  getDecimalPrecision: (symbol: string) => number;
}

// Settings Modal Props
export interface SettingsModalProps {
  showSettingsModal: boolean;
  formSettings: ButtonSettings;
  handleSettingsChange: (type: 'long' | 'short', index: number, field: 'amount' | 'label', value: string) => void;
  saveSettings: () => void;
  closeSettingsModal: () => void;
}

// Symbol List Props
export interface SymbolListProps {
  loading: boolean;
  error: string | null;
  watchlist: WatchlistItem[];
  activeTab: number;
  tickerData: TickerData;
  processingOrder: boolean;
  orderSymbol: string;
  buttonSettings: ButtonSettings;
  handleRemoveSymbol: (symbol: string) => Promise<void>;
  handleOpenPosition: (symbol: string, amount: number, side: 'long' | 'short') => Promise<void>;
  getDecimalPrecision: (symbol: string) => number;
} 