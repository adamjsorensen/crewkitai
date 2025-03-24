
import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Compass, Check, ArrowRight } from 'lucide-react';

export const CompassIntroStep = () => {
  const { completeStep } = useOnboarding();
  
  const benefits = [
    "Prioritize tasks based on your unique painting business needs",
    "Get reminders for important deadlines and follow-ups",
    "Organize work by categories like 'Estimates', 'Active Jobs', and 'Admin'",
    "Turn your random thoughts into an actionable plan instantly"
  ];
  
  return (
    <div className="py-6">
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center">
          <Compass className="h-10 w-10 text-blue-500" />
        </div>
      </div>
      
      <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
        Strategic Compass
      </h1>
      
      <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
        Your painting business needs more than a simple to-do list. Strategic Compass keeps you focused on what matters most.
      </p>
      
      <div className="bg-slate-50 border rounded-lg p-6 mb-8">
        <h3 className="font-bold text-lg mb-4">How it helps you:</h3>
        <ul className="space-y-3">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => completeStep('compass_intro')}
          size="lg"
          className="flex items-center gap-2"
        >
          Continue
        </Button>
        
        <Link to="/dashboard/compass">
          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
            onClick={() => completeStep('compass_intro')}
          >
            Try it now <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
