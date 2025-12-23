import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "holo" | "shimmer" | "2300";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variants = {
    default: "animate-pulse bg-muted",
    holo: "animate-pulse bg-gradient-to-r from-ai-surface via-ai-surface-hover to-ai-surface",
    shimmer: "bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer",
    // 2300 UPGRADE - Shimmer premium controlado
    "2300": "skeleton-2300",
  };
  return (
    <div 
      className={cn("rounded-md", variants[variant], className)} 
      {...props} 
    />
  );
}

export { Skeleton };
