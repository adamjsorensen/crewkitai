
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useSaveContent } from "@/hooks/useSaveContent";
import SavedContentHeader from "@/components/content/SavedContentHeader";
import SavedContentList from "@/components/content/SavedContentList";
import SavedContentSkeleton from "@/components/content/SavedContentSkeleton";
import DeleteContentDialog from "@/components/content/DeleteContentDialog";

const SavedContentPage = () => {
  const { getSavedContentList, deleteSavedContent } = useSaveContent();
  const [searchTerm, setSearchTerm] = useState("");
  const [contentToDelete, setContentToDelete] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['saved-content'],
    queryFn: getSavedContentList
  });
  
  // Filter saved content by search term
  const filteredContent = React.useMemo(() => {
    if (!data) return [];
    
    return data.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleDeleteContent = async (id: string) => {
    try {
      await deleteSavedContent.mutateAsync(id);
      setContentToDelete(null);
    } catch (error) {
      console.error("Error deleting content:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <SavedContentHeader 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
        {isLoading ? (
          <SavedContentSkeleton />
        ) : (
          <SavedContentList
            content={filteredContent}
            onDelete={setContentToDelete}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            searchTerm={searchTerm}
          />
        )}
        
        <DeleteContentDialog
          isOpen={!!contentToDelete}
          onOpenChange={(open) => !open && setContentToDelete(null)}
          onDelete={() => contentToDelete && handleDeleteContent(contentToDelete)}
        />
      </div>
    </DashboardLayout>
  );
};

export default SavedContentPage;
