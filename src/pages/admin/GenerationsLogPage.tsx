
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Generation {
  id: string;
  generated_content: string;
  created_at: string;
  created_by: string;
  custom_prompt_id: string;
  user?: {
    email: string;
  };
  base_prompt?: {
    title: string;
  };
}

const ITEMS_PER_PAGE = 10;

const GenerationsLogPage = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["generations", page, searchTerm],
    queryFn: async () => {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      
      // Build the query
      let query = supabase
        .from('prompt_generations')
        .select(`
          *,
          user:created_by(email),
          custom_prompt:custom_prompt_id(
            base_prompt:base_prompt_id(title)
          )
        `)
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });
      
      // Add search filter if provided
      if (searchTerm) {
        query = query.textSearch('generated_content', searchTerm);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: Generation[] = data.map((item: any) => ({
        id: item.id,
        generated_content: item.generated_content,
        created_at: item.created_at,
        created_by: item.created_by,
        custom_prompt_id: item.custom_prompt_id,
        user: item.user,
        base_prompt: item.custom_prompt?.base_prompt
      }));
      
      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from('prompt_generations')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        generations: transformedData,
        totalCount: totalCount || 0
      };
    }
  });

  const totalPages = data ? Math.ceil(data.totalCount / ITEMS_PER_PAGE) : 0;

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setPage(1);
  };

  return (
    <AdminLayout activeTab="generations">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Content Generations</h2>
          <p className="text-muted-foreground">
            View all AI-generated content created by users
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search in generated content..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={handleClearSearch}
              >
                <X size={16} />
              </Button>
            )}
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            An error occurred while loading the generations.
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.generations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No generations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.generations.map((generation) => (
                      <TableRow key={generation.id}>
                        <TableCell className="font-medium">
                          {format(new Date(generation.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{generation.user?.email || 'Unknown'}</TableCell>
                        <TableCell>{generation.base_prompt?.title || 'Unknown'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {generation.generated_content.substring(0, 100)}...
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedGeneration(generation)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Generation Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Created by</h4>
                                  <p>{generation.user?.email || 'Unknown'}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Date</h4>
                                  <p>{format(new Date(generation.created_at), 'PPpp')}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Prompt</h4>
                                  <p>{generation.base_prompt?.title || 'Unknown'}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Generated Content</h4>
                                  <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                                    {generation.generated_content}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <DialogClose asChild>
                                  <Button variant="outline">Close</Button>
                                </DialogClose>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    Page {page} of {totalPages}
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default GenerationsLogPage;
