
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
    <div className="relative border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-3 relative w-24 h-24">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-24 h-24 object-cover rounded-md border" 
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background"
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
              className="min-h-[60px] max-h-[200px] resize-none pr-12 py-3"
              disabled={isLoading}
            />
            <div className="absolute right-3 bottom-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <Label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </Label>
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!message.trim() && !imageFile)}
            className={`shrink-0 ${isMobile ? 'h-[60px]' : ''}`}
            aria-label="Send message"
          >
            <SendIcon className="h-5 w-5" />
            {!isMobile && <span className="ml-2">Send</span>}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          PainterGrowth Coach provides industry-specific advice for painters.
        </p>
      </div>
    </div>
  );
};

export default PgChatInput;
