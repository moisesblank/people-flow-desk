// ============================================
// UPGRADE v10 - FASE 7: WIDGET DE TIME TRACKING
// Controle de tempo no Dashboard
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Play,
  Pause,
  Square,
  Coffee,
  Timer,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  useActiveTimeTracking,
  useClockIn,
  useClockOut,
  useBreak,
  useTimeTrackingStats,
  formatDuration,
} from "@/hooks/useTimeTracking";
import { startOfWeek, endOfWeek } from "date-fns";
import { Link } from "react-router-dom";

export function TimeTrackingWidget() {
  const { data: activeTracking, isLoading } = useActiveTimeTracking();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const breakMutation = useBreak();

  const weekRange = {
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  };
  const { data: weekStats } = useTimeTrackingStats(weekRange);

  const [elapsed, setElapsed] = useState(0);

  // Timer para atualizar tempo em andamento
  useEffect(() => {
    if (!activeTracking) {
      setElapsed(0);
      return;
    }

    const startTime = new Date(activeTracking.clock_in).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 60000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [activeTracking]);

  const handleClockIn = () => {
    clockIn.mutate(undefined);
  };

  const handleClockOut = () => {
    if (activeTracking) {
      clockOut.mutate(activeTracking.id);
    }
  };

  const handleBreak = (type: "start" | "end") => {
    if (activeTracking) {
      breakMutation.mutate({ id: activeTracking.id, type });
    }
  };

  const isOnBreak =
    activeTracking?.break_start && !activeTracking?.break_end;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="glass-card border-border/50 hover:border-primary/30 transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Controle de Tempo
            </CardTitle>
            <Link to="/ponto-eletronico">
              <Button variant="ghost" size="sm" className="text-xs">
                Histórico
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status atual */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  activeTracking
                    ? isOnBreak
                      ? "bg-stats-gold animate-pulse"
                      : "bg-stats-green animate-pulse"
                    : "bg-muted-foreground"
                }`}
              />
              <div>
                <div className="font-medium">
                  {activeTracking
                    ? isOnBreak
                      ? "Em intervalo"
                      : "Trabalhando"
                    : "Não registrado"}
                </div>
                {activeTracking && (
                  <div className="text-2xl font-mono font-bold text-primary">
                    {formatDuration(elapsed)}
                  </div>
                )}
              </div>
            </div>

            {activeTracking && (
              <Badge
                variant="outline"
                className={
                  isOnBreak
                    ? "bg-stats-gold/10 text-stats-gold border-stats-gold/30"
                    : "bg-stats-green/10 text-stats-green border-stats-green/30"
                }
              >
                {isOnBreak ? (
                  <>
                    <Coffee className="h-3 w-3 mr-1" />
                    Pausa
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Ativo
                  </>
                )}
              </Badge>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            {!activeTracking ? (
              <Button
                onClick={handleClockIn}
                className="flex-1"
                disabled={clockIn.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Jornada
              </Button>
            ) : (
              <>
                <Button
                  variant={isOnBreak ? "default" : "outline"}
                  onClick={() => handleBreak(isOnBreak ? "end" : "start")}
                  disabled={breakMutation.isPending}
                  className="flex-1"
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  {isOnBreak ? "Voltar" : "Intervalo"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClockOut}
                  disabled={clockOut.isPending}
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Encerrar
                </Button>
              </>
            )}
          </div>

          {/* Estatísticas da semana */}
          {weekStats && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                Esta semana
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-primary/10">
                  <div className="text-xl font-bold text-primary">
                    {weekStats.totalHours}h
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total trabalhado
                  </div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-xl font-bold">
                    {weekStats.entriesCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dias registrados
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
