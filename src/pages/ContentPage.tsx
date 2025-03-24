
import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const ContentPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Content</h1>
        <p className="text-muted-foreground">
          This page is under construction. Content generation features will be available soon.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default ContentPage;
