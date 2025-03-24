
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CompassInputFormProps {
  onSubmit: (input: string) => Promise<boolean | void>;
  isProcessing: boolean;
}

const CompassInputForm: React.FC<CompassInputFormProps> = ({ onSubmit, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(input);
    if (success) {
      setInput(''); // Clear input on successful submission
    }
  };

  const examples = [
    "Call client about Jones project timeline",
    "Order supplies for the Smith residence exterior job",
    "Schedule team meeting to discuss upcoming projects",
    "Research new painting techniques for textured walls"
  ];

  const handleExampleClick = (example: string) => {
    setInput(prev => prev ? `${prev}\n${example}` : example);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="What do you need to get done? Enter one or more tasks..."
              className="min-h-[120px] text-base p-4 focus-visible:ring-primary/40"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-2 right-2">
                    <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full">
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">Help</span>
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p>Enter your tasks, ideas, or to-dos. The AI will prioritize them for you.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="bg-muted/30 rounded-md p-3">
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <span>Need inspiration? Try these examples:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, i) => (
                <Button 
                  key={i} 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="text-xs bg-background hover:bg-background/80"
                  onClick={() => handleExampleClick(example)}
                  disabled={isProcessing}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-3 pt-2">
        <Button 
          type="submit" 
          disabled={isProcessing || !input.trim()}
          className="flex items-center gap-2 px-4"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> 
              Analyzing...
            </>
          ) : (
            <>
              Prioritize Tasks <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

export default CompassInputForm;
