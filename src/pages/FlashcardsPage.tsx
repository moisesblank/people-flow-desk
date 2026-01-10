// ============================================
// PÁGINA DE FLASHCARDS - Oráculo da Memória
// Sistema FSRS v5 com Modo Cram
// Lei I: Performance | Lei IV: Poder do Arquiteto
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  useDueFlashcards, 
  useAllFlashcards, 
  useRescheduleFlashcard,
  useFlashcardStats,
  usePendingFlashcardsCount,
  useCreateFlashcard 
} from '@/hooks/useFlashcards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
  RotateCcw, Zap, Check, X, ThumbsUp, Brain, 
  Sparkles, Trophy, Flame, Plus, BookOpen,
  ChevronLeft, Target, Clock, TrendingUp,
  AlertTriangle, PartyPopper, ChartBar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AnkiDashboard } from '@/components/aluno/flashcards/AnkiDashboard';
import { FlashcardRenderer, processFlashcardText } from '@/components/aluno/flashcards/FlashcardRenderer';

type Rating = 1 | 2 | 3 | 4;

const RATING_BUTTONS = [
  { rating: 1 as Rating, label: 'Esqueci', emoji: '😓', color: 'border-red-500/30 hover:bg-red-500/10 hover:border-red-500 text-red-500', interval: '<1min' },
  { rating: 2 as Rating, label: 'Difícil', emoji: '😅', color: 'border-orange-500/10 hover:bg-orange-500/10 hover:border-orange-500 text-orange-500', interval: '~1d' },
  { rating: 3 as Rating, label: 'Bom', emoji: '😊', color: 'border-green-500/30 hover:bg-green-500/10 hover:border-green-500 text-green-500', interval: '~3d' },
  { rating: 4 as Rating, label: 'Fácil', emoji: '🤩', color: 'border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500 text-blue-500', interval: '~7d' },
];

