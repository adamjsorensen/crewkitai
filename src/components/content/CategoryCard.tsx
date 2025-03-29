
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folders } from "lucide-react";
import { Prompt } from "@/hooks/useCrewkitPrompts";

interface CategoryCardProps {
  category: Prompt;
  onClick: () => void;
}

const CategoryCard = ({ category, onClick }: CategoryCardProps) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Folders className="h-4 w-4 text-muted-foreground mr-2" />
          <CardTitle className="text-base truncate">{category.title}</CardTitle>
        </div>
        {category.description && (
          <CardDescription className="line-clamp-2">
            {category.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex justify-end">
          <Badge variant="outline">
            Category
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
