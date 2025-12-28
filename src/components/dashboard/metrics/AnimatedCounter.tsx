// AnimatedCounter - Componente extraído de IntegratedMetricsDashboard
import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1.5, 
  decimals = 0, 
  prefix = "", 
  suffix = "" 
}: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (decimals > 0) {
      return prefix + latest.toFixed(decimals) + suffix;
    }
    return prefix + Math.round(latest).toLocaleString("pt-BR") + suffix;
  });

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, duration, count]);

  return <motion.span>{rounded}</motion.span>;
}
