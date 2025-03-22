
import { useCallback } from 'react';

interface UseKeyboardHandlingProps {
  handleSendMessage: () => void;
}

export const useKeyboardHandling = ({ handleSendMessage }: UseKeyboardHandlingProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return {
    handleKeyDown
  };
};
