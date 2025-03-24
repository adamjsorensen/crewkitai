
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompassCategories } from '@/hooks/useCompassCategories';

export const useCompassCategorySelection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories, loadCategories } = useCompassCategories();
  const { toast } = useToast();

  const assignCategory = async (taskId: string, categoryId: string | null) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('compass_tasks')
        .update({ 
          category_id: categoryId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error assigning category:', error);
        toast({
          title: "Error",
          description: "Failed to assign category. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Category Assigned",
        description: "The task category has been updated.",
      });
      
      return true;
    } catch (err) {
      console.error('Error in assign category:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    categories,
    isSubmitting,
    assignCategory,
    loadCategories
  };
};
