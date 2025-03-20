
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit2, Trash2, AlertTriangle, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Define types
type ContentFilter = {
  id: string;
  filter_type: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

// Schema for content filter form
const filterFormSchema = z.object({
  filter_type: z.string().min(1, { message: "Filter type is required" }),
  value: z.string().min(1, { message: "Value is required" }),
  description: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

const ContentFilters: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("forbidden-topics");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<ContentFilter[]>([]);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ContentFilter | null>(null);
  const { toast } = useToast();

  const filterForm = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      filter_type: "topic",
      value: "",
      description: "",
    },
  });

  // Fetch all filters on component mount
  useEffect(() => {
    fetchFilters();
  }, []);

  // Fetch all filters from the database
  const fetchFilters = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_coach_content_filters")
        .select("*")
        .order("created_at", { ascending: false });

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

  // Handle form submission
  const onFilterSubmit = async (values: FilterFormValues) => {
    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from("ai_coach_content_filters")
          .update({
            filter_type: values.filter_type,
            value: values.value,
            description: values.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);
      } else {
        result = await supabase
          .from("ai_coach_content_filters")
          .insert({
            filter_type: values.filter_type,
            value: values.value,
            description: values.description,
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: editingItem ? "Filter updated successfully" : "Filter created successfully",
      });

      filterForm.reset();
      setIsFilterDialogOpen(false);
      setEditingItem(null);
      fetchFilters();
    } catch (error) {
      console.error("Error saving filter:", error);
      toast({
        title: "Error",
        description: "Failed to save filter",
        variant: "destructive",
      });
    }
  };

  // Open dialog for editing
  const handleEdit = (filter: ContentFilter) => {
    setEditingItem(filter);
    filterForm.reset({
      filter_type: filter.filter_type,
      value: filter.value,
      description: filter.description || "",
    });
    setIsFilterDialogOpen(true);
  };

  // Handle deleting a filter
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this filter?")) {
      try {
        const { error } = await supabase
          .from("ai_coach_content_filters")
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Filter deleted successfully",
        });

        fetchFilters();
      } catch (error) {
        console.error("Error deleting filter:", error);
        toast({
          title: "Error",
          description: "Failed to delete filter",
          variant: "destructive",
        });
      }
    }
  };

  // Get filters by type
  const getFiltersByType = (type: string) => {
    return filters.filter(filter => filter.filter_type === type);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Content Filters
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage topics and keywords that should be filtered or restricted in AI responses
          </p>
        </div>
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingItem(null);
              filterForm.reset({
                filter_type: activeTab === "forbidden-topics" ? "topic" : "keyword",
                value: "",
                description: "",
              });
            }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Filter" : "Add New Filter"}</DialogTitle>
            </DialogHeader>
            <Form {...filterForm}>
              <form onSubmit={filterForm.handleSubmit(onFilterSubmit)} className="space-y-4">
                <FormField
                  control={filterForm.control}
                  name="filter_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filter Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a filter type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="topic">Forbidden Topic</SelectItem>
                          <SelectItem value="keyword">Blocked Keyword</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={filterForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter topic or keyword" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={filterForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Why is this being filtered?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingItem ? "Update" : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="forbidden-topics">Forbidden Topics</TabsTrigger>
              <TabsTrigger value="blocked-keywords">Blocked Keywords</TabsTrigger>
            </TabsList>

            <TabsContent value="forbidden-topics" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : getFiltersByType("topic").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-md">
                  <AlertTriangle className="h-10 w-10 text-amber-500 opacity-50 mx-auto mb-2" />
                  <p>No forbidden topics defined. Add topics that the AI should avoid.</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {getFiltersByType("topic").map((filter) => (
                      <div
                        key={filter.id}
                        className="p-3 border border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/10 rounded-md flex justify-between items-start hover:bg-amber-100/30 dark:hover:bg-amber-950/20 transition-colors"
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Badge variant="outline" className="bg-amber-100/50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200">
                              Topic
                            </Badge>
                            {filter.value}
                          </div>
                          {filter.description && (
                            <p className="text-sm text-muted-foreground mt-1">{filter.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(filter)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(filter.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="blocked-keywords" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : getFiltersByType("keyword").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-md">
                  <AlertTriangle className="h-10 w-10 text-red-500 opacity-50 mx-auto mb-2" />
                  <p>No blocked keywords defined. Add keywords that should be filtered out.</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {getFiltersByType("keyword").map((filter) => (
                      <div
                        key={filter.id}
                        className="p-3 border border-red-200/50 bg-red-50/30 dark:bg-red-950/10 rounded-md flex justify-between items-start hover:bg-red-100/30 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Badge variant="outline" className="bg-red-100/50 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200">
                              Keyword
                            </Badge>
                            {filter.value}
                          </div>
                          {filter.description && (
                            <p className="text-sm text-muted-foreground mt-1">{filter.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(filter)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(filter.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentFilters;
