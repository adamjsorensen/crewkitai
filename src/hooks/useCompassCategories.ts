
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CompassCategory } from '@/types/compass';

export const useCompassCategories = () => {
  const [categories, setCategories] = useState<CompassCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load categories
  const loadCategories = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('compass_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive",
        });
        return;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Error in load categories:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new category
  const createCategory = async (name: string, color: string = '#6366F1') => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('compass_categories')
        .insert({
          user_id: user.id,
          name,
          color
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        toast({
          title: "Error",
          description: "Failed to create category.",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Category Created",
        description: `Category "${name}" has been created.`,
      });
      
      // Refresh categories
      await loadCategories();
      
      return data;
    } catch (err) {
      console.error('Error in create category:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update a category
  const updateCategory = async (id: string, updates: { name?: string, color?: string }) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('compass_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating category:', error);
        toast({
          title: "Error",
          description: "Failed to update category.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Category Updated",
        description: "The category has been updated.",
      });
      
      // Refresh categories
      await loadCategories();
      
      return true;
    } catch (err) {
      console.error('Error in update category:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete a category
  const deleteCategory = async (id: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('compass_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        toast({
          title: "Error",
          description: "Failed to delete category. Make sure it's not being used by any tasks.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Category Deleted",
        description: "The category has been deleted.",
      });
      
      // Refresh categories
      await loadCategories();
      
      return true;
    } catch (err) {
      console.error('Error in delete category:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  return {
    categories,
    isLoading,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
