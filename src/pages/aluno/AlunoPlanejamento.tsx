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
    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
      {/* Glow effect border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-destructive/20 via-transparent to-purple-500/10 pointer-events-none" />
      
      {/* Video label - Futuristic */}
      <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10">
        <span className="text-[10px] uppercase tracking-wider text-white/60">Aula</span>
        <p className="text-sm font-medium text-white">{lesson.description || "Conceitos"}</p>
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Animated glow behind play button */}
          <div className="absolute w-32 h-32 bg-destructive/30 rounded-full blur-3xl animate-pulse" />
          
          {/* Play Button - Futuristic */}
          <motion.button
            onClick={() => setIsPlaying(true)}
            className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-destructive to-destructive/80 text-white flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)] transition-all duration-300 border-2 border-white/20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="h-12 w-12 ml-1" fill="currentColor" />
          </motion.button>
          
          {!lesson.video_url && (
            <p className="relative z-10 mt-4 text-white/60 text-sm">Vídeo em breve</p>
          )}
        </div>
      )}

      {/* Bottom controls bar - Futuristic */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end pb-3 px-4">
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div className="h-full w-0 bg-gradient-to-r from-destructive to-pink-500 rounded-full transition-all" />
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
    <div className="bg-gradient-to-r from-card via-card to-card/80 rounded-2xl border border-border/50 p-5 space-y-4 ring-1 ring-white/5 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{lesson.title}</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
              <Clock className="h-4 w-4 text-primary" />
              <span>Duração: {lesson.duration_minutes || 0}:00</span>
            </div>
            <span className="text-destructive font-medium">•</span>
            <span className="text-destructive font-medium">{lesson.description || "Conceitos"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-border/30">
        {/* Rating Stars */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Avalie esta aula:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-all duration-200 hover:scale-125"
              >
                <Star
                  className={`h-5 w-5 transition-all duration-200 ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      : "text-muted-foreground/30 hover:text-muted-foreground/50"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* TRAMON Button - Futuristic */}
        <Button 
          variant="outline" 
          className="gap-2 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 border-pink-500/40 hover:border-pink-500/60 hover:bg-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.15)] transition-all duration-300"
        >
          <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
          <span className="font-bold text-pink-400">TRAMON</span>
          <span className="text-xs text-muted-foreground ml-1">IA Assistente</span>
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
    <Card className="border-border/40 overflow-hidden bg-gradient-to-b from-card to-card/50 ring-1 ring-white/5 shadow-xl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gradient-to-r hover:from-destructive/5 hover:to-transparent transition-all duration-300 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-destructive/20 to-pink-500/10 border border-destructive/30">
                  <Video className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Semana {week.week_number} - {week.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {completedCount} de {lessons.length} aulas concluídas
                  </CardDescription>
                </div>
              </div>
              <div className={`p-1.5 rounded-full transition-colors ${isOpen ? 'bg-destructive/20' : 'bg-muted/50'}`}>
                {isOpen ? <ChevronUp className="h-4 w-4 text-destructive" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        {/* Progress Bar - Futuristic */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden ring-1 ring-white/10">
              <div 
                className="h-full bg-gradient-to-r from-destructive via-pink-500 to-destructive rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-foreground">{progressPercent}% concluído</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{remainingMinutes} min restantes</span>
          </div>
        </div>

        <CollapsibleContent>
          <ScrollArea className="h-[380px]">
            <div className="px-3 pb-3 space-y-2">
              {lessons.map((lesson, index) => {
                const progress = lessonProgress[lesson.id];
                const isActive = selectedLesson?.id === lesson.id;
                const isCompleted = progress?.is_completed;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-destructive/20 via-pink-500/10 to-transparent border-l-4 border-destructive shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]"
                        : isCompleted
                        ? "bg-gradient-to-r from-emerald-500/10 to-transparent hover:from-emerald-500/15 border border-emerald-500/20"
                        : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent border border-transparent hover:border-border/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Número/Check - Futuristic */}
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold shrink-0 transition-all duration-200 ${
                          isCompleted
                            ? "bg-gradient-to-br from-emerald-500/30 to-green-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            : isActive
                            ? "bg-gradient-to-br from-destructive to-pink-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                            : "bg-muted/80 text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold text-sm line-clamp-1 ${isActive ? "text-destructive" : ""}`}>
                            {lesson.title}
                          </h4>
                          {isActive && (
                            <Badge className="bg-gradient-to-r from-destructive to-pink-600 text-white text-[10px] px-2 py-0 border-0 shadow-lg">
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
                            <span className="text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              Concluída
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Play Button - Futuristic */}
                      <div className="shrink-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                            isActive 
                              ? "bg-gradient-to-br from-destructive to-pink-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" 
                              : "bg-muted/60 hover:bg-destructive/20 hover:text-destructive"
                          }`}
                        >
                          <Play className="h-4 w-4 ml-0.5" />
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
    <Card className="border-border/40 overflow-hidden bg-gradient-to-b from-card to-card/50 ring-1 ring-white/5 shadow-xl">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/30">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-bold">Fórum de Dúvidas</CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 rounded-full px-2.5">{questions.length}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-full">
              <Clock className="h-3 w-3 text-primary" />
              Respostas em até 24h por e-mail
            </span>
            <Badge className="bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/30">
              <Pin className="h-3 w-3 mr-1" />
              {pinnedCount} fixada
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Input de nova dúvida - Futuristic */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 via-muted/20 to-transparent border border-border/30">
          <Avatar className="h-11 w-11 ring-2 ring-primary/30">
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-500/20 text-primary font-bold">
              {userName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Digite sua dúvida sobre esta aula..."
              rows={2}
              className="resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            disabled={!newQuestion.trim()} 
            className="gap-2 bg-gradient-to-r from-destructive to-pink-600 hover:from-destructive/90 hover:to-pink-600/90 shadow-[0_0_20px_rgba(220,38,38,0.3)] border-0"
          >
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
    <Card className="border-border/40 overflow-hidden bg-gradient-to-b from-card to-card/50 ring-1 ring-white/5 shadow-xl">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-bold">Cronograma Inteligente</CardTitle>
                <Badge className="bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-primary/30 shadow-sm">
                  <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                  ENA vIA
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {completedCount} de {activities.length} atividades concluídas
              </CardDescription>
            </div>
          </div>
          
          <div className="text-right bg-gradient-to-br from-destructive/10 to-pink-500/5 p-4 rounded-xl border border-destructive/20">
            <div className="text-3xl font-black bg-gradient-to-r from-destructive to-pink-500 bg-clip-text text-transparent">{progressPercent}%</div>
            <div className="w-24 h-2.5 bg-muted/50 rounded-full overflow-hidden mt-2 ring-1 ring-white/10">
              <div 
                className="h-full bg-gradient-to-r from-destructive to-pink-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground mt-1 block">progresso geral</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Table Header - Futuristic */}
        <div className="grid grid-cols-10 gap-2 text-xs font-semibold text-muted-foreground pb-3 border-b border-border/30 mb-3 uppercase tracking-wider">
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

        {/* Table Rows - Futuristic */}
        <div className="space-y-2">
          {activities.map((activity, index) => {
            const isCompleted = activity.progress === 100;
            return (
              <div 
                key={index} 
                className={`grid grid-cols-10 gap-2 items-center text-sm py-4 px-3 rounded-xl transition-all duration-200 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20' 
                    : 'hover:bg-gradient-to-r hover:from-muted/40 hover:to-transparent border border-transparent hover:border-border/30'
                }`}
              >
                {/* Atividade */}
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-muted/50">
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-semibold">{activity.code}</span>
                </div>

                {/* Categoria */}
                <Badge className={`text-xs justify-center ${activity.categoryColor} text-white border-0 shadow-sm`}>
                  {activity.category}
                </Badge>

                {/* Progress - Futuristic */}
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-14 h-2 rounded-full overflow-hidden ring-1 ring-white/10 ${
                    activity.progress === 100 ? 'bg-emerald-500/30' : activity.progress > 0 ? 'bg-destructive/20' : 'bg-muted/50'
                  }`}>
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        activity.progress === 100 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : activity.progress > 0 ? 'bg-gradient-to-r from-destructive to-pink-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${activity.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8">{activity.progress}%</span>
                </div>

                {/* Icons - Futuristic hover effects */}
                <div className="flex justify-center">
                  <div className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)] transition-all cursor-pointer group">
                    <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)] transition-all cursor-pointer group">
                    <BrainCircuit className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)] transition-all cursor-pointer group">
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)] transition-all cursor-pointer group">
                    <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)] transition-all cursor-pointer group">
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)] transition-all cursor-pointer group">
                    <BrainCircuit className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Checkbox - Futuristic */}
                <div className="flex justify-center">
                  {isCompleted ? (
                    <div className="p-1 rounded-lg bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 cursor-pointer transition-all duration-200" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* TRAMON v8 floating button - Futuristic */}
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            className="gap-3 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 border-pink-500/40 hover:border-pink-500/60 shadow-[0_0_30px_rgba(236,72,153,0.2)] hover:shadow-[0_0_40px_rgba(236,72,153,0.3)] transition-all duration-300 px-6 py-5"
          >
            <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
            <span className="font-black text-lg bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">TRAMON v8</span>
            <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      {/* Top Bar - Futuristic */}
      <div className="border-b border-border/40 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Week Selector - Futuristic */}
            <Select
              value={selectedWeek?.id || ""}
              onValueChange={(value) => {
                const week = weeks.find((w) => w.id === value);
                if (week) setSelectedWeek(week);
              }}
            >
              <SelectTrigger className="w-full max-w-md bg-gradient-to-r from-destructive to-pink-600 text-white border-0 hover:from-destructive/90 hover:to-pink-600/90 shadow-[0_0_25px_rgba(220,38,38,0.4)] rounded-xl h-11 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-white/20">
                    <Video className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">
                    {selectedWeek ? `Semana ${selectedWeek.week_number} - ${selectedWeek.title}` : "Selecione uma semana"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                {weeks.map((week) => {
                  const wp = weekProgress[week.id];
                  const isCompleted = wp?.is_completed;
                  return (
                    <SelectItem key={week.id} value={week.id}>
                      <div className="flex items-center gap-2">
                        {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        <span>Semana {week.week_number} - {week.title}</span>
                        {wp && <Badge variant="outline" className="ml-2 text-xs">{wp.progress_percent}%</Badge>}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Quick Stats - Futuristic */}
            <div className="flex items-center gap-3">
              {/* Tempo sugerido */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/40 ring-1 ring-white/5">
                <Timer className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Tempo sugerido:</span>
                <Badge className="bg-primary/20 text-primary border-primary/30">{Math.ceil(remainingMinutes / 60)}h</Badge>
              </div>

              {/* Próxima Live */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-destructive/10 to-pink-500/10 rounded-xl border border-destructive/30 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                <div className="relative">
                  <Radio className="h-4 w-4 text-destructive" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full animate-ping" />
                </div>
                <span className="text-sm font-medium">Próxima Live</span>
              </div>

              {/* Revisão */}
              {selectedWeek && (
                <Badge className="bg-gradient-to-r from-destructive to-pink-600 text-white border-0 py-2 px-5 shadow-[0_0_20px_rgba(220,38,38,0.3)] text-sm font-semibold">
                  Revisão: {selectedWeek.title.split("-")[1]?.trim() || "Geral"}
                </Badge>
              )}

              {/* Minhas Observações */}
              <Button variant="outline" size="sm" className="gap-2 bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200">
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
