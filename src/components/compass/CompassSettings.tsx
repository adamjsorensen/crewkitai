
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoriesManagement from './CategoriesManagement';
import TagsManagement from './TagsManagement';

const CompassSettings = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">Compass Settings</h2>
      
      <Tabs defaultValue="categories">
        <div className="overflow-x-auto hide-scrollbar">
          <TabsList className="mb-4 inline-flex w-auto min-w-max">
            <TabsTrigger value="categories" className="whitespace-nowrap">Categories</TabsTrigger>
            <TabsTrigger value="tags" className="whitespace-nowrap">Tags</TabsTrigger>
          </TabsList>
        </div>
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
