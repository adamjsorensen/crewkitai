
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Search, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Generation {
  id: string;
  generated_content: string;
  created_at: string;
  created_by: string;
  user_name: string;
  prompt_title: string;
}

const ITEMS_PER_PAGE = 10;

const GenerationsLogPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchGenerations = async ({ page, search }: { page: number; search: string }) => {
    // Calculate start point for pagination
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // Create the base query
    let query = supabase
      .from('prompt_generations')
      .select(`
        id,
        generated_content,
        created_at,
        created_by,
        custom_prompts:custom_prompt_id (
          prompts:base_prompt_id (
            title
          )
        ),
        profiles:created_by (
          full_name
        )
      `, { count: 'exact' });

    // Add search filter if provided
    if (search) {
      query = query.or(`
        generated_content.ilike.%${search}%,
        custom_prompts.prompts.title.ilike.%${search}%,
        profiles.full_name.ilike.%${search}%
      `);
    }

    // Add pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    // Transform the data to make it easier to work with
    const formattedData = data.map((item: any) => ({
      id: item.id,
      generated_content: item.generated_content,
      created_at: item.created_at,
      created_by: item.created_by,
      user_name: item.profiles?.full_name || 'Unknown User',
      prompt_title: item.custom_prompts?.prompts?.title || 'Unknown Prompt',
    }));

    return {
      generations: formattedData,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
    };
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['generations', currentPage, searchTerm],
    queryFn: () => fetchGenerations({ page: currentPage, search: searchTerm }),
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    refetch();
  };

  const handleViewGeneration = (generation: Generation) => {
    setSelectedGeneration(generation);
    setIsDialogOpen(true);
  };

  const getContentPreview = (content: string) => {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  return (
    <AdminLayout
      title="Content Generations Log"
      description="View all AI-generated content across the platform"
    >
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Content Generations</h1>
            <p className="text-muted-foreground">
              View all AI-generated content across the platform
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search content or users..."
                className="pl-10 w-full md:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500">Error loading generations</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : data && data.generations.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.generations.map((generation) => (
                  <TableRow key={generation.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(generation.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>{generation.user_name}</TableCell>
                    <TableCell>{generation.prompt_title}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {getContentPreview(generation.generated_content)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewGeneration(generation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data.totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                    </PaginationItem>
                  )}
                  
                  {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          isActive={pageNumber === currentPage}
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {data.totalPages > 5 && currentPage < 5 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(data.totalPages)}>
                          {data.totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  {currentPage < data.totalPages && (
                    <PaginationItem>
                      <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "No generations match your search" : "No generations found"}
              </p>
              {searchTerm && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Generation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedGeneration?.prompt_title}</DialogTitle>
            <DialogDescription>
              Generated by {selectedGeneration?.user_name} on{" "}
              {selectedGeneration?.created_at &&
                format(new Date(selectedGeneration.created_at), "PPpp")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="whitespace-pre-wrap mt-4 border p-4 rounded-md bg-muted/20">
            {selectedGeneration?.generated_content}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => {
                if (selectedGeneration) {
                  navigator.clipboard.writeText(selectedGeneration.generated_content);
                  setIsDialogOpen(false);
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default GenerationsLogPage;
