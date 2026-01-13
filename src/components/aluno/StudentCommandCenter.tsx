// ============================================
// COMMAND CENTER DO ALUNO - SANTUÁRIO v9.1
// Tudo que o aluno precisa em UM CLIQUE
// Lei I: Performance | Lei IV: Poder do Usuário
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Zap, Brain, Target, Clock, Flame, Trophy, 
  Play, BookOpen, RotateCcw, Sparkles, ChevronRight,
  AlertTriangle, CheckCircle2, Star, TrendingUp,
  Calendar, Timer, Rocket, Medal, Award
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useErrorNotebook, useErrorNotebookCount } from "@/hooks/useErrorNotebook";
import { usePendingFlashcardsCount } from "@/hooks/useFlashcards";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  route: string;
  color: string;
  badge?: number | string;
  priority: 'urgent' | 'high' | 'normal';
  xp?: number;
}

interface DailyGoal {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  icon: React.ElementType;
}

export function StudentCommandCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: errorCount } = useErrorNotebookCount();
  const { data: pendingFlashcardsCount } = usePendingFlashcardsCount();
  const { gamification, levelInfo, userRank } = useGamification();
  
  // Dias até o ENEM (calculado dinamicamente)
  const diasAteEnem = useMemo(() => {
    const enem2025 = new Date('2025-11-09');
    const hoje = new Date();
    const diff = Math.ceil((enem2025.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, []);

  // Metas diárias (serão conectadas ao backend)
  const dailyGoals: DailyGoal[] = [
    { id: 'questoes', label: 'Questões', current: 15, target: 30, unit: 'q', icon: Target },
    { id: 'aulas', label: 'Aulas', current: 2, target: 3, unit: 'aulas', icon: Play },
    { id: 'revisoes', label: 'Revisões', current: 1, target: 2, unit: 'rev', icon: RotateCcw },
    { id: 'tempo', label: 'Tempo', current: 45, target: 120, unit: 'min', icon: Clock },
  ];

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
        color: 'from-red-500 to-orange-500',
        badge: errorCount,
        priority: 'urgent',
        xp: errorCount * 15
      });
    }

    // Flashcards para revisar (contagem dinâmica via FSRS)
    actions.push({
      id: 'flashcards',
      label: 'Flashcards',
      sublabel: pendingFlashcardsCount && pendingFlashcardsCount > 0 
        ? `${pendingFlashcardsCount} para revisar hoje` 
        : 'Revisão espaçada FSRS',
      icon: Brain,
      route: '/alunos/materiais',
      color: 'from-purple-500 to-pink-500',
      badge: pendingFlashcardsCount && pendingFlashcardsCount > 0 ? pendingFlashcardsCount : undefined,
      priority: pendingFlashcardsCount && pendingFlashcardsCount > 0 ? 'urgent' : 'high',
      xp: 50
    });

    // Treino rápido
    actions.push({
      id: 'treino',
      label: 'Treino Rápido',
      sublabel: '10 questões • 15 min',
      icon: Target,
      route: '/alunos/questoes',
      color: 'from-blue-500 to-cyan-500',
      priority: 'high',
      xp: 100
    });

    // Continuar aula
    actions.push({
      id: 'aula',
      label: 'Continuar Aula',
      sublabel: 'Eletroquímica - Pilhas',
      icon: Play,
      route: '/alunos/videoaulas',
      color: 'from-green-500 to-emerald-500',
      priority: 'normal',
      xp: 75
    });

    // Simulado
    actions.push({
      id: 'simulado',
      label: 'Simulado ENEM',
      sublabel: 'Teste sua evolução',
      icon: Trophy,
      route: '/alunos/simulados',
      color: 'from-amber-500 to-yellow-500',
      priority: 'normal',
      xp: 200
    });

    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [errorCount]);

  const totalDailyProgress = useMemo(() => {
    const total = dailyGoals.reduce((acc, g) => acc + (g.current / g.target), 0);
    return Math.min(100, (total / dailyGoals.length) * 100);
  }, [dailyGoals]);

  return (
    <div className="space-y-6">
      {/* HERO: Status em Tempo Real */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-6"
      >
        {/* Partículas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-5 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-5 right-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Saudação + Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-0 font-bold">
                  <Sparkles className="w-3 h-3 mr-1" />
                  NÍVEL {gamification?.current_level || 1} • {levelInfo?.title || 'Iniciante'}
                </Badge>
                <Badge className="bg-amber-500/30 text-amber-100 border-0">
                  <Flame className="w-3 h-3 mr-1" />
                  {gamification?.current_streak || 0} dias
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {diasAteEnem > 0 ? (
                  <>Faltam <span className="text-4xl font-black">{diasAteEnem}</span> dias para o ENEM 🎯</>
                ) : (
                  <>É hora de brilhar! 🌟</>
                )}
              </h1>
              <p className="text-white/80">
                Cada minuto conta. Vamos transformar esse tempo em aprovação!
              </p>
            </div>

            {/* Stats rápidos */}
            <div className="flex items-center gap-4">
              <motion.div 
                className="text-center bg-white/15 backdrop-blur-sm rounded-2xl p-4"
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
                className="text-center bg-white/15 backdrop-blur-sm rounded-2xl p-4"
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

      {/* METAS DIÁRIAS - Gamificação Visual */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              Meta do Dia
            </CardTitle>
            <Badge variant="outline" className="text-primary">
              {Math.round(totalDailyProgress)}% concluído
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dailyGoals.map((goal, idx) => {
              const percent = Math.min(100, (goal.current / goal.target) * 100);
              const isComplete = percent >= 100;
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "relative p-4 rounded-2xl transition-all",
                    isComplete 
                      ? "bg-green-500/10 border-2 border-green-500/30" 
                      : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <goal.icon className={cn(
                      "w-5 h-5",
                      isComplete ? "text-green-500" : "text-muted-foreground"
                    )} />
                    <span className="text-sm font-medium">{goal.label}</span>
                    {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                  </div>
                  <div className="text-2xl font-black">
                    {goal.current}<span className="text-sm text-muted-foreground">/{goal.target}</span>
                  </div>
                  <Progress value={percent} className="h-1.5 mt-2" />
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AÇÕES RÁPIDAS - O CORAÇÃO DA EXPERIÊNCIA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Ações Rápidas
          </h2>
          <Badge variant="outline" className="text-muted-foreground">
            Ordenado por prioridade
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
              onClick={() => navigate(action.route)}
              className={cn(
                "relative cursor-pointer rounded-2xl p-5 transition-all overflow-hidden group",
                action.priority === 'urgent' && "ring-2 ring-red-500/50 shadow-lg shadow-red-500/20"
              )}
            >
              {/* Background gradiente */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity",
                action.color
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
                    "p-3 rounded-2xl bg-gradient-to-br",
                    action.color
                  )}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{action.label}</h3>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{action.sublabel}</p>
                    
                    {action.xp && (
                      <div className="flex items-center gap-1 mt-2 text-amber-500">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-bold">+{action.xp} XP</span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* INSIGHT DA IA */}
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
                  <h3 className="font-bold">💡 Insight do TRAMON</h3>
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    IA
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {errorCount && errorCount > 0 ? (
                    <>
                      Você tem <strong className="text-red-500">{errorCount} questões</strong> no caderno de erros. 
                      Revisar erros é 3x mais eficiente que estudar conteúdo novo. 
                      <span className="text-primary font-medium"> Comece por elas!</span>
                    </>
                  ) : (
                    <>
                      Seu desempenho em <strong className="text-amber-500">Eletroquímica</strong> melhorou 23% esta semana! 
                      Continue assim e foque agora em <strong>Orgânica</strong> para equilibrar.
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default StudentCommandCenter;
