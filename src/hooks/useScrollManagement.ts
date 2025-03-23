
import { useState, useEffect, useRef, useCallback } from 'react';

export const useScrollManagement = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll events to update button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const distance = scrollHeight - scrollTop - clientHeight;
      const isBottom = distance < 150;
      
      console.log(`[ScrollManagement] Distance from bottom: ${distance}px, showScrollButton: ${!isBottom}`);
      setShowScrollButton(!isBottom);
    };
    
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      
      // Check initial scroll position
      setTimeout(() => {
        handleScroll();
      }, 100);
      
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Enhanced scrollToBottom with more reliability
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      console.log('[ScrollManagement] Executing scrollToBottom');
      // Force layout calculation before scrolling
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }, 50);
    }
  }, []);

  return {
    showScrollButton,
    messagesEndRef,
    messagesContainerRef,
    scrollToBottom
  };
};
