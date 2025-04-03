import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrewkitPrompts, Prompt, HubAreaType } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
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
  console.log("EditPromptDialog render with open:", open, "promptId:", promptId);
  
  const { toast } = useToast();
  const { getPromptById, updatePrompt } = useCrewkitPrompts();
  const { 
    getParametersForPrompt, 
    createParameterRule, 
    updateParameterRule,
    deleteParameterRule,
  } = useCrewkitPromptParameters();
  
  // Component state
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>([]);
  const [selectedParameterIds, setSelectedParameterIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [internalOpen, setInternalOpen] = useState(open);
  const [parametersLoaded, setParametersLoaded] = useState(false);
  const [loadAttempted, setLoadAttempted] = useState(false);
  // Add counters for operation tracking
  const [operationCounts, setOperationCounts] = useState({
    created: 0,
    updated: 0,
    deleted: 0
  });

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

  // Sync internal state with props
  useEffect(() => {
    console.log("EditPromptDialog: Syncing internal open state:", open);
    setInternalOpen(open);
    
    // Reset loading state when dialog closes
    if (!open) {
      setLoadAttempted(false);
      setParametersLoaded(false);
      // Reset operation counters when dialog closes
      setOperationCounts({
        created: 0,
        updated: 0,
        deleted: 0
      });
    }
  }, [open]);

  // Load prompt data when dialog opens
  useEffect(() => {
    const loadPromptData = async () => {
      if (open && promptId && !loadAttempted) {
        setLoadAttempted(true);
        setIsLoadingData(true);
        console.log("EditPromptDialog: Loading prompt data for promptId:", promptId);
        
        try {
          const promptData = await getPromptById(promptId);
          console.log("EditPromptDialog: Prompt data loaded:", promptData);
          setPrompt(promptData);
          
          form.reset({
            title: promptData.title,
            description: promptData.description || "",
            hubArea: promptData.hub_area || "",
            prompt: promptData.prompt || "",
          });
          
          // Load parameters for this prompt if it's not a category
          if (!promptData.is_category) {
            try {
              console.log("EditPromptDialog: Loading parameters for promptId:", promptId);
              const parametersData = await getParametersForPrompt(promptId);
              console.log("EditPromptDialog: Parameters loaded:", parametersData);
              
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
              setParametersLoaded(true);
            } catch (paramError) {
              console.error("Error loading parameters:", paramError);
              toast({
                title: "Error loading parameters",
                description: "There was a problem loading the parameters for this prompt.",
                variant: "destructive",
              });
            }
          } else {
            setSelectedParameters([]);
            setSelectedParameterIds([]);
            setParametersLoaded(true);
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

    if (open && promptId) {
      loadPromptData();
    }
  }, [open, promptId, getPromptById, getParametersForPrompt, form, toast, loadAttempted]);

  const handleSubmit = useCallback(async (values: PromptFormValues) => {
    if (!prompt || !promptId) {
      console.error("Cannot submit: prompt or promptId is null");
      return;
    }
    
    try {
      console.log("EditPromptDialog: Submitting form with values:", values);
      setIsLoading(true);
      
      // Reset operation counters
      setOperationCounts({
        created: 0,
        updated: 0,
        deleted: 0
      });
      
      // Convert hubArea string to the appropriate type (or null if empty)
      const hubArea: HubAreaType = values.hubArea ? values.hubArea as HubAreaType : null;
      
      // Update the prompt
      console.log("EditPromptDialog: Updating prompt with ID:", promptId);
      const result = await updatePrompt.mutateAsync({
        id: promptId,
        title: values.title,
        description: values.description || null,
        prompt: prompt.is_category ? null : values.prompt,
        hub_area: hubArea,
      });
      
      console.log("EditPromptDialog: Prompt updated successfully:", result);
      
      // If this is not a category, update parameter rules
      if (!prompt.is_category) {
        // Get existing parameter rules to track deletions
        const existingRuleIds = new Set(
          selectedParameters
            .filter(p => p.ruleId)
            .map(p => p.ruleId)
            .filter(Boolean) as string[]
        );
        
        console.log("EditPromptDialog: Processing parameter rules, existing rule IDs:", existingRuleIds);
        
        // Update, create, or delete parameter rules
        for (const param of selectedParameters) {
          if (param.ruleId) {
            // Update existing rule
            console.log("EditPromptDialog: Updating existing rule:", param.ruleId);
            await updateParameterRule.mutateAsync({
              id: param.ruleId,
              is_required: param.isRequired,
              order: param.order,
            }, { 
              onSettled: () => {
                // Increment counter
                setOperationCounts(prev => ({
                  ...prev,
                  updated: prev.updated + 1
                }));
              }
            });
            
            // Remove from existingRuleIds to track what needs to be deleted
            if (existingRuleIds.has(param.ruleId)) {
              existingRuleIds.delete(param.ruleId);
            }
          } else {
            // Create new rule
            console.log("EditPromptDialog: Creating new rule for parameter:", param.id);
            await createParameterRule.mutateAsync({
              prompt_id: promptId,
              parameter_id: param.id,
              is_active: true,
              is_required: param.isRequired,
              order: param.order,
            }, {
              onSettled: () => {
                // Increment counter
                setOperationCounts(prev => ({
                  ...prev,
                  created: prev.created + 1
                }));
              }
            });
          }
        }
        
        // Delete rules that were removed
        console.log("EditPromptDialog: Rules to delete:", [...existingRuleIds]);
        for (const ruleId of existingRuleIds) {
          console.log("EditPromptDialog: Deleting rule:", ruleId);
          await deleteParameterRule.mutateAsync(ruleId, {
            onSettled: () => {
              // Increment counter
              setOperationCounts(prev => ({
                ...prev,
                deleted: prev.deleted + 1
              }));
            }
          });
        }
      }
      
      // Generate a comprehensive toast message
      const changes = [];
      if (operationCounts.created > 0) changes.push(`${operationCounts.created} parameters added`);
      if (operationCounts.updated > 0) changes.push(`${operationCounts.updated} parameters updated`);
      if (operationCounts.deleted > 0) changes.push(`${operationCounts.deleted} parameters removed`);
      
      const description = changes.length > 0 
        ? `Base prompt updated and ${changes.join(', ')}.`
        : "The prompt was updated successfully.";
      
      toast({
        title: "Prompt updated",
        description,
      });
      
      handleDialogClose(false);
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
  }, [prompt, promptId, updatePrompt, selectedParameters, createParameterRule, updateParameterRule, deleteParameterRule, toast, operationCounts]);

  const handleDialogClose = useCallback((open: boolean) => {
    console.log("EditPromptDialog: handleDialogClose called with open:", open);
    if (!open && !isLoading) {
      console.log("EditPromptDialog: Closing dialog and resetting state");
      // Reset form and states
      form.reset();
      setSelectedParameters([]);
      setSelectedParameterIds([]);
      setPrompt(null);
      setParametersLoaded(false);
      setLoadAttempted(false);
      setInternalOpen(false);
      // Reset operation counters
      setOperationCounts({
        created: 0,
        updated: 0,
        deleted: 0
      });
      onOpenChange(false);
    } else {
      setInternalOpen(open);
      if (open !== internalOpen) {
        onOpenChange(open);
      }
    }
  }, [form, isLoading, onOpenChange, internalOpen]);

  console.log("EditPromptDialog: Rendering with states:", { 
    internalOpen, 
    isLoadingData, 
    parametersLoaded,
    selectedParameters: selectedParameters.length
  });

  return (
    <Dialog 
      open={internalOpen} 
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
            onCancel={() => handleDialogClose(false)}
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
