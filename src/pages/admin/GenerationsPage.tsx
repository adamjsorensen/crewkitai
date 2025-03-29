import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Loader, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

type Generation = {
  id: string;
  created_at: string;
  generated_content: string;
  created_by: string;
  custom_prompt_id: string;
  user: {
    email: string;
  } | null;
  custom_prompt: {
    base_prompt: {
      title: string;
    } | null;
  } | null;
};

const GenerationsPage = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedGeneration, setSelectedGeneration] = React.useState<Generation | null>(null);
  
  const { data: generations, isLoading } = useQuery({
    queryKey: ['prompt-generations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_generations')
        .select(`
          id,
          created_at,
          generated_content,
          created_by,
          custom_prompt_id,
          user:created_by(email),
          custom_prompt:custom_prompt_id(
            base_prompt:base_prompt_id(title)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching generations:', error);
        throw new Error(`Failed to fetch generations: ${error.message}`);
      }
      
      return data as unknown as Generation[];
    },
  });

  const filteredGenerations = React.useMemo(() => {
    if (!generations || !searchQuery.trim()) {
      return generations;
    }
    
    const query = searchQuery.toLowerCase();
    return generations.filter(gen => 
      gen.generated_content.toLowerCase().includes(query) ||
      (gen.custom_prompt?.base_prompt?.title || '').toLowerCase().includes(query) ||
      (gen.user?.email || '').toLowerCase().includes(query)
    );
  }, [generations, searchQuery]);

  const handleViewGeneration = (generation: Generation) => {
    setSelectedGeneration(generation);
  };

  return (
    <AdminLayout activeTab="generations">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Content Generations</h2>
          <p className="text-muted-foreground">
            View and manage AI-generated content across your organization
          </p>
        </div>
        
        <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <Card>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !generations || generations.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              No generations found
            </div>
          ) : (
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
                {generations.map((generation) => (
                  <TableRow key={generation.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(generation.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {generation.user?.email || 'Unknown user'}
                    </TableCell>
                    <TableCell>
                      {generation.custom_prompt?.base_prompt?.title || 'Custom prompt'}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate">
                        {generation.generated_content.substring(0, 100)}
                        {generation.generated_content.length > 100 ? '...' : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedGeneration(generation)}
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Dialog 
        open={!!selectedGeneration} 
        onOpenChange={(open) => !open && setSelectedGeneration(null)}
      >
        <DialogContent className="max-w-3xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Generated Content
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full pr-4">
            <div className="space-y-2 mb-4">
              <div className="text-sm text-muted-foreground">
                Generated on {selectedGeneration && new Date(selectedGeneration.created_at).toLocaleString()}
                {' '} by {selectedGeneration?.user?.email || 'Unknown user'}
              </div>
              <div className="text-sm font-medium">
                Prompt: {selectedGeneration?.custom_prompt?.base_prompt?.title || 'Custom prompt'}
              </div>
            </div>
            <div className="whitespace-pre-wrap border p-4 rounded-md bg-muted/20 h-[calc(80vh-200px)] overflow-y-auto">
              {selectedGeneration?.generated_content}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default GenerationsPage;
