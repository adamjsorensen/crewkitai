
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PgConversationList from './PgConversationList';

interface PgConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Array<{
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    pinned: boolean;
  }>;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onTogglePinConversation: (id: string, pinned: boolean) => void;
}

const PgConversationDialog: React.FC<PgConversationDialogProps> = ({
  open,
  onOpenChange,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onTogglePinConversation
}) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
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
      
      <div className="flex-1 overflow-hidden">
        <PgConversationList
          conversations={conversations.filter(conv => 
            searchQuery.trim() === '' || 
            conv.title.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          isLoading={false}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={onDeleteConversation}
          onNewConversation={onNewConversation}
          onTogglePinConversation={onTogglePinConversation}
        />
      </div>
    </>
  );
  
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
  
  // For desktop, we use Dialog (modal)
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

export default PgConversationDialog;
