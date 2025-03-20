
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';
import { useWelcomeContent } from '@/hooks/useWelcomeContent';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface WelcomeSectionProps {
  onCategorySelect: (category: string) => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onCategorySelect }) => {
  const { categories, isLoading, error } = useWelcomeContent();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showTabSheet, setShowTabSheet] = useState(false);
  const isMobile = useIsMobile();
  
  // Dynamic icon component renderer
  const renderIcon = (iconName: string, colorClass: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.MessageSquare;
    return <IconComponent className={`h-5 w-5 text-${colorClass}`} />;
  };

  useEffect(() => {
    // Set the first category as active by default once loaded
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].id);
    }
  }, [categories, activeTab]);

  if (isLoading) {
    return (
      <ScrollArea className="h-full px-2">
        <div className="space-y-6 py-4 mb-6">
          <Skeleton className="h-14 w-4/5 mx-auto mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-destructive mb-2">Failed to load welcome content</div>
        <p className="text-muted-foreground text-sm mb-4">
          Please try refreshing the page or contact support if the issue persists.
        </p>
      </div>
    );
  }

  // Find the active category
  const activeCategory = categories.find(cat => cat.id === activeTab) || categories[0];

  // Enhanced Mobile category selector
  const MobileCategorySelector = () => (
    <div className="px-4 py-2">
      <Button 
        onClick={() => setShowTabSheet(true)}
        className="w-full flex items-center justify-between py-3 px-4 rounded-lg bg-accent/50 border border-border/40 text-left"
        variant="outline"
      >
        <div className="flex items-center gap-2">
          {activeCategory && renderIcon(activeCategory.icon, activeCategory.iconColor)}
          <span className="font-medium">{activeCategory?.title}</span>
        </div>
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      </Button>
      
      {/* Sheet component for mobile categories */}
      <Sheet open={showTabSheet} onOpenChange={setShowTabSheet}>
        <SheetContent 
          side="bottom" 
          className="px-0 h-[70vh] z-[100] bg-background border-t border-border/30 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <SheetHeader className="px-4 mb-2">
            <SheetTitle>Choose a category</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 justify-start h-auto rounded-md text-left",
                    activeTab === category.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-accent"
                  )}
                  variant="ghost"
                  onClick={() => {
                    setActiveTab(category.id);
                    setShowTabSheet(false);
                  }}
                >
                  {renderIcon(category.icon, category.iconColor)}
                  <div>
                    <div className="font-medium">{category.title}</div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <ScrollArea className="h-full px-2 pt-2">
      <div className="py-4 mb-6 max-w-4xl mx-auto">
        <Card className="overflow-hidden border-border/40 shadow-md">
          <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-border/30 bg-background/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">AI Coach</h2>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-3 mb-2">
              How can I help with your painting business today?
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Ask me anything about running your painting business - from pricing and marketing to crew management and client relationships.
            </p>
          </div>
          
          {isMobile && <MobileCategorySelector />}
          
          <Tabs 
            value={activeTab || (categories[0]?.id || "")} 
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            {!isMobile && (
              <div className="border-b border-border/30 overflow-auto">
                <TabsList className="w-full h-auto bg-muted/30 px-6 flex justify-start overflow-x-auto gap-1">
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="py-3 px-4 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {renderIcon(category.icon, category.iconColor)}
                        </div>
                        <span className="font-medium">{category.title}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            )}
            
            <div className="p-3 sm:p-6">
              {categories.map((category) => (
                <TabsContent 
                  key={category.id} 
                  value={category.id}
                  className="mt-0 focus-visible:outline-none focus-visible:ring-0"
                >
                  <div className="mb-4">
                    <p className="text-muted-foreground text-sm sm:text-base">{category.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.examples.map((example) => (
                      <button 
                        key={example.id}
                        className={cn(
                          "flex items-start gap-3 group w-full text-left p-3 sm:p-4 rounded-lg",
                          "transition-all duration-200 ease-in-out",
                          "bg-accent/30 hover:bg-accent border border-border/30 hover:border-border/60",
                          "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1",
                          "active:scale-[0.98] touch-callout-none",
                        )}
                        onClick={() => onCategorySelect(example.title)}
                      >
                        <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {example.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default WelcomeSection;
