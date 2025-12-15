// ============================================
// MOISÉS MEDEIROS v8.0 - PRODUCTIVITY TRACKER
// Rastreador de Produtividade Semanal
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Target, 
  CheckCircle2, 
  Clock,
  Flame,
  Calendar,
  TrendingUp,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DayProgress {
  date: Date;
  completed: number;
  total: number;
}

export function ProductivityTracker() {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DayProgress[]>([]);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchWeeklyProgress();
    }
  }, [user?.id]);

  const fetchWeeklyProgress = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { locale: ptBR });
      const weekEnd = endOfWeek(today, { locale: ptBR });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const { data: tasks } = await supabase
        .from("calendar_tasks")
        .select("task_date, is_completed")
        .gte("task_date", format(weekStart, "yyyy-MM-dd"))
        .lte("task_date", format(weekEnd, "yyyy-MM-dd"));

      const progressData = days.map(day => {
        const dayTasks = tasks?.filter(t => 
          isSameDay(new Date(t.task_date), day)
        ) || [];
        
        return {
          date: day,
          completed: dayTasks.filter(t => t.is_completed).length,
          total: dayTasks.length
        };
      });

      setWeekData(progressData);

      // Calculate streak
      let currentStreak = 0;
      for (let i = progressData.length - 1; i >= 0; i--) {
        const day = progressData[i];
        if (day.total > 0 && day.completed === day.total) {
          currentStreak++;
        } else if (day.total > 0) {
          break;
        }
      }
      setStreak(currentStreak);
    } catch (error) {
      console.error("Error fetching productivity data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalCompleted = weekData.reduce((sum, d) => sum + d.completed, 0);
    const totalTasks = weekData.reduce((sum, d) => sum + d.total, 0);
    const completionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;
    const activeDays = weekData.filter(d => d.total > 0).length;

    return { totalCompleted, totalTasks, completionRate, activeDays };
  }, [weekData]);

  const getDayName = (date: Date) => {
    return format(date, "EEE", { locale: ptBR }).replace(".", "");
  };

  const getProgressColor = (completed: number, total: number) => {
    if (total === 0) return "bg-muted";
    const rate = completed / total;
    if (rate === 1) return "bg-[hsl(var(--stats-green))]";
    if (rate >= 0.5) return "bg-[hsl(var(--stats-blue))]";
    if (rate > 0) return "bg-[hsl(var(--stats-gold))]";
    return "bg-destructive";
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="h-32 animate-pulse bg-muted rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Produtividade Semanal</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {format(startOfWeek(new Date(), { locale: ptBR }), "dd", { locale: ptBR })} - {format(endOfWeek(new Date(), { locale: ptBR }), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
            {streak > 0 && (
              <Badge className="gap-1 bg-[hsl(var(--stats-gold))]/10 text-[hsl(var(--stats-gold))] border-[hsl(var(--stats-gold))]/30">
                <Flame className="h-3 w-3" />
                {streak} dias
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Overview */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--stats-green))]" />
              <span className="text-sm font-medium">
                {stats.totalCompleted}/{stats.totalTasks} tarefas
              </span>
            </div>
            <span className={`text-lg font-bold ${
              stats.completionRate >= 80 ? "text-[hsl(var(--stats-green))]" :
              stats.completionRate >= 50 ? "text-[hsl(var(--stats-blue))]" :
              "text-[hsl(var(--stats-gold))]"
            }`}>
              {stats.completionRate.toFixed(0)}%
            </span>
          </div>

          {/* Week Progress Bars */}
          <div className="grid grid-cols-7 gap-2">
            {weekData.map((day, index) => {
              const isToday = isSameDay(day.date, new Date());
              const progress = day.total > 0 ? (day.completed / day.total) * 100 : 0;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="text-center"
                >
                  <p className={`text-[10px] uppercase tracking-wider mb-1 ${
                    isToday ? "text-primary font-bold" : "text-muted-foreground"
                  }`}>
                    {getDayName(day.date)}
                  </p>
                  <div className={`relative h-16 rounded-lg overflow-hidden ${
                    isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                  }`}>
                    <div className="absolute inset-0 bg-muted/50" />
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 ${getProgressColor(day.completed, day.total)}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${progress}%` }}
                      transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {day.total > 0 && (
                        <span className="text-xs font-medium text-foreground">
                          {day.completed}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.activeDays}</p>
              <p className="text-[10px] text-muted-foreground">Dias ativos</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">
                {stats.activeDays > 0 ? (stats.totalCompleted / stats.activeDays).toFixed(1) : 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Média/dia</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <Award className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{streak}</p>
              <p className="text-[10px] text-muted-foreground">Sequência</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
