
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

// Define OpenAI function calling schema for task analysis
const openAiAnalysisFunction = {
  name: "analyze_tasks",
  description: "Analyze a user's input text and extract tasks with priorities, reasoning, and due dates",
  parameters: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "The list of tasks extracted from the input text",
        items: {
          type: "object",
          properties: {
            task_text: {
              type: "string",
              description: "The task description extracted from the input"
            },
            priority: {
              type: "string",
              enum: ["High", "Medium", "Low"],
              description: "The priority level based on urgency and importance"
            },
            reasoning: {
              type: "string",
              description: "Explanation for why this priority was assigned"
            },
            due_date: {
              type: "string",
              format: "date",
              description: "Suggested completion date in YYYY-MM-DD format"
            },
            needs_clarification: {
              type: "boolean",
              description: "Whether this task needs further clarification"
            },
            clarification_question: {
              type: "string",
              description: "Question to ask the user to clarify the task"
            }
          },
          required: ["task_text", "priority", "reasoning"]
        }
      },
      discarded_count: {
        type: "integer",
        description: "Number of tasks that were discarded (if more than 5 were identified)"
      }
    },
    required: ["tasks"]
  }
};

// Function to create system prompt based on user profile
function createSystemPrompt(userProfile?: any) {
  let basePrompt = `You are a strategic planning assistant for a painting business. 
Your job is to extract tasks from the user's input, prioritize them, and suggest due dates.

Consider these guidelines for prioritization:
- High priority: Critical tasks that require immediate attention, usually involving client deadlines, urgent work, or time-sensitive issues
- Medium priority: Important operational tasks that should be completed in the near future
- Low priority: Planning, strategy, or less time-sensitive activities`;

  if (userProfile) {
    basePrompt += `\n\nUser business context:
- Business name: ${userProfile.business_name || "Unknown"}
- Crew size: ${userProfile.crew_size || "Unknown"}
- Specialties: ${userProfile.specialties?.join(", ") || "Unknown"}
- Current workload: ${userProfile.workload || "Unknown"}

Please consider their business context when prioritizing and assigning due dates.`;
  }
  
  return basePrompt;
}

// Use OpenAI to analyze tasks using function calling
async function analyzeTasksWithAI(
  inputText: string,
  userProfile?: any,
  fallbackRules?: Array<{ keyword: string; priority: 'High' | 'Medium' | 'Low' }>
): Promise<{ tasks: Task[], discarded_count: number }> {
  try {
    console.log("Analyzing tasks with OpenAI");
    
    const openApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openApiKey) {
      throw new Error("OpenAI API key not found");
    }
    
    const systemPrompt = createSystemPrompt(userProfile);
    
    // Call OpenAI API with function calling
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze the following text and extract tasks: "${inputText}"` }
        ],
        functions: [openAiAnalysisFunction],
        function_call: { name: "analyze_tasks" }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      console.error("OpenAI returned an error:", result.error);
      throw new Error(`OpenAI error: ${result.error.message}`);
    }
    
    // Parse function calling response
    if (result.choices && 
        result.choices[0]?.message?.function_call?.name === "analyze_tasks") {
      try {
        const functionArgs = JSON.parse(result.choices[0].message.function_call.arguments);
        console.log("AI analysis result:", functionArgs);
        
        // Limit to 5 tasks maximum
        const tasks = functionArgs.tasks.slice(0, 5);
        const discarded_count = Math.max(0, functionArgs.tasks.length - 5) + (functionArgs.discarded_count || 0);
        
        return { tasks, discarded_count };
      } catch (parseError) {
        console.error("Error parsing OpenAI function response:", parseError);
        throw new Error("Failed to parse AI response");
      }
    } else {
      console.error("OpenAI didn't use function calling properly:", result);
      throw new Error("Unexpected AI response format");
    }
  } catch (error) {
    console.error("AI task analysis failed:", error);
    
    // Fallback to keyword-based analysis
    if (fallbackRules && fallbackRules.length > 0) {
      console.log("Falling back to keyword-based analysis");
      const keywordAnalysis = analyzeTaskPriorities(inputText, fallbackRules, userProfile);
      return { 
        tasks: keywordAnalysis, 
        discarded_count: Math.max(0, inputText.split(/[.,\n]+/).filter(s => s.trim().length > 0).length - 5)
      };
    } else {
      throw error;
    }
  }
}

// Function to analyze input text and determine priorities based on keywords (fallback method)
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

    // Fetch priority rules from database (for fallback)
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

    // Fetch the AI settings
    const { data: aiSettingsData, error: aiSettingsError } = await supabaseAdmin
      .from('ai_settings')
      .select('name, value')
      .in('name', ['compass_ai_enabled']);
      
    // Check if AI analysis is enabled in settings
    let useAi = true; // Default to true
    if (!aiSettingsError && aiSettingsData) {
      const aiEnabledSetting = aiSettingsData.find(s => s.name === 'compass_ai_enabled');
      if (aiEnabledSetting) {
        try {
          // Parse value from JSON
          const parsedValue = JSON.parse(aiEnabledSetting.value);
          if (typeof parsedValue === 'boolean') {
            useAi = parsedValue;
          }
        } catch (e) {
          console.error('Error parsing AI enabled setting:', e);
        }
      }
    }

    // Analyze the input text using AI or fallback to keyword based
    let tasks: Task[] = [];
    let discardedCount = 0;
    
    if (useAi) {
      try {
        // Use OpenAI to analyze tasks
        const aiAnalysis = await analyzeTasksWithAI(input, userProfile, priorityRules);
        tasks = aiAnalysis.tasks;
        discardedCount = aiAnalysis.discarded_count;
      } catch (error) {
        console.error('AI analysis failed, falling back to keyword method:', error);
        tasks = analyzeTaskPriorities(input, priorityRules, userProfile);
        discardedCount = Math.max(0, input.split(/[.,\n]+/).filter(s => s.trim().length > 0).length - 5);
      }
    } else {
      // Use keyword-based analysis as specified in settings
      tasks = analyzeTaskPriorities(input, priorityRules, userProfile);
      discardedCount = Math.max(0, input.split(/[.,\n]+/).filter(s => s.trim().length > 0).length - 5);
    }

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
      discarded_count: discardedCount,
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
