
import React, { useState } from 'react';
import { useTaskView } from '@/contexts/TaskViewContext';
import { useCompassCategories } from '@/hooks/useCompassCategories';
import { useCompassTags } from '@/hooks/useCompassTags';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FilterX, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const TaskFilters: React.FC = () => {
  const { filters, setFilters, saveViewPreference } = useTaskView();
  const { categories } = useCompassCategories();
  const { tags } = useCompassTags();
  const [isOpen, setIsOpen] = useState(false);

  const priorityOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];

  const dueDateOptions = [
    { value: 'today', label: 'Due Today' },
    { value: 'week', label: 'Due This Week' },
    { value: 'month', label: 'Due This Month' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const handleFilterChange = (type: 'priority' | 'category' | 'tag' | 'dueDate', value: string) => {
    const newFilters = { ...filters };

    if (type === 'dueDate') {
      newFilters.dueDate = newFilters.dueDate === value ? null : value as any;
    } else {
      if (!newFilters[type]) {
        newFilters[type] = [];
      }

      if (newFilters[type]?.includes(value)) {
        newFilters[type] = newFilters[type]?.filter(v => v !== value);
        if (newFilters[type]?.length === 0) {
          delete newFilters[type];
        }
      } else {
        newFilters[type] = [...(newFilters[type] || []), value];
      }
    }

    setFilters(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const clearFilters = () => {
    setFilters({});
    saveViewPreference();
  };

  const applyFilters = () => {
    saveViewPreference();
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(hasActiveFilters ? "border-primary text-primary" : "")}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).flat().length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filter Tasks</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                  <FilterX className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <Separator />

            {/* Priority Filters */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Priority</h5>
              <div className="grid grid-cols-3 gap-2">
                {priorityOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`priority-${option.value}`} 
                      checked={filters.priority?.includes(option.value)}
                      onCheckedChange={() => handleFilterChange('priority', option.value)}
                    />
                    <Label htmlFor={`priority-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Category Filters */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Categories</h5>
              <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category.id}`} 
                      checked={filters.category?.includes(category.id)}
                      onCheckedChange={() => handleFilterChange('category', category.id)}
                    />
                    <Label htmlFor={`category-${category.id}`} className="truncate">{category.name}</Label>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">No categories available</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Tag Filters */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Tags</h5>
              <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tag-${tag.id}`} 
                      checked={filters.tag?.includes(tag.id)}
                      onCheckedChange={() => handleFilterChange('tag', tag.id)}
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="truncate">{tag.name}</Label>
                  </div>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags available</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Due Date Filters */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Due Date</h5>
              <div className="grid grid-cols-2 gap-2">
                {dueDateOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`dueDate-${option.value}`} 
                      checked={filters.dueDate === option.value}
                      onCheckedChange={() => handleFilterChange('dueDate', option.value)}
                    />
                    <Label htmlFor={`dueDate-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 items-center">
          {filters.priority?.map(priority => (
            <Badge 
              key={`priority-${priority}`} 
              variant="outline" 
              className="cursor-pointer border-primary text-primary"
              onClick={() => handleFilterChange('priority', priority)}
            >
              {priority} Priority ×
            </Badge>
          ))}
          
          {filters.category?.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <Badge 
                key={`category-${categoryId}`} 
                variant="outline" 
                className="cursor-pointer border-primary text-primary"
                onClick={() => handleFilterChange('category', categoryId)}
              >
                {category.name} ×
              </Badge>
            ) : null;
          })}
          
          {filters.tag?.map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            return tag ? (
              <Badge 
                key={`tag-${tagId}`} 
                variant="outline" 
                className="cursor-pointer border-primary text-primary"
                onClick={() => handleFilterChange('tag', tagId)}
              >
                #{tag.name} ×
              </Badge>
            ) : null;
          })}
          
          {filters.dueDate && (
            <Badge 
              variant="outline" 
              className="cursor-pointer border-primary text-primary"
              onClick={() => handleFilterChange('dueDate', filters.dueDate!)}
            >
              {filters.dueDate === 'today' ? 'Due Today' : 
                filters.dueDate === 'week' ? 'Due This Week' : 
                filters.dueDate === 'month' ? 'Due This Month' : 'Overdue'} ×
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;
