
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrewkitPrompts } from "@/hooks/useCrewkitPrompts";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
import { Badge } from "@/components/ui/badge";
import { X, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const hubAreas = [
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "client_communications", label: "Client Communications" },
  { value: "general", label: "General" },
];

type CreatePromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
  isCategory: boolean;
  hubArea?: "marketing" | "sales" | "operations" | "client_communications" | "general";
};

// For drag and drop ordering
type SelectedParameter = {
  id: string;
  name: string;
  isRequired: boolean;
  order: number;
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
    parameters: z.array(z.string()).optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      hubArea: hubArea || "",
      prompt: "",
      parameters: [],
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
        parameters: [],
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

  const handleSubmit = async (values: FormValues) => {
    try {
      // First create the prompt
      const newPrompt = await createPrompt.mutateAsync({
        title: values.title,
        description: values.description || null,
        prompt: isCategory ? null : values.prompt,
        is_category: isCategory,
        parent_id: parentId,
        hub_area: values.hubArea || null,
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
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description (optional)"
                      className="h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(!parentId || isCategory) && (
              <FormField
                control={form.control}
                name="hubArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hub Area</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hub area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isCategory && (
                          <SelectItem value="">No specific hub</SelectItem>
                        )}
                        {hubAreas.map((hub) => (
                          <SelectItem key={hub.value} value={hub.value}>
                            {hub.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isCategory
                        ? "Optional: Assign this category to a specific hub"
                        : "Choose which hub this prompt belongs to"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!isCategory && (
              <>
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the base prompt content"
                          className="min-h-[200px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This is the core text that will be used as the base prompt.
                        Parameter tweaks will be appended to this.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Parameter selection section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Parameters</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select parameters that users can customize for this prompt
                    </p>
                    
                    <Select onValueChange={handleParameterSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Add parameter" />
                      </SelectTrigger>
                      <SelectContent>
                        {parameters
                          .filter(param => param.active && !selectedParameterIds.includes(param.id))
                          .map(param => (
                            <SelectItem key={param.id} value={param.id}>
                              {param.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected parameters display */}
                  {selectedParameters.length > 0 && (
                    <div className="border rounded-md p-3">
                      <ScrollArea className="max-h-[200px]">
                        <div className="space-y-2">
                          {selectedParameters.map((param, index) => (
                            <div key={param.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md">
                              <div className="flex-none text-muted-foreground">
                                <GripVertical size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{param.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Checkbox 
                                    id={`required-${param.id}`}
                                    checked={param.isRequired}
                                    onCheckedChange={(checked) => 
                                      handleRequiredChange(param.id, !!checked)
                                    }
                                  />
                                  <label htmlFor={`required-${param.id}`} className="text-xs">
                                    Required
                                  </label>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveParameter(param.id)}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </>
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
