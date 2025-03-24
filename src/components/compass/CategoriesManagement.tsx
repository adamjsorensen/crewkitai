
import React, { useState } from 'react';
import { PlusCircle, Trash2, Edit, Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCompassCategories } from '@/hooks/useCompassCategories';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import CategoryBadge from './CategoryBadge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HexColorPicker } from 'react-colorful';

const CategoriesManagement = () => {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCompassCategories();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366F1');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }
    
    const success = await createCategory(newCategoryName.trim(), newCategoryColor);
    if (success) {
      setNewCategoryName('');
      setNewCategoryColor('#6366F1');
    }
  };
  
  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingCategory(id);
    setEditName(name);
    setEditColor(color);
  };
  
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
    setEditColor('');
  };
  
  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Category name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    const success = await updateCategory(id, {
      name: editName.trim(),
      color: editColor
    });
    
    if (success) {
      handleCancelEdit();
    }
  };
  
  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? Tasks in this category will be uncategorized.')) {
      await deleteCategory(id);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <span>Categories</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-10 p-0"
                style={{ backgroundColor: newCategoryColor }}
              >
                <span className="sr-only">Pick a color</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <HexColorPicker color={newCategoryColor} onChange={setNewCategoryColor} />
            </PopoverContent>
          </Popover>
          <Button 
            onClick={handleCreateCategory} 
            variant="default" 
            size="sm"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        <Separator />
        
        {categories.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No categories yet. Create your first category to organize your tasks.
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50"
              >
                {editingCategory === category.id ? (
                  <>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-10 p-0"
                            style={{ backgroundColor: editColor }}
                          >
                            <span className="sr-only">Pick a color</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <HexColorPicker color={editColor} onChange={setEditColor} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSaveEdit(category.id)}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <CategoryBadge name={category.name} color={category.color} />
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleStartEdit(category.id, category.name, category.color)}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoriesManagement;
