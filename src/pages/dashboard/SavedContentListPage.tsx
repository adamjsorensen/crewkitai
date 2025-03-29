
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, FileText, Loader, Plus, Search, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface SavedContent {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

const SavedContentListPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; content: SavedContent | null }>({
    open: false,
    content: null,
  });
  
  const { data: savedContent, isLoading } = useQuery({
    queryKey: ['saved-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_generations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as SavedContent[];
    },
  });
  
  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_generations')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-content'] });
      toast({
        title: "Content deleted",
        description: "The content has been deleted successfully",
      });
      setDeleteConfirm({ open: false, content: null });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete content",
        variant: "destructive",
      });
    },
  });
  
  const filteredContent = React.useMemo(() => {
    if (!savedContent || !searchQuery.trim()) {
      return savedContent;
    }
    
    const query = searchQuery.toLowerCase();
    return savedContent.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query)
    );
  }, [savedContent, searchQuery]);
  
  const handleViewContent = (slug: string) => {
    navigate(`/dashboard/saved-content/${slug}`);
  };
  
  const handleDeleteClick = (content: SavedContent) => {
    setDeleteConfirm({ open: true, content });
  };
  
  const handleConfirmDelete = () => {
    if (deleteConfirm.content) {
      deleteContent.mutate(deleteConfirm.content.id);
    }
  };
  
  const handleCreateNew = () => {
    navigate('/dashboard/prompt-library');
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Saved Content</h1>
          <p className="text-muted-foreground">
            View and manage your saved content
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search content..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button onClick={handleCreateNew} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Create New</span>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !filteredContent || filteredContent.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-3">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No content found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery ? `No content matches "${searchQuery}"` : "You haven't saved any content yet"}
                </p>
                {searchQuery ? (
                  <Button 
                    variant="link" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                ) : (
                  <Button onClick={handleCreateNew} className="mt-2 gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span>Create New Content</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((content) => (
              <Card key={content.id} className="flex flex-col h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1">{content.title}</CardTitle>
                  <CardDescription>
                    Saved on {new Date(content.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="line-clamp-5 text-sm">
                    {content.content}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(content)}
                    className="gap-1.5 text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                    <span>Delete</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleViewContent(content.slug)}
                    className="gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteConfirm.content?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default SavedContentListPage;
