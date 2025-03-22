
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface KeyPointsProps {
  points: string[];
}

const KeyPoints: React.FC<KeyPointsProps> = ({ points }) => {
  if (!points || points.length === 0) return null;
  
  return (
    <Card className="mt-3 p-3 bg-primary/5 border-primary/10">
      <div className="flex items-center gap-1.5 mb-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Key Points</span>
      </div>
      <ul className="space-y-1">
        {points.map((point, index) => (
          <li key={index} className="flex gap-1.5 items-start">
            <Badge variant="outline" className="h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
              {index + 1}
            </Badge>
            <span className="text-xs">{point}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default React.memo(KeyPoints);
