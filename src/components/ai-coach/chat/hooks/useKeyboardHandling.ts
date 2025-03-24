
import { useCallback } from 'react';

interface UseKeyboardHandlingProps {
  handleSendMessage: () => void;
  isLoading?: boolean;
  input?: string;
}

export const useKeyboardHandling = ({ 
  handleSendMessage, 
  isLoading = false,
  input = ''
}: UseKeyboardHandlingProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Only send message if Enter is pressed without Shift and input isn't empty
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && input.trim()) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage, isLoading, input]);

  return {
    handleKeyDown
  };
};
