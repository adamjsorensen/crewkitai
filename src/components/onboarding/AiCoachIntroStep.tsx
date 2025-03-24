
import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Bot, MessageSquare, Check, ArrowRight } from 'lucide-react';

export const AiCoachIntroStep = () => {
  const { completeStep } = useOnboarding();
  
  const exampleQuestions = [
    "How should I price a 2,000 sq ft exterior painting job?",
    "What's the best way to handle a difficult client?",
    "How can I find and retain good painters?",
    "What marketing strategies work best for painting companies?"
  ];
  
  return (
    <div className="py-6">
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-purple-50 flex items-center justify-center">
          <Bot className="h-10 w-10 text-purple-500" />
        </div>
      </div>
      
      <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
        Meet Your AI Coach
      </h1>
      
      <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
        Get expert painting business advice whenever you need it, day or night. Your AI Coach understands the painting industry and is here to help.
      </p>
      
      <div className="bg-slate-50 border rounded-lg p-6 mb-8">
        <h3 className="font-bold text-lg mb-4">Ask your coach questions like:</h3>
        
        <div className="space-y-3">
          {exampleQuestions.map((question, i) => (
            <div key={i} className="flex items-start">
              <MessageSquare className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{question}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => completeStep('ai_coach_intro')}
          size="lg"
          className="flex items-center gap-2"
        >
          Continue
        </Button>
        
        <Link to="/dashboard/ai-coach">
          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
            onClick={() => completeStep('ai_coach_intro')}
          >
            Try it now <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
