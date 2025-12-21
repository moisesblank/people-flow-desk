// ============================================
// FLASHCARD INTELIGENTE - FSRS v5 Algorithm
// Sistema de Repetição Espaçada Avançado
// Lei I: Performance | Lei IV: Aprendizado Ótimo
// ============================================

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, RotateCcw, ThumbsUp, ThumbsDown, 
  Zap, Clock, Star, Sparkles, ChevronLeft,
  ChevronRight, Trophy, Flame, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

// FSRS Parameters (Free Spaced Repetition Scheduler)
const FSRS_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.9,
  maximumInterval: 36500,
  initialStability: [0.4, 0.6, 2.4, 5.8], // Again, Hard, Good, Easy
};

type Rating = 'again' | 'hard' | 'good' | 'easy';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  area: string;
  areaColor: string;
  // FSRS state
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  lastReview?: Date;
  dueDate?: Date;
}

interface FlashcardSessionProps {
  cards: Flashcard[];
  onComplete?: (results: SessionResult) => void;
  onCardReview?: (cardId: string, rating: Rating, newState: Partial<Flashcard>) => void;
}

interface SessionResult {
  totalCards: number;
  correct: number;
  incorrect: number;
  xpEarned: number;
  averageTime: number;
}

// Cálculos FSRS
function calculateNextInterval(card: Flashcard, rating: Rating): { interval: number; stability: number; difficulty: number } {
  const ratingMap: Record<Rating, number> = { again: 1, hard: 2, good: 3, easy: 4 };
  const grade = ratingMap[rating];
  
  let newStability = card.stability;
  let newDifficulty = card.difficulty;
  
  if (card.state === 'new') {
    newStability = FSRS_PARAMS.initialStability[grade - 1];
    newDifficulty = Math.min(10, Math.max(1, 5 - (grade - 3)));
  } else {
    // Fórmula FSRS para estabilidade
    const retrievability = Math.exp(-card.elapsedDays / card.stability);
    const stabilityFactor = Math.exp(FSRS_PARAMS.w[8]) * 
      (11 - newDifficulty) * 
      Math.pow(card.stability, -FSRS_PARAMS.w[9]) * 
      (Math.exp(FSRS_PARAMS.w[10] * (1 - retrievability)) - 1);
    
    if (rating === 'again') {
      newStability = Math.min(card.stability, FSRS_PARAMS.w[11] * Math.pow(newDifficulty, -FSRS_PARAMS.w[12]) * (Math.pow(card.stability + 1, FSRS_PARAMS.w[13]) - 1));
    } else {
      const hardPenalty = rating === 'hard' ? FSRS_PARAMS.w[15] : 1;
      const easyBonus = rating === 'easy' ? FSRS_PARAMS.w[16] : 1;
      newStability = card.stability * (1 + stabilityFactor * hardPenalty * easyBonus);
    }
    
    // Atualizar dificuldade
    const difficultyDelta = FSRS_PARAMS.w[6] * (grade - 3);
    newDifficulty = Math.min(10, Math.max(1, newDifficulty - difficultyDelta));
  }
  
  // Calcular intervalo
  const desiredRetention = FSRS_PARAMS.requestRetention;
  let interval = Math.round(newStability * Math.log(desiredRetention) / Math.log(0.9));
  interval = Math.min(FSRS_PARAMS.maximumInterval, Math.max(1, interval));
  
  return { interval, stability: newStability, difficulty: newDifficulty };
}

