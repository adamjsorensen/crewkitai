
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
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPromptParameters, ParameterWithTweaks } from "@/hooks/useCrewkitPromptParameters";
import { Badge } from "@/components/ui/badge";
import { X, GripVertical, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const hubAreas = [
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "client_communications", label: "Client Communications" },
  { value: "general", label: "General" },
];

type EditPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: string | null;
};

// For drag and drop ordering
type SelectedParameter = {
  id: string;
  name: string;
  isRequired: boolean;
  order: number;
  ruleId?: string; // Existing rule ID if any
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

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
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

  const handleSubmit = async (values: FormValues) => {
    if (!prompt || !promptId) return;
    
    try {
      setIsLoading(true);
      
      // Update the prompt
      await updatePrompt.mutateAsync({
        id: promptId,
        title: values.title,
        description: values.description || null,
        prompt: prompt.is_category ? null : values.prompt,
        hub_area: values.hubArea || null,
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

              <FormField
                control={form.control}
                name="hubArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hub Area</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hub area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {prompt?.is_category && (
                          <SelectItem value="">No specific hub</SelectItem>
                        )}
                        {hubAreas.map((hub) => (
                          <SelectItem key={hub.value} value={hub.value}>
                            {hub.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {prompt && !prompt.is_category && (
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
                        Manage parameters that users can customize for this prompt
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
