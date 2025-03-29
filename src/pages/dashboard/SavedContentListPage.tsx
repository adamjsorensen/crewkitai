
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileText, Loader, Search, Sparkles, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedGeneration {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  slug: string;
}

const SavedContentListPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  
  const { data: savedGenerations, isLoading, refetch } = useQuery({
    queryKey: ['saved-generations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_generations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch saved content: ${error.message}`);
      }
      
      return data as SavedGeneration[];
    },
  });
  
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from('saved_generations')
        .delete()
        .eq('id', deleteId);
      
      if (error) {
        throw new Error(`Failed to delete content: ${error.message}`);
      }
      
      toast({
        title: "Content deleted",
        description: "The saved content has been removed",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete content",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };
  
  const filteredGenerations = React.useMemo(() => {
    if (!savedGenerations || !searchQuery.trim()) {
      return savedGenerations;
    }
    
    const query = searchQuery.toLowerCase();
    return savedGenerations.filter(gen => 
      gen.title.toLowerCase().includes(query) ||
      gen.content.toLowerCase().includes(query)
    );
  }, [savedGenerations, searchQuery]);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Saved Content</h1>
          <p className="text-muted-foreground">
            Access and manage your saved content
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search saved content..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/dashboard/prompt-library')} 
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>Create New Content</span>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Saved Content</CardTitle>
            <CardDescription>
              View and manage your saved content items
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !filteredGenerations || filteredGenerations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No saved content found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? `No content matching "${searchQuery}"` : "You haven't saved any content yet"}
                </p>
                <Button 
                  onClick={() => navigate('/dashboard/prompt-library')} 
                  className="gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Create New Content</span>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date Saved</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGenerations.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell className="font-medium">{content.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(content.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(content.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/dashboard/saved-content/${content.slug}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          <AlertDialog open={deleteId === content.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setDeleteId(content.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete content</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this saved content? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SavedContentListPage;
