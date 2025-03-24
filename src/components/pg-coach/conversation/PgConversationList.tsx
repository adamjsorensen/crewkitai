
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import PgConversationItem from './PgConversationItem';
import PgConversationPagination from './PgConversationPagination';
import { PgConversationEmptyState, PgConversationLoadingState } from './PgConversationStates';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  pinned: boolean;
}

interface PgConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onTogglePinConversation: (id: string, pinned: boolean) => void;
}

const PgConversationList: React.FC<PgConversationListProps> = ({
  conversations,
  isLoading,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onTogglePinConversation
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(conversations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedConversations = conversations.slice(startIndex, startIndex + itemsPerPage);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  if (isLoading) {
    return <PgConversationLoadingState />;
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Button 
          onClick={onNewConversation} 
          variant="outline" 
          size="sm"
        >
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <PgConversationEmptyState />
        ) : (
          <div className="divide-y">
            {displayedConversations.map((conversation) => (
              <PgConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversationId === conversation.id}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
                onTogglePin={onTogglePinConversation}
              />
            ))}
          </div>
        )}
      </div>
      
      <PgConversationPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default PgConversationList;