// Processa texto do Anki (Cloze, HTML, etc) para exibição limpa
// Usa o processador centralizado do FlashcardRenderer
const processAnkiText = processFlashcardText;

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCramMode, setIsCramMode] = useState(false);
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, xpEarned: 0 });
  const [newCard, setNewCard] = useState({ question: '', answer: '' });

  const { data: dueCards, isLoading: isLoadingDue, refetch: refetchDue } = useDueFlashcards();
  const { data: allCards, isLoading: isLoadingAll, refetch: refetchAll } = useAllFlashcards();
  const { data: stats } = useFlashcardStats();
  const rescheduleMutation = useRescheduleFlashcard();
  const createMutation = useCreateFlashcard();

  // ============================================
  // REALTIME: Sincronização em tempo real
  // Atualiza automaticamente quando flashcards são criados/editados na gestão
  // ============================================
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('flashcards-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'study_flashcards',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Realtime] Flashcard change:', payload.eventType);
          
          // Invalidar todas as queries de flashcards
          queryClient.invalidateQueries({ queryKey: ['flashcards-due'] });
          queryClient.invalidateQueries({ queryKey: ['flashcards-all'] });
          queryClient.invalidateQueries({ queryKey: ['flashcard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['flashcard-analytics'] });
          queryClient.invalidateQueries({ queryKey: ['pending-flashcards'] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Flashcards channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const cards = isCramMode ? allCards : dueCards;
  const isLoading = isCramMode ? isLoadingAll : isLoadingDue;
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

      // Próximo card
      if (currentIndex < (cards?.length || 0) - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Sessão completa
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
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0, xpEarned: 0 });
    refetchDue();
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0, xpEarned: 0 });
    if (isCramMode) {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Session Complete state
  if (isSessionComplete) {
    const accuracy = sessionStats.correct + sessionStats.incorrect > 0
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-8xl mb-6"
            >
              <PartyPopper className="w-24 h-24 mx-auto text-primary" />
            </motion.div>

            <h2 className="text-3xl font-bold mb-2">Sessão Completa!</h2>
            <p className="text-muted-foreground mb-8">
              {isCramMode ? 'Modo Cram finalizado' : 'Parabéns pela dedicação!'}
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <Check className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-green-500">{sessionStats.correct}</div>
                  <div className="text-xs text-muted-foreground">Corretos</div>
                </CardContent>
              </Card>
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="p-4 text-center">
                  <RotateCcw className="w-6 h-6 text-red-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-red-500">{sessionStats.incorrect}</div>
                  <div className="text-xs text-muted-foreground">Para revisar</div>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-amber-500">+{sessionStats.xpEarned}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-center gap-2 mb-8">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-lg">Precisão: <strong className="text-primary">{accuracy}%</strong></span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={restartSession} size="lg">
                <RotateCcw className="w-4 h-4 mr-2" />
                Nova Sessão
              </Button>
              {isCramMode && (
                <Button variant="outline" onClick={exitCramMode} size="lg">
                  Voltar ao Normal
                </Button>
              )}
              <Button variant="ghost" onClick={() => navigate('/alunos/dashboard')} size="lg">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => navigate('/alunos/dashboard')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Flashcard
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold mb-2">
              {isCramMode ? 'Nenhum flashcard disponível' : 'Parabéns! Nenhum card para revisar hoje.'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isCramMode
                ? 'Você ainda não criou nenhum flashcard. Crie agora!'
                : 'Volte amanhã para continuar sua jornada de memorização.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Criar Flashcard
              </Button>
              {!isCramMode && allCards && allCards.length > 0 && (
                <Button variant="outline" onClick={() => setIsCramModalOpen(true)} size="lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Modo Cram
                </Button>
              )}
            </div>
          </motion.div>

          {/* Dashboard Anki - Estatísticas Completas */}
          <AnkiDashboard className="mt-8" defaultExpanded={true} />
        </div>

        {/* Create Modal */}
        <CreateFlashcardModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          newCard={newCard}
          setNewCard={setNewCard}
          onCreate={handleCreateCard}
          isLoading={createMutation.isPending}
        />

        {/* Cram Modal */}
        <CramModeModal
          isOpen={isCramModalOpen}
          onClose={() => setIsCramModalOpen(false)}
          onConfirm={startCramMode}
        />
      </div>
    );
  }

  // Main review UI
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/alunos/dashboard')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Oráculo da Memória
              </h1>
              <p className="text-sm text-muted-foreground">
                {isCramMode ? (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Zap className="w-3 h-3" />
                    Modo Cram ativado
                  </span>
                ) : (
                  `${cards.length} cards para revisar`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCramMode ? (
              <Button variant="outline" size="sm" onClick={exitCramMode}>
                Sair do Cram
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsCramModalOpen(true)}>
                <Zap className="w-4 h-4 mr-1" />
                Cram
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Card {currentIndex + 1} de {cards.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-500">
                <Check className="w-4 h-4" />
                {sessionStats.correct}
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <X className="w-4 h-4" />
                {sessionStats.incorrect}
              </span>
              <span className="flex items-center gap-1 text-amber-500">
                <Zap className="w-4 h-4" />
                +{sessionStats.xpEarned}
              </span>
            </div>
          </div>
          <Progress value={((currentIndex) / cards.length) * 100} className="h-2" />
        </div>

        {/* Flashcard */}
        <div className="perspective-1000">
          <motion.div
            className="relative w-full min-h-[320px] cursor-pointer"
            onClick={handleFlip}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front */}
            <Card 
              className={cn(
                "absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8",
                "bg-gradient-to-br from-card to-muted border-2"
              )}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Badge variant="outline" className="absolute top-4 left-4">
                {currentCard?.state === 'new' ? 'Novo' : currentCard?.state}
              </Badge>
              <Badge variant="outline" className="absolute top-4 right-4">
                Reps: {currentCard?.reps || 0}
              </Badge>
              
              <Brain className="w-12 h-12 text-primary/30 mb-4" />
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Pergunta</p>
              <p className="text-xl md:text-2xl font-medium text-center leading-relaxed whitespace-pre-line">
                {processAnkiText(currentCard?.question, false)}
              </p>
              <p className="text-sm text-muted-foreground mt-8 animate-pulse">
                👆 Clique para revelar
              </p>
            </Card>

            {/* Back */}
            <Card 
              className={cn(
                "absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8",
                "bg-gradient-to-br from-primary/5 to-purple-500/10 border-2 border-primary/20"
              )}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <Sparkles className="w-12 h-12 text-primary/30 mb-4" />
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Resposta</p>
              <p className="text-xl md:text-2xl font-medium text-center leading-relaxed whitespace-pre-line">
                {processAnkiText(currentCard?.answer, true)}
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Rating Buttons */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-4 gap-2 md:gap-3"
            >
              {RATING_BUTTONS.map(({ rating, label, emoji, color, interval }) => (
                <Button
                  key={rating}
                  variant="outline"
                  onClick={() => handleRating(rating)}
                  disabled={rescheduleMutation.isPending}
                  className={cn(
                    'flex-col h-auto py-4 transition-all',
                    color,
                    rescheduleMutation.isPending && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="text-2xl mb-1">{emoji}</span>
                  <span className="text-xs font-bold">{label}</span>
                  <span className="text-[10px] opacity-70">{interval}</span>
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tip */}
        {!isFlipped && (
          <p className="text-center text-sm text-muted-foreground">
            💡 Tente lembrar antes de revelar. A memória se fortalece com o esforço!
          </p>
        )}

        {/* Dashboard Anki - Estatísticas Completas (visível durante revisão) */}
        <AnkiDashboard className="mt-8" defaultExpanded={true} />
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

// Componente: Modal de Criar Flashcard
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Criar Novo Flashcard
          </DialogTitle>
          <DialogDescription>
            Adicione uma pergunta e resposta para memorizar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Pergunta</label>
            <Textarea
              placeholder="Digite a pergunta..."
              value={newCard.question}
              onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Resposta</label>
            <Textarea
              placeholder="Digite a resposta..."
              value={newCard.answer}
              onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onCreate} disabled={isLoading}>
            {isLoading ? 'Criando...' : 'Criar Flashcard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente: Modal de Modo Cram
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Ativar Modo Cram?
          </DialogTitle>
        </DialogHeader>
        <div className="text-muted-foreground">
          <p className="mb-4">
            O Modo Cram ignora o agendamento do algoritmo FSRS e permite que você revise 
            <strong className="text-foreground"> todos os seus flashcards</strong> em sequência.
          </p>
          <p className="text-sm text-amber-500">
            ⚠️ Use com sabedoria — a repetição espaçada é mais eficiente para memorização de longo prazo.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-amber-500 hover:bg-amber-600">
            <Zap className="w-4 h-4 mr-2" />
            Ativar Cram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
