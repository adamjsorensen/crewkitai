
import React from "react";
import { BrainCircuit, DollarSign, Users, Briefcase, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelectPrompt }) => {
  const prompts = [
    {
      icon: DollarSign,
      text: "How should I price my painting services?",
      color: "text-green-500" 
    },
    {
      icon: Users,
      text: "Tips for hiring and managing painting crews",
      color: "text-blue-500"
    },
    {
      icon: Briefcase,
      text: "How to get more painting clients",
      color: "text-purple-500"
    },
    {
      icon: Palette,
      text: "Best practices for interior paint jobs",
      color: "text-amber-500"
    },
    {
      icon: BrainCircuit,
      text: "How to grow my painting business",
      color: "text-pink-500"
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Try asking about:
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto py-3 px-4 justify-start gap-2 transition-all hover:shadow-md"
            onClick={() => onSelectPrompt(prompt.text)}
          >
            <prompt.icon className={`h-5 w-5 ${prompt.color}`} />
            <span className="text-sm text-left">{prompt.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPrompts;
