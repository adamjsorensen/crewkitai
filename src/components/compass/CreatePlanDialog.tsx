
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CompassInput from '@/components/compass/CompassInput';
import { CompassAnalyzeResponse } from '@/types/compass';

interface CreatePlanDialogProps {
  onTasksGenerated: (response: CompassAnalyzeResponse) => void;
}

const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({ onTasksGenerated }) => {
  const [open, setOpen] = React.useState(false);
  
  const handlePlanCreated = (planId: string) => {
    // CreatePlanDialog is only interested in the tasks being generated,
    // the plan ID is handled by the CompassInput component internally
    console.log("Plan created with ID:", planId);
  };
  
  const handleTasksGenerated = (response: CompassAnalyzeResponse) => {
    onTasksGenerated(response);
    setOpen(false); // Close the dialog after successful submission
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create A New Plan</DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          <CompassInput 
            onPlanCreated={handlePlanCreated} 
            onTasksGenerated={handleTasksGenerated}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlanDialog;
