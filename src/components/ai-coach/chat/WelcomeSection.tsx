
import React from 'react';
import { Card } from '@/components/ui/card';
import { Brain, Paint, Users, TrendingUp, MessageSquare } from 'lucide-react';

interface WelcomeSectionProps {
  onCategorySelect: (category: string) => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onCategorySelect }) => {
  const categories = [
    {
      id: 'pricing',
      title: 'Pricing & Bidding',
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      description: 'Job estimates, profit margins, competitive rates',
      examples: [
        "How do I price a 2,000 sq ft exterior job?",
        "What should my markup be on materials?",
        "How to create profitable estimates?"
      ]
    },
    {
      id: 'clients',
      title: 'Client Management',
      icon: <Users className="h-5 w-5 text-indigo-500" />,
      description: 'Customer communication, satisfaction, retention',
      examples: [
        "What's the best way to handle a difficult client?",
        "How can I increase my referral rate?",
        "What should I include in my client contracts?"
      ]
    },
    {
      id: 'crew',
      title: 'Crew Management',
      icon: <Paint className="h-5 w-5 text-orange-500" />,
      description: 'Team leadership, training, efficiency',
      examples: [
        "How can I improve my crew's efficiency?",
        "What's the best way to train new painters?",
        "How do I handle employee conflicts?"
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing & Growth',
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      description: 'Finding leads, advertising, business growth',
      examples: [
        "What marketing strategies work during slow seasons?",
        "How can I improve my social media presence?",
        "What's the most effective way to generate leads?"
      ]
    }
  ];

  return (
    <div className="space-y-6 px-4 py-6 mb-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
          <Brain className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Welcome to your AI Coach</h2>
        <p className="text-muted-foreground">Expert guidance tailored for painting professionals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className="p-4 hover:shadow-md transition-all cursor-pointer border-border/50 hover:border-primary/30 hover:bg-accent/20"
            onClick={() => onCategorySelect(category.examples[0])}
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
                    <div 
                      key={i}
                      className="flex items-start gap-2 group cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategorySelect(example);
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-primary mt-1 flex-shrink-0" />
                      <p className="text-sm group-hover:text-primary transition-colors">{example}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WelcomeSection;
