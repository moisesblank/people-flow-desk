// ============================================
// ENEM COUNTDOWN 2030 - SANTUÁRIO BETA v10
// Contagem regressiva épica para o ENEM
// Integrado com hooks reais de gamificação
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Flame, 
  Target, 
  Sparkles,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface ENEMCountdown2030Props {
  examDate?: Date;
  className?: string;
}

export function ENEMCountdown2030({ 
  examDate = new Date('2026-11-15T13:00:00'), // ENEM 2026 - 15 de Novembro
  className
}: ENEMCountdown2030Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = examDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        setTimeLeft({ days, hours, minutes, seconds });
        setIsUrgent(days < 30);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [examDate]);

  const urgencyLevel = useMemo(() => {
    if (timeLeft.days < 7) return 'critical';
    if (timeLeft.days < 30) return 'warning';
    if (timeLeft.days < 90) return 'moderate';
    return 'calm';
  }, [timeLeft.days]);

  const urgencyColors = {
    critical: 'from-red-600 via-red-500 to-orange-500',
    warning: 'from-amber-500 via-orange-500 to-red-500',
    moderate: 'from-blue-500 via-purple-500 to-pink-500',
    calm: 'from-cyan-500 via-blue-500 to-purple-500'
  };

  const urgencyBorder = {
    critical: 'border-red-500/50',
    warning: 'border-amber-500/50',
    moderate: 'border-purple-500/30',
    calm: 'border-cyan-500/30'
  };

  const timeBlocks = [
    { value: timeLeft.days, label: 'DIAS', icon: Calendar },
    { value: timeLeft.hours, label: 'HORAS', icon: Clock },
    { value: timeLeft.minutes, label: 'MIN', icon: Target },
    { value: timeLeft.seconds, label: 'SEG', icon: Sparkles },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative overflow-hidden", className)}
    >
      <Card className={cn(
        "border-2 bg-gradient-to-r",
        urgencyColors[urgencyLevel],
        urgencyBorder[urgencyLevel]
      )}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Título */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isUrgent ? (
                  <Flame className="w-8 h-8 text-white animate-pulse" />
                ) : (
                  <Trophy className="w-8 h-8 text-white" />
                )}
              </motion.div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  ENEM 2025
                  {urgencyLevel === 'critical' && (
                    <Badge className="bg-white/20 text-white border-0 animate-pulse">
                      RETA FINAL
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-white/80">
                  {urgencyLevel === 'critical' 
                    ? '🔥 É agora ou nunca!' 
                    : urgencyLevel === 'warning'
                    ? '⚡ Hora de intensificar!'
                    : '📚 Cada minuto conta!'}
                </p>
              </div>
            </div>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              {timeBlocks.map((block, i) => (
                <motion.div
                  key={block.label}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className={cn(
                    "bg-white/20 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/30",
                    block.label === 'SEG' && "animate-pulse"
                  )}>
                    <span className="text-2xl md:text-4xl font-black text-white tabular-nums">
                      {String(block.value).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white/80 mt-1 block">
                    {block.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mensagem Motivacional */}
          {urgencyLevel !== 'calm' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center"
            >
              <p className="text-sm text-white/90 font-medium">
                {urgencyLevel === 'critical' && "🚀 Foco total! Você está na reta final. Cada segundo importa!"}
                {urgencyLevel === 'warning' && "💪 Menos de um mês! Revise os pontos fracos e mantenha o ritmo!"}
                {urgencyLevel === 'moderate' && "📖 Bom ritmo! Continue assim e você chegará preparado!"}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
