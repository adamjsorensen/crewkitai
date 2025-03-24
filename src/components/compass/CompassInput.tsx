
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CompassAnalyzeResponse } from '@/types/compass';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompassCategories } from '@/hooks/useCompassCategories';

interface CompassInputProps {
  onTasksGenerated: (response: CompassAnalyzeResponse) => void;
}

const CompassInput: React.FC<CompassInputProps> = ({ onTasksGenerated }) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useCompassCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some tasks or ideas to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use this feature.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('compass-analyze', {
        body: {
          input: input.trim(),
          user_id: user.id,
          category_id: selectedCategory
        }
      });
      
      if (error) {
        console.error('Error analyzing tasks:', error);
        toast({
          title: "Error",
          description: "Failed to analyze your tasks. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Success, call the callback with the response
      onTasksGenerated(data as CompassAnalyzeResponse);
      
      // Clear input
      setInput('');
      
    } catch (err) {
      console.error('Error in task analysis:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "none" ? null : value);
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Enter your tasks, notes, or ideas... I'll help prioritize them for you."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
          />
          
          {categories.length > 0 && (
            <Select
              value={selectedCategory || "none"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Default category (none)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create Plan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompassInput;
