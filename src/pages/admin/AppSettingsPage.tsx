
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AppSettingsPage = () => {
  return (
    <AdminLayout 
      title="Application Settings"
      description="Configure general application settings"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Application settings will be implemented in a future release. This page serves as a placeholder.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AppSettingsPage;
