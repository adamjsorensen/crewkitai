
import React from 'react';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

interface PgConversationDrawerProps {
  onClick: () => void;
}

const PgConversationDrawer: React.FC<PgConversationDrawerProps> = ({ onClick }) => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1"
      onClick={onClick}
    >
      <History className="h-4 w-4" />
      <span>History</span>
    </Button>
  );
};

export default PgConversationDrawer;
