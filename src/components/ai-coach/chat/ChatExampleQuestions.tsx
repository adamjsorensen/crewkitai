
import React from 'react';
import { Card } from '@/components/ui/card';
import { LightbulbIcon, MessageCircleIcon } from 'lucide-react';

interface ChatExampleQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  isSuggested?: boolean;
}

const ChatExampleQuestions: React.FC<ChatExampleQuestionsProps> = ({ 
  questions, 
  onQuestionClick, 
  isSuggested = false 
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-3">
      <p className="text-sm text-muted-foreground mb-2 ml-1">
        {isSuggested ? "Follow-up suggestions:" : "Try asking about:"}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {questions.map((question, index) => (
          <Card 
            key={index} 
            className="p-3 hover:bg-accent/50 transition-colors cursor-pointer border-border/30 hover:border-border/70" 
            onClick={() => onQuestionClick(question)}
          >
            <div className="flex items-start">
              {isSuggested ? (
                <MessageCircleIcon className="h-4 w-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
              ) : (
                <LightbulbIcon className="h-4 w-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm">{question}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChatExampleQuestions;
