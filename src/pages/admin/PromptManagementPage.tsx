
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";

const PromptManagementPage = () => {
  return (
    <AdminLayout activeTab="prompts">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Prompts Management</h2>
          <p className="text-muted-foreground">
            Manage the prompt library and categories for content generation
          </p>
        </div>
        
        <div className="flex justify-center items-center p-12 bg-muted/40 rounded-lg border border-dashed">
          <p className="text-muted-foreground text-center">
            Prompt management interface will be implemented in the next phase
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PromptManagementPage;
