
import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Compass, Bot, Check, ArrowRight, PaintBucket, Lightbulb, Award } from 'lucide-react';

export const FeaturesIntroStep = () => {
  const { completeStep } = useOnboarding();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Feature overview content
  const features = [
    {
      icon: <Compass className="h-10 w-10 text-blue-500" />,
      title: "Strategic Compass",
      description: "Stay organized with task management built specifically for painting professionals. Prioritize your work and never miss a deadline."
    },
    {
      icon: <Bot className="h-10 w-10 text-purple-500" />,
      title: "AI Coach",
      description: "Get expert advice for your painting business from an AI assistant that understands the industry. Ask questions and get immediate guidance."
    },
    {
      icon: <Award className="h-10 w-10 text-green-500" />,
      title: "Financial Clarity",
      description: "Track job profitability, monitor expenses, and get financial insights to make better business decisions."
    },
    {
      icon: <PaintBucket className="h-10 w-10 text-primary" />,
      title: "Content Generation",
      description: "Create professional emails, proposals, and job ads tailored to the painting industry with just a few clicks."
    }
  ];
  
  // Compass tab content
  const compassBenefits = [
    "Prioritize tasks based on your unique painting business needs",
    "Get reminders for important deadlines and follow-ups",
    "Organize work by categories like 'Estimates', 'Active Jobs', and 'Admin'",
    "Turn your random thoughts into an actionable plan instantly"
  ];
  
  // AI Coach tab content
  const exampleQuestions = [
    "How should I price a 2,000 sq ft exterior painting job?",
    "What's the best way to handle a difficult client?",
    "How can I find and retain good painters?",
    "What marketing strategies work best for painting companies?"
  ];
  
  return (
    <div className="py-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
        Powerful Tools for Painters
      </h1>
      
      <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
        CrewkitAI comes packed with features designed specifically for painting professionals.
      </p>
      
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compass">Strategic Compass</TabsTrigger>
          <TabsTrigger value="coach">AI Coach</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
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
        </TabsContent>
        
        {/* Strategic Compass Tab */}
        <TabsContent value="compass" className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center">
              <Compass className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">
            Strategic Compass
          </h2>
          
          <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
            Your painting business needs more than a simple to-do list. Strategic Compass keeps you focused on what matters most.
          </p>
          
          <div className="bg-slate-50 border rounded-lg p-6 mb-4">
            <h3 className="font-bold text-lg mb-4">How it helps you:</h3>
            <ul className="space-y-3">
              {compassBenefits.map((benefit, i) => (
                <li key={i} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-center">
            <Link to="/dashboard/compass">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("coach");
                }}
              >
                Next: AI Coach <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </TabsContent>
        
        {/* AI Coach Tab */}
        <TabsContent value="coach" className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-purple-50 flex items-center justify-center">
              <Bot className="h-10 w-10 text-purple-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">
            Meet Your AI Coach
          </h2>
          
          <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
            Get expert painting business advice whenever you need it, day or night. Your AI Coach understands the painting industry and is here to help.
          </p>
          
          <div className="bg-slate-50 border rounded-lg p-6 mb-4">
            <h3 className="font-bold text-lg mb-4">Ask your coach questions like:</h3>
            
            <div className="space-y-3">
              {exampleQuestions.map((question, i) => (
                <div key={i} className="flex items-start">
                  <Lightbulb className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{question}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center">
            <Link to="/dashboard/compass">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("overview");
                }}
              >
                Back to Overview
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
      
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
