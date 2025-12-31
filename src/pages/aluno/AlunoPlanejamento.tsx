// ============================================
// 📚 PLANEJAMENTO DO ALUNO
// /alunos/planejamento
// Consumo: semanas, aulas, progresso, notas
// ============================================

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Icons
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  Video,
  FileText,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Trophy,
  Target,
  Zap,
  Brain,
  Lightbulb,
  PenLine,
  Send,
  ThumbsUp,
  Heart,
  Bookmark,
  Share2,
  MoreHorizontal,
  AlertCircle,
  Timer,
  RotateCcw,
} from "lucide-react";

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types
interface PlanningWeek {
  id: string;
  title: string;
  description: string | null;
  week_number: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  thumbnail_url: string | null;
  estimated_hours: number | null;
  difficulty: string;
  created_at: string;
}

interface PlanningLesson {
  id: string;
  week_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_provider: string | null;
  duration_minutes: number | null;
  position: number;
  lesson_type: string;
  is_required: boolean;
  estimated_time_minutes: number | null;
  xp_reward: number | null;
}

interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  progress_percent: number;
  is_completed: boolean;
  time_spent_minutes: number;
  xp_earned: number;
}

interface WeekProgress {
  id: string;
  user_id: string;
  week_id: string;
  progress_percent: number;
  lessons_completed: number;
  total_lessons: number;
  is_completed: boolean;
}

interface PlanningNote {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
  timestamp_seconds: number | null;
  color: string;
  is_pinned: boolean;
  created_at: string;
}

interface ReviewTopic {
  id: string;
  lesson_id: string;
  topic: string;
  importance: string;
  position: number;
}

