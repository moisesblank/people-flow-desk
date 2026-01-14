// ============================================
// 📄 MODO PROVA - SIMULADO EM PDF STYLE
// Year 2300 Cinematic Design
// XP: 0 | Source: 'modo_prova'
// ============================================

import { useState, useCallback, useMemo } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  FileText, CheckCircle2, XCircle, Trophy, Clock, 
  Target, Loader2, Send, RotateCcw, ChevronDown,
  Zap, Brain, ArrowUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import QuestionEnunciado from "@/components/shared/QuestionEnunciado";
import QuestionResolution from "@/components/shared/QuestionResolution";
import { formatBancaHeader } from "@/lib/bancaNormalizer";

// ============================================
// TIPOS
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
  macro?: string | null;
  micro?: string | null;
}

interface ModoProvaModalProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  title?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DIFFICULTY_COLORS = {
  facil: "bg-green-500/20 text-green-400 border-green-500/30",
  medio: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  dificil: "bg-red-500/20 text-red-400 border-red-500/30",
};

const DIFFICULTY_LABELS = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ModoProvaModal({ open, onClose, questions, title }: ModoProvaModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [phase, setPhase] = useState<'prova' | 'resultado'>('prova');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResolutions, setShowResolutions] = useState<Set<string>>(new Set());
  
  // Timer (simples para display)
  const [startTime] = useState(() => Date.now());

  // Computed
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const correctCount = Object.values(results).filter(Boolean).length;
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  // Handlers
  const handleSelectAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }, []);

  const handleSubmitProva = useCallback(async () => {
    if (!user?.id || answeredCount === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Calcular resultados
      const newResults: Record<string, boolean> = {};
      const attempts = [];
      
      for (const q of questions) {
        const selectedAnswer = answers[q.id];
        if (selectedAnswer) {
          const isCorrect = selectedAnswer === q.correct_answer;
          newResults[q.id] = isCorrect;
          
          attempts.push({
            user_id: user.id,
            question_id: q.id,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
            xp_earned: 0, // Modo Prova = 0 XP
            source: 'modo_prova',
          });
        }
      }
      
      // Salvar no banco
      if (attempts.length > 0) {
        const { error } = await supabase
          .from('question_attempts')
          .insert(attempts);
        
        if (error) throw error;
      }
      
      setResults(newResults);
      setPhase('resultado');
      
      // Invalidar queries para atualizar métricas
      queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['student-taxonomy-performance'] });
      queryClient.invalidateQueries({ queryKey: ['student-performance-stats'] });
      
      toast.success(`Prova finalizada! ${Object.values(newResults).filter(Boolean).length}/${attempts.length} acertos`);
      
    } catch (err) {
      console.error('Erro ao salvar prova:', err);
      toast.error('Erro ao salvar resultados');
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, questions, answers, answeredCount, queryClient]);

  const handleReset = useCallback(() => {
    setPhase('prova');
    setAnswers({});
    setResults({});
    setShowResolutions(new Set());
  }, []);

  const toggleResolution = useCallback((questionId: string) => {
    setShowResolutions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const scrollToTop = useCallback(() => {
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
  }, []);

  if (questions.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 bg-gradient-to-b from-background via-background to-slate-900/50 border-cyan-500/30">
        
        {/* ═══════════════════════════════════════════════════════════
            HEADER — Year 2300 Style
        ═══════════════════════════════════════════════════════════ */}
        <DialogHeader className="relative p-4 pb-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-background to-blue-950/30">
          {/* Glow line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 rounded-xl blur-md opacity-40 animate-pulse" />
                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-lg font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {phase === 'prova' ? '📄 MODO PROVA' : '🏆 RESULTADO'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {title || `${questions.length} questões • Sem XP`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Progresso */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Target className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-400">
                  {phase === 'prova' 
                    ? `${answeredCount}/${questions.length}` 
                    : `${correctCount}/${questions.length} (${percentage}%)`
                  }
                </span>
              </div>
              
              {phase === 'resultado' && (
                <Badge 
                  className={cn(
                    "text-sm font-bold px-3 py-1",
                    percentage >= 70 
                      ? "bg-green-500/20 text-green-400 border-green-500/30" 
                      : percentage >= 50 
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                  )}
                >
                  {percentage >= 70 ? '🎯 Excelente!' : percentage >= 50 ? '📈 Bom!' : '📚 Continue estudando!'}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          {phase === 'prova' && (
            <div className="mt-3">
              <Progress value={progress} className="h-2 bg-slate-800" />
            </div>
          )}
        </DialogHeader>

        {/* ═══════════════════════════════════════════════════════════
            CORPO — PDF Style com Scroll
        ═══════════════════════════════════════════════════════════ */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-6 pb-32">
            
            {questions.map((question, index) => {
              const selectedAnswer = answers[question.id];
              const isCorrect = results[question.id];
              const showResult = phase === 'resultado' && selectedAnswer;
              const isResolutionOpen = showResolutions.has(question.id);
              
              return (
                <div 
                  key={question.id}
                  className={cn(
                    "relative rounded-xl border transition-all duration-300",
                    showResult 
                      ? isCorrect 
                        ? "border-green-500/40 bg-gradient-to-br from-green-950/20 to-background" 
                        : "border-red-500/40 bg-gradient-to-br from-red-950/20 to-background"
                      : "border-slate-700/50 bg-slate-900/30 hover:border-cyan-500/30"
                  )}
                >
                  {/* Question Number Badge */}
                  <div className="absolute -top-3 left-4">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-black shadow-lg",
                      showResult
                        ? isCorrect
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                    )}>
                      {showResult && (
                        isCorrect 
                          ? <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                          : <XCircle className="inline h-3.5 w-3.5 mr-1" />
                      )}
                      Questão {index + 1}
                    </div>
                  </div>
                  
                  <div className="p-5 pt-6 space-y-4">
                    {/* Header da questão */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={DIFFICULTY_COLORS[question.difficulty]}>
                        {DIFFICULTY_LABELS[question.difficulty]}
                      </Badge>
                      {question.banca && (
                        <Badge variant="outline" className="bg-slate-800/50 border-slate-600/50">
                          {formatBancaHeader(question.banca, question.ano, '')}
                        </Badge>
                      )}
                      {question.macro && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                          {question.macro}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Enunciado */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <QuestionEnunciado 
                        questionText={question.question_text} 
                        banca={question.banca}
                        ano={question.ano}
                      />
                    </div>
                    
                    {/* Alternativas */}
                    <RadioGroup 
                      value={selectedAnswer || ''} 
                      onValueChange={(v) => handleSelectAnswer(question.id, v)}
                      className="space-y-2"
                      disabled={phase === 'resultado'}
                    >
                      {question.options.map((option, optIndex) => {
                        const letter = String.fromCharCode(65 + optIndex);
                        const isSelected = selectedAnswer === option.id;
                        const isCorrectOption = option.id === question.correct_answer;
                        const showCorrectness = phase === 'resultado';
                        
                        return (
                          <Label
                            key={option.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                              showCorrectness
                                ? isCorrectOption
                                  ? "border-green-500/50 bg-green-500/10"
                                  : isSelected && !isCorrectOption
                                    ? "border-red-500/50 bg-red-500/10"
                                    : "border-slate-700/50 bg-slate-800/30"
                                : isSelected
                                  ? "border-cyan-500/50 bg-cyan-500/10"
                                  : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"
                            )}
                          >
                            <RadioGroupItem 
                              value={option.id} 
                              className="mt-0.5" 
                              disabled={phase === 'resultado'}
                            />
                            <div className="flex items-start gap-2 flex-1">
                              <span className={cn(
                                "font-bold text-sm min-w-[20px]",
                                showCorrectness && isCorrectOption && "text-green-400",
                                showCorrectness && isSelected && !isCorrectOption && "text-red-400",
                                !showCorrectness && isSelected && "text-cyan-400"
                              )}>
                                {letter})
                              </span>
                              <span className="text-sm leading-relaxed">
                                {option.text}
                              </span>
                              {showCorrectness && isCorrectOption && (
                                <CheckCircle2 className="h-4 w-4 text-green-400 ml-auto flex-shrink-0" />
                              )}
                              {showCorrectness && isSelected && !isCorrectOption && (
                                <XCircle className="h-4 w-4 text-red-400 ml-auto flex-shrink-0" />
                              )}
                            </div>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                    
                    {/* Botão Ver Resolução (só no resultado) */}
                    {phase === 'resultado' && question.explanation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleResolution(question.id)}
                        className="w-full mt-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <ChevronDown className={cn(
                          "h-4 w-4 mr-2 transition-transform",
                          isResolutionOpen && "rotate-180"
                        )} />
                        {isResolutionOpen ? 'Ocultar Resolução' : 'Ver Resolução Comentada'}
                      </Button>
                    )}
                    
                    {/* Resolução Expandida */}
                    {isResolutionOpen && question.explanation && (
                      <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                        <QuestionResolution resolutionText={question.explanation} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ═══════════════════════════════════════════════════════════
                CARTÃO DE RESPOSTAS — Sticky ao final
            ═══════════════════════════════════════════════════════════ */}
            <Card className="sticky bottom-0 p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
              <div className="flex flex-col gap-4">
                {/* Grid de respostas */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {questions.map((q, i) => {
                    const answered = !!answers[q.id];
                    const correct = phase === 'resultado' ? results[q.id] : null;
                    
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                          phase === 'resultado'
                            ? correct === true
                              ? "bg-green-500 text-white"
                              : correct === false
                                ? "bg-red-500 text-white"
                                : "bg-slate-700 text-slate-400"
                            : answered
                              ? "bg-cyan-500 text-white"
                              : "bg-slate-700/50 text-slate-500 border border-slate-600"
                        )}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                
                {/* Ações */}
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {phase === 'prova' ? (
                      <span>{answeredCount} de {questions.length} respondidas</span>
                    ) : (
                      <span className="font-bold">
                        ✅ {correctCount} acertos • ❌ {Object.keys(results).length - correctCount} erros
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {phase === 'prova' ? (
                      <Button
                        onClick={handleSubmitProva}
                        disabled={answeredCount === 0 || isSubmitting}
                        className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        ENTREGAR PROVA
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={scrollToTop}
                          className="gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                        >
                          <ArrowUp className="h-4 w-4" />
                          Voltar ao Topo
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleReset}
                          className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Refazer
                        </Button>
                        <Button
                          onClick={handleClose}
                          className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Concluir
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
