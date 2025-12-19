import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "subtle" | "strong";
  animate?: boolean;
}

const GlassPanel = ({ 
  children, 
  className, 
  variant = "default",
  animate = false 
}: GlassPanelProps) => {
  const variants = {
    default: "glass",
    subtle: "glass-subtle",
    strong: "glass-strong",
  };

  return (
    <div 
      className={cn(
        variants[variant],
        animate && "animate-fade-in",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
