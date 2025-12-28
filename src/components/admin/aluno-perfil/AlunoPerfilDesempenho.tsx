// ============================================
// SEÇÃO DESEMPENHO DETALHADO DO ALUNO
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, TrendingUp, TrendingDown, Brain, Clock, 
  BarChart3, CheckCircle, XCircle, AlertTriangle
} from "lucide-react";
import { PresetEmptyState } from "@/components/ui/empty-state";

interface AlunoDesempenhoProps {
  userId: string | null;
  alunoId: string;
}

export function AlunoPerfilDesempenho({ userId, alunoId }: AlunoDesempenhoProps) {
  // Buscar tentativas de lições (questões respondidas)
  const { data: attempts } = useQuery({
    queryKey: ['aluno-lesson-attempts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar métricas de performance
  // Placeholder for performance metrics
  const performanceMetrics: any[] = [];

  // Calcular estatísticas
  const totalAttempts = attempts?.length || 0;
  const correctAttempts = attempts?.filter((a: any) => a.is_correct)?.length || 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const avgTimePerQuestion = attempts?.length > 0 
    ? Math.round(attempts.reduce((acc: number, a: any) => acc + (a.time_spent_seconds || 0), 0) / attempts.length)
    : 0;

  const hasData = totalAttempts > 0 || (performanceMetrics && performanceMetrics.length > 0);

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Target className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Desempenho Detalhado</h3>
          <p className="text-sm text-muted-foreground">Análise de performance em questões e simulados</p>
        </div>
      </div>

      {!hasData ? (
        <PresetEmptyState preset="noData" />
      ) : (
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">Total Questões</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalAttempts}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-muted-foreground">Acertos</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{correctAttempts}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-muted-foreground">Taxa de Acerto</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
                {accuracy >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : accuracy >= 50 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-muted-foreground">Tempo Médio</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{avgTimePerQuestion}s</p>
            </div>
          </div>

          {/* Barra de Progresso de Acertos */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Acerto Geral</span>
              <span className="text-foreground font-medium">{accuracy}%</span>
            </div>
            <Progress value={accuracy} className="h-3" />
          </div>

          {/* Últimas Tentativas */}
          {attempts && attempts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                Últimas 10 Questões
              </h4>
              <div className="grid grid-cols-10 gap-2">
                {attempts.slice(0, 10).map((attempt: any, idx: number) => (
                  <div 
                    key={attempt.id || idx}
                    className={`h-8 w-full rounded flex items-center justify-center ${
                      attempt.is_correct 
                        ? 'bg-green-500/20 border border-green-500/40' 
                        : 'bg-red-500/20 border border-red-500/40'
                    }`}
                  >
                    {attempt.is_correct ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Áreas Fortes e Fracas (placeholder) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="text-sm font-medium text-green-400 mb-2">Áreas Fortes</h4>
              <p className="text-sm text-muted-foreground">
                Análise disponível após mais questões respondidas
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <h4 className="text-sm font-medium text-red-400 mb-2">Áreas para Melhorar</h4>
              <p className="text-sm text-muted-foreground">
                Análise disponível após mais questões respondidas
              </p>
            </div>
          </div>
        </div>
      )}
    </FuturisticCard>
  );
}
