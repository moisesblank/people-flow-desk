// ============================================
// MOISÉS MEDEIROS v7.0 - FLASHCARD COMPONENT
// Spider-Man Theme - Cards de Estudo Interativos
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  RotateCcw, 
  ChevronLeft,
  ChevronRight, 
  Check, 
  X,
  Lightbulb,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface FlashcardData {
  id: string;
  frente: string;
  verso: string;
  dica?: string;
  dificuldade: "facil" | "medio" | "dificil";
  // Suporte a imagens (v1.0)
  frente_image_url?: string | null;
  verso_image_url?: string | null;
}

interface FlashcardProps {
  cards: FlashcardData[];
  onComplete?: (results: { correct: number; incorrect: number }) => void;
}

export function Flashcard({ cards, onComplete }: FlashcardProps) {
  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<{ correct: number; incorrect: number }>({ 
    correct: 0, 
    incorrect: 0 
  });
  const [answered, setAnswered] = useState<Set<string>>(new Set());

  const currentCard = cards[currentIndex];
  const progress = (answered.size / cards.length) * 100;
  const isComplete = answered.size === cards.length;

  const difficultyColors = {
    facil: "bg-green-500/10 text-green-600 border-green-500/20",
    medio: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    dificil: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const difficultyLabels = {
    facil: "Fácil",
    medio: "Médio",
    dificil: "Difícil",
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowHint(false);
  };

  const handleAnswer = (correct: boolean) => {
    if (answered.has(currentCard.id)) return;

    setAnswered(new Set([...answered, currentCard.id]));
    setResults((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }));

    // Auto advance after answer
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setShowHint(false);
      } else if (answered.size + 1 === cards.length) {
        onComplete?.({
          correct: results.correct + (correct ? 1 : 0),
          incorrect: results.incorrect + (correct ? 0 : 1),
        });
      }
    }, 500);
  };

  const goToCard = (direction: "prev" | "next") => {
    setIsFlipped(false);
    setShowHint(false);
    if (direction === "prev" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === "next" && currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setResults({ correct: 0, incorrect: 0 });
    setAnswered(new Set());
  };

  if (isComplete) {
    const percentage = Math.round((results.correct / cards.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="spider-card rounded-2xl p-8 text-center space-y-6"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: 3, duration: 0.5 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-gradient-spider blur-2xl opacity-40" />
          <Sparkles className="h-16 w-16 mx-auto text-primary relative" />
        </motion.div>
        
        <div>
          <h2 className="text-2xl font-bold text-foreground">Parabéns! 🎉</h2>
          <p className="text-muted-foreground mt-2">Você completou o deck de flashcards</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-3xl font-bold text-green-600">{results.correct}</p>
            <p className="text-xs text-green-600/70">Acertos</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-3xl font-bold text-red-600">{results.incorrect}</p>
            <p className="text-xs text-red-600/70">Erros</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Aproveitamento</p>
          <Progress value={percentage} className="h-3" />
          <p className="text-xl font-bold text-primary">{percentage}%</p>
        </div>

        <Button onClick={resetDeck} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Revisar Novamente
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Card {currentIndex + 1} de {cards.length}
          </span>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-green-600">✓ {results.correct}</span>
            <span className="text-red-600">✗ {results.incorrect}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card */}
      <div className="perspective-1000">
        <motion.div
          className="relative w-full h-72 cursor-pointer"
          onClick={handleFlip}
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          {/* Front */}
          <div
            className={`absolute inset-0 glass-card rounded-2xl p-6 flex flex-col items-center justify-center backface-hidden overflow-hidden ${
              isFlipped ? "invisible" : ""
            }`}
          >
            <Badge 
              variant="outline" 
              className={`absolute top-4 right-4 ${difficultyColors[currentCard.dificuldade]}`}
            >
              {difficultyLabels[currentCard.dificuldade]}
            </Badge>
            
            {/* Imagem da Frente (v1.0) */}
            {currentCard.frente_image_url && (
              <img 
                src={currentCard.frente_image_url} 
                alt="Imagem da pergunta" 
                className="max-h-28 w-auto rounded-lg mb-3 object-contain"
              />
            )}
            
            <p className="text-xl font-medium text-center text-foreground">
              {currentCard.frente}
            </p>
            
            <p className="text-xs text-muted-foreground mt-4">
              Clique para ver a resposta
            </p>
          </div>

          {/* Back */}
          <div
            className={`absolute inset-0 glass-card rounded-2xl p-6 flex flex-col items-center justify-center backface-hidden bg-primary/5 overflow-hidden ${
              !isFlipped ? "invisible" : ""
            }`}
            style={{ transform: "rotateY(180deg)" }}
          >
            {/* Imagem do Verso (v1.0) */}
            {currentCard.verso_image_url && (
              <img 
                src={currentCard.verso_image_url} 
                alt="Imagem da resposta" 
                className="max-h-28 w-auto rounded-lg mb-3 object-contain"
              />
            )}
            
            <p className="text-xl font-medium text-center text-foreground">
              {currentCard.verso}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Hint */}
      <AnimatePresence>
        {showHint && currentCard.dica && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-700">Dica</p>
                <p className="text-sm text-yellow-600/80">{currentCard.dica}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToCard("prev")}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToCard("next")}
            disabled={currentIndex === cards.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {!isFlipped && currentCard.dica && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowHint(!showHint);
            }}
            className="gap-1"
          >
            <Lightbulb className="h-4 w-4" />
            Dica
          </Button>
        )}

        {isFlipped && !answered.has(currentCard.id) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-1 border-red-500/30 text-red-600 hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                handleAnswer(false);
              }}
            >
              <X className="h-4 w-4" />
              Errei
            </Button>
            <Button
              className="gap-1 bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                handleAnswer(true);
              }}
            >
              <Check className="h-4 w-4" />
              Acertei
            </Button>
          </div>
        )}
      </div>

      {/* Reset */}
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={resetDeck} className="gap-1">
          <RotateCcw className="h-3 w-3" />
          Recomeçar
        </Button>
      </div>
    </div>
  );
}
