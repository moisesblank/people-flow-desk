// ============================================
// FLASHCARDS TAB - Cards de memorização
// Sistema FSRS simplificado
// ============================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { BookOpen, RotateCcw, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FlashcardsTabProps {
  lessonId: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const SAMPLE_FLASHCARDS: Flashcard[] = [
  {
    id: '1',
    front: 'O que é o Ponto Triplo?',
    back: 'É a condição única de temperatura e pressão onde as três fases (sólido, líquido e gás) coexistem em equilíbrio.',
    difficulty: 'medium'
  },
  {
    id: '2',
    front: 'O que acontece no Ponto Crítico?',
    back: 'Acima do ponto crítico, não existe mais distinção entre líquido e gás - a substância está em estado supercrítico.',
    difficulty: 'hard'
  },
  {
    id: '3',
    front: 'Por que o gelo flutua na água?',
    back: 'Porque o gelo é menos denso que a água líquida devido à estrutura cristalina formada pelas ligações de hidrogênio.',
    difficulty: 'easy'
  },
  {
    id: '4',
    front: 'O que é Sublimação?',
    back: 'É a passagem direta do estado sólido para o gasoso, sem passar pelo estado líquido. Ex: gelo seco (CO₂).',
    difficulty: 'easy'
  },
  {
    id: '5',
    front: 'Por que a linha de fusão da água é diferente?',
    back: 'A linha de fusão da água tem inclinação negativa porque aumentar a pressão favorece a fase mais densa (líquida), diferente da maioria das substâncias.',
    difficulty: 'hard'
  }
];

function FlashcardsTab({ lessonId }: FlashcardsTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState(0);

  const card = SAMPLE_FLASHCARDS[currentIndex];
  const progress = ((knownCards.size) / SAMPLE_FLASHCARDS.length) * 100;

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < SAMPLE_FLASHCARDS.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleKnown = useCallback(() => {
    setKnownCards(prev => new Set([...prev, card.id]));
    handleNext();
  }, [card.id, handleNext]);

  const handleNotKnown = useCallback(() => {
    setKnownCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(card.id);
      return newSet;
    });
    handleNext();
  }, [card.id, handleNext]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
  }, []);

  const difficultyColors = {
    easy: 'bg-green-500/10 text-green-500 border-green-500/30',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    hard: 'bg-red-500/10 text-red-500 border-red-500/30'
  };

  const difficultyLabels = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BookOpen className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold">Flashcards</h3>
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} de {SAMPLE_FLASHCARDS.length} • {knownCards.size} memorizados
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRestart}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reiniciar
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span>{knownCards.size}/{SAMPLE_FLASHCARDS.length} memorizados</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card Container */}
      <div className="relative h-[280px] perspective-1000">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={card.id + (isFlipped ? '-back' : '-front')}
            custom={direction}
            initial={{ 
              opacity: 0, 
              x: direction > 0 ? 100 : direction < 0 ? -100 : 0,
              rotateY: isFlipped ? 180 : 0 
            }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ 
              opacity: 0, 
              x: direction > 0 ? -100 : direction < 0 ? 100 : 0 
            }}
            transition={{ duration: 0.3 }}
            onClick={handleFlip}
            className={cn(
              "absolute inset-0 cursor-pointer",
              "rounded-2xl border-2 p-6",
              "flex flex-col items-center justify-center text-center",
              "transition-all duration-300",
              isFlipped 
                ? "bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/30" 
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            {/* Difficulty Badge */}
            <Badge 
              variant="outline" 
              className={cn("absolute top-4 right-4", difficultyColors[card.difficulty])}
            >
              {difficultyLabels[card.difficulty]}
            </Badge>

            {/* Card indicator */}
            <Badge variant="outline" className="absolute top-4 left-4">
              {isFlipped ? '📝 Resposta' : '❓ Pergunta'}
            </Badge>

            {/* Content */}
            <p className={cn(
              "text-lg font-medium leading-relaxed max-w-[90%]",
              isFlipped && "text-foreground"
            )}>
              {isFlipped ? card.back : card.front}
            </p>

            {/* Flip hint */}
            {!isFlipped && (
              <p className="absolute bottom-4 text-xs text-muted-foreground">
                Clique para ver a resposta
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Know/Don't Know buttons */}
        {isFlipped && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <Button 
              variant="outline" 
              onClick={handleNotKnown}
              className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <ThumbsDown className="h-4 w-4" />
              Não sei
            </Button>
            <Button 
              onClick={handleKnown}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <ThumbsUp className="h-4 w-4" />
              Sei
            </Button>
          </motion.div>
        )}

        <Button 
          variant="outline" 
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === SAMPLE_FLASHCARDS.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* XP indicator */}
      <div className="flex justify-center">
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          +5 XP por card memorizado
        </Badge>
      </div>
    </div>
  );
}

export default FlashcardsTab;
