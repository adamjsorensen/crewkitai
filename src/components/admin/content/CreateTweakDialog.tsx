
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PromptParameter, useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";

type CreateTweakDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameters: PromptParameter[];
};

const CreateTweakDialog = ({ open, onOpenChange, parameters }: CreateTweakDialogProps) => {
  const { createParameterTweak } = useCrewkitPromptParameters();

  // Define validation schema
  const formSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }),
    parameterId: z.string({ required_error: "Parameter is required" }),
    subPrompt: z.string().min(5, { message: "Sub-prompt must be at least 5 characters" }),
    order: z.coerce.number().int().min(0).default(0),
    active: z.boolean().default(true),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      parameterId: "",
      subPrompt: "",
      order: 0,
      active: true,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      await createParameterTweak.mutateAsync({
        name: values.name,
        parameter_id: values.parameterId,
        sub_prompt: values.subPrompt,
        order: values.order,
        active: values.active,
      });
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating parameter tweak:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Parameter Tweak</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tweak name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is what users will see when selecting options
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parameterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parameter</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parameter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parameters.map((parameter) => (
                        <SelectItem key={parameter.id} value={parameter.id}>
                          {parameter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The parameter this tweak belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-Prompt Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the sub-prompt text that will be added to the base prompt"
                      className="h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This text will be appended to the base prompt when this tweak is selected
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Controls the order in which tweaks are displayed (lower numbers first)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Inactive tweaks won't be shown in the prompt wizard
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Tweak</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTweakDialog;
