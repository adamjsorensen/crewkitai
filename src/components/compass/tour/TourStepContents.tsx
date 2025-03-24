
import React from 'react';
import { Info, ListPlus, CheckCircle, ArrowRight, MoveUp, Calendar, CheckCheck } from 'lucide-react';

export const WelcomeStepContent: React.FC = () => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center gap-2 text-primary">
      <Info size={18} />
      <span>Welcome to the Strategic Planner!</span>
    </div>
    <p>This tool helps prioritize your tasks so you can focus on what matters most.</p>
  </div>
);

export const InputStepContent: React.FC = () => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center gap-2 text-primary">
      <ListPlus size={18} />
      <span>Enter Your Tasks</span>
    </div>
    <p>Type in your tasks, ideas, or to-dos. You can enter multiple items at once.</p>
  </div>
);

export const ExamplesStepContent: React.FC = () => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center gap-2 text-primary">
      <Info size={18} />
      <span>Example Tasks</span>
    </div>
    <p>Click on these examples to quickly add them to your input.</p>
  </div>
);

export const SubmitStepContent: React.FC = () => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center gap-2 text-primary">
      <ArrowRight size={18} />
      <span>Prioritize Your Tasks</span>
    </div>
    <p>When you're ready, click this button to have AI analyze and prioritize your tasks.</p>
  </div>
);

export const TaskListStepContent: React.FC = () => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center gap-2 text-primary">
      <MoveUp size={18} />
      <span>Prioritized Task List</span>
    </div>
    <p>Your tasks will appear here, organized by priority level - focus on high priority items first.</p>
  </div>
);

export const TaskPriorityStepContent: React.FC = () => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center gap-2 text-primary">
      <CheckCircle size={18} />
      <span>Task Priority</span>
    </div>
    <p>Each task is assigned a priority level - High, Medium, or Low. High priority tasks need your attention first.</p>
  </div>
);

export const CompleteTaskStepContent: React.FC = () => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center gap-2 text-primary">
      <CheckCheck size={18} />
      <span>Complete Tasks</span>
    </div>
    <p>Click here to mark a task as complete when you've finished it.</p>
  </div>
);
