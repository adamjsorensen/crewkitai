
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
};

export type ConversationContext = {
  role: 'user' | 'assistant';
  content: string;
}[];
