// TypeScript interfaces for QuickButtonsBar component

/**
 * Hızlı buton verisi için interface
 */
export interface QuickButtonType {
  id: string;
  symbol: string;
  amount: number;
  side: 'long' | 'short';
  createdAt: string;
}

/**
 * Yeni buton oluşturma verisi için interface
 */
export interface NewButtonType {
  symbol: string;
  amount: string;
  side: 'long' | 'short';
}

/**
 * Hızlı buton bileşeni props
 */
export interface QuickButtonProps {
  button: QuickButtonType;
  processingOrder: boolean;
  processingButtonId: string | null;
  onExecute: (button: QuickButtonType) => Promise<void>;
  onRemove: (id: string, e: React.MouseEvent) => Promise<void>;
}

/**
 * Buton ekleme modalı props
 */
export interface AddButtonModalProps {
  show: boolean;
  newButton: NewButtonType;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => Promise<void>;
} 