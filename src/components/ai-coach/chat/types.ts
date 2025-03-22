
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isLoading?: boolean;
  error?: boolean;
  errorInfo?: any;
  isStreaming?: boolean;
};

export type ConversationContext = {
  role: 'user' | 'assistant';
  content: string;
};
