// ============================================
// ⚡ RÁPIDO TREINO MODAL - Sessão de Prática
// Extraído de AlunoQuestoes.tsx para otimização de build
// ============================================

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, Target, CheckCircle2, XCircle, 
  ArrowLeft, ArrowRight, Trophy, BookOpen, 
  Loader2, Zap, AlertCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import QuestionEnunciado from "@/components/shared/QuestionEnunciado";
import QuestionTextField from "@/components/shared/QuestionTextField";
import QuestionResolution from "@/components/shared/QuestionResolution";
import { QuestionBadgesCompact } from "@/components/shared/QuestionMetadataBadges";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";
import type { Question } from "./QuestionModal";

// ============================================
// TIPOS
// ============================================

interface RapidoTreinoModalProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  onComplete: (results: { correct: number; total: number }, answersRecord: Record<string, { answer: string; isCorrect: boolean }>) => void;
}

// ============================================
// COMPONENTE
// ============================================

export function RapidoTreinoModal({ open, onClose, questions, onComplete }: RapidoTreinoModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; isCorrect: boolean }>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ⚡ PERFORMANCE TIERING — Adapta visual ao dispositivo
  const perf = useConstitutionPerformance();
  // 🔒 FORÇAR DESIGN 2300 PREMIUM SEMPRE (Year 2300 Cinematic Standard)
  const isHighEnd = true;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100;
  const isComplete = currentIndex >= questions.length;

  // Reset on open
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setAnswers({});
      setSelectedOption(null);
      setShowResult(false);
    }
  }, [open]);

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedOption || !user?.id) return;

    setIsSubmitting(true);
    const isCorrect = selectedOption === currentQuestion.correct_answer;

    // Registrar tentativa
    try {
      const { error: insertError } = await supabase.from('question_attempts').insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        selected_answer: selectedOption,
        is_correct: isCorrect,
        xp_earned: 0, // MODO_TREINO: 0 XP
        time_spent_seconds: 0,
      });
      
      if (insertError) {
        console.error('[TREINO] Erro ao registrar tentativa:', insertError);
        toast.error('Erro ao salvar resposta. Tente novamente.');
      } else {
        console.log('[TREINO] ✅ Tentativa registrada:', { questionId: currentQuestion.id, isCorrect });
      }
    } catch (err) {
      console.error('[TREINO] Exceção ao registrar tentativa:', err);
      toast.error('Erro inesperado ao salvar resposta.');
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { answer: selectedOption, isCorrect }
    }));
    setShowResult(true);
    setIsSubmitting(false);
  };

  const handleNext = () => {
    const finalAnswers = {
      ...answers,
      ...(currentQuestion && selectedOption ? { [currentQuestion.id]: { answer: selectedOption, isCorrect: selectedOption === currentQuestion.correct_answer } } : {}),
    };
    
    if (currentIndex + 1 >= questions.length) {
      const correct = Object.values(finalAnswers).filter(a => a.isCorrect).length;
      
      // Invalidar queries de performance
      queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['student-taxonomy-performance'] });
      queryClient.invalidateQueries({ queryKey: ['student-performance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-trends'] });
      
      onComplete({ correct, total: questions.length }, finalAnswers);
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setSelectedOption(null);
    setShowResult(false);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevQuestion = questions[prevIndex];
      const prevAnswer = answers[prevQuestion.id];
      
      setCurrentIndex(prevIndex);
      setSelectedOption(prevAnswer?.answer || null);
      setShowResult(!!prevAnswer);
    }
  };

  if (!currentQuestion || isComplete) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-5xl max-h-[98vh] overflow-hidden flex flex-col p-0 border-amber-500/20",
        isHighEnd ? "bg-gradient-to-br from-background via-background to-amber-950/10" : "bg-background"
      )}>
        {/* HEADER */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-yellow-500/10 to-orange-600/20" />
          {isHighEnd && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
          )}
          
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
          
          <DialogHeader className="relative z-10 p-5 pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {isHighEnd && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl blur-lg opacity-50 animate-pulse" />
                  )}
                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                    RÁPIDO TREINO
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                      <Brain className="h-3 w-3" />
                      {currentIndex + 1}/{questions.length}
                    </span>
                    <span className="text-xs text-muted-foreground/60">0 XP</span>
                  </DialogDescription>
                </div>
              </div>
              
              {/* Progress Orb */}
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-amber-500/50 bg-background/80">
                  <span className="text-lg font-black text-amber-400">{Math.round(progress)}%</span>
                  {isHighEnd && (
                    <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/20" />
                      <circle 
                        cx="28" cy="28" r="24" fill="none" stroke="#f59e0b" strokeWidth="2.5"
                        strokeDasharray={`${progress * 1.51} 151`}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
            
            {/* Barra de progresso */}
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div 
                  className={cn(
                    "h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-300",
                    isHighEnd && "shadow-lg shadow-amber-500/20"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {isHighEnd && questions.length <= 15 && (
                <div className="flex justify-between mt-1.5">
                  {questions.map((_, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        i < currentIndex ? "bg-amber-500" :
                        i === currentIndex ? "bg-yellow-400" :
                        "bg-muted/30"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <ScrollArea className="flex-1 px-5">
          <div className="py-4 space-y-4">
            {/* Metadata compacto */}
            <div className="flex flex-wrap items-center gap-1.5">
              <QuestionBadgesCompact question={currentQuestion} />
            </div>

            {/* Card do Enunciado */}
            <div className="relative">
              {isHighEnd && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/20 rounded-xl blur opacity-50" />
              )}
              <div className={cn(
                "relative bg-card/95 rounded-xl p-5 border border-amber-500/15",
                isHighEnd && "backdrop-blur-sm"
              )}>
                <QuestionEnunciado
                  questionText={currentQuestion.question_text}
                  imageUrl={currentQuestion.image_url}
                  imageUrls={currentQuestion.image_urls}
                  banca={currentQuestion.banca}
                  ano={currentQuestion.ano}
                  textSize="base"
                />
              </div>
            </div>

            {/* Alternativas */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                <Target className="h-4 w-4 text-amber-500" />
                <span>Selecione a alternativa correta:</span>
              </div>
              
              <RadioGroup
                value={selectedOption || ""}
                onValueChange={setSelectedOption}
                disabled={showResult}
                className="space-y-2"
              >
                {(currentQuestion.options || []).map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isCorrectOption = option.id === currentQuestion.correct_answer;
                  
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer",
                        isHighEnd ? "transition-all duration-200" : "transition-colors duration-100",
                        !showResult && !isSelected && "border-border/50 hover:border-amber-500/50 hover:bg-amber-500/5",
                        !showResult && isSelected && "border-amber-500 bg-amber-500/10",
                        isHighEnd && !showResult && isSelected && "shadow-md shadow-amber-500/10",
                        showResult && isCorrectOption && "border-green-500 bg-green-500/10",
                        showResult && isSelected && !isCorrectOption && "border-red-500 bg-red-500/10",
                        showResult && !isCorrectOption && !isSelected && "opacity-50",
                        showResult && "cursor-not-allowed"
                      )}
                      onClick={() => !showResult && setSelectedOption(option.id)}
                    >
                      <RadioGroupItem value={option.id} id={`rapid-${option.id}`} className="sr-only" />
                      
                      <div className={cn(
                        "relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base",
                        isHighEnd ? "transition-all duration-200" : "transition-colors duration-100",
                        !showResult && !isSelected && "bg-muted/50 text-muted-foreground",
                        !showResult && isSelected && "bg-amber-500 text-white",
                        isHighEnd && !showResult && isSelected && "shadow-md shadow-amber-500/20",
                        showResult && isCorrectOption && "bg-green-500 text-white",
                        showResult && isSelected && !isCorrectOption && "bg-red-500 text-white"
                      )}>
                        {option.id.toUpperCase()}
                        {showResult && isCorrectOption && (
                          <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-green-400 fill-green-500" />
                        )}
                        {showResult && isSelected && !isCorrectOption && (
                          <XCircle className="absolute -top-1 -right-1 h-4 w-4 text-red-400 fill-red-500" />
                        )}
                      </div>
                      
                      <QuestionTextField 
                        content={option.text} 
                        fieldType="alternativa" 
                        textSize="sm" 
                        className="flex-1 pt-1.5 leading-relaxed"
                      />
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* RESULTADO + RESOLUÇÃO */}
            {showResult && (
              <div className="space-y-4 animate-fade-in">
                {/* Banner de Resultado */}
                <div className={cn(
                  "relative overflow-hidden rounded-xl p-5",
                  selectedOption === currentQuestion.correct_answer
                    ? "bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/30"
                    : "bg-gradient-to-r from-red-500/15 to-rose-500/10 border border-red-500/30"
                )}>
                  {isHighEnd && (
                    <div className={cn(
                      "absolute inset-0 blur-2xl opacity-20",
                      selectedOption === currentQuestion.correct_answer ? "bg-green-500" : "bg-red-500"
                    )} />
                  )}
                  
                  <div className="relative flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-lg",
                      selectedOption === currentQuestion.correct_answer ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      {selectedOption === currentQuestion.correct_answer ? (
                        <CheckCircle2 className="h-7 w-7 text-green-400" />
                      ) : (
                        <XCircle className="h-7 w-7 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        "text-lg font-bold",
                        selectedOption === currentQuestion.correct_answer ? "text-green-400" : "text-red-400"
                      )}>
                        {selectedOption === currentQuestion.correct_answer ? "Excelente! Resposta Correta!" : "Resposta Incorreta"}
                      </p>
                      {selectedOption !== currentQuestion.correct_answer && (
                        <p className="text-sm text-muted-foreground">
                          Correta: <span className="font-bold text-green-400">{currentQuestion.correct_answer.toUpperCase()}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resolução Comentada */}
                {currentQuestion.explanation ? (
                  <div className="relative">
                    {isHighEnd && (
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 rounded-xl blur opacity-50" />
                    )}
                    <div className={cn(
                      "relative bg-card/95 rounded-xl p-5 border border-emerald-500/20",
                      isHighEnd && "backdrop-blur-sm"
                    )}>
                      <div className="flex items-center gap-2 mb-3 text-emerald-400">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-bold">Resolução Comentada</span>
                      </div>
                      <QuestionResolution
                        resolutionText={currentQuestion.explanation}
                        banca={currentQuestion.banca}
                        ano={currentQuestion.ano}
                        difficulty={currentQuestion.difficulty}
                        tema={currentQuestion.tema}
                        macro={currentQuestion.macro}
                        micro={currentQuestion.micro}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-muted/50 bg-muted/20 text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground/50" />
                    Resolução não disponível.
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* FOOTER */}
        <div className={cn(
          "relative border-t border-amber-500/20 p-4",
          isHighEnd ? "bg-gradient-to-r from-amber-950/15 via-background to-yellow-950/15" : "bg-background"
        )}>
          {isHighEnd && (
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          )}
          
          <div className="flex gap-3">
            {/* Botão Anterior */}
            <Button 
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              size="lg"
              variant="outline"
              className={cn(
                "h-12 px-4 text-base font-bold border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 disabled:opacity-40",
                isHighEnd ? "transition-all duration-200" : "transition-colors duration-100"
              )}
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">ANTERIOR</span>
            </Button>
            
            {/* Botão Confirmar */}
            {!showResult && (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={!selectedOption || isSubmitting}
                size="lg"
                className={cn(
                  "flex-1 h-12 text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black disabled:opacity-50",
                  isHighEnd ? "shadow-lg shadow-amber-500/20 transition-all duration-200" : "transition-colors duration-100"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                )}
                CONFIRMAR
              </Button>
            )}
            
            {/* Espaçador quando já confirmou */}
            {showResult && <div className="flex-1" />}
            
            {/* Botão Próxima/Finalizar */}
            <Button 
              onClick={handleNext} 
              size="lg"
              className={cn(
                "h-12 px-4 text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black",
                isHighEnd ? "shadow-lg shadow-amber-500/20 transition-all duration-200" : "transition-colors duration-100"
              )}
            >
              {currentIndex + 1 >= questions.length ? (
                <>
                  <Trophy className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline">FINALIZAR</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">PRÓXIMA</span>
                  <ArrowRight className="h-5 w-5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
