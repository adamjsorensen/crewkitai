
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompassAnalyzeResponse } from '@/types/compass';
import { useCompassPlanCreation } from '@/hooks/tasks/useCompassPlanCreation';
import CompassInputForm from './input/CompassInputForm';

interface CompassInputProps {
  onPlanCreated: (planId: string) => void;
  onTasksGenerated?: (response: CompassAnalyzeResponse) => void;
  onHelpClick?: () => void; // Add new prop
}

const CompassInput: React.FC<CompassInputProps> = ({ 
  onPlanCreated, 
  onTasksGenerated,
  onHelpClick, 
}) => {
  const { createPlan, isProcessing } = useCompassPlanCreation({ 
    onPlanCreated, 
    onTasksGenerated 
  });
  
  return (
    <Card className="w-full border-2 border-primary/10 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-2xl text-primary">
          What's on your mind today?
        </CardTitle>
        <CardDescription className="text-base">
          Enter your tasks, ideas, or reflections below. Our AI will organize and prioritize them for you.
        </CardDescription>
      </CardHeader>
      <CompassInputForm 
        onSubmit={createPlan} 
        isProcessing={isProcessing} 
        onHelpClick={onHelpClick}
      />
    </Card>
  );
};

export default CompassInput;
