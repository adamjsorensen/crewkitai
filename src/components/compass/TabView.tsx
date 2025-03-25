
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ListChecks, PenSquare } from 'lucide-react';
import CompassInput from './CompassInput';
import TaskList from './TaskList';
import TaskViewSwitcher from './TaskViewSwitcher';
import TaskFilters from './TaskFilters';
import { CompassTask, CompassTaskDisplay } from '@/types/compass';

interface TabViewProps {
  tasks: CompassTaskDisplay[];
  isLoading: boolean;
  onPlanCreated: (planId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onSetReminder: (taskId: string) => void;
  onAddToCalendar: (taskId: string) => void;
}

const TabView: React.FC<TabViewProps> = ({
  tasks,
  isLoading,
  onPlanCreated,
  onCompleteTask,
  onSetReminder,
  onAddToCalendar
}) => {
  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="create" className="flex items-center gap-2 py-3">
          <PenSquare className="h-4 w-4" />
          <span>Create & Plan</span>
        </TabsTrigger>
        <TabsTrigger value="manage" className="flex items-center gap-2 py-3">
          <ListChecks className="h-4 w-4" />
          <span>Manage Tasks</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="create" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <div className="space-y-6">
          <CompassInput onPlanCreated={onPlanCreated} />
        </div>
      </TabsContent>
      
      <TabsContent value="manage" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TaskViewSwitcher />
            <TaskFilters />
          </div>
          
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-16 bg-muted/20 rounded-lg border border-dashed">
              <div className="h-10 w-10 rounded-full border-4 border-primary/60 border-t-transparent animate-spin mb-4" />
              <p className="text-muted-foreground">Loading your tasks...</p>
            </div>
          ) : (
            <TaskList 
              tasks={tasks} 
              onCompleteTask={onCompleteTask}
              onSetReminder={onSetReminder}
              onAddToCalendar={onAddToCalendar}
            />
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default TabView;
