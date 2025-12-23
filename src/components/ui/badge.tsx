import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        info: "border-transparent bg-info text-info-foreground",
        // 2300 Futuristic variants
        holo: "border-holo-cyan/30 bg-holo-cyan/10 text-holo-cyan",
        "holo-purple": "border-holo-purple/30 bg-holo-purple/10 text-holo-purple",
        "holo-pink": "border-holo-pink/30 bg-holo-pink/10 text-holo-pink",
        "holo-glow": "border-holo-cyan/50 bg-holo-cyan/15 text-holo-cyan shadow-[0_0_10px_hsl(var(--holo-cyan)/0.3)]",
        // 2300 UPGRADE - Status badges com pulso
        "status-online": "relative badge-status-online",
        "status-syncing": "relative badge-status-syncing",
        "status-ai": "relative badge-status-ai",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse = false, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant }), 
        pulse && "badge-pulse",
        className
      )} 
      {...props} 
    />
  );
}

export { Badge, badgeVariants };
