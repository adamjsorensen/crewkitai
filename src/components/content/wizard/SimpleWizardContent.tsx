
import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllParametersView from "./AllParametersView";
import AdditionalContextStep from "./AdditionalContextStep";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { createLogger } from "./WizardLogger";

const logger = createLogger("SimpleWizardContent");

interface SimpleWizardContentProps {
  shouldShowContent: boolean;
  showLoadingState: boolean;
  error: string | null;
  hasParameters: boolean;
  safeParameters: any[];
  activeTab: string;
  setActiveTab: (value: string) => void;
  selectedTweaks: Record<string, string>;
  handleTweakChange: (parameterId: string, tweakId: string) => void;
  additionalContext: string;
  setAdditionalContext: (value: string) => void;
  onForceRefresh?: () => void;
}

const SimpleWizardContent: React.FC<SimpleWizardContentProps> = ({
  shouldShowContent,
  showLoadingState,
  error,
  hasParameters,
  safeParameters,
  activeTab,
  setActiveTab,
  selectedTweaks,
  handleTweakChange,
  additionalContext,
  setAdditionalContext,
  onForceRefresh
}) => {
  if (!shouldShowContent) return null;

  return (
    <div className="min-h-[350px]">
      {!hasParameters && safeParameters.length === 0 && (
        <Alert className="mb-4" variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>No Customization Options</AlertTitle>
          <AlertDescription>
            This prompt doesn't have any customization parameters. You can add context in the next tab.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="customize">
        <TabsList className="w-full">
          <TabsTrigger value="customize" className="flex-1">
            Customize {hasParameters && <span className="ml-1 text-xs">({safeParameters.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="context" className="flex-1">Add Context</TabsTrigger>
        </TabsList>
        
        <TabsContentSection
          activeTab={activeTab}
          hasParameters={hasParameters}
          safeParameters={safeParameters}
          selectedTweaks={selectedTweaks}
          handleTweakChange={handleTweakChange}
          additionalContext={additionalContext}
          setAdditionalContext={setAdditionalContext}
          onForceRefresh={onForceRefresh}
        />
      </Tabs>
    </div>
  );
};

interface TabsContentSectionProps {
  activeTab: string;
  hasParameters: boolean;
  safeParameters: any[];
  selectedTweaks: Record<string, string>;
  handleTweakChange: (parameterId: string, tweakId: string) => void;
  additionalContext: string;
  setAdditionalContext: (value: string) => void;
  onForceRefresh?: () => void;
}

const TabsContentSection = React.memo(({
  activeTab,
  hasParameters,
  safeParameters,
  selectedTweaks,
  handleTweakChange,
  additionalContext,
  setAdditionalContext,
  onForceRefresh
}: TabsContentSectionProps) => {
  logger.debug(`TabsContentSection rendering with ${safeParameters.length} parameters`);
  
  return (
    <>
      <TabsContent value="customize" className="py-4 min-h-[300px]">
        {hasParameters ? (
          <AllParametersView 
            parameters={safeParameters} 
            selectedTweaks={selectedTweaks}
            onTweakChange={handleTweakChange}
            onForceRefresh={onForceRefresh}
          />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No customization options available for this prompt.</p>
            <p className="mt-2">You can add additional context in the next tab.</p>
            
            {process.env.NODE_ENV !== 'production' && onForceRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onForceRefresh} 
                className="mt-4"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Force Refresh
              </Button>
            )}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="context" className="py-4 min-h-[300px]">
        <AdditionalContextStep 
          additionalContext={additionalContext} 
          setAdditionalContext={setAdditionalContext}
        />
      </TabsContent>
    </>
  );
});

TabsContentSection.displayName = "TabsContentSection";

export default SimpleWizardContent;

// Import missing dependencies
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
