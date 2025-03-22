
import { useCallback, useState } from 'react';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js';
import { useImageAnalysis } from './useImageAnalysis';
import { useSendMessage } from './useSendMessage';
import { useRetryMessage } from './useRetryMessage';
import { useRegenerateMessage } from './useRegenerateMessage';

interface UseMessageHandlerProps {
  user: User | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: (input: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  setIsThinkMode: (isThinkMode: boolean) => void;
  scrollToBottom: () => void;
  uploadImage: (file: File) => Promise<string | null>;
  removeImage: () => void;
}

export const useMessageHandler = ({
  user,
  messages,
  setMessages,
  setInput,
  setIsLoading,
  setError,
  conversationId,
  onConversationCreated,
  setIsThinkMode,
  scrollToBottom,
  uploadImage,
  removeImage
}: UseMessageHandlerProps) => {
  // Track if we're in the process of adding UI elements
  const [isAddingToUI, setIsAddingToUI] = useState(false);
  
  // Use our refactored send message hook with improved response handling
  const { handleSendMessage: sendMessage } = useSendMessage({
    user,
    messages,
    setMessages,
    setIsLoading,
    setError,
    conversationId,
    onConversationCreated,
    uploadImage,
    removeImage,
    setIsThinkMode
  });
  
  const { handleRetry: baseHandleRetry } = useRetryMessage({
    messages,
    setMessages
  });
  
  const { handleRegenerateMessage } = useRegenerateMessage({
    user,
    messages,
    setMessages,
    setIsLoading,
    setError,
    conversationId
  });
  
  const {
    analyzeImage,
    isAnalyzing
  } = useImageAnalysis({
    user,
    conversationId,
    onConversationCreated,
    setMessages,
    setError,
    scrollToBottom
  });

  const fillInputWithExample = useCallback((question: string) => {
    console.log("[useMessageHandler] Filling input with example:", question);
    setInput(question);
  }, [setInput]);

  // Immediately add user message to UI without waiting for API response
  const prepareUserMessageUI = useCallback((input: string) => {
    if (!input.trim() || isAddingToUI) return null;
    
    console.log("[useMessageHandler] Preparing user message UI for:", input);
    setIsAddingToUI(true);
    
    try {
      const userMessageId = `user-${Date.now()}`;
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: input,
        timestamp: new Date()
      };
      
      // Add user message to UI immediately
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      
      // Scroll to show the new message
      setTimeout(scrollToBottom, 10);
      
      return userMessage;
    } finally {
      setIsAddingToUI(false);
    }
  }, [setMessages, setInput, scrollToBottom]);

  // Send message with improved response handling
  const handleSendMessage = useCallback(async (input: string, shouldUseThinkMode: boolean = false) => {
    if (!input.trim()) return;
    
    console.log("[useMessageHandler] handleSendMessage called with:", input, "thinkMode:", shouldUseThinkMode);
    
    try {
      // First add the user message to UI
      const userMessage = prepareUserMessageUI(input);
      
      if (!userMessage) {
        console.log("[useMessageHandler] Failed to create user message UI");
        return;
      }
      
      console.log("[useMessageHandler] User message added, now sending to API");
      
      // Set loading state
      setIsLoading(true);
      
      // Then send the message to the API and await the response
      const response = await sendMessage(input, null, shouldUseThinkMode);
      
      console.log("[useMessageHandler] API call completed with response:", response);
      
      // Verify the placeholder was replaced properly
      setTimeout(() => {
        console.log("[useMessageHandler] Current messages after response:", 
          messages.map(m => ({ id: m.id, role: m.role, isPlaceholder: m.isPlaceholder })));
        
        // Force scroll to bottom to ensure new message is visible
        scrollToBottom();
      }, 100);
      
      return response;
    } catch (error) {
      console.error('[useMessageHandler] Error in handleSendMessage:', error);
      setError('Failed to send message. Please try again.');
      // Ensure loading state is reset
      setIsLoading(false);
    }
  }, [sendMessage, setError, prepareUserMessageUI, setIsLoading, messages, scrollToBottom]);

  const handleRetry = useCallback(() => {
    const lastContent = baseHandleRetry();
    setInput(lastContent);
  }, [baseHandleRetry, setInput]);

  return {
    fillInputWithExample,
    handleSendMessage,
    prepareUserMessageUI,
    handleRetry,
    handleRegenerateMessage,
    analyzeImage,
    isAnalyzing
  };
};
