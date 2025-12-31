// ============================================
// LIVE CLASS BANNER - Banner de Aulas ao Vivo
// Exibe próximas lives agendadas
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Calendar, Clock, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LiveClass {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes?: number;
  link?: string;
  instructor?: string;
}

interface LiveClassBannerProps {
  courseId?: string;
  liveClasses?: LiveClass[];
  className?: string;
  onJoinClick?: (liveClass: LiveClass) => void;
}

export function LiveClassBanner({
  courseId,
  liveClasses: propLiveClasses,
  className,
  onJoinClick,
}: LiveClassBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [currentLive, setCurrentLive] = useState<LiveClass | null>(null);

  // Mock data ou dados reais
  const liveClasses = propLiveClasses || [
    {
      id: "1",
      title: "Revisão Geral de Química",
      scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas
      duration_minutes: 90,
      instructor: "Prof. Moisés Medeiros",
    },
  ];

  useEffect(() => {
    // Encontrar a próxima live
    const upcoming = liveClasses
      .filter(l => isFuture(new Date(l.scheduled_at)))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
    
    setCurrentLive(upcoming || null);
  }, [liveClasses]);

  if (dismissed || !currentLive) return null;

  const scheduledDate = new Date(currentLive.scheduled_at);
  const isLiveToday = isToday(scheduledDate);
  const timeUntil = formatDistanceToNow(scheduledDate, { addSuffix: true, locale: ptBR });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn("relative", className)}
      >
        <div className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg border",
          isLiveToday 
            ? "bg-red-500/10 border-red-500/30" 
            : "bg-primary/10 border-primary/30"
        )}>
          {/* Live Indicator */}
          <motion.div
            className={cn(
              "flex items-center gap-1.5",
              isLiveToday && "text-red-500"
            )}
            animate={isLiveToday ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Radio className={cn(
              "h-4 w-4",
              isLiveToday ? "text-red-500" : "text-primary"
            )} />
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                isLiveToday 
                  ? "bg-red-500/20 text-red-500 border-red-500/30" 
                  : "bg-primary/20 text-primary border-primary/30"
              )}
            >
              {isLiveToday ? "HOJE" : "AGENDADA"}
            </Badge>
          </motion.div>

          {/* Live Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentLive.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeUntil}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(scheduledDate, "HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isLiveToday ? "destructive" : "default"}
              className="gap-1.5 text-xs"
              onClick={() => onJoinClick?.(currentLive)}
            >
              <ExternalLink className="h-3 w-3" />
              {isLiveToday ? "Entrar" : "Lembrete"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setDismissed(true)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
