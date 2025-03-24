
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isSaved?: boolean;
  isError?: boolean;
  isPlaceholder?: boolean;
  suggestedFollowUps?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  pinned: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  isFirstMessage: boolean;
}
