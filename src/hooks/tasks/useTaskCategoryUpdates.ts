
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTaskCategoryUpdates = () => {
  const { toast } = useToast();

  // Update task category
  const updateTaskCategory = async (taskId: string, categoryId: string | null) => {
    try {
      const { error } = await supabase
        .from('compass_tasks')
        .update({ 
          category_id: categoryId,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task category:', error);
        toast({
          title: "Error",
          description: "Failed to update task category.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in update task category:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    updateTaskCategory
  };
};
