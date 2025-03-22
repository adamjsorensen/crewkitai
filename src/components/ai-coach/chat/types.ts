
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isPlaceholder?: boolean;
  isSaved?: boolean;
}

export interface ChatThreadProps {
  messages: Message[];
  isLoading: boolean;
  onRetry: () => void;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}
