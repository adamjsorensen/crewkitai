
import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Compass, Lightbulb, Award, PaintBucket } from 'lucide-react';

export const FeatureTourStep = () => {
  const { completeStep } = useOnboarding();
  
  const features = [
    {
      icon: <Compass className="h-10 w-10 text-blue-500" />,
      title: "Strategic Compass",
      description: "Stay organized with task management built specifically for painting professionals. Prioritize your work and never miss a deadline."
    },
    {
      icon: <Lightbulb className="h-10 w-10 text-yellow-500" />,
      title: "AI Coach",
      description: "Get expert advice for your painting business from an AI assistant that understands the industry. Ask questions and get immediate guidance."
    },
    {
      icon: <Award className="h-10 w-10 text-green-500" />,
      title: "Financial Clarity",
      description: "Track job profitability, monitor expenses, and get financial insights to make better business decisions."
    },
    {
      icon: <PaintBucket className="h-10 w-10 text-purple-500" />,
      title: "Content Generation",
      description: "Create professional emails, proposals, and job ads tailored to the painting industry with just a few clicks."
    }
  ];
  
  return (
    <div className="py-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
        Powerful Tools for Painters
      </h1>
      
      <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
        CrewkitAI comes packed with features designed specifically for painting professionals.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {features.map((feature, i) => (
          <div key={i} className="bg-slate-50 border rounded-lg p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-8">
        <Button
          size="lg"
          onClick={() => completeStep('feature_tour')}
          className="flex items-center gap-2"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
