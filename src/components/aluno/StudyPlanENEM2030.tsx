// ============================================
// PLANO DE ESTUDOS ENEM 2030 (FUSÃO v2)
// Cronograma inteligente + Countdown + Quotes
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Target,
  Brain,
  TrendingUp,
  CheckCircle2,
  Flame,
  BookOpen,
  Trophy,
  Sparkles,
  Play,
  BarChart3,
  AlertCircle,
  Zap,
  Rocket,
  Star,
  Quote
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Hooks de dados reais
import { useStudentDailyGoals, useLastWatchedLesson, usePendingFlashcards, useStudentInsights } from "@/hooks/useStudentDailyGoals";
import { useGamification } from "@/hooks/useGamification";

// ============================================
// QUOTES MOTIVACIONAIS DO PROF. MOISÉS
// ============================================
const motivationalQuotes = [
  { quote: "A química do sucesso é estudo + persistência!", author: "Prof. Moisés" },
  { quote: "Cada questão resolvida te aproxima da aprovação!", author: "Prof. Moisés" },
  { quote: "Você não precisa ser perfeito, só precisa não desistir!", author: "Prof. Moisés" },
  { quote: "O ENEM não é sobre sorte, é sobre preparação!", author: "Prof. Moisés" },
  { quote: "Transforme a ansiedade em foco!", author: "Prof. Moisés" },
  { quote: "Cada átomo de esforço conta!", author: "Prof. Moisés" },
  { quote: "Medicina te espera. Continue!", author: "Prof. Moisés" },
  { quote: "A reação mais importante é a sua determinação!", author: "Prof. Moisés" },
];

// ============================================
// MILESTONES DE URGÊNCIA
// ============================================
const milestones = [
  { days: 365, message: "1 ano para o ENEM! Vamos começar forte! 🚀", color: "text-cyan-400" },
  { days: 180, message: "6 meses! Hora de intensificar! 💪", color: "text-blue-400" },
  { days: 90, message: "3 meses! Revisão intensa! 🔥", color: "text-amber-400" },
  { days: 30, message: "1 mês! Sprint final! ⚡", color: "text-orange-400" },
  { days: 7, message: "1 semana! Mantenha a calma! 🧘", color: "text-red-400" },
  { days: 1, message: "Amanhã é o grande dia! Você está pronto! 🏆", color: "text-pink-400" },
];

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  percentage: number;
}

interface StudyBlock {
  id: string;
  time: string;
  subject: string;
  topic: string;
  duration: number;
  type: 'video' | 'exercises' | 'revision' | 'simulado' | 'break';
  completed: boolean;
  xp: number;
  isReal?: boolean; // Flag para indicar se é dado real ou sugestão IA
  actionPath?: string; // Caminho de navegação
}

interface DailyPlan {
  date: Date;
  dayName: string;
  blocks: StudyBlock[];
  totalHours: number;
  completedHours: number;
}

