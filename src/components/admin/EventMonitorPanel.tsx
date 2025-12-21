// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// PAINEL DE MONITORAMENTO DO SISTEMA NERVOSO
// Visualização em tempo real dos eventos
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock,
  Brain,
  TrendingUp,
  Bell,
  RefreshCw,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEventMonitor, type EventName, type SystemEvent } from "@/hooks/useEventSystem";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const EVENT_ICONS: Record<string, React.ElementType> = {
  "lesson.completed": CheckCircle,
  "quiz.passed": TrendingUp,
  "level.up": Zap,
  "badge.earned": Brain,
  "payment.succeeded": CheckCircle,
  "daily.login": Activity,
  "correct.answer": CheckCircle,
  "wrong.answer": XCircle,
  default: Bell,
};

const EVENT_COLORS: Record<string, string> = {
  "lesson.completed": "text-green-500 bg-green-500/10",
  "quiz.passed": "text-blue-500 bg-blue-500/10",
  "quiz.failed": "text-orange-500 bg-orange-500/10",
  "level.up": "text-purple-500 bg-purple-500/10",
  "badge.earned": "text-yellow-500 bg-yellow-500/10",
  "payment.succeeded": "text-emerald-500 bg-emerald-500/10",
  "payment.failed": "text-red-500 bg-red-500/10",
  "daily.login": "text-cyan-500 bg-cyan-500/10",
  "correct.answer": "text-green-400 bg-green-400/10",
  "wrong.answer": "text-red-400 bg-red-400/10",
  default: "text-muted-foreground bg-muted",
};

const EVENT_LABELS: Record<string, string> = {
  "lesson.completed": "Aula Concluída",
  "lesson.started": "Aula Iniciada",
  "quiz.passed": "Quiz Aprovado",
  "quiz.failed": "Quiz Reprovado",
  "quiz.started": "Quiz Iniciado",
  "level.up": "Subiu de Nível",
  "badge.earned": "Badge Conquistada",
  "payment.succeeded": "Pagamento Aprovado",
  "payment.failed": "Pagamento Falhou",
  "payment.refunded": "Reembolso",
  "daily.login": "Login Diário",
  "correct.answer": "Resposta Correta",
  "wrong.answer": "Resposta Errada",
  "streak.achieved": "Sequência Mantida",
  "access.granted": "Acesso Concedido",
  "access.expired": "Acesso Expirado",
  "content.viewed": "Conteúdo Visualizado",
};

interface EventMonitorPanelProps {
  className?: string;
  maxEvents?: number;
}

export function EventMonitorPanel({ className, maxEvents = 50 }: EventMonitorPanelProps) {
  const { events, isConnected } = useEventMonitor();
  const [filter, setFilter] = useState<EventName | "all">("all");
  const [isPaused, setIsPaused] = useState(false);
  const [displayEvents, setDisplayEvents] = useState<SystemEvent[]>([]);

  useEffect(() => {
    if (!isPaused) {
      const filtered = filter === "all" 
        ? events 
        : events.filter(e => e.name === filter);
      setDisplayEvents(filtered.slice(0, maxEvents));
    }
  }, [events, filter, isPaused, maxEvents]);

  const eventCounts = events.reduce((acc, e) => {
    acc[e.name] = (acc[e.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className={cn("border-2 border-primary/20 overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="w-6 h-6 text-primary" />
              {isConnected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Sistema Nervoso Divino</CardTitle>
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Conectado em tempo real" : "Desconectado"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {events.length} eventos
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <RefreshCw className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Stats rápidos */}
        <div className="px-4 py-3 border-b border-border/50 flex gap-2 overflow-x-auto">
          {Object.entries(eventCounts).slice(0, 5).map(([name, count]) => (
            <Badge 
              key={name}
              variant="secondary"
              className={cn(
                "cursor-pointer transition-all",
                filter === name && "ring-2 ring-primary"
              )}
              onClick={() => setFilter(filter === name ? "all" : name as EventName)}
            >
              {EVENT_LABELS[name] || name}: {count}
            </Badge>
          ))}
        </div>

        {/* Lista de eventos */}
        <ScrollArea className="h-[400px]">
          <AnimatePresence mode="popLayout">
            {displayEvents.map((event, index) => {
              const Icon = EVENT_ICONS[event.name] || EVENT_ICONS.default;
              const colorClass = EVENT_COLORS[event.name] || EVENT_COLORS.default;
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.02 }}
                  className="px-4 py-3 border-b border-border/30 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {EVENT_LABELS[event.name] || event.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1">
                          {event.status}
                        </Badge>
                      </div>
                      
                      {event.entity_type && (
                        <p className="text-xs text-muted-foreground truncate">
                          {event.entity_type}: {event.entity_id?.slice(0, 8)}...
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(event.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {displayEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Aguardando eventos...</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
