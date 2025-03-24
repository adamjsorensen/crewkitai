
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  name: string;
  color: string;
  className?: string;
  onClick?: () => void;
}

const CategoryBadge = ({ name, color, className, onClick }: CategoryBadgeProps) => {
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
        'rounded-md font-medium cursor-default',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
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
    </Badge>
  );
};

export default CategoryBadge;
