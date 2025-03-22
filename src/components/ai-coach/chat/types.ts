
// Remove the 'thinking' role from the Message type
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  imageUrl?: string | null;
  timestamp: Date;
  keyPoints?: string[];
}
