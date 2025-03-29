
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, FileText } from "lucide-react";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { cn } from "@/lib/utils";

interface PromptCardProps {
  prompt: Prompt;
  onSelect: (prompt: Prompt) => void;
}

const PromptCard = ({ prompt, onSelect }: PromptCardProps) => {
  const hubAreaColors: Record<string, string> = {
    marketing: "bg-green-100 text-green-800",
    sales: "bg-blue-100 text-blue-800",
    operations: "bg-purple-100 text-purple-800",
    client_communications: "bg-orange-100 text-orange-800",
    general: "bg-gray-100 text-gray-800",
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h3 className="font-medium">{prompt.title}</h3>
          </div>
          
          {prompt.is_default && (
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <BadgeCheck size={14} />
              <span>Default</span>
            </div>
          )}
        </div>
        
        {prompt.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {prompt.description}
          </p>
        )}
        
        {prompt.hub_area && (
          <div className="mt-auto">
            <span 
              className={cn(
                "inline-block text-xs px-2 py-1 rounded-full font-medium",
                hubAreaColors[prompt.hub_area] || "bg-gray-100 text-gray-800"
              )}
            >
              {prompt.hub_area.replace("_", " ")}
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => onSelect(prompt)} 
          variant="default" 
          size="sm" 
          className="w-full"
        >
          Use This Prompt
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PromptCard;
