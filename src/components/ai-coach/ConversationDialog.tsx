
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-mobile';
import ConversationList from './ConversationList';
import { HistoryIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Conversation = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  pinned: boolean;
};

interface ConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string, pinned: boolean) => void;
}

const ConversationDialog: React.FC<ConversationDialogProps> = ({
  open,
  onOpenChange,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onPinConversation,
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    onOpenChange(false);
  };
  
  const handleNewConversation = () => {
    onNewConversation();
    onOpenChange(false);
  };
  
  // For mobile, we use Sheet (slides up)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle className="text-lg font-semibold">Conversation History</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>
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
        </SheetContent>
      </Sheet>
    );
  }
  
  // For desktop, we use Dialog (full-screen modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">Conversation History</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        <div className="h-full pb-8 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={onDeleteConversation}
            onPinConversation={onPinConversation}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationDialog;
