// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// COMPONENTE DE PRÁTICA DE QUESTÕES
// PARTE 5 - Arena da Glória
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Target, 
  Trophy,
  RotateCcw,
  Clock,
  Flame,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SacredImage } from "@/components/performance/SacredImage";
import QuestionEnunciado from "@/components/shared/QuestionEnunciado";
import QuestionResolution from "@/components/shared/QuestionResolution";
import QuestionTextField from "@/components/shared/QuestionTextField";
import { 
  usePracticeQuestions, 
  usePracticeSession, 
  type PracticeQuestion 
} from "@/hooks/useQuestionPractice";
import { useGamification } from "@/hooks/useGamification";
import { predictSuccessRate, getSuccessRateColor } from "@/lib/questionSuccessPredictor";

interface QuestionPracticeProps {
  subject?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
  onComplete?: (stats: { correct: number; total: number; percentage: number }) => void;
}

export function QuestionPractice({ 
  subject, 
  topic, 
  difficulty, 
  limit = 10,
  onComplete 
}: QuestionPracticeProps) {
  const { data: questions, isLoading } = usePracticeQuestions({ subject, topic, difficulty, limit });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando questões...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card className="text-center p-8">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Nenhuma questão disponível</h3>
        <p className="text-muted-foreground mt-2">
          Não há questões para praticar com os filtros selecionados.
        </p>
      </Card>
    );
  }

  return <PracticeSession questions={questions} onComplete={onComplete} />;
}

