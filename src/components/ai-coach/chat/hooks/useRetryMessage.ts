
import { useCallback } from 'react';
import { Message } from '../types';

interface UseRetryMessageProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const useRetryMessage = ({
  messages,
  setMessages
}: UseRetryMessageProps) => {
  const handleRetry = useCallback(() => {
    let lastUserMessage: Message | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i];
        break;
      }
    }
    if (lastUserMessage) {
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages.pop();
        }
        if (newMessages[newMessages.length - 1].role === 'user') {
          newMessages.pop();
        }
        return newMessages;
      });
      return lastUserMessage.content;
    }
    return '';
  }, [messages, setMessages]);

  return {
    handleRetry
  };
};
