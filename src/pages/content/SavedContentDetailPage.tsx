
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const SavedContentDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  // Fixed the useQuery to use onSettled instead of onSuccess
  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-content", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_generations")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Use React's useEffect for side effects
  React.useEffect(() => {
    if (data) {
      setContent(data.content);
      setTitle(data.title);
    }
  }, [data]);

  const updateContentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("saved_generations")
        .update({ content, title, updated_at: new Date().toISOString() })
        .eq("slug", slug);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-content"] });
      toast({
        title: "Content updated",
        description: "Your content has been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save content: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateContentMutation.mutate();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
          <p className="text-red-500">The requested content could not be loaded.</p>
          <button
            onClick={() => navigate("/dashboard/saved-content")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Back to Saved Content
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Content</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/dashboard/saved-content")}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-white rounded-md"
              disabled={updateContentMutation.isPending}
            >
              {updateContentMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-64"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SavedContentDetailPage;
