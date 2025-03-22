
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isStreaming?: boolean;
  isLoading?: boolean; // Adding the missing property
  error?: boolean;     // Adding error property for completeness
};

export type ConversationContext = {
  role: 'user' | 'assistant';
  content: string;
}[];
