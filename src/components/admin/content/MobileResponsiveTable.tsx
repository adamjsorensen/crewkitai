
import React from "react";
import { Card } from "@/components/ui/card";

interface MobileResponsiveTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const MobileResponsiveTable: React.FC<MobileResponsiveTableProps> = ({
  headers,
  children,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop view - regular table */}
      <div className="hidden md:block overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              {headers.map((header, i) => (
                <th key={i} className="text-left p-3 text-sm font-medium text-muted-foreground">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>

      {/* Mobile view - cards */}
      <div className="md:hidden space-y-4">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          
          // Extract cells from the row
          const cells = React.Children.toArray(child.props.children).filter(
            (cell) => React.isValidElement(cell)
          );
          
          return (
            <Card className="p-4">
              {cells.map((cell, i) => {
                if (!React.isValidElement(cell)) return null;
                
                return (
                  <div key={i} className="flex flex-col py-2 border-b last:border-0">
                    <div className="font-medium text-sm text-muted-foreground">{headers[i]}</div>
                    <div>{cell.props.children}</div>
                  </div>
                );
              })}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MobileResponsiveTable;
