
import { User } from '@supabase/supabase-js';
import { Message } from '../types';

interface UseImageUploadProps {
  user: User | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  uploadImage: (file: File) => Promise<string | null>;
  removeImage: () => void;
}

export const useImageUpload = ({
  user,
  setMessages,
  uploadImage,
  removeImage
}: UseImageUploadProps) => {
  
  const handleImageUpload = async (imageFile: File | null): Promise<string | null> => {
    if (!imageFile || !user) return null;
    
    try {
      const imageUrl = await uploadImage(imageFile);
      
      if (imageUrl) {
        // Update the user message with the image
        setMessages(prev => {
          const updated = [...prev];
          // Find the last user message
          const lastUserMsgIndex = updated.length - 1;
          if (lastUserMsgIndex >= 0 && updated[lastUserMsgIndex].role === 'user') {
            updated[lastUserMsgIndex] = {
              ...updated[lastUserMsgIndex],
              imageUrl
            };
          }
          return updated;
        });
      }
      
      // Clean up the image state
      removeImage();
      
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  return { handleImageUpload };
};
