
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSaveContent } from "@/hooks/useSaveContent";
import { useCrewkitContentGeneration } from "@/hooks/useCrewkitContentGeneration";
import { supabase } from "@/integrations/supabase/client";

export function useGeneratedContent(id: string | undefined) {
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

  const { isLoading, isError } = useQuery({
    queryKey: ['generation', id],
    queryFn: async () => {
      if (!id) throw new Error("No generation ID provided");
      
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
        .eq('id', id)
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
      console.error("Modification error:", error);
    } finally {
      setIsModifying(false);
    }
  };

  return {
    content,
    title,
    modification,
    setModification,
    isLoading,
    isError,
    isModifying,
    isSaving,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    saveTitle,
    setSaveTitle,
    handleCopyToClipboard,
    handleSaveContent,
    handleModifyContent
  };
}
