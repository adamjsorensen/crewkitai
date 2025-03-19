
import React from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { List } from 'lucide-react';
import ConversationList from './ConversationList';

type Conversation = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  pinned: boolean;
};

interface ConversationDrawerProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string, pinned: boolean) => void;
}

const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onPinConversation,
}) => {
  const [open, setOpen] = React.useState(false);
  
  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    setOpen(false);
  };
  
  const handleNewConversation = () => {
    onNewConversation();
    setOpen(false);
  };
  
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <List className="h-5 w-5" />
          <span className="sr-only">Open conversations</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="p-0">
          <DrawerTitle className="px-4 py-3 text-lg font-semibold">Conversations</DrawerTitle>
        </DrawerHeader>
        <div className="h-full pb-8">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={onDeleteConversation}
            onPinConversation={onPinConversation}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ConversationDrawer;
