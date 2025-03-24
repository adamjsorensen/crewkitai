
import React from "react";
import FinancialLayout from "@/components/financial/FinancialLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

const FinancialReports = () => {
  return (
    <FinancialLayout title="Financial Reports">
      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Coming Soon</CardTitle>
          <CardDescription>
            We're working hard to bring you comprehensive financial reports
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
            Financial reports will provide you with in-depth analysis of your painting
            business finances, helping you make informed decisions.
          </p>
        </CardContent>
      </Card>
    </FinancialLayout>
  );
};

export default FinancialReports;
