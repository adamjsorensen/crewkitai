
import React from 'react';
import { TooltipProvider as RadixTooltipProvider } from '@radix-ui/react-tooltip';

interface CustomTooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

const CustomTooltipProvider: React.FC<CustomTooltipProviderProps> = ({ 
  children, 
  delayDuration = 300 // Reduced from default 700ms
}) => {
  return (
    <RadixTooltipProvider delayDuration={delayDuration}>
      {children}
    </RadixTooltipProvider>
  );
};

export default CustomTooltipProvider;
