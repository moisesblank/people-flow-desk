// ============================================
// 🧠 FLASHCARDS EMBEDDED - Para /alunos/materiais
// Versão embedida do sistema de Flashcards
// Integrado à coleção "Flash Cards"
// ============================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  useDueFlashcards, 
  useAllFlashcards, 
  useRescheduleFlashcard,
  useCreateFlashcard,
  useReadyFlashcards,
  useReadyFlashcardsCount
} from '@/hooks/useFlashcards';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  RotateCcw, Zap, Check, X, Brain, 
  Sparkles, Plus, Target, 
  AlertTriangle, PartyPopper,
  BookOpen, Atom, FlaskConical, Leaf, Dna, Beaker,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { AnkiDashboard } from '@/components/aluno/flashcards/AnkiDashboard';
import FlashcardRenderer from '@/components/aluno/flashcards/FlashcardRenderer';
import { FlashcardsTutorial } from '@/components/aluno/flashcards/FlashcardsTutorial';

import '@/styles/flashcards-2300.css';

// 🎓 Tutorial localStorage key
const TUTORIAL_STORAGE_KEY = 'flashcards_tutorial_completed';

// 🎯 5 MACROS SOBERANOS — Taxonomia Questões (Constituição v10.4)
const MACRO_TAXONOMY = [
  { value: 'quimica_geral', label: 'Química Geral', icon: Beaker, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { value: 'fisico_quimica', label: 'Físico-Química', icon: Atom, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
  { value: 'quimica_organica', label: 'Química Orgânica', icon: FlaskConical, color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  { value: 'quimica_ambiental', label: 'Química Ambiental', icon: Leaf, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { value: 'bioquimica', label: 'Bioquímica', icon: Dna, color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
] as const;

type Rating = 1 | 2 | 3 | 4;

const RATING_BUTTONS = [
  { rating: 1 as Rating, label: 'Esqueci', emoji: '😓', variant: 'rating-button-again', color: 'text-red-500', interval: '<1min' },
  { rating: 2 as Rating, label: 'Difícil', emoji: '😅', variant: 'rating-button-hard', color: 'text-orange-500', interval: '~1d' },
  { rating: 3 as Rating, label: 'Bom', emoji: '😊', variant: 'rating-button-good', color: 'text-green-500', interval: '~3d' },
  { rating: 4 as Rating, label: 'Fácil', emoji: '🤩', variant: 'rating-button-easy', color: 'text-blue-500', interval: '~7d' },
];

interface FlashcardsEmbeddedProps {
  onBack: () => void;
}

export default function FlashcardsEmbedded({ onBack }: FlashcardsEmbeddedProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCramMode, setIsCramMode] = useState(false);
  const [isReadyMode, setIsReadyMode] = useState(false);
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, xpEarned: 0 });
  const [newCard, setNewCard] = useState({ question: '', answer: '' });

  // 🎓 Tutorial state - mostra na primeira visita
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window === 'undefined') return false;
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    return !completed;
  });

  const handleTutorialComplete = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
  }, []);

  const handleTutorialSkip = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
  }, []);

  // Organização inteligente (macro/tags)
  const [topicFilter, setTopicFilter] = useState<string>('all');

  const { data: dueCards, isLoading: isLoadingDue, refetch: refetchDue } = useDueFlashcards();
  const { data: allCards, isLoading: isLoadingAll, refetch: refetchAll } = useAllFlashcards();
  const { data: readyCards, isLoading: isLoadingReady, refetch: refetchReady } = useReadyFlashcards();
  const { data: readyCount } = useReadyFlashcardsCount();
  const rescheduleMutation = useRescheduleFlashcard();
  const createMutation = useCreateFlashcard();

  // Realtime sync
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('flashcards-embedded-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_flashcards',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['flashcards-due'] });
          queryClient.invalidateQueries({ queryKey: ['flashcards-all'] });
          queryClient.invalidateQueries({ queryKey: ['flashcard-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const baseCards = isReadyMode ? readyCards : (isCramMode ? allCards : dueCards);
  const isLoading = isReadyMode ? isLoadingReady : (isCramMode ? isLoadingAll : isLoadingDue);

  // 🎯 Organização por 5 MACROS (Taxonomia Questões - Constituição v10.4)
  // Usa as tags dos flashcards para mapear para os macros canônicos
  const macroStats = useMemo(() => {
    const list = baseCards || [];
    const stats = new Map<string, number>();

    for (const c of list) {
      const tags = (c as any)?.tags as string[] | null | undefined;
      for (const t of tags || []) {
        const tagLower = String(t).toLowerCase();
        // Mapear tags para macros canônicos
        if (tagLower.includes('geral') || tagLower.includes('inorg')) {
          stats.set('quimica_geral', (stats.get('quimica_geral') || 0) + 1);
        } else if (tagLower.includes('orgânica') || tagLower.includes('organica')) {
          stats.set('quimica_organica', (stats.get('quimica_organica') || 0) + 1);
        } else if (tagLower.includes('físico') || tagLower.includes('fisico') || tagLower.includes('eletro')) {
          stats.set('fisico_quimica', (stats.get('fisico_quimica') || 0) + 1);
        } else if (tagLower.includes('ambiental') || tagLower.includes('chuva') || tagLower.includes('polu')) {
          stats.set('quimica_ambiental', (stats.get('quimica_ambiental') || 0) + 1);
        } else if (tagLower.includes('bio') || tagLower.includes('proteína') || tagLower.includes('lipíd')) {
          stats.set('bioquimica', (stats.get('bioquimica') || 0) + 1);
        }
      }
    }

    return stats;
  }, [baseCards]);

  // Filtrar cards por macro selecionado
  const cards = useMemo(() => {
    if (!baseCards) return baseCards;
    if (!topicFilter || topicFilter === 'all') return baseCards;

    return baseCards.filter((c: any) => {
      const tags = (c.tags || []) as string[];
      return tags.some((t: string) => {
        const tagLower = String(t).toLowerCase();
        switch (topicFilter) {
          case 'quimica_geral':
            return tagLower.includes('geral') || tagLower.includes('inorg');
          case 'quimica_organica':
            return tagLower.includes('orgânica') || tagLower.includes('organica');
          case 'fisico_quimica':
            return tagLower.includes('físico') || tagLower.includes('fisico') || tagLower.includes('eletro');
          case 'quimica_ambiental':
            return tagLower.includes('ambiental') || tagLower.includes('chuva') || tagLower.includes('polu');
          case 'bioquimica':
            return tagLower.includes('bio') || tagLower.includes('proteína') || tagLower.includes('lipíd');
          default:
            return false;
        }
      });
    });
  }, [baseCards, topicFilter]);

  // Se filtro reduzir a lista, garante índice válido
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [topicFilter, isReadyMode, isCramMode]);

  const currentCard = cards?.[currentIndex];
  const isSessionComplete = currentIndex >= (cards?.length || 0) && (cards?.length || 0) > 0;

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleRating = async (rating: Rating) => {
    if (!currentCard) return;

    try {
      await rescheduleMutation.mutateAsync({
        flashcardId: currentCard.id,
        rating,
        currentStability: currentCard.stability,
        currentDifficulty: currentCard.difficulty,
      });

      const isCorrect = rating !== 1;
      const xpGained = isCorrect ? (rating === 4 ? 15 : 10) : 0;

      setSessionStats(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
        xpEarned: prev.xpEarned + xpGained,
      }));

      if (currentIndex < (cards?.length || 0) - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        setCurrentIndex(cards?.length || 0);
        setIsFlipped(false);
      }
    } catch (error) {
      toast.error('Erro ao salvar revisão');
    }
  };

  const startCramMode = () => {
    setIsCramMode(true);
    setIsCramModalOpen(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0, xpEarned: 0 });
    refetchAll();
  };

  const exitCramMode = () => {
    setIsCramMode(false);
    setIsReadyMode(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0, xpEarned: 0 });
    refetchDue();
  };

  const startReadyMode = () => {
    setIsReadyMode(true);
    setIsCramMode(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0, xpEarned: 0 });
    refetchReady();
  };

  const exitReadyMode = () => {
    setIsReadyMode(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0, xpEarned: 0 });
    refetchDue();
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0, xpEarned: 0 });
    if (isReadyMode) {
      refetchReady();
    } else if (isCramMode) {
      refetchAll();
    } else {
      refetchDue();
    }
  };

  const handleCreateCard = async () => {
    if (!newCard.question.trim() || !newCard.answer.trim()) {
      toast.error('Preencha pergunta e resposta');
      return;
    }

    try {
      await createMutation.mutateAsync({
        question: newCard.question,
        answer: newCard.answer,
      });
      toast.success('Flashcard criado com sucesso!');
      setNewCard({ question: '', answer: '' });
      setIsCreateModalOpen(false);
      refetchDue();
    } catch (error) {
      toast.error('Erro ao criar flashcard');
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-80 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ============================================
  // SESSION COMPLETE
  // ============================================
  if (isSessionComplete) {
    const accuracy = sessionStats.correct + sessionStats.incorrect > 0
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100)
      : 0;

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="session-complete-container"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="victory-icon-container"
          >
            <PartyPopper className="w-16 h-16 text-primary" />
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent"
          >
            Sessão Completa!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mb-8"
          >
            {isCramMode ? 'Modo Cram finalizado' : 'Parabéns pela dedicação!'}
          </motion.p>

          {/* Stats Orbs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8"
          >
            <div className="stats-orb orb-success">
              <Check className="w-6 h-6 text-green-500 mb-2" />
              <div className="text-3xl font-bold text-green-500">{sessionStats.correct}</div>
              <div className="text-xs text-muted-foreground">Corretos</div>
            </div>
            <div className="stats-orb orb-danger">
              <RotateCcw className="w-6 h-6 text-red-500 mb-2" />
              <div className="text-3xl font-bold text-red-500">{sessionStats.incorrect}</div>
              <div className="text-xs text-muted-foreground">Para revisar</div>
            </div>
            <div className="stats-orb orb-warning">
              <Zap className="w-6 h-6 text-amber-500 mb-2" />
              <div className="text-3xl font-bold text-amber-500">+{sessionStats.xpEarned}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </motion.div>

          {/* Accuracy */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-2 mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20 max-w-xs mx-auto"
          >
            <Target className="w-5 h-5 text-primary" />
            <span className="text-lg">Precisão: <strong className="text-primary text-2xl">{accuracy}%</strong></span>
          </motion.div>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button onClick={restartSession} size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
              <RotateCcw className="w-4 h-4 mr-2" />
              Nova Sessão
            </Button>
            {isCramMode && (
              <Button variant="outline" onClick={exitCramMode} size="lg">
                Voltar ao Normal
              </Button>
            )}
            <Button variant="ghost" onClick={onBack} size="lg">
              Voltar às Coleções
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (!cards || cards.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="empty-state-container"
        >
          <div className="empty-state-icon">
            <div className="text-7xl">🎉</div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            {isCramMode ? 'Nenhum flashcard disponível' : 'Parabéns!'}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {isCramMode
              ? 'Você ainda não criou nenhum flashcard. Crie agora!'
              : 'Nenhum card para revisar hoje. Volte amanhã para continuar sua jornada.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            {readyCount && readyCount > 0 && !isReadyMode && (
              <Button onClick={startReadyMode} size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <BookOpen className="w-4 h-4 mr-2" />
                Flashcards Prontos ({readyCount})
              </Button>
            )}
            <Button onClick={() => setIsCreateModalOpen(true)} size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
              <Plus className="w-4 h-4 mr-2" />
              Criar Flashcard
            </Button>
            {!isCramMode && !isReadyMode && allCards && allCards.length > 0 && (
              <Button variant="outline" onClick={() => setIsCramModalOpen(true)} size="lg" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500">
                <Zap className="w-4 h-4 mr-2" />
                Modo Cram
              </Button>
            )}
            {isReadyMode && (
              <Button variant="outline" onClick={exitReadyMode} size="lg" className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                Sair dos Prontos
              </Button>
            )}
          </div>
        </motion.div>

        {/* Anki Dashboard */}
        <div className="mt-12 anki-dashboard-container p-4 md:p-6">
          <AnkiDashboard className="!bg-transparent !border-0" defaultExpanded={true} />
        </div>

        {/* Modals */}
        <CreateFlashcardModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          newCard={newCard}
          setNewCard={setNewCard}
          onCreate={handleCreateCard}
          isLoading={createMutation.isPending}
        />
        <CramModeModal
          isOpen={isCramModalOpen}
          onClose={() => setIsCramModalOpen(false)}
          onConfirm={startCramMode}
        />
      </div>
    );
  }

  // ============================================
  // MAIN REVIEW UI
  // ============================================
  return (
    <div className="space-y-6">
      {/* 🎓 Tutorial de Onboarding */}
      <AnimatePresence>
        {showTutorial && (
          <FlashcardsTutorial
            onComplete={handleTutorialComplete}
            onSkip={handleTutorialSkip}
            className="mb-6"
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Oráculo da Memória
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {isReadyMode ? (
              <span className="flex items-center gap-1 text-emerald-500">
                <BookOpen className="w-3 h-3" />
                Flashcards Prontos ({cards?.length || 0})
              </span>
            ) : isCramMode ? (
              <span className="flex items-center gap-1 text-amber-500">
                <Zap className="w-3 h-3" />
                Modo Cram ativado
              </span>
            ) : (
              `${cards?.length || 0} cards para revisar`
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isReadyMode ? (
            <Button variant="outline" size="sm" onClick={exitReadyMode} className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
              Sair dos Prontos
            </Button>
          ) : isCramMode ? (
            <Button variant="outline" size="sm" onClick={exitCramMode} className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
              Sair do Cram
            </Button>
          ) : (
            <>
              {readyCount && readyCount > 0 && (
                <Button variant="outline" size="sm" onClick={startReadyMode} className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Prontos ({readyCount})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsCramModalOpen(true)} className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                <Zap className="w-4 h-4 mr-1" />
                Cram
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowTutorial(true)}
            title="Ver tutorial"
            className="text-muted-foreground hover:text-primary"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>

        {/* 🎯 5 MACROS SOBERANOS — Taxonomia Questões (Constituição v10.4) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={topicFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTopicFilter('all')}
            className="text-xs"
          >
            Todos
            <Badge variant="secondary" className="ml-1.5 text-[10px]">{baseCards?.length || 0}</Badge>
          </Button>
          {MACRO_TAXONOMY.map(macro => {
            const count = macroStats.get(macro.value) || 0;
            const Icon = macro.icon;
            const isActive = topicFilter === macro.value;
            return (
              <Button
                key={macro.value}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setTopicFilter(macro.value)}
                className={cn(
                  "text-xs transition-all",
                  isActive && cn(macro.bgColor, macro.borderColor, macro.color),
                  !isActive && "hover:bg-muted/50"
                )}
                disabled={count === 0}
              >
                <Icon className={cn("w-3.5 h-3.5 mr-1", isActive ? macro.color : "text-muted-foreground")} />
                {macro.label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px]">{count}</Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Card <span className="text-foreground font-medium">{currentIndex + 1}</span> de <span className="text-foreground font-medium">{cards.length}</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-green-500">
              <Check className="w-4 h-4" />
              <span className="font-medium">{sessionStats.correct}</span>
            </span>
            <span className="flex items-center gap-1.5 text-red-500">
              <X className="w-4 h-4" />
              <span className="font-medium">{sessionStats.incorrect}</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-500">
              <Zap className="w-4 h-4" />
              <span className="font-medium">+{sessionStats.xpEarned}</span>
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-energy-bar">
          <div 
            className="progress-energy-fill" 
            style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard - 3D Holographic */}
      <div className="flashcard-3d-container" onClick={handleFlip}>
        <motion.div
          className="flashcard-holographic relative w-full min-h-[360px] md:min-h-[400px] cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          {/* Corner Accents */}
          <div className="flashcard-corner-accent top-left" />
          <div className="flashcard-corner-accent top-right" />
          <div className="flashcard-corner-accent bottom-left" />
          <div className="flashcard-corner-accent bottom-right" />

          {/* Front - Question */}
          <div 
            className="flashcard-face-front"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Badge variant="outline" className="absolute top-4 left-4 text-xs bg-background/80">
              {currentCard?.state === 'new' ? '✨ Novo' : currentCard?.state}
            </Badge>
            <Badge variant="outline" className="absolute top-4 right-4 text-xs bg-background/80">
              Reps: {currentCard?.reps || 0}
            </Badge>
            
            <Brain className="w-14 h-14 text-primary/20 mb-4" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Pergunta</p>
            <div className="text-base md:text-lg font-medium text-center leading-relaxed max-w-lg mx-auto">
              <FlashcardRenderer content={currentCard?.question} showClozeAnswer={false} />
            </div>
            <p className="text-sm text-muted-foreground mt-8 animate-pulse flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
              Clique para revelar
            </p>
          </div>

          {/* Back - Answer */}
          <div 
            className="flashcard-face-back"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <Sparkles className="w-14 h-14 text-primary/30 mb-4" />
            <p className="text-xs text-primary/70 uppercase tracking-widest mb-3">Resposta</p>
            <div className="text-base md:text-lg font-medium text-center leading-relaxed max-w-lg mx-auto">
              <FlashcardRenderer content={currentCard?.answer} showClozeAnswer={true} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rating Buttons - HUD Style */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-4 gap-2 md:gap-3"
          >
            {RATING_BUTTONS.map(({ rating, label, emoji, variant, color, interval }) => (
              <button
                key={rating}
                onClick={() => handleRating(rating)}
                disabled={rescheduleMutation.isPending}
                className={cn(
                  'rating-button-hud flex flex-col items-center justify-center py-4 md:py-5 px-2 border border-border/50 bg-card/50 hover:bg-card transition-all',
                  variant,
                  rescheduleMutation.isPending && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-2xl md:text-3xl mb-1">{emoji}</span>
                <span className={cn('text-xs font-bold', color)}>{label}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{interval}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tip */}
      {!isFlipped && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground bg-primary/5 py-3 px-4 rounded-xl border border-primary/10"
        >
          💡 Tente lembrar antes de revelar. A memória se fortalece com o esforço!
        </motion.p>
      )}

      {/* Anki Dashboard - Aberto por padrão */}
      <div className="mt-8 anki-dashboard-container p-4 md:p-6">
        <AnkiDashboard className="!bg-transparent !border-0" defaultExpanded={true} />
      </div>

      {/* Modals */}
      <CreateFlashcardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        newCard={newCard}
        setNewCard={setNewCard}
        onCreate={handleCreateCard}
        isLoading={createMutation.isPending}
      />
      <CramModeModal
        isOpen={isCramModalOpen}
        onClose={() => setIsCramModalOpen(false)}
        onConfirm={startCramMode}
      />
    </div>
  );
}

// ============================================
// MODAL: Criar Flashcard
// ============================================
function CreateFlashcardModal({
  isOpen,
  onClose,
  newCard,
  setNewCard,
  onCreate,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  newCard: { question: string; answer: string };
  setNewCard: (card: { question: string; answer: string }) => void;
  onCreate: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            Criar Novo Flashcard
          </DialogTitle>
          <DialogDescription>
            Adicione uma pergunta e resposta para memorizar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block text-primary/80">Pergunta</label>
            <Textarea
              placeholder="Digite a pergunta..."
              value={newCard.question}
              onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
              rows={3}
              className="border-primary/20 focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-primary/80">Resposta</label>
            <Textarea
              placeholder="Digite a resposta..."
              value={newCard.answer}
              onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
              rows={3}
              className="border-primary/20 focus:border-primary/50"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onCreate} disabled={isLoading} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
            {isLoading ? 'Criando...' : 'Criar Flashcard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MODAL: Modo Cram
// ============================================
function CramModeModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-amber-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            Ativar Modo Cram?
          </DialogTitle>
        </DialogHeader>
        <div className="text-muted-foreground py-4">
          <p className="mb-4">
            O Modo Cram ignora o agendamento do algoritmo FSRS e permite que você revise 
            <strong className="text-foreground"> todos os seus flashcards</strong> em sequência.
          </p>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-500">
              Use com sabedoria — a repetição espaçada é mais eficiente para memorização de longo prazo.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-500/90 hover:to-orange-600/90">
            <Zap className="w-4 h-4 mr-2" />
            Ativar Cram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
