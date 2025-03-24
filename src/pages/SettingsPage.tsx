
import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const SettingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <p className="text-muted-foreground">
          This page is under construction. Settings will be available soon.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
