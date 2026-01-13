// ============================================
// FLASHCARDS DIÁRIOS - SANTUÁRIO BETA v10
// Widget de flashcards com revisão espaçada
// Integrado com sistema Anki existente
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  RotateCcw, 
  Check, 
  X,
  Clock,
  Flame,
  ChevronRight,
  Sparkles,
  Zap,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Flashcard {
  id: string;
  frente: string;
  verso: string;
  categoria: string;
  dificuldade: 'easy' | 'medium' | 'hard';
}

interface FlashcardsDiariosProps {
  className?: string;
}

export function FlashcardsDiarios({ className }: FlashcardsDiariosProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewed, setReviewed] = useState<string[]>([]);

  // Flashcards do dia - em produção, vir de hook real
  const flashcards: Flashcard[] = [
    { 
      id: '1', 
      frente: 'O que é número atômico (Z)?', 
      verso: 'É o número de prótons no núcleo do átomo. Define o elemento químico.', 
      categoria: 'Química',
      dificuldade: 'easy'
    },
    { 
      id: '2', 
      frente: 'Qual a diferença entre fusão e fissão nuclear?', 
      verso: 'Fusão: união de núcleos leves (sol). Fissão: divisão de núcleos pesados (usinas nucleares).', 
      categoria: 'Física',
      dificuldade: 'medium'
    },
    { 
      id: '3', 
      frente: 'O que é a Lei de Lavoisier?', 
      verso: 'Lei da conservação das massas: "Na natureza nada se cria, nada se perde, tudo se transforma."', 
      categoria: 'Química',
      dificuldade: 'easy'
    },
  ];

  const currentCard = flashcards[currentIndex];
  const progressPercent = (reviewed.length / flashcards.length) * 100;
  const isComplete = reviewed.length === flashcards.length;

  const handleResponse = (correct: boolean) => {
    if (!reviewed.includes(currentCard.id)) {
      setReviewed([...reviewed, currentCard.id]);
    }
    setShowAnswer(false);
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setReviewed([]);
  };

  const getDifficultyColor = (diff: Flashcard['dificuldade']) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/10 text-green-500';
      case 'medium': return 'bg-amber-500/10 text-amber-500';
      case 'hard': return 'bg-red-500/10 text-red-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Flashcards do Dia
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {flashcards.length} cards para revisar
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/alunos/materiais')}>
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-2">
            <Progress value={progressPercent} className="flex-1 h-2" />
            <span className="text-xs font-medium">
              {reviewed.length}/{flashcards.length}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isComplete ? (
            <>
              {/* Card */}
              <div 
                className="relative min-h-[180px] perspective-1000"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={showAnswer ? 'back' : 'front'}
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "absolute inset-0 p-4 rounded-xl cursor-pointer",
                      "flex flex-col items-center justify-center text-center",
                      showAnswer 
                        ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30"
                        : "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={getDifficultyColor(currentCard.dificuldade)}>
                        {currentCard.categoria}
                      </Badge>
                      {showAnswer ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <p className={cn(
                      "text-sm font-medium",
                      showAnswer ? "text-base" : ""
                    )}>
                      {showAnswer ? currentCard.verso : currentCard.frente}
                    </p>

                    {!showAnswer && (
                      <p className="text-xs text-muted-foreground mt-4">
                        Clique para ver a resposta
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Ações */}
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-3 gap-2"
                >
                  <Button 
                    variant="outline" 
                    className="gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleResponse(false)}
                  >
                    <X className="h-4 w-4" />
                    Errei
                  </Button>
                  <Button 
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleResponse(true)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Difícil
                  </Button>
                  <Button 
                    variant="outline"
                    className="gap-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
                    onClick={() => handleResponse(true)}
                  >
                    <Check className="h-4 w-4" />
                    Fácil
                  </Button>
                </motion.div>
              )}
            </>
          ) : (
            /* Completado */
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6"
            >
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-bold text-lg mb-1">Revisão Completa! 🎉</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Você revisou todos os flashcards de hoje
              </p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Badge className="bg-primary/10 text-primary gap-1">
                  <Zap className="h-3 w-3" />
                  +{reviewed.length * 10} XP
                </Badge>
                <Badge className="bg-amber-500/10 text-amber-500 gap-1">
                  <Flame className="h-3 w-3" />
                  Streak mantido!
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetCards} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Revisar novamente
                </Button>
                <Button onClick={() => navigate('/alunos/materiais')} className="flex-1">
                  Ver mais cards
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
