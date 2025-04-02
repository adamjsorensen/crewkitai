
import React from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";

interface SimpleWizardHeaderProps {
  dialogTitle: string;
  networkStatus: 'online' | 'offline';
  error: string | null;
}

const SimpleWizardHeader: React.FC<SimpleWizardHeaderProps> = ({
  dialogTitle,
  networkStatus,
  error
}) => {
  return (
    <DialogHeader>
      <DialogTitle className="text-xl flex items-center gap-2">
        {networkStatus === 'offline' && <WifiOff className="h-5 w-5 text-red-500" />}
        {networkStatus === 'online' && !error && <Wifi className="h-5 w-5 text-green-500" />}
        {error && <AlertCircle className="h-5 w-5 text-red-500" />}
        {dialogTitle}
      </DialogTitle>
      <DialogDescription>
        Customize this prompt to generate content tailored to your needs
      </DialogDescription>
    </DialogHeader>
  );
};

export default SimpleWizardHeader;
