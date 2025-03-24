
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CompassTag } from '@/types/compass';

export const useCompassTags = () => {
  const [tags, setTags] = useState<CompassTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load tags
  const loadTags = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('compass_tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching tags:', error);
        toast({
          title: "Error",
          description: "Failed to load tags.",
          variant: "destructive",
        });
        return;
      }

      setTags(data || []);
    } catch (err) {
      console.error('Error in load tags:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new tag
  const createTag = async (name: string, color: string = '#8B5CF6') => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('compass_tags')
        .insert({
          user_id: user.id,
          name,
          color
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating tag:', error);
        toast({
          title: "Error",
          description: "Failed to create tag.",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Tag Created",
        description: `Tag "${name}" has been created.`,
      });
      
      // Refresh tags
      await loadTags();
      
      return data;
    } catch (err) {
      console.error('Error in create tag:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update a tag
  const updateTag = async (id: string, updates: { name?: string, color?: string }) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('compass_tags')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating tag:', error);
        toast({
          title: "Error",
          description: "Failed to update tag.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Tag Updated",
        description: "The tag has been updated.",
      });
      
      // Refresh tags
      await loadTags();
      
      return true;
    } catch (err) {
      console.error('Error in update tag:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete a tag
  const deleteTag = async (id: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('compass_tags')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting tag:', error);
        toast({
          title: "Error",
          description: "Failed to delete tag.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Tag Deleted",
        description: "The tag has been deleted.",
      });
      
      // Refresh tags
      await loadTags();
      
      return true;
    } catch (err) {
      console.error('Error in delete tag:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Associate a tag with a task
  const addTagToTask = async (taskId: string, tagId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('compass_task_tags')
        .insert({
          task_id: taskId,
          tag_id: tagId
        });

      if (error) {
        // If the error is due to unique constraint violation, it means the tag is already added
        if (error.code === '23505') {
          return true;
        }
        
        console.error('Error adding tag to task:', error);
        toast({
          title: "Error",
          description: "Failed to add tag to task.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in add tag to task:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove a tag from a task
  const removeTagFromTask = async (taskId: string, tagId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('compass_task_tags')
        .delete()
        .match({
          task_id: taskId,
          tag_id: tagId
        });

      if (error) {
        console.error('Error removing tag from task:', error);
        toast({
          title: "Error",
          description: "Failed to remove tag from task.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in remove tag from task:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get tags for a specific task
  const getTagsForTask = async (taskId: string) => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('compass_task_tags')
        .select('tag_id')
        .eq('task_id', taskId);

      if (error) {
        console.error('Error fetching task tags:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      const tagIds = data.map(item => item.tag_id);
      
      const { data: tagsData, error: tagsError } = await supabase
        .from('compass_tags')
        .select('*')
        .in('id', tagIds);

      if (tagsError) {
        console.error('Error fetching tags by ids:', tagsError);
        return [];
      }

      return tagsData || [];
    } catch (err) {
      console.error('Error in get tags for task:', err);
      return [];
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadTags();
    }
  }, [user]);

  return {
    tags,
    isLoading,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    addTagToTask,
    removeTagFromTask,
    getTagsForTask
  };
};
