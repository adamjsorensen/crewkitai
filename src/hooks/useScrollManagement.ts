
import { useState, useEffect, useRef, useCallback } from 'react';

export const useScrollManagement = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  // Initialize isNearBottom to false instead of true to prevent auto-scrolling on load
  const [isNearBottom, setIsNearBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check if scrolled near bottom
  const checkIfNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distance = scrollHeight - scrollTop - clientHeight;
    const isBottom = distance < 150;
    
    console.log(`[ScrollManagement] Distance from bottom: ${distance}px, isNearBottom: ${isBottom}`);
    return isBottom;
  }, []);

  // Handle scroll events to update button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const isBottom = checkIfNearBottom();
      setIsNearBottom(isBottom);
      setShowScrollButton(!isBottom);
      console.log(`[ScrollManagement] Scroll event - isNearBottom: ${isBottom}, showScrollButton: ${!isBottom}`);
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
  }, [checkIfNearBottom]);

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

  // Only auto-scroll when new messages arrive if user is already near bottom
  const scrollToBottomIfNeeded = useCallback(() => {
    console.log(`[ScrollManagement] scrollToBottomIfNeeded called - isNearBottom: ${isNearBottom}`);
    if (isNearBottom && messagesEndRef.current) {
      console.log('[ScrollManagement] Near bottom, scrolling to bottom');
      scrollToBottom();
    } else {
      console.log('[ScrollManagement] Not near bottom, skipping auto-scroll');
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
