
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Copy, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSaveContent } from "@/hooks/useSaveContent";
import { Skeleton } from "@/components/ui/skeleton";

const GeneratedContentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveGeneration } = useSaveContent();
  const [generation, setGeneration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [modifying, setModifying] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const fetchGeneration = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('prompt_generations')
          .select(`
            id,
            generated_content,
            created_at,
            custom_prompt_id,
            custom_prompts:custom_prompt_id (
              id,
              base_prompt_id,
              prompts:base_prompt_id (
                id,
                title,
                description
              )
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setGeneration(data);
        setContent(data.generated_content);
      } catch (error: any) {
        console.error('Error fetching generation:', error);
        toast({
          title: "Error fetching content",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchGeneration();
  }, [id, toast]);

  const handleModifyContent = async () => {
    if (!modificationPrompt.trim()) {
      toast({
        title: "Modification instructions required",
        description: "Please enter instructions for the modification",
        variant: "destructive"
      });
      return;
    }

    try {
      setModifying(true);
      
      // Call the crewkit-modify-content edge function
      const { data, error } = await supabase.functions.invoke('crewkit-modify-content', {
        body: { 
          content: content,
          modification: modificationPrompt
        }
      });
      
      if (error) throw error;
      
      if (data?.modifiedContent) {
        setContent(data.modifiedContent);
        setModificationPrompt("");
        toast({
          title: "Content modified",
          description: "The content has been updated successfully"
        });
      }
    } catch (error: any) {
      console.error('Error modifying content:', error);
      toast({
        title: "Error modifying content",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setModifying(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Content copied successfully"
    });
  };

  const handleSaveContent = async () => {
    if (!generation) return;
    
    try {
      setSaveLoading(true);
      const title = generation.custom_prompts?.prompts?.title || "Generated Content";
      
      const { success, error, slug } = await saveGeneration({
        title,
        content,
        originalGenerationId: generation.id
      });
      
      if (error) throw error;
      
      toast({
        title: "Content saved",
        description: "Your content has been saved successfully"
      });
      
      // Navigate to the saved content page
      if (slug) {
        navigate(`/dashboard/saved-content/${slug}`);
      } else {
        navigate('/dashboard/saved-content');
      }
    } catch (error: any) {
      console.error('Error saving content:', error);
      toast({
        title: "Error saving content",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {loading ? (
          <>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">
                  {generation?.custom_prompts?.prompts?.title || "Generated Content"}
                </h1>
                <p className="text-muted-foreground">
                  {generation?.custom_prompts?.prompts?.description || "AI-generated content for your painting business"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveContent}
                  disabled={saveLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6 whitespace-pre-wrap">
                {content}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Modify Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter instructions to modify the content, e.g., 'Make it more professional' or 'Add a section about winter painting tips'"
                  className="min-h-32"
                  value={modificationPrompt}
                  onChange={(e) => setModificationPrompt(e.target.value)}
                  disabled={modifying}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleModifyContent}
                  disabled={modifying || !modificationPrompt.trim()}
                >
                  {modifying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Modifying...
                    </>
                  ) : (
                    "Modify Content"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GeneratedContentPage;
