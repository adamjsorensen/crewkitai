
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, MessageSquare } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  examples: Array<{
    id: string;
    title: string;
  }>;
}

interface MobileCategoryDrawerProps {
  categories: Category[];
  activeCategory: Category;
  onCategorySelect: (category: Category) => void;
  onExampleSelect: (example: string) => void;
}

const MobileCategoryDrawer: React.FC<MobileCategoryDrawerProps> = ({
  categories,
  activeCategory,
  onCategorySelect,
  onExampleSelect
}) => {
  const [open, setOpen] = useState(false);
  
  const renderIcon = (iconName: string, colorClass: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.MessageSquare;
    return <IconComponent className={`h-4 w-4 text-${colorClass}`} />;
  };
  
  return (
    <div className="flex justify-between items-center px-4 py-3 border-t border-border/30">
      <div className="flex items-center gap-2">
        {renderIcon(activeCategory.icon, activeCategory.iconColor)}
        <span className="font-medium text-sm">{activeCategory.title}</span>
      </div>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh]">
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-semibold">Categories</h3>
            
            <div className="space-y-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={category.id === activeCategory.id ? "default" : "outline"}
                  className={cn(
                    "w-full justify-start text-sm",
                    category.id === activeCategory.id ? "bg-primary" : "bg-background"
                  )}
                  onClick={() => {
                    onCategorySelect(category);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {renderIcon(category.icon, category.id === activeCategory.id ? "primary-foreground" : category.iconColor)}
                    <span>{category.title}</span>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">{activeCategory.title} Examples:</h4>
              <div className="space-y-2">
                {activeCategory.examples.map((example) => (
                  <Button
                    key={example.id}
                    variant="outline"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      onExampleSelect(example.title);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>{example.title}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileCategoryDrawer;
