
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

// Define the hub area options
export const hubAreas = [
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "client_communications", label: "Client Communications" },
  { value: "general", label: "General" },
];

// Common form values interface
export interface PromptFormValues {
  title: string;
  description: string;
  hubArea: string;
  prompt: string;
}

interface PromptFormFieldsProps {
  form: UseFormReturn<PromptFormValues>;
  isCategory: boolean;
  showPromptField?: boolean;
}

const PromptFormFields: React.FC<PromptFormFieldsProps> = ({ 
  form, 
  isCategory,
  showPromptField = true
}) => {
  return (
    <>
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
            {isCategory && (
              <FormDescription>
                Optional: Assign this category to a specific hub
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {showPromptField && !isCategory && (
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the base prompt content"
                  className="min-h-[200px] font-mono text-sm overflow-x-auto max-w-full"
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
      )}
    </>
  );
};

export default PromptFormFields;
