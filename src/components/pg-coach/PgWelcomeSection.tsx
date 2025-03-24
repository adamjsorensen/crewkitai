
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
import MobileCategoryDrawer from './chat/MobileCategoryDrawer';
import PgChatInput from './PgChatInput';
import { Separator } from '@/components/ui/separator';
import PgConversationDrawer from './PgConversationDrawer';

interface PgWelcomeSectionProps {
  onExampleClick: (example: string) => void;
  onSendMessage: (message: string, imageFile?: File | null) => void;
  isLoading?: boolean;
  onNewChat?: () => void;
  onOpenHistory: () => void;
  isThinkMode?: boolean;
  onToggleThinkMode?: () => void;
}

const PgWelcomeSection: React.FC<PgWelcomeSectionProps> = ({ 
  onExampleClick,
  onSendMessage,
  isLoading = false,
  onNewChat,
  onOpenHistory,
  isThinkMode = false,
  onToggleThinkMode = () => {}
}) => {
  const { categories, isLoading: isContentLoading, error } = useWelcomeContent();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const renderIcon = (iconName: string, colorClass: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.MessageSquare;
    return <IconComponent className={`h-4.5 w-4.5 text-${colorClass}`} />;
  };

  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].id);
    }
  }, [categories, activeTab]);

  if (isContentLoading) {
    return (
      <ScrollArea className="h-full px-2">
        <div className="space-y-4 py-3 mb-4">
          <Skeleton className="h-12 w-4/5 mx-auto mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="text-destructive mb-2">Failed to load welcome content</div>
        <p className="text-muted-foreground text-sm mb-4">
          Please try refreshing the page or contact support if the issue persists.
        </p>
      </div>
    );
  }

  const activeCategory = categories.find(cat => cat.id === activeTab) || categories[0];

  return (
    <ScrollArea className="h-full px-2 pt-1 w-full overflow-x-hidden">
      <div className="py-3 mb-4 max-w-4xl mx-auto w-full overflow-x-hidden">
        <Card className="overflow-hidden border-border/40 shadow-sm">
          <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-border/30 bg-background/50">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">PainterGrowth Coach</h2>
              </div>
              <div>
                <PgConversationDrawer onClick={onOpenHistory} />
              </div>
            </div>
            <h3 className="text-2xl sm:text-2xl font-extrabold tracking-tight text-foreground mt-2 mb-1.5">
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
              onExampleSelect={onExampleClick}
            />
          )}
          
          <Tabs 
            value={activeTab || (categories[0]?.id || "")} 
            onValueChange={(value) => setActiveTab(value)}
            className="w-full overflow-x-hidden"
          >
            {!isMobile && (
              <div className="border-b border-border/30 overflow-auto">
                <TabsList className="w-full h-auto bg-muted/30 px-5 flex justify-start overflow-x-auto gap-0.5">
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="py-2.5 px-3.5 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="flex-shrink-0">
                          {renderIcon(category.icon, category.iconColor)}
                        </div>
                        <span className="font-medium text-sm">{category.title}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            )}
            
            <div className="p-2.5 sm:p-4">
              {categories.map((category) => (
                <TabsContent 
                  key={category.id} 
                  value={category.id}
                  className="mt-0 focus-visible:outline-none focus-visible:ring-0"
                >
                  <div className="mb-3">
                    <p className="text-muted-foreground text-sm sm:text-base">{category.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.examples.map((example) => (
                      <button 
                        key={example.id}
                        className={cn(
                          "flex items-start gap-2.5 group w-full text-left p-2.5 sm:p-3 rounded-lg",
                          "transition-all duration-200 ease-in-out",
                          "bg-accent/30 hover:bg-accent/50 border border-border/30 hover:border-border/60",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
                          "active:scale-[0.98] touch-callout-none shadow-sm",
                        )}
                        onClick={() => onExampleClick(example.title)}
                      >
                        <MessageSquare className="h-4.5 w-4.5 text-primary mt-0.5 flex-shrink-0" />
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
          
          <div className="mt-4 border-t border-border/30">
            <div className="px-4 py-3">
              <Separator className="my-2" />
              <p className="text-center text-sm text-muted-foreground mb-2">Or ask your own question</p>
              <PgChatInput 
                onSendMessage={onSendMessage}
                isLoading={isLoading}
                isMobile={isMobile}
                isThinkMode={isThinkMode}
                onToggleThinkMode={onToggleThinkMode}
              />
            </div>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default PgWelcomeSection;
