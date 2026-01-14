// ============================================
// PÁGINA DE SIMULADOS E QUIZZES
// Centro de avaliações do LMS
// Integrado com QUESTION_DOMAIN: SIMULADOS
// ============================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, Trophy, Clock, Target, CheckCircle2, 
  Play, BarChart3, Flame, FlaskConical, Atom, FileQuestion
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuizzes, useQuiz, useQuizAttempts, useStartQuizAttempt, useSubmitQuiz } from '@/hooks/useQuiz';
import { QuizPlayer, QuizResult } from '@/components/lms/QuizPlayer';
import { AnimatedAtom, ChemistryTip } from '@/components/chemistry/ChemistryVisuals';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { cleanQuestionText } from '@/components/shared/QuestionEnunciado';

export default function Simulados() {
  const navigate = useNavigate();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultAttempt, setResultAttempt] = useState<any>(null);

  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuizzes();
  const { data: quizData, isLoading: isLoadingQuiz } = useQuiz(selectedQuizId || undefined);
  const { data: attempts } = useQuizAttempts(selectedQuizId || undefined);
  const { mutate: startAttempt, isPending: isStarting } = useStartQuizAttempt();
  const { mutate: submitQuiz, isPending: isSubmitting } = useSubmitQuiz();

  // QUESTION_DOMAIN: Buscar questões com tag SIMULADOS (ESCALA 5000+: query limitada)
  const { data: simuladosQuestions, isLoading: isLoadingSimuladosQuestions } = useQuery({
    queryKey: ['questions', 'SIMULADOS'],
    queryFn: async () => {
      // ⚡ ESCALA 5000+: Query limitada - não carrega tudo
      // Simulados usa questões pré-cadastradas nos quizzes, esta query é apenas para estatísticas
      const { data, error, count } = await supabase
        .from('quiz_questions')
        .select('id, question_text, difficulty, banca, ano, macro, micro, points, tags, is_active', { count: 'exact' })
        .contains('tags', ['SIMULADOS'])
        .eq('is_active', true)
        // 🔒 FILTROS DE INTEGRIDADE PERMANENTES: Excluir questões com erros de sistema
        .not('question_text', 'is', null)
        .neq('question_text', '')
        .not('explanation', 'is', null)
        .neq('explanation', '')
        .not('question_type', 'is', null)
        .neq('question_type', '')
        .order('created_at', { ascending: false })
        .limit(500); // Limite para estatísticas - não precisa de todas

      if (error) throw error;
      return { data: data || [], totalCount: count || 0 };
    },
    staleTime: 30000, // 30s cache
  });

  const simulados = quizzes?.filter((q) => q.quiz_type === 'simulado') || [];
  const avaliacoes = quizzes?.filter((q) => q.quiz_type === 'avaliacao') || [];
  const quizzesRapidos = quizzes?.filter((q) => q.quiz_type === 'quiz') || [];

  const handleStartQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    startAttempt(quizId, {
      onSuccess: (attempt) => {
        setCurrentAttempt(attempt);
        setShowResult(false);
      },
    });
  };

  const handleSubmit = (answers: Record<string, string>, timeSpent: number) => {
    if (!currentAttempt || !quizData) return;

    submitQuiz(
      {
        attemptId: currentAttempt.id,
        answers,
        questions: quizData.questions,
        timeSpent,
      },
      {
        onSuccess: (result) => {
          setResultAttempt(result.attempt);
          setShowResult(true);
          setCurrentAttempt(null);
        },
      }
    );
  };

  const handleBack = () => {
    setSelectedQuizId(null);
    setCurrentAttempt(null);
    setShowResult(false);
    setResultAttempt(null);
  };

  const handleRetry = () => {
    if (selectedQuizId) {
      handleStartQuiz(selectedQuizId);
    }
  };

  // Se está fazendo um quiz
  if (currentAttempt && quizData) {
    return (
      <div className="container mx-auto py-6 px-4">
        <QuizPlayer
          quiz={quizData.quiz}
          questions={quizData.questions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // Se está vendo resultado
  if (showResult && resultAttempt && quizData) {
    return (
      <div className="container mx-auto py-6 px-4">
        <QuizResult
          attempt={resultAttempt}
          quiz={quizData.quiz}
          questions={quizData.questions}
          onBack={handleBack}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (isLoadingQuizzes) {
    return <LoadingState message="Carregando simulados..." />;
  }

  return (
    <>
      <Helmet>
        <title>Simulados e Quizzes | Moisés Medeiros</title>
        <meta name="description" content="Teste seus conhecimentos com simulados e quizzes de química" />
      </Helmet>

      <div className="container mx-auto py-6 px-4 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">
                  Centro de Avaliações
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Simulados & Quizzes</h1>
              <p className="text-muted-foreground max-w-lg">
                Teste seus conhecimentos e acompanhe sua evolução com nossos simulados e quizzes de química.
              </p>
            </div>
            <div className="hidden lg:block">
              <AnimatedAtom size={80} />
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Simulados', value: simulados.length, icon: Brain, color: 'text-purple-500' },
            { label: 'Avaliações', value: avaliacoes.length, icon: Target, color: 'text-blue-500' },
            { label: 'Quizzes Rápidos', value: quizzesRapidos.length, icon: Flame, color: 'text-orange-500' },
            { label: 'Total Disponível', value: quizzes?.length || 0, icon: Trophy, color: 'text-primary' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl bg-muted", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="simulados" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="simulados">Simulados</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="questoes" className="flex items-center gap-1">
              <FileQuestion className="h-3 w-3" />
              Questões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulados" className="space-y-4">
            <QuizList 
              quizzes={simulados} 
              onStart={handleStartQuiz} 
              isStarting={isStarting}
              attempts={attempts}
            />
          </TabsContent>

          <TabsContent value="avaliacoes" className="space-y-4">
            <QuizList 
              quizzes={avaliacoes} 
              onStart={handleStartQuiz} 
              isStarting={isStarting}
              attempts={attempts}
            />
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <QuizList 
              quizzes={quizzesRapidos} 
              onStart={handleStartQuiz} 
              isStarting={isStarting}
              attempts={attempts}
            />
          </TabsContent>

          {/* QUESTION_DOMAIN: Questões marcadas como SIMULADOS */}
          <TabsContent value="questoes" className="space-y-4">
            <Card className="border-red-500/30 bg-gradient-to-r from-red-500/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge className="bg-red-600 text-white">SIMULADOS</Badge>
                  Banco de Questões para Simulados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSimuladosQuestions ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingState />
                  </div>
                ) : simuladosQuestions?.data && simuladosQuestions.data.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-sm">
                        {simuladosQuestions.totalCount.toLocaleString('pt-BR')} questões disponíveis
                      </Badge>
                      <Badge className="bg-amber-500 text-white">
                        <Trophy className="h-3 w-3 mr-1" />
                        10 pts cada
                      </Badge>
                    </div>
                    <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
                      {simuladosQuestions.data.map((q: any, i: number) => (
                        <div 
                          key={q.id}
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm line-clamp-2">{cleanQuestionText(q.question_text || '').substring(0, 150)}...</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={cn(
                                  "text-xs",
                                  q.difficulty === 'facil' && 'bg-green-500',
                                  q.difficulty === 'medio' && 'bg-yellow-500',
                                  q.difficulty === 'dificil' && 'bg-red-500',
                                )}>
                                  {q.difficulty === 'facil' ? 'Fácil' : q.difficulty === 'medio' ? 'Médio' : 'Difícil'}
                                </Badge>
                                {q.banca && <Badge variant="outline" className="text-xs">{q.banca}</Badge>}
                                {q.ano && <Badge variant="secondary" className="text-xs">{q.ano}</Badge>}
                              </div>
                            </div>
                            <Badge className="bg-red-600 text-white shrink-0">
                              🎯 Simulado
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma questão marcada como SIMULADOS ainda.</p>
                    <p className="text-sm mt-1">Importe questões e selecione "Simulados" no passo final.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dica de Química */}
        <ChemistryTip title="Dica de Química" content="Pratique com simulados para fixar o conteúdo e ganhar confiança nas provas!" />

        {/* Empty State */}
        {quizzes?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum quiz disponível</h3>
              <p className="text-muted-foreground mb-4">
                Os simulados e quizzes serão adicionados em breve.
              </p>
              <Button onClick={() => navigate('/cursos')}>
                Ver Cursos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

// Componente de Lista de Quizzes
interface QuizListProps {
  quizzes: any[];
  onStart: (quizId: string) => void;
  isStarting: boolean;
  attempts?: any[];
}

function QuizList({ quizzes, onStart, isStarting, attempts }: QuizListProps) {
  if (quizzes.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-muted-foreground">Nenhum item nesta categoria ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz, idx) => {
        const userAttempts = attempts?.filter((a) => a.quiz_id === quiz.id) || [];
        const bestAttempt = userAttempts.reduce(
          (best, curr) => (curr.percentage > (best?.percentage || 0) ? curr : best),
          null as any
        );
        const hasPassed = userAttempts.some((a) => a.passed);
        const attemptsRemaining = quiz.max_attempts - userAttempts.length;

        return (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={cn(
              "h-full hover:border-primary/50 transition-all",
              hasPassed && "border-green-500/30"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  {hasPassed && (
                    <Badge className="bg-green-500/20 text-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aprovado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {quiz.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {quiz.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {quiz.time_limit_minutes && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {quiz.time_limit_minutes} min
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {quiz.passing_score}% para passar
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    +{quiz.xp_reward} XP
                  </Badge>
                </div>

                {bestAttempt && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Melhor resultado</span>
                      <span className={bestAttempt.passed ? "text-green-500" : "text-muted-foreground"}>
                        {bestAttempt.percentage}%
                      </span>
                    </div>
                    <Progress 
                      value={bestAttempt.percentage} 
                      className={cn("h-2", bestAttempt.passed && "[&>div]:bg-green-500")}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {userAttempts.length} tentativa(s) • {attemptsRemaining > 0 ? `${attemptsRemaining} restante(s)` : 'Limite atingido'}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onStart(quiz.id)}
                    disabled={isStarting || (attemptsRemaining <= 0 && !hasPassed)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {hasPassed ? 'Refazer' : 'Iniciar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
