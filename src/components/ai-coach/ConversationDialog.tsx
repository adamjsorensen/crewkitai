
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-mobile';
import { HistoryIcon, X, Search, PlusCircle, ExternalLink, Edit, Trash2, ArrowUpDown } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    onOpenChange(false);
  };
  
  const handleNewConversation = () => {
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
        
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
          <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/90">
            Show All
          </Button>
        </div>
        
        <Button 
          onClick={handleNewConversation} 
          variant="ghost"
          className="w-full justify-start rounded-md py-2 px-3 text-base font-medium hover:bg-primary/10 mb-2"
        >
          <PlusCircle className="h-4 w-4 mr-3 text-primary" />
          Create New Chat
        </Button>
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
      
      <div className="p-3 border-t flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            Sort
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Go
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
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
  
  // For desktop, we use Dialog (full-screen modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">Conversation History</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
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
