
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrewkitPrompts } from "@/hooks/useCrewkitPrompts";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
import PromptFormFields, { PromptFormValues } from "./shared/PromptFormFields";
import ParameterSelection, { SelectedParameter } from "./shared/ParameterSelection";

// Define the hub area type to match the expected type in Prompt
type HubAreaType = 'marketing' | 'sales' | 'operations' | 'client_communications' | 'general' | null;

type CreatePromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
  isCategory: boolean;
  hubArea?: "marketing" | "sales" | "operations" | "client_communications" | "general";
};

const CreatePromptDialog = ({
  open,
  onOpenChange,
  parentId,
  isCategory,
  hubArea,
}: CreatePromptDialogProps) => {
  const { createPrompt } = useCrewkitPrompts();
  const { parameters, createParameterRule, isLoading: isLoadingParameters } = useCrewkitPromptParameters();
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>([]);
  const [selectedParameterIds, setSelectedParameterIds] = useState<string[]>([]);

  // Define validation schema based on whether we're creating a category or prompt
  const formSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    description: z.string().optional(),
    hubArea: isCategory ? z.string().optional() : z.string({ required_error: "Hub area is required" }),
    prompt: isCategory
      ? z.string().optional()
      : z.string({ required_error: "Prompt content is required" }).min(10, {
          message: "Prompt content must be at least 10 characters",
        }),
  });

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      hubArea: hubArea || "",
      prompt: "",
    },
  });

  // Reset the form and selected parameters when the dialog opens or closes
  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        description: "",
        hubArea: hubArea || "",
        prompt: "",
      });
      setSelectedParameters([]);
      setSelectedParameterIds([]);
    }
  }, [open, form, hubArea]);

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
    try {
      // Convert hubArea string to the appropriate type (or null if empty)
      const hubAreaValue: HubAreaType = values.hubArea ? values.hubArea as HubAreaType : null;
      
      // First create the prompt
      const newPrompt = await createPrompt.mutateAsync({
        title: values.title,
        description: values.description || null,
        prompt: isCategory ? null : values.prompt,
        is_category: isCategory,
        parent_id: parentId,
        hub_area: hubAreaValue,
        icon_name: null,
        display_order: 0,
        created_by: null,
        is_default: false,
      } as Prompt);
      
      // If this is not a category and we have parameters selected, create parameter rules
      if (!isCategory && newPrompt && selectedParameters.length > 0) {
        // Create parameter rules for each selected parameter
        for (const param of selectedParameters) {
          await createParameterRule.mutateAsync({
            prompt_id: newPrompt.id,
            parameter_id: param.id,
            is_active: true,
            is_required: param.isRequired,
            order: param.order,
          });
        }
      }
      
      onOpenChange(false);
      form.reset();
      setSelectedParameters([]);
    } catch (error) {
      console.error("Error creating prompt:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Create {isCategory ? "Category" : "Prompt"}
            {parentId && " (Nested)"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <PromptFormFields 
              form={form} 
              isCategory={isCategory} 
            />

            {!isCategory && (
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
              <Button type="submit">
                Create {isCategory ? "Category" : "Prompt"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePromptDialog;
