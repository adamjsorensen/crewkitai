
import React from "react";
import FinancialLayout from "@/components/financial/FinancialLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const FinancialReports = () => {
  return (
    <FinancialLayout title="Financial Reports">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              Generate and download financial reports for your painting business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Financial reports functionality will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </FinancialLayout>
  );
};

export default FinancialReports;
