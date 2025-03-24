
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import 'https://deno.land/x/xhr@0.3.0/mod.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskReminder {
  id: string;
  task_id: string;
  method: 'Email' | 'SMS';
  trigger_at: string;
  triggered: boolean;
  created_at: string;
  task: {
    id: string;
    task_text: string;
    priority: string;
    reasoning?: string;
    due_date?: string;
    category?: {
      name: string;
      color: string;
    };
  };
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
}

serve(async (req) => {
  console.log("[compass-notify] Function invoked");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[compass-notify] Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API keys and URLs from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    if (!resendApiKey) {
      throw new Error('Missing Resend API key');
    }
    
    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    
    console.log("[compass-notify] Clients initialized");
    
    // Get current time
    const now = new Date();
    
    // Query for reminders that need to be sent
    console.log("[compass-notify] Querying for due reminders");
    const { data: reminders, error: reminderError } = await supabase
      .from('compass_reminders')
      .select(`
        id,
        task_id,
        method,
        trigger_at,
        triggered,
        created_at,
        task:compass_tasks (
          id,
          task_text,
          priority,
          reasoning,
          due_date,
          category:compass_categories (
            name,
            color
          )
        )
      `)
      .eq('triggered', false)
      .lte('trigger_at', now.toISOString());
      
    if (reminderError) {
      console.error("[compass-notify] Error fetching reminders:", reminderError);
      throw reminderError;
    }
    
    console.log(`[compass-notify] Found ${reminders.length} reminders to process`);
    
    // Process each reminder
    const reminderResults = await Promise.all(
      reminders.map(async (reminder) => {
        try {
          console.log(`[compass-notify] Processing reminder ${reminder.id} for task ${reminder.task.task_text}`);
          
          // Get the user's email and name by looking up the task owner
          const { data: planData, error: planError } = await supabase
            .from('compass_tasks')
            .select(`
              plan:compass_plans (
                user_id
              )
            `)
            .eq('id', reminder.task_id)
            .single();
            
          if (planError) {
            console.error(`[compass-notify] Error fetching plan for task ${reminder.task_id}:`, planError);
            throw planError;
          }
          
          const userId = planData.plan.user_id;
          
          // Get user's email and profile
          const { data: userData, error: userError } = await supabase
            .auth.admin.getUserById(userId);
            
          if (userError) {
            console.error(`[compass-notify] Error fetching user ${userId}:`, userError);
            throw userError;
          }
          
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();
            
          const userEmail = userData.user.email;
          const userName = profileData?.full_name || 'Painter';
          
          if (!userEmail) {
            throw new Error(`User ${userId} has no email address`);
          }
          
          console.log(`[compass-notify] Sending ${reminder.method} notification to ${userEmail}`);
          
          // Send email notification
          if (reminder.method === 'Email') {
            const priorityColors = {
              'High': '#ef4444', // red
              'Medium': '#f59e0b', // amber
              'Low': '#10b981', // green
              'default': '#6b7280' // gray
            };
            
            const priorityColor = priorityColors[reminder.task.priority] || priorityColors.default;
            const categoryBadge = reminder.task.category 
              ? `<span style="background-color: ${reminder.task.category.color}20; color: ${reminder.task.category.color}; border: 1px solid ${reminder.task.category.color}; border-radius: 4px; padding: 2px 8px; font-size: 12px; margin-left: 8px;">${reminder.task.category.name}</span>` 
              : '';
            
            const emailResponse = await resend.emails.send({
              from: 'PainterGrowth Strategic Compass <compass@paintergrowth.io>',
              to: userEmail,
              subject: `Task Reminder: ${reminder.task.task_text}`,
              html: `
                <html>
                  <head>
                    <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                      .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eaeaea; }
                      .logo { font-weight: bold; font-size: 24px; color: #4f46e5; }
                      .task-card { border: 1px solid #eaeaea; border-radius: 8px; padding: 16px; margin: 24px 0; }
                      .priority-badge { display: inline-block; background-color: ${priorityColor}15; color: ${priorityColor}; border: 1px solid ${priorityColor}; border-radius: 4px; padding: 2px 8px; font-size: 12px; }
                      .task-title { font-size: 18px; font-weight: bold; margin: 12px 0; }
                      .task-reasoning { font-style: italic; color: #666; margin-bottom: 16px; }
                      .cta-button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 12px; }
                      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666; text-align: center; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <div class="logo">PainterGrowth</div>
                      </div>
                      
                      <h2>Hello ${userName},</h2>
                      <p>This is a reminder about a task you wanted to complete:</p>
                      
                      <div class="task-card">
                        <div>
                          <span class="priority-badge">${reminder.task.priority}</span>
                          ${categoryBadge}
                        </div>
                        <h3 class="task-title">${reminder.task.task_text}</h3>
                        ${reminder.task.reasoning ? `<p class="task-reasoning">${reminder.task.reasoning}</p>` : ''}
                        ${reminder.task.due_date ? `<p><strong>Due date:</strong> ${new Date(reminder.task.due_date).toLocaleDateString()}</p>` : ''}
                        
                        <a href="https://app.paintergrowth.io/dashboard/compass" class="cta-button">View Task</a>
                      </div>
                      
                      <p>Log in to your PainterGrowth account to mark this task as complete or reschedule it.</p>
                      
                      <div class="footer">
                        <p>This email was sent from PainterGrowth Strategic Compass. If you did not set this reminder, please contact support.</p>
                      </div>
                    </div>
                  </body>
                </html>
              `,
            });
            
            console.log(`[compass-notify] Email sent for reminder ${reminder.id}:`, emailResponse);
          } else if (reminder.method === 'SMS') {
            console.log(`[compass-notify] SMS notifications not implemented yet`);
            // Future implementation for SMS notifications
          }
          
          // Mark the reminder as triggered
          const { error: updateError } = await supabase
            .from('compass_reminders')
            .update({ triggered: true })
            .eq('id', reminder.id);
            
          if (updateError) {
            console.error(`[compass-notify] Error marking reminder ${reminder.id} as triggered:`, updateError);
            throw updateError;
          }
          
          return {
            id: reminder.id,
            task_id: reminder.task_id,
            method: reminder.method,
            status: 'success'
          };
        } catch (err) {
          console.error(`[compass-notify] Error processing reminder ${reminder.id}:`, err);
          return {
            id: reminder.id,
            task_id: reminder.task_id,
            method: reminder.method,
            status: 'error',
            error: err.message
          };
        }
      })
    );
    
    const successCount = reminderResults.filter(r => r.status === 'success').length;
    const errorCount = reminderResults.filter(r => r.status === 'error').length;
    
    console.log(`[compass-notify] Completed processing ${reminderResults.length} reminders: ${successCount} succeeded, ${errorCount} failed`);
    
    return new Response(
      JSON.stringify({
        processed: reminderResults.length,
        succeeded: successCount,
        failed: errorCount,
        details: reminderResults
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('[compass-notify] Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
