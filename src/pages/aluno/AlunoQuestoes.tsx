// ============================================
// 📚 BANCO DE QUESTÕES - ÁREA DO ALUNO
// Arquitetura: 16 Blocos Semânticos
// Espelho real-time de /gestaofc/questoes
// Scoring: SERVER_SIDE_ONLY
// ============================================

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Search, Brain, Target, 
  CheckCircle2, XCircle, ChevronRight, Zap,
  Clock, Trophy, BookOpen, Loader2,
  ArrowLeft, ArrowRight, RotateCcw,
  Lightbulb, AlertCircle, Star, Play,
  TrendingUp, BarChart3, Filter, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import QuestionTextField from "@/components/shared/QuestionTextField";
import { BANCAS, BANCAS_POR_CATEGORIA, CATEGORIA_LABELS, getBancaLabel } from "@/constants/bancas";
import { formatBancaHeader } from "@/lib/bancaNormalizer";
import QuestionEnunciado, { cleanQuestionText } from "@/components/shared/QuestionEnunciado";
import { VirtualizedStudentQuestionList } from "@/components/aluno/questoes/VirtualizedStudentQuestionList";
import QuestionResolution from "@/components/shared/QuestionResolution";
import { useTaxonomyForSelects } from "@/hooks/useQuestionTaxonomy";
import { QuestionBadgesCompact } from "@/components/shared/QuestionMetadataBadges";
import { TreinoReviewModal } from "@/components/aluno/questoes/TreinoReviewModal";
import { StudentPerformanceAnalytics } from "@/components/aluno/questoes/StudentPerformanceAnalytics";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";

// ============================================
// BLOCK_03: DATA CONTRACT - TIPOS
// ============================================

interface QuestionOption {
  id: string;
  text: string;
  image_url?: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type?: 'multiple_choice' | 'discursive' | 'outros';
  options: QuestionOption[];
  correct_answer: string;
  explanation?: string | null;
  difficulty: "facil" | "medio" | "dificil";
  banca?: string | null;
  ano?: number | null;
  points: number;
  is_active: boolean;
  created_at: string;
  // Estrutura hierárquica (BLOCK_06: ACADEMIC_FILTERS)
  macro?: string | null;
  micro?: string | null;
  tema?: string | null;
  subtema?: string | null;
  // QUESTION_DOMAIN: Agrupamento
  tags?: string[] | null;
  // Imagens
  image_url?: string | null;
  image_urls?: any[] | null;
}

interface QuestionAttempt {
  id?: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  selected_answer: string;
  xp_earned?: number;
  created_at?: string;
}

// BLOCK_11: Métricas e Analytics
interface UserMetrics {
  total_attempted: number;
  total_correct: number;
  total_incorrect: number;
  accuracy_percentage: number;
  performance_by_macro: Record<string, { correct: number; total: number }>;
  performance_by_difficulty: Record<string, { correct: number; total: number }>;
}

// ============================================
// CONSTANTES - DESIGN TOKENS
// ============================================

const DIFFICULTY_COLORS = {
  facil: "bg-green-500/10 text-green-600 border-green-500/20",
  medio: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  dificil: "bg-red-500/10 text-red-600 border-red-500/20",
};

const DIFFICULTY_LABELS = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

// BLOCK_09: Limites do "Criar Questões"
const RAPIDO_TREINO_LIMIT = 20;

// ============================================
// BLOCK_08: QUESTION STYLE - MODAL DE RESOLUÇÃO
// ============================================

interface QuestionModalProps {
  open: boolean;
  onClose: () => void;
  question: Question | null;
  userAttempt: QuestionAttempt | null;
  onAnswer: (questionId: string, selectedAnswer: string) => void;
  isSubmitting: boolean;
}

