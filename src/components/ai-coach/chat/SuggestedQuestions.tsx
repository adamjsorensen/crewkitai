
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ 
  questions, 
  onQuestionClick 
}) => {
  if (!questions.length) return null;
  
  return (
    <div className="mt-4 space-y-2.5">
      <p className="text-xs font-medium text-muted-foreground">Follow-up questions:</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="group text-xs py-1.5 px-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-full border border-primary/10 hover:border-primary/30 transition-colors flex items-center gap-1.5"
          >
            <span className="truncate">{question}</span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
