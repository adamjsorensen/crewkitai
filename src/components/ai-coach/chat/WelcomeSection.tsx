import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, PaintBucket, Users, TrendingUp, MessageSquare, Search, Zap, Clock, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface WelcomeSectionProps {
  onCategorySelect: (category: string) => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onCategorySelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const categories = [
    {
      id: 'pricing',
      title: 'Pricing & Bidding',
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      description: 'Job estimates, profit margins, competitive rates',
      examples: [
        { text: "How do I price a 2,000 sq ft exterior job?", trending: true },
        { text: "What should my markup be on materials?", trending: false },
        { text: "How to create profitable estimates?", trending: false }
      ]
    },
    {
      id: 'clients',
      title: 'Client Management',
      icon: <Users className="h-5 w-5 text-indigo-500" />,
      description: 'Customer communication, satisfaction, retention',
      examples: [
        { text: "What's the best way to handle a difficult client?", trending: true },
        { text: "How can I increase my referral rate?", trending: false },
        { text: "What should I include in my client contracts?", trending: false }
      ]
    },
    {
      id: 'crew',
      title: 'Crew Management',
      icon: <PaintBucket className="h-5 w-5 text-orange-500" />,
      description: 'Team leadership, training, efficiency',
      examples: [
        { text: "How can I improve my crew's efficiency?", trending: false },
        { text: "What's the best way to train new painters?", trending: true },
        { text: "How do I handle employee conflicts?", trending: false }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing & Growth',
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      description: 'Finding leads, advertising, business growth',
      examples: [
        { text: "What marketing strategies work during slow seasons?", trending: false },
        { text: "How can I improve my social media presence?", trending: false },
        { text: "What's the most effective way to generate leads?", trending: true }
      ]
    }
  ];

  const recentlyAsked = [
    "How to price a kitchen cabinet refinishing job?",
    "Best practices for setting up a painting business LLC",
    "How to calculate labor costs for trim work"
  ];

  const filteredCategories = searchTerm 
    ? categories.map(category => ({
        ...category,
        examples: category.examples.filter(example => 
          example.text.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.examples.length > 0)
    : categories;

  return (
    <ScrollArea className="h-full px-2">
      <div className="space-y-6 py-4 mb-6">
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-background border-muted-foreground/20"
            placeholder="Search for painting advice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Recently Asked Section */}
        {!searchTerm && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Recently Asked by Painters</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {recentlyAsked.map((question, i) => (
                <button
                  key={i}
                  onClick={() => onCategorySelect(question)}
                  className="text-left p-2.5 rounded-md border border-border/50 bg-card/50 hover:bg-accent/30 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">{question}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategories.map((category) => (
            <Card 
              key={category.id}
              className="p-4 hover:shadow-md transition-all cursor-pointer border-border/50 hover:border-primary/30 hover:bg-accent/20"
              onClick={() => onCategorySelect(category.examples[0].text)}
            >
              <div className="flex space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {category.icon}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  
                  <div className="mt-3 space-y-1.5">
                    {category.examples.map((example, i) => (
                      <button 
                        key={i}
                        className="flex items-start gap-2 group cursor-pointer w-full text-left relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCategorySelect(example.text);
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-primary mt-1 flex-shrink-0" />
                        <p className="text-sm group-hover:text-primary transition-colors">
                          {example.text}
                          {example.trending && (
                            <Badge 
                              variant="outline" 
                              className="ml-2 bg-orange-500/10 text-orange-600 border-orange-200 text-[10px] h-4"
                            >
                              <Flame className="h-2.5 w-2.5 mr-1" />
                              Trending
                            </Badge>
                          )}
                        </p>
                        <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 rounded transition-colors duration-200"></span>
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
