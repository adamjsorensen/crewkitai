
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoriesManagement from './CategoriesManagement';
import TagsManagement from './TagsManagement';

const CompassSettings = () => {
  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">Compass Settings</h2>
      
      <Tabs defaultValue="categories">
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
          <TabsList className="mb-4 inline-flex w-auto min-w-max">
            <TabsTrigger value="categories" className="whitespace-nowrap min-h-[2.5rem]">Categories</TabsTrigger>
            <TabsTrigger value="tags" className="whitespace-nowrap min-h-[2.5rem]">Tags</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="categories" className="w-full overflow-x-hidden">
          <CategoriesManagement />
        </TabsContent>
        <TabsContent value="tags" className="w-full overflow-x-hidden">
          <TagsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompassSettings;
