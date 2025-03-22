
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
  isPinned?: boolean;
  isSaved?: boolean;
  needsRegeneration?: boolean;
};

export type ConversationContext = {
  role: 'user' | 'assistant';
  content: string;
};

// Standardize the AI role types for more consistent handling
export type AIRole = 'assistant';
export type UserRole = 'user';
export type MessageRole = AIRole | UserRole;
