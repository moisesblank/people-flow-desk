import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant: "red" | "green" | "blue" | "purple";
}

const variantStyles = {
  red: "stat-red border-stats-red/30",
  green: "stat-green border-stats-green/30",
  blue: "stat-blue border-stats-blue/30",
  purple: "stat-purple border-stats-purple/30",
};

const iconStyles = {
  red: "text-stats-red",
  green: "text-stats-green",
  blue: "text-stats-blue",
  purple: "text-stats-purple",
};

export function StatCard({ title, value, icon: Icon, variant }: StatCardProps) {
  return (
    <div
      className={cn(
        "stat-card glass-card border",
        variantStyles[variant]
      )}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={cn("rounded-xl bg-secondary/50 p-3", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
