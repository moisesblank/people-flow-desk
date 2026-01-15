// PulseIndicator - Componente extraído de IntegratedMetricsDashboard
// Performance: Static indicator (animation removed)

interface PulseIndicatorProps {
  color?: string;
  size?: "sm" | "md" | "lg";
}

export function PulseIndicator({ color = "emerald", size = "sm" }: PulseIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  return (
    <span className="relative flex">
      <span className={`relative inline-flex rounded-full ${sizeClasses[size]} bg-${color}-500`} />
    </span>
  );
}
