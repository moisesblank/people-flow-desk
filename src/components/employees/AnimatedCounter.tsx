import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  formatFn?: (value: number) => string;
  duration?: number;
}

export function AnimatedCounter({ 
  value, 
  formatFn = (v) => v.toString(),
  duration = 1 
}: AnimatedCounterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const spring = useSpring(0, { 
    stiffness: 50, 
    damping: 20,
    duration: duration * 1000
  });

  const display = useTransform(spring, (current) => formatFn(Math.round(current)));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          spring.set(value);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [spring, value, isVisible]);

  useEffect(() => {
    if (isVisible) {
      spring.set(value);
    }
  }, [value, spring, isVisible]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {display}
    </motion.span>
  );
}
