
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";

const ParametersManagementPage = () => {
  return (
    <AdminLayout activeTab="parameters">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Parameters Management</h2>
          <p className="text-muted-foreground">
            Configure parameters and tweaks for content generation
          </p>
        </div>
        
        <div className="flex justify-center items-center p-12 bg-muted/40 rounded-lg border border-dashed">
          <p className="text-muted-foreground text-center">
            Parameters management interface will be implemented in the next phase
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ParametersManagementPage;
