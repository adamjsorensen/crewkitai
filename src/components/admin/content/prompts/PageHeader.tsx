
import React from "react";
import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
  title: string;
  description: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Separator className="my-6" />
    </div>
  );
};

export default PageHeader;
