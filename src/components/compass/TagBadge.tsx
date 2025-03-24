
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  name: string;
  color: string;
  className?: string;
  onClick?: () => void;
  onRemove?: () => void;
}

const TagBadge = ({ name, color, className, onClick, onRemove }: TagBadgeProps) => {
  // Generate a lighter background color based on the provided color
  const getBgColor = () => {
    // If color is a hex code, convert it to an RGBA with low opacity
    if (color.startsWith('#')) {
      return `${color}30`; // 30 = 19% opacity in hex
    }
    return color;
  };

  return (
    <Badge 
      className={cn(
        'rounded-full font-medium py-1 pl-2 pr-1 inline-flex items-center gap-1',
        onClick && !onRemove && 'cursor-pointer hover:opacity-80 transition-opacity',
        !onClick && !onRemove && 'cursor-default',
        className
      )}
      style={{ 
        backgroundColor: getBgColor(), 
        color: color,
        borderColor: color
      }}
      variant="outline"
      onClick={onClick}
    >
      {name}
      {onRemove && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full hover:bg-gray-200 p-0.5 ml-1"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
};

export default TagBadge;
