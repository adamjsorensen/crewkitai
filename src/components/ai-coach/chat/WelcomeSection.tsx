
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useWelcomeContent } from '@/hooks/useWelcomeContent';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface WelcomeSectionProps {
  onCategorySelect: (category: string) => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onCategorySelect }) => {
  const { categories, isLoading, error } = useWelcomeContent();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
  // Dynamic icon component renderer
  const renderIcon = (iconName: string, colorClass: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.MessageSquare;
    return <IconComponent className={`h-5 w-5 text-${colorClass}`} />;
  };

  React.useEffect(() => {
    // Set the first category as active by default once loaded
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].id);
    }
  }, [categories, activeTab]);

  if (isLoading) {
    return (
      <ScrollArea className="h-full px-2">
        <div className="space-y-6 py-4 mb-6">
          <Skeleton className="h-10 w-full mb-4" />
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
    <ScrollArea className="h-full px-2">
      <div className="space-y-6 py-4 mb-6">
        <Card className="p-4 border-border/50">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-6">How can I help with your painting business today?</h2>
          
          <Tabs 
            defaultValue={activeTab || (categories[0]?.id || "")} 
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            <TabsList className="w-full mb-4 bg-background border border-border/30 overflow-x-auto flex-wrap">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center gap-2 py-2"
                >
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center">
                      {renderIcon(category.icon, category.iconColor)}
                    </div>
                  </div>
                  <span>{category.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map((category) => (
              <TabsContent 
                key={category.id} 
                value={category.id}
                className="mt-0"
              >
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                
                <div className="space-y-1.5">
                  {category.examples.map((example) => (
                    <button 
                      key={example.id}
                      className="flex items-start gap-2 group cursor-pointer w-full text-left p-3 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => onCategorySelect(example.title)}
                    >
                      <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm group-hover:text-primary transition-colors">{example.title}</p>
                    </button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default WelcomeSection;
