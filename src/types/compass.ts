
export type CompassUserProfile = {
  id: string;
  business_name?: string;
  crew_size?: '1-3' | '4-10' | '10+';
  specialties?: string[];
  workload?: 'High' | 'Medium' | 'Low';
  created_at: string;
  updated_at: string;
};

export type CompassPlan = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type CompassTask = {
  id: string;
  plan_id: string;
  task_text: string;
  priority: 'High' | 'Medium' | 'Low';
  reasoning?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type CompassReminder = {
  id: string;
  task_id: string;
  method: 'Email' | 'SMS';
  trigger_at: string;
  triggered: boolean;
  created_at: string;
};

export type CompassClarification = {
  id: string;
  task_id: string;
  question: string;
  answer?: string;
  created_at: string;
  updated_at: string;
};

export type CompassPriorityRule = {
  id: string;
  keyword: string;
  priority: 'High' | 'Medium' | 'Low';
  created_at: string;
  updated_at: string;
};

export type CompassTaskDisplay = CompassTask & {
  clarification?: CompassClarification;
};

export type CompassAnalyzeResponse = {
  plan_id: string;
  tasks: Array<{
    task_text: string;
    priority: 'High' | 'Medium' | 'Low';
    reasoning: string;
    due_date?: string;
    needs_clarification?: boolean;
    clarification_question?: string;
  }>;
  discarded_count: number;
};
