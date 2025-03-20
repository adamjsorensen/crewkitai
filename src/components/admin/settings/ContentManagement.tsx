
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, Upload, FileText, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define types
type Document = {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  tags: string[];
  created_at: string;
  status: "active" | "inactive";
};

// Schema for document upload form
const documentFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  tags: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("documents");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState<boolean>(false);
  const { toast } = useToast();

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
    },
  });

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Fetch all documents from the database
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_coach_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const onSubmit = async (values: DocumentFormValues) => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Process tags into an array
      const tagsArray = values.tags
        ? values.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      // Create a new document record
      const { data, error } = await supabase
        .from("ai_coach_documents")
        .insert([
          {
            title: values.title,
            description: values.description,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            tags: tagsArray,
            status: "active",
          },
        ])
        .select();

      if (error) throw error;

      const documentId = data[0].id;

      // Upload the file to storage
      const filePath = `documents/${documentId}/${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ai-coach-content")
        .upload(filePath, selectedFile);

      if (uploadError) {
        // If upload fails, delete the document record
        await supabase.from("ai_coach_documents").delete().eq("id", documentId);
        throw uploadError;
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Reset form and state
      form.reset();
      setSelectedFile(null);
      setIsDocumentDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete a document
  const handleDeleteDocument = async (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        // Get the document file name
        const document = documents.find(doc => doc.id === documentId);
        if (!document) return;

        // Delete the file from storage
        const filePath = `documents/${documentId}/${document.file_name}`;
        const { error: storageError } = await supabase.storage
          .from("ai-coach-content")
          .remove([filePath]);

        if (storageError) {
          console.error("Error deleting file:", storageError);
        }

        // Delete the document record
        const { error } = await supabase
          .from("ai_coach_documents")
          .delete()
          .eq("id", documentId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Document deleted successfully",
        });

        fetchDocuments();
      } catch (error) {
        console.error("Error deleting document:", error);
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Content Management</h3>
          <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Document title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="pricing, marketing, crew (comma separated)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Separate tags with commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>File</FormLabel>
                    <Input
                      type="file"
                      className="cursor-pointer"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.md"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>No documents found. Upload documents to improve AI responses.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 border rounded-md hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            {doc.title}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags?.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {doc.file_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="tags">
            <div className="p-4 border rounded-md bg-muted/30">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Tag Management</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                View and manage all tags used across your content. Tags help organize documents and improve AI response relevance.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {Array.from(new Set(documents.flatMap(doc => doc.tags || []))).map((tag, index) => (
                  <Badge key={index} className="px-2 py-1">
                    {tag}
                  </Badge>
                ))}
                {documents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags available. Add documents with tags first.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContentManagement;
