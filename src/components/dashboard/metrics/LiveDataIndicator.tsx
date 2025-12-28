// LiveDataIndicator - Componente extraído de IntegratedMetricsDashboard
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wifi, Database } from "lucide-react";

export function LiveDataIndicator() {
  const [time, setTime] = useState(new Date());
  const [dataPoints, setDataPoints] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setDataPoints(prev => prev + Math.floor(Math.random() * 5));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="flex items-center gap-4 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Wifi className="h-4 w-4 text-emerald-500" />
        </motion.div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Conexão Ativa</span>
          <span className="text-xs font-mono text-foreground">{time.toLocaleTimeString("pt-BR")}</span>
        </div>
      </div>
      <div className="h-6 w-px bg-border/50" />
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Data Points</span>
          <span className="text-xs font-mono text-foreground">{dataPoints.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
