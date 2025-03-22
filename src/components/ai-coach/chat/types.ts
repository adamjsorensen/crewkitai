
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageUrl?: string | null;
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
