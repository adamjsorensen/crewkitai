
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Card } from "@/components/ui/card";

const AdminDashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Card className="p-6">
          <AdminDashboard />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
