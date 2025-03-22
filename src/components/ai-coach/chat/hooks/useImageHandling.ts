
import { useState, useCallback, RefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseImageHandlingProps {
  user: any;
}

export const useImageHandling = ({ user }: UseImageHandlingProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageClick = useCallback((fileInputRef: RefObject<HTMLInputElement>) => {
    fileInputRef.current?.click();
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 1 * 1024 * 1024) {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              setImageFile(optimizedFile);
              setImagePreviewUrl(URL.createObjectURL(optimizedFile));
            }
          }, 'image/jpeg', 0.7);
        };
        
        img.src = URL.createObjectURL(file);
      } else {
        setImageFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
      }
    }
  }, [toast]);

  const removeImage = useCallback(() => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
  }, [imagePreviewUrl]);

  // Debug logging function with stack trace
  const logDebug = (message: string, data?: any) => {
    const stack = new Error().stack;
    console.log(`[ImageHandling] ${message}`, {
      data: data || '',
      timestamp: new Date().toISOString(),
      stack: stack?.split('\n').slice(2).join('\n')
    });
  };

  // Error logging function
  const logError = (message: string, error: any) => {
    console.error(`[ImageHandling:Error] ${message}`, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      logError('Upload failed - No user ID', { user });
      toast({
        title: "Upload failed",
        description: "User authentication required",
        variant: "destructive"
      });
      return null;
    }

    try {
      logDebug('Starting image upload process', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        userId: user.id
      });
      
      setIsUploading(true);
      
      // Validate file type and extension
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed.');
      }
      
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
        throw new Error('Invalid file extension. Supported formats: JPG, PNG, GIF, WebP');
      }
      
      // Generate unique file path
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      logDebug('Generated file path', { filePath });

      // Upload file to Supabase storage
      logDebug('Initiating Supabase upload', { bucket: 'chat_images', filePath });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        logError('Upload error', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      if (!uploadData?.path) {
        throw new Error('Upload succeeded but no file path returned');
      }
      
      logDebug('Upload successful', { uploadData });

      // Get signed URL for the uploaded file
      logDebug('Generating signed URL', { filePath });
      const { data: urlData, error: urlError } = await supabase.storage
        .from('chat_images')
        .createSignedUrl(filePath, 24 * 60 * 60); // 24 hour expiry

      if (urlError) {
        logError('Error generating signed URL', urlError);
        throw new Error(`Failed to generate image URL: ${urlError.message}`);
      }
      
      if (!urlData?.signedUrl) {
        throw new Error('No signed URL returned');
      }
      
      // Test the signed URL
      try {
        logDebug('Testing signed URL accessibility');
        const testResponse = await fetch(urlData.signedUrl, { method: 'HEAD' });
        if (!testResponse.ok) {
          throw new Error(`URL test failed: ${testResponse.status} ${testResponse.statusText}`);
        }
        logDebug('Signed URL is accessible', { 
          status: testResponse.status,
          contentType: testResponse.headers.get('content-type')
        });
      } catch (testError) {
        logError('Signed URL test failed', testError);
        throw new Error('Generated URL is not accessible');
      }

      logDebug('Image upload process completed', { 
        signedUrl: urlData.signedUrl.substring(0, 100) + '...',
        filePath,
        fileSize: file.size
      });

      return urlData.signedUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Upload process failed', error);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    imageFile,
    setImageFile,
    imagePreviewUrl,
    setImagePreviewUrl,
    isUploading,
    handleImageClick,
    handleImageChange,
    removeImage,
    uploadImage
  };
};
