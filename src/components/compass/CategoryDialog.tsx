
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { CompassTaskDisplay } from '@/types/compass';
import { useToast } from '@/hooks/use-toast';
import { useCompassCategories } from '@/hooks/useCompassCategories';
import { useCompassTasks } from '@/hooks/useCompassTasks';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { HexColorPicker } from 'react-colorful';

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
  const { categories, addCategory } = useCompassCategories();
  const { updateTaskCategory } = useCompassTasks();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    task.category ? task.category.id : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4f46e5');
  const { toast } = useToast();

  const handleSelectCategory = async () => {
    setIsSubmitting(true);

    try {
      const success = await updateTaskCategory(task.id, selectedCategoryId);
      
      if (success) {
        toast({
          title: "Category Updated",
          description: selectedCategoryId 
            ? "Task category has been updated." 
            : "Category has been removed from task.",
        });
        
        onSuccess();
        onOpenChange(false);
      }
    } catch (err) {
      console.error('Error in category selection:', err);
      toast({
        title: "Error",
        description: "Failed to update task category.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newCategory = await addCategory(newCategoryName, newCategoryColor);
      
      if (newCategory) {
        setSelectedCategoryId(newCategory.id);
        setIsAddingNew(false);
        
        toast({
          title: "Category Created",
          description: `The category "${newCategoryName}" has been created.`,
        });
      }
    } catch (err) {
      console.error('Error creating category:', err);
      toast({
        title: "Error",
        description: "Failed to create new category.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {task.category ? "Change Category" : "Add Category"}
          </DialogTitle>
        </DialogHeader>
        
        {isAddingNew ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category Color</Label>
              <HexColorPicker color={newCategoryColor} onChange={setNewCategoryColor} />
              <div className="flex items-center mt-2 gap-2">
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: newCategoryColor }}
                />
                <Input
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNewCategory} disabled={isSubmitting || !newCategoryName.trim()}>
                {isSubmitting ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="py-4">
              <RadioGroup value={selectedCategoryId || "none"} onValueChange={(value) => setSelectedCategoryId(value === "none" ? null : value)}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="cursor-pointer">No Category</Label>
                  </div>
                  
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={category.id} id={category.id} />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <Label htmlFor={category.id} className="cursor-pointer">{category.name}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
              
              <Button 
                variant="ghost" 
                className="mt-4 text-sm"
                onClick={() => setIsAddingNew(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Category
              </Button>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSelectCategory} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
