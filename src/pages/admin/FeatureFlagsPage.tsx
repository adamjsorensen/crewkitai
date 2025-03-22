import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import FeatureFlagsPanel from "@/components/admin/FeatureFlagsPanel";

const FeatureFlagsPage = () => {
  return (
    <AdminLayout activeTab="feature-flags">
      <FeatureFlagsPanel />
    </AdminLayout>
  );
};

export default FeatureFlagsPage;
