
import { useEffect, useRef } from 'react';
import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { debounce } from '@/lib/utils';

interface UseFormAutoSaveProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSave: (data: T) => void;
  debounceTime?: number;
}

/**
 * Custom hook for auto-saving form data
 * @param form The react-hook-form instance
 * @param onSave Function to call when saving data
 * @param debounceTime Debounce time in milliseconds (default: 1000ms)
 */
export const useFormAutoSave = <T extends FieldValues>({
  form,
  onSave,
  debounceTime = 1000,
}: UseFormAutoSaveProps<T>) => {
  const { watch, getValues, formState } = form;
  const { isDirty } = formState;
  
  // Use useRef to persist the debounced function across renders
  const debouncedSave = useRef<ReturnType<typeof debounce>>();
  
  // Initialize the debounced function once
  useEffect(() => {
    debouncedSave.current = debounce((data: T) => {
      console.log('Auto-saving form data...', data);
      onSave(data);
    }, debounceTime);
    
    // Clean up the debounce timer when the component unmounts
    return () => {
      if (debouncedSave.current && 'cancel' in debouncedSave.current) {
        (debouncedSave.current as { cancel: () => void }).cancel();
      }
    };
  }, [onSave, debounceTime]);
  
  // Watch for changes and trigger the save
  useEffect(() => {
    if (!isDirty) return;
    
    const subscription = watch((formData) => {
      if (debouncedSave.current) {
        debouncedSave.current(getValues());
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, isDirty, getValues]);
  
  const save = () => {
    if (isDirty) {
      onSave(getValues());
    }
  };
  
  return { save };
};
