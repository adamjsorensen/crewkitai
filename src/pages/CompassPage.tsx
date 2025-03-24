import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { PlusCircle, HelpCircle, Settings } from 'lucide-react';
import CompassInput from '@/components/compass/CompassInput';
import CompassTaskList from '@/components/compass/CompassTaskList';
import CompassKanbanBoard from '@/components/compass/CompassKanbanBoard';
import CompassCalendarView from '@/components/compass/CompassCalendarView';
import TaskViewSwitcher from '@/components/compass/TaskViewSwitcher';
import { TaskViewProvider, useTaskView } from '@/contexts/TaskViewContext';
import { CompassAnalyzeResponse } from '@/types/compass';
import { useCompassPlans } from '@/hooks/tasks/useCompassPlans';
import CompassPlanSelector from '@/components/compass/CompassPlanSelector';
import CompassWrapper from '@/components/compass/CompassWrapper';

const CompassPageContent = () => {
  const { viewType } = useTaskView();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { planId } = useParams<{ planId: string }>();
  
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(planId || null);
  const [tasksResponse, setTasksResponse] = useState<CompassAnalyzeResponse | null>(null);
  
  const { plans, isLoading: plansLoading, refetchPlans } = useCompassPlans();
  
  // Handle plan creation
  const handlePlanCreated = (newPlanId: string) => {
    setSelectedPlanId(newPlanId);
    navigate(`/dashboard/compass/${newPlanId}`);
    toast("Plan created!", {
      description: "Your tasks have been prioritized and organized.",
    });
    refetchPlans();
  };
  
  // Handle tasks generated
  const handleTasksGenerated = (response: CompassAnalyzeResponse) => {
    setTasksResponse(response);
  };
  
  // Update URL when plan changes
  useEffect(() => {
    if (selectedPlanId) {
      navigate(`/dashboard/compass/${selectedPlanId}`, { replace: true });
    } else {
      navigate('/dashboard/compass', { replace: true });
    }
  }, [selectedPlanId, navigate]);
  
  // Handle plan selection
  const handlePlanSelected = (id: string | null) => {
    setSelectedPlanId(id);
    setTasksResponse(null); // Clear previous tasks when switching plans
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Strategic Planner</h1>
          <p className="text-muted-foreground mt-1">
            Organize, prioritize, and execute your tasks with AI assistance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              // Reset to create a new plan
              setSelectedPlanId(null);
              setTasksResponse(null);
              navigate('/dashboard/compass');
            }}
          >
            <PlusCircle className="h-4 w-4" />
            New Plan
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              toast("Need help?", {
                description: "Click on any task to see more details and actions you can take.",
                duration: 5000,
              });
            }}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => navigate('/dashboard/admin/compass-settings')}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>
      
      {!selectedPlanId && (
        <CompassInput 
          onPlanCreated={handlePlanCreated} 
          onTasksGenerated={handleTasksGenerated}
        />
      )}
      
      {plans && plans.length > 0 && (
        <div className="mb-6 mt-6">
          <CompassPlanSelector 
            plans={plans}
            selectedPlanId={selectedPlanId}
            onPlanSelected={handlePlanSelected}
            isLoading={plansLoading}
          />
        </div>
      )}
      
      {selectedPlanId && (
        <div className="mt-6">
          <TaskViewSwitcher />
          
          {viewType === 'list' && (
            <CompassTaskList planId={selectedPlanId} />
          )}
          
          {viewType === 'kanban' && (
            <CompassKanbanBoard planId={selectedPlanId} />
          )}
          
          {viewType === 'calendar' && (
            <CompassCalendarView planId={selectedPlanId} />
          )}
        </div>
      )}
      
      {tasksResponse && !selectedPlanId && (
        <div className="mt-6">
          <Card className="p-4 border-2 border-primary/10">
            <h2 className="text-xl font-semibold mb-4">Task Analysis</h2>
            <div className="prose max-w-none">
              <p>{tasksResponse.analysis}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const CompassPage = () => {
  return (
    <DashboardLayout>
      <TaskViewProvider>
        <CompassWrapper>
          <CompassPageContent />
        </CompassWrapper>
      </TaskViewProvider>
    </DashboardLayout>
  );
};

export default CompassPage;
