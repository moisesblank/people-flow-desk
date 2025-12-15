// ============================================
// PÁGINA DE SIMULADOS E QUIZZES
// Centro de avaliações do LMS
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  Brain, Trophy, Clock, Target, CheckCircle2, 
  Play, BarChart3, Flame, FlaskConical, Atom
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
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="simulados">Simulados</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
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
