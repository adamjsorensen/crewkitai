
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, ClipboardCopy, Loader, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(1, { message: "Content cannot be empty" }),
});

interface SavedContent {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

const SavedContentDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCopied, setIsCopied] = useState(false);
  
  const { data: content, isLoading } = useQuery({
    queryKey: ['saved-content', slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug is required");
      
      const { data, error } = await supabase
        .from('saved_generations')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw new Error(error.message);
      
      return data as SavedContent;
    },
    enabled: !!slug
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: ""
    }
  });
  
  // Update form when data is loaded
  React.useEffect(() => {
    if (content) {
      form.reset({
        title: content.title,
        content: content.content
      });
    }
  }, [content, form]);
  
  // Save/update content mutation
  const updateContent = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!content?.id) throw new Error("Content ID is required");
      
      const { data, error } = await supabase
        .from('saved_generations')
        .update({
          title: values.title,
          content: values.content
        })
        .eq('id', content.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-content'] });
      queryClient.invalidateQueries({ queryKey: ['saved-content', slug] });
      
      toast({
        title: "Content updated",
        description: "Your content has been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update content",
        variant: "destructive",
      });
    }
  });
  
  const handleCopyToClipboard = () => {
    if (content?.content) {
      navigator.clipboard.writeText(content.content);
      setIsCopied(true);
      
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to clipboard",
      });
      
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateContent.mutate(values);
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!content) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold">Content not found</h2>
          <p className="text-muted-foreground mb-4">This content may have been removed or does not exist</p>
          <Button onClick={() => navigate('/dashboard/saved-content')}>
            View All Saved Content
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 mr-2" 
            onClick={() => navigate('/dashboard/saved-content')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Saved Content</span>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Edit Saved Content</CardTitle>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[400px] font-sans text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyToClipboard}
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
                
                <Button 
                  type="submit" 
                  disabled={updateContent.isPending || !form.formState.isDirty}
                  className="gap-1.5"
                >
                  {updateContent.isPending ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SavedContentDetailPage;
