
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader, Search, Trash } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface SavedContent {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

const SavedContentPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; content: SavedContent | null }>({
    open: false,
    content: null
  });
  
  const { data: savedContent, isLoading, refetch } = useQuery({
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
    }
  });
  
  const filteredContent = savedContent?.filter(content => 
    searchQuery 
      ? content.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  ) || [];
  
  const handleContentClick = (slug: string) => {
    navigate(`/dashboard/saved-content/${slug}`);
  };
  
  const handleDeleteClick = (content: SavedContent, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ open: true, content });
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.content) return;
    
    try {
      const { error } = await supabase
        .from('saved_generations')
        .delete()
        .eq('id', deleteConfirm.content.id);
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Content deleted",
        description: "The saved content has been deleted successfully",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete content",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirm({ open: false, content: null });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Saved Content</h1>
          <p className="text-muted-foreground">
            Access and manage your saved content
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search saved content..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center p-12 border rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-xl font-semibold mb-2">No saved content found</p>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "No content matches your search query." 
                : "You haven't saved any content yet. Generate some content and save it to see it here."}
            </p>
            {searchQuery ? (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            ) : (
              <Button onClick={() => navigate("/dashboard/prompt-library")}>
                Generate Content
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredContent.map((content) => (
              <Card 
                key={content.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleContentClick(content.slug)}
              >
                <CardHeader>
                  <CardTitle>{content.title}</CardTitle>
                  <CardDescription>
                    {format(new Date(content.created_at), "MMMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-20 overflow-hidden text-sm text-muted-foreground">
                    <div className="line-clamp-3">
                      {content.content.substring(0, 200)}
                      {content.content.length > 200 ? "..." : ""}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => handleContentClick(content.slug)}
                    className="gap-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5 text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDeleteClick(content, e)}
                  >
                    <Trash className="h-4 w-4" />
                    <span>Delete</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <AlertDialog 
        open={deleteConfirm.open} 
        onOpenChange={(isOpen) => 
          setDeleteConfirm({ ...deleteConfirm, open: isOpen })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
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

export default SavedContentPage;
