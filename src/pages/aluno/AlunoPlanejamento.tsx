// ============================================
// 📚 PLANEJAMENTO DO ALUNO - ESTUDAR (VIDEOAULA)
// /alunos/planejamento
// Interface completa: video, aulas, fórum, progresso
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
  ChevronDown,
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
  Bot,
  Radio,
  Eye,
  Pencil,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

// ============================================
// COMPONENTE: Seletor de Semana (Dropdown)
// ============================================
function WeekDropdownSelector({
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
  const selected = selectedWeek;
  const progress = selected ? weekProgress[selected.id] : null;

  return (
    <Select
      value={selected?.id || ""}
      onValueChange={(value) => {
        const week = weeks.find((w) => w.id === value);
        if (week) onSelectWeek(week);
      }}
    >
      <SelectTrigger className="w-full max-w-md bg-card border-primary/30 hover:border-primary">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium">
            {selected ? `Semana ${selected.week_number} - ${selected.title}` : "Selecione uma semana"}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {weeks.map((week) => {
          const wp = weekProgress[week.id];
          const isCompleted = wp?.is_completed;
          return (
            <SelectItem key={week.id} value={week.id}>
              <div className="flex items-center gap-2">
                {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                <span>Semana {week.week_number} - {week.title}</span>
                {wp && <Badge variant="outline" className="ml-2 text-xs">{wp.progress_percent}%</Badge>}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ============================================
// COMPONENTE: Header com Info da Semana
// ============================================
function WeekHeader({
  week,
  weekProgress,
  lessons,
  lessonProgress,
}: {
  week: PlanningWeek;
  weekProgress: WeekProgress | undefined;
  lessons: PlanningLesson[];
  lessonProgress: Record<string, LessonProgress>;
}) {
  const completedLessons = lessons.filter((l) => lessonProgress[l.id]?.is_completed).length;
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const remainingMinutes = lessons
    .filter((l) => !lessonProgress[l.id]?.is_completed)
    .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Tempo sugerido: <strong className="text-foreground">{Math.round(totalMinutes / 60)}h</strong>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {week.difficulty && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Revisão: {week.title.split("-")[1]?.trim() || week.title}
          </Badge>
        )}
      </div>

      <Button variant="outline" size="sm" className="gap-2">
        <Pencil className="h-4 w-4" />
        Minhas Observações
      </Button>
    </div>
  );
}

// ============================================
// COMPONENTE: Card de Aula no Sidebar
// ============================================
function LessonSidebarCard({
  lesson,
  index,
  progress,
  isActive,
  onClick,
}: {
  lesson: PlanningLesson;
  index: number;
  progress: LessonProgress | undefined;
  isActive: boolean;
  onClick: () => void;
}) {
  const isCompleted = progress?.is_completed;

  return (
    <motion.button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-all ${
        isActive
          ? "bg-primary/20 border-l-4 border-primary"
          : isCompleted
          ? "bg-green-500/10 hover:bg-green-500/20"
          : "hover:bg-muted/50"
      }`}
      whileHover={{ x: 2 }}
    >
      <div className="flex items-start gap-3">
        {/* Número/Status */}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
            isCompleted
              ? "bg-green-500/20 text-green-500"
              : isActive
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm line-clamp-1">{lesson.title}</h4>
            {isActive && (
              <Badge className="bg-primary text-primary-foreground text-xs">Atual</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lesson.duration_minutes}:00
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
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isActive ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            <Play className="h-3 w-3 ml-0.5" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ============================================
// COMPONENTE: Player de Vídeo
// ============================================
function VideoPlayer({
  lesson,
  onComplete,
}: {
  lesson: PlanningLesson;
  onComplete: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate embed URL based on provider
  const getEmbedUrl = () => {
    if (!lesson.video_url) return null;
    
    // YouTube
    if (lesson.video_url.includes("youtube") || lesson.video_url.includes("youtu.be")) {
      const videoId = lesson.video_url.includes("youtu.be")
        ? lesson.video_url.split("/").pop()
        : new URLSearchParams(new URL(lesson.video_url).search).get("v");
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
    
    // Panda
    if (lesson.video_url.includes("panda")) {
      return lesson.video_url;
    }
    
    // Vimeo
    if (lesson.video_url.includes("vimeo")) {
      const videoId = lesson.video_url.split("/").pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return lesson.video_url;
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      {embedUrl && isPlaying ? (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={lesson.title}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Thumbnail or placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/50 to-background" />
          
          {/* Play Button */}
          <motion.button
            onClick={() => setIsPlaying(true)}
            className="relative z-10 w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="h-10 w-10 ml-1" fill="currentColor" />
          </motion.button>
          
          {!lesson.video_url && (
            <p className="relative z-10 mt-4 text-muted-foreground">Vídeo em breve</p>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-primary w-0 transition-all" />
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Info da Aula Atual
// ============================================
function LessonInfo({
  lesson,
  onComplete,
  isCompleted,
  isPending,
}: {
  lesson: PlanningLesson;
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const [rating, setRating] = useState(0);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-xl border">
      <div>
        <h2 className="text-lg font-semibold">{lesson.title}</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span>Duração: {lesson.duration_minutes}:00</span>
          {lesson.description && <span>•</span>}
          {lesson.description && <span className="line-clamp-1">{lesson.description}</span>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-2">Avalie esta aula:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`h-5 w-5 ${
                  star <= rating
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-muted-foreground/50"
                }`}
              />
            </button>
          ))}
        </div>

        {/* TRAMON Button */}
        <Button variant="outline" className="gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20">
          <Bot className="h-4 w-4" />
          <span className="font-semibold">TRAMON</span>
          <span className="text-xs text-muted-foreground">IA Assistente</span>
        </Button>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Fórum de Dúvidas
// ============================================
function ForumSection({
  lessonId,
  userName,
}: {
  lessonId: string;
  userName: string;
}) {
  const [newQuestion, setNewQuestion] = useState("");
  const [questions] = useState([
    {
      id: "1",
      userName: "João Silva",
      content: "Professor, não entendi a parte sobre distribuição eletrônica. Pode explicar novamente?",
      createdAt: new Date(),
      isPinned: true,
      isAnswered: true,
      replies: [
        {
          id: "r1",
          userName: "Prof. Moisés Medeiros",
          content: "Claro, João! A distribuição eletrônica segue a regra de Aufbau. Vou explicar...",
          isOfficial: true,
        },
      ],
    },
    {
      id: "2",
      userName: "Maria Santos",
      content: "Qual a diferença entre número atômico e número de massa?",
      createdAt: new Date(),
      isPinned: false,
      isAnswered: false,
      replies: [],
    },
  ]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Fórum de Dúvidas</CardTitle>
            <Badge variant="secondary">{questions.length}</Badge>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Respostas em até 24h por e-mail
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input de nova dúvida */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/20 text-primary">
              {userName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Digite sua dúvida sobre esta aula..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-green-500 border-green-500/30">
            {questions.filter((q) => q.isPinned).length} fixada
          </Badge>
          <Button disabled={!newQuestion.trim()} className="gap-2">
            <Send className="h-4 w-4" />
            Enviar Dúvida
          </Button>
        </div>

        <Separator />

        {/* Lista de dúvidas */}
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="p-4 rounded-lg bg-muted/30 border space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{question.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">{question.userName}</span>
                    {question.isPinned && (
                      <Badge className="bg-green-500/20 text-green-500 text-xs">Fixada</Badge>
                    )}
                    {question.isAnswered && (
                      <Badge className="bg-blue-500/20 text-blue-500 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Respondido
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(question.createdAt, "dd/MM/yyyy")}
                    </span>
                  </div>
                  <p className="text-sm">{question.content}</p>
                  <button className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline">
                    ← Responder
                  </button>
                </div>
              </div>

              {/* Respostas */}
              {question.replies.map((reply) => (
                <div key={reply.id} className="ml-12 pl-4 border-l-2 border-primary/30">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">P</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{reply.userName}</span>
                        {reply.isOfficial && (
                          <>
                            <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                              Professor
                            </Badge>
                            <Badge className="bg-green-500/20 text-green-500 text-xs">
                              Resposta Oficial
                            </Badge>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTE: Cronograma Inteligente
// ============================================
function SmartSchedule({
  lessons,
  lessonProgress,
}: {
  lessons: PlanningLesson[];
  lessonProgress: Record<string, LessonProgress>;
}) {
  const completedCount = lessons.filter((l) => lessonProgress[l.id]?.is_completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cronograma Inteligente</CardTitle>
            <Badge className="bg-primary/20 text-primary">ENA IA</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
            <Progress value={progressPercent} className="w-24 h-2" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {completedCount} de {lessons.length} atividades concluídas
        </p>
      </CardHeader>
      <CardContent>
        {/* Table Header */}
        <div className="grid grid-cols-9 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
          <span>Atividade</span>
          <span>Categoria</span>
          <span>%</span>
          <span className="text-center">Resumos</span>
          <span className="text-center">Flashcards</span>
          <span className="text-center">Simulado</span>
          <span className="text-center">Questões</span>
          <span className="text-center">Link</span>
          <span className="text-center">Resolvido?</span>
        </div>

        {/* Table Rows */}
        <ScrollArea className="h-[150px]">
          <div className="space-y-1 pt-2">
            {lessons.slice(0, 5).map((lesson, index) => {
              const progress = lessonProgress[lesson.id];
              return (
                <div key={lesson.id} className="grid grid-cols-9 gap-2 items-center text-sm py-2 hover:bg-muted/30 rounded">
                  <span className="font-medium truncate">PED - D{index + 1}</span>
                  <Badge variant="outline" className="text-xs justify-center">GASTRO</Badge>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${progress?.progress_percent || 0}%` }}
                      />
                    </div>
                    <span className="text-xs">{progress?.progress_percent || 0}%</span>
                  </div>
                  <div className="flex justify-center">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex justify-center">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex justify-center">
                    <Eye className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
                  </div>
                  <div className="flex justify-center">
                    {progress?.is_completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function AlunoPlanejamento() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState<PlanningWeek | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<PlanningLesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Auto-select first incomplete lesson when week changes
  useEffect(() => {
    if (lessons.length > 0) {
      const lessonProgressMap = lessonProgressList.reduce((acc, lp) => {
        acc[lp.lesson_id] = lp;
        return acc;
      }, {} as Record<string, LessonProgress>);

      const firstIncomplete = lessons.find((l) => !lessonProgressMap[l.id]?.is_completed);
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
      toast.success(`Aula concluída! +${selectedLesson?.xp_reward || 0} XP`);
    },
  });

  // Calculate progress
  const completedLessons = lessons.filter((l) => lessonProgress[l.id]?.is_completed).length;
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const remainingMinutes = lessons
    .filter((l) => !lessonProgress[l.id]?.is_completed)
    .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

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
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Week Selector */}
            <WeekDropdownSelector
              weeks={weeks}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              weekProgress={weekProgress}
            />

            {selectedWeek && (
              <WeekHeader
                week={selectedWeek}
                weekProgress={weekProgress[selectedWeek.id]}
                lessons={lessons}
                lessonProgress={lessonProgress}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video + Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {selectedLesson ? (
              <>
                {/* Video Player */}
                <VideoPlayer
                  lesson={selectedLesson}
                  onComplete={() => markCompleteMutation.mutate()}
                />

                {/* Lesson Info */}
                <LessonInfo
                  lesson={selectedLesson}
                  onComplete={() => markCompleteMutation.mutate()}
                  isCompleted={!!lessonProgress[selectedLesson.id]?.is_completed}
                  isPending={markCompleteMutation.isPending}
                />

                {/* Forum */}
                <ForumSection
                  lessonId={selectedLesson.id}
                  userName={user?.user_metadata?.full_name || user?.email || "Aluno"}
                />

                {/* Smart Schedule */}
                <SmartSchedule lessons={lessons} lessonProgress={lessonProgress} />
              </>
            ) : (
              <Card className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Video className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">Selecione uma aula</h3>
                  <p className="text-muted-foreground">
                    Escolha uma aula na lista ao lado para começar
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Lessons Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      {selectedWeek?.title || "Aulas"}
                    </CardTitle>
                    <CardDescription>
                      {completedLessons} de {lessons.length} aulas concluídas
                    </CardDescription>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>{Math.round((completedLessons / Math.max(lessons.length, 1)) * 100)}% concluído</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {remainingMinutes} min restantes
                    </span>
                  </div>
                  <Progress value={(completedLessons / Math.max(lessons.length, 1)) * 100} className="h-2" />
                </div>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[500px] pr-2">
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <LessonSidebarCard
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
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
        </div>
      </div>
    </div>
  );
}
