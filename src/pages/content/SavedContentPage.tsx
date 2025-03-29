
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
import { FileText, Edit, Trash2, Plus } from "lucide-react";
import { useSaveContent } from "@/hooks/useSaveContent";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface SavedContent {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  updated_at: string | null;
}

const SavedContentPage = () => {
  const { getSavedContentList, deleteSavedContent } = useSaveContent();
  const [contentToDelete, setContentToDelete] = useState<string | null>(null);

  const { data: savedContent, isLoading, isError } = useQuery({
    queryKey: ['saved-content'],
    queryFn: getSavedContentList
  });

  const handleDeleteContent = async () => {
    if (contentToDelete) {
      await deleteSavedContent.mutateAsync(contentToDelete);
      setContentToDelete(null);
    }
  };

  const getContentPreview = (content: string) => {
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Saved Content</h1>
            <p className="text-muted-foreground">
              Access and manage your saved content
            </p>
          </div>
          <Link to="/dashboard/content">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Content
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500">Error loading saved content</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : savedContent && savedContent.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedContent.map((item: SavedContent) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {getContentPreview(item.content)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.updated_at || item.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Link to={`/dashboard/saved-content/${item.slug}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setContentToDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            your saved content.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setContentToDelete(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteContent}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-4">
                You don't have any saved content yet.
              </p>
              <Link to="/dashboard/content">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Content
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SavedContentPage;
