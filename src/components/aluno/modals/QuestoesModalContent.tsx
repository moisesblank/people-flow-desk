// ============================================
// 🎯 QUESTÕES MODAL CONTENT - MODO TREINO ONLY
// Acesso via Hub do Aluno (/alunos/planejamento)
// Espelho simplificado de /alunos/questoes
// Lazy-loaded
// ============================================

import { memo, useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Play, 
  Brain, 
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  TrendingUp,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTaxonomyForSelects } from "@/hooks/useQuestionTaxonomy";
import { toast } from "sonner";
import { cleanQuestionText } from "@/components/shared/QuestionEnunciado";
import QuestionTextField from "@/components/shared/QuestionTextField";

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
  difficulty: "facil" | "medio" | "dificil";
  macro?: string | null;
  micro?: string | null;
  points: number;
  tags?: string[] | null;
}

// Limite do RÁPIDO TREINO
const RAPIDO_TREINO_LIMIT = 30;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const QuestoesModalContent = memo(function QuestoesModalContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { macros, getMicrosForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();

  // ==========================================================
  // PATCH: Compatibilidade Taxonomy(value) x Questões(label)
  // Os Selects usam `value`, mas a tabela quiz_questions guarda labels.
  // ==========================================================
  const stripTaxLabel = useCallback((label?: string | null) => {
    if (!label) return '';
    return label.replace(/^[^\p{L}\p{N}]+/gu, '').trim();
  }, []);

  const getMacroLabelForDb = useCallback(
    (macroValue: string) => {
      const found = macros.find((m) => m.value === macroValue);
      // LEI SUPREMA: NUNCA expor VALUE
      return stripTaxLabel(found?.label) || '';
    },
    [macros, stripTaxLabel]
  );

  const getMicroLabelForDb = useCallback(
    (macroValue: string, microValue: string) => {
      const micros = getMicrosForSelect(macroValue === 'todas' ? '' : macroValue);
      const found = micros.find((m) => m.value === microValue);
      // LEI SUPREMA: NUNCA expor VALUE
      return stripTaxLabel(found?.label) || '';
    },
    [getMicrosForSelect, stripTaxLabel]
  );

  // Filtros rápidos
  const [filterMacro, setFilterMacro] = useState("todas");
  const [filterMicro, setFilterMicro] = useState("todas");
  const [filterDifficulty, setFilterDifficulty] = useState("todas");

  // Estado do treino
  const [isTraining, setIsTraining] = useState(false);
  const [trainingQuestions, setTrainingQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  // Buscar questões MODO_TREINO
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['hub-questions', 'MODO_TREINO'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question_text, question_type, options, correct_answer, difficulty, macro, micro, points, tags')
        .contains('tags', ['MODO_TREINO'])
        .eq('is_active', true)
        // FILTROS DE INTEGRIDADE: Excluir questões com erros de sistema
        .not('question_text', 'is', null)
        .neq('question_text', '')
        .not('explanation', 'is', null)
        .neq('explanation', '')
        .not('question_type', 'is', null)
        .neq('question_type', '')
        .order('created_at', { ascending: false })
        .limit(1000);

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
    queryKey: ['hub-question-attempts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('question_attempts')
        .select('question_id, is_correct')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Estatísticas
  const stats = useMemo(() => {
    const total = questions.length;
    const attemptedIds = new Set(attempts.map(a => a.question_id));
    const resolvidas = attemptedIds.size;
    const acertos = attempts.filter(a => a.is_correct).length;
    const taxaAcerto = attempts.length > 0 ? Math.round((acertos / attempts.length) * 100) : 0;
    return { total, resolvidas, acertos, taxaAcerto };
  }, [questions, attempts]);

  // Questões filtradas (usando labels para compatibilidade com o banco)
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];
    if (filterMacro !== 'todas') {
      const macroLabel = getMacroLabelForDb(filterMacro);
      filtered = filtered.filter(q => q.macro === macroLabel);
    }
    if (filterMicro !== 'todas') {
      const microLabel = getMicroLabelForDb(filterMacro, filterMicro);
      filtered = filtered.filter(q => q.micro === microLabel);
    }
    if (filterDifficulty !== 'todas') {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }
    return filtered;
  }, [questions, filterMacro, filterMicro, filterDifficulty, getMacroLabelForDb, getMicroLabelForDb]);

  // Iniciar treino
  const handleStartTraining = useCallback(() => {
    const attemptedIds = new Set(attempts.map(a => a.question_id));
    // Preferir questões não resolvidas
    const pending = filteredQuestions.filter(q => !attemptedIds.has(q.id));
    const toUse = pending.length > 0 ? pending : filteredQuestions;
    
    // Shuffle e limitar
    const shuffled = [...toUse].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, RAPIDO_TREINO_LIMIT);

    if (selected.length === 0) {
      toast.error('Nenhuma questão disponível com esses filtros');
      return;
    }

    setTrainingQuestions(selected);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults({ correct: 0, total: 0 });
    setIsTraining(true);
  }, [filteredQuestions, attempts]);

  // Confirmar resposta
  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || !user?.id) return;

    const question = trainingQuestions[currentIndex];
    const isCorrect = selectedAnswer === question.correct_answer;

    // Registrar tentativa
    try {
      await supabase.from('question_attempts').insert({
        user_id: user.id,
        question_id: question.id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        xp_earned: 0,
      });
    } catch (err) {
      console.error('Erro ao registrar:', err);
    }

    setResults(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    setShowResult(true);
  };

  // Próxima questão
  const handleNext = () => {
    if (currentIndex + 1 >= trainingQuestions.length) {
      // Fim do treino
      queryClient.invalidateQueries({ queryKey: ['hub-question-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
      toast.success(`Treino concluído! ${results.correct + (selectedAnswer === trainingQuestions[currentIndex]?.correct_answer ? 1 : 0)}/${trainingQuestions.length}`);
      setIsTraining(false);
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // ============================================
  // RENDER: MODO TREINO ATIVO
  // ============================================
  if (isTraining && trainingQuestions.length > 0) {
    const question = trainingQuestions[currentIndex];
    const progress = ((currentIndex + (showResult ? 1 : 0)) / trainingQuestions.length) * 100;

    return (
      <div className="space-y-4">
        {/* Header do treino */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold">Rápido Treino</p>
              <p className="text-sm text-muted-foreground">
                Questão {currentIndex + 1} de {trainingQuestions.length}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {Math.round(progress)}%
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Enunciado */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm whitespace-pre-wrap">{cleanQuestionText(question.question_text).slice(0, 500)}...</p>
          </CardContent>
        </Card>

        {/* Alternativas */}
        <div className="space-y-2">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrectOption = option.id === question.correct_answer;
            
            let optionClass = "border-muted-foreground/30 hover:border-primary/50 cursor-pointer";
            if (showResult) {
              if (isCorrectOption) {
                optionClass = "border-green-500 bg-green-500/10";
              } else if (isSelected && !isCorrectOption) {
                optionClass = "border-red-500 bg-red-500/10";
              }
              optionClass += " cursor-not-allowed";
            } else if (isSelected) {
              optionClass = "border-primary bg-primary/10 cursor-pointer";
            }

            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                  optionClass
                )}
                onClick={() => !showResult && setSelectedAnswer(option.id)}
              >
                <span className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full border-2 font-bold text-xs",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                )}>
                  {option.id.toUpperCase()}
                </span>
                <QuestionTextField content={option.text} fieldType="alternativa" textSize="sm" className="flex-1" inline />
                {showResult && isCorrectOption && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {showResult && isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-red-500" />}
              </div>
            );
          })}
        </div>

        {/* Resultado */}
        {showResult && (
          <Card className={cn(
            "border-2",
            selectedAnswer === question.correct_answer
              ? "bg-green-500/10 border-green-500"
              : "bg-red-500/10 border-red-500"
          )}>
            <CardContent className="py-3 flex items-center gap-3">
              {selectedAnswer === question.correct_answer ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="font-bold text-green-600">Correto!</p>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <p className="font-bold text-red-600">
                    Incorreto. Resposta: {question.correct_answer.toUpperCase()}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTraining(false)} className="flex-1">
            Sair
          </Button>
          {!showResult ? (
            <Button 
              onClick={handleConfirmAnswer}
              disabled={!selectedAnswer}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1">
              {currentIndex + 1 >= trainingQuestions.length ? 'Finalizar' : 'Próxima'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: TELA INICIAL
  // ============================================
  return (
    <div className="space-y-5">
      {/* Aviso: Modo Treino */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold flex items-center gap-2">
                Modo Treino
                <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10">
                  0 XP
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Pratique sem pressão! Questões de treino não afetam seu ranking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Estatísticas gerais */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Disponíveis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-xl font-bold">{stats.resolvidas}</div>
            <div className="text-xs text-muted-foreground">Resolvidas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <div className="text-xl font-bold">{stats.taxaAcerto}%</div>
            <div className="text-xs text-muted-foreground">Taxa de acerto</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros rápidos */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Escolha o foco do treino
        </Label>
        
        <div className="grid grid-cols-3 gap-2">
          <Select 
            value={filterMacro} 
            onValueChange={(v) => {
              setFilterMacro(v);
              setFilterMicro('todas');
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Macro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas áreas</SelectItem>
              {macros.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filterMicro} 
            onValueChange={setFilterMicro}
            disabled={filterMacro === 'todas'}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Micro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos assuntos</SelectItem>
              {getMicrosForSelect(filterMacro === 'todas' ? '' : filterMacro).map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Dificuldade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="facil">🟢 Fácil</SelectItem>
              <SelectItem value="medio">🟡 Médio</SelectItem>
              <SelectItem value="dificil">🔴 Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredQuestions.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {filteredQuestions.length} questões disponíveis com esses filtros
          </p>
        )}
      </div>
      
      {/* Botão iniciar */}
      <Button 
        onClick={handleStartTraining}
        disabled={isLoading || filteredQuestions.length === 0}
        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Play className="w-5 h-5 mr-2" />
        )}
        Iniciar Rápido Treino
        <Badge variant="secondary" className="ml-2 bg-black/20 text-white">
          {Math.min(filteredQuestions.length, RAPIDO_TREINO_LIMIT)}
        </Badge>
      </Button>
    </div>
  );
});

export default QuestoesModalContent;
