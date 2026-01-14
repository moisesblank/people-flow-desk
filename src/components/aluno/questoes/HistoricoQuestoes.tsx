// ============================================
// 📊 HISTÓRICO DE QUESTÕES - Filtro por Source + Métricas
// Year 2300 Cinematic Standard
// ============================================

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, Clock, Trophy, Target, TrendingUp,
  FileText, Play, Brain, BarChart3, Calendar, Filter,
  ChevronRight, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfDay, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

// ============================================
// TIPOS
// ============================================

interface AttemptRecord {
  id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  xp_earned: number | null;
  created_at: string;
  source: string | null;
  question?: {
    macro?: string | null;
    micro?: string | null;
    difficulty?: string | null;
  } | null;
}

interface SessionGroup {
  date: string;
  dateLabel: string;
  source: 'modo_treino' | 'modo_prova' | 'mixed';
  attempts: AttemptRecord[];
  correct: number;
  total: number;
  accuracy: number;
}

interface MacroPerformance {
  macro: string;
  correct: number;
  total: number;
  accuracy: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function HistoricoQuestoes() {
  const { user } = useAuth();
  const [sourceFilter, setSourceFilter] = useState<'all' | 'modo_treino' | 'modo_prova'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // ⚡ Fetch de tentativas com dados das questões
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['student-history-detailed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('question_attempts')
        .select(`
          id,
          question_id,
          selected_answer,
          is_correct,
          xp_earned,
          created_at,
          source,
          quiz_questions:question_id (
            macro,
            micro,
            difficulty
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('[HISTÓRICO] Erro ao buscar tentativas:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        question_id: item.question_id,
        selected_answer: item.selected_answer,
        is_correct: item.is_correct,
        xp_earned: item.xp_earned,
        created_at: item.created_at,
        source: item.source || 'modo_treino',
        question: item.quiz_questions || null
      })) as AttemptRecord[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // ============================================
  // FILTROS APLICADOS
  // ============================================

  const filteredAttempts = useMemo(() => {
    let result = [...attempts];

    // Filtro por source
    if (sourceFilter !== 'all') {
      result = result.filter(a => {
        if (sourceFilter === 'modo_prova') {
          return a.source === 'modo_prova';
        }
        return !a.source || a.source === 'modo_treino';
      });
    }

    // Filtro por tempo
    if (timeFilter !== 'all') {
      result = result.filter(a => {
        const date = parseISO(a.created_at);
        switch (timeFilter) {
          case 'today': return isToday(date);
          case 'week': return isThisWeek(date, { weekStartsOn: 0 });
          case 'month': return isThisMonth(date);
          default: return true;
        }
      });
    }

    return result;
  }, [attempts, sourceFilter, timeFilter]);

  // ============================================
  // MÉTRICAS RESUMIDAS
  // ============================================

  const metrics = useMemo(() => {
    const total = filteredAttempts.length;
    const correct = filteredAttempts.filter(a => a.is_correct).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    // Agrupar por macro
    const byMacro = new Map<string, { correct: number; total: number }>();
    filteredAttempts.forEach(a => {
      const macro = a.question?.macro || 'Sem categoria';
      const current = byMacro.get(macro) || { correct: 0, total: 0 };
      current.total++;
      if (a.is_correct) current.correct++;
      byMacro.set(macro, current);
    });

    const macroPerformance: MacroPerformance[] = Array.from(byMacro.entries())
      .map(([macro, stats]) => ({
        macro,
        ...stats,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    // Agrupar por sessão (dia + source)
    const sessionMap = new Map<string, SessionGroup>();
    filteredAttempts.forEach(a => {
      const dateKey = startOfDay(parseISO(a.created_at)).toISOString();
      const source = a.source === 'modo_prova' ? 'modo_prova' : 'modo_treino';
      const groupKey = `${dateKey}_${source}`;
      
      if (!sessionMap.has(groupKey)) {
        const date = parseISO(a.created_at);
        let dateLabel = format(date, "dd/MM/yyyy", { locale: ptBR });
        if (isToday(date)) dateLabel = 'Hoje';
        else if (isYesterday(date)) dateLabel = 'Ontem';

        sessionMap.set(groupKey, {
          date: dateKey,
          dateLabel,
          source,
          attempts: [],
          correct: 0,
          total: 0,
          accuracy: 0
        });
      }
      
      const group = sessionMap.get(groupKey)!;
      group.attempts.push(a);
      group.total++;
      if (a.is_correct) group.correct++;
      group.accuracy = (group.correct / group.total) * 100;
    });

    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { total, correct, accuracy, macroPerformance, sessions };
  }, [filteredAttempts]);

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════════
          FILTROS: Source + Tempo
      ══════════════════════════════════════════════════════════════ */}
      <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por:</span>
            </div>

            {/* Filtro por Source */}
            <Tabs value={sourceFilter} onValueChange={(v) => setSourceFilter(v as any)} className="w-auto">
              <TabsList className="grid grid-cols-3 bg-muted/50 h-9">
                <TabsTrigger value="all" className="text-xs px-3">
                  📋 Todos
                </TabsTrigger>
                <TabsTrigger value="modo_treino" className="text-xs px-3">
                  <Play className="h-3 w-3 mr-1" />
                  Treino
                </TabsTrigger>
                <TabsTrigger value="modo_prova" className="text-xs px-3">
                  <FileText className="h-3 w-3 mr-1" />
                  Prova
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filtro por Tempo */}
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as any)}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          MÉTRICAS RESUMIDAS
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Resolvidas */}
        <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Resolvidas</p>
                <p className="text-2xl font-black text-amber-400">{metrics.total.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acerto Geral */}
        <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/5">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium">Acerto Geral</p>
                <p className="text-2xl font-black text-emerald-400">{metrics.accuracy.toFixed(1)}%</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <span className="text-emerald-400 font-semibold">{metrics.correct}</span>
                <span> / {metrics.total}</span>
              </div>
            </div>
            <Progress value={metrics.accuracy} className="h-1.5 mt-2 bg-muted/30" />
          </CardContent>
        </Card>

        {/* Sessões de Estudo */}
        <Card className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Sessões de Estudo</p>
                <p className="text-2xl font-black text-cyan-400">{metrics.sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PERFORMANCE POR MACRO
      ══════════════════════════════════════════════════════════════ */}
      {metrics.macroPerformance.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              Desempenho por Área
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {metrics.macroPerformance.slice(0, 5).map((item) => (
                <div key={item.macro} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[200px]">{item.macro}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {item.correct}/{item.total}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-semibold",
                          item.accuracy >= 80 ? "border-emerald-500/30 text-emerald-400" :
                          item.accuracy >= 60 ? "border-yellow-500/30 text-yellow-400" :
                          "border-red-500/30 text-red-400"
                        )}
                      >
                        {item.accuracy.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={item.accuracy} 
                    className={cn(
                      "h-1.5",
                      item.accuracy >= 80 ? "[&>div]:bg-emerald-500" :
                      item.accuracy >= 60 ? "[&>div]:bg-yellow-500" :
                      "[&>div]:bg-red-500"
                    )}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════
          LISTA DE SESSÕES
      ══════════════════════════════════════════════════════════════ */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Histórico de Sessões
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {metrics.sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma sessão encontrada</p>
              <p className="text-xs mt-1">Comece a praticar para ver seu histórico aqui!</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {metrics.sessions.map((session, idx) => (
                  <div
                    key={`${session.date}_${session.source}_${idx}`}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/30",
                      session.source === 'modo_prova' 
                        ? "border-cyan-500/20 bg-cyan-500/5" 
                        : "border-amber-500/20 bg-amber-500/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        session.source === 'modo_prova'
                          ? "bg-cyan-500/20"
                          : "bg-amber-500/20"
                      )}>
                        {session.source === 'modo_prova' ? (
                          <FileText className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Play className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{session.dateLabel}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1.5",
                              session.source === 'modo_prova'
                                ? "border-cyan-500/30 text-cyan-400"
                                : "border-amber-500/30 text-amber-400"
                            )}
                          >
                            {session.source === 'modo_prova' ? 'Modo Prova' : 'Modo Treino'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.total} questões respondidas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-400">{session.correct}</span>
                          <span className="text-xs text-muted-foreground">/ {session.total}</span>
                        </div>
                        <p className={cn(
                          "text-xs font-medium",
                          session.accuracy >= 80 ? "text-emerald-400" :
                          session.accuracy >= 60 ? "text-yellow-400" :
                          "text-red-400"
                        )}>
                          {session.accuracy.toFixed(0)}% acerto
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