function PracticeSession({ 
  questions, 
  onComplete 
}: { 
  questions: PracticeQuestion[]; 
  onComplete?: (stats: { correct: number; total: number; percentage: number }) => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const {
    currentQuestion,
    currentIndex,
    isComplete,
    progress,
    answers,
    handleAnswer,
    nextQuestion,
    resetSession,
    getStats,
    isRecording,
  } = usePracticeSession(questions);

  const { levelInfo } = useGamification();

  useEffect(() => {
    if (isComplete && !sessionComplete) {
      setSessionComplete(true);
      const stats = getStats();
      onComplete?.(stats);
    }
  }, [isComplete, sessionComplete, getStats, onComplete]);

  const onSubmitAnswer = useCallback(async () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    const correct = await handleAnswer(selectedAnswer);
    setIsCorrect(correct ?? false);
    setShowResult(true);
  }, [selectedAnswer, currentQuestion, handleAnswer]);

  const onNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    nextQuestion();
  }, [nextQuestion]);

  const onRestart = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setSessionComplete(false);
    resetSession();
  }, [resetSession]);

  // Tela de resultado final
  if (isComplete || sessionComplete) {
    const stats = getStats();
    const passed = stats.percentage >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="overflow-hidden">
          <div className={`h-2 ${passed ? 'bg-green-500' : 'bg-orange-500'}`} />
          
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`mx-auto p-4 rounded-full ${
                passed ? 'bg-green-500/20' : 'bg-orange-500/20'
              } w-fit mb-4`}
            >
              {passed ? (
                <Trophy className="h-12 w-12 text-green-500" />
              ) : (
                <Target className="h-12 w-12 text-orange-500" />
              )}
            </motion.div>
            
            <CardTitle className="text-2xl">
              {passed ? "Excelente trabalho!" : "Continue praticando!"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="text-2xl font-bold text-green-500">{stats.correct}</div>
                <div className="text-sm text-muted-foreground">Corretas</div>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-2xl font-bold text-red-500">{stats.wrong}</div>
                <div className="text-sm text-muted-foreground">Erradas</div>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="text-2xl font-bold text-primary">{stats.percentage}%</div>
                <div className="text-sm text-muted-foreground">Aproveitamento</div>
              </div>
            </div>

            {/* XP Ganho */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">XP Ganho</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                  +{stats.correct * 10} XP
                </Badge>
              </div>
              {levelInfo && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nível atual: {levelInfo.level} - {levelInfo.title}
                </p>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={onRestart}
              >
                <RotateCcw className="h-4 w-4" />
                Praticar Novamente
              </Button>
              <Button className="flex-1 gap-2">
                <Flame className="h-4 w-4" />
                Novas Questões
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header com progresso */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3" />
            Questão {currentIndex + 1} de {questions.length}
          </Badge>
          {currentQuestion.difficulty && (
            <Badge 
              variant={
                currentQuestion.difficulty === 'facil' ? 'secondary' :
                currentQuestion.difficulty === 'medio' ? 'default' : 'destructive'
              }
            >
              {currentQuestion.difficulty === 'facil' ? 'Fácil' :
               currentQuestion.difficulty === 'medio' ? 'Médio' : 'Difícil'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Tempo livre</span>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Questão atual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-6">
              {/* Enunciado com Imagem - Componente Universal */}
              <QuestionEnunciado
                questionText={currentQuestion.question_text}
                imageUrl={(currentQuestion as any).image_url}
                imageUrls={(currentQuestion as any).image_urls}
                banca={(currentQuestion as any).banca}
                ano={(currentQuestion as any).ano}
                textSize="lg"
                showImageLabel
              />

              {/* Opções */}
              <RadioGroup
                value={selectedAnswer || ""}
                onValueChange={setSelectedAnswer}
                disabled={showResult}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option.id;
                  const isCorrectOption = option.id === currentQuestion.correct_answer;
                  
                  let optionClass = "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer";
                  
                  if (showResult) {
                    if (isCorrectOption) {
                      optionClass += " border-green-500 bg-green-500/10";
                    } else if (isSelected && !isCorrect) {
                      optionClass += " border-red-500 bg-red-500/10";
                    } else {
                      optionClass += " border-muted opacity-50";
                    }
                  } else if (isSelected) {
                    optionClass += " border-primary bg-primary/5";
                  } else {
                    optionClass += " border-muted hover:border-primary/50 hover:bg-muted/50";
                  }

                    return (
                      <div key={option.id} className={optionClass}>
                        <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                        <Label 
                          htmlFor={option.id} 
                          className="flex flex-col gap-2 cursor-pointer w-full"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-medium text-sm
                              ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}
                              ${showResult && isCorrectOption ? 'border-green-500 bg-green-500 text-white' : ''}
                              ${showResult && isSelected && !isCorrectOption ? 'border-red-500 bg-red-500 text-white' : ''}
                            `}>
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <QuestionTextField content={option.text} fieldType="alternativa" className="flex-1" inline />
                            
                            {showResult && isCorrectOption && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {showResult && isSelected && !isCorrectOption && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          {option.image_url && (
                            <SacredImage 
                              src={option.image_url} 
                              alt={`Imagem alternativa ${option.id.toUpperCase()}`}
                              className="min-h-[300px] max-h-[800px] w-auto rounded-lg ml-11"
                              objectFit="contain"
                              onError={() => {}}
                            />
                          )}
                        </Label>
                      </div>
                    );
                })}
              </RadioGroup>

              {/* Resultado e Taxa Prevista após resposta */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`p-4 rounded-xl ${isCorrect ? 'bg-green-500/10' : 'bg-orange-500/10'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Correto! +10 XP
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          Resposta incorreta
                        </>
                      )}
                    </h4>
                    
                    {/* Taxa de Acerto Prevista - Exibida após resposta */}
                    {(() => {
                      const prediction = predictSuccessRate({
                        difficulty: currentQuestion.difficulty || 'medio',
                        questionText: currentQuestion.question_text,
                        options: currentQuestion.options,
                        explanation: currentQuestion.explanation,
                        tema: (currentQuestion as any).tema,
                        macro: (currentQuestion as any).macro,
                      });
                      return (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Taxa esperada</p>
                          <p className={cn("text-lg font-bold", getSuccessRateColor(prediction.rate))}>
                            {prediction.rate}%
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {currentQuestion.explanation && (
                    <QuestionResolution
                      resolutionText={currentQuestion.explanation}
                      difficulty={currentQuestion.difficulty}
                      tema={currentQuestion.topic}
                    />
                  )}
                </motion.div>
              )}
            </CardContent>

            {/* Footer com botões */}
            <div className="px-6 py-4 border-t bg-muted/30 flex justify-between">
              <Button
                variant="ghost"
                disabled={currentIndex === 0}
                onClick={() => setSelectedAnswer(null)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Limpar
              </Button>

              {!showResult ? (
                <Button
                  disabled={!selectedAnswer || isRecording}
                  onClick={onSubmitAnswer}
                  className="gap-2"
                >
                  {isRecording ? "Verificando..." : "Confirmar Resposta"}
                  <Zap className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={onNextQuestion} className="gap-2">
                  Próxima Questão
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Stats em tempo real */}
      <div className="flex justify-center gap-4">
        <Badge variant="outline" className="gap-1 px-3 py-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          {getStats().correct} corretas
        </Badge>
        <Badge variant="outline" className="gap-1 px-3 py-1">
          <XCircle className="h-3 w-3 text-red-500" />
          {getStats().wrong} erradas
        </Badge>
      </div>
    </div>
  );
}

export default QuestionPractice;
