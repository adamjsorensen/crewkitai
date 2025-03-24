import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CompassTaskDisplay } from '@/types/compass';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: CompassTaskDisplay[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <Card className="w-full border-2 border-primary/10 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">No Tasks Yet</CardTitle>
          <CardDescription>Add some tasks to see them prioritized here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Once you add tasks, they will be listed here in order of priority.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="task-list-container space-y-4">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
};

export default TaskList;

