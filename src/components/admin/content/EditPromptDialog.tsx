
import React, { useEffect, useState, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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
  const [isLoadingData, setIsLoadingData] = useState(false);
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
        setIsLoadingData(true);
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
            try {
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
            } catch (paramError) {
              console.error("Error loading parameters:", paramError);
              toast({
                title: "Error loading parameters",
                description: "There was a problem loading the parameters for this prompt.",
                variant: "destructive",
              });
            }
          } else {
            setPromptParameters([]);
            setSelectedParameters([]);
            setSelectedParameterIds([]);
          }
        } catch (error) {
          console.error("Error loading prompt data:", error);
          toast({
            title: "Error loading prompt",
            description: "There was a problem loading the prompt data.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    if (open) {
      loadPromptData();
    }
  }, [open, promptId, getPromptById, getParametersForPrompt, form, toast]);

  const handleSubmit = useCallback(async (values: PromptFormValues) => {
    if (!prompt || !promptId) {
      console.error("Cannot submit: prompt or promptId is null");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Convert hubArea string to the appropriate type (or null if empty)
      const hubArea: HubAreaType = values.hubArea ? values.hubArea as HubAreaType : null;
      
      // Update the prompt
      const result = await updatePrompt.mutateAsync({
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
            .filter(Boolean) as string[]
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
          await deleteParameterRule.mutateAsync(ruleId);
        }
      }
      
      toast({
        title: "Prompt updated",
        description: "The prompt was updated successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast({
        title: "Error updating prompt",
        description: "There was a problem updating the prompt.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [prompt, promptId, updatePrompt, promptParameters, selectedParameters, createParameterRule, updateParameterRule, deleteParameterRule, onOpenChange, toast]);

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open && !isLoading) {
      // Reset form and states
      form.reset();
      setSelectedParameters([]);
      setSelectedParameterIds([]);
      setPrompt(null);
      setPromptParameters([]);
      onOpenChange(false);
    }
  }, [form, isLoading, onOpenChange]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleDialogClose}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {prompt?.is_category ? "Category" : "Prompt"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingData || !prompt ? (
          <DialogLoadingState />
        ) : (
          <PromptFormContainer
            form={form}
            isCategory={prompt.is_category}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          >
            {!prompt.is_category && (
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

export default React.memo(EditPromptDialog);
