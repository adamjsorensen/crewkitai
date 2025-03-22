import React from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const FeatureFlagsPanel = () => {
  const { flags, updateFlag, isAdmin, refreshFlags } = useFeatureFlags();
  const [updateStatus, setUpdateStatus] = React.useState<{
    success?: string;
    error?: string;
  }>({});
  
  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-2xl mt-8">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access the feature flags management panel.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleToggleFlag = async (flagName: keyof typeof flags, checked: boolean) => {
    try {
      await updateFlag(flagName, checked);
      setUpdateStatus({ success: `Successfully updated ${flagName} to ${checked ? 'enabled' : 'disabled'}` });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus({});
      }, 3000);
    } catch (error) {
      setUpdateStatus({ error: `Failed to update ${flagName}` });
    }
  };
  
  return (
    <div className="container py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Feature Flags</CardTitle>
          <CardDescription>
            Toggle features on and off without redeploying your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {updateStatus.success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{updateStatus.success}</AlertDescription>
            </Alert>
          )}
          
          {updateStatus.error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{updateStatus.error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
              <div>
                <h3 className="font-medium">Enable Streaming Responses</h3>
                <p className="text-sm text-gray-500">
                  Allow responses to stream in real-time in the chat interface
                </p>
              </div>
              <Switch
                checked={flags.enableStreaming}
                onCheckedChange={(checked) => handleToggleFlag('enableStreaming', checked)}
              />
            </div>
            
            {/* Add more feature flags here as needed */}
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>
              Feature flags allow you to control the availability of features in your application.
              Toggle a flag to enable or disable a feature for all users.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureFlagsPanel;
