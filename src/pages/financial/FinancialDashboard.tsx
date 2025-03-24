
import React from "react";
import FinancialLayout from "@/components/financial/FinancialLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const FinancialDashboard = () => {
  return (
    <FinancialLayout title="Financial Dashboard">
      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Coming Soon</CardTitle>
          <CardDescription>
            We're working hard to bring you powerful financial insights
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-8 pt-2">
          <div className="relative w-32 h-32 mb-4">
            <BarChart3 className="w-full h-full text-muted-foreground/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">Soon!</span>
            </div>
          </div>
          <p className="text-center text-muted-foreground max-w-md">
            The Financial Clarity module will give you control over your finances
            with clear insights and forecasts tailored to your painting business.
          </p>
        </CardContent>
      </Card>
    </FinancialLayout>
  );
};

export default FinancialDashboard;
