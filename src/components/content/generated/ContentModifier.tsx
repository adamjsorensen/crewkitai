
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentModifierProps {
  modification: string;
  setModification: (value: string) => void;
  isModifying: boolean;
  handleModifyContent: () => Promise<void>;
}

const ContentModifier: React.FC<ContentModifierProps> = ({
  modification,
  setModification,
  isModifying,
  handleModifyContent
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modify Content</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea 
            placeholder="Describe the changes you want to make to the content..."
            className="min-h-[120px]"
            value={modification}
            onChange={(e) => setModification(e.target.value)}
          />
          
          <div className="flex justify-end gap-2">
            {isModifying && (
              <Button variant="outline" disabled>
                <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
                Modifying...
              </Button>
            )}
            
            {!isModifying && (
              <Button
                onClick={handleModifyContent}
                disabled={!modification.trim()}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modify Content
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentModifier;
