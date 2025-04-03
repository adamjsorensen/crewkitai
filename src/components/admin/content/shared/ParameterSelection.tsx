
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, X } from "lucide-react";
import { ParameterWithTweaks } from "@/types/promptParameters";

export type SelectedParameter = {
  id: string;
  name: string;
  isRequired: boolean;
  order: number;
  ruleId?: string; // Existing rule ID if any
};

interface ParameterSelectionProps {
  parameters: ParameterWithTweaks[];
  selectedParameters: SelectedParameter[];
  selectedParameterIds: string[];
  onParameterSelect: (parameterId: string) => void;
  onRemoveParameter: (parameterId: string) => void;
  onRequiredChange: (parameterId: string, isRequired: boolean) => void;
}

const ParameterSelection: React.FC<ParameterSelectionProps> = ({
  parameters,
  selectedParameters,
  selectedParameterIds,
  onParameterSelect,
  onRemoveParameter,
  onRequiredChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">Parameters</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {selectedParameters.length > 0 
            ? "Manage parameters that users can customize for this prompt" 
            : "Select parameters that users can customize for this prompt"}
        </p>
        
        <Select onValueChange={onParameterSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Add parameter" />
          </SelectTrigger>
          <SelectContent>
            {parameters
              .filter(param => param.active && !selectedParameterIds.includes(param.id))
              .map(param => (
                <SelectItem key={param.id} value={param.id}>
                  {param.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected parameters display with ScrollArea for scrollability */}
      {selectedParameters.length > 0 && (
        <div className="border rounded-md p-3">
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-4">
              {selectedParameters.map((param, index) => (
                <div key={param.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md">
                  <div className="flex-none text-muted-foreground">
                    <GripVertical size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{param.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Checkbox 
                        id={`required-${param.id}`}
                        checked={param.isRequired}
                        onCheckedChange={(checked) => 
                          onRequiredChange(param.id, !!checked)
                        }
                      />
                      <label htmlFor={`required-${param.id}`} className="text-xs">
                        Required
                      </label>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => onRemoveParameter(param.id)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ParameterSelection;
