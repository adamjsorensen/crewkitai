
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
      // Make this more sensitive - show the button when we're more than 50px from bottom
      const isNearBottom = distance < 50;
      
      console.log(`[ScrollManagement] Distance from bottom: ${distance}px, showScrollButton: ${!isNearBottom}`);
      setShowScrollButton(!isNearBottom && distance > 10);
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

  // Add an effect to update button visibility when container content changes
  useEffect(() => {
    // Use a MutationObserver to detect when new content is added to the container
    if (messagesContainerRef.current) {
      const observer = new MutationObserver(() => {
        // When content changes, check if we need to show the scroll button
        if (messagesContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
          const distance = scrollHeight - scrollTop - clientHeight;
          // Match the same threshold as in the scroll handler
          const isNearBottom = distance < 50;
          
          console.log(`[ScrollManagement] Content changed, distance: ${distance}px, showScrollButton: ${!isNearBottom}`);
          setShowScrollButton(!isNearBottom && distance > 10);
        }
      });
      
      observer.observe(messagesContainerRef.current, { 
        childList: true, 
        subtree: true,
        characterData: true 
      });
      
      return () => observer.disconnect();
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
        
        // Double-check scroll position after animation
        setTimeout(() => {
          const container = messagesContainerRef.current;
          if (container) {
            const { scrollHeight, clientHeight } = container;
            container.scrollTop = scrollHeight - clientHeight;
            
            // After scrolling, hide the button
            setShowScrollButton(false);
          }
        }, 500);
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
