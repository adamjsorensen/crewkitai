
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ArrowLeft, Save, Pencil, Check, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSaveContent } from "@/hooks/useSaveContent";
import { useCrewkitContentGeneration } from "@/hooks/useCrewkitContentGeneration";
import { supabase } from "@/integrations/supabase/client";

const GeneratedContentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveGeneration } = useSaveContent();
  const { modifyContent } = useCrewkitContentGeneration();
  
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const [modification, setModification] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch the generation data
  const { isLoading, isError } = useQuery({
    queryKey: ['generation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_generations')
        .select(`
          id,
          generated_content,
          created_at,
          custom_prompts:custom_prompt_id (
            prompts:base_prompt_id (
              title
            )
          )
        `)
        .eq('id', id as string)
        .single();
      
      if (error) {
        throw error;
      }

      setContent(data.generated_content);
      setTitle(data.custom_prompts?.prompts?.title || "Generated Content");
      setSaveTitle(data.custom_prompts?.prompts?.title || "Generated Content");
      
      return data;
    },
    enabled: !!id,
  });

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Content copied successfully"
    });
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    try {
      const result = await saveGeneration({
        title: saveTitle,
        content,
        originalGenerationId: id
      });

      if (result.success) {
        toast({
          title: "Content saved",
          description: "Your content has been saved successfully"
        });
        setIsSaveDialogOpen(false);
        // Navigate to the saved content detail page
        navigate(`/dashboard/saved-content/${result.slug}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Error saving content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModifyContent = async () => {
    if (!modification.trim()) {
      toast({
        title: "Modification required",
        description: "Please enter your modification request",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsModifying(true);
      const result = await modifyContent.mutateAsync({
        content,
        modification: modification.trim()
      });
      
      setContent(result.modifiedContent);
      setModification("");
      
      toast({
        title: "Content modified",
        description: "Your content has been modified successfully"
      });
    } catch (error) {
      // Error already handled in mutation
      console.error("Modification error:", error);
    } finally {
      setIsModifying(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-1/3" />
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500 font-medium mb-4">Error loading generated content</p>
              <Button variant="outline" onClick={() => navigate('/dashboard/content')}>
                Return to Content Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/content')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          
          <div className="flex gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              onClick={handleCopyToClipboard}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Content</DialogTitle>
                  <DialogDescription>
                    Give your content a title to save it for later use
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={saveTitle} 
                    onChange={(e) => setSaveTitle(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsSaveDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveContent}
                    disabled={isSaving || !saveTitle.trim()}
                  >
                    {isSaving ? "Saving..." : "Save Content"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="whitespace-pre-wrap">
              {content}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Modify Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea 
                placeholder="Describe the changes you want to make to the content..."
                className="min-h-[120px]"
                value={modification}
                onChange={(e) => setModification(e.target.value)}
              />
              
              <div className="flex justify-end gap-2">
                {isModifying && (
                  <Button variant="outline" disabled>
                    <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
                    Modifying...
                  </Button>
                )}
                
                {!isModifying && (
                  <Button
                    onClick={handleModifyContent}
                    disabled={!modification.trim()}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Modify Content
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GeneratedContentPage;
