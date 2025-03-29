
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Copy, 
  Check, 
  Save, 
  ArrowLeft, 
  Loader2, 
  FileText, 
  BookmarkIcon 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const GeneratedContentPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [modification, setModification] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModifying, setIsModifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promptInfo, setPromptInfo] = useState<any>(null);
  
  // Fetch the generated content
  useEffect(() => {
    const fetchGeneratedContent = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        // Fetch the generation
        const { data: generation, error: generationError } = await supabase
          .from('prompt_generations')
          .select(`
            id,
            generated_content,
            custom_prompt_id,
            custom_prompts (
              id,
              base_prompt_id,
              prompts (
                id,
                title,
                description
              )
            )
          `)
          .eq('id', id)
          .single();
        
        if (generationError) throw generationError;
        
        if (generation) {
          setContent(generation.generated_content);
          setOriginalContent(generation.generated_content);
          
          // Set prompt info for display
          if (generation.custom_prompts) {
            const customPrompt = generation.custom_prompts;
            const basePrompt = customPrompt.prompts;
            
            if (basePrompt) {
              setTitle(basePrompt.title);
              setPromptInfo({
                title: basePrompt.title,
                description: basePrompt.description,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching generated content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the generated content.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGeneratedContent();
  }, [id, toast]);
  
  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard',
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSaveContent = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Generate a slug from the title
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
        + '-' 
        + Date.now().toString().substring(9);
      
      // Save to database
      const { data, error } = await supabase
        .from('saved_generations')
        .insert({
          user_id: user.id,
          title: title,
          content: content,
          slug: slug,
          original_generation_id: id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Content saved successfully',
      });
      
      // Redirect to saved content page
      window.location.href = `/dashboard/saved-content/${data.slug}`;
      
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the content',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleModifyContent = async () => {
    if (!modification.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter modification instructions',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsModifying(true);
      
      const { data, error } = await supabase.functions.invoke(
        'crewkit-modify-content',
        {
          body: { 
            content: originalContent, 
            modification: modification 
          },
        }
      );
      
      if (error) throw error;
      
      setContent(data.modifiedContent);
      toast({
        title: 'Success',
        description: 'Content modified successfully',
      });
      
    } catch (error) {
      console.error('Error modifying content:', error);
      toast({
        title: 'Error',
        description: 'Failed to modify the content',
        variant: 'destructive',
      });
    } finally {
      setIsModifying(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/dashboard/prompt-library">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Library
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Generated Content</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
              disabled={isLoading || content.length === 0}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveContent}
              disabled={isLoading || isSaving || content.length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Generated Content</h2>
                </div>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <label htmlFor="title" className="block text-sm font-medium mb-1">
                        Title
                      </label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a title for this content"
                      />
                    </div>
                    
                    <label htmlFor="content" className="block text-sm font-medium mb-1">
                      Content
                    </label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                {promptInfo && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-primary" />
                        <h3 className="font-medium">Prompt Details</h3>
                      </div>
                      <p className="text-sm font-semibold">{promptInfo.title}</p>
                      {promptInfo.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {promptInfo.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookmarkIcon size={16} className="text-primary" />
                      <h3 className="font-medium">Modify Content</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Enter instructions to modify the generated content.
                    </p>
                    <Textarea
                      value={modification}
                      onChange={(e) => setModification(e.target.value)}
                      placeholder="E.g., Make it more casual and add bullet points"
                      className="min-h-[100px] mb-3"
                    />
                    <Button 
                      onClick={handleModifyContent} 
                      disabled={isModifying || !modification.trim()}
                      className="w-full"
                    >
                      {isModifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Modifying...
                        </>
                      ) : (
                        'Apply Modifications'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GeneratedContentPage;
