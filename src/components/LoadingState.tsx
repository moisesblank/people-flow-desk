import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "dots" | "pulse";
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  variant = "spinner",
  message,
  className,
  size = "md",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  if (variant === "spinner") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn("rounded-full bg-primary", size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4")}
            animate={{
              y: [0, -10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <motion.div
          className={cn(
            "rounded-full bg-primary/20",
            size === "sm" ? "w-12 h-12" : size === "md" ? "w-16 h-16" : "w-20 h-20"
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div
              className={cn(
                "rounded-full bg-primary",
                size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-10 h-10"
              )}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Skeleton variant
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

// Card skeleton for lists
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats skeleton
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4", count <= 2 ? "sm:grid-cols-2" : count === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4")}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="stat-card glass-card"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
