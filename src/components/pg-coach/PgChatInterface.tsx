
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import PgChatInterface from './chat/PgChatInterface';

/**
 * This component redirects to the new implementation in the chat directory
 * to maintain backward compatibility with existing imports
 */
const PgChatInterfaceWrapper: React.FC<{
  conversationId?: string | null;
  onConversationStart?: (id: string) => void;
  onNewChat?: () => void;
  onOpenHistory: () => void;
}> = (props) => {
  const isMobile = useIsMobile();
  
  return (
    <PgChatInterface 
      conversationId={props.conversationId}
      onConversationStart={props.onConversationStart}
      onNewChat={props.onNewChat}
      onOpenHistory={props.onOpenHistory}
    />
  );
};

export default PgChatInterfaceWrapper;
