
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the request body interface
interface CompassRequest {
  input: string;
  user_id?: string;
}

// Define the Task interface
interface Task {
  task_text: string;
  priority: 'High' | 'Medium' | 'Low';
  reasoning: string;
  due_date?: string;
  needs_clarification?: boolean;
  clarification_question?: string;
}

// Function to analyze input text and determine priorities based on keywords
function analyzeTaskPriorities(
  inputText: string, 
  priorityRules: Array<{ keyword: string; priority: 'High' | 'Medium' | 'Low' }>,
  userProfile?: any
): Task[] {
  // Split the input into potential tasks using periods, commas, and line breaks
  const taskTexts = inputText
    .split(/[.,\n]+/)
    .map(task => task.trim())
    .filter(task => task.length > 0);

  // Process each task
  const tasks: Task[] = taskTexts.map(taskText => {
    // Default to Medium priority
    let priority: 'High' | 'Medium' | 'Low' = 'Medium';
    let reasoning = 'Default priority';
    
    // Check for keywords in the task text to determine priority
    for (const rule of priorityRules) {
      if (taskText.toLowerCase().includes(rule.keyword.toLowerCase())) {
        priority = rule.priority;
        reasoning = `Contains the keyword "${rule.keyword}" which suggests ${rule.priority} priority`;
        break;
      }
    }

    // Enhanced reasoning based on user profile if available
    if (userProfile) {
      if (priority === 'High' && userProfile.workload === 'High') {
        reasoning += `. This is especially important given your high current workload.`;
      }
      
      // Add more sophisticated reasoning based on business size, specialty, etc.
      if (userProfile.crew_size === '1-3' && priority === 'High') {
        reasoning += ` With your small crew size, this should be addressed promptly.`;
      }
    }

    // Check if task needs clarification (very simple check for demonstration)
    const needsClarification = taskText.includes('stuff') || taskText.length < 5;
    const clarificationQuestion = needsClarification ? `Please clarify what you mean by "${taskText}"` : undefined;

    // Generate a suggested due date (simple logic - higher priority = sooner due date)
    const today = new Date();
    let dueDate: Date;
    
    if (priority === 'High') {
      dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 1); // High priority: tomorrow
    } else if (priority === 'Medium') {
      dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 3); // Medium priority: 3 days from now
    } else {
      dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 7); // Low priority: 1 week from now
    }

    return {
      task_text: taskText,
      priority,
      reasoning,
      due_date: dueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      needs_clarification: needsClarification,
      clarification_question: clarificationQuestion
    };
  });

  // Limit to 5 tasks maximum, prioritizing by High > Medium > Low
  return tasks
    .sort((a, b) => {
      const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    })
    .slice(0, 5);
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Create Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { input, user_id } = await req.json() as CompassRequest;
    
    if (!input || input.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Input text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing input: "${input}" for user ID: ${user_id || 'anonymous'}`);

    // Fetch priority rules from database
    const { data: priorityRules, error: rulesError } = await supabaseAdmin
      .from('compass_priority_rules')
      .select('keyword, priority');

    if (rulesError) {
      console.error('Error fetching priority rules:', rulesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch priority rules' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profile if user_id is provided
    let userProfile = null;
    if (user_id) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('compass_user_profiles')
        .select('*')
        .eq('id', user_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
      }
      
      userProfile = profile;
    }

    // Analyze the input text and determine task priorities
    const tasks = analyzeTaskPriorities(input, priorityRules, userProfile);

    // Create a plan entry
    let planId: string | null = null;
    if (user_id) {
      const { data: plan, error: planError } = await supabaseAdmin
        .from('compass_plans')
        .insert({ user_id })
        .select('id')
        .single();

      if (planError) {
        console.error('Error creating plan:', planError);
        return new Response(
          JSON.stringify({ error: 'Failed to create plan' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      planId = plan.id;

      // Insert tasks into the database
      const tasksToInsert = tasks.map(task => ({
        plan_id: planId,
        task_text: task.task_text,
        priority: task.priority,
        reasoning: task.reasoning,
        due_date: task.due_date,
      }));

      const { error: tasksError } = await supabaseAdmin
        .from('compass_tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error creating tasks:', tasksError);
        return new Response(
          JSON.stringify({ error: 'Failed to create tasks' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create clarification questions if needed
      const clarificationTasks = tasks.filter(task => task.needs_clarification);
      if (clarificationTasks.length > 0) {
        // Fetch the inserted tasks to get their IDs
        const { data: insertedTasks, error: fetchError } = await supabaseAdmin
          .from('compass_tasks')
          .select('id, task_text')
          .eq('plan_id', planId);

        if (!fetchError && insertedTasks) {
          // Map task_text to the corresponding clarification question
          const clarificationsToInsert = insertedTasks
            .filter(insertedTask => 
              clarificationTasks.some(clarTask => 
                clarTask.task_text === insertedTask.task_text
              )
            )
            .map(insertedTask => {
              const clarTask = clarificationTasks.find(
                cTask => cTask.task_text === insertedTask.task_text
              );
              return {
                task_id: insertedTask.id,
                question: clarTask?.clarification_question || 'Please clarify this task'
              };
            });

          if (clarificationsToInsert.length > 0) {
            const { error: clarificationError } = await supabaseAdmin
              .from('compass_clarifications')
              .insert(clarificationsToInsert);

            if (clarificationError) {
              console.error('Error creating clarifications:', clarificationError);
            }
          }
        }
      }
    }

    // Return the results
    const response = {
      plan_id: planId,
      tasks: tasks,
      discarded_count: Math.max(0, input.split(/[.,\n]+/).filter(s => s.trim().length > 0).length - 5),
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
