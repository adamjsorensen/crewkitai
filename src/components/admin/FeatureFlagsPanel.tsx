
import React from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Settings2 } from 'lucide-react';

const FeatureFlagsPanel = () => {
  const { flags, updateFlag, isAdmin, refreshFlags } = useFeatureFlags();
  const [updateStatus, setUpdateStatus] = React.useState<{
    success?: string;
    error?: string;
  }>({});
  
  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the feature flags management panel.
          </AlertDescription>
        </Alert>
      </div>
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
    <div className="space-y-6">
      {updateStatus.success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{updateStatus.success}</AlertDescription>
        </Alert>
      )}
      
      {updateStatus.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{updateStatus.error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <CardTitle>Feature Flags</CardTitle>
          </div>
          <CardDescription>
            Toggle features on and off without redeploying your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Feature flags will be added here when needed */}
            {Object.keys(flags).length === 0 ? (
              <div className="bg-muted/50 rounded-md p-4 text-center text-muted-foreground">
                <p>No feature flags are currently defined.</p>
                <p className="text-sm mt-1">Feature flags will appear here when they are added to the system.</p>
              </div>
            ) : (
              Object.entries(flags).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{key}</p>
                    <p className="text-sm text-muted-foreground">
                      {value ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <Switch 
                    checked={value} 
                    onCheckedChange={(checked) => handleToggleFlag(key as keyof typeof flags, checked)} 
                  />
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 bg-muted/30 rounded-md p-4 text-sm text-muted-foreground">
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
