
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import FeatureFlagsPanel from "@/components/admin/FeatureFlagsPanel";

const FeatureFlagsPage = () => {
  return (
    <AdminLayout 
      title="Feature Flags"
      description="Toggle application features"
    >
      <FeatureFlagsPanel />
    </AdminLayout>
  );
};

export default FeatureFlagsPage;
