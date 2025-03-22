
// Add the 'thinking' role to the Message type
export type MessageRole = 'user' | 'assistant' | 'thinking';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  imageUrl?: string | null;
  timestamp: Date;
  keyPoints?: string[];
}