function QuestionModal({ open, onClose, question, userAttempt, onAnswer, isSubmitting }: QuestionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [discursiveAnswer, setDiscursiveAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const isDiscursive = question?.question_type === 'discursive';

  useEffect(() => {
    if (question && userAttempt) {
      setSelectedOption(userAttempt.selected_answer);
      setDiscursiveAnswer(userAttempt.selected_answer || '');
      setHasAnswered(true);
      setShowExplanation(true);
    } else {
      setSelectedOption(null);
      setDiscursiveAnswer('');
      setHasAnswered(false);
      setShowExplanation(false);
    }
  }, [question?.id, userAttempt]);

  const handleSubmitAnswer = () => {
    if (!question) return;
    
    if (isDiscursive) {
      if (!discursiveAnswer.trim()) return;
      onAnswer(question.id, discursiveAnswer);
    } else {
      if (!selectedOption) return;
      onAnswer(question.id, selectedOption);
    }
    
    setHasAnswered(true);
    setShowExplanation(true);
  };

  const isCorrect = hasAnswered && !isDiscursive && selectedOption === question?.correct_answer;

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Resolver Questão
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge className={DIFFICULTY_COLORS[question.difficulty]}>
                    {DIFFICULTY_LABELS[question.difficulty]}
                  </Badge>
                  <Badge variant="outline">
                    🏛️ {formatBancaHeader(question.banca, question.ano, question.question_text)}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    <Trophy className="h-3 w-3 mr-1" />
                    {question.points} pts
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 py-4">
            {/* Enunciado */}
            <div className="bg-muted/50 rounded-xl p-4 border">
              <QuestionEnunciado
                questionText={question.question_text}
                imageUrl={question.image_url}
                imageUrls={question.image_urls}
                banca={question.banca}
                ano={question.ano}
                textSize="sm"
                showImageLabel
              />
            </div>

            {/* BLOCK_08: Alternativas ou Campo de Texto (Discursiva) */}
            {isDiscursive ? (
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  ✍️ Sua Resposta:
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Discursiva
                  </Badge>
                </Label>
                <Textarea
                  placeholder="Digite sua resposta aqui..."
                  value={discursiveAnswer}
                  onChange={(e) => setDiscursiveAnswer(e.target.value)}
                  disabled={hasAnswered}
                  className={cn(
                    "min-h-[200px] text-sm transition-all",
                    hasAnswered && "bg-muted/50 cursor-not-allowed"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Escreva sua resposta de forma completa. Será avaliada posteriormente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Alternativas:</Label>
                <RadioGroup
                  value={selectedOption || ""}
                  onValueChange={setSelectedOption}
                  disabled={hasAnswered}
                  className="space-y-2"
                >
                  {(question.options || []).map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isCorrectOption = option.id === question.correct_answer;
                    
                    let optionClass = "border-muted-foreground/30 hover:border-primary/50";
                    if (hasAnswered) {
                      if (isCorrectOption) {
                        optionClass = "border-green-500 bg-green-500/10";
                      } else if (isSelected && !isCorrectOption) {
                        optionClass = "border-red-500 bg-red-500/10";
                      }
                    } else if (isSelected) {
                      optionClass = "border-primary bg-primary/10";
                    }

                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          optionClass,
                          hasAnswered && "cursor-not-allowed"
                        )}
                        onClick={() => !hasAnswered && setSelectedOption(option.id)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                          <Label
                            htmlFor={option.id}
                            className={cn(
                              "w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold text-sm cursor-pointer",
                              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                              hasAnswered && isCorrectOption && "border-green-500 bg-green-500 text-white",
                              hasAnswered && isSelected && !isCorrectOption && "border-red-500 bg-red-500 text-white"
                            )}
                          >
                            {option.id.toUpperCase()}
                          </Label>
                          <QuestionTextField content={option.text} fieldType="alternativa" textSize="sm" className="flex-1" inline />
                          {hasAnswered && isCorrectOption && (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                          {hasAnswered && isSelected && !isCorrectOption && (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        {option.image_url && (
                          <img 
                            src={option.image_url} 
                            alt={`Imagem alternativa ${option.id.toUpperCase()}`}
                            className="max-h-[300px] w-auto object-contain rounded-lg ml-11"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* Resultado */}
            {hasAnswered && (
              <div
                className={cn(
                  "p-4 rounded-xl border-2",
                  isDiscursive
                    ? "bg-amber-500/10 border-amber-500"
                    : isCorrect 
                      ? "bg-green-500/10 border-green-500" 
                      : "bg-red-500/10 border-red-500"
                )}
              >
                <div className="flex items-center gap-3">
                  {isDiscursive ? (
                    <>
                      <Clock className="h-6 w-6 text-amber-500" />
                      <div>
                        <p className="font-bold text-amber-600">Resposta Enviada!</p>
                        <p className="text-sm text-muted-foreground">
                          ✍️ Sua resposta será avaliada pelo professor
                        </p>
                      </div>
                    </>
                  ) : isCorrect ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="font-bold text-green-600">Parabéns! Você acertou!</p>
                        <p className="text-sm text-muted-foreground">
                          🎯 Modo Treino - sem pontos
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-500" />
                      <div>
                        <p className="font-bold text-red-600">Resposta incorreta</p>
                        <p className="text-sm text-muted-foreground">
                          A resposta correta era: {question.correct_answer.toUpperCase()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Explicação */}
            {showExplanation && question.explanation && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <QuestionResolution
                  resolutionText={question.explanation}
                  banca={question.banca}
                  ano={question.ano}
                  difficulty={question.difficulty}
                  tema={question.tema}
                  macro={question.macro}
                  micro={question.micro}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {!hasAnswered && (
            <Button 
              onClick={handleSubmitAnswer}
              disabled={isDiscursive ? !discursiveAnswer.trim() || isSubmitting : !selectedOption || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {isDiscursive ? 'Enviar Resposta' : 'Confirmar Resposta'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// BLOCK_09: RÁPIDO TREINO SESSION MODAL
// ============================================

interface RapidoTreinoModalProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  onComplete: (results: { correct: number; total: number }, answersRecord: Record<string, { answer: string; isCorrect: boolean }>) => void;
}

function RapidoTreinoModal({ open, onClose, questions, onComplete }: RapidoTreinoModalProps) {
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

    // BLOCK_10: Scoring SERVER_SIDE - Registrar tentativa
    // P0 FIX: Verificar error retornado pelo Supabase (não lança exceção!)
    try {
      const { error: insertError } = await supabase.from('question_attempts').insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        selected_answer: selectedOption,
        is_correct: isCorrect,
        xp_earned: 0, // MODO_TREINO: 0 XP
        time_spent_seconds: 0, // P0 FIX: Campo opcional mas útil
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
    // Atualizar answers com a resposta atual antes de calcular
    const finalAnswers = {
      ...answers,
      ...(currentQuestion && selectedOption ? { [currentQuestion.id]: { answer: selectedOption, isCorrect: selectedOption === currentQuestion.correct_answer } } : {}),
    };
    
    if (currentIndex + 1 >= questions.length) {
      // Sessão completa - BLOCK_11: Atualizar métricas e passar para revisão
      const correct = Object.values(finalAnswers).filter(a => a.isCorrect).length;
      
      // P0 FIX: Invalidar TODAS as queries de performance para atualização em tempo real
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
        {/* ═══════════════════════════════════════════════════════════
            HEADER — Performance Tiered (blur/animate-pulse apenas em high-end)
        ═══════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden">
          {/* Background: gradientes leves sempre, efeitos pesados condicionais */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-yellow-500/10 to-orange-600/20" />
          {isHighEnd && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
          )}
          
          {/* Linhas decorativas (sem animação) */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
          
          <DialogHeader className="relative z-10 p-5 pb-3">
            <div className="flex items-center justify-between gap-4">
              {/* Título com ícone (animate-pulse só em high-end) */}
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
              
              {/* Progress Orb simplificado (SVG apenas em high-end) */}
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
            
            {/* Barra de progresso (simplificada, shadow condicional) */}
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
              {/* Indicadores só em high-end */}
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

        {/* ═══════════════════════════════════════════════════════════
            CONTEÚDO PRINCIPAL — Performance Optimized
        ═══════════════════════════════════════════════════════════ */}
        <ScrollArea className="flex-1 px-5">
          <div className="py-4 space-y-4">
            {/* Metadata compacto */}
            <div className="flex flex-wrap items-center gap-1.5">
              <QuestionBadgesCompact question={currentQuestion} />
            </div>

            {/* Card do Enunciado (borda gradient apenas em high-end) */}
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

            {/* Alternativas — Otimizadas (transições menores em low-end) */}
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
                      
                      {/* Círculo da letra */}
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
                      
                      {/* Texto da alternativa */}
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

            {/* ═══════════════════════════════════════════════════════════
                RESULTADO + RESOLUÇÃO — Performance Tiered
            ═══════════════════════════════════════════════════════════ */}
            {showResult && (
              <div className="space-y-4 animate-fade-in">
                {/* Banner de Resultado */}
                <div className={cn(
                  "relative overflow-hidden rounded-xl p-5",
                  selectedOption === currentQuestion.correct_answer
                    ? "bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/30"
                    : "bg-gradient-to-r from-red-500/15 to-rose-500/10 border border-red-500/30"
                )}>
                  {/* Glow só em high-end */}
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

        {/* ═══════════════════════════════════════════════════════════
            FOOTER — Compacto e Performático
        ═══════════════════════════════════════════════════════════ */}
        <div className={cn(
          "relative border-t border-amber-500/20 p-4",
          isHighEnd ? "bg-gradient-to-r from-amber-950/15 via-background to-yellow-950/15" : "bg-background"
        )}>
          {isHighEnd && (
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          )}
          
        {/* NAVEGAÇÃO LIVRE: Permite transitar entre questões a qualquer momento */}
          <div className="flex gap-3">
            {/* Botão Anterior - sempre visível */}
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
            
            {/* Botão Confirmar - só aparece se não respondeu ainda */}
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
            
            {/* Botão Próxima/Finalizar - sempre visível */}
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

// ============================================
// COMPONENTE PRINCIPAL - 16 BLOCOS SEMÂNTICOS
// ============================================

export default function AlunoQuestoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // ⚡ PERFORMANCE TIERING — Adapta visual ao dispositivo
  const perf = useConstitutionPerformance();
  // 🔒 FORÇAR DESIGN 2300 PREMIUM SEMPRE (Year 2300 Cinematic Standard)
  const isHighEnd = true;
  
  // BLOCK_06: Taxonomy compartilhada
  const { macros, getMicrosForSelect, getTemasForSelect, getSubtemasForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();

  // ==========================================================
  // PATCH: Compatibilidade Taxonomy(value) x Questões(label)
  // - Os Selects usam `value` (normalizado)
  // - A tabela `quiz_questions` guarda `macro/micro/tema/subtema` como texto humano (label)
  // Portanto, sempre que filtrarmos no banco OU no client, convertemos value → label.
  // ==========================================================

  const stripTaxLabel = useCallback((label?: string | null) => {
    if (!label) return '';
    // remove prefixos tipo "🧪 " e espaços extras
    return label.replace(/^[^\p{L}\p{N}]+/gu, '').trim();
  }, []);

  const getMacroLabelForDb = useCallback(
    (macroValue: string) => {
      const found = macros.find((m) => m.value === macroValue);
      // LEI SUPREMA: NUNCA expor VALUE - retorna '' se não encontrar
      return stripTaxLabel(found?.label) || '';
    },
    [macros, stripTaxLabel]
  );

  const getMicroLabelForDb = useCallback(
    (macroValue: string, microValue: string) => {
      const micros = getMicrosForSelect(macroValue === 'todas' ? '' : macroValue);
      const found = micros.find((m) => m.value === microValue);
      // LEI SUPREMA: NUNCA expor VALUE - retorna '' se não encontrar
      return stripTaxLabel(found?.label) || '';
    },
    [getMicrosForSelect, stripTaxLabel]
  );

  const getTemaLabelForDb = useCallback(
    (microValue: string, temaValue: string) => {
      const temas = getTemasForSelect(microValue === 'todas' ? '' : microValue);
      const found = temas.find((t) => t.value === temaValue);
      // LEI SUPREMA: NUNCA expor VALUE - retorna '' se não encontrar
      return stripTaxLabel(found?.label) || '';
    },
    [getTemasForSelect, stripTaxLabel]
  );

  const getSubtemaLabelForDb = useCallback(
    (temaValue: string, subtemaValue: string) => {
      const subtemas = getSubtemasForSelect(temaValue === 'todas' ? '' : temaValue);
      const found = subtemas.find((s) => s.value === subtemaValue);
      // LEI SUPREMA: NUNCA expor VALUE - retorna '' se não encontrar
      return stripTaxLabel(found?.label) || '';
    },
    [getSubtemasForSelect, stripTaxLabel]
  );

  
  // State
  const [busca, setBusca] = useState("");
  const [dificuldade, setDificuldade] = useState("todas");
  const [banca, setBanca] = useState("todas");
  const [activeTab, setActiveTab] = useState("todas"); // BLOCK_05: PROGRESS_STATUS
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  
  // BLOCK_06: Filtros hierárquicos (cascata)
  const [filterMacro, setFilterMacro] = useState("todas");
  const [filterMicro, setFilterMicro] = useState("todas");
  const [filterTema, setFilterTema] = useState("todas");
  const [filterSubtema, setFilterSubtema] = useState("todas");
  
  // BLOCK_07: Filtros operacionais
  const [anoFilter, setAnoFilter] = useState("todas");
  const [sortOrder, setSortOrder] = useState("newest");
  
  // BLOCK_07B: Filtros ESTILO DA QUESTÃO e ESTILO ENEM
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'all' | 'multiple_choice' | 'discursive' | 'outros'>('all');
  const [estiloEnemFilter, setEstiloEnemFilter] = useState(false);

  // BLOCK_07C: Verifica se ALGUM filtro acadêmico está ativo (obriga seleção)
  const isAnyFilterActive = useMemo(() => {
    return (
      filterMacro !== 'todas' ||
      filterMicro !== 'todas' ||
      filterTema !== 'todas' ||
      filterSubtema !== 'todas' ||
      dificuldade !== 'todas' ||
      banca !== 'todas' ||
      anoFilter !== 'todas' ||
      questionTypeFilter !== 'all' ||
      estiloEnemFilter === true
    );
  }, [filterMacro, filterMicro, filterTema, filterSubtema, dificuldade, banca, anoFilter, questionTypeFilter, estiloEnemFilter]);

  // BLOCK_09: Rápido Treino state
  const [rapidoTreinoOpen, setRapidoTreinoOpen] = useState(false);
  const [rapidoTreinoQuestions, setRapidoTreinoQuestions] = useState<Question[]>([]);
  
  // BLOCK_12: Treino Review state (pós-treino com resoluções)
  const [treinoReviewOpen, setTreinoReviewOpen] = useState(false);
  const [treinoReviewQuestions, setTreinoReviewQuestions] = useState<Question[]>([]);
  const [treinoReviewAnswers, setTreinoReviewAnswers] = useState<Record<string, { answer: string; isCorrect: boolean }>>({});
  const [treinoReviewResults, setTreinoReviewResults] = useState({ correct: 0, total: 0 });
  
  // BLOCK_PAGINATION: Paginação server-side (ESCALA 5000+)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;
  
  // Reset página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMacro, filterMicro, filterTema, filterSubtema, dificuldade, banca, anoFilter, questionTypeFilter, estiloEnemFilter]);
  
  // BLOCK_04: PAGINAÇÃO SERVER-SIDE - Substituiu loop 45k
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['student-questions', 'MODO_TREINO', currentPage, ITEMS_PER_PAGE, filterMacro, filterMicro, filterTema, filterSubtema, dificuldade, banca, anoFilter, questionTypeFilter, estiloEnemFilter],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('quiz_questions')
        .select('*', { count: 'exact' })
        .contains('tags', ['MODO_TREINO'])
        .eq('is_active', true);

      // Aplicar filtros server-side (ACADEMIC_FILTERS)
      if (filterMacro !== 'todas') {
        query = query.eq('macro', getMacroLabelForDb(filterMacro));
      }
      if (filterMicro !== 'todas') {
        query = query.eq('micro', getMicroLabelForDb(filterMacro, filterMicro));
      }
      if (filterTema !== 'todas') {
        query = query.eq('tema', getTemaLabelForDb(filterMicro, filterTema));
      }
      if (filterSubtema !== 'todas') {
        query = query.eq('subtema', getSubtemaLabelForDb(filterTema, filterSubtema));
      }
      
      // Aplicar filtros operacionais
      if (dificuldade !== 'todas') query = query.eq('difficulty', dificuldade);
      if (banca !== 'todas') query = query.eq('banca', banca);
      if (anoFilter !== 'todas') query = query.eq('ano', parseInt(anoFilter));
      
      // BLOCK_07B: Filtro ESTILO DA QUESTÃO (question_type)
      if (questionTypeFilter !== 'all') {
        query = query.eq('question_type', questionTypeFilter);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const mapped = (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as unknown as QuestionOption[]) : [],
        difficulty: (q.difficulty || 'medio') as "facil" | "medio" | "dificil",
      })) as Question[];

      return { data: mapped, totalCount: count || 0 };
    },
    staleTime: 30_000, // PATCH 5K: 30s cache para evitar sobrecarga
  });

  // Extrair dados da query
  const questions = questionsData?.data || [];
  const totalCount = questionsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // BLOCK_11: Buscar tentativas do usuário (métricas)
  const { data: attempts = [] } = useQuery({
    queryKey: ['student-question-attempts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as QuestionAttempt[];
    },
    enabled: !!user?.id,
  });

  // BLOCK_10: Mutation para responder (SERVER_SIDE scoring)
  const answerMutation = useMutation({
    mutationFn: async ({ questionId, selectedAnswer }: { questionId: string; selectedAnswer: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const question = questions.find(q => q.id === questionId);
      if (!question) throw new Error("Questão não encontrada");

      const isCorrect = selectedAnswer === question.correct_answer;
      
      // BLOCK_10: MODO_TREINO sempre 0 XP (SERVER_SIDE_ONLY)
      const { error } = await supabase
        .from('question_attempts')
        .insert({
          user_id: user.id,
          question_id: questionId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          xp_earned: 0,
        });

      if (error) throw error;
      return { isCorrect };
    },
    onSuccess: (result) => {
      // BLOCK_11: Atualizar TODAS as métricas imediatamente - P0 FIX
      queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['student-taxonomy-performance'] });
      queryClient.invalidateQueries({ queryKey: ['student-performance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-trends'] });
      
      if (result.isCorrect) {
        toast.success("Você acertou! 🎯 (Modo Treino)");
      } else {
        toast.error("Resposta incorreta. Continue estudando!");
      }
    },
    onError: () => {
      toast.error('Erro ao registrar resposta');
    },
  });

  // BLOCK_04: HEADER_CONTEXT - Estatísticas
  // PATCH: stats.total usa totalCount (banco inteiro), não questions.length (página atual)
  const stats = useMemo(() => {
    const total = totalCount; // ← Contagem REAL do banco de dados
    const questionsAttempted = new Set(attempts.map(a => a.question_id));
    const resolvidas = questionsAttempted.size;
    const acertos = attempts.filter(a => a.is_correct).length;
    const erros = attempts.filter(a => !a.is_correct).length;
    const taxaAcerto = resolvidas > 0 ? Math.round((acertos / attempts.length) * 100) : 0;
    const pendentes = total - resolvidas;
    
    return { total, resolvidas, acertos, erros, taxaAcerto, pendentes };
  }, [totalCount, attempts]);

  // Map de tentativas por questão (guarda a PRIMEIRA tentativa - menor created_at)
  const attemptsByQuestion = useMemo(() => {
    const map = new Map<string, QuestionAttempt>();
    
    // Agrupa todas tentativas por question_id e pega a mais antiga (primeira)
    attempts.forEach(a => {
      const existing = map.get(a.question_id);
      if (!existing) {
        map.set(a.question_id, a);
      } else if (a.created_at && existing.created_at) {
        // Mantém a tentativa com created_at mais antigo
        if (new Date(a.created_at) < new Date(existing.created_at)) {
          map.set(a.question_id, a);
        }
      }
    });
    
    return map;
  }, [attempts]);

  // Anos únicos para filtro
  const uniqueAnos = useMemo(() => {
    const anos = questions.map(q => q.ano).filter(Boolean) as number[];
    return [...new Set(anos)].sort((a, b) => b - a);
  }, [questions]);

  // BLOCK_07: FILTER ENGINE - Questões filtradas
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // BLOCK_05: PROGRESS_STATUS
    if (activeTab === 'resolvidas') {
      filtered = filtered.filter(q => attemptsByQuestion.has(q.id));
    } else if (activeTab === 'pendentes') {
      filtered = filtered.filter(q => !attemptsByQuestion.has(q.id));
    } else if (activeTab === 'acertos') {
      filtered = filtered.filter(q => attemptsByQuestion.get(q.id)?.is_correct === true);
    } else if (activeTab === 'erros') {
      filtered = filtered.filter(q => attemptsByQuestion.get(q.id)?.is_correct === false);
    }

    // BLOCK_06: ACADEMIC_FILTERS (cascata)
    if (filterMacro !== 'todas') {
      const macroLabel = getMacroLabelForDb(filterMacro);
      filtered = filtered.filter(q => q.macro === macroLabel);
    }
    if (filterMicro !== 'todas') {
      const microLabel = getMicroLabelForDb(filterMacro, filterMicro);
      filtered = filtered.filter(q => q.micro === microLabel);
    }
    if (filterTema !== 'todas') {
      const temaLabel = getTemaLabelForDb(filterMicro, filterTema);
      filtered = filtered.filter(q => q.tema === temaLabel);
    }
    if (filterSubtema !== 'todas') {
      const subtemaLabel = getSubtemaLabelForDb(filterTema, filterSubtema);
      filtered = filtered.filter(q => q.subtema === subtemaLabel);
    }

    // BLOCK_07: OPERATIONAL_FILTERS
    if (anoFilter !== 'todas') {
      filtered = filtered.filter(q => q.ano === parseInt(anoFilter));
    }
    if (banca !== 'todas') {
      filtered = filtered.filter(q => q.banca === banca);
    }
    if (dificuldade !== 'todas') {
      filtered = filtered.filter(q => q.difficulty === dificuldade);
    }
    
    // BLOCK_07B: Filtro ESTILO DA QUESTÃO (question_type) - client side fallback
    if (questionTypeFilter !== 'all') {
      filtered = filtered.filter(q => q.question_type === questionTypeFilter);
    }
    
    // BLOCK_07B: Filtro ESTILO ENEM - heurística igual à gestão
    if (estiloEnemFilter) {
      filtered = filtered.filter(q => {
        const qAny = q as any;
        // Verifica flag explícita
        if (qAny.is_estilo_enem === true) return true;
        // Verifica características ENEM (heurística)
        if (qAny.tem_situacao_problema === true) return true;
        if (qAny.tem_texto_base === true) return true;
        if (qAny.tipo_estrutura === 'situacao_problema') return true;
        if (qAny.tipo_estrutura === 'interpretacao_texto') return true;
        if (qAny.tipo_estrutura === 'analise_dados') return true;
        if (qAny.demanda_cognitiva === 'alta' || qAny.demanda_cognitiva === 'muito_alta') return true;
        if (qAny.habilidades_enem?.length > 0) return true;
        // Heurística por tamanho do enunciado (>500 chars = provavelmente contextualizada)
        if (q.question_text && q.question_text.length > 500) return true;
        return false;
      });
    }

    if (busca.trim()) {
      const term = busca.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(term) ||
        q.banca?.toLowerCase().includes(term)
      );
    }

    // BLOCK_07: DISPLAY_CONTROLS - Ordenação
    switch (sortOrder) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'ano_desc':
        filtered.sort((a, b) => (b.ano || 0) - (a.ano || 0));
        break;
      case 'difficulty_asc':
        const diffOrder = { facil: 1, medio: 2, dificil: 3 };
        filtered.sort((a, b) => (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2));
        break;
    }

    return filtered;
  }, [questions, activeTab, filterMacro, filterMicro, filterTema, filterSubtema, anoFilter, banca, dificuldade, busca, sortOrder, attemptsByQuestion, questionTypeFilter, estiloEnemFilter]);

  // BLOCK_09: Iniciar RÁPIDO TREINO - Busca SERVER-SIDE com filtros
  const [isLoadingTreino, setIsLoadingTreino] = useState(false);
  
  const handleStartRapidoTreino = useCallback(async () => {
    setIsLoadingTreino(true);
    
    try {
      // Buscar até RAPIDO_TREINO_LIMIT questões aplicando TODOS os filtros server-side
      let query = supabase
        .from('quiz_questions')
        .select('*')
        .contains('tags', ['MODO_TREINO'])
        .eq('is_active', true);

      // Aplicar filtros server-side (ACADEMIC_FILTERS)
      if (filterMacro !== 'todas') {
        query = query.eq('macro', getMacroLabelForDb(filterMacro));
      }
      if (filterMicro !== 'todas') {
        query = query.eq('micro', getMicroLabelForDb(filterMacro, filterMicro));
      }
      if (filterTema !== 'todas') {
        query = query.eq('tema', getTemaLabelForDb(filterMicro, filterTema));
      }
      if (filterSubtema !== 'todas') {
        query = query.eq('subtema', getSubtemaLabelForDb(filterTema, filterSubtema));
      }
      
      // Aplicar filtros operacionais
      if (dificuldade !== 'todas') query = query.eq('difficulty', dificuldade);
      if (banca !== 'todas') query = query.eq('banca', banca);
      if (anoFilter !== 'todas') query = query.eq('ano', parseInt(anoFilter));

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(RAPIDO_TREINO_LIMIT);

      if (error) throw error;

      const mapped = (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as unknown as QuestionOption[]) : [],
        difficulty: (q.difficulty || 'medio') as "facil" | "medio" | "dificil",
      })) as Question[];

      if (mapped.length === 0) {
        toast.error('Nenhuma questão disponível para treino com esses filtros');
        return;
      }

      // Preferir questões pendentes (não respondidas)
      const attemptedIds = new Set(attempts.map(a => a.question_id));
      const pending = mapped.filter(q => !attemptedIds.has(q.id));
      const questionsForTreino = pending.length > 0 ? pending : mapped;

      setRapidoTreinoQuestions(questionsForTreino.slice(0, RAPIDO_TREINO_LIMIT));
      setRapidoTreinoOpen(true);
    } catch (err) {
      console.error('Erro ao carregar questões para treino:', err);
      toast.error('Erro ao carregar questões');
    } finally {
      setIsLoadingTreino(false);
    }
  }, [filterMacro, filterMicro, filterTema, filterSubtema, dificuldade, banca, anoFilter, attempts]);

  // BLOCK_11: Callback de completar Rápido Treino - Agora abre tela de revisão
  const handleRapidoTreinoComplete = useCallback((results: { correct: number; total: number }, answersRecord: Record<string, { answer: string; isCorrect: boolean }>) => {
    setRapidoTreinoOpen(false);
    
    // Configurar dados para revisão educacional
    setTreinoReviewQuestions(rapidoTreinoQuestions);
    setTreinoReviewAnswers(answersRecord);
    setTreinoReviewResults(results);
    setTreinoReviewOpen(true);
    
    queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
    
    const percentage = Math.round((results.correct / results.total) * 100);
    toast.success(`Treino concluído! ${results.correct}/${results.total} (${percentage}%) — Veja as resoluções abaixo.`);
  }, [rapidoTreinoQuestions, queryClient]);

  // Handler: Reset de tentativa (Tentar Novamente do Zero)
  const [resettingQuestionId, setResettingQuestionId] = useState<string | null>(null);
  
  const handleResetAttempt = useCallback(async (questionId: string) => {
    if (!user?.id) return;
    
    setResettingQuestionId(questionId);
    try {
      // Deletar TODAS as tentativas do usuário para esta questão
      const { error } = await supabase
        .from('question_attempts')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId);
      
      if (error) throw error;
      
      // Atualizar cache local
      queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
      toast.success('Tentativa removida! Você pode resolver novamente.');
    } catch (err) {
      console.error('Erro ao resetar tentativa:', err);
      toast.error('Erro ao resetar tentativa');
    } finally {
      setResettingQuestionId(null);
    }
  }, [user?.id, queryClient]);

  // Handlers
  const handleOpenQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionModalOpen(true);
  };

  const handleAnswerQuestion = (questionId: string, selectedAnswer: string) => {
    answerMutation.mutate({ questionId, selectedAnswer });
  };

  // BLOCK_09: Zero State detection
  const isZeroState = stats.resolvidas === 0 && questions.length > 0;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* ══════════════════════════════════════════════════════════════
          BLOCK_04: HEADER — Performance Tiered
      ══════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "relative overflow-hidden rounded-xl border border-amber-500/20 p-5",
        isHighEnd ? "bg-gradient-to-br from-amber-950/30 via-background to-yellow-950/20" : "bg-card"
      )}>
        {/* Background effects só em high-end */}
        {isHighEnd && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </>
        )}
        
        <div className="relative grid md:grid-cols-4 gap-4 items-center">
          {/* Título */}
          <div className="md:col-span-2 flex items-center gap-3">
            <div className="relative">
              {isHighEnd && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl blur-lg opacity-40 animate-pulse" />
              )}
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                BANCO DE QUESTÕES
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">
                  💪 Treino
                </span>
                <span>{stats.total.toLocaleString('pt-BR')} questões</span>
              </p>
              
              {/* Instruções do Modo Treino */}
              <div className="mt-3 space-y-1 text-xs">
                <p className="font-bold text-amber-400/90">Instruções:</p>
                <ul className="space-y-0.5 text-muted-foreground/80 pl-3">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500/70">•</span>
                    <span>Poderão ser filtradas até 20 questões pela forma desejada.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500/70">•</span>
                    <span>Aproveite sem moderação.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500/70">•</span>
                    <span>Poderá consultar histórico e refazer, mas não contará para a pontuação.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stats Cards simplificados */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl border border-green-500/20",
            isHighEnd ? "bg-card/50 backdrop-blur-sm" : "bg-card"
          )}>
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-green-400">{stats.resolvidas}</p>
              <p className="text-xs text-muted-foreground">Resolvidas</p>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl border border-amber-500/20",
            isHighEnd ? "bg-card/50 backdrop-blur-sm" : "bg-card"
          )}>
            <div className="p-2 rounded-lg bg-amber-500/20">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-400">{stats.taxaAcerto}%</p>
              <p className="text-xs text-muted-foreground">Acerto</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BLOCK_04B: INITIAL GUIDANCE - Orientações para Leigos (Year 2300)
      ══════════════════════════════════════════════════════════════ */}
      {isZeroState && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-purple-950/20 p-5 shadow-xl shadow-primary/5">
          {/* Efeitos holográficos */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary/40 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-primary/40 rounded-tr-xl" />
          
          <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Como Usar o Banco de Questões</span>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
            
            {/* 3 Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 hover:border-amber-400/40 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-amber-500/30">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-amber-400 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtre suas Questões
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Use os filtros de <span className="text-amber-300">Macro</span>, <span className="text-amber-300">Micro</span>, <span className="text-amber-300">Dificuldade</span> e <span className="text-amber-300">Banca</span> para encontrar exatamente o que precisa estudar.
                  </p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 hover:border-green-400/40 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-green-500/30">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-green-400 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Crie um Treino Rápido
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Clique em <span className="text-green-300">"Criar Questões"</span> para montar um treino com até 20 questões filtradas e resolva de forma dinâmica.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-600/5 border border-purple-500/20 hover:border-purple-400/40 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-500/30">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-purple-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Estude a Resolução
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Após responder, veja a <span className="text-purple-300">explicação detalhada</span> de cada questão para aprender com seus erros e acertos.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Dica extra */}
            <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Lightbulb className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-primary">Dica:</span> No modo Treino, você pode resolver as mesmas questões quantas vezes quiser para fixar o conteúdo! 💪
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BLOCK_05: PROGRESS_STATUS - Estados de progresso (Year 2300 Enhanced)
      ══════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border",
        isHighEnd 
          ? "bg-gradient-to-br from-amber-950/30 via-background/60 to-yellow-950/20 border-amber-500/30 backdrop-blur-xl shadow-2xl shadow-amber-500/5" 
          : "bg-card border-primary/20"
      )}>
        {/* Efeitos de borda premium holográfica (high-end) */}
        {isHighEnd && (
          <>
            {/* Glow superior */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
            <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent blur-sm" />
            {/* Glow inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            {/* Bordas laterais */}
            <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-amber-400/30 via-amber-500/20 to-transparent" />
            <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-amber-400/30 via-amber-500/20 to-transparent" />
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-amber-400/40 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-amber-400/40 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-amber-500/20 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-amber-500/20 rounded-br-2xl" />
          </>
        )}
        
        <div className="relative p-5">
          {/* Header Label */}
          {isHighEnd && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400/80">Progresso do Treino</span>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-5 gap-3 bg-transparent h-auto p-0">
              {/* Disponíveis - Total do banco MODO_TREINO */}
              <TabsTrigger 
                value="todas" 
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl transition-all font-medium",
                  isHighEnd 
                    ? "data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500/25 data-[state=active]:via-yellow-500/15 data-[state=active]:to-orange-500/10 data-[state=active]:border-2 data-[state=active]:border-amber-400/40 data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/20 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20" 
                    : "data-[state=active]:bg-primary/10"
                )}
              >
                {isHighEnd && activeTab === 'todas' && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/10 to-transparent animate-pulse" />
                )}
                <BookOpen className={cn("h-5 w-5 transition-colors", activeTab === 'todas' ? "text-amber-400" : "text-muted-foreground group-hover:text-amber-400/70")} />
                <span className={cn("text-xs font-semibold", activeTab === 'todas' ? "text-amber-300" : "text-muted-foreground")}>Disponíveis</span>
                <span className={cn(
                  "text-lg font-black tabular-nums",
                  activeTab === 'todas' ? "text-amber-400" : "text-foreground"
                )}>{stats.total.toLocaleString('pt-BR')}</span>
              </TabsTrigger>

              {/* Pendentes - Ainda não feitas */}
              <TabsTrigger 
                value="pendentes" 
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl transition-all font-medium",
                  isHighEnd 
                    ? "data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-500/25 data-[state=active]:via-gray-500/15 data-[state=active]:to-zinc-500/10 data-[state=active]:border-2 data-[state=active]:border-slate-400/40 data-[state=active]:shadow-lg hover:bg-slate-500/10 border border-transparent hover:border-slate-500/20" 
                    : "data-[state=active]:bg-primary/10"
                )}
              >
                <Clock className={cn("h-5 w-5 transition-colors", activeTab === 'pendentes' ? "text-slate-300" : "text-muted-foreground group-hover:text-slate-400")} />
                <span className={cn("text-xs font-semibold", activeTab === 'pendentes' ? "text-slate-300" : "text-muted-foreground")}>Pendentes</span>
                <span className={cn(
                  "text-lg font-black tabular-nums",
                  activeTab === 'pendentes' ? "text-slate-200" : "text-foreground"
                )}>{stats.pendentes.toLocaleString('pt-BR')}</span>
              </TabsTrigger>

              {/* Histórico - Questões que o aluno fez no MODO_TREINO */}
              <TabsTrigger 
                value="resolvidas" 
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl transition-all font-medium",
                  isHighEnd 
                    ? "bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/8 border-2 border-amber-400/30 shadow-lg shadow-amber-500/15 data-[state=active]:from-amber-500/30 data-[state=active]:via-yellow-500/20 data-[state=active]:to-orange-500/15 data-[state=active]:border-amber-400/50 data-[state=active]:shadow-amber-500/25 hover:from-amber-500/25 hover:border-amber-400/40" 
                    : "bg-primary/5 border border-primary/20 data-[state=active]:bg-primary/10"
                )}
              >
                {isHighEnd && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/8 to-transparent" />
                )}
                <CheckCircle2 className={cn("h-5 w-5 transition-colors", isHighEnd ? "text-amber-400" : (activeTab === 'resolvidas' ? "text-amber-400" : "text-muted-foreground group-hover:text-amber-400/70"))} />
                <span className={cn("text-xs font-semibold", isHighEnd ? "text-amber-300" : (activeTab === 'resolvidas' ? "text-amber-300" : "text-muted-foreground"))}>Histórico</span>
                <span className={cn(
                  "text-lg font-black tabular-nums",
                  isHighEnd ? "text-amber-400" : (activeTab === 'resolvidas' ? "text-amber-400" : "text-foreground")
                )}>{stats.resolvidas.toLocaleString('pt-BR')}</span>
              </TabsTrigger>

              {/* Corretas - Acertos no MODO_TREINO (verde) */}
              <TabsTrigger 
                value="acertos" 
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl transition-all font-medium",
                  isHighEnd 
                    ? "data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500/25 data-[state=active]:via-emerald-500/15 data-[state=active]:to-teal-500/10 data-[state=active]:border-2 data-[state=active]:border-green-400/40 data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/20 hover:bg-green-500/10 border border-transparent hover:border-green-500/20" 
                    : "data-[state=active]:bg-green-500/10"
                )}
              >
                {isHighEnd && activeTab === 'acertos' && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-400/10 to-transparent animate-pulse" />
                )}
                <Star className={cn("h-5 w-5 transition-colors", activeTab === 'acertos' ? "text-green-400" : "text-green-500/60 group-hover:text-green-400")} />
                <span className={cn("text-xs font-semibold", activeTab === 'acertos' ? "text-green-300" : "text-green-500/80")}>Corretas</span>
                <span className={cn(
                  "text-lg font-black tabular-nums",
                  activeTab === 'acertos' ? "text-green-400" : "text-green-500"
                )}>{stats.acertos.toLocaleString('pt-BR')}</span>
              </TabsTrigger>

              {/* Erradas - Erros no MODO_TREINO (vermelho) */}
              <TabsTrigger 
                value="erros" 
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl transition-all font-medium",
                  isHighEnd 
                    ? "data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500/25 data-[state=active]:via-rose-500/15 data-[state=active]:to-pink-500/10 data-[state=active]:border-2 data-[state=active]:border-red-400/40 data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/20 hover:bg-red-500/10 border border-transparent hover:border-red-500/20" 
                    : "data-[state=active]:bg-red-500/10"
                )}
              >
                {isHighEnd && activeTab === 'erros' && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-400/10 to-transparent animate-pulse" />
                )}
                <AlertCircle className={cn("h-5 w-5 transition-colors", activeTab === 'erros' ? "text-red-400" : "text-red-500/60 group-hover:text-red-400")} />
                <span className={cn("text-xs font-semibold", activeTab === 'erros' ? "text-red-300" : "text-red-500/80")}>Erradas</span>
                <span className={cn(
                  "text-lg font-black tabular-nums",
                  activeTab === 'erros' ? "text-red-400" : "text-red-500"
                )}>{stats.erros.toLocaleString('pt-BR')}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BLOCK_06: TAXONOMY_FILTERS — Filtros Hierárquicos (Year 2300)
      ══════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        isHighEnd 
          ? "bg-gradient-to-br from-slate-900/80 via-background/60 to-slate-900/80 border-cyan-500/30 backdrop-blur-xl shadow-xl shadow-cyan-500/5" 
          : "bg-card border-primary/20"
      )}>
        {/* Efeitos holográficos (high-end) */}
        {isHighEnd && (
          <>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400/40 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-400/40 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-500/20 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-500/20 rounded-br-2xl" />
          </>
        )}

        <div className="relative space-y-4">
          {/* Header Label */}
          {isHighEnd && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400/80">Filtros Acadêmicos</span>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
            </div>
          )}

          {/* Grid de Filtros de Taxonomia */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* MACRO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                MACRO
              </Label>
              <Select value={filterMacro} onValueChange={(v) => {
                setFilterMacro(v);
                setFilterMicro("todas");
                setFilterTema("todas");
                setFilterSubtema("todas");
              }}>
                <SelectTrigger className={cn(
                  "h-10 text-sm",
                  isHighEnd ? "bg-purple-500/10 border-purple-500/30 hover:border-purple-400/50" : ""
                )}>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  {macros.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* MICRO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                MICRO
              </Label>
              <Select value={filterMicro} onValueChange={(v) => {
                setFilterMicro(v);
                setFilterTema("todas");
                setFilterSubtema("todas");
              }} disabled={filterMacro === "todas"}>
                <SelectTrigger className={cn(
                  "h-10 text-sm",
                  isHighEnd ? "bg-blue-500/10 border-blue-500/30 hover:border-blue-400/50" : "",
                  filterMacro === "todas" && "opacity-50"
                )}>
                  <SelectValue placeholder="Selecione Macro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  {getMicrosForSelect(filterMacro === 'todas' ? '' : filterMacro).map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TEMA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                TEMA
              </Label>
              <Select value={filterTema} onValueChange={(v) => {
                setFilterTema(v);
                setFilterSubtema("todas");
              }} disabled={filterMicro === "todas"}>
                <SelectTrigger className={cn(
                  "h-10 text-sm",
                  isHighEnd ? "bg-teal-500/10 border-teal-500/30 hover:border-teal-400/50" : "",
                  filterMicro === "todas" && "opacity-50"
                )}>
                  <SelectValue placeholder="Selecione Micro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  {getTemasForSelect(filterMicro === 'todas' ? '' : filterMicro).map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SUBTEMA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                SUBTEMA
              </Label>
              <Select value={filterSubtema} onValueChange={setFilterSubtema} disabled={filterTema === "todas"}>
                <SelectTrigger className={cn(
                  "h-10 text-sm",
                  isHighEnd ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400/50" : "",
                  filterTema === "todas" && "opacity-50"
                )}>
                  <SelectValue placeholder="Selecione Tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  {getSubtemasForSelect(filterTema === 'todas' ? '' : filterTema).map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha de Filtros Operacionais */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 border-t border-border/30">
            {/* Busca */}
            <div className="col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>

            {/* ESTILO DA QUESTÃO */}
            <Select value={questionTypeFilter} onValueChange={(v) => setQuestionTypeFilter(v as 'all' | 'multiple_choice' | 'discursive' | 'outros')}>
              <SelectTrigger className={cn(
                "h-10 text-sm",
                isHighEnd ? "bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-400/50" : ""
              )}>
                <SelectValue placeholder="Estilo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📋 Estilo: Todos</SelectItem>
                <SelectItem value="multiple_choice">✅ Múltipla Escolha</SelectItem>
                <SelectItem value="discursive">✍️ Discursiva</SelectItem>
                <SelectItem value="outros">🔢 Outros (V/F, Soma)</SelectItem>
              </SelectContent>
            </Select>

            {/* ESTILO ENEM - Toggle Button */}
            <Button
              type="button"
              variant={estiloEnemFilter ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEstiloEnemFilter(prev => !prev);
              }}
              className={cn(
                "h-10 gap-2 font-semibold transition-all cursor-pointer",
                estiloEnemFilter 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/30" 
                  : "border-blue-500/50 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500"
              )}
            >
              <Sparkles className={cn("h-4 w-4", estiloEnemFilter && "animate-pulse")} />
              Estilo ENEM
            </Button>

            {/* Dificuldade */}
            <Select value={dificuldade} onValueChange={setDificuldade}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Nível de Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Nível de Dificuldade</SelectItem>
                <SelectItem value="facil">🟢 Fácil</SelectItem>
                <SelectItem value="medio">🟡 Médio</SelectItem>
                <SelectItem value="dificil">🔴 Difícil</SelectItem>
              </SelectContent>
            </Select>

            {/* Ano */}
            <Select value={anoFilter} onValueChange={setAnoFilter}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos anos</SelectItem>
                {Array.from({ length: 15 }, (_, i) => 2024 - i).map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigas</SelectItem>
                <SelectItem value="ano_desc">Ano (↓)</SelectItem>
                <SelectItem value="difficulty_asc">Fácil → Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BLOCK_09: ZERO STATE — Performance Tiered
      ══════════════════════════════════════════════════════════════ */}
      {isZeroState && (
        <div className={cn(
          "relative overflow-hidden rounded-xl p-6",
          isHighEnd ? "bg-gradient-to-r from-amber-600/15 to-yellow-500/10" : "bg-card border border-amber-500/20"
        )}>
          {isHighEnd && (
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          )}
          
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {isHighEnd && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl blur-lg opacity-40 animate-pulse" />
              )}
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">
                COMECE SEU TREINO!
              </h3>
              <p className="text-sm text-muted-foreground">
                {isAnyFilterActive 
                  ? <>Use o <span className="font-bold text-amber-400">Criar Questões</span> para praticar {Math.min(totalCount, RAPIDO_TREINO_LIMIT)} questões.</>
                  : <>Selecione um <span className="font-bold text-amber-400">filtro acima</span> para começar a criar questões.</>
                }
              </p>
            </div>
            
            <Button 
              onClick={handleStartRapidoTreino}
              disabled={isLoadingTreino || !isAnyFilterActive || totalCount === 0}
              size="lg"
              className={cn(
                "gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black px-6",
                isHighEnd ? "shadow-lg shadow-amber-500/20" : "",
                !isAnyFilterActive && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoadingTreino ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              INICIAR ({isAnyFilterActive ? Math.min(totalCount, RAPIDO_TREINO_LIMIT) : 0})
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BLOCK_07: RESULT_AREA - Lista de Questões
      ══════════════════════════════════════════════════════════════ */}
      {questionsLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Brain className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Nenhuma questão encontrada</h3>
            <p className="text-sm text-muted-foreground">
              Ajuste os filtros para ver mais questões
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando <strong>{filteredQuestions.length}</strong> de <strong>{totalCount.toLocaleString('pt-BR')}</strong> questões
            </p>
            
            {/* Botão Criar Questões - Só habilita com filtro selecionado */}
            <Button 
              onClick={handleStartRapidoTreino}
              disabled={isLoadingTreino || !isAnyFilterActive || totalCount === 0}
              variant="2300"
              className={cn(
                "gap-2 px-6 py-2.5 h-auto bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-black font-semibold tracking-wide",
                isHighEnd ? "shadow-lg shadow-amber-500/25" : "",
                !isAnyFilterActive && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoadingTreino ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              Criar Questões ({isAnyFilterActive ? Math.min(totalCount, RAPIDO_TREINO_LIMIT) : 0})
            </Button>
          </div>

          {/* VIRTUALIZAÇÃO PERMANENTE - Renderiza apenas itens visíveis */}
          <VirtualizedStudentQuestionList
            questions={filteredQuestions}
            attemptsByQuestion={attemptsByQuestion}
            onOpenQuestion={handleOpenQuestion}
            onResetAttempt={handleResetAttempt}
            isResetting={resettingQuestionId}
          />

          {/* PAGINAÇÃO SERVER-SIDE */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({totalCount.toLocaleString('pt-BR')} questões)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || questionsLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm font-medium px-3 py-1 bg-muted rounded">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || questionsLoading}
                >
                  Próxima
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Resolução Individual */}
      <QuestionModal
        open={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        question={selectedQuestion}
        userAttempt={selectedQuestion ? attemptsByQuestion.get(selectedQuestion.id) || null : null}
        onAnswer={handleAnswerQuestion}
        isSubmitting={answerMutation.isPending}
      />

      {/* BLOCK_09: Modal RÁPIDO TREINO */}
      <RapidoTreinoModal
        open={rapidoTreinoOpen}
        onClose={() => setRapidoTreinoOpen(false)}
        questions={rapidoTreinoQuestions}
        onComplete={handleRapidoTreinoComplete}
      />

      {/* BLOCK_12: Modal REVISÃO DO TREINO (Educacional) */}
      <TreinoReviewModal
        open={treinoReviewOpen}
        onClose={() => setTreinoReviewOpen(false)}
        questions={treinoReviewQuestions}
        answers={treinoReviewAnswers}
        results={treinoReviewResults}
      />

      {/* BLOCK_13: SEÇÃO DE MÉTRICAS E ANÁLISE POR ÁREAS */}
      <StudentPerformanceAnalytics />
    </div>
  );
}
