
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus, Trash, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type ContentFilter = {
  id: string;
  filter_type: string;
  value: string;
  description: string | null;
};

const ContentFilters = () => {
  const [filters, setFilters] = useState<ContentFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newFilterType, setNewFilterType] = useState("keyword");
  const [newFilterValue, setNewFilterValue] = useState("");
  const [newFilterDescription, setNewFilterDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    fetchFilters();
  }, []);
  
  const fetchFilters = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_coach_content_filters")
        .select("*")
        .order("filter_type", { ascending: true });
        
      if (error) throw error;
      setFilters(data || []);
    } catch (error) {
      console.error("Error fetching filters:", error);
      toast({
        title: "Error",
        description: "Failed to load content filters",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddFilter = async () => {
    if (!newFilterValue.trim()) {
      toast({
        title: "Error",
        description: "Filter value cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from("ai_coach_content_filters")
        .insert({
          filter_type: newFilterType,
          value: newFilterValue.trim(),
          description: newFilterDescription.trim() || null,
        })
        .select();
        
      if (error) throw error;
      
      setFilters([...(data || []), ...filters]);
      setNewFilterType("keyword");
      setNewFilterValue("");
      setNewFilterDescription("");
      setDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Content filter added successfully",
      });
    } catch (error) {
      console.error("Error adding filter:", error);
      toast({
        title: "Error",
        description: "Failed to add content filter",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleDeleteFilter = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("ai_coach_content_filters")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      setFilters(filters.filter(filter => filter.id !== id));
      toast({
        title: "Success",
        description: "Content filter deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting filter:", error);
      toast({
        title: "Error",
        description: "Failed to delete content filter",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <h3 className="text-lg font-medium">Content Filters</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size={isMobile ? "sm" : "default"} className="h-8 sm:h-10">
              <Plus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Add Filter</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Content Filter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter Type</label>
                <Select value={newFilterType} onValueChange={setNewFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="phrase">Phrase</SelectItem>
                    <SelectItem value="regex">Regex Pattern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Value</label>
                <Input 
                  value={newFilterValue} 
                  onChange={(e) => setNewFilterValue(e.target.value)}
                  placeholder="Enter filter value"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input 
                  value={newFilterDescription} 
                  onChange={(e) => setNewFilterDescription(e.target.value)}
                  placeholder="Enter filter description"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddFilter} disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Filter</span>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filters.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No content filters found. Add a filter to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Value</TableHead>
                  {!isMobile && <TableHead>Description</TableHead>}
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filters.map((filter) => (
                  <TableRow key={filter.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {filter.filter_type}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-mono">
                      {filter.value}
                    </TableCell>
                    {!isMobile && (
                      <TableCell className="text-xs sm:text-sm text-muted-foreground">
                        {filter.description || <em>No description</em>}
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFilter(filter.id)}
                        disabled={isDeleting}
                        className="h-7 w-7 p-0"
                      >
                        <Trash className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentFilters;
