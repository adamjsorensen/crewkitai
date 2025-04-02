
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AiSettingsForm from "@/components/admin/AiSettingsForm";

const AiSettingsPage = () => {
  return (
    <AdminLayout 
      title="AI Settings" 
      description="Configure AI coach behavior and responses"
    >
      <div className="w-full max-w-full overflow-hidden">
        <AiSettingsForm />
      </div>
    </AdminLayout>
  );
};

export default AiSettingsPage;
