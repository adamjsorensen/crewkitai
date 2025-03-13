
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  iconColor?: string;
}

const formatValue = (value: string | number): string => {
  if (typeof value === "number") {
    // Format currency values
    if (value >= 1000 || value <= -1000) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    } else if (value % 1 !== 0) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } else {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
  }
  return value.toString();
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isLoading = false,
  iconColor = "text-primary",
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-24 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{formatValue(value)}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && !isLoading && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {Math.abs(trend.value).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
