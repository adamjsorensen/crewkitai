
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

const ContentPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Content Creation</h1>
            <p className="text-muted-foreground">Generate professional content for your painting business</p>
          </div>
        </div>

        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">Coming Soon</CardTitle>
            <CardDescription>
              We're working hard to bring you powerful content creation tools
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pb-8 pt-2">
            <div className="relative w-32 h-32 mb-4">
              <FileText className="w-full h-full text-muted-foreground/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">Soon!</span>
              </div>
            </div>
            <p className="text-center text-muted-foreground max-w-md">
              Content generation tools will allow you to create professional emails, proposals, 
              job ads, and more - all tailored to your painting business.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ContentPage;
