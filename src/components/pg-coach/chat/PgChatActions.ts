
import { PgMessage } from '@/hooks/usePgChat';

export const createWelcomeMessage = (): PgMessage => ({
  id: 'welcome',
  role: 'assistant',
  content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
  timestamp: new Date(),
});

export const createUserMessage = (messageText: string, imageUrl: string | null = null): PgMessage => ({
  id: crypto.randomUUID(),
  role: 'user',
  content: messageText,
  timestamp: new Date(),
  imageUrl,
});

export const createPlaceholderMessage = (): PgMessage => ({
  id: crypto.randomUUID(),
  role: 'assistant',
  content: '',
  timestamp: new Date(),
  isPlaceholder: true,
});

export const prepareInitialMessages = (question: string, imageUrl: string | null = null): PgMessage[] => {
  return [
    createWelcomeMessage(),
    createUserMessage(question, imageUrl),
    createPlaceholderMessage()
  ];
};

export const prepareFollowUpMessages = (messages: PgMessage[], question: string, imageUrl: string | null = null): PgMessage[] => {
  return [
    ...messages,
    createUserMessage(question, imageUrl),
    createPlaceholderMessage()
  ];
};
