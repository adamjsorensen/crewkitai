
import React from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ContentHeader from "@/components/content/generated/ContentHeader";
import ContentDisplay from "@/components/content/generated/ContentDisplay";
import ContentModifier from "@/components/content/generated/ContentModifier";
import LoadingState from "@/components/content/generated/LoadingState";
import ErrorState from "@/components/content/generated/ErrorState";
import { useGeneratedContent } from "@/hooks/useGeneratedContent";

const GeneratedContentPage = () => {
  const { id } = useParams<{ id: string }>();
  const {
    content,
    title,
    modification,
    setModification,
    isLoading,
    isError,
    isModifying,
    isSaving,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    saveTitle,
    setSaveTitle,
    handleCopyToClipboard,
    handleSaveContent,
    handleModifyContent
  } = useGeneratedContent(id);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <ContentHeader
          title={title}
          saveTitle={saveTitle}
          setSaveTitle={setSaveTitle}
          isSaving={isSaving}
          isSaveDialogOpen={isSaveDialogOpen}
          setIsSaveDialogOpen={setIsSaveDialogOpen}
          handleCopyToClipboard={handleCopyToClipboard}
          handleSaveContent={handleSaveContent}
        />
        
        <ContentDisplay content={content} />
        
        <ContentModifier
          modification={modification}
          setModification={setModification}
          isModifying={isModifying}
          handleModifyContent={handleModifyContent}
        />
      </div>
    </DashboardLayout>
  );
};

export default GeneratedContentPage;
