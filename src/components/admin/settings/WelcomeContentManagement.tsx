
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit2, Trash2, MessageSquare, BookOpen, TrendingUp, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define types
type WelcomeContent = {
  id: string;
  type: string;
  category_id: string | null;
  title: string;
  description: string | null;
  content: string | null;
  icon: string | null;
  icon_color: string | null;
  position: number | null;
  created_at: string;
  updated_at: string;
};

// Schema for category form
const categoryFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  icon: z.string().min(1, { message: "Icon is required" }),
  icon_color: z.string().min(1, { message: "Icon color is required" }),
  position: z.coerce.number().int().min(0),
});

// Schema for example form
const exampleFormSchema = z.object({
  title: z.string().min(3, { message: "Example must be at least 3 characters" }),
  category_id: z.string().uuid({ message: "Category is required" }),
  position: z.coerce.number().int().min(0),
});

// Schema for pre-written response form
const responseFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  category_id: z.string().uuid().optional(),
});

// Schema for trending question form
const trendingFormSchema = z.object({
  title: z.string().min(3, { message: "Question must be at least 3 characters" }),
  position: z.coerce.number().int().min(0),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type ExampleFormValues = z.infer<typeof exampleFormSchema>;
type ResponseFormValues = z.infer<typeof responseFormSchema>;
type TrendingFormValues = z.infer<typeof trendingFormSchema>;

const WelcomeContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("categories");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<WelcomeContent[]>([]);
  const [examples, setExamples] = useState<WelcomeContent[]>([]);
  const [responses, setResponses] = useState<WelcomeContent[]>([]);
  const [trendingQuestions, setTrendingQuestions] = useState<WelcomeContent[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState<boolean>(false);
  const [isExampleDialogOpen, setIsExampleDialogOpen] = useState<boolean>(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState<boolean>(false);
  const [isTrendingDialogOpen, setIsTrendingDialogOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<WelcomeContent | null>(null);
  const { toast } = useToast();

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "PaintBucket",
      icon_color: "blue-500",
      position: 0,
    },
  });

  const exampleForm = useForm<ExampleFormValues>({
    resolver: zodResolver(exampleFormSchema),
    defaultValues: {
      title: "",
      category_id: "",
      position: 0,
    },
  });

  const responseForm = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category_id: undefined,
    },
  });

  const trendingForm = useForm<TrendingFormValues>({
    resolver: zodResolver(trendingFormSchema),
    defaultValues: {
      title: "",
      position: 0,
    },
  });

  // Fetch all content on component mount
  useEffect(() => {
    fetchContent();
  }, []);

  // Fetch all content from the database
  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_coach_welcome_content")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;

      const categoriesData = data.filter(item => item.type === 'category');
      const examplesData = data.filter(item => item.type === 'example');
      const responsesData = data.filter(item => item.type === 'response');
      const trendingData = data.filter(item => item.type === 'trending');

      setCategories(categoriesData);
      setExamples(examplesData);
      setResponses(responsesData);
      setTrendingQuestions(trendingData);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open dialog for editing
  const handleEdit = (item: WelcomeContent) => {
    setEditingItem(item);
    
    if (item.type === 'category') {
      categoryForm.reset({
        title: item.title,
        description: item.description || "",
        icon: item.icon || "PaintBucket",
        icon_color: item.icon_color || "blue-500",
        position: item.position || 0,
      });
      setIsCategoryDialogOpen(true);
    } else if (item.type === 'example') {
      exampleForm.reset({
        title: item.title,
        category_id: item.category_id || "",
        position: item.position || 0,
      });
      setIsExampleDialogOpen(true);
    } else if (item.type === 'response') {
      responseForm.reset({
        title: item.title,
        content: item.content || "",
        category_id: item.category_id || undefined,
      });
      setIsResponseDialogOpen(true);
    } else if (item.type === 'trending') {
      trendingForm.reset({
        title: item.title,
        position: item.position || 0,
      });
      setIsTrendingDialogOpen(true);
    }
  };

  // Handle deleting an item
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        const { error } = await supabase
          .from("ai_coach_welcome_content")
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Item deleted successfully",
        });

        fetchContent();
      } catch (error) {
        console.error("Error deleting item:", error);
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        });
      }
    }
  };

  // Handle category form submission
  const onCategorySubmit = async (values: CategoryFormValues) => {
    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from("ai_coach_welcome_content")
          .update({
            title: values.title,
            description: values.description,
            icon: values.icon,
            icon_color: values.icon_color,
            position: values.position,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);
      } else {
        result = await supabase
          .from("ai_coach_welcome_content")
          .insert({
            type: 'category',
            title: values.title,
            description: values.description,
            icon: values.icon,
            icon_color: values.icon_color,
            position: values.position,
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: editingItem ? "Category updated successfully" : "Category created successfully",
      });

      categoryForm.reset();
      setIsCategoryDialogOpen(false);
      setEditingItem(null);
      fetchContent();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };

  // Handle example form submission
  const onExampleSubmit = async (values: ExampleFormValues) => {
    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from("ai_coach_welcome_content")
          .update({
            title: values.title,
            category_id: values.category_id,
            position: values.position,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);
      } else {
        result = await supabase
          .from("ai_coach_welcome_content")
          .insert({
            type: 'example',
            title: values.title,
            category_id: values.category_id,
            position: values.position,
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: editingItem ? "Example updated successfully" : "Example created successfully",
      });

      exampleForm.reset();
      setIsExampleDialogOpen(false);
      setEditingItem(null);
      fetchContent();
    } catch (error) {
      console.error("Error saving example:", error);
      toast({
        title: "Error",
        description: "Failed to save example",
        variant: "destructive",
      });
    }
  };

  // Handle response form submission
  const onResponseSubmit = async (values: ResponseFormValues) => {
    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from("ai_coach_welcome_content")
          .update({
            title: values.title,
            content: values.content,
            category_id: values.category_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);
      } else {
        result = await supabase
          .from("ai_coach_welcome_content")
          .insert({
            type: 'response',
            title: values.title,
            content: values.content,
            category_id: values.category_id,
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: editingItem ? "Response updated successfully" : "Response created successfully",
      });

      responseForm.reset();
      setIsResponseDialogOpen(false);
      setEditingItem(null);
      fetchContent();
    } catch (error) {
      console.error("Error saving response:", error);
      toast({
        title: "Error",
        description: "Failed to save response",
        variant: "destructive",
      });
    }
  };

  // Handle trending question form submission
  const onTrendingSubmit = async (values: TrendingFormValues) => {
    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from("ai_coach_welcome_content")
          .update({
            title: values.title,
            position: values.position,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);
      } else {
        result = await supabase
          .from("ai_coach_welcome_content")
          .insert({
            type: 'trending',
            title: values.title,
            position: values.position,
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: editingItem ? "Trending question updated successfully" : "Trending question created successfully",
      });

      trendingForm.reset();
      setIsTrendingDialogOpen(false);
      setEditingItem(null);
      fetchContent();
    } catch (error) {
      console.error("Error saving trending question:", error);
      toast({
        title: "Error",
        description: "Failed to save trending question",
        variant: "destructive",
      });
    }
  };

  // Available icons for categories
  const availableIcons = [
    "PaintBucket",
    "TrendingUp",
    "Users",
    "MessageSquare",
    "BarChart",
    "Calendar",
    "DollarSign",
    "Briefcase",
    "Tool",
    "Truck",
  ];

  // Available colors for category icons
  const availableColors = [
    "blue-500",
    "green-500",
    "red-500",
    "yellow-500",
    "purple-500",
    "pink-500",
    "indigo-500",
    "orange-500",
    "teal-500",
    "cyan-500",
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Welcome Screen Content</h3>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="responses">Pre-written Responses</TabsTrigger>
          <TabsTrigger value="trending">Trending Questions</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Manage categories displayed on the AI Coach welcome screen
            </p>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  categoryForm.reset({
                    title: "",
                    description: "",
                    icon: "PaintBucket",
                    icon_color: "blue-500",
                    position: categories.length,
                  });
                }}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Category" : "Add New Category"}</DialogTitle>
                </DialogHeader>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Category title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Category description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={categoryForm.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an icon" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableIcons.map((icon) => (
                                  <SelectItem key={icon} value={icon}>
                                    {icon}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={categoryForm.control}
                        name="icon_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon Color</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a color" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableColors.map((color) => (
                                  <SelectItem key={color} value={color}>
                                    {color}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={categoryForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>Order in which the category appears (0 = first)</FormDescription>
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

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              <p>No categories found. Add your first category to get started.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-3 border rounded-md flex justify-between items-start hover:bg-accent/40 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{category.title}</div>
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Icon: {category.icon} | Color: {category.icon_color} | Position: {category.position}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(category.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Manage example questions for each category
            </p>
            <Dialog open={isExampleDialogOpen} onOpenChange={setIsExampleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  exampleForm.reset({
                    title: "",
                    category_id: categories[0]?.id || "",
                    position: examples.length,
                  });
                }}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Example
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Example" : "Add New Example"}</DialogTitle>
                </DialogHeader>
                <Form {...exampleForm}>
                  <form onSubmit={exampleForm.handleSubmit(onExampleSubmit)} className="space-y-4">
                    <FormField
                      control={exampleForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Example Question</FormLabel>
                          <FormControl>
                            <Input placeholder="What should I charge for...?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={exampleForm.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={exampleForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>Order in which the example appears (0 = first)</FormDescription>
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

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : examples.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              <p>No examples found. Add your first example to get started.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {examples.map((example) => {
                  const category = categories.find(c => c.id === example.category_id);
                  return (
                    <div
                      key={example.id}
                      className="p-3 border rounded-md flex justify-between items-start hover:bg-accent/40 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{example.title}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Category: {category?.title || "Unknown"} | Position: {example.position}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(example)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(example.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Pre-written Responses Tab */}
        <TabsContent value="responses" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Manage pre-written responses for common questions
            </p>
            <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  responseForm.reset({
                    title: "",
                    content: "",
                    category_id: undefined,
                  });
                }}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Response
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Response" : "Add New Response"}</DialogTitle>
                </DialogHeader>
                <Form {...responseForm}>
                  <form onSubmit={responseForm.handleSubmit(onResponseSubmit)} className="space-y-4">
                    <FormField
                      control={responseForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title/Trigger</FormLabel>
                          <FormControl>
                            <Input placeholder="Response title or trigger question" {...field} />
                          </FormControl>
                          <FormDescription>This is what will trigger the response</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={responseForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Response Content</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Write your response here..." className="min-h-[200px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={responseForm.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category (Optional)</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Associate this response with a category (optional)</FormDescription>
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

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              <p>No pre-written responses found. Add your first response to get started.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {responses.map((response) => {
                  const category = categories.find(c => c.id === response.category_id);
                  return (
                    <div
                      key={response.id}
                      className="p-3 border rounded-md hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{response.title}</div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(response)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(response.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {category && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Category: {category.title}
                        </div>
                      )}
                      <div className="mt-2 text-sm border-l-2 border-muted pl-3 py-1">
                        {response.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Trending Questions Tab */}
        <TabsContent value="trending" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Manage trending questions that appear on the welcome screen
            </p>
            <Dialog open={isTrendingDialogOpen} onOpenChange={setIsTrendingDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  trendingForm.reset({
                    title: "",
                    position: trendingQuestions.length,
                  });
                }}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Trending Question
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Trending Question" : "Add New Trending Question"}</DialogTitle>
                </DialogHeader>
                <Form {...trendingForm}>
                  <form onSubmit={trendingForm.handleSubmit(onTrendingSubmit)} className="space-y-4">
                    <FormField
                      control={trendingForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question</FormLabel>
                          <FormControl>
                            <Input placeholder="What is the best way to...?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trendingForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>Order in which the question appears (0 = first)</FormDescription>
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

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : trendingQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              <p>No trending questions found. Add your first trending question to get started.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {trendingQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="p-3 border rounded-md flex justify-between items-start hover:bg-accent/40 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{question.title}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Position: {question.position}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(question)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(question.id)}>
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
    </div>
  );
};

export default WelcomeContentManagement;
