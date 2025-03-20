
import React from 'react';

interface TypingFeedbackProps {
  currentLength: number;
  maxLength?: number;
}

const TypingFeedback: React.FC<TypingFeedbackProps> = ({ 
  currentLength, 
  maxLength = 4000 
}) => {
  const getColor = () => {
    if (!maxLength) return 'text-muted-foreground';
    const percentage = (currentLength / maxLength) * 100;
    if (percentage < 75) return 'text-muted-foreground';
    if (percentage < 90) return 'text-amber-500';
    return 'text-red-500';
  };
  
  return (
    <div className={`text-xs mt-1 ${getColor()}`}>
      {maxLength ? (
        <span>{currentLength} / {maxLength} characters</span>
      ) : (
        <span>{currentLength} characters</span>
      )}
    </div>
  );
};

export default TypingFeedback;
