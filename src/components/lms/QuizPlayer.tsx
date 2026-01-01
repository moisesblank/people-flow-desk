// ============================================
// PLAYER DE QUIZ - INTERFACE DE AVALIAÇÃO
// Sistema de questões com timer e feedback
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle2, XCircle, ArrowRight, ArrowLeft, 
  Trophy, Target, Brain, Lightbulb, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import QuestionEnunciado, { cleanQuestionText } from '@/components/shared/QuestionEnunciado';
import QuestionResolution from '@/components/shared/QuestionResolution';
import { predictSuccessRate, getSuccessRateColor } from '@/lib/questionSuccessPredictor';
import type { Quiz, QuizQuestion, QuizAttempt } from '@/hooks/useQuiz';

interface QuizPlayerProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, string>, timeSpent: number) => void;
  isSubmitting?: boolean;
}

export function QuizPlayer({ quiz, questions, onSubmit, isSubmitting }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  // Embaralhar questões se configurado
  const shuffledQuestions = useMemo(() => {
    if (!quiz.shuffle_questions) return questions;
    return [...questions].sort(() => Math.random() - 0.5);
  }, [questions, quiz.shuffle_questions]);

  const currentQuestion = shuffledQuestions[currentIndex];
  const progress = ((currentIndex + 1) / shuffledQuestions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const timeLimit = quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null;
  const timeRemaining = timeLimit ? timeLimit - timeElapsed : null;

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => {
        if (timeLimit && prev >= timeLimit) {
          // Tempo esgotado - submeter automaticamente
          handleSubmit();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(answers, timeElapsed);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facil': return 'bg-green-500/20 text-green-500';
      case 'medio': return 'bg-yellow-500/20 text-yellow-500';
      case 'dificil': return 'bg-red-500/20 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header com Timer e Progresso */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <span className="font-semibold">{quiz.title}</span>
              </div>
              <Badge variant="secondary">
                {quiz.quiz_type === 'simulado' ? 'Simulado' : quiz.quiz_type === 'avaliacao' ? 'Avaliação' : 'Quiz'}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>{answeredCount}/{shuffledQuestions.length} respondidas</span>
              </div>

              {timeRemaining !== null && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full font-mono text-sm",
                  timeRemaining < 60 ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-muted"
                )}>
                  <Clock className="h-4 w-4" />
                  {formatTime(timeRemaining)}
                </div>
              )}

              {!timeLimit && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted font-mono text-sm">
                  <Clock className="h-4 w-4" />
                  {formatTime(timeElapsed)}
                </div>
              )}
            </div>
          </div>

          <Progress value={progress} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Questão Atual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Questão {currentIndex + 1} de {shuffledQuestions.length}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(currentQuestion?.difficulty || 'medio')}>
                    {currentQuestion?.difficulty === 'facil' ? 'Fácil' : 
                     currentQuestion?.difficulty === 'dificil' ? 'Difícil' : 'Médio'}
                  </Badge>
                  <Badge variant="outline">{currentQuestion?.points} pts</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Texto da Questão com Imagem - Componente Universal */}
              <QuestionEnunciado
                questionText={currentQuestion?.question_text || ''}
                imageUrl={(currentQuestion as any)?.image_url}
                banca={(currentQuestion as any)?.banca}
                ano={(currentQuestion as any)?.ano}
                textSize="lg"
                showImageLabel
              />

              {/* Opções */}
              {currentQuestion?.question_type === 'multiple_choice' && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, idx) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Label
                        htmlFor={option.id}
                        className={cn(
                          "flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-all",
                          answers[currentQuestion.id] === option.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <span className="flex-1">{option.text}</span>
                        </div>
                        {option.image_url && (
                          <img 
                            src={option.image_url} 
                            alt={`Imagem alternativa ${option.id.toUpperCase()}`}
                            className="max-h-[300px] w-auto object-contain rounded-lg ml-7"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </Label>
                    </motion.div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion?.question_type === 'true_false' && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                  className="flex gap-4"
                >
                  {['true', 'false'].map((value) => (
                    <Label
                      key={value}
                      htmlFor={value}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all",
                        answers[currentQuestion.id] === value
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value={value} id={value} />
                      {value === 'true' ? 'Verdadeiro' : 'Falso'}
                    </Label>
                  ))}
                </RadioGroup>
              )}

              {/* Topic Tag */}
              {currentQuestion?.topic && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  Tema: {currentQuestion.topic}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          {shuffledQuestions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-medium transition-all",
                idx === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : answers[shuffledQuestions[idx]?.id]
                  ? "bg-green-500/20 text-green-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentIndex === shuffledQuestions.length - 1 ? (
          <Button
            onClick={() => setShowConfirm(true)}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            Finalizar Quiz
            <Trophy className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Próxima
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Modal de Confirmação */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md mx-4 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-semibold">Confirmar Envio</h3>
              </div>

              <p className="text-muted-foreground mb-4">
                Você respondeu {answeredCount} de {shuffledQuestions.length} questões.
                {answeredCount < shuffledQuestions.length && (
                  <span className="text-yellow-500 block mt-2">
                    Atenção: Existem {shuffledQuestions.length - answeredCount} questões não respondidas!
                  </span>
                )}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                >
                  Revisar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Confirmar Envio'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente de Resultado
interface QuizResultProps {
  attempt: QuizAttempt;
  quiz: Quiz;
  questions: QuizQuestion[];
  onRetry?: () => void;
  onBack?: () => void;
}

export function QuizResult({ attempt, quiz, questions, onRetry, onBack }: QuizResultProps) {
  const isPassed = attempt.passed;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className={cn(
          "w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4",
          isPassed ? "bg-green-500/20" : "bg-red-500/20"
        )}>
          {isPassed ? (
            <Trophy className="h-12 w-12 text-green-500" />
          ) : (
            <XCircle className="h-12 w-12 text-red-500" />
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {isPassed ? 'Parabéns! Você passou!' : 'Não foi dessa vez...'}
        </h2>

        <p className="text-muted-foreground">
          {isPassed 
            ? `Você alcançou ${attempt.percentage}% de aproveitamento!`
            : `Você precisava de ${quiz.passing_score}% para passar.`}
        </p>
      </motion.div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-bold text-primary">{attempt.percentage}%</p>
              <p className="text-sm text-muted-foreground">Aproveitamento</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-bold">{attempt.score}/{attempt.max_score}</p>
              <p className="text-sm text-muted-foreground">Pontuação</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-bold">
                {Math.floor(attempt.time_spent_seconds / 60)}:{(attempt.time_spent_seconds % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-sm text-muted-foreground">Tempo</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-bold text-green-500">
                {isPassed ? `+${quiz.xp_reward}` : '0'}
              </p>
              <p className="text-sm text-muted-foreground">XP Ganho</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revisão das Respostas */}
      {quiz.show_correct_answers && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revisão das Respostas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, idx) => {
              const userAnswer = attempt.answers[q.id];
              const isCorrect = userAnswer === q.correct_answer;
              const userOption = q.options.find((o) => o.id === userAnswer);
              const correctOption = q.options.find((o) => o.id === q.correct_answer);

              return (
                <div key={q.id} className="p-4 rounded-xl bg-muted/30 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                      isCorrect ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{idx + 1}. {cleanQuestionText(q.question_text)}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm">
                          Sua resposta: <span className={isCorrect ? "text-green-500" : "text-red-500"}>
                            {userOption?.text || 'Não respondida'}
                          </span>
                        </p>
                        
                        {/* Taxa de Acerto Prevista */}
                        {(() => {
                          const prediction = predictSuccessRate({
                            difficulty: (q as any).difficulty || 'medio',
                            questionText: q.question_text,
                            options: q.options,
                            explanation: q.explanation,
                            tema: (q as any).tema,
                            macro: (q as any).macro,
                          });
                          return (
                            <span className={cn("text-xs font-medium", getSuccessRateColor(prediction.rate))}>
                              Taxa esperada: {prediction.rate}%
                            </span>
                          );
                        })()}
                      </div>
                      {!isCorrect && (
                        <p className="text-sm text-green-500">
                          Correta: {correctOption?.text}
                        </p>
                      )}
                      {q.explanation && (
                        <div className="mt-3">
                          <QuestionResolution
                            resolutionText={q.explanation}
                            difficulty={q.difficulty}
                            tema={q.topic}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
        )}
        {onRetry && !isPassed && (
          <Button onClick={onRetry} className="flex-1">
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  );
}
