
import { useEffect, useRef, useState } from 'react';
import { FieldValues } from 'react-hook-form';
import { debounce } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface UseFormAutoSaveProps<T> {
  values: T;
  onSave: (data: T) => Promise<any> | null;
  enableAutoSave?: boolean;
  debounceMs?: number;
  saveMessage?: string;
}

/**
 * Custom hook for auto-saving form data
 * @param values The form values to save
 * @param onSave Function to call when saving data
 * @param enableAutoSave Whether auto-save is enabled
 * @param debounceMs Debounce time in milliseconds
 * @param saveMessage Message to show when saving
 */
export const useFormAutoSave = <T>({
  values,
  onSave,
  enableAutoSave = true,
  debounceMs = 2000,
  saveMessage = "Progress auto-saved"
}: UseFormAutoSaveProps<T>) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Use useRef to persist the debounced function across renders
  const debouncedSave = useRef<ReturnType<typeof debounce>>();
  
  // Initialize the debounced function once
  useEffect(() => {
    debouncedSave.current = debounce(async (data: T) => {
      if (!enableAutoSave) return;
      
      try {
        setIsSaving(true);
        console.log('Auto-saving form data...', data);
        const result = await onSave(data);
        
        if (saveMessage && result) {
          toast({
            title: saveMessage,
            description: `Last saved at ${new Date().toLocaleTimeString()}`,
            duration: 2000,
          });
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast({
          title: "Auto-save failed",
          description: "Your changes couldn't be saved automatically",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);
    
    // Clean up the debounce timer when the component unmounts
    return () => {
      if (debouncedSave.current && 'cancel' in debouncedSave.current) {
        (debouncedSave.current as { cancel: () => void }).cancel();
      }
    };
  }, [onSave, debounceMs, enableAutoSave, saveMessage, toast]);
  
  // Watch for changes and trigger the save
  useEffect(() => {
    if (enableAutoSave && values && debouncedSave.current) {
      debouncedSave.current(values);
    }
    
    return () => {
      if (debouncedSave.current && 'cancel' in debouncedSave.current) {
        (debouncedSave.current as { cancel: () => void }).cancel();
      }
    };
  }, [values, enableAutoSave]);
  
  const save = async () => {
    try {
      setIsSaving(true);
      await onSave(values);
      
      if (saveMessage) {
        toast({
          title: saveMessage,
          description: `Saved at ${new Date().toLocaleTimeString()}`,
        });
      }
    } catch (error) {
      console.error('Manual save failed:', error);
      toast({
        title: "Save failed",
        description: "Your changes couldn't be saved",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return { save, isSaving };
};
