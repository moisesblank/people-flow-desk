// ============================================
// LESSON PLAYLIST - Componente de Playlist de Aulas
// Modularizado do AlunoPlanejamento.tsx
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Video, 
  Play, 
  CheckCircle2, 
  Clock, 
  ChevronUp, 
  ChevronDown 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface Lesson {
  id: string;
  title: string;
  duration_minutes?: number;
  is_completed?: boolean;
  position?: number;
  order_index?: number;
}

export interface LessonProgress {
  id: string;
  lesson_id: string;
  is_completed: boolean;
  progress_percent?: number;
}

interface LessonPlaylistProps {
  weekTitle: string;
  weekNumber?: number;
  lessons: Lesson[];
  currentLessonId?: string;
  lessonProgress?: Record<string, LessonProgress>;
  onSelectLesson: (lesson: Lesson) => void;
}

export function LessonPlaylist({
  weekTitle,
  weekNumber,
  lessons,
  currentLessonId,
  lessonProgress = {},
  onSelectLesson,
}: LessonPlaylistProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const completedCount = lessons.filter(l => lessonProgress[l.id]?.is_completed || l.is_completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const remainingMinutes = lessons
    .filter(l => !(lessonProgress[l.id]?.is_completed || l.is_completed))
    .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

  return (
    <Card className="border-border/50 overflow-hidden h-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-base">
                    {weekNumber ? `Semana ${weekNumber} - ` : ""}{weekTitle}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {completedCount} de {lessons.length} aulas concluídas
                  </CardDescription>
                </div>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Progress value={progressPercent} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground">{progressPercent}% concluído</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{remainingMinutes} min restantes</span>
          </div>
        </div>

        <CollapsibleContent>
          <ScrollArea className="h-[400px]">
            <div className="px-2 pb-2 space-y-1">
              {lessons.map((lesson, index) => {
                const progress = lessonProgress[lesson.id];
                const isActive = currentLessonId === lesson.id;
                const isCompleted = progress?.is_completed || lesson.is_completed;

                return (
                  <motion.button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    whileHover={{ x: 4 }}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all",
                      isActive
                        ? "bg-destructive/20 border-l-4 border-destructive"
                        : isCompleted
                        ? "bg-green-500/5 hover:bg-green-500/10"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Número/Check */}
                      <div
                        className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0",
                          isCompleted
                            ? "bg-destructive/20 text-destructive"
                            : isActive
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={cn(
                            "font-medium text-sm line-clamp-1",
                            isActive && "text-destructive"
                          )}>
                            {lesson.title}
                          </h4>
                          {isActive && (
                            <Badge className="bg-destructive/80 text-destructive-foreground text-[10px] px-1.5 py-0">
                              Atual
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.duration_minutes || 0}:00
                          </span>
                          {isCompleted && (
                            <span className="text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Concluída
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Play Button */}
                      <div className="shrink-0">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                            isActive 
                              ? "bg-destructive text-destructive-foreground" 
                              : "bg-muted hover:bg-muted-foreground/20"
                          )}
                        >
                          <Play className="h-3 w-3 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
