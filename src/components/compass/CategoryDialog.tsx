
import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CompassTaskDisplay } from '@/types/compass';
import { cn } from '@/lib/utils';
import CategoryBadge from './CategoryBadge';
import { useCompassCategorySelection } from '@/hooks/tasks/useCompassCategorySelection';

interface CategoryDialogProps {
  task: CompassTaskDisplay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  task,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { categories, isSubmitting, assignCategory, loadCategories } = useCompassCategorySelection();

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open, loadCategories]);

  const handleAssignCategory = async (categoryId: string | null) => {
    const success = await assignCategory(task.id, categoryId);
    
    if (success) {
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Assign Category</DialogTitle>
          <DialogDescription>
            Categorize this task to better organize your work.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Task</h3>
            <p className="text-sm">{task.task_text}</p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-2">Select a category:</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              <div
                className={cn(
                  "flex items-center justify-between p-2 rounded cursor-pointer",
                  !task.category_id ? "bg-accent" : "hover:bg-accent/50"
                )}
                onClick={() => handleAssignCategory(null)}
              >
                <span>No Category</span>
                {!task.category_id && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
              
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded cursor-pointer",
                    task.category_id === category.id ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleAssignCategory(category.id)}
                >
                  <CategoryBadge name={category.name} color={category.color} />
                  {task.category_id === category.id && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
