
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AiSettingsForm from "@/components/admin/AiSettingsForm";

const AiSettingsPage = () => {
  return (
    <AdminLayout activeTab="ai-settings">
      <div className="w-full max-w-full overflow-hidden">
        <AiSettingsForm />
      </div>
    </AdminLayout>
  );
};

export default AiSettingsPage;
