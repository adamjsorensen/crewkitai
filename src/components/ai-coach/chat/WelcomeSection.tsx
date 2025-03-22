
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Sparkles, ChevronRight } from 'lucide-react';
import { useWelcomeContent } from '@/hooks/useWelcomeContent';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileCategoryDrawer from './MobileCategoryDrawer';

interface WelcomeSectionProps {
  onCategorySelect: (category: string) => void;
  onNewChat?: () => void;
  onHistoryClick?: () => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ 
  onCategorySelect,
  onNewChat,
  onHistoryClick
}) => {
  const { categories, isLoading, error } = useWelcomeContent();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Log component lifecycle
  useEffect(() => {
    console.log("[WelcomeSection] Component mounted");
    return () => console.log("[WelcomeSection] Component unmounted");
  }, []);
  
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

  return (
    <ScrollArea className="h-full px-2 pt-2 w-full overflow-x-hidden">
      <div className="py-4 mb-6 max-w-4xl mx-auto w-full overflow-x-hidden">
        <Card className="overflow-hidden border-border/40 shadow-md">
          <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-border/30 bg-background/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">AI Coach</h2>
              </div>
              {!isMobile && (
                <div className="flex gap-2">
                  {onNewChat && (
                    <button
                      onClick={onNewChat}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium bg-primary/90 text-primary-foreground hover:bg-primary transition-colors"
                    >
                      <LucideIcons.PlusCircle className="h-4 w-4 mr-1.5" />
                      <span>New Chat</span>
                    </button>
                  )}
                  
                  {onHistoryClick && (
                    <button
                      onClick={onHistoryClick}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <LucideIcons.History className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">History</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-3 mb-2">
              How can I help with your painting business today?
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Ask me anything about running your painting business - from pricing and marketing to crew management and client relationships.
            </p>
          </div>
          
          {isMobile && activeCategory && (
            <MobileCategoryDrawer
              categories={categories}
              activeCategory={activeCategory}
              onCategorySelect={(category) => setActiveTab(category.id)}
              onExampleSelect={onCategorySelect}
            />
          )}
          
          <Tabs 
            value={activeTab || (categories[0]?.id || "")} 
            onValueChange={(value) => setActiveTab(value)}
            className="w-full overflow-x-hidden"
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
