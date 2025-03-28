
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Search, MessageSquare, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type CategoryExample = {
  id: string;
  title: string;
};

type Category = {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  examples: CategoryExample[];
};

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
  onExampleSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Dynamic icon component renderer
  const renderIcon = (iconName: string, colorClass: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.MessageSquare;
    return <IconComponent className={`h-5 w-5 text-${colorClass}`} />;
  };
  
  // Filter categories based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return categories;
    
    return categories.filter(
      category => 
        category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  return (
    <div className="px-4 py-2">
      <Button 
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between py-3 px-4 rounded-lg bg-accent/50 border border-border/40 text-left"
        variant="outline"
        type="button"
      >
        <div className="flex items-center gap-2">
          {renderIcon(activeCategory.icon, activeCategory.iconColor)}
          <span className="font-medium">{activeCategory.title}</span>
        </div>
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      </Button>
      
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="px-4 py-3 pb-2">
            <DrawerTitle className="text-lg font-semibold">Choose a category</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                className="pl-9 bg-muted/40 border-muted focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1 h-full max-h-[60vh] pb-safe">
            <div className="p-2 space-y-1">
              {filteredCategories.map((category) => (
                <Button
                  key={category.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 justify-start h-auto rounded-md text-left",
                    activeCategory.id === category.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-accent"
                  )}
                  variant="ghost"
                  onClick={() => {
                    onCategorySelect(category);
                    setOpen(false);
                  }}
                >
                  {renderIcon(category.icon, category.iconColor)}
                  <div>
                    <div className="font-medium">{category.title}</div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                  </div>
                </Button>
              ))}
              
              {filteredCategories.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No categories match your search
                </div>
              )}
            </div>
            
            {!searchQuery && activeCategory && (
              <div className="px-3 py-2 mt-2">
                <div className="bg-background border border-border/30 rounded-lg p-3">
                  <h3 className="font-medium text-sm mb-2 text-muted-foreground">Suggested questions</h3>
                  <div className="space-y-1.5">
                    {activeCategory.examples.map((example) => (
                      <Button
                        key={example.id}
                        variant="ghost" 
                        className="w-full justify-start text-left h-auto py-2 px-3 text-sm"
                        onClick={() => {
                          onExampleSelect(example.title);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{example.title}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MobileCategoryDrawer;
