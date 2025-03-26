
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LogActivityParams {
  actionType: string;
  actionDetails?: Record<string, any>;
  affectedUserId?: string;
  affectedResourceType?: string;
  affectedResourceId?: string;
}

export function useLogActivity() {
  const { toast } = useToast();

  const logActivity = async ({
    actionType,
    actionDetails = {},
    affectedUserId,
    affectedResourceType,
    affectedResourceId,
  }: LogActivityParams) => {
    try {
      // First try using the edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'log-activity',
        {
          body: {
            action_type: actionType,
            action_details: actionDetails,
            affected_user_id: affectedUserId,
            affected_resource_type: affectedResourceType,
            affected_resource_id: affectedResourceId,
          },
        }
      );

      if (functionError) {
        console.error('Error calling log-activity function:', functionError);
        
        // Fallback to direct RPC call if function fails
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'log_user_activity',
          {
            p_action_type: actionType,
            p_action_details: actionDetails,
            p_affected_user_id: affectedUserId,
            p_affected_resource_type: affectedResourceType,
            p_affected_resource_id: affectedResourceId,
          }
        );

        if (rpcError) {
          console.error('Error logging activity via RPC:', rpcError);
          throw rpcError;
        }

        return rpcData;
      }

      return functionData.log_id;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Only show toast in development
      if (process.env.NODE_ENV === 'development') {
        toast({
          title: 'Failed to log activity',
          description: error.message,
          variant: 'destructive',
        });
      }
      return null;
    }
  };

  // AI interaction logging helper methods
  const logChatMessage = async (message: string, conversationId?: string) => {
    return logActivity({
      actionType: 'chat_message',
      actionDetails: {
        user_message: message,
        conversation_id: conversationId,
      },
      affectedResourceType: 'conversation',
      affectedResourceId: conversationId,
    });
  };

  const logChatResponse = async (prompt: string, response: string, conversationId?: string) => {
    return logActivity({
      actionType: 'chat_response',
      actionDetails: {
        prompt,
        response,
        conversation_id: conversationId,
      },
      affectedResourceType: 'conversation',
      affectedResourceId: conversationId,
    });
  };

  const logCompassAnalysis = async (inputText: string, tasks: any[], planId: string) => {
    return logActivity({
      actionType: 'compass_analyze',
      actionDetails: {
        input_text: inputText,
        tasks,
      },
      affectedResourceType: 'compass_plan',
      affectedResourceId: planId,
    });
  };

  const logContentGeneration = async (prompt: string, generatedContent: string, contentType: string) => {
    return logActivity({
      actionType: 'content_generated',
      actionDetails: {
        prompt,
        generated_content: generatedContent,
        content_type: contentType,
      },
    });
  };

  return { 
    logActivity,
    logChatMessage,
    logChatResponse,
    logCompassAnalysis,
    logContentGeneration
  };
}
