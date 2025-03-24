
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-mobile';
import { X, Search, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import ConversationList from './ConversationList';

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
  onPinConversation: (id: string) => void;
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSelectConversation = (id: string) => {
    console.log("[ConversationDialog] Selecting conversation:", id);
    onSelectConversation(id);
    onOpenChange(false);
  };
  
  const handleNewConversation = () => {
    console.log("[ConversationDialog] Creating new conversation");
    onNewConversation();
    onOpenChange(false);
  };
  
  const dialogContent = (
    <>
      <div className="px-4 pt-2 pb-3">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-muted/40 border-muted focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Separator className="mb-2" />
      
      <div className="flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={onDeleteConversation}
          onPinConversation={onPinConversation}
          searchQuery={searchQuery}
        />
      </div>
      
      <div className="p-3 border-t flex justify-center items-center">
        <Button 
          onClick={handleNewConversation} 
          className="w-full justify-center rounded-md py-2 px-3 bg-primary/90 hover:bg-primary text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Chat
        </Button>
      </div>
    </>
  );
  
  console.log("[ConversationDialog] Rendering with isMobile:", isMobile, "open:", open);
  
  // For mobile, we use Sheet (slides up)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle className="text-lg font-semibold">Conversation History</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            {dialogContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  // For desktop, we use Dialog (full-screen modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">Conversation History</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          {dialogContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationDialog;
