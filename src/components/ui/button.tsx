import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_20px_hsl(var(--destructive)/0.3)] active:scale-[0.98]",
        wine: "bg-stats-wine text-primary-foreground hover:bg-stats-wine/90 border border-stats-wine/40 hover:shadow-[0_0_25px_hsl(var(--stats-wine)/0.4)] active:scale-[0.98]",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50 active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        // 🚀 2300 PREMIUM VARIANTS
        holo: "relative overflow-hidden bg-ai-surface border border-ai-border text-holo-cyan hover:bg-ai-surface-hover hover:border-holo-cyan/60 hover:shadow-[0_0_30px_hsl(var(--holo-cyan)/0.25),inset_0_1px_0_hsl(var(--holo-cyan)/0.1)] active:scale-[0.98]",
        "holo-primary": "relative overflow-hidden bg-gradient-to-r from-holo-cyan/20 via-holo-purple/15 to-holo-cyan/20 border border-holo-cyan/40 text-foreground hover:from-holo-cyan/30 hover:via-holo-purple/25 hover:to-holo-cyan/30 hover:shadow-[0_0_40px_hsl(var(--holo-cyan)/0.3),0_0_80px_hsl(var(--holo-purple)/0.15)] hover:border-holo-cyan/60 active:scale-[0.98]",
        "holo-ghost": "bg-transparent border border-transparent text-holo-cyan hover:bg-holo-cyan/10 hover:border-holo-cyan/40 hover:shadow-[0_0_20px_hsl(var(--holo-cyan)/0.15)] active:scale-[0.98]",
        // 🔥 2300 ULTRA PREMIUM
        "2300": "relative overflow-hidden bg-gradient-to-r from-primary via-primary-hover to-primary text-primary-foreground border border-primary/50 hover:shadow-[0_0_40px_hsl(var(--primary)/0.4),0_0_80px_hsl(var(--primary)/0.2)] hover:border-primary-glow/60 active:scale-[0.97] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        "2300-outline": "relative overflow-hidden bg-transparent border-2 border-primary/60 text-primary hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] active:scale-[0.98]",
        "2300-glass": "relative overflow-hidden backdrop-blur-md bg-background/30 border border-foreground/10 text-foreground hover:bg-background/50 hover:border-foreground/20 hover:shadow-[0_0_30px_hsl(var(--foreground)/0.1),inset_0_1px_0_hsl(var(--foreground)/0.1)] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-12 rounded-xl px-10 text-base",
        "2xl": "h-14 rounded-xl px-12 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
