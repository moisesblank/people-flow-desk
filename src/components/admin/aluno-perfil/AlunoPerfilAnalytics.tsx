// ============================================
// SEÇÃO ANALYTICS DO ALUNO
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, Clock, Calendar, TrendingUp, TrendingDown,
  Eye, MousePointer, Timer, Activity, AlertTriangle
} from "lucide-react";
import { PresetEmptyState } from "@/components/ui/empty-state";

interface AlunoAnalyticsProps {
  userId: string | null;
  profile: any;
}

export function AlunoPerfilAnalytics({ userId, profile }: AlunoAnalyticsProps) {
  // Buscar métricas de analytics
  const { data: analyticsMetrics } = useQuery({
    queryKey: ['aluno-analytics-metrics', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('analytics_metrics')
        .select('*')
        .eq('visitor_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar sessões de leitura de livros
  const { data: readingSessions } = useQuery({
    queryKey: ['aluno-reading-sessions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('book_reading_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!userId
  });

  // Calcular estatísticas
  const totalPageViews = analyticsMetrics?.filter((m: any) => m.metric_type === 'page_view')?.length || 0;
  const totalSessions = readingSessions?.length || 0;
  const totalReadingTime = readingSessions?.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0) || 0;
  const avgSessionTime = totalSessions > 0 ? Math.round(totalReadingTime / totalSessions) : 0;

  // Churn risk do perfil
  const churnRisk = profile?.churn_risk_score || null;
  const streakDays = profile?.streak_days || 0;
  const lastActivity = profile?.last_activity_at;

  // Calcular dias desde última atividade
  const daysSinceLastActivity = lastActivity 
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const hasData = totalPageViews > 0 || totalSessions > 0 || churnRisk !== null;

  const getChurnColor = (risk: number | null) => {
    if (risk === null) return 'text-muted-foreground';
    if (risk <= 0.3) return 'text-green-400';
    if (risk <= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getChurnLabel = (risk: number | null) => {
    if (risk === null) return 'Não calculado';
    if (risk <= 0.3) return 'Baixo Risco';
    if (risk <= 0.6) return 'Risco Moderado';
    return 'Alto Risco';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/20">
          <BarChart3 className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Analytics do Aluno</h3>
          <p className="text-sm text-muted-foreground">Comportamento, engajamento e risco de churn</p>
        </div>
      </div>

      {!hasData && !profile ? (
        <PresetEmptyState preset="noData" />
      ) : (
        <div className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">Page Views</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalPageViews}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-muted-foreground">Sessões Estudo</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{totalSessions}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-green-400" />
                <span className="text-sm text-muted-foreground">Tempo Total</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{formatTime(totalReadingTime)}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-muted-foreground">Sessão Média</span>
              </div>
              <p className="text-2xl font-bold text-cyan-400">{formatTime(avgSessionTime)}</p>
            </div>
          </div>

          {/* Risco de Churn */}
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                Risco de Churn
              </h4>
              <Badge className={`${getChurnColor(churnRisk)} bg-opacity-20`}>
                {getChurnLabel(churnRisk)}
              </Badge>
            </div>
            {churnRisk !== null && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className={getChurnColor(churnRisk)}>{Math.round(churnRisk * 100)}%</span>
                </div>
                <Progress 
                  value={churnRisk * 100} 
                  className={`h-2 ${churnRisk > 0.6 ? '[&>div]:bg-red-500' : churnRisk > 0.3 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                />
              </div>
            )}
          </div>

          {/* Engajamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Streak */}
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-medium text-foreground">Streak Atual</span>
              </div>
              <p className="text-3xl font-bold text-orange-400">{streakDays} dias</p>
            </div>
            
            {/* Última Atividade */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-foreground">Última Atividade</span>
              </div>
              {daysSinceLastActivity !== null ? (
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-blue-400">{daysSinceLastActivity}</p>
                  <span className="text-sm text-muted-foreground">dias atrás</span>
                  {daysSinceLastActivity > 7 && (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  {daysSinceLastActivity <= 1 && (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
              )}
            </div>
          </div>

          {/* Horários Preferidos (placeholder) */}
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              Horários de Estudo Preferidos
            </h4>
            <p className="text-sm text-muted-foreground">
              Análise disponível após mais dados de uso
            </p>
          </div>
        </div>
      )}
    </FuturisticCard>
  );
}
