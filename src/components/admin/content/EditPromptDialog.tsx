
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrewkitPrompts, Prompt, HubAreaType } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPromptParameters, ParameterWithTweaks } from "@/hooks/useCrewkitPromptParameters";
import { PromptFormValues } from "./shared/PromptFormFields";
import { SelectedParameter } from "./shared/ParameterSelection";
import DialogLoadingState from "./prompts/DialogLoadingState";
import PromptFormContainer from "./prompts/PromptFormContainer";
import ParameterRuleManager from "./prompts/ParameterRuleManager";

type EditPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: string | null;
};

const EditPromptDialog = ({
  open,
  onOpenChange,
  promptId,
}: EditPromptDialogProps) => {
  const { getPromptById, updatePrompt } = useCrewkitPrompts();
  const { 
    getParametersForPrompt, 
    createParameterRule, 
    updateParameterRule,
    deleteParameterRule,
  } = useCrewkitPromptParameters();
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>([]);
  const [selectedParameterIds, setSelectedParameterIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [promptParameters, setPromptParameters] = useState<ParameterWithTweaks[]>([]);

  console.log("EditPromptDialog rendered with props:", { open, promptId });

  // Define validation schema based on whether we're editing a category or prompt
  const formSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    description: z.string().optional(),
    hubArea: z.string().optional(),
    prompt: z.string().optional(),
  });

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      hubArea: "",
      prompt: "",
    },
  });

  // Load prompt data when dialog opens
  useEffect(() => {
    const loadPromptData = async () => {
      if (open && promptId) {
        console.log("Loading prompt data for promptId:", promptId);
        setIsLoading(true);
        try {
          const promptData = await getPromptById(promptId);
          console.log("Prompt data loaded:", promptData);
          setPrompt(promptData);
          
          form.reset({
            title: promptData.title,
            description: promptData.description || "",
            hubArea: promptData.hub_area || "",
            prompt: promptData.prompt || "",
          });
          
          // Load parameters for this prompt
          if (!promptData.is_category) {
            console.log("Loading parameters for prompt:", promptId);
            try {
              const parametersData = await getParametersForPrompt(promptId);
              console.log("Parameters data loaded:", parametersData);
              setPromptParameters(parametersData);
              
              // Convert to selected parameters format
              const selectedParams = parametersData.map((param, index) => ({
                id: param.id,
                name: param.name,
                isRequired: param.rule?.is_required || false,
                order: param.rule?.order || index,
                ruleId: param.rule?.id,
              }));
              
              setSelectedParameters(selectedParams);
              setSelectedParameterIds(selectedParams.map(p => p.id));
            } catch (paramError) {
              console.error("Error loading parameters:", paramError);
            }
          } else {
            setPromptParameters([]);
            setSelectedParameters([]);
            setSelectedParameterIds([]);
          }
        } catch (error) {
          console.error("Error loading prompt data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPromptData();
  }, [open, promptId, getPromptById, getParametersForPrompt, form]);

  const handleSubmit = async (values: PromptFormValues) => {
    console.log("EditPromptDialog handleSubmit called with values:", values);
    if (!prompt || !promptId) {
      console.error("Cannot submit: prompt or promptId is null");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Convert hubArea string to the appropriate type (or null if empty)
      const hubArea: HubAreaType = values.hubArea ? values.hubArea as HubAreaType : null;
      
      console.log("Updating prompt with data:", {
        id: promptId,
        title: values.title,
        description: values.description || null,
        prompt: prompt.is_category ? null : values.prompt,
        hub_area: hubArea,
      });
      
      // Update the prompt
      const result = await updatePrompt.mutateAsync({
        id: promptId,
        title: values.title,
        description: values.description || null,
        prompt: prompt.is_category ? null : values.prompt,
        hub_area: hubArea,
      });
      
      console.log("Prompt updated successfully:", result);
      
      // If this is not a category, update parameter rules
      if (!prompt.is_category) {
        // Get existing parameter rules from promptParameters
        const existingRuleIds = new Set(
          promptParameters
            .filter(p => p.rule)
            .map(p => p.rule?.id)
        );
        
        console.log("Processing parameter rules - existing rule IDs:", existingRuleIds);
        console.log("Selected parameters:", selectedParameters);
        
        // Update, create, or delete parameter rules
        for (const param of selectedParameters) {
          if (param.ruleId) {
            // Update existing rule
            console.log("Updating rule:", param.ruleId);
            await updateParameterRule.mutateAsync({
              id: param.ruleId,
              is_required: param.isRequired,
              order: param.order,
            });
            
            // Remove from existingRuleIds to track what needs to be deleted
            existingRuleIds.delete(param.ruleId);
          } else {
            // Create new rule
            console.log("Creating new rule for parameter:", param.id);
            await createParameterRule.mutateAsync({
              prompt_id: promptId,
              parameter_id: param.id,
              is_active: true,
              is_required: param.isRequired,
              order: param.order,
            });
          }
        }
        
        // Delete rules that were removed
        for (const ruleId of existingRuleIds) {
          if (ruleId) {
            console.log("Deleting rule:", ruleId);
            await deleteParameterRule.mutateAsync(ruleId);
          }
        }
      }
      
      console.log("All operations completed successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        console.log("Dialog onOpenChange called with:", newOpen);
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {prompt?.is_category ? "Category" : "Prompt"}
          </DialogTitle>
        </DialogHeader>

        {isLoading && !prompt ? (
          <DialogLoadingState />
        ) : (
          <PromptFormContainer
            form={form}
            isCategory={prompt?.is_category || false}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          >
            {prompt && (
              <ParameterRuleManager
                promptId={promptId}
                isCategory={prompt.is_category}
                selectedParameters={selectedParameters}
                setSelectedParameters={setSelectedParameters}
                selectedParameterIds={selectedParameterIds}
                setSelectedParameterIds={setSelectedParameterIds}
              />
            )}
          </PromptFormContainer>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditPromptDialog;
