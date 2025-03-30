
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPromptParameters, ParameterWithTweaks } from "@/hooks/useCrewkitPromptParameters";
import { Loader2 } from "lucide-react";
import PromptFormFields, { PromptFormValues } from "./shared/PromptFormFields";
import ParameterSelection, { SelectedParameter } from "./shared/ParameterSelection";

// Define the hub area type to match the expected type in Prompt
type HubAreaType = 'marketing' | 'sales' | 'operations' | 'client_communications' | 'general' | null;

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
    parameters, 
    getParametersForPrompt, 
    createParameterRule, 
    updateParameterRule,
    deleteParameterRule,
    isLoading: isLoadingParameters 
  } = useCrewkitPromptParameters();
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>([]);
  const [selectedParameterIds, setSelectedParameterIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [promptParameters, setPromptParameters] = useState<ParameterWithTweaks[]>([]);

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
        setIsLoading(true);
        try {
          const promptData = await getPromptById(promptId);
          setPrompt(promptData);
          
          form.reset({
            title: promptData.title,
            description: promptData.description || "",
            hubArea: promptData.hub_area || "",
            prompt: promptData.prompt || "",
          });
          
          // Load parameters for this prompt
          if (!promptData.is_category) {
            const parametersData = await getParametersForPrompt(promptId);
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

  // Update selectedParameterIds when selectedParameters changes
  useEffect(() => {
    setSelectedParameterIds(selectedParameters.map(param => param.id));
  }, [selectedParameters]);

  const handleParameterSelect = (parameterId: string) => {
    // Skip if already selected
    if (selectedParameterIds.includes(parameterId)) return;

    const parameterToAdd = parameters.find(p => p.id === parameterId);
    if (parameterToAdd) {
      const newParam: SelectedParameter = {
        id: parameterToAdd.id,
        name: parameterToAdd.name,
        isRequired: false,
        order: selectedParameters.length, // Add to the end
      };
      
      setSelectedParameters([...selectedParameters, newParam]);
    }
  };

  const handleRemoveParameter = (parameterId: string) => {
    const updatedParameters = selectedParameters.filter(p => p.id !== parameterId);
    // Update order after removal
    const reorderedParameters = updatedParameters.map((p, index) => ({
      ...p,
      order: index,
    }));
    
    setSelectedParameters(reorderedParameters);
  };

  const handleRequiredChange = (parameterId: string, isRequired: boolean) => {
    const updatedParameters = selectedParameters.map(p => 
      p.id === parameterId ? { ...p, isRequired } : p
    );
    
    setSelectedParameters(updatedParameters);
  };

  const handleSubmit = async (values: PromptFormValues) => {
    if (!prompt || !promptId) return;
    
    try {
      setIsLoading(true);
      
      // Convert hubArea string to the appropriate type (or null if empty)
      const hubArea: HubAreaType = values.hubArea ? values.hubArea as HubAreaType : null;
      
      // Update the prompt
      await updatePrompt.mutateAsync({
        id: promptId,
        title: values.title,
        description: values.description || null,
        prompt: prompt.is_category ? null : values.prompt,
        hub_area: hubArea,
      });
      
      // If this is not a category, update parameter rules
      if (!prompt.is_category) {
        // Get existing parameter rules from promptParameters
        const existingRuleIds = new Set(
          promptParameters
            .filter(p => p.rule)
            .map(p => p.rule?.id)
        );
        
        // Update, create, or delete parameter rules
        for (const param of selectedParameters) {
          if (param.ruleId) {
            // Update existing rule
            await updateParameterRule.mutateAsync({
              id: param.ruleId,
              is_required: param.isRequired,
              order: param.order,
            });
            
            // Remove from existingRuleIds to track what needs to be deleted
            existingRuleIds.delete(param.ruleId);
          } else {
            // Create new rule
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
            await deleteParameterRule.mutateAsync(ruleId);
          }
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {prompt?.is_category ? "Category" : "Prompt"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <PromptFormFields 
                form={form} 
                isCategory={prompt?.is_category || false} 
              />

              {prompt && !prompt.is_category && (
                <ParameterSelection
                  parameters={parameters}
                  selectedParameters={selectedParameters}
                  selectedParameterIds={selectedParameterIds}
                  onParameterSelect={handleParameterSelect}
                  onRemoveParameter={handleRemoveParameter}
                  onRequiredChange={handleRequiredChange}
                />
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditPromptDialog;
