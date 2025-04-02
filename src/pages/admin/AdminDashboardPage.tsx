
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";

const AdminDashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage and configure your application</p>
        </div>
        <AdminDashboard />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
