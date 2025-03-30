
import React from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SavedContent {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
}

interface SavedContentListProps {
  content: SavedContent[];
  onDelete: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  searchTerm: string;
}

const SavedContentList = ({ 
  content, 
  onDelete, 
  isLoading, 
  isError, 
  refetch,
  searchTerm
}: SavedContentListProps) => {
  const navigate = useNavigate();

  const handleViewContent = (slug: string) => {
    navigate(`/dashboard/saved-content/${slug}`);
  };

  const handleEditContent = (slug: string) => {
    navigate(`/dashboard/saved-content/${slug}`);
  };

  const getContentPreview = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return null; // Loading is handled by the parent component
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">Error loading saved content</p>
          <Button variant="outline" className="mt-4" onClick={refetch}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (content.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? "No saved content matches your search" 
              : "You haven't saved any content yet"}
          </p>
          <Button onClick={() => navigate("/dashboard/content")}>
            Create New Content
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Title</TableHead>
            <TableHead className="hidden md:table-cell">Content Preview</TableHead>
            <TableHead className="hidden md:table-cell w-[150px]">Created</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {content.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {item.title}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {getContentPreview(item.content)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {format(new Date(item.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewContent(item.slug)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditContent(item.slug)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default SavedContentList;
