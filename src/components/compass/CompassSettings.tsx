
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoriesManagement from './CategoriesManagement';
import TagsManagement from './TagsManagement';

const CompassSettings = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Compass Settings</h2>
      
      <Tabs defaultValue="categories">
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <CategoriesManagement />
        </TabsContent>
        <TabsContent value="tags">
          <TagsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompassSettings;
