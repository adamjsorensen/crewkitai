
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '../types';

export const useConversationUtils = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  onConversationCreated?: (id: string) => void
) => {
  const [isCopying, setIsCopying] = useState(false);
  const { toast } = useToast();

  const copyConversation = async () => {
    try {
      setIsCopying(true);
      const conversationText = messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => `${msg.role === 'user' ? 'You' : 'AI Coach'}: ${msg.content}`)
        .join('\n\n');
      await navigator.clipboard.writeText(conversationText);
      toast({
        title: "Copied!",
        description: "Conversation copied to clipboard"
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    } finally {
      setIsCopying(false);
    }
  };

  const clearConversation = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
      timestamp: new Date()
    }]);
    if (onConversationCreated) {
      onConversationCreated('');
    }
    toast({
      title: "Started new conversation",
      description: "You can now start a new conversation"
    });
  }, [setMessages, onConversationCreated, toast]);

  return {
    isCopying,
    copyConversation,
    clearConversation
  };
};
