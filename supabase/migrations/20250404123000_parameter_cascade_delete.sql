
-- Create a function to efficiently delete a parameter and all related data
CREATE OR REPLACE FUNCTION public.delete_parameter_cascade(param_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete related parameter tweaks
  DELETE FROM parameter_tweaks 
  WHERE parameter_id = param_id;
  
  -- Delete related parameter rules
  DELETE FROM prompt_parameter_rules 
  WHERE parameter_id = param_id;
  
  -- Delete prompt customizations related to this parameter's tweaks
  DELETE FROM prompt_customizations
  WHERE parameter_tweak_id IN (
    SELECT id FROM parameter_tweaks WHERE parameter_id = param_id
  );
  
  -- Finally delete the parameter itself
  DELETE FROM prompt_parameters
  WHERE id = param_id;
  
  -- Log the deletion
  INSERT INTO user_activity_logs (
    user_id,
    action_type,
    action_details,
    affected_resource_type,
    affected_resource_id
  ) VALUES (
    auth.uid(),
    'delete_parameter',
    jsonb_build_object('parameter_id', param_id),
    'prompt_parameters',
    param_id
  );
END;
$$;

-- Update the set_timestamp triggers to use a more efficient approach
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only update timestamp if the record actually changed
  IF (TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW) OR TG_OP = 'INSERT' THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$;

-- Add index to improve parameter queries
CREATE INDEX IF NOT EXISTS idx_parameter_id_parameter_tweaks 
ON parameter_tweaks(parameter_id);

CREATE INDEX IF NOT EXISTS idx_parameter_id_prompt_parameter_rules 
ON prompt_parameter_rules(parameter_id);

CREATE INDEX IF NOT EXISTS idx_prompt_id_prompt_parameter_rules 
ON prompt_parameter_rules(prompt_id);
