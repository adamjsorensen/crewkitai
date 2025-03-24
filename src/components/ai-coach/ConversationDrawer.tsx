
import React from 'react';
import { Button } from '@/components/ui/button';
import { HistoryIcon } from 'lucide-react';

interface ConversationDrawerProps {
  onClick: () => void;
}

const ConversationDrawer: React.FC<ConversationDrawerProps> = ({ onClick }) => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1"
      onClick={onClick}
    >
      <HistoryIcon className="h-4 w-4" />
      <span>History</span>
    </Button>
  );
};

export default ConversationDrawer;
