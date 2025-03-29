import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, ClipboardCopy, Edit, Loader, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const saveGenerationSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
});

interface GenerationData {
  id: string;
  generated_content: string;
  created_at: string;
  custom_prompt: {
    base_prompt: {
      title: string;
      description: string | null;
    } | null;
  } | null;
}

const GeneratedContentPage = () => {
  const { generationId } = useParams<{ generationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  // Form for saving generation
  const form = useForm<z.infer<typeof saveGenerationSchema>>({
    resolver: zodResolver(saveGenerationSchema),
    defaultValues: {
      title: "",
    },
  });
  
  // Fetch generation data
  const { data: generation, isLoading, error } = useQuery({
    queryKey: ['generation', generationId],
    queryFn: async () => {
      if (!generationId) {
        throw new Error("Generation ID is required");
      }
      
      const { data, error } = await supabase
        .from('prompt_generations')
        .select(`
          id,
          generated_content,
          created_at,
          custom_prompt:custom_prompt_id(
            base_prompt:base_prompt_id(
              title,
              description
            )
          )
        `)
        .eq('id', generationId)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as GenerationData;
    },
    enabled: !!generationId
  });
  
  // Update form when data is loaded
  React.useEffect(() => {
    if (generation) {
      form.setValue('title', generation.custom_prompt?.base_prompt?.title || `Generated Content ${new Date().toLocaleDateString()}`);
    }
  }, [generation, form]);
  
  // Modify content
  const modifyContent = useMutation({
    mutationFn: async (content: string) => {
      const response = await supabase.functions.invoke('crewkit-modify-content', {
        body: {
          content: generation?.generated_content || "",
          modification: content
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data.modifiedContent;
    },
    onSuccess: async (modifiedContent) => {
      // Update local state with modified content
      const { error } = await supabase
        .from('prompt_generations')
        .update({ generated_content: modifiedContent })
        .eq('id', generationId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      queryClient.invalidateQueries({ queryKey: ['generation', generationId] });
      
      toast({
        title: "Content modified",
        description: "Your content has been updated successfully",
      });
      
      setModificationPrompt("");
      setIsModifying(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to modify content",
        variant: "destructive",
      });
      setIsModifying(false);
    }
  });
  
  // Save generation to saved content
  const saveGeneration = useMutation({
    mutationFn: async (values: z.infer<typeof saveGenerationSchema>) => {
      const slug = values.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-6);
      
      const { data, error } = await supabase
        .from('saved_generations')
        .insert({
          title: values.title,
          content: generation?.generated_content || "",
          user_id: profile?.id,
          original_generation_id: generation?.id,
          slug
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Content saved",
        description: "Your content has been saved successfully",
      });
      navigate(`/dashboard/saved-content/${data.slug}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save content",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  });
  
  const handleModifyContent = () => {
    if (!modificationPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter modification instructions",
        variant: "destructive",
      });
      return;
    }
    
    setIsModifying(true);
    modifyContent.mutate(modificationPrompt);
  };
  
  const handleCopyToClipboard = () => {
    if (generation?.generated_content) {
      navigator.clipboard.writeText(generation.generated_content);
      setIsCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to clipboard",
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  
  const handleSaveContent = (values: z.infer<typeof saveGenerationSchema>) => {
    setIsSaving(true);
    saveGeneration.mutate(values);
  };
  
  const handleBackClick = () => {
    navigate('/dashboard/prompt-library');
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 mr-2" 
            onClick={() => navigate('/dashboard/prompt-library')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {generation?.custom_prompt?.base_prompt?.title || "Generated Content"}
          </h1>
          {generation?.custom_prompt?.base_prompt?.description && (
            <p className="text-muted-foreground mt-1">
              {generation.custom_prompt.base_prompt.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Generated on {generation ? new Date(generation.created_at).toLocaleString() : ''}
          </p>
        </div>
        
        <Separator />
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error || !generation ? (
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-semibold">Content not found</h2>
            <p className="text-muted-foreground mb-4">This content may have been removed or does not exist</p>
            <Button onClick={() => navigate('/dashboard/prompt-library')}>
              Return to Prompt Library
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    Your AI-generated content is ready
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                    <div className="whitespace-pre-wrap">
                      {generation.generated_content}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(generation.generated_content);
                      setIsCopied(true);
                      toast({
                        title: "Copied to clipboard",
                        description: "Content has been copied to clipboard",
                      });
                      setTimeout(() => setIsCopied(false), 2000);
                    }} 
                    className="gap-1.5"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="h-4 w-4" />
                        <span>Copy Content</span>
                      </>
                    )}
                  </Button>
                  <Button onClick={() => setIsSaveDialogOpen(true)} className="gap-1.5">
                    <Save className="h-4 w-4" />
                    <span>Save Content</span>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Modify Content</CardTitle>
                  <CardDescription>
                    Provide instructions to update the content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="E.g., 'Make it more formal' or 'Add more details about pricing'"
                    value={modificationPrompt}
                    onChange={(e) => setModificationPrompt(e.target.value)}
                    className="h-32 mb-4"
                  />
                  <Button 
                    className="w-full gap-1.5" 
                    onClick={() => {
                      if (!modificationPrompt.trim()) {
                        toast({
                          title: "Error",
                          description: "Please enter modification instructions",
                          variant: "destructive",
                        });
                        return;
                      }
                      setIsModifying(true);
                      modifyContent.mutate(modificationPrompt);
                    }}
                    disabled={isModifying || !modificationPrompt.trim()}
                  >
                    {isModifying ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Modifying...</span>
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4" />
                        <span>Apply Changes</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              {isSaveDialogOpen && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Save Content</CardTitle>
                    <CardDescription>
                      Save this content to your library
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form 
                        onSubmit={form.handleSubmit((values) => {
                          setIsSaving(true);
                          saveGeneration.mutate(values);
                        })} 
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter a title for this content" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsSaveDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isSaving}
                            className="gap-1.5"
                          >
                            {isSaving ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                <span>Save</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GeneratedContentPage;
