
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  isActive: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ isActive }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }
    
    // Simulate AI thinking progress
    // Going to 90% quickly, then slowly finishing to give time for actual response
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Fast initially, then slow down
        if (prevProgress < 30) return prevProgress + 5;
        if (prevProgress < 60) return prevProgress + 3;
        if (prevProgress < 80) return prevProgress + 1;
        if (prevProgress < 90) return prevProgress + 0.5;
        return prevProgress + 0.2; // Very slow at the end
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, [isActive]);
  
  if (!isActive) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-1 bg-background/80 backdrop-blur-sm">
      <Progress value={progress} className="h-1" />
    </div>
  );
};

export default ProgressBar;
