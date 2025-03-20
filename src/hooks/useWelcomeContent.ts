
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type WelcomeCategory = {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  examples: WelcomeExample[];
};

export type WelcomeExample = {
  id: string;
  title: string;
};

export const useWelcomeContent = () => {
  const [categories, setCategories] = useState<WelcomeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWelcomeContent = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('ai_coach_welcome_content')
          .select('*')
          .eq('type', 'category')
          .order('position', { ascending: true });
          
        if (categoriesError) throw categoriesError;
        
        const fetchedCategories: WelcomeCategory[] = [];
        
        // For each category, fetch its examples
        for (const category of categoriesData || []) {
          const { data: examplesData, error: examplesError } = await supabase
            .from('ai_coach_welcome_content')
            .select('*')
            .eq('type', 'example')
            .eq('category_id', category.id)
            .order('position', { ascending: true });
            
          if (examplesError) throw examplesError;
          
          fetchedCategories.push({
            id: category.id,
            title: category.title,
            description: category.description || '',
            icon: category.icon || 'MessageSquare',
            iconColor: category.icon_color || 'blue-500',
            examples: (examplesData || []).map(example => ({
              id: example.id,
              title: example.title
            }))
          });
        }
        
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching welcome content:', error);
        setError('Failed to load welcome content');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWelcomeContent();
  }, []);
  
  return { categories, isLoading, error };
};
