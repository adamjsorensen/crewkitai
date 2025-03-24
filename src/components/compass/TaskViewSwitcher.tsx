
import React from 'react';
import { useTaskView } from '@/contexts/TaskViewContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Columns, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const TaskViewSwitcher: React.FC = () => {
  const { viewType, setViewType, saveViewPreference } = useTaskView();

  const handleViewChange = async (value: string) => {
    setViewType(value as 'list' | 'kanban' | 'calendar');
    
    // Save the preference change
    await saveViewPreference();
  };

  return (
    <div className="mb-4">
      <Tabs value={viewType} onValueChange={handleViewChange} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-xs">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <Columns className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TaskViewSwitcher;
