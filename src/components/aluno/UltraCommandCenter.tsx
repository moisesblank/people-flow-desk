// ============================================
// ULTRA COMMAND CENTER - SANTUÁRIO v10.0
// Central de Comando DEFINITIVA do Aluno
// Tudo automatizado, intuitivo e em tempo real
// Lei I: Performance | Lei IV: Poder do Usuário
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, Brain, Target, Clock, Flame, Trophy, 
  Play, BookOpen, RotateCcw, Sparkles, ChevronRight,
  AlertTriangle, CheckCircle2, Star, TrendingUp,
  Calendar, Timer, Rocket, Medal, Award, Coffee,
  Pause, Volume2, Headphones, Focus, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useErrorNotebookCount } from "@/hooks/useErrorNotebook";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { 
  useStudentDailyGoals, 
  useLastWatchedLesson, 
  usePendingFlashcards,
  useStudentInsights
} from "@/hooks/useStudentDailyGoals";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuickAction {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  route: string;
  gradient: string;
  badge?: number | string;
  priority: 'urgent' | 'high' | 'normal';
  xp?: number;
  onClick?: () => void;
}

export function UltraCommandCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();
  const { data: errorCount } = useErrorNotebookCount();
  const { gamification, levelInfo, userRank } = useGamification();
  const { data: dailyGoals, isLoading: goalsLoading } = useStudentDailyGoals();
  const { data: lastLesson } = useLastWatchedLesson();
  const { data: flashcardsPending } = usePendingFlashcards();
  const { data: insights } = useStudentInsights();
  
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyTimer, setStudyTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Timer de estudo em tempo real
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudyMode && !isPaused) {
      interval = setInterval(() => {
        setStudyTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudyMode, isPaused]);

  // Dias até o ENEM (calculado dinamicamente)
  const diasAteEnem = useMemo(() => {
    const enem2025 = new Date('2025-11-09');
    const hoje = new Date();
    const diff = Math.ceil((enem2025.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, []);

  // Progresso total das metas
  const totalProgress = useMemo(() => {
    if (!dailyGoals) return 0;
    const goals = [
      dailyGoals.questoes,
      dailyGoals.aulas,
      dailyGoals.revisoes,
      dailyGoals.tempo
    ];
    const sum = goals.reduce((acc, g) => acc + Math.min(1, g.current / g.target), 0);
    return Math.round((sum / goals.length) * 100);
  }, [dailyGoals]);

  // Ações rápidas ordenadas por prioridade
  const quickActions: QuickAction[] = useMemo(() => {
    const actions: QuickAction[] = [];
    
    // Erros pendentes = PRIORIDADE MÁXIMA
    if (errorCount && errorCount > 0) {
      actions.push({
        id: 'erros',
        label: 'Revisar Erros',
        sublabel: `${errorCount} questões aguardando`,
        icon: AlertTriangle,
        route: '/alunos/caderno-erros',
        gradient: 'from-red-500 to-orange-500',
        badge: errorCount,
        priority: 'urgent',
        xp: errorCount * 15
      });
    }

    // Flashcards pendentes
    if (flashcardsPending && flashcardsPending.count > 0) {
      actions.push({
        id: 'flashcards',
        label: 'Flashcards',
        sublabel: `${flashcardsPending.count} para revisar`,
        icon: Brain,
        route: '/alunos/materiais',
        gradient: 'from-purple-500 to-pink-500',
        badge: flashcardsPending.count,
        priority: 'high',
        xp: flashcardsPending.count * 5
      });
    }

    // Continuar última aula
    if (lastLesson) {
      actions.push({
        id: 'continuar-aula',
        label: 'Continuar Aula',
        sublabel: `${lastLesson.title} • ${lastLesson.progressPercent}%`,
        icon: Play,
        route: `/alunos/aula/${lastLesson.lessonId}`,
        gradient: 'from-green-500 to-emerald-500',
        priority: 'high',
        xp: 75
      });
    }

    // Treino rápido
    actions.push({
      id: 'treino',
      label: 'Treino Rápido',
      sublabel: '10 questões • 15 min',
      icon: Target,
      route: '/alunos/questoes',
      gradient: 'from-blue-500 to-cyan-500',
      priority: 'normal',
      xp: 100
    });

    // Simulado
    actions.push({
      id: 'simulado',
      label: 'Simulado ENEM',
      sublabel: 'Teste sua evolução',
      icon: Trophy,
      route: '/alunos/simulados',
      gradient: 'from-amber-500 to-yellow-500',
      priority: 'normal',
      xp: 200
    });

    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [errorCount, flashcardsPending, lastLesson]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startFocusMode = () => {
    setIsStudyMode(true);
    setStudyTimer(0);
    setIsPaused(false);
    toast.success('🎯 Modo Foco ativado! Bora estudar!');
  };

  const stopFocusMode = () => {
    setIsStudyMode(false);
    const minutes = Math.floor(studyTimer / 60);
    if (minutes > 0) {
      toast.success(`✨ Parabéns! Você estudou ${minutes} minutos!`);
    }
  };

  // Metas diárias formatadas
  const formattedGoals = useMemo(() => {
    if (!dailyGoals) return [];
    return [
      { 
        id: 'questoes', 
        label: 'Questões', 
        current: dailyGoals.questoes.current, 
        target: dailyGoals.questoes.target, 
        icon: Target,
        color: 'text-blue-500'
      },
      { 
        id: 'aulas', 
        label: 'Aulas', 
        current: dailyGoals.aulas.current, 
        target: dailyGoals.aulas.target, 
        icon: Play,
        color: 'text-purple-500'
      },
      { 
        id: 'revisoes', 
        label: 'Revisões', 
        current: dailyGoals.revisoes.current, 
        target: dailyGoals.revisoes.target, 
        icon: RotateCcw,
        color: 'text-orange-500'
      },
      { 
        id: 'tempo', 
        label: 'Tempo', 
        current: dailyGoals.tempo.current, 
        target: dailyGoals.tempo.target, 
        icon: Clock,
        color: 'text-green-500',
        unit: 'min'
      },
    ];
  }, [dailyGoals]);

  return (
    <div className="space-y-6">
      {/* MODO FOCO ATIVO */}
      <AnimatePresence>
        {isStudyMode && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <Card className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 border-0 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl animate-pulse">
                      <Focus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">MODO FOCO</div>
                      <div className="text-white/80 text-3xl font-mono font-black">
                        {formatTime(studyTimer)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsPaused(!isPaused)}
                    >
                      {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={stopFocusMode}
                    >
                      Encerrar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO: Status em Tempo Real */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-6"
      >
        {/* Partículas animadas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-5 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-5 right-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-yellow-400/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Saudação + Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-0 font-bold">
                  <Sparkles className="w-3 h-3 mr-1" />
                  NÍVEL {gamification?.current_level || 1} • {levelInfo?.title || 'Iniciante'}
                </Badge>
                <Badge className="bg-amber-500/30 text-amber-100 border-0">
                  <Flame className="w-3 h-3 mr-1" />
                  {gamification?.current_streak || 0} dias
                </Badge>
                {totalProgress === 100 && (
                  <Badge className="bg-green-500/30 text-green-100 border-0 animate-bounce">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Meta do dia ✓
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {diasAteEnem > 0 ? (
                  <>Faltam <span className="text-4xl font-black text-yellow-300">{diasAteEnem}</span> dias para o ENEM 🎯</>
                ) : (
                  <>É hora de brilhar! 🌟</>
                )}
              </h1>
              <p className="text-white/80">
                Cada minuto conta. Vamos transformar esse tempo em aprovação!
              </p>
            </div>

            {/* Stats rápidos */}
            <div className="flex items-center gap-3 flex-wrap">
              <motion.div 
                className="text-center bg-white/15 backdrop-blur-sm rounded-2xl p-4 min-w-[100px]"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Zap className="w-5 h-5 text-yellow-300" />
                  <span className="text-2xl font-black text-white">
                    {(gamification?.total_xp || 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-white/70">XP Total</div>
              </motion.div>

              <motion.div 
                className="text-center bg-white/15 backdrop-blur-sm rounded-2xl p-4 min-w-[100px]"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Medal className="w-5 h-5 text-amber-300" />
                  <span className="text-2xl font-black text-white">
                    #{userRank || '-'}
                  </span>
                </div>
                <div className="text-xs text-white/70">Ranking</div>
              </motion.div>

              {/* Botão Modo Foco */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={isStudyMode ? stopFocusMode : startFocusMode}
                  className={cn(
                    "h-auto py-3 px-5 font-bold rounded-2xl",
                    isStudyMode 
                      ? "bg-white text-primary hover:bg-white/90" 
                      : "bg-white/20 text-white hover:bg-white/30 border border-white/30"
                  )}
                >
                  <Focus className="w-5 h-5 mr-2" />
                  {isStudyMode ? 'Em Foco...' : 'Modo Foco'}
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Barra de Progresso do Nível */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Rocket className="w-4 h-4" />
                Próximo nível: {levelInfo?.title || 'Estudante'}
              </span>
              <span className="font-bold">
                {gamification?.total_xp || 0} / {levelInfo?.nextLevelXP || 1000} XP
              </span>
            </div>
            <Progress 
              value={levelInfo?.progressPercentage || 0} 
              className="h-3 bg-white/20"
            />
          </div>
        </div>
      </motion.div>

      {/* METAS DIÁRIAS - TEMPO REAL */}
      <Card className="border-2 border-primary/20 overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-purple-500/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              Meta do Dia
              {goalsLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">atualizando...</span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Progress value={totalProgress} className="w-24 h-2" />
              <Badge variant={totalProgress === 100 ? "default" : "outline"} className={cn(
                totalProgress === 100 && "bg-green-500"
              )}>
                {totalProgress}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formattedGoals.map((goal, idx) => {
              const percent = Math.min(100, (goal.current / goal.target) * 100);
              const isComplete = percent >= 100;
              const Icon = goal.icon;
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "relative p-4 rounded-2xl transition-all cursor-pointer hover:shadow-md",
                    isComplete 
                      ? "bg-green-500/10 border-2 border-green-500/30" 
                      : "bg-muted/50 hover:bg-muted"
                  )}
                  onClick={() => {
                    if (goal.id === 'questoes') navigate('/alunos/questoes');
                    if (goal.id === 'aulas') navigate('/alunos/videoaulas');
                    if (goal.id === 'revisoes') navigate('/alunos/caderno-erros');
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn("w-5 h-5", goal.color)} />
                    <span className="text-sm font-medium">{goal.label}</span>
                    {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                  </div>
                  <div className="text-2xl font-black">
                    {goal.current}
                    <span className="text-sm text-muted-foreground">/{goal.target}{goal.unit ? goal.unit : ''}</span>
                  </div>
                  <Progress value={percent} className="h-1.5 mt-2" />
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AÇÕES RÁPIDAS - PRIORIDADE AUTOMÁTICA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Próximo Passo
          </h2>
          <Badge variant="outline" className="text-muted-foreground">
            <Sparkles className="w-3 h-3 mr-1" />
            Ordenado por IA
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => action.onClick ? action.onClick() : navigate(action.route)}
              className={cn(
                "relative cursor-pointer rounded-2xl p-5 transition-all overflow-hidden group",
                action.priority === 'urgent' && "ring-2 ring-red-500/50 shadow-lg shadow-red-500/20"
              )}
            >
              {/* Background gradiente */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity",
                action.gradient
              )} />
              
              {/* Badge de prioridade */}
              {action.priority === 'urgent' && (
                <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0 animate-pulse">
                  Urgente
                </Badge>
              )}

              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl bg-gradient-to-br shrink-0",
                    action.gradient
                  )}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold truncate">{action.label}</h3>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{action.sublabel}</p>
                    
                    {action.xp && (
                      <div className="flex items-center gap-1 mt-2 text-amber-500">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-bold">+{action.xp} XP</span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* INSIGHT DA IA EM TEMPO REAL */}
      {insights && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold">💡 Insight Personalizado</h3>
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      IA
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {insights.suggestion}
                  </p>
                  {insights.weakestArea && insights.weakestArea.accuracy < 60 && (
                    <Button 
                      variant="link" 
                      className="text-purple-500 p-0 h-auto mt-2"
                      onClick={() => navigate('/alunos/questoes')}
                    >
                      Praticar {insights.weakestArea.name} agora →
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default UltraCommandCenter;
