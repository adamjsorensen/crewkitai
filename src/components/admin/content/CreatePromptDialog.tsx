
import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrewkitPrompts, HubAreaType } from "@/hooks/useCrewkitPrompts";
import { PromptFormValues } from "./shared/PromptFormFields";
import { SelectedParameter } from "./shared/ParameterSelection";
import PromptFormContainer from "./prompts/PromptFormContainer";
import ParameterRuleManager from "./prompts/ParameterRuleManager";
import { useToast } from "@/hooks/use-toast";

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
  console.log("CreatePromptDialog render with open:", open);
  
  const { toast } = useToast();
  const { createPrompt } = useCrewkitPrompts();
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>([]);
  const [selectedParameterIds, setSelectedParameterIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(open);

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

  // Sync internal state with props to prevent uncontrolled to controlled warning
  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      console.log("CreatePromptDialog: Dialog opened, resetting form");
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

  const handleSubmit = useCallback(async (values: PromptFormValues) => {
    try {
      console.log("CreatePromptDialog handleSubmit called");
      setIsLoading(true);
      
      const hubAreaValue: HubAreaType = values.hubArea ? values.hubArea as HubAreaType : null;
      console.log("Creating prompt with values:", {
        title: values.title,
        description: values.description || null,
        is_category: isCategory,
        parent_id: parentId,
        hub_area: hubAreaValue
      });
      
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
      });
      
      console.log("Prompt created successfully:", newPrompt);
      
      toast({
        title: "Prompt created",
        description: "The prompt was created successfully."
      });
      
      handleDialogClose(false);
    } catch (error) {
      console.error("Error creating prompt:", error);
      toast({
        title: "Error creating prompt",
        description: "There was a problem creating the prompt.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [createPrompt, isCategory, parentId, toast]);

  const handleDialogClose = useCallback((newOpen: boolean) => {
    console.log("CreatePromptDialog handleDialogClose called with:", newOpen);
    if (!newOpen && !isLoading) {
      console.log("Resetting state and closing dialog");
      // Reset state and close dialog
      form.reset();
      setSelectedParameters([]);
      setSelectedParameterIds([]);
      setInternalOpen(false);
      onOpenChange(false);
    } else {
      setInternalOpen(newOpen);
      if (newOpen !== open) {
        onOpenChange(newOpen);
      }
    }
  }, [form, isLoading, onOpenChange, open]);

  return (
    <Dialog 
      open={internalOpen} 
      onOpenChange={handleDialogClose}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Create {isCategory ? "Category" : "Prompt"}
            {parentId && " (Nested)"}
          </DialogTitle>
        </DialogHeader>

        <PromptFormContainer
          form={form}
          isCategory={isCategory}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onCancel={() => handleDialogClose(false)}
        >
          {!isCategory && (
            <ParameterRuleManager
              promptId={null}
              isCategory={isCategory}
              selectedParameters={selectedParameters}
              setSelectedParameters={setSelectedParameters}
              selectedParameterIds={selectedParameterIds}
              setSelectedParameterIds={setSelectedParameterIds}
            />
          )}
        </PromptFormContainer>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(CreatePromptDialog);
