
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import CompassSettings from "@/components/compass/CompassSettings";

const CompassSettingsPage = () => {
  return (
    <AdminLayout activeTab="compass-settings">
      <CompassSettings />
    </AdminLayout>
  );
};

export default CompassSettingsPage;
