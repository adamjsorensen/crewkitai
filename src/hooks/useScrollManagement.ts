
import { useState, useEffect, useRef, useCallback } from 'react';

export const useScrollManagement = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check if scrolled near bottom
  const checkIfNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 150;
  }, []);

  // Handle scroll events to update button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const isBottom = checkIfNearBottom();
      setIsNearBottom(isBottom);
      setShowScrollButton(!isBottom);
    };
    
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [checkIfNearBottom]);

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

  // Only auto-scroll when new messages arrive if user is already near bottom
  const scrollToBottomIfNeeded = useCallback(() => {
    if (isNearBottom && messagesEndRef.current) {
      scrollToBottom();
    }
  }, [isNearBottom, scrollToBottom]);

  return {
    showScrollButton,
    isNearBottom,
    messagesEndRef,
    messagesContainerRef,
    scrollToBottom,
    scrollToBottomIfNeeded
  };
};
