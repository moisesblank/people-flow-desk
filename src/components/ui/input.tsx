import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "holo" | "2300";
  validationState?: "default" | "success" | "error";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", validationState = "default", ...props }, ref) => {
    const variants = {
      default: "border-input bg-background focus-visible:ring-ring",
      holo: "border-ai-border bg-ai-surface focus-visible:ring-holo-cyan/50 focus-visible:border-holo-cyan/50 placeholder:text-muted-foreground/60",
      // 2300 UPGRADE - Foco premium com halo (LEI I)
      "2300": cn(
        "border-border/60 bg-card focus-visible:ring-primary/30 focus-visible:border-primary/50 input-2300",
        validationState === "success" && "input-success",
        validationState === "error" && "input-error"
      ),
    };
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          variants[variant],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
