
import { useQuery } from '@tanstack/react-query';
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

// Function to fetch welcome content - separated for reusability
async function fetchWelcomeContent(): Promise<WelcomeCategory[]> {
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
  
  return fetchedCategories;
}

export const useWelcomeContent = () => {
  const { 
    data: categories = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['welcomeContent'],
    queryFn: fetchWelcomeContent,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
  
  return { categories, isLoading, error: error ? (error as Error).message : null };
};

// Export the fetch function for potential prefetching
export const prefetchWelcomeContent = async (queryClient: any) => {
  await queryClient.prefetchQuery({
    queryKey: ['welcomeContent'],
    queryFn: fetchWelcomeContent,
  });
};
