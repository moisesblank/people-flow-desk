// ============================================
// STUDY PLAN ENEM 2030 - SANTUÁRIO BETA v10
// Plano de estudos inteligente para o ENEM
// Integrado com hooks de progresso existentes
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Target, 
  CheckCircle2, 
  Clock,
  BookOpen,
  Brain,
  Play,
  ChevronRight,
  Sparkles,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface StudyTask {
  id: string;
  title: string;
  subject: string;
  duration: number; // minutos
  type: 'video' | 'exercise' | 'review' | 'flashcard';
  completed: boolean;
  xpReward: number;
}

interface StudyPlanENEM2030Props {
  className?: string;
}

export function StudyPlanENEM2030({ className }: StudyPlanENEM2030Props) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<StudyTask[]>([
    { id: '1', title: 'Modelos Atômicos', subject: 'Química', duration: 25, type: 'video', completed: true, xpReward: 50 },
    { id: '2', title: 'Exercícios de Atomística', subject: 'Química', duration: 20, type: 'exercise', completed: false, xpReward: 75 },
    { id: '3', title: 'Revisão de Tabela Periódica', subject: 'Química', duration: 15, type: 'review', completed: false, xpReward: 40 },
    { id: '4', title: 'Flashcards: Elementos', subject: 'Química', duration: 10, type: 'flashcard', completed: false, xpReward: 30 },
    { id: '5', title: 'Ligações Químicas', subject: 'Química', duration: 30, type: 'video', completed: false, xpReward: 60 },
  ]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalXP = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.xpReward, 0);
  const progressPercent = (completedCount / tasks.length) * 100;

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const getTypeIcon = (type: StudyTask['type']) => {
    switch (type) {
      case 'video': return Play;
      case 'exercise': return Target;
      case 'review': return BookOpen;
      case 'flashcard': return Brain;
    }
  };

  const getTypeColor = (type: StudyTask['type']) => {
    switch (type) {
      case 'video': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'exercise': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'review': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'flashcard': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-primary/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Plano de Hoje
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  ~{tasks.reduce((sum, t) => sum + t.duration, 0)} min estimados
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/alunos/planejamento')}>
              Ver semana <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{completedCount} de {tasks.length} concluídas</span>
              <span className="font-medium flex items-center gap-1">
                <Flame className="h-4 w-4 text-amber-500" />
                +{totalXP} XP
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {tasks.map((task, index) => {
            const TypeIcon = getTypeIcon(task.type);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                  task.completed 
                    ? "bg-muted/30 border-muted" 
                    : "hover:border-primary/30 hover:bg-muted/20"
                )}
                onClick={() => toggleTask(task.id)}
              >
                <Checkbox 
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="h-5 w-5"
                />

                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center border",
                  getTypeColor(task.type),
                  task.completed && "opacity-50"
                )}>
                  <TypeIcon className="h-4 w-4" />
                </div>

                <div className={cn("flex-1 min-w-0", task.completed && "opacity-50")}>
                  <p className={cn(
                    "font-medium text-sm truncate",
                    task.completed && "line-through"
                  )}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{task.subject}</span>
                    <span>•</span>
                    <span>{task.duration} min</span>
                  </p>
                </div>

                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    task.completed 
                      ? "bg-green-500/20 text-green-600"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {task.completed ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Feito
                    </>
                  ) : (
                    `+${task.xpReward} XP`
                  )}
                </Badge>
              </motion.div>
            );
          })}

          {/* CTA */}
          {completedCount < tasks.length && (
            <Button 
              className="w-full mt-2 gap-2" 
              onClick={() => {
                const nextTask = tasks.find(t => !t.completed);
                if (nextTask?.type === 'video') navigate('/alunos/videoaulas');
                else if (nextTask?.type === 'exercise') navigate('/alunos/questoes');
                else if (nextTask?.type === 'flashcard') navigate('/alunos/materiais');
                else navigate('/alunos/materiais');
              }}
            >
              <Play className="h-4 w-4" />
              Continuar Plano
            </Button>
          )}

          {completedCount === tasks.length && (
            <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-600">Parabéns! 🎉</p>
              <p className="text-sm text-muted-foreground">Você completou o plano de hoje!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
