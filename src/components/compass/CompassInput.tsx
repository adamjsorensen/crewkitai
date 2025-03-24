
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
    <Card className="w-full border-2 border-primary/10 shadow-md compass-input-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-2xl text-primary">
          Strategic Planner
        </CardTitle>
        <CardDescription className="text-base">
          Enter your tasks below and our AI will prioritize them for you, helping you focus on what matters most.
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
