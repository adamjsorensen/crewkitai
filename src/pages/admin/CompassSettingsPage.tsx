
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import CompassSettings from "@/components/compass/CompassSettings";

const CompassSettingsPage = () => {
  return (
    <AdminLayout 
      title="Compass Settings"
      description="Configure task management system"
    >
      <CompassSettings />
    </AdminLayout>
  );
};

export default CompassSettingsPage;
