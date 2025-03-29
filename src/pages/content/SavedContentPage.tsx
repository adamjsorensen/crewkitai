
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  FileText,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const SavedContentPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [savedContents, setSavedContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  
  // Fetch saved content
  useEffect(() => {
    const fetchSavedContent = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('saved_generations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setSavedContents(data || []);
        
      } catch (error) {
        console.error('Error fetching saved content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your saved content',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSavedContent();
  }, [user, toast]);
  
  // Filter saved content based on search term
  const filteredContent = searchTerm
    ? savedContents.filter(
        (content) =>
          content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : savedContents;
  
  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ open: true, id });
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    
    try {
      const { error } = await supabase
        .from('saved_generations')
        .delete()
        .eq('id', deleteConfirm.id);
      
      if (error) throw error;
      
      // Update local state
      setSavedContents(savedContents.filter((content) => content.id !== deleteConfirm.id));
      
      toast({
        title: 'Deleted',
        description: 'Content has been deleted successfully',
      });
      
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the content',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Saved Content</h1>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search content..."
                className="pl-10 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Link to="/dashboard/prompt-library">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </Link>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Content Library</CardTitle>
            <CardDescription>
              Access and manage your saved content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredContent.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContent.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-muted-foreground" />
                          <span>{content.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar size={14} />
                          <span>
                            {format(new Date(content.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/dashboard/saved-content/${content.slug}`}>
                            <Button size="sm" variant="outline">
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:ml-2">Edit</span>
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(content.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:ml-2">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No content found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm
                    ? "No content matches your search terms. Try something different."
                    : "You haven't saved any content yet. Create some content to get started."}
                </p>
                <Link to="/dashboard/prompt-library">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Content
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
