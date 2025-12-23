import * as React from "react";

import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "holo" | "holo-elevated" | "glass" | "2300" | "2300-glass" | "2300-neon";
  enableHover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", enableHover = true, ...props }, ref) => {
    const variants = {
      default: "rounded-lg border bg-card text-card-foreground shadow-sm",
      holo: "rounded-xl border border-ai-border bg-ai-surface text-card-foreground transition-all duration-200 hover:border-holo-cyan/30",
      "holo-elevated": "rounded-xl border border-ai-border bg-ai-surface text-card-foreground shadow-[0_0_30px_hsl(var(--holo-cyan)/0.1)] transition-all duration-200 hover:shadow-[0_0_40px_hsl(var(--holo-cyan)/0.15)] hover:border-holo-cyan/40",
      glass: "rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl text-card-foreground shadow-2xl",
      // 🚀 2300 PREMIUM - Glassmorphism + Neon Border
      "2300": cn(
        "rounded-xl border border-border/60 bg-card text-card-foreground",
        enableHover && "card-2300"
      ),
      // 🌌 2300 GLASS - Ultra Premium Glassmorphism
      "2300-glass": cn(
        "rounded-2xl border border-foreground/10 text-card-foreground backdrop-blur-xl",
        "bg-gradient-to-br from-card/80 via-card/60 to-card/40",
        "shadow-[0_8px_32px_hsl(var(--background)/0.3),inset_0_1px_0_hsl(var(--foreground)/0.05)]",
        enableHover && "card-2300"
      ),
      // ⚡ 2300 NEON - Cyberpunk Glow
      "2300-neon": cn(
        "rounded-2xl border-2 text-card-foreground",
        "bg-gradient-to-br from-card via-card/95 to-card",
        "border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.15),inset_0_1px_0_hsl(var(--primary)/0.1)]",
        enableHover && "card-2300 hover:border-primary/60 hover:shadow-[0_0_50px_hsl(var(--primary)/0.25)]"
      ),
    };
    return (
      <div 
        ref={ref} 
        className={cn(variants[variant], className)} 
        {...props} 
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
