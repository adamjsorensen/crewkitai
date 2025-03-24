
import React, { useState, useCallback, memo } from 'react';
import { ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MessageImagePreviewProps {
  imageUrl: string;
}

const MessageImagePreview: React.FC<MessageImagePreviewProps> = ({ imageUrl }) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  // Early return if no image
  if (!imageUrl) return null;

  // Use useCallback for the click handler to prevent recreating on each render
  const handleImageClick = useCallback(() => {
    setImageDialogOpen(true);
  }, []);
  
  // Use useCallback for the dialog state change handler
  const handleOpenChange = useCallback((open: boolean) => {
    setImageDialogOpen(open);
  }, []);

  return (
    <>
      <div className="mb-3 group relative cursor-pointer" onClick={handleImageClick}>
        <img 
          src={imageUrl} 
          alt="Uploaded image" 
          className="max-h-48 w-auto rounded-lg object-cover border border-border/10 lazy-load" 
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="h-8 w-8 text-white drop-shadow-md" />
        </div>
      </div>

      <Dialog open={imageDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Fullscreen view" 
              className="w-full h-auto object-contain max-h-[80vh] rounded-lg" 
              loading="lazy"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Rename to improve debugging in React DevTools
const MemoizedMessageImagePreview = memo(MessageImagePreview);
MemoizedMessageImagePreview.displayName = 'MessageImagePreview';

export default MemoizedMessageImagePreview;
