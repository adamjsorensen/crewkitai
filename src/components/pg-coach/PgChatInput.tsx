
import React, { useState, useRef } from 'react';
import { SendIcon, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PgChatInputProps {
  onSendMessage: (message: string, image?: File | null) => void;
  isLoading: boolean;
  isMobile: boolean;
}

const PgChatInput: React.FC<PgChatInputProps> = ({ 
  onSendMessage, 
  isLoading,
  isMobile 
}) => {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter without shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSendMessage = () => {
    if (isLoading) return;
    
    if (!message.trim() && !imageFile) {
      toast({
        title: "Empty message",
        description: "Please enter a message or attach an image",
        variant: "destructive",
      });
      return;
    }
    
    onSendMessage(message, imageFile);
    setMessage('');
    setImageFile(null);
    setImagePreview(null);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 4MB",
        variant: "destructive",
      });
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="relative border-t border-border/40 bg-background py-2 px-3">
      <div className="mx-auto max-w-3xl">
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-2 relative w-20 h-20">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-20 h-20 object-cover rounded-md border border-border/40 shadow-sm" 
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background border border-border/40 shadow-sm hover:bg-primary/5"
              onClick={handleClearImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="min-h-[38px] max-h-[120px] resize-none pr-10 py-1.5 text-sm rounded-md border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 shadow-sm"
              disabled={isLoading}
            />
            <div className="absolute right-2 bottom-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <Label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-accent transition-colors">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </Label>
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!message.trim() && !imageFile)}
            className={`shrink-0 h-[38px] transition-all ${isMobile ? 'w-[38px] p-0' : ''} ${message.trim() || imageFile ? 'bg-primary hover:bg-primary/90' : 'bg-primary/80'}`}
            aria-label="Send message"
          >
            <SendIcon className="h-4 w-4" />
            {!isMobile && <span className="ml-1 text-xs">Send</span>}
          </Button>
        </div>
        
        <p className="text-[10px] text-muted-foreground mt-1 opacity-70">
          PainterGrowth Coach provides industry-specific advice for painters.
        </p>
      </div>
    </div>
  );
};

export default PgChatInput;
