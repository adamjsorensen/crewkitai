
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompassAnalyzeResponse } from '@/types/compass';
import { useCompassPlanCreation } from '@/hooks/tasks/useCompassPlanCreation';
import CompassInputForm from './input/CompassInputForm';

interface CompassInputProps {
  onPlanCreated: (planId: string) => void;
  onTasksGenerated?: (response: CompassAnalyzeResponse) => void;
}

const CompassInput: React.FC<CompassInputProps> = ({ onPlanCreated, onTasksGenerated }) => {
  const { createPlan, isProcessing } = useCompassPlanCreation({ 
    onPlanCreated, 
    onTasksGenerated 
  });
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Strategic Planner</CardTitle>
        <CardDescription>
          Enter your tasks, ideas, or reflections and we'll help you prioritize them.
        </CardDescription>
      </CardHeader>
      <CompassInputForm 
        onSubmit={createPlan} 
        isProcessing={isProcessing} 
      />
    </Card>
  );
};

export default CompassInput;
