
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImagePreviewProps {
  imagePreviewUrl: string | null;
  removeImage: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imagePreviewUrl, removeImage }) => {
  if (!imagePreviewUrl) return null;

  return (
    <div className="relative mb-2 inline-block">
      <div className="relative group">
        <img 
          src={imagePreviewUrl} 
          alt="Upload preview" 
          className="h-20 w-auto rounded-md object-cover border border-border/40"
        />
        <Button 
          variant="destructive" 
          size="icon" 
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full" 
          onClick={removeImage}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default ImagePreview;
