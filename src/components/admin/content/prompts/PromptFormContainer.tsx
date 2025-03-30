
import React, { useCallback } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import PromptFormFields, { PromptFormValues } from "../shared/PromptFormFields";
import { Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface PromptFormContainerProps {
  form: UseFormReturn<PromptFormValues>;
  isCategory: boolean;
  isLoading: boolean;
  onSubmit: (values: PromptFormValues) => Promise<void>;
  onCancel: () => void;
  children?: React.ReactNode;
}

const PromptFormContainer: React.FC<PromptFormContainerProps> = ({
  form,
  isCategory,
  isLoading,
  onSubmit,
  onCancel,
  children
}) => {
  // Use useCallback to prevent recreating this function on every render
  const handleFormSubmit = useCallback(async (values: PromptFormValues) => {
    console.log("Form submission started with values:", values);
    try {
      await onSubmit(values);
      console.log("Form submission completed successfully");
    } catch (error) {
      console.error("Error during form submission:", error);
      // Form error handling is done in the parent component
    }
  }, [onSubmit]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  }, [onCancel]);

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleFormSubmit)} 
        className="space-y-4"
      >
        <PromptFormFields 
          form={form} 
          isCategory={isCategory} 
        />

        {children}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
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
  );
};

export default React.memo(PromptFormContainer);
