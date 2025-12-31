// ============================================
// 📚 ESTUDAR (VIDEOAULA) - Portal do Aluno
// /alunos/planejamento
// Interface completa baseada no design original
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
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  Video,
  FileText,
  Star,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Timer,
  Bot,
  Eye,
  Pencil,
  Send,
  Pin,
  ExternalLink,
  Sparkles,
  Radio,
  Bookmark,
  Target,
  BrainCircuit,
  HelpCircle,
  Link,
  SquareCheck,
  Square,
  AlertCircle,
} from "lucide-react";

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Checkbox } from "@/components/ui/checkbox";

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

// ============================================
// COMPONENTE: Player de Vídeo com proteção
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
        ? lesson.video_url.split("/").pop()?.split("?")[0]
        : new URLSearchParams(new URL(lesson.video_url).search).get("v");
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
    }
    
    // Panda
    if (lesson.video_url.includes("panda") || lesson.video_url.includes("player.pandavideo")) {
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
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
      {/* Video label */}
      <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white/80">
        Aula<br/>{lesson.description || "Introdução"}
      </div>

      {embedUrl && isPlaying ? (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={lesson.title}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Play Button */}
          <motion.button
            onClick={() => setIsPlaying(true)}
            className="relative z-10 w-20 h-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-2xl hover:bg-destructive/90 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="h-10 w-10 ml-1" fill="currentColor" />
          </motion.button>
          
          {!lesson.video_url && (
            <p className="relative z-10 mt-4 text-muted-foreground text-sm">Vídeo em breve</p>
          )}
        </div>
      )}

      {/* Bottom controls bar (mimicking the design) */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent flex items-end pb-2 px-4">
        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full w-0 bg-destructive rounded-full transition-all" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Info da Aula + Rating + TRAMON
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
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="bg-card rounded-xl border p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{lesson.title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Clock className="h-4 w-4" />
            <span>Duração: {lesson.duration_minutes || 0}:00</span>
            <span className="text-primary">•</span>
            <span className="text-primary">{lesson.description || "Introdução"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t">
        {/* Rating Stars */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Avalie esta aula:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-5 w-5 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* TRAMON Button */}
        <Button 
          variant="outline" 
          className="gap-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:bg-primary/20"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold">TRAMON</span>
          <span className="text-xs text-muted-foreground">IA Assistente</span>
        </Button>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Sidebar de Aulas
// ============================================
function LessonsSidebar({
  week,
  lessons,
  selectedLesson,
  onSelectLesson,
  lessonProgress,
  weekProgress,
}: {
  week: PlanningWeek;
  lessons: PlanningLesson[];
  selectedLesson: PlanningLesson | null;
  onSelectLesson: (lesson: PlanningLesson) => void;
  lessonProgress: Record<string, LessonProgress>;
  weekProgress: WeekProgress | undefined;
}) {
  const [isOpen, setIsOpen] = useState(true);
  
  const completedCount = lessons.filter(l => lessonProgress[l.id]?.is_completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const remainingMinutes = lessons
    .filter(l => !lessonProgress[l.id]?.is_completed)
    .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

  return (
    <Card className="border-border/50 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-base">Semana {week.week_number} - {week.title}</CardTitle>
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
          <ScrollArea className="h-[350px]">
            <div className="px-2 pb-2 space-y-1">
              {lessons.map((lesson, index) => {
                const progress = lessonProgress[lesson.id];
                const isActive = selectedLesson?.id === lesson.id;
                const isCompleted = progress?.is_completed;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-destructive/20 border-l-4 border-destructive"
                        : isCompleted
                        ? "bg-green-500/5 hover:bg-green-500/10"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Número/Check */}
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                          isCompleted
                            ? "bg-destructive/20 text-destructive"
                            : isActive
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={`font-medium text-sm line-clamp-1 ${isActive ? "text-destructive" : ""}`}>
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
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            isActive 
                              ? "bg-destructive text-destructive-foreground" 
                              : "bg-muted hover:bg-muted-foreground/20"
                          }`}
                        >
                          <Play className="h-3 w-3 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </Card>
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

  const pinnedCount = questions.filter(q => q.isPinned).length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Fórum de Dúvidas</CardTitle>
            <Badge variant="secondary" className="rounded-full">{questions.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Respostas em até 24h por e-mail
            </span>
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              <Pin className="h-3 w-3 mr-1" />
              {pinnedCount} fixada
            </Badge>
          </div>
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
              className="resize-none bg-muted/30 border-muted"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button disabled={!newQuestion.trim()} className="gap-2 bg-destructive hover:bg-destructive/90">
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
                  <AvatarFallback className="bg-muted">{question.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">{question.userName}</span>
                    {question.isPinned && (
                      <Badge className="bg-green-500/20 text-green-500 text-xs border-green-500/30">
                        <Pin className="h-3 w-3 mr-1" />
                        Fixada
                      </Badge>
                    )}
                    {question.isAnswered && (
                      <Badge className="bg-blue-500/20 text-blue-500 text-xs border-blue-500/30">
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
                            <Badge className="bg-green-500/20 text-green-500 text-xs border-green-500/30">
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

  // Mock data para atividades do cronograma
  const activities = [
    { code: "PED - D1", category: "GASTRO", categoryColor: "bg-red-500", progress: 0 },
    { code: "CIR - D2", category: "CARDIOVASCULAR", categoryColor: "bg-red-600", progress: 50 },
    { code: "CLI - D3", category: "NEURO", categoryColor: "bg-gray-500", progress: 100 },
    { code: "GO - D4", category: "OBSTETRÍCIA", categoryColor: "bg-blue-500", progress: 25 },
  ];

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
            <div className="text-2xl font-bold text-destructive">{progressPercent}%</div>
            <Progress value={progressPercent} className="w-20 h-2 mt-1" />
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
              <div key={index} className="grid grid-cols-10 gap-2 items-center text-sm py-3 hover:bg-muted/30 rounded-lg transition-colors">
                {/* Atividade */}
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{activity.code}</span>
                </div>

                {/* Categoria */}
                <Badge variant="outline" className={`text-xs justify-center ${activity.categoryColor} text-white border-0`}>
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
              </div>
            );
          })}
        </div>

        {/* TRAMON v8 floating button */}
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
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

  // Calculate remaining time
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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Week Selector */}
            <Select
              value={selectedWeek?.id || ""}
              onValueChange={(value) => {
                const week = weeks.find((w) => w.id === value);
                if (week) setSelectedWeek(week);
              }}
            >
              <SelectTrigger className="w-full max-w-md bg-destructive/90 text-destructive-foreground border-destructive hover:bg-destructive">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedWeek ? `Semana ${selectedWeek.week_number} - ${selectedWeek.title}` : "Selecione uma semana"}
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

            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              {/* Tempo sugerido */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tempo sugerido:</span>
                <Badge variant="secondary">{Math.ceil(remainingMinutes / 60)}h</Badge>
              </div>

              {/* Próxima Live */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-lg border border-destructive/30">
                <Radio className="h-4 w-4 text-destructive" />
                <span className="text-sm">Próxima Live</span>
              </div>

              {/* Revisão */}
              {selectedWeek && (
                <Badge className="bg-destructive text-destructive-foreground border-0 py-1.5 px-4">
                  Revisão: {selectedWeek.title.split("-")[1]?.trim() || "Geral"}
                </Badge>
              )}

              {/* Minhas Observações */}
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" />
                Minhas Observações
              </Button>
            </div>
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
            {selectedWeek && (
              <div className="sticky top-24">
                <LessonsSidebar
                  week={selectedWeek}
                  lessons={lessons}
                  selectedLesson={selectedLesson}
                  onSelectLesson={setSelectedLesson}
                  lessonProgress={lessonProgress}
                  weekProgress={weekProgress[selectedWeek.id]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
