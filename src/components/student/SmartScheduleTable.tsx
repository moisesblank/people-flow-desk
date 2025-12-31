// ============================================
// SMART SCHEDULE TABLE - Cronograma Inteligente
// Componente modularizado para exibição do progresso
// ============================================

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Video,
  BookOpen,
  BrainCircuit,
  FileText,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Activity {
  id: string;
  code: string;
  category: string;
  categoryColor: string;
  progress: number;
  hasResume?: boolean;
  hasFlashcards?: boolean;
  hasSimulado?: boolean;
  hasQuestoes?: boolean;
  hasLink?: boolean;
  hasMapaMental?: boolean;
}

interface SmartScheduleTableProps {
  weekId?: string;
  userId?: string;
  activities?: Activity[];
  onActivityClick?: (activity: Activity) => void;
  onTramonClick?: () => void;
}

export function SmartScheduleTable({
  weekId,
  userId,
  activities: propActivities,
  onActivityClick,
  onTramonClick,
}: SmartScheduleTableProps) {
  // Default activities if none provided
  const activities = useMemo(() => {
    if (propActivities) return propActivities;
    
    // Mock data para demonstração
    return [
      { id: "1", code: "PED - D1", category: "GASTRO", categoryColor: "bg-red-500", progress: 0 },
      { id: "2", code: "CIR - D2", category: "CARDIOVASCULAR", categoryColor: "bg-red-600", progress: 50 },
      { id: "3", code: "CLI - D3", category: "NEURO", categoryColor: "bg-gray-500", progress: 100 },
      { id: "4", code: "GO - D4", category: "OBSTETRÍCIA", categoryColor: "bg-blue-500", progress: 25 },
    ];
  }, [propActivities]);

  const completedCount = activities.filter(a => a.progress === 100).length;
  const overallProgress = activities.length > 0 
    ? Math.round(activities.reduce((sum, a) => sum + a.progress, 0) / activities.length)
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Cronograma Inteligente</CardTitle>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  ENA vIA
                </Badge>
              </div>
              <CardDescription>
                {completedCount} de {activities.length} atividades concluídas
              </CardDescription>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-destructive">{overallProgress}%</div>
            <Progress value={overallProgress} className="w-20 h-2 mt-1" />
            <span className="text-xs text-muted-foreground">progresso geral</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Table Header */}
        <div className="grid grid-cols-10 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b mb-2">
          <span>Atividade</span>
          <span>Categoria</span>
          <span className="text-center">%</span>
          <span className="text-center">Resumos</span>
          <span className="text-center">Flashcards</span>
          <span className="text-center">Simulado</span>
          <span className="text-center">Questões</span>
          <span className="text-center">Link</span>
          <span className="text-center">Mapa Mental</span>
          <span className="text-center">Resolvido?</span>
        </div>

        {/* Table Rows */}
        <div className="space-y-1">
          {activities.map((activity, index) => {
            const isCompleted = activity.progress === 100;
            
            return (
              <motion.div 
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-10 gap-2 items-center text-sm py-3 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer"
                onClick={() => onActivityClick?.(activity)}
              >
                {/* Atividade */}
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{activity.code}</span>
                </div>

                {/* Categoria */}
                <Badge 
                  variant="outline" 
                  className={`text-xs justify-center ${activity.categoryColor} text-white border-0`}
                >
                  {activity.category}
                </Badge>

                {/* Progress */}
                <div className="flex items-center justify-center gap-1">
                  <div className={`w-16 h-1.5 rounded-full overflow-hidden ${
                    activity.progress === 100 ? 'bg-destructive' : activity.progress > 0 ? 'bg-destructive/30' : 'bg-blue-500/30'
                  }`}>
                    <div 
                      className={`h-full transition-all ${
                        activity.progress === 100 ? 'bg-destructive' : activity.progress > 0 ? 'bg-destructive' : 'bg-blue-500'
                      }`}
                      style={{ width: `${activity.progress}%` }}
                    />
                  </div>
                  <span className="text-xs w-8">{activity.progress}%</span>
                </div>

                {/* Resumos */}
                <div className="flex justify-center">
                  <BookOpen className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                </div>

                {/* Flashcards */}
                <div className="flex justify-center">
                  <BrainCircuit className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                </div>

                {/* Simulado */}
                <div className="flex justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                </div>

                {/* Questões */}
                <div className="flex justify-center">
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                </div>

                {/* Link */}
                <div className="flex justify-center">
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                </div>

                {/* Mapa Mental */}
                <div className="flex justify-center">
                  <BrainCircuit className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                </div>

                {/* Checkbox */}
                <div className="flex justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 hover:border-primary cursor-pointer transition-colors" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* TRAMON v8 floating button */}
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={onTramonClick}
            className="gap-2 bg-gradient-to-r from-primary/10 via-background to-primary/10 border-primary/30 shadow-lg"
          >
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">TRAMON v8</span>
            <Sparkles className="h-5 w-5 text-primary" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
