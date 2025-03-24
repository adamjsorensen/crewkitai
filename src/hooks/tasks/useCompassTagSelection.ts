
import { useState, useCallback } from 'react';
import { useCompassTags } from '@/hooks/useCompassTags';
import { useToast } from '@/hooks/use-toast';

export const useCompassTagSelection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { tags, addTagToTask, removeTagFromTask, loadTags } = useCompassTags();
  const { toast } = useToast();

  const toggleTag = useCallback(async (taskId: string, tagId: string, isCurrentlyAssigned: boolean) => {
    setIsSubmitting(true);
    
    try {
      let success: boolean;
      
      if (isCurrentlyAssigned) {
        // Remove tag
        success = await removeTagFromTask(taskId, tagId);
        if (success) {
          toast({
            title: "Tag Removed",
            description: "The tag has been removed from the task.",
          });
        }
      } else {
        // Add tag
        success = await addTagToTask(taskId, tagId);
        if (success) {
          toast({
            title: "Tag Added",
            description: "The tag has been added to the task.",
          });
        }
      }
      
      return success;
    } catch (err) {
      console.error('Error toggling tag:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred with tag assignment.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [addTagToTask, removeTagFromTask, toast]);

  return {
    tags,
    isSubmitting,
    toggleTag,
    loadTags
  };
};
