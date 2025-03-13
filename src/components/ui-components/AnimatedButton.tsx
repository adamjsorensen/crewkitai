
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
  className?: string;
}

const AnimatedButton = ({
  children,
  className,
  variant = "default",
  size = "default",
  ...props
}: AnimatedButtonProps) => {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "button-shine relative overflow-hidden transition-all duration-300",
        "active:scale-[0.98] hover:scale-[1.02]",
        "font-medium",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AnimatedButton;