export function StudyPlanENEM2030() {
  const navigate = useNavigate();
  
  // Hooks de dados reais
  const { data: dailyGoals, isLoading: goalsLoading } = useStudentDailyGoals();
  const { data: lastLesson } = useLastWatchedLesson();
  const { data: flashcards } = usePendingFlashcards();
  const { data: insights } = useStudentInsights();
  const { gamification, levelInfo } = useGamification();
  
  const streak = gamification?.current_streak || 0;

  // ============================================
  // COUNTDOWN ENEM
  // ============================================
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [quote, setQuote] = useState(motivationalQuotes[0]);
  
  // Data do ENEM 2026 (15 de Novembro)
  const enemDate = new Date('2026-11-15T13:00:00');
  const startDate = new Date('2025-11-15T00:00:00'); // 1 ano antes

  useEffect(() => {
    // Quote do dia baseado no dia do ano
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setQuote(motivationalQuotes[dayOfYear % motivationalQuotes.length]);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = enemDate.getTime() - now.getTime();
      const totalTime = enemDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, percentage: 100 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const percentage = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));

      setTimeLeft({ days, hours, minutes, seconds, percentage });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getMilestoneMessage = () => {
    if (!timeLeft) return null;
    const milestone = milestones.find(m => timeLeft.days <= m.days);
    return milestone;
  };

  // Gera plano híbrido: dados reais + sugestões IA
  const currentPlan = useMemo<DailyPlan | null>(() => {
    const today = new Date();
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    const blocks: StudyBlock[] = [];
    let timeSlot = 7; // Começa às 7h

    const formatTime = (hour: number, minute: number = 0) => 
      `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // 1. Bloco baseado na última aula assistida (DADO REAL)
    if (lastLesson) {
      blocks.push({
        id: 'real-video-1',
        time: formatTime(timeSlot),
        subject: 'Continuar Aula',
        topic: lastLesson.title || 'Aula em andamento',
        duration: 45,
        type: 'video',
        completed: false,
        xp: 50,
        isReal: true,
        actionPath: `/alunos/aula/${lastLesson.lessonId}`
      });
      timeSlot += 1;
    } else {
      // Sugestão IA: Começar nova aula
      blocks.push({
        id: 'ia-video-1',
        time: formatTime(timeSlot),
        subject: insights?.weakestArea?.name || 'Química Geral',
        topic: 'Começar novo conteúdo',
        duration: 60,
        type: 'video',
        completed: false,
        xp: 50,
        isReal: false,
        actionPath: '/alunos/modulos'
      });
      timeSlot += 1;
    }

    // Pausa curta
    blocks.push({
      id: 'break-1',
      time: formatTime(timeSlot),
      subject: 'Pausa',
      topic: 'Descanso ativo (5 min)',
      duration: 5,
      type: 'break',
      completed: false,
      xp: 0
    });
    timeSlot += 0.25;

    // 2. Bloco de Flashcards/Revisão (DADO REAL se houver pendentes)
    if (flashcards && flashcards.count > 0) {
      blocks.push({
        id: 'real-revision-1',
        time: formatTime(Math.floor(timeSlot), Math.round((timeSlot % 1) * 60)),
        subject: 'Flashcards Pendentes',
        topic: `${flashcards.count} cards para revisar`,
        duration: Math.min(30, flashcards.count * 2),
        type: 'revision',
        completed: false,
        xp: flashcards.count * 5,
        isReal: true,
        actionPath: '/alunos/materiais'
      });
      timeSlot += 0.5;
    }

    // 3. Bloco de Questões baseado nas metas do dia (DADO REAL)
    const questoesMeta = dailyGoals?.questoes || { current: 0, target: 30 };
    const questoesFaltando = Math.max(0, questoesMeta.target - questoesMeta.current);
    
    if (questoesFaltando > 0) {
      blocks.push({
        id: 'real-exercises-1',
        time: formatTime(Math.floor(timeSlot), Math.round((timeSlot % 1) * 60)),
        subject: 'Treino de Questões',
        topic: `${questoesFaltando} questões para meta diária`,
        duration: Math.min(60, questoesFaltando * 2),
        type: 'exercises',
        completed: questoesMeta.current >= questoesMeta.target,
        xp: questoesFaltando * 3,
        isReal: true,
        actionPath: '/alunos/questoes'
      });
      timeSlot += 1;
    }

    // Pausa almoço
    blocks.push({
      id: 'break-lunch',
      time: '12:00',
      subject: 'Almoço',
      topic: 'Pausa para refeição',
      duration: 60,
      type: 'break',
      completed: false,
      xp: 0
    });

    // 4. Sugestão IA baseada na área mais fraca
    if (insights?.weakestArea) {
      blocks.push({
        id: 'ia-revision-2',
        time: '14:00',
        subject: `Revisão: ${insights.weakestArea.name}`,
        topic: `Acurácia atual: ${insights.weakestArea.accuracy}%`,
        duration: 30,
        type: 'revision',
        completed: false,
        xp: 40,
        isReal: false,
        actionPath: '/alunos/questoes'
      });
    }

    // 5. Mini-Simulado (Sugestão IA)
    blocks.push({
      id: 'ia-simulado-1',
      time: '14:45',
      subject: 'Mini-Simulado',
      topic: '15 questões ENEM',
      duration: 45,
      type: 'simulado',
      completed: false,
      xp: 100,
      isReal: false,
      actionPath: '/alunos/simulados'
    });

    // Pausa tarde
    blocks.push({
      id: 'break-2',
      time: '15:30',
      subject: 'Pausa',
      topic: 'Descanso ativo',
      duration: 15,
      type: 'break',
      completed: false,
      xp: 0
    });

    // 6. Bloco final baseado na área forte (reforço)
    if (insights?.strongestArea) {
      blocks.push({
        id: 'ia-video-2',
        time: '15:45',
        subject: insights.strongestArea.name,
        topic: 'Aprofundar conhecimento',
        duration: 45,
        type: 'video',
        completed: false,
        xp: 50,
        isReal: false,
        actionPath: '/alunos/modulos'
      });
    }

    // Calcular horas
    const studyBlocks = blocks.filter(b => b.type !== 'break');
    const completedBlocks = studyBlocks.filter(b => b.completed);
    const totalMinutes = studyBlocks.reduce((sum, b) => sum + b.duration, 0);
    const completedMinutes = completedBlocks.reduce((sum, b) => sum + b.duration, 0);

    return {
      date: today,
      dayName: dayNames[today.getDay()],
      blocks,
      totalHours: totalMinutes / 60,
      completedHours: completedMinutes / 60
    };
  }, [dailyGoals, lastLesson, flashcards, insights]);

  const [localPlan, setLocalPlan] = useState<DailyPlan | null>(null);

  useEffect(() => {
    if (currentPlan) {
      setLocalPlan(currentPlan);
    }
  }, [currentPlan]);

  const toggleBlock = (blockId: string) => {
    if (!localPlan) return;
    setLocalPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b => 
          b.id === blockId ? { ...b, completed: !b.completed } : b
        )
      };
    });
  };

  const handleBlockAction = (block: StudyBlock) => {
    if (block.actionPath) {
      navigate(block.actionPath);
    }
  };

  const getTypeIcon = (type: StudyBlock['type']) => {
    switch (type) {
      case 'video': return Play;
      case 'exercises': return Target;
      case 'revision': return Brain;
      case 'simulado': return Trophy;
      case 'break': return Clock;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: StudyBlock['type']) => {
    switch (type) {
      case 'video': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'exercises': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'revision': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'simulado': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'break': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  if (goalsLoading || !localPlan) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5">
        <CardContent className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
          <span className="ml-3 text-muted-foreground">Gerando seu plano de estudos...</span>
        </CardContent>
      </Card>
    );
  }

  const dailyProgress = (localPlan.blocks.filter(b => b.completed && b.type !== 'break').length / 
    localPlan.blocks.filter(b => b.type !== 'break').length) * 100;

  const weeklyProgress = dailyGoals 
    ? Math.round((dailyGoals.questoes.current / dailyGoals.questoes.target) * 100)
    : 0;

  const milestone = getMilestoneMessage();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 overflow-hidden relative">
      {/* Background Glow Sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 pointer-events-none" />
      
      <CardHeader className="pb-2 relative">
        {/* ============================================ */}
        {/* COUNTDOWN COMPACTO + QUOTE */}
        {/* ============================================ */}
        {timeLeft && (
          <div className="mb-4 relative overflow-hidden">
            {/* ============================================ */}
            {/* COUNTDOWN HERO - YEAR 2300 CINEMATIC */}
            {/* ============================================ */}
            <div className="relative p-4 md:p-6 rounded-2xl bg-gradient-to-br from-red-950/80 via-black/90 to-orange-950/60 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
              {/* Glow Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-orange-500/5 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              
              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Countdown Principal */}
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Ícone Animado */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="relative p-3 md:p-4 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 shadow-lg shadow-red-500/30"
                  >
                    <Rocket className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                  </motion.div>
                  
                  {/* Timer Display */}
                  <div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-red-400/80 font-medium mb-2 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>ENEM 2026 — 15 de Novembro</span>
                    </div>
                    
                    {/* DIAS E HORAS - APENAS */}
                    <div className="flex items-center gap-3 md:gap-4">
                      {/* DIAS */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "text-4xl md:text-6xl font-black tabular-nums tracking-tight leading-none",
                          "bg-gradient-to-b from-white via-red-100 to-red-300 bg-clip-text text-transparent",
                          "drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                        )}>
                          {String(timeLeft.days).padStart(3, '0')}
                        </div>
                        <span className="text-[10px] md:text-xs text-red-400/70 font-semibold uppercase tracking-widest mt-1">
                          Dias
                        </span>
                      </div>
                      
                      {/* Separador */}
                      <div className="flex flex-col gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                      </div>
                      
                      {/* HORAS */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "text-4xl md:text-6xl font-black tabular-nums tracking-tight leading-none",
                          "bg-gradient-to-b from-white via-orange-100 to-orange-300 bg-clip-text text-transparent",
                          "drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                        )}>
                          {String(timeLeft.hours).padStart(2, '0')}
                        </div>
                        <span className="text-[10px] md:text-xs text-orange-400/70 font-semibold uppercase tracking-widest mt-1">
                          Horas
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quote do Dia */}
                <div className="flex-1 max-w-sm lg:max-w-md lg:text-right">
                  <div className="flex items-start gap-2 lg:justify-end">
                    <Quote className="w-4 h-4 text-red-500/40 flex-shrink-0 mt-0.5 lg:order-2" />
                    <div className="lg:text-right">
                      <p className="text-foreground/70 italic leading-tight text-sm">"{quote.quote}"</p>
                      <p className="text-xs text-muted-foreground mt-1">— {quote.author}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress da Jornada - Barra Holográfica */}
              <div className="mt-4 pt-4 border-t border-red-500/20">
                <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Jornada de Preparação
                  </span>
                  <span className="font-mono text-red-400">{timeLeft.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 md:h-2.5 bg-black/50 rounded-full overflow-hidden border border-red-500/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${timeLeft.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  />
                </div>
              </div>

              {/* Milestone Alert */}
              {milestone && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-3 flex items-center gap-2 text-xs font-semibold p-2.5 rounded-lg border",
                    timeLeft.days <= 7 
                      ? "bg-red-500/10 text-red-400 border-red-500/30" 
                      : timeLeft.days <= 30 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                        : "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  <Star className="w-4 h-4" />
                  {milestone.message}
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* HEADER DO PLANO DE ESTUDOS */}
        {/* ============================================ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-primary to-cyan-500"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Calendar className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                Plano de Estudos
                <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30">
                  <Flame className="w-3 h-3 mr-1" />
                  {streak} dias
                </Badge>
              </CardTitle>
              <CardDescription>
                {localPlan.dayName}, {localPlan.date.toLocaleDateString('pt-BR')}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{Math.round(dailyProgress)}%</div>
            <div className="text-xs text-muted-foreground">concluído hoje</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso do dia</span>
              <span>{localPlan.completedHours.toFixed(1)}h / {localPlan.totalHours.toFixed(1)}h</span>
            </div>
            <Progress value={dailyProgress} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Meta de questões</span>
              <span>{dailyGoals?.questoes.current || 0}/{dailyGoals?.questoes.target || 30}</span>
            </div>
            <Progress value={weeklyProgress} className="h-2" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-2">
            {localPlan.blocks.map((block, index) => {
              const Icon = getTypeIcon(block.type);
              const isBreak = block.type === 'break';
              
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !isBreak && handleBlockAction(block)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    !isBreak && "cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                    block.completed && !isBreak && "bg-green-500/5 border-green-500/30",
                    getTypeColor(block.type)
                  )}
                >
                  {/* Time */}
                  <div className="w-12 text-xs font-mono text-muted-foreground">
                    {block.time}
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {block.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{block.subject}</span>
                      {block.isReal && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-primary/10 border-primary/30">
                          <Zap className="w-2 h-2 mr-0.5" />
                          Real
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {block.topic}
                    </div>
                  </div>

                  {/* Duration & XP */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-muted-foreground">{block.duration} min</div>
                    {block.xp > 0 && (
                      <Badge variant="secondary" className="text-[10px] mt-0.5">
                        +{block.xp} XP
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <ScrollBar orientation="vertical" alwaysShow />
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>
              {insights?.suggestion || 'Plano gerado pela IA baseado no seu desempenho'}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => navigate('/alunos/questoes')}
          >
            <BarChart3 className="w-4 h-4" />
            Ver Análise
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default StudyPlanENEM2030;
