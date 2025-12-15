// ============================================
// SYNAPSE v14.0 - QUIZ LIST WIDGET
// Lista de quizzes disponíveis
// ============================================

import { motion } from 'framer-motion';
import { 
  Brain, 
  Clock, 
  Trophy, 
  Play,
  CheckCircle2,
  Lock,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useQuizzes, useAllUserAttempts } from '@/hooks/useQuiz';
import { useAuth } from '@/hooks/useAuth';

export function QuizListWidget() {
  const navigate = useNavigate();
  const { data: quizzes, isLoading } = useQuizzes();
  const { data: attempts } = useAllUserAttempts();

  const getQuizStatus = (quizId: string) => {
    const quizAttempts = attempts?.filter(a => a.quiz_id === quizId) || [];
    if (quizAttempts.length === 0) return { status: 'new', attempts: 0, bestScore: 0 };
    
    const bestAttempt = quizAttempts.reduce((best, current) => 
      (current.percentage || 0) > (best.percentage || 0) ? current : best
    , quizAttempts[0]);
    
    return { 
      status: bestAttempt.passed ? 'passed' : 'attempted',
      attempts: quizAttempts.length,
      bestScore: bestAttempt.percentage || 0
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-stats-green/20 text-stats-green border-stats-green/30"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'attempted':
        return <Badge className="bg-stats-gold/20 text-stats-gold border-stats-gold/30">Em progresso</Badge>;
      default:
        return <Badge variant="outline">Novo</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const publishedQuizzes = quizzes?.filter(q => q.is_published) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            Simulados Disponíveis
          </div>
          <Badge variant="outline">{publishedQuizzes.length} quiz(zes)</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {publishedQuizzes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum simulado disponível</p>
          </div>
        ) : (
          publishedQuizzes.slice(0, 5).map((quiz, index) => {
            const quizStatus = getQuizStatus(quiz.id);
            
            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{quiz.title}</h4>
                      {getStatusBadge(quizStatus.status)}
                    </div>
                    {quiz.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {quiz.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {quiz.time_limit_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {quiz.time_limit_minutes} min
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {quiz.xp_reward || 0} XP
                      </span>
                      {quizStatus.attempts > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Melhor: {quizStatus.bestScore}%
                        </span>
                      )}
                    </div>
                    {quizStatus.status !== 'new' && (
                      <Progress 
                        value={quizStatus.bestScore} 
                        className="h-1 mt-2" 
                      />
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant={quizStatus.status === 'passed' ? 'outline' : 'default'}
                    onClick={() => navigate(`/simulados?quiz=${quiz.id}`)}
                    className="shrink-0"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {quizStatus.status === 'new' ? 'Iniciar' : 'Refazer'}
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}

        {publishedQuizzes.length > 5 && (
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => navigate('/simulados')}
          >
            Ver todos os simulados
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default QuizListWidget;
