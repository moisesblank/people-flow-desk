// ============================================
// CENTRAL DO ALUNO - BANCO DE QUESTÕES
// Química ENEM - Prof. Moisés Medeiros
// Versão com dados reais do banco
// ============================================

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { 
  Search, Brain, Target, 
  CheckCircle2, XCircle, ChevronRight, Zap,
  Clock, Trophy, BookOpen, Loader2,
  ArrowLeft, ArrowRight, RotateCcw,
  Lightbulb, AlertCircle, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BANCAS, BANCAS_POR_CATEGORIA, CATEGORIA_LABELS, getBancaLabel } from "@/constants/bancas";
import QuestionEnunciado, { cleanQuestionText } from "@/components/shared/QuestionEnunciado";
import QuestionResolution from "@/components/shared/QuestionResolution";
import { predictSuccessRate, getSuccessRateColor } from "@/lib/questionSuccessPredictor";
import { useTaxonomyForSelects } from "@/hooks/useQuestionTaxonomy";

// ============================================
// TIPOS
// ============================================

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  question_text: string;
  options: QuestionOption[];
  correct_answer: string;
  explanation?: string | null;
  difficulty: "facil" | "medio" | "dificil";
  banca?: string | null;
  ano?: number | null;
  points: number;
  is_active: boolean;
  created_at: string;
  // Estrutura hierárquica
  macro?: string | null;
  micro?: string | null;
  tema?: string | null;
  subtema?: string | null;
  // QUESTION_DOMAIN: Agrupamento
  tags?: string[] | null;
}

interface QuestionAttempt {
  question_id: string;
  is_correct: boolean;
  selected_answer: string;
}

// ============================================
// CONSTANTES
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

// BANCAS importado de @/constants/bancas (fonte única de verdade)

// ESTRUTURA HIERÁRQUICA AGORA É DINÂMICA VIA useQuestionTaxonomy

