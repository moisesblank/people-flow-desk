// ============================================
// PAGE HERO v2.0 - Hero Banner Reutilizável
// Com imagem de fundo, gradientes e animações
// ============================================

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { SacredImage } from "@/components/performance/SacredImage";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  icon?: LucideIcon;
  image?: string;
  imageAlt?: string;
  actions?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "outline" | "secondary" | "ghost";
    icon?: LucideIcon;
  }>;
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: LucideIcon;
  }>;
  children?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  overlay?: "light" | "dark" | "gradient";
  animated?: boolean;
}

export function PageHero({
  title,
  subtitle,
  description,
  badge,
  badgeVariant = "default",
  icon: Icon,
  image,
  imageAlt = "Hero background",
  actions = [],
  stats = [],
  children,
  className,
  size = "md",
  overlay = "gradient",
  animated = true,
}: PageHeroProps) {
  const heightClasses = {
    sm: "h-40 md:h-48",
    md: "h-52 md:h-64",
    lg: "h-64 md:h-80",
  };

  const overlayClasses = {
    light: "bg-background/60 backdrop-blur-sm",
    dark: "bg-background/80",
    gradient: "bg-gradient-to-r from-background/95 via-background/70 to-background/30",
  };

  const Container = animated ? motion.div : "div";
  const animationProps = animated
    ? {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      }
    : {};

  return (
    <Container
      {...animationProps}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden",
        heightClasses[size],
        !image && "bg-gradient-to-br from-card via-card to-primary/10 border border-border/50",
        className
      )}
    >
      {/* Background Image */}
      {image && (
        <>
          <SacredImage
            src={image}
            alt={imageAlt || "Hero background"}
            className="absolute inset-0 w-full h-full"
            objectFit="cover"
          />
          <div className={cn("absolute inset-0", overlayClasses[overlay])} />
        </>
      )}

      {/* Animated Background Pattern (when no image) */}
      {!image && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
          {animated && (
            <motion.div
              className="absolute -right-10 top-1/2 transform -translate-y-1/2"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-64 h-64 border border-primary/10 rounded-full" />
            </motion.div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center p-6 md:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Text Content */}
          <div className="space-y-3">
            {/* Badge and Subtitle */}
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2.5 rounded-xl bg-primary/20 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex items-center gap-2">
                {subtitle && (
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">
                    {subtitle}
                  </span>
                )}
                {badge && (
                  <Badge variant={badgeVariant} className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {badge}
                  </Badge>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              {title}
            </h1>

            {/* Description */}
            {description && (
              <p className="text-muted-foreground max-w-xl text-base md:text-lg">
                {description}
              </p>
            )}

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {actions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant={action.variant || (index === 0 ? "default" : "outline")}
                      onClick={action.onClick}
                      className={cn(
                        "gap-2",
                        index === 0 && "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      )}
                    >
                      {ActionIcon && <ActionIcon className="h-4 w-4" />}
                      {action.label}
                      {index === 0 && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats or Children */}
          {stats.length > 0 ? (
            <div className="flex flex-wrap gap-3 lg:gap-4">
              {stats.map((stat, index) => {
                const StatIcon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
                    animate={animated ? { opacity: 1, scale: 1 } : undefined}
                    transition={animated ? { delay: 0.2 + index * 0.1 } : undefined}
                    className="px-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 min-w-[100px]"
                  >
                    <div className="flex items-center gap-2">
                      {StatIcon && <StatIcon className="h-4 w-4 text-primary" />}
                      <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </Container>
  );
}
