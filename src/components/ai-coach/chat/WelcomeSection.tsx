
import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useWelcomeContent } from '@/hooks/useWelcomeContent';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';

interface WelcomeSectionProps {
  onCategorySelect: (category: string) => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onCategorySelect }) => {
  const { categories, isLoading, error } = useWelcomeContent();
  
  // Dynamic icon component renderer
  const renderIcon = (iconName: string, colorClass: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.MessageSquare;
    return <IconComponent className={`h-5 w-5 text-${colorClass}`} />;
  };

  if (isLoading) {
    return (
      <ScrollArea className="h-full px-2">
        <div className="space-y-6 py-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 border-border/50">
                <div className="flex space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <div className="mt-3 space-y-1.5">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </div>
              </Card>
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

  return (
    <ScrollArea className="h-full px-2">
      <div className="space-y-6 py-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className="p-4 hover:shadow-md transition-all cursor-pointer border-border/50 hover:border-primary/30 hover:bg-accent/20"
              onClick={() => category.examples.length > 0 && onCategorySelect(category.examples[0].title)}
            >
              <div className="flex space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {renderIcon(category.icon, category.iconColor)}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  
                  <div className="mt-3 space-y-1.5">
                    {category.examples.map((example) => (
                      <button 
                        key={example.id}
                        className="flex items-start gap-2 group cursor-pointer w-full text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCategorySelect(example.title);
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-primary mt-1 flex-shrink-0" />
                        <p className="text-sm group-hover:text-primary transition-colors">{example.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export default WelcomeSection;
