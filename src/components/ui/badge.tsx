import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
        // 🚀 2300 Futuristic variants
        holo: "border-holo-cyan/40 bg-holo-cyan/15 text-holo-cyan shadow-[0_0_10px_hsl(var(--holo-cyan)/0.2)]",
        "holo-purple": "border-holo-purple/40 bg-holo-purple/15 text-holo-purple shadow-[0_0_10px_hsl(var(--holo-purple)/0.2)]",
        "holo-pink": "border-holo-pink/40 bg-holo-pink/15 text-holo-pink shadow-[0_0_10px_hsl(var(--holo-pink)/0.2)]",
        "holo-glow": "border-holo-cyan/60 bg-holo-cyan/20 text-holo-cyan shadow-[0_0_15px_hsl(var(--holo-cyan)/0.4)] text-shadow-[0_0_10px_hsl(var(--holo-cyan)/0.5)]",
        // 🔥 2300 PREMIUM Status badges - Neon Glow
        "status-online": "relative overflow-visible badge-status-online",
        "status-syncing": "relative overflow-visible badge-status-syncing",
        "status-ai": "relative overflow-visible badge-status-ai",
        // ⚡ 2300 ULTRA variants
        "2300": "border-primary/50 bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.2)]",
        "2300-success": "border-success/50 bg-gradient-to-r from-success/20 to-success/10 text-success shadow-[0_0_15px_hsl(var(--success)/0.2)]",
        "2300-danger": "border-destructive/50 bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive shadow-[0_0_15px_hsl(var(--destructive)/0.2)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  pulse?: boolean;
  glow?: boolean;
}

function Badge({ className, variant, pulse = false, glow = false, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant }), 
        pulse && "badge-pulse",
        glow && "shadow-[0_0_20px_currentColor/0.4]",
        className
      )} 
      {...props} 
    />
  );
}

export { Badge, badgeVariants };
