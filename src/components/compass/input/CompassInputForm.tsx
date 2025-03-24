
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';

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

  return (
    <form onSubmit={handleSubmit}>
      <CardContent>
        <Textarea
          placeholder="Finish the Jones project, call supplier about paint order, brainstorm marketing ideas for next month..."
          className="min-h-[150px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isProcessing || !input.trim()}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> 
              Processing...
            </>
          ) : (
            <>
              Create Plan <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

export default CompassInputForm;