export function SmartFlashcardSystem({ cards, onComplete, onCardReview }: FlashcardSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>(cards);
  const [results, setResults] = useState<{ cardId: string; rating: Rating; correct: boolean }[]>([]);
  const [startTime] = useState(Date.now());
  const [cardStartTime, setCardStartTime] = useState(Date.now());

  const currentCard = sessionCards[currentIndex];
  const isComplete = currentIndex >= sessionCards.length;

  // Stats da sessão
  const stats = useMemo(() => {
    const correct = results.filter(r => r.correct).length;
    const incorrect = results.filter(r => !r.correct).length;
    return {
      correct,
      incorrect,
      total: results.length,
      accuracy: results.length > 0 ? (correct / results.length) * 100 : 0
    };
  }, [results]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleRating = useCallback((rating: Rating) => {
    if (!currentCard) return;

    const isCorrect = rating !== 'again';
    const { interval, stability, difficulty } = calculateNextInterval(currentCard, rating);
    
    // Atualizar estado do card
    const newCardState: Partial<Flashcard> = {
      stability,
      difficulty,
      scheduledDays: interval,
      reps: currentCard.reps + 1,
      lapses: rating === 'again' ? currentCard.lapses + 1 : currentCard.lapses,
      state: rating === 'again' ? 'relearning' : 'review',
      lastReview: new Date(),
      dueDate: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
    };

    // Callback para salvar no banco
    onCardReview?.(currentCard.id, rating, newCardState);

    // Registrar resultado
    setResults(prev => [...prev, { cardId: currentCard.id, rating, correct: isCorrect }]);

    // Próximo card
    setIsFlipped(false);
    setCardStartTime(Date.now());
    
    setTimeout(() => {
      if (currentIndex < sessionCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Sessão completa
        const totalTime = (Date.now() - startTime) / 1000;
        const xpEarned = results.filter(r => r.correct).length * 10 + 
                        (results.filter(r => r.rating === 'easy').length * 5);
        
        onComplete?.({
          totalCards: sessionCards.length,
          correct: stats.correct + (isCorrect ? 1 : 0),
          incorrect: stats.incorrect + (isCorrect ? 0 : 1),
          xpEarned,
          averageTime: totalTime / sessionCards.length
        });
      }
    }, 200);
  }, [currentCard, currentIndex, sessionCards.length, onCardReview, onComplete, startTime, stats, results]);

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Sessão Completa!</h2>
        <p className="text-muted-foreground mb-6">
          Você revisou {sessionCards.length} cards
        </p>
        
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-500">{stats.correct}</div>
              <div className="text-xs text-muted-foreground">Corretos</div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 text-center">
              <RotateCcw className="w-6 h-6 text-red-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-500">{stats.incorrect}</div>
              <div className="text-xs text-muted-foreground">Para revisar</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <Zap className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-amber-500">
                +{stats.correct * 10 + results.filter(r => r.rating === 'easy').length * 5}
              </div>
              <div className="text-xs text-muted-foreground">XP</div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={() => window.location.reload()} size="lg">
          <RotateCcw className="w-4 h-4 mr-2" />
          Nova Sessão
        </Button>
      </motion.div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge style={{ backgroundColor: currentCard.areaColor + '20', color: currentCard.areaColor }}>
            {currentCard.area}
          </Badge>
          <Badge variant="outline">
            {currentIndex + 1}/{sessionCards.length}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-500">
            <CheckCircle2 className="w-4 h-4" />
            {stats.correct}
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <RotateCcw className="w-4 h-4" />
            {stats.incorrect}
          </span>
        </div>
      </div>

      <Progress value={(currentIndex / sessionCards.length) * 100} className="h-2" />

      {/* Card principal */}
      <div className="perspective-1000">
        <motion.div
          className="relative w-full aspect-[3/2] cursor-pointer"
          onClick={handleFlip}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Frente */}
          <Card 
            className={cn(
              "absolute inset-0 backface-hidden p-8 flex items-center justify-center",
              "bg-gradient-to-br from-background to-muted"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center">
              <Brain className="w-10 h-10 text-primary mx-auto mb-4 opacity-30" />
              <p className="text-xl md:text-2xl font-medium">{currentCard.front}</p>
              <p className="text-sm text-muted-foreground mt-6 animate-pulse">
                Clique para revelar
              </p>
            </div>
          </Card>

          {/* Verso */}
          <Card 
            className={cn(
              "absolute inset-0 backface-hidden p-8 flex items-center justify-center",
              "bg-gradient-to-br from-primary/5 to-purple-500/5"
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-center">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 opacity-30" />
              <p className="text-xl md:text-2xl font-medium">{currentCard.back}</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Botões de avaliação */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-4 gap-3"
          >
            <Button
              variant="outline"
              className="flex-col h-auto py-4 border-red-500/30 hover:bg-red-500/10 hover:border-red-500"
              onClick={() => handleRating('again')}
            >
              <span className="text-2xl mb-1">😓</span>
              <span className="text-xs font-bold text-red-500">ERREI</span>
              <span className="text-[10px] text-muted-foreground">&lt;1min</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex-col h-auto py-4 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500"
              onClick={() => handleRating('hard')}
            >
              <span className="text-2xl mb-1">😅</span>
              <span className="text-xs font-bold text-orange-500">DIFÍCIL</span>
              <span className="text-[10px] text-muted-foreground">~1d</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex-col h-auto py-4 border-green-500/30 hover:bg-green-500/10 hover:border-green-500"
              onClick={() => handleRating('good')}
            >
              <span className="text-2xl mb-1">😊</span>
              <span className="text-xs font-bold text-green-500">BOM</span>
              <span className="text-[10px] text-muted-foreground">~3d</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex-col h-auto py-4 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500"
              onClick={() => handleRating('easy')}
            >
              <span className="text-2xl mb-1">🤩</span>
              <span className="text-xs font-bold text-blue-500">FÁCIL</span>
              <span className="text-[10px] text-muted-foreground">~7d</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dica */}
      {!isFlipped && (
        <p className="text-center text-sm text-muted-foreground">
          💡 Tente lembrar antes de revelar. A memória se fortalece com o esforço!
        </p>
      )}
    </div>
  );
}

export default SmartFlashcardSystem;
