
import React from 'react';
import { AlertCircle, Code, Info, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface DebugModePanelProps {
  isEnabled: boolean;
  error: string | null;
  networkStatus: 'online' | 'offline';
  isLoading: boolean;
  isGenerating: boolean;
  promptId?: string;
  parametersCount: number;
  selectedTweaksCount: number;
  onForceRefresh?: () => void;
  onRetry?: () => void;
}

const DebugModePanel: React.FC<DebugModePanelProps> = ({
  isEnabled,
  error,
  networkStatus,
  isLoading,
  isGenerating,
  promptId,
  parametersCount,
  selectedTweaksCount,
  onForceRefresh,
  onRetry
}) => {
  if (!isEnabled) return null;
  
  return (
    <Card className="mb-4 border-yellow-300 bg-yellow-50">
      <CardHeader className="pb-1">
        <CardTitle className="text-md flex items-center gap-1 text-yellow-800">
          <Code className="h-4 w-4" />
          Debug Mode
        </CardTitle>
        <CardDescription className="text-yellow-700 text-xs">
          This panel is only visible in development mode
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="font-medium text-yellow-700">Network:</span> 
            <Badge variant={networkStatus === 'online' ? 'outline' : 'destructive'} className="px-1 h-5">
              {networkStatus === 'online' ? (
                <span className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-green-600" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Offline
                </span>
              )}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-yellow-700">Prompt ID:</span> 
            <Badge variant="outline" className="px-1 h-5 truncate max-w-[100px]">
              {promptId || 'None'}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-yellow-700">Loading:</span> 
            <Badge variant={isLoading ? 'secondary' : 'outline'} className="px-1 h-5">
              {isLoading ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-yellow-700">Generating:</span> 
            <Badge variant={isGenerating ? 'secondary' : 'outline'} className="px-1 h-5">
              {isGenerating ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-yellow-700">Parameters:</span> 
            <Badge variant="outline" className="px-1 h-5">
              {parametersCount}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-yellow-700">Selected Tweaks:</span> 
            <Badge variant="outline" className="px-1 h-5">
              {selectedTweaksCount}
            </Badge>
          </div>
        </div>
        
        {error && (
          <Collapsible className="w-full">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-700 text-xs font-medium">Error Detected</AlertTitle>
              <AlertDescription className="text-red-700 text-xs mt-1">
                {error}
              </AlertDescription>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2 h-6 text-xs py-0 border-red-300 text-red-700 hover:bg-red-100">
                  Show Full Error Details
                </Button>
              </CollapsibleTrigger>
            </Alert>
            <CollapsibleContent>
              <div className="bg-red-50 border border-red-200 rounded-md mt-1 p-2">
                <pre className="text-xs text-red-800 whitespace-pre-wrap overflow-auto max-h-[200px]">
                  {error}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <div className="flex gap-2">
          {onForceRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onForceRefresh} 
              className="h-6 text-xs py-0"
            >
              Force Refresh
            </Button>
          )}
          
          {error && onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry} 
              className="h-6 text-xs py-0"
            >
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugModePanel;
