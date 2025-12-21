// ============================================
// QUIZ TAB - Quiz interativo da aula
// Gamificação com XP
// ============================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle, XCircle, Trophy, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface QuizTabProps {
  lessonId: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: '1',
    question: 'O que acontece no ponto triplo de uma substância?',
    options: [
      'Apenas duas fases coexistem',
      'As três fases coexistem em equilíbrio',
      'A substância está em estado sólido',
      'Ocorre mudança de temperatura'
    ],
    correct: 1,
    explanation: 'No ponto triplo, as três fases (sólido, líquido e gás) coexistem em equilíbrio em condições específicas de temperatura e pressão.'
  },
  {
    id: '2',
    question: 'Por que a linha de fusão da água tem inclinação negativa?',
    options: [
      'Porque a água ferve a 100°C',
      'Porque o gelo é mais denso que a água',
      'Porque o gelo é menos denso que a água',
      'Porque a água é uma molécula polar'
    ],
    correct: 2,
    explanation: 'O gelo é menos denso que a água líquida devido às ligações de hidrogênio, formando uma estrutura cristalina com espaços vazios.'
  },
  {
    id: '3',
    question: 'O que é um fluido supercrítico?',
    options: [
      'Um líquido muito quente',
      'Um gás comprimido',
      'Estado com propriedades de líquido e gás simultaneamente',
      'Uma substância sólida'
    ],
    correct: 2,
    explanation: 'Acima do ponto crítico, a substância entra em estado supercrítico, apresentando propriedades intermediárias entre líquido e gás.'
  },
  {
    id: '4',
    question: 'O que representa o ponto crítico em um diagrama de fases?',
    options: [
      'O início da fusão',
      'O limite entre líquido e gás',
      'O ponto de ebulição normal',
      'A temperatura mínima'
    ],
    correct: 1,
    explanation: 'O ponto crítico marca o limite acima do qual não existe mais distinção entre as fases líquida e gasosa.'
  }
];

function QuizTab({ lessonId }: QuizTabProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);

  const question = SAMPLE_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + (showResult ? 1 : 0)) / SAMPLE_QUESTIONS.length) * 100;

  const handleAnswer = useCallback((index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  }, [showResult]);

  const handleConfirm = useCallback(() => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === question.correct;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setAnsweredQuestions(prev => [...prev, isCorrect]);
    setShowResult(true);
  }, [selectedAnswer, question.correct]);

  const handleNext = useCallback(() => {
    if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsFinished(true);
    }
  }, [currentQuestion]);

  const handleRestart = useCallback(() => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setIsFinished(false);
    setAnsweredQuestions([]);
  }, []);

  // Tela de resultado final
  if (isFinished) {
    const percentage = (score / SAMPLE_QUESTIONS.length) * 100;
    const xpEarned = score * 10;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.2, type: "spring" }}
          className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20 mb-6"
        >
          <Trophy className="h-16 w-16 text-amber-500" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Quiz Concluído!</h2>
        <p className="text-muted-foreground mb-6">
          Você acertou {score} de {SAMPLE_QUESTIONS.length} questões
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{percentage.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Aproveitamento</p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-500">+{xpEarned}</p>
            <p className="text-xs text-muted-foreground">XP ganhos</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {answeredQuestions.map((correct, idx) => (
            <div
              key={idx}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                correct ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
              )}
            >
              {correct ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </div>
          ))}
        </div>

        <Button onClick={handleRestart} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Tentar Novamente
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <HelpCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold">Quiz da Aula</h3>
            <p className="text-xs text-muted-foreground">
              Questão {currentQuestion + 1} de {SAMPLE_QUESTIONS.length}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          +10 XP por acerto
        </Badge>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="font-medium text-lg">{question.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === question.correct;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: showResult ? 1 : 1.01 }}
                  whileTap={{ scale: showResult ? 1 : 0.99 }}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    "flex items-center gap-3",
                    showCorrect && "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400",
                    showWrong && "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400",
                    !showResult && isSelected && "bg-primary/10 border-primary",
                    !showResult && !isSelected && "bg-card hover:bg-muted/50 border-border"
                  )}
                >
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium",
                    showCorrect && "bg-green-500 text-white",
                    showWrong && "bg-red-500 text-white",
                    !showResult && isSelected && "bg-primary text-primary-foreground",
                    !showResult && !isSelected && "bg-muted"
                  )}>
                    {showCorrect ? <CheckCircle className="h-4 w-4" /> : 
                     showWrong ? <XCircle className="h-4 w-4" /> :
                     String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{option}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-xl bg-primary/5 border border-primary/20"
            >
              <p className="text-sm font-medium text-primary mb-1">Explicação:</p>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            {!showResult ? (
              <Button 
                onClick={handleConfirm} 
                disabled={selectedAnswer === null}
                className="min-w-[120px]"
              >
                Confirmar
              </Button>
            ) : (
              <Button onClick={handleNext} className="min-w-[120px]">
                {currentQuestion < SAMPLE_QUESTIONS.length - 1 ? 'Próxima' : 'Ver Resultado'}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default QuizTab;
