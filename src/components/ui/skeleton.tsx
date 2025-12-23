import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "holo" | "shimmer";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variants = {
    default: "animate-pulse bg-muted",
    holo: "animate-pulse bg-gradient-to-r from-ai-surface via-ai-surface-hover to-ai-surface",
    shimmer: "bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer",
  };
  return (
    <div 
      className={cn("rounded-md", variants[variant], className)} 
      {...props} 
    />
  );
}

export { Skeleton };
