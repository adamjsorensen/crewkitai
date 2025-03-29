
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryTileProps {
  category: Prompt;
  onSelect: (category: Prompt) => void;
}

const CategoryTile = ({ category, onSelect }: CategoryTileProps) => {
  // Dynamic icon based on the icon_name from the category
  const IconComponent = category.icon_name ? 
    require("lucide-react")[category.icon_name] : 
    ChevronRight;

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => onSelect(category)}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-md flex items-center justify-center",
          "bg-primary/10 text-primary"
        )}>
          {IconComponent && <IconComponent size={20} />}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{category.title}</h3>
          {category.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {category.description}
            </p>
          )}
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </CardContent>
    </Card>
  );
};

export default CategoryTile;
