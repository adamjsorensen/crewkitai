import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrewkitPrompts, HubAreaType } from "@/hooks/useCrewkitPrompts";
import { PromptFormValues } from "./shared/PromptFormFields";
import { SelectedParameter } from "./shared/ParameterSelection";
import PromptFormContainer from "./prompts/PromptFormContainer";
import ParameterRuleManager from "./prompts/ParameterRuleManager";

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
  const [selectedParameters, setSelectedParameters] = useState<SelectedParameter[]>([]);
  const [selectedParameterIds, setSelectedParameterIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (values: PromptFormValues) => {
    try {
      setIsLoading(true);
      
      const hubAreaValue: HubAreaType = values.hubArea ? values.hubArea as HubAreaType : null;
      
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
      
      onOpenChange(false);
      form.reset();
      setSelectedParameters([]);
    } catch (error) {
      console.error("Error creating prompt:", error);
    } finally {
      setIsLoading(false);
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

        <PromptFormContainer
          form={form}
          isCategory={isCategory}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        >
          <ParameterRuleManager
            promptId={null}
            isCategory={isCategory}
            selectedParameters={selectedParameters}
            setSelectedParameters={setSelectedParameters}
            selectedParameterIds={selectedParameterIds}
            setSelectedParameterIds={setSelectedParameterIds}
          />
        </PromptFormContainer>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePromptDialog;
