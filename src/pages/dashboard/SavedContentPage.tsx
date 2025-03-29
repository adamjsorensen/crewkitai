
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ClipboardCopy, Edit, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SavedContentPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCopied, setIsCopied] = React.useState(false);
  
  const { data: content, isLoading } = useQuery({
    queryKey: ['saved-content', slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error("Slug is required");
      }
      
      const { data, error } = await supabase
        .from('saved_generations')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !!slug
  });
  
  const handleBackClick = () => {
    navigate('/dashboard/saved-content');
  };
  
  const handleEditClick = () => {
    // Future: Implement content editing
    toast({
      title: "Coming Soon",
      description: "Content editing will be available in a future update",
    });
  };
  
  const handleCopyToClipboard = () => {
    if (content?.content) {
      navigator.clipboard.writeText(content.content);
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
            View Saved Content
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
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Saved Content</span>
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{content.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Saved on {new Date(content.created_at).toLocaleString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyToClipboard} className="gap-1.5">
            <ClipboardCopy className="h-4 w-4" />
            <span>{isCopied ? "Copied" : "Copy"}</span>
          </Button>
          <Button variant="outline" onClick={handleEditClick} className="gap-1.5">
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              <div className="whitespace-pre-wrap">
                {content.content}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SavedContentPage;
