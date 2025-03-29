
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromptCardProps {
  prompt: Prompt;
  onClick: () => void;
}

const PromptCard = ({ prompt, onClick }: PromptCardProps) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <FileText className="h-4 w-4 text-muted-foreground mr-2" />
          <CardTitle className="text-base truncate">{prompt.title}</CardTitle>
        </div>
        {prompt.description && (
          <CardDescription className="line-clamp-2">
            {prompt.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-xs capitalize">
            {prompt.hub_area || 'General'}
          </Badge>
          
          <Badge variant="secondary" className="text-xs">
            Use Prompt
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptCard;
