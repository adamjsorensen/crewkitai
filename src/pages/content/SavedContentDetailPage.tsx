
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSaveContent } from "@/hooks/useSaveContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, ArrowLeft, Copy } from "lucide-react";

const SavedContentDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getSavedContentBySlug, updateSavedContent } = useSaveContent();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);

  const { isLoading, isError } = useQuery({
    queryKey: ['saved-content', slug],
    queryFn: () => getSavedContentBySlug(slug || ""),
    enabled: !!slug,
    onSettled: (data) => {
      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setContentId(data.id);
      }
    }
  });

  const handleUpdateContent = async () => {
    if (!contentId) return;
    
    try {
      await updateSavedContent.mutateAsync({
        id: contentId,
        title,
        content
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating content:", error);
    }
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Content copied successfully"
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </>
        ) : isError ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500">Error loading content</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/dashboard/saved-content')}
              >
                Back to Saved Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/saved-content')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">
                {isEditing ? "Edit Content" : "View Content"}
              </h1>
            </div>
            
            <div className="flex justify-between items-center">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold w-full md:w-1/2"
                />
              ) : (
                <h2 className="text-xl font-semibold">{title}</h2>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                
                {isEditing ? (
                  <Button
                    onClick={handleUpdateContent}
                    disabled={updateSavedContent.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                ) : (
                  <Button onClick={toggleEditing}>
                    Edit Content
                  </Button>
                )}
              </div>
            </div>
            
            <Card>
              <CardContent className="p-6">
                {isEditing ? (
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[400px] font-mono"
                  />
                ) : (
                  <div className="whitespace-pre-wrap">
                    {content}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SavedContentDetailPage;