// Week Selector Component
function WeekSelector({
  weeks,
  selectedWeek,
  onSelectWeek,
  weekProgress,
}: {
  weeks: PlanningWeek[];
  selectedWeek: PlanningWeek | null;
  onSelectWeek: (week: PlanningWeek) => void;
  weekProgress: Record<string, WeekProgress>;
}) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-4">
        {weeks.map((week) => {
          const progress = weekProgress[week.id];
          const progressPercent = progress?.progress_percent || 0;
          const isSelected = selectedWeek?.id === week.id;
          const isCompleted = progress?.is_completed;

          return (
            <motion.button
              key={week.id}
              onClick={() => onSelectWeek(week)}
              className={`relative flex-shrink-0 w-48 p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-lg"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isCompleted && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Semana {week.week_number}</span>
              </div>

              <h4 className="font-medium text-sm line-clamp-2 mb-3">{week.title}</h4>

              <Progress value={progressPercent} className="h-1.5" />
              <span className="text-xs text-muted-foreground mt-1 block">
                {progressPercent}% concluído
              </span>
            </motion.button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// Lesson Card Component
function LessonCard({
  lesson,
  progress,
  isActive,
  onClick,
}: {
  lesson: PlanningLesson;
  progress: LessonProgress | undefined;
  isActive: boolean;
  onClick: () => void;
}) {
  const isCompleted = progress?.is_completed;
  const progressPercent = progress?.progress_percent || 0;

  const typeConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
    video: { icon: Video, label: "Videoaula", color: "text-blue-500" },
    reading: { icon: BookOpen, label: "Leitura", color: "text-green-500" },
    exercise: { icon: PenLine, label: "Exercício", color: "text-orange-500" },
    quiz: { icon: Brain, label: "Quiz", color: "text-purple-500" },
    live: { icon: Play, label: "Live", color: "text-red-500" },
  };

  const config = typeConfig[lesson.lesson_type] || typeConfig.video;
  const Icon = config.icon;

  return (
    <motion.button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
        isActive
          ? "border-primary bg-primary/5 shadow-md"
          : isCompleted
          ? "border-green-500/30 bg-green-500/5"
          : "border-border hover:border-primary/30 hover:bg-muted/30"
      }`}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-start gap-4">
        {/* Icon/Status */}
        <div
          className={`p-3 rounded-xl ${
            isCompleted
              ? "bg-green-500/20"
              : isActive
              ? "bg-primary/20"
              : "bg-muted"
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Icon className={`h-5 w-5 ${config.color}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {config.label}
            </Badge>
            {lesson.xp_reward && (
              <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                +{lesson.xp_reward} XP
              </Badge>
            )}
          </div>

          <h4 className="font-medium line-clamp-1">{lesson.title}</h4>

          {lesson.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {lesson.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {lesson.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.duration_minutes} min
              </span>
            )}
            {progressPercent > 0 && !isCompleted && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {progressPercent}% assistido
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </motion.button>
  );
}

// Video Player Component
function VideoPlayer({
  lesson,
  onComplete,
}: {
  lesson: PlanningLesson;
  onComplete: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Placeholder for video player
  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      {lesson.video_url ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            className="rounded-full h-16 w-16"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
          <Video className="h-16 w-16 mb-4" />
          <p>Vídeo em breve</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-primary w-1/3" />
      </div>
    </div>
  );
}

// Notes Panel Component
function NotesPanel({
  lessonId,
  notes,
  onAddNote,
  isAdding,
}: {
  lessonId: string;
  notes: PlanningNote[];
  onAddNote: (content: string) => void;
  isAdding: boolean;
}) {
  const [newNote, setNewNote] = useState("");

  const handleSubmit = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote("");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <PenLine className="h-5 w-5" />
          Minhas Anotações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Adicione uma anotação..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newNote.trim() || isAdding}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Salvar Anotação
          </Button>
        </div>

        <Separator />

        {/* Notes List */}
        <ScrollArea className="h-[300px]">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Lightbulb className="h-10 w-10 mb-2" />
              <p className="text-sm">Nenhuma anotação ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-muted/50 border"
                  style={{ borderLeftColor: note.color, borderLeftWidth: 3 }}
                >
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(note.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Review Topics Component
function ReviewTopics({ topics }: { topics: ReviewTopic[] }) {
  const importanceConfig: Record<string, { label: string; color: string }> = {
    low: { label: "Baixa", color: "bg-gray-500/20 text-gray-500" },
    medium: { label: "Média", color: "bg-yellow-500/20 text-yellow-500" },
    high: { label: "Alta", color: "bg-orange-500/20 text-orange-500" },
    critical: { label: "Crítica", color: "bg-red-500/20 text-red-500" },
  };

  if (topics.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Tópicos para Revisão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <span className="text-sm">{topic.topic}</span>
              <Badge className={importanceConfig[topic.importance]?.color || importanceConfig.medium.color}>
                {importanceConfig[topic.importance]?.label || "Média"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Rating Component
function LessonRating({
  lessonId,
  currentRating,
  onRate,
}: {
  lessonId: string;
  currentRating: number | null;
  onRate: (rating: number) => void;
}) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5" />
          Avalie esta aula
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 justify-center py-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => onRate(rating)}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(null)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  (hoveredRating !== null ? rating <= hoveredRating : rating <= (currentRating || 0))
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
        {currentRating && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            Você avaliou com {currentRating} estrela{currentRating > 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Main Component
export default function AlunoPlanejamento() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState<PlanningWeek | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<PlanningLesson | null>(null);

  // Fetch active weeks
  const { data: weeks = [], isLoading: weeksLoading } = useQuery({
    queryKey: ["student-planning-weeks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_weeks")
        .select("*")
        .eq("status", "active")
        .order("week_number", { ascending: true });
      if (error) throw error;
      return data as PlanningWeek[];
    },
  });

  // Fetch lessons for selected week
  const { data: lessons = [] } = useQuery({
    queryKey: ["student-planning-lessons", selectedWeek?.id],
    queryFn: async () => {
      if (!selectedWeek) return [];
      const { data, error } = await supabase
        .from("planning_lessons")
        .select("*")
        .eq("week_id", selectedWeek.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as PlanningLesson[];
    },
    enabled: !!selectedWeek,
  });

  // Fetch week progress
  const { data: weekProgressList = [] } = useQuery({
    queryKey: ["student-week-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("planning_week_progress")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as WeekProgress[];
    },
    enabled: !!user?.id,
  });

  // Fetch lesson progress
  const { data: lessonProgressList = [] } = useQuery({
    queryKey: ["student-lesson-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("planning_lesson_progress")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as LessonProgress[];
    },
    enabled: !!user?.id,
  });

  // Fetch notes for selected lesson
  const { data: notes = [] } = useQuery({
    queryKey: ["student-lesson-notes", selectedLesson?.id, user?.id],
    queryFn: async () => {
      if (!selectedLesson || !user?.id) return [];
      const { data, error } = await supabase
        .from("planning_notes")
        .select("*")
        .eq("lesson_id", selectedLesson.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PlanningNote[];
    },
    enabled: !!selectedLesson && !!user?.id,
  });

  // Fetch review topics for selected lesson
  const { data: reviewTopics = [] } = useQuery({
    queryKey: ["student-review-topics", selectedLesson?.id],
    queryFn: async () => {
      if (!selectedLesson) return [];
      const { data, error } = await supabase
        .from("planning_review_topics")
        .select("*")
        .eq("lesson_id", selectedLesson.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as ReviewTopic[];
    },
    enabled: !!selectedLesson,
  });

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("student-planning-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "planning_weeks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["student-planning-weeks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "planning_lessons" }, () => {
        queryClient.invalidateQueries({ queryKey: ["student-planning-lessons"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Auto-select first week
  useEffect(() => {
    if (weeks.length > 0 && !selectedWeek) {
      setSelectedWeek(weeks[0]);
    }
  }, [weeks, selectedWeek]);

  // Auto-select first lesson when week changes
  useEffect(() => {
    if (lessons.length > 0) {
      // Find first incomplete lesson or first lesson
      const lessonProgress = lessonProgressList.reduce((acc, lp) => {
        acc[lp.lesson_id] = lp;
        return acc;
      }, {} as Record<string, LessonProgress>);

      const firstIncomplete = lessons.find(l => !lessonProgress[l.id]?.is_completed);
      setSelectedLesson(firstIncomplete || lessons[0]);
    } else {
      setSelectedLesson(null);
    }
  }, [lessons, lessonProgressList]);

  // Maps for quick lookup
  const weekProgress = useMemo(() => {
    return weekProgressList.reduce((acc, wp) => {
      acc[wp.week_id] = wp;
      return acc;
    }, {} as Record<string, WeekProgress>);
  }, [weekProgressList]);

  const lessonProgress = useMemo(() => {
    return lessonProgressList.reduce((acc, lp) => {
      acc[lp.lesson_id] = lp;
      return acc;
    }, {} as Record<string, LessonProgress>);
  }, [lessonProgressList]);

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !selectedLesson) throw new Error("Missing data");
      const { data, error } = await supabase
        .from("planning_notes")
        .insert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          content,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-lesson-notes"] });
      toast.success("Anotação salva!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar anotação");
    },
  });

  // Rate lesson mutation
  const rateLessonMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!user?.id || !selectedLesson) throw new Error("Missing data");
      const { data, error } = await supabase
        .from("planning_ratings")
        .upsert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          rating,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Avaliação registrada!");
    },
  });

  // Mark lesson complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedLesson) throw new Error("Missing data");
      const { data, error } = await supabase
        .from("planning_lesson_progress")
        .upsert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          progress_percent: 100,
          is_completed: true,
          completed_at: new Date().toISOString(),
          xp_earned: selectedLesson.xp_reward || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-lesson-progress"] });
      toast.success("Aula concluída! +" + (selectedLesson?.xp_reward || 0) + " XP");
    },
  });

  if (weeksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Calendar className="h-24 w-24 text-muted-foreground/50 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Nenhum planejamento disponível</h2>
        <p className="text-muted-foreground text-center max-w-md">
          O professor ainda não publicou nenhuma semana de estudo. Volte em breve!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Meu Planejamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Siga seu cronograma de estudos e acompanhe seu progresso
          </p>
        </div>

        {/* Week Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Semanas de Estudo</CardTitle>
          </CardHeader>
          <CardContent>
            <WeekSelector
              weeks={weeks}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              weekProgress={weekProgress}
            />
          </CardContent>
        </Card>

        {/* Main Content */}
        {selectedWeek && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lessons List */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {selectedWeek.title}
                  </CardTitle>
                  <CardDescription>
                    {lessons.length} aulas • {selectedWeek.estimated_hours}h estimadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {lessons.map((lesson) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          progress={lessonProgress[lesson.id]}
                          isActive={selectedLesson?.id === lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Lesson Content */}
            <div className="lg:col-span-2 space-y-6">
              {selectedLesson ? (
                <>
                  {/* Video Player */}
                  <VideoPlayer
                    lesson={selectedLesson}
                    onComplete={() => markCompleteMutation.mutate()}
                  />

                  {/* Lesson Info & Actions */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedLesson.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {selectedLesson.description}
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => markCompleteMutation.mutate()}
                          disabled={
                            lessonProgress[selectedLesson.id]?.is_completed ||
                            markCompleteMutation.isPending
                          }
                          className="shrink-0"
                        >
                          {lessonProgress[selectedLesson.id]?.is_completed ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Concluída
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marcar como Concluída
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Tabs for Notes, Topics, Rating */}
                  <Tabs defaultValue="notes" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="notes">Anotações</TabsTrigger>
                      <TabsTrigger value="topics">Revisão</TabsTrigger>
                      <TabsTrigger value="rating">Avaliar</TabsTrigger>
                    </TabsList>

                    <TabsContent value="notes" className="mt-4">
                      <NotesPanel
                        lessonId={selectedLesson.id}
                        notes={notes}
                        onAddNote={(content) => addNoteMutation.mutate(content)}
                        isAdding={addNoteMutation.isPending}
                      />
                    </TabsContent>

                    <TabsContent value="topics" className="mt-4">
                      <ReviewTopics topics={reviewTopics} />
                    </TabsContent>

                    <TabsContent value="rating" className="mt-4">
                      <LessonRating
                        lessonId={selectedLesson.id}
                        currentRating={null}
                        onRate={(rating) => rateLessonMutation.mutate(rating)}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold">Selecione uma aula</h3>
                    <p className="text-muted-foreground">
                      Clique em uma aula na lista para começar
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
