// ============================================
// 📅 CRONOGRAMA MODAL CONTENT
// Conteúdo do modal de cronograma adaptativo
// 100% DADOS REAIS
// ============================================

import { memo, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Brain, 
  Target, 
  Zap, 
  Play, 
  RotateCcw,
  Timer,
  ChevronRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { 
  generateSchedule, 
  calculateScheduleStats,
  type StudyBlock,
  type AreaPerformance 
} from "@/lib/algorithms/studyPriority";

const getBlockIcon = (tipo: StudyBlock['tipo']) => {
  switch (tipo) {
    case 'aula': return Play;
    case 'revisao': return RotateCcw;
    case 'questoes': return Target;
    case 'flashcard': return Brain;
    case 'pausa': return Timer;
    default: return BookOpen;
  }
};

const getBlockGradient = (prioridade: StudyBlock['prioridade']) => {
  switch (prioridade) {
    case 'critica': return 'from-red-500 to-orange-500';
    case 'alta': return 'from-amber-500 to-yellow-500';
    case 'media': return 'from-blue-500 to-cyan-500';
    case 'baixa': return 'from-green-500 to-emerald-500';
  }
};

const getPriorityBg = (prioridade: StudyBlock['prioridade']) => {
  switch (prioridade) {
    case 'critica': return 'bg-red-500/10 border-red-500/30';
    case 'alta': return 'bg-amber-500/10 border-amber-500/30';
    case 'media': return 'bg-blue-500/10 border-blue-500/30';
    case 'baixa': return 'bg-green-500/10 border-green-500/30';
  }
};

export const CronogramaModalContent = memo(function CronogramaModalContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gamification } = useGamification();
  const streak = gamification?.current_streak || 0;

  const [selectedMinutes, setSelectedMinutes] = useState(60);
  const [activeTab, setActiveTab] = useState<"gerar" | "metas" | "historico">("gerar");

  // Buscar performance real do usuário por área
  const { data: performances, isLoading } = useQuery({
    queryKey: ['user-area-performance', user?.id],
    queryFn: async (): Promise<AreaPerformance[]> => {
      if (!user?.id) return [];

      // Buscar tentativas por macro
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('question_id, is_correct, created_at')
        .eq('user_id', user.id);

      if (!attempts || attempts.length === 0) {
        // Sem dados, retornar array vazio
        return [];
      }

      // Buscar as questões para pegar os macros
      // 🔒 FILTROS DE INTEGRIDADE PERMANENTES: Excluir questões com erros
      const questionIds = [...new Set(attempts.map(a => a.question_id))];
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, macro')
        .in('id', questionIds)
        .not('question_text', 'is', null)
        .neq('question_text', '')
        .not('explanation', 'is', null)
        .neq('explanation', '')
        .not('question_type', 'is', null)
        .neq('question_type', '');

      if (!questions) return [];

      // Agrupar por macro
      const macroMap = new Map<string, { correct: number; total: number; lastStudied: Date }>();
      
      for (const attempt of attempts) {
        const question = questions.find(q => q.id === attempt.question_id);
        const macro = question?.macro || 'Geral';
        
        const current = macroMap.get(macro) || { correct: 0, total: 0, lastStudied: new Date(0) };
        current.total += 1;
        if (attempt.is_correct) current.correct += 1;
        
        const attemptDate = new Date(attempt.created_at);
        if (attemptDate > current.lastStudied) {
          current.lastStudied = attemptDate;
        }
        
        macroMap.set(macro, current);
      }

      // Converter para AreaPerformance
      return Array.from(macroMap.entries()).map(([macro, data]) => ({
        areaId: macro,
        areaName: macro,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        lastStudied: data.lastStudied,
        pendingReviews: 0,
        weight: 0.1,
      }));
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Gerar cronograma baseado em dados reais (ou vazio)
  const schedule = useMemo(() => {
    if (!performances || performances.length === 0) return [];
    return generateSchedule(selectedMinutes, performances);
  }, [selectedMinutes, performances]);

  const stats = useMemo(() => calculateScheduleStats(schedule), [schedule]);

  // Áreas críticas (acurácia < 60%)
  const criticalAreas = useMemo(() => {
    if (!performances) return [];
    return performances
      .filter(a => a.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [performances]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="gerar" className="gap-2">
            <Calendar className="w-4 h-4" />
            Gerar
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-2">
            <Target className="w-4 h-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>
        
        {/* TAB: GERAR CRONOGRAMA */}
        <TabsContent value="gerar" className="space-y-6 mt-6">
          {/* Aviso se não há dados */}
          {(!performances || performances.length === 0) && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="py-6 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                <h3 className="font-bold mb-2">Dados Insuficientes</h3>
                <p className="text-muted-foreground text-sm">
                  Responda algumas questões para gerar um cronograma personalizado baseado no seu desempenho.
                </p>
                <Button className="mt-4" onClick={() => navigate('/alunos/questoes')}>
                  <Target className="w-4 h-4 mr-2" />
                  Fazer Questões
                </Button>
              </CardContent>
            </Card>
          )}

          {performances && performances.length > 0 && (
            <>
              {/* Seletor de tempo */}
              <Card className="border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Quanto tempo você tem hoje?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {[30, 60, 90, 120].map((mins) => (
                        <Button
                          key={mins}
                          variant={selectedMinutes === mins ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedMinutes(mins)}
                          className={cn(
                            "min-w-[60px]",
                            selectedMinutes === mins && "bg-gradient-to-r from-primary to-purple-600"
                          )}
                        >
                          {mins >= 60 ? `${mins / 60}h` : `${mins}min`}
                        </Button>
                      ))}
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Zap className="w-3 h-3 mr-1" />
                      +{stats.totalXP} XP estimado
                    </Badge>
                  </div>
                  
                  <Slider
                    value={[selectedMinutes]}
                    onValueChange={([v]) => setSelectedMinutes(v)}
                    min={15}
                    max={180}
                    step={15}
                    className="mt-4"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>15min</span>
                    <span>1h</span>
                    <span>2h</span>
                    <span>3h</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Cronograma gerado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de atividades */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Seu Cronograma
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {stats.blockCount} atividades
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {schedule.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma atividade gerada ainda.
                      </p>
                    ) : (
                      schedule.map((block, idx) => {
                        const Icon = getBlockIcon(block.tipo);
                        return (
                          <div
                            key={block.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]",
                              getPriorityBg(block.prioridade)
                            )}
                          >
                            <div className="text-xs text-muted-foreground w-8">
                              {idx + 1}.
                            </div>
                            <div className={cn(
                              "p-2 rounded-lg bg-gradient-to-br shrink-0",
                              getBlockGradient(block.prioridade)
                            )}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{block.titulo}</span>
                                {block.prioridade === 'critica' && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    URGENTE
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{block.motivo}</p>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <div className="text-sm font-bold">{block.duracao}min</div>
                              {block.xpEstimado > 0 && (
                                <div className="text-xs text-amber-500 flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  +{block.xpEstimado}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
                
                {/* Áreas críticas */}
                <div className="space-y-4">
                  {criticalAreas.length > 0 && (
                    <Card className="border-red-500/20 bg-red-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-red-500">
                          <AlertTriangle className="w-4 h-4" />
                          Áreas que Precisam de Atenção
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {criticalAreas.slice(0, 3).map((area) => (
                          <div key={area.areaId} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{area.areaName}</span>
                                <span className="text-xs text-red-500">{area.accuracy}%</span>
                              </div>
                              <Progress value={area.accuracy} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Botão de início */}
                  <Button 
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
                    onClick={() => navigate('/alunos/questoes')}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Iniciar Estudos
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* TAB: METAS */}
        <TabsContent value="metas" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Streak - DADO REAL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Streak Atual
                </CardTitle>
                <CardDescription>Dias consecutivos estudando</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-amber-500 mb-2">{streak} dias</div>
                  {streak > 0 && (
                    <div className="flex justify-center gap-1">
                      {Array.from({ length: Math.min(streak, 7) }).map((_, d) => (
                        <div key={d} className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Meta diária */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Meta Diária
                </CardTitle>
                <CardDescription>Seu objetivo para hoje</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-orange-500 mb-2">30 questões</div>
                  <p className="text-sm text-muted-foreground">Mantenha a consistência!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* TAB: HISTÓRICO */}
        <TabsContent value="historico" className="space-y-6 mt-6">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Histórico de estudos em desenvolvimento.</p>
              <p className="text-sm mt-2">Em breve você poderá visualizar sua evolução ao longo do tempo.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default CronogramaModalContent;
