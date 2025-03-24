
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { debounce } from '@/lib/utils';

interface UseFormAutoSaveOptions<T> {
  values: T;
  onSave: (values: T) => Promise<any>;
  debounceMs?: number;
  enableAutoSave?: boolean;
  saveMessage?: string;
}

export function useFormAutoSave<T>({
  values,
  onSave,
  debounceMs = 2000,
  enableAutoSave = true,
  saveMessage = "Progress auto-saved"
}: UseFormAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Create a debounced save function
  const debouncedSave = debounce(async (data: T) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      await onSave(data);
      setLastSaved(new Date());
      
      toast({
        title: saveMessage,
        description: `Last saved at ${new Date().toLocaleTimeString()}`,
        duration: 2000,
      });
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

  // Effect to trigger save when values change
  useEffect(() => {
    if (enableAutoSave && user) {
      debouncedSave(values);
    }
    
    return () => {
      debouncedSave.cancel();
    };
  }, [values, enableAutoSave, user]);

  return {
    isSaving,
    lastSaved,
    saveNow: () => debouncedSave(values, true)
  };
}
