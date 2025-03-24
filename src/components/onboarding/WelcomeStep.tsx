
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { PaintBucket, Rocket, User, Calendar, Bot, Star } from 'lucide-react';

export const WelcomeStep = () => {
  const { user } = useAuth();
  const { completeStep } = useOnboarding();
  
  // Get the user's name or fallback to "there"
  const userName = user?.user_metadata?.full_name || "there";
  
  const onboardingSteps = [
    {
      icon: <User className="h-5 w-5 text-blue-500" />,
      title: "Complete Your Profile",
      description: "Tell us about your painting business to get personalized help."
    },
    {
      icon: <Calendar className="h-5 w-5 text-green-500" />,
      title: "Task Management",
      description: "Set up your Strategic Compass to organize and prioritize your work."
    },
    {
      icon: <Bot className="h-5 w-5 text-purple-500" />,
      title: "Meet Your AI Coach",
      description: "Get tailored business advice from your personal AI advisor."
    },
    {
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      title: "Explore Features",
      description: "Discover all the tools designed specifically for painting professionals."
    }
  ];
  
  return (
    <div className="py-6">
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <PaintBucket className="h-10 w-10 text-primary" />
        </div>
      </div>
      
      <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
        Welcome to CrewkitAI, {userName}!
      </h1>
      
      <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
        You're about to transform how you run your painting business. Let's get you set up with everything you need to succeed.
      </p>
      
      <div className="grid md:grid-cols-2 gap-4 my-8">
        {onboardingSteps.map((step, i) => (
          <div key={i} className="border rounded-lg p-4 bg-slate-50">
            <div className="flex gap-3">
              <div className="mt-0.5">{step.icon}</div>
              <div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-8">
        <Button 
          size="lg"
          onClick={() => completeStep('welcome')}
          className="flex items-center gap-2"
        >
          <Rocket className="h-4 w-4" />
          Let's Get Started
        </Button>
      </div>
    </div>
  );
};
