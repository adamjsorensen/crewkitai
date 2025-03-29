
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft, 
  Save, 
  Trash2, 
  Copy, 
  Check, 
  Loader2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SavedContentDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Fetch saved content
  useEffect(() => {
    const fetchContent = async () => {
      if (!slug || !user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('saved_generations')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setContent(data);
          setTitle(data.title);
          setBody(data.content);
        }
        
      } catch (error) {
        console.error('Error fetching content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the content',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, [slug, user, toast]);
  
  const handleSave = async () => {
    if (!content || !user) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('saved_generations')
        .update({
          title: title,
          content: body,
        })
        .eq('id', content.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Content updated successfully',
      });
      
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the content',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!content) return;
    
    try {
      const { error } = await supabase
        .from('saved_generations')
        .delete()
        .eq('id', content.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Content deleted successfully',
      });
      
      navigate('/dashboard/saved-content');
      
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the content',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard',
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/dashboard/saved-content">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Edit Saved Content</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={isLoading || !body}
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
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteConfirm(true)}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isLoading || isSaving}
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
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mb-4"
                />
                
                <label htmlFor="content" className="block text-sm font-medium mb-1">
                  Content
                </label>
                <Textarea
                  id="content"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export default SavedContentDetailPage;
