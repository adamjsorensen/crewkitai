
import { useState, useEffect, useRef, useCallback } from 'react';

export const useScrollManagement = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollButton(!isNearBottom);
    };
    
    // Remove debounce for more responsive scroll button
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Enhanced scrollToBottom with more reliability
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
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
