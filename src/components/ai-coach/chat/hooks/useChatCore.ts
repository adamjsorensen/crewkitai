
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Message } from '../types';
import { fetchConversationHistory } from '../api/fetchConversationHistory';

/**
 * Core chat functionality providing basic state and history management
 */
export const useChatCore = (
  conversationId: string | null,
  isNewChat: boolean,
  onConversationCreated?: (id: string) => void
) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isThinkMode, setIsThinkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  
  // Fetch conversation history
  const { data: historyMessages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['conversationHistory', conversationId],
    queryFn: () => fetchConversationHistory(conversationId, user?.id),
    enabled: !isNewChat && !!conversationId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Initialize messages based on conversation state
  useEffect(() => {
    if (isNewChat) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
        timestamp: new Date()
      }]);
    } else if (!isLoadingHistory && historyMessages.length > 0) {
      setMessages(historyMessages);
    } else if (!isLoadingHistory && historyMessages.length === 0 && !isNewChat && conversationId) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
        timestamp: new Date()
      }]);
    }
  }, [isNewChat, historyMessages, isLoadingHistory, conversationId]);

  return {
    input,
    setInput,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    error,
    setError,
    isThinkMode,
    setIsThinkMode,
    isLoadingHistory,
    fileInputRef,
    inputRef,
    user
  };
};
