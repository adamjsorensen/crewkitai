
import React from 'react';
import ImagePreview from './ImagePreview';
import ChatMessageInput from './ChatMessageInput';
import { User } from '@supabase/supabase-js';

interface ChatInputAreaProps {
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  isUploading: boolean;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  removeImage: () => void;
  handleSendMessage: () => void;
  handleImageClick: () => void;
  isThinkMode: boolean;
  setIsThinkMode: (isThinking: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  user: User | null;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  isMobile: boolean;
}

const ChatInputArea = ({
  input,
  setInput,
  isLoading,
  isUploading,
  imageFile,
  imagePreviewUrl,
  removeImage,
  handleSendMessage,
  handleImageClick,
  isThinkMode,
  setIsThinkMode,
  handleKeyDown,
  user,
  inputRef,
  isMobile
}: ChatInputAreaProps) => {
  return (
    <div className="fixed bottom-0 md:left-[4.5rem] left-0 right-0 border-t px-3 sm:px-4 py-2 sm:py-3 bg-background/95 backdrop-blur-sm z-20">
      <ImagePreview 
        imagePreviewUrl={imagePreviewUrl} 
        removeImage={removeImage} 
      />
      
      <ChatMessageInput 
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isUploading={isUploading}
        imageFile={imageFile}
        handleSendMessage={handleSendMessage}
        handleImageClick={handleImageClick}
        isThinkMode={isThinkMode}
        setIsThinkMode={setIsThinkMode}
        handleKeyDown={handleKeyDown}
        user={user}
        inputRef={inputRef}
        isMobile={isMobile}
      />
    </div>
  );
};

export default React.memo(ChatInputArea);
