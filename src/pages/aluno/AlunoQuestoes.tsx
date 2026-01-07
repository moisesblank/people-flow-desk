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
  TrendingUp, BarChart3, Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BANCAS, BANCAS_POR_CATEGORIA, CATEGORIA_LABELS, getBancaLabel } from "@/constants/bancas";
import { formatBancaHeader } from "@/lib/bancaNormalizer";
import QuestionEnunciado, { cleanQuestionText } from "@/components/shared/QuestionEnunciado";
import { VirtualizedStudentQuestionList } from "@/components/aluno/questoes/VirtualizedStudentQuestionList";
import QuestionResolution from "@/components/shared/QuestionResolution";
import { useTaxonomyForSelects } from "@/hooks/useQuestionTaxonomy";
import { QuestionBadgesCompact } from "@/components/shared/QuestionMetadataBadges";
import { TreinoReviewModal } from "@/components/aluno/questoes/TreinoReviewModal";

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
                          <p className="flex-1 text-sm">{typeof option.text === 'string' ? option.text : (option.text as any)?.text ?? String(option.text ?? '')}</p>
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
    try {
      await supabase.from('question_attempts').insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        selected_answer: selectedOption,
        is_correct: isCorrect,
        xp_earned: 0, // MODO_TREINO: 0 XP
      });
    } catch (err) {
      console.error('Erro ao registrar tentativa:', err);
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
      queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
      onComplete({ correct, total: questions.length }, finalAnswers);
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setSelectedOption(null);
    setShowResult(false);
  };

  if (!currentQuestion || isComplete) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Rápido Treino
                </DialogTitle>
                <DialogDescription>
                  Questão {currentIndex + 1} de {questions.length}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {Math.round(progress)}%
            </Badge>
          </div>
          <Progress value={progress} className="h-2 mt-3" />
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 py-4">
            {/* Metadata badges */}
            <QuestionBadgesCompact question={currentQuestion} />

            {/* Enunciado */}
            <div className="bg-muted/50 rounded-xl p-4 border">
              <QuestionEnunciado
                questionText={currentQuestion.question_text}
                imageUrl={currentQuestion.image_url}
                imageUrls={currentQuestion.image_urls}
                banca={currentQuestion.banca}
                ano={currentQuestion.ano}
                textSize="sm"
              />
            </div>

            {/* Alternativas */}
            <RadioGroup
              value={selectedOption || ""}
              onValueChange={setSelectedOption}
              disabled={showResult}
              className="space-y-2"
            >
              {(currentQuestion.options || []).map((option) => {
                const isSelected = selectedOption === option.id;
                const isCorrectOption = option.id === currentQuestion.correct_answer;
                
                let optionClass = "border-muted-foreground/30 hover:border-primary/50";
                if (showResult) {
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
                      "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      optionClass,
                      showResult && "cursor-not-allowed"
                    )}
                    onClick={() => !showResult && setSelectedOption(option.id)}
                  >
                    <RadioGroupItem value={option.id} id={`rapid-${option.id}`} />
                    <Label
                      htmlFor={`rapid-${option.id}`}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold text-sm",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                      )}
                    >
                      {option.id.toUpperCase()}
                    </Label>
                    <p className="flex-1 text-sm">{typeof option.text === 'string' ? option.text : (option.text as any)?.text ?? String(option.text ?? '')}</p>
                    {showResult && isCorrectOption && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {showResult && isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-red-500" />}
                  </div>
                );
              })}
            </RadioGroup>

            {/* Resultado */}
            {showResult && (
              <div className={cn(
                "p-4 rounded-xl border-2",
                selectedOption === currentQuestion.correct_answer
                  ? "bg-green-500/10 border-green-500"
                  : "bg-red-500/10 border-red-500"
              )}>
                <div className="flex items-center gap-3">
                  {selectedOption === currentQuestion.correct_answer ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <p className="font-bold text-green-600">Correto!</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-500" />
                      <p className="font-bold text-red-600">
                        Incorreto. Resposta: {currentQuestion.correct_answer.toUpperCase()}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          {!showResult ? (
            <Button 
              onClick={handleSubmitAnswer}
              disabled={!selectedOption || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirmar
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full">
              {currentIndex + 1 >= questions.length ? 'Finalizar' : 'Próxima'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
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
      return stripTaxLabel(found?.label) || macroValue;
    },
    [macros, stripTaxLabel]
  );

  const getMicroLabelForDb = useCallback(
    (macroValue: string, microValue: string) => {
      const micros = getMicrosForSelect(macroValue === 'todas' ? '' : macroValue);
      const found = micros.find((m) => m.value === microValue);
      return stripTaxLabel(found?.label) || microValue;
    },
    [getMicrosForSelect, stripTaxLabel]
  );

  const getTemaLabelForDb = useCallback(
    (microValue: string, temaValue: string) => {
      const temas = getTemasForSelect(microValue === 'todas' ? '' : microValue);
      const found = temas.find((t) => t.value === temaValue);
      return stripTaxLabel(found?.label) || temaValue;
    },
    [getTemasForSelect, stripTaxLabel]
  );

  const getSubtemaLabelForDb = useCallback(
    (temaValue: string, subtemaValue: string) => {
      const subtemas = getSubtemasForSelect(temaValue === 'todas' ? '' : temaValue);
      const found = subtemas.find((s) => s.value === subtemaValue);
      return stripTaxLabel(found?.label) || subtemaValue;
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
  const ITEMS_PER_PAGE = 10;
  
  // Reset página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMacro, filterMicro, filterTema, filterSubtema, dificuldade, banca, anoFilter]);
  
  // BLOCK_04: PAGINAÇÃO SERVER-SIDE - Substituiu loop 45k
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['student-questions', 'MODO_TREINO', currentPage, ITEMS_PER_PAGE, filterMacro, filterMicro, filterTema, filterSubtema, dificuldade, banca, anoFilter],
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
      // BLOCK_11: Atualizar métricas imediatamente
      queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
      
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
  const stats = useMemo(() => {
    const total = questions.length;
    const questionsAttempted = new Set(attempts.map(a => a.question_id));
    const resolvidas = questionsAttempted.size;
    const acertos = attempts.filter(a => a.is_correct).length;
    const erros = attempts.filter(a => !a.is_correct).length;
    const taxaAcerto = resolvidas > 0 ? Math.round((acertos / attempts.length) * 100) : 0;
    const pendentes = total - resolvidas;
    
    return { total, resolvidas, acertos, erros, taxaAcerto, pendentes };
  }, [questions, attempts]);

  // Map de tentativas por questão
  const attemptsByQuestion = useMemo(() => {
    const map = new Map<string, QuestionAttempt>();
    attempts.forEach(a => map.set(a.question_id, a));
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

    // Busca por palavras-chave
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
  }, [questions, activeTab, filterMacro, filterMicro, filterTema, filterSubtema, anoFilter, banca, dificuldade, busca, sortOrder, attemptsByQuestion]);

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
          BLOCK_04: HEADER_CONTEXT - Orientar o usuário
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Banco de Questões</h1>
                <p className="text-muted-foreground">
                  {stats.total} questões • Modo Treino (0 XP)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.resolvidas}</p>
              <p className="text-xs text-muted-foreground">Resolvidas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.taxaAcerto}%</p>
              <p className="text-xs text-muted-foreground">Taxa de acerto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BLOCK_05: PROGRESS_STATUS - Estados de progresso
      ══════════════════════════════════════════════════════════════ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="todas" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Todas</span>
            <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pendentes</span>
            <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">{stats.pendentes}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolvidas" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Resolvidas</span>
            <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">{stats.resolvidas}</Badge>
          </TabsTrigger>
          <TabsTrigger value="acertos" className="gap-2 text-green-600">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Corretas</span>
            <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">{stats.acertos}</Badge>
          </TabsTrigger>
          <TabsTrigger value="erros" className="gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Erradas</span>
            <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">{stats.erros}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════
          BLOCK_06 + BLOCK_07: FILTERS (Acadêmicos + Operacionais)
      ══════════════════════════════════════════════════════════════ */}
      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-4">
          {/* BLOCK_06: ACADEMIC_FILTERS - Hierarquia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">MACRO</Label>
              <Select 
                value={filterMacro} 
                onValueChange={(v) => {
                  setFilterMacro(v);
                  setFilterMicro('todas');
                  setFilterTema('todas');
                  setFilterSubtema('todas');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {macros.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">MICRO</Label>
              <Select 
                value={filterMicro} 
                onValueChange={(v) => {
                  setFilterMicro(v);
                  setFilterTema('todas');
                  setFilterSubtema('todas');
                }}
                disabled={filterMacro === 'todas'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {getMicrosForSelect(filterMacro === 'todas' ? '' : filterMacro).map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">TEMA</Label>
              <Select 
                value={filterTema} 
                onValueChange={(v) => {
                  setFilterTema(v);
                  setFilterSubtema('todas');
                }}
                disabled={filterMicro === 'todas'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {getTemasForSelect(filterMicro === 'todas' ? '' : filterMicro).map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">SUBTEMA</Label>
              <Select 
                value={filterSubtema} 
                onValueChange={setFilterSubtema}
                disabled={filterTema === 'todas'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {getSubtemasForSelect(filterTema === 'todas' ? '' : filterTema).map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BLOCK_07: OPERATIONAL_FILTERS + PRIMARY_ACTION */}
          <div className="flex flex-col md:flex-row gap-4 pt-2 border-t border-border/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por palavras-chave..." 
                className="pl-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            
            <Select value={anoFilter} onValueChange={setAnoFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Ano: Todos</SelectItem>
                {uniqueAnos.map(ano => (
                  <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={banca} onValueChange={setBanca}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Banca" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="todas">Todas as bancas</SelectItem>
                {Object.entries(BANCAS_POR_CATEGORIA).map(([categoria, bancas]) => (
                  <div key={categoria}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {CATEGORIA_LABELS[categoria as keyof typeof CATEGORIA_LABELS]}
                    </div>
                    {bancas.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            <Select value={dificuldade} onValueChange={setDificuldade}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Dificuldade: Todas</SelectItem>
                <SelectItem value="facil">🟢 Fácil</SelectItem>
                <SelectItem value="medio">🟡 Médio</SelectItem>
                <SelectItem value="dificil">🔴 Difícil</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">📅 Mais recentes</SelectItem>
                <SelectItem value="oldest">📅 Mais antigas</SelectItem>
                <SelectItem value="ano_desc">🗓️ Ano ↓</SelectItem>
                <SelectItem value="difficulty_asc">📊 Fácil → Difícil</SelectItem>
              </SelectContent>
            </Select>

            {/* BLOCK_08: PRIMARY_ACTION - RÁPIDO TREINO */}
            <Button 
              onClick={handleStartRapidoTreino}
              disabled={isLoadingTreino || totalCount === 0}
              className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold"
            >
              {isLoadingTreino ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Criar Questões
              <Badge variant="secondary" className="ml-1 bg-black/20 text-white">
                {Math.min(totalCount, RAPIDO_TREINO_LIMIT)}
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          BLOCK_09: ZERO STATE - Guiar para Rápido Treino
      ══════════════════════════════════════════════════════════════ */}
      {isZeroState && (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">Comece seu treino agora!</h3>
              <p className="text-muted-foreground">
                Você ainda não resolveu nenhuma questão. Use o <strong>Rápido Treino</strong> para praticar {Math.min(totalCount, RAPIDO_TREINO_LIMIT)} questões de uma vez!
              </p>
            </div>
            <Button 
              onClick={handleStartRapidoTreino}
              disabled={isLoadingTreino || totalCount === 0}
              size="lg"
              className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold"
            >
              {isLoadingTreino ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Iniciar Treino
            </Button>
          </CardContent>
        </Card>
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
    </div>
  );
}
