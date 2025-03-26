
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
      toast({
        title: 'Failed to log activity',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  return { logActivity };
}