// ============================================
// COMPONENTE: Modal de Resolução de Questão
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
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    if (question && userAttempt) {
      setSelectedOption(userAttempt.selected_answer);
      setHasAnswered(true);
      setShowExplanation(true);
    } else {
      setSelectedOption(null);
      setHasAnswered(false);
      setShowExplanation(false);
    }
  }, [question?.id, userAttempt]);

  const handleSubmitAnswer = () => {
    if (!question || !selectedOption) return;
    onAnswer(question.id, selectedOption);
    setHasAnswered(true);
    setShowExplanation(true);
  };

  const isCorrect = hasAnswered && selectedOption === question?.correct_answer;

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
                  {question.banca && (
                    <Badge variant="outline">
                      {getBancaLabel(question.banca)}
                    </Badge>
                  )}
                  {question.ano && (
                    <Badge variant="secondary">{question.ano}</Badge>
                  )}
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
            {/* Enunciado com Imagem - Componente Universal */}
            <div className="bg-muted/50 rounded-xl p-4 border">
              <QuestionEnunciado
                questionText={question.question_text}
                imageUrl={(question as any).image_url}
                banca={(question as any).banca}
                ano={(question as any).ano}
                textSize="sm"
                showImageLabel
              />
            </div>

            {/* Alternativas */}
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
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        optionClass,
                        hasAnswered && "cursor-not-allowed"
                      )}
                      onClick={() => !hasAnswered && setSelectedOption(option.id)}
                    >
                      <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                      <div className="flex-1">
                        <Label
                          htmlFor={option.id}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold text-sm cursor-pointer mr-3",
                            isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                            hasAnswered && isCorrectOption && "border-green-500 bg-green-500 text-white",
                            hasAnswered && isSelected && !isCorrectOption && "border-red-500 bg-red-500 text-white"
                          )}
                        >
                          {option.id.toUpperCase()}
                        </Label>
                      </div>
                      <p className="flex-1 text-sm">{option.text}</p>
                      {hasAnswered && isCorrectOption && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                      {hasAnswered && isSelected && !isCorrectOption && (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Resultado */}
            <AnimatePresence>
              {hasAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "p-4 rounded-xl border-2",
                    isCorrect 
                      ? "bg-green-500/10 border-green-500" 
                      : "bg-red-500/10 border-red-500"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                          <div>
                            <p className="font-bold text-green-600">Parabéns! Você acertou!</p>
                            {/* MODO_TREINO: Sem pontos */}
                            {question.tags?.includes('MODO_TREINO') ? (
                              <p className="text-sm text-muted-foreground">
                                🎯 Modo Treino - sem pontos
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                +{question.points} pontos de XP
                              </p>
                            )}
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
                    
                    {/* Taxa de Acerto Prevista - Só aparece após responder */}
                    {(() => {
                      const prediction = predictSuccessRate({
                        difficulty: question.difficulty,
                        questionText: question.question_text,
                        options: question.options,
                        tema: question.tema,
                        macro: question.macro,
                      });
                      return (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Taxa de acerto esperada</p>
                          <p className={cn("text-lg font-bold", getSuccessRateColor(prediction.rate))}>
                            {prediction.rate}%
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Explicação */}
            <AnimatePresence>
              {showExplanation && question.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"
                >
                  <QuestionResolution
                    resolutionText={question.explanation}
                    banca={question.banca}
                    ano={question.ano}
                    difficulty={question.difficulty}
                    tema={question.tema}
                    macro={question.macro}
                    micro={question.micro}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {!hasAnswered && (
            <Button 
              onClick={handleSubmitAnswer}
              disabled={!selectedOption || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirmar Resposta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AlunoQuestoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Hook dinâmico de taxonomia - sincronizado com TaxonomyManager
  const { macros, getMicrosForSelect, getTemasForSelect, getSubtemasForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();
  
  // State
  const [busca, setBusca] = useState("");
  const [dificuldade, setDificuldade] = useState("todas");
  const [banca, setBanca] = useState("todas");
  const [activeTab, setActiveTab] = useState("todas");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  
  // Filtros hierárquicos
  const [filterMacro, setFilterMacro] = useState("todas");
  const [filterMicro, setFilterMicro] = useState("todas");
  const [filterTema, setFilterTema] = useState("todas");
  const [filterSubtema, setFilterSubtema] = useState("todas");
  
  // Filtros adicionais (ORDEM CANÔNICA: Macro → Micro → Ano → Banca → Dificuldade → Ordenação)
  const [anoFilter, setAnoFilter] = useState("todas");
  const [sortOrder, setSortOrder] = useState("newest");
  
  // QUESTION_DOMAIN: Buscar apenas questões MODO_TREINO
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['student-questions', 'MODO_TREINO'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .contains('tags', ['MODO_TREINO']) // QUESTION_DOMAIN: Apenas treino
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as unknown as QuestionOption[]) : [],
        difficulty: (q.difficulty || 'medio') as "facil" | "medio" | "dificil",
      })) as Question[];
    },
  });

  // Buscar tentativas do usuário
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

  // Mutation para responder questão - MODO_TREINO: 0 pontos, não afeta ranking
  const answerMutation = useMutation({
    mutationFn: async ({ questionId, selectedAnswer }: { questionId: string; selectedAnswer: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const question = questions.find(q => q.id === questionId);
      if (!question) throw new Error("Questão não encontrada");

      const isCorrect = selectedAnswer === question.correct_answer;
      
      // QUESTION_DOMAIN: MODO_TREINO sempre 0 XP (não afeta ranking)
      const isModoTreino = question.tags?.includes('MODO_TREINO');
      const xpAwarded = isModoTreino ? 0 : (isCorrect ? question.points : 0);

      const { error } = await supabase
        .from('question_attempts')
        .insert({
          user_id: user.id,
          question_id: questionId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          xp_earned: xpAwarded,
        });

      if (error) throw error;
      return { isCorrect, points: xpAwarded, isModoTreino };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
      
      if (result.isCorrect) {
        // MODO_TREINO: Mensagem sem pontos
        if (result.isModoTreino) {
          toast.success("Você acertou! 🎯 (Modo Treino - sem pontos)");
        } else {
          toast.success(`Você acertou! +${result.points} XP`);
        }
      } else {
        toast.error("Resposta incorreta. Continue estudando!");
      }
    },
    onError: (err) => {
      console.error('Erro ao responder:', err);
      toast.error('Erro ao registrar resposta');
    },
  });

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = questions.length;
    const resolvidas = attempts.length;
    const acertos = attempts.filter(a => a.is_correct).length;
    const taxaAcerto = resolvidas > 0 ? Math.round((acertos / resolvidas) * 100) : 0;
    
    return { total, resolvidas, acertos, taxaAcerto };
  }, [questions, attempts]);

  // Map de tentativas por questão
  const attemptsByQuestion = useMemo(() => {
    const map = new Map<string, QuestionAttempt>();
    attempts.forEach(a => map.set(a.question_id, a));
    return map;
  }, [attempts]);

  // Anos únicos para filtro (ORDEM CANÔNICA)
  const uniqueAnos = useMemo(() => {
    const anos = questions.map(q => q.ano).filter(Boolean) as number[];
    return [...new Set(anos)].sort((a, b) => b - a);
  }, [questions]);

  // Questões filtradas
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Filtro por aba
    if (activeTab === 'resolvidas') {
      filtered = filtered.filter(q => attemptsByQuestion.has(q.id));
    } else if (activeTab === 'pendentes') {
      filtered = filtered.filter(q => !attemptsByQuestion.has(q.id));
    } else if (activeTab === 'acertos') {
      filtered = filtered.filter(q => {
        const attempt = attemptsByQuestion.get(q.id);
        return attempt?.is_correct === true;
      });
    } else if (activeTab === 'erros') {
      filtered = filtered.filter(q => {
        const attempt = attemptsByQuestion.get(q.id);
        return attempt?.is_correct === false;
      });
    }

    // Filtro por dificuldade
    if (dificuldade !== 'todas') {
      filtered = filtered.filter(q => q.difficulty === dificuldade);
    }

    // Filtro por banca
    if (banca !== 'todas') {
      filtered = filtered.filter(q => q.banca === banca);
    }

    // Filtros hierárquicos
    if (filterMacro !== 'todas') {
      filtered = filtered.filter(q => q.macro === filterMacro);
    }
    if (filterMicro !== 'todas') {
      filtered = filtered.filter(q => q.micro === filterMicro);
    }
    if (filterTema !== 'todas') {
      filtered = filtered.filter(q => q.tema === filterTema);
    }
    if (filterSubtema !== 'todas') {
      filtered = filtered.filter(q => q.subtema === filterSubtema);
    }

    // Filtro por ano (ORDEM CANÔNICA: após Micro, antes de Banca)
    if (anoFilter !== 'todas') {
      filtered = filtered.filter(q => q.ano === parseInt(anoFilter));
    }

    // Filtro por busca
    if (busca.trim()) {
      const term = busca.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(term) ||
        q.banca?.toLowerCase().includes(term)
      );
    }

    // Ordenação (ORDEM CANÔNICA: último filtro)
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
      case 'ano_asc':
        filtered.sort((a, b) => (a.ano || 0) - (b.ano || 0));
        break;
      case 'difficulty_asc':
        const diffOrder = { facil: 1, medio: 2, dificil: 3 };
        filtered.sort((a, b) => (diffOrder[a.difficulty as keyof typeof diffOrder] || 2) - (diffOrder[b.difficulty as keyof typeof diffOrder] || 2));
        break;
      case 'difficulty_desc':
        const diffOrderDesc = { facil: 1, medio: 2, dificil: 3 };
        filtered.sort((a, b) => (diffOrderDesc[b.difficulty as keyof typeof diffOrderDesc] || 2) - (diffOrderDesc[a.difficulty as keyof typeof diffOrderDesc] || 2));
        break;
    }

    return filtered;
  }, [questions, activeTab, dificuldade, banca, busca, attemptsByQuestion, filterMacro, filterMicro, filterTema, filterSubtema, anoFilter, sortOrder]);

  // Handlers
  const handleOpenQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionModalOpen(true);
  };

  const handleAnswerQuestion = (questionId: string, selectedAnswer: string) => {
    answerMutation.mutate({ questionId, selectedAnswer });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header com Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Banco de Questões</h1>
                <p className="text-muted-foreground">+{stats.total} questões comentadas</p>
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
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.taxaAcerto}%</p>
              <p className="text-xs text-muted-foreground">Taxa de acerto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="todas" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Todas</span>
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pendentes</span>
          </TabsTrigger>
          <TabsTrigger value="resolvidas" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Resolvidas</span>
          </TabsTrigger>
          <TabsTrigger value="acertos" className="gap-2 text-green-600">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Acertos</span>
          </TabsTrigger>
          <TabsTrigger value="erros" className="gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Erros</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtros Hierárquicos */}
      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-4">
          {/* Linha 1: Filtros MACRO → MICRO → TEMA → SUBTEMA */}
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

          {/* Linha 2: ORDEM CANÔNICA - Ano → Banca → Dificuldade → Ordenação */}
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
            
            {/* 1. Ano */}
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

            {/* 2. Banca */}
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

            {/* 3. Dificuldade */}
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

            {/* 4. Ordenação */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">📅 Mais recentes</SelectItem>
                <SelectItem value="oldest">📅 Mais antigas</SelectItem>
                <SelectItem value="ano_desc">🗓️ Ano ↓</SelectItem>
                <SelectItem value="ano_asc">🗓️ Ano ↑</SelectItem>
                <SelectItem value="difficulty_asc">📊 Fácil → Difícil</SelectItem>
                <SelectItem value="difficulty_desc">📊 Difícil → Fácil</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="default" className="gap-2">
              <Zap className="w-4 h-4" />
              Treino Rápido
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Questões */}
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
              Tente ajustar os filtros ou aguarde novas questões
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((questao, index) => {
            const attempt = attemptsByQuestion.get(questao.id);
            const hasAttempt = !!attempt;
            const isCorrect = attempt?.is_correct;

            return (
              <motion.div
                key={questao.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className={cn(
                  "transition-all hover:shadow-md cursor-pointer",
                  hasAttempt && isCorrect && "border-l-4 border-l-green-500",
                  hasAttempt && !isCorrect && "border-l-4 border-l-red-500"
                )}
                onClick={() => handleOpenQuestion(questao)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {questao.banca && (
                            <Badge variant="outline">
                              {BANCAS.find(b => b.value === questao.banca)?.label || questao.banca}
                            </Badge>
                          )}
                          <Badge className={DIFFICULTY_COLORS[questao.difficulty]}>
                            {DIFFICULTY_LABELS[questao.difficulty]}
                          </Badge>
                          {questao.ano && (
                            <Badge variant="secondary">{questao.ano}</Badge>
                          )}
                          <Badge variant="outline" className="gap-1">
                            <Trophy className="h-3 w-3" />
                            {questao.points} pts
                          </Badge>
                          {hasAttempt && (
                            <Badge variant={isCorrect ? "default" : "destructive"}>
                              {isCorrect ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Acertou</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Errou</>
                              )}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm line-clamp-2">{cleanQuestionText(questao.question_text)}</p>
                      </div>
                      <Button variant={hasAttempt ? "outline" : "default"} size="sm">
                        {hasAttempt ? "Revisar" : "Resolver"}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Resolução */}
      <QuestionModal
        open={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        question={selectedQuestion}
        userAttempt={selectedQuestion ? attemptsByQuestion.get(selectedQuestion.id) || null : null}
        onAnswer={handleAnswerQuestion}
        isSubmitting={answerMutation.isPending}
      />
    </div>
  );
}
