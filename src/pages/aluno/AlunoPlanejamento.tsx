// ============================================
// 📚 HUB CENTRAL DO ALUNO - Portal do Aluno
// /alunos/planejamento
// Interface completa + Sistema de Modais (9 áreas)
// ============================================

import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Hub Quick Access System
import { HubQuickAccessBar, HubModal, HUB_AREAS, type HubAreaKey } from "@/components/aluno/HubQuickAccessBar";

// Seletor de Cronogramas
import { CronogramaSelector, type CronogramaType } from "@/components/aluno/CronogramaSelector";

// Lazy load modal contents (9 módulos)
const CronogramaModalContent = lazy(() => import("@/components/aluno/modals/CronogramaModalContent"));
const ForumModalContent = lazy(() => import("@/components/aluno/modals/ForumModalContent"));
const TutoriaModalContent = lazy(() => import("@/components/aluno/modals/TutoriaModalContent"));
const VideoaulasModalContent = lazy(() => import("@/components/aluno/modals/VideoaulasModalContent"));
const QuestoesModalContent = lazy(() => import("@/components/aluno/modals/QuestoesModalContent"));
const FlashcardsModalContent = lazy(() => import("@/components/aluno/modals/FlashcardsModalContent"));
const SimuladosModalContent = lazy(() => import("@/components/aluno/modals/SimuladosModalContent"));
const MapasMentaisModalContent = lazy(() => import("@/components/aluno/modals/MapasMentaisModalContent"));
const LivrosWebModalContent = lazy(() => import("@/components/aluno/modals/LivrosWebModalContent"));

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
// COMPONENTE: Player de Vídeo com OVERLAY OBRIGATÓRIO
// ============================================
import { OmegaFortressPlayer } from "@/components/video/OmegaFortressPlayer";

// ✅ PADRÃO SOBERANO v2400 — Importar função centralizada
import { getVideoTypeWithIntegrityGuard, detectVideoProviderFromUrl } from "@/lib/video/detectVideoProvider";

/**
 * Detecta o tipo de vídeo pela URL (wrapper para compatibilidade)
 */
function getVideoType(url: string): 'panda' | 'youtube' | 'vimeo' {
  return detectVideoProviderFromUrl(url) as 'panda' | 'youtube' | 'vimeo';
}

/**
 * Extrai Video ID de URLs
 */
function getVideoId(url: string): string {
  // YouTube
  if (url.includes('youtube') || url.includes('youtu.be')) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&]+)/);
    if (match) return match[1];
  }
  
  // Panda e Vimeo: retornar URL inteira
  return url;
}

function VideoPlayer({
  lesson,
  onComplete,
}: {
  lesson: PlanningLesson;
  onComplete: () => void;
}) {
  if (!lesson.video_url) {
    return (
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
        <p className="text-muted-foreground">Vídeo em breve</p>
      </div>
    );
  }

  const videoType = getVideoType(lesson.video_url);
  const videoId = getVideoId(lesson.video_url);

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden group">
      {/* 🌟 HOLOGRAPHIC BORDER FRAME */}
      <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-primary via-holo-purple/50 to-holo-cyan/50 opacity-60 blur-sm group-hover:opacity-80 transition-opacity duration-500 z-0" />
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/80 via-holo-purple/30 to-holo-cyan/40 z-0" />
      
      {/* Inner container with OmegaFortressPlayer */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black z-10">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/60 rounded-tl-2xl z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-holo-cyan/60 rounded-tr-2xl z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-holo-purple/60 rounded-bl-2xl z-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/60 rounded-br-2xl z-20 pointer-events-none" />
        
        {/* Video label overlay */}
        <div className="absolute top-4 left-4 z-30 bg-gradient-to-r from-black/90 via-black/80 to-transparent backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-medium">AULA</span>
          </div>
          <p className="text-sm font-bold text-white mt-0.5 drop-shadow-lg">{lesson.description || "Conceitos"}</p>
        </div>

        {/* XP Badge */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-gradient-to-r from-warning/20 to-warning/10 backdrop-blur-xl px-3 py-1.5 rounded-full border border-warning/30 shadow-[0_0_15px_hsl(var(--warning)/0.3)] pointer-events-none">
          <Star className="h-3.5 w-3.5 text-warning fill-warning" />
          <span className="text-xs font-bold text-warning">+{lesson.xp_reward || 50} XP</span>
        </div>

        {/* 🔒 OMEGA FORTRESS PLAYER com Overlay */}
        <OmegaFortressPlayer
          videoId={videoId}
          type={videoType}
          title={lesson.title}
          showSecurityBadge={false}
          showWatermark
          autoplay={false}
          onComplete={onComplete}
        />
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
    <div className="relative rounded-2xl overflow-hidden group">
      {/* Holographic border */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/50 via-holo-cyan/30 to-holo-purple/50 opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
      
      <div className="relative bg-gradient-to-br from-card via-card/95 to-card/90 rounded-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-holo-purple/10 border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">{lesson.title}</h2>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30 shadow-[0_0_10px_hsl(var(--primary)/0.15)]">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {lesson.duration_minutes || 0} min
              </Badge>
              <Badge className="bg-gradient-to-r from-holo-cyan/20 to-holo-cyan/10 text-holo-cyan border-holo-cyan/30">
                {lesson.description || "Conceitos"}
              </Badge>
              {lesson.is_required && (
                <Badge className="bg-gradient-to-r from-warning/20 to-warning/10 text-warning border-warning/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Obrigatória
                </Badge>
              )}
            </div>
          </div>
          
          {/* Complete button */}
          <Button
            onClick={onComplete}
            disabled={isCompleted || isPending}
            className={`gap-2 shadow-lg transition-all duration-300 ${
              isCompleted 
                ? 'bg-gradient-to-r from-success/80 to-success/60 text-white border-0 shadow-[0_0_20px_hsl(var(--success)/0.3)]'
                : 'bg-gradient-to-r from-primary to-holo-purple text-white border-0 shadow-[0_0_25px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.5)]'
            }`}
          >
            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isCompleted ? 'Concluída' : 'Marcar Concluída'}
          </Button>
        </div>

        {/* Divider with glow */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Rating Stars - Enhanced */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium">Avalie:</span>
            <div className="flex gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/50">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-all duration-300 hover:scale-125 active:scale-95"
                >
                  <Star
                    className={`h-5 w-5 transition-all duration-300 ${
                      star <= (hoverRating || rating)
                        ? "fill-warning text-warning drop-shadow-[0_0_12px_hsl(var(--warning))]"
                        : "text-muted-foreground/30 hover:text-muted-foreground/50"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && <span className="text-xs text-warning font-medium">{rating}/5</span>}
          </div>

          {/* TRAMON Button - HOLOGRAPHIC */}
          <Button 
            variant="outline" 
            className="relative gap-2 bg-gradient-to-r from-holo-pink/10 via-holo-purple/10 to-holo-pink/10 border-holo-pink/50 hover:border-holo-pink/80 shadow-[0_0_30px_hsl(var(--holo-pink)/0.2)] hover:shadow-[0_0_50px_hsl(var(--holo-pink)/0.3)] transition-all duration-500 overflow-hidden group/tramon"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-holo-pink/0 via-holo-pink/20 to-holo-pink/0 translate-x-[-100%] group-hover/tramon:translate-x-[100%] transition-transform duration-700" />
            <Bot className="h-5 w-5 text-holo-pink animate-pulse relative z-10" />
            <span className="font-black text-holo-pink relative z-10">TRAMON</span>
            <Badge className="bg-holo-purple/20 text-holo-purple border-holo-purple/30 text-[10px] relative z-10">IA</Badge>
          </Button>
        </div>
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
    <div className="relative rounded-2xl overflow-hidden group/sidebar">
      {/* Holographic outer glow */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-primary/60 via-holo-purple/40 to-holo-cyan/50 opacity-50 group-hover/sidebar:opacity-70 transition-opacity duration-500" />
      
      <Card className="relative border-0 overflow-hidden bg-gradient-to-b from-card via-card/98 to-card/95">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-holo-purple to-holo-cyan" />
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gradient-to-r hover:from-primary/10 hover:via-holo-purple/5 hover:to-transparent transition-all duration-500 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/30 via-primary/20 to-holo-purple/10 border border-primary/40 shadow-[0_0_25px_hsl(var(--primary)/0.3)]">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-success to-success/80 border-2 border-card flex items-center justify-center shadow-[0_0_10px_hsl(var(--success)/0.5)]">
                      <span className="text-[8px] text-white font-bold">{completedCount}</span>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                      Semana {week.week_number}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-primary/80">
                      {week.title}
                    </CardDescription>
                  </div>
                </div>
                <div className={`p-2 rounded-xl transition-all duration-300 ${isOpen ? 'bg-primary/20 rotate-180' : 'bg-muted/50'}`}>
                  <ChevronDown className={`h-5 w-5 ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          {/* Progress Bar - HOLOGRAPHIC */}
          <div className="px-5 pb-5">
            <div className="p-4 rounded-xl bg-gradient-to-r from-muted/40 via-muted/20 to-transparent border border-border/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progresso</span>
                <span className="text-lg font-black bg-gradient-to-r from-primary to-holo-purple bg-clip-text text-transparent">{progressPercent}%</span>
              </div>
              <div className="h-3 bg-muted/50 rounded-full overflow-hidden ring-1 ring-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-holo-purple to-holo-cyan rounded-full transition-all duration-700 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  {completedCount}/{lessons.length} aulas
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {remainingMinutes} min restantes
                </span>
              </div>
            </div>
          </div>

          <CollapsibleContent>
            <ScrollArea className="h-[420px]">
              <div className="px-4 pb-4 space-y-2">
                {lessons.map((lesson, index) => {
                  const progress = lessonProgress[lesson.id];
                  const isActive = selectedLesson?.id === lesson.id;
                  const isCompleted = progress?.is_completed;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onSelectLesson(lesson)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-300 relative overflow-hidden group/lesson ${
                        isActive
                          ? "bg-gradient-to-r from-primary/20 via-holo-purple/10 to-transparent border-l-4 border-primary shadow-[inset_0_0_30px_hsl(var(--primary)/0.1)]"
                          : isCompleted
                          ? "bg-gradient-to-r from-success/10 to-transparent hover:from-success/15 border border-success/30"
                          : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent border border-transparent hover:border-border/50"
                      }`}
                    >
                      {/* Active indicator glow */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-pulse" style={{ animationDuration: '2s' }} />
                      )}
                      
                      <div className="flex items-start gap-4 relative z-10">
                        {/* Number/Check - HOLOGRAPHIC */}
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black shrink-0 transition-all duration-300 ${
                            isCompleted
                              ? "bg-gradient-to-br from-success to-success/80 text-white shadow-[0_0_20px_hsl(var(--success)/0.5)]"
                              : isActive
                              ? "bg-gradient-to-br from-primary via-primary to-holo-purple text-white shadow-[0_0_25px_hsl(var(--primary)/0.5)]"
                              : "bg-muted/80 text-muted-foreground group-hover/lesson:bg-primary/20 group-hover/lesson:text-primary"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className={`font-semibold text-sm line-clamp-1 transition-colors ${isActive ? "text-primary" : ""}`}>
                              {lesson.title}
                            </h4>
                            {isActive && (
                              <Badge className="bg-gradient-to-r from-primary to-holo-purple text-white text-[10px] px-2 py-0 border-0 shadow-lg animate-pulse">
                                ATUAL
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.duration_minutes || 0} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-warning" />
                              +{lesson.xp_reward || 0} XP
                            </span>
                            {isCompleted && (
                              <span className="text-success flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="h-3 w-3" />
                                Concluída
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Play Button */}
                        <div className="shrink-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isActive 
                                ? "bg-gradient-to-br from-primary to-holo-purple text-white shadow-[0_0_20px_hsl(var(--primary)/0.5)]" 
                                : "bg-muted/60 hover:bg-primary/20 hover:text-primary group-hover/lesson:shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                            }`}
                          >
                            <Play className="h-5 w-5 ml-0.5" />
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

  const pinnedCount = questions.filter(q => q.isPinned).length;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-holo-cyan/50 via-primary/40 to-holo-purple/50 opacity-50" />
      <Card className="relative border-0 overflow-hidden bg-gradient-to-b from-card via-card/98 to-card/95">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-holo-cyan via-primary to-holo-purple" />
        <CardHeader className="pb-4 bg-gradient-to-r from-holo-cyan/5 via-primary/5 to-transparent">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-holo-purple/10 border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-bold">Fórum de Dúvidas</CardTitle>
              <Badge className="bg-primary/20 text-primary border-primary/30 rounded-full px-2.5">{questions.length}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-full border border-border/30">
                <Clock className="h-3 w-3 text-primary" />
                Respostas em até 24h
              </span>
              <Badge className="bg-gradient-to-r from-success/20 to-success/10 text-success border-success/30 shadow-[0_0_10px_hsl(var(--success)/0.2)]">
                <Pin className="h-3 w-3 mr-1" />
                {pinnedCount} fixada
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Input de nova dúvida */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/40 via-muted/20 to-transparent border border-border/40">
            <Avatar className="h-11 w-11 ring-2 ring-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-holo-purple/20 text-primary font-bold">
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
              className="gap-2 bg-gradient-to-r from-primary to-holo-purple hover:from-primary/90 hover:to-holo-purple/90 shadow-[0_0_25px_hsl(var(--primary)/0.4)] border-0"
            >
              <Send className="h-4 w-4" />
              Enviar Dúvida
            </Button>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Lista de dúvidas */}
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="p-4 rounded-xl bg-gradient-to-r from-muted/40 to-transparent border border-border/40 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted">{question.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium">{question.userName}</span>
                      {question.isPinned && (
                        <Badge className="bg-success/20 text-success text-xs border-success/30">
                          <Pin className="h-3 w-3 mr-1" />
                          Fixada
                        </Badge>
                      )}
                      {question.isAnswered && (
                        <Badge className="bg-info/20 text-info text-xs border-info/30">
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
                              <Badge className="bg-success/20 text-success text-xs border-success/30">
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
    </div>
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
    <div className="relative rounded-2xl overflow-hidden group">
      {/* Animated gradient border */}
      <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-holo-purple to-holo-cyan opacity-60 blur-sm group-hover:opacity-80 transition-opacity duration-500" />
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/70 via-holo-purple/50 to-holo-cyan/60" />
      
      <Card className="relative border-0 overflow-hidden bg-gradient-to-b from-card via-card/98 to-card/95">
        {/* Top scanline effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-holo-purple to-holo-cyan" />
        <div className="absolute top-1 left-0 right-0 h-12 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-holo-purple/5 to-transparent relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-holo-purple/10 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-bold">Cronograma Inteligente</CardTitle>
                  <Badge className="bg-gradient-to-r from-primary/20 to-holo-purple/20 text-primary border-primary/30 shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
                    <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                    ENA vIA
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  {completedCount} de {activities.length} atividades concluídas
                </CardDescription>
              </div>
            </div>
            
            <div className="text-right bg-gradient-to-br from-primary/15 to-holo-purple/10 p-4 rounded-xl border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.15)]">
              <div className="text-3xl font-black bg-gradient-to-r from-primary to-holo-purple bg-clip-text text-transparent">{progressPercent}%</div>
              <div className="w-24 h-2.5 bg-muted/50 rounded-full overflow-hidden mt-2 ring-1 ring-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-holo-purple to-holo-cyan rounded-full transition-all duration-500 shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">progresso geral</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Table Header */}
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

          {/* Table Rows */}
          <div className="space-y-2">
            {activities.map((activity, index) => {
              const isCompleted = activity.progress === 100;
              return (
                <div 
                  key={index} 
                  className={`grid grid-cols-10 gap-2 items-center text-sm py-4 px-3 rounded-xl transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-success/15 to-transparent border border-success/30 shadow-[0_0_15px_hsl(var(--success)/0.1)]' 
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

                  {/* Progress */}
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-14 h-2 rounded-full overflow-hidden ring-1 ring-white/10 ${
                      activity.progress === 100 ? 'bg-success/30' : activity.progress > 0 ? 'bg-primary/20' : 'bg-muted/50'
                    }`}>
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          activity.progress === 100 ? 'bg-gradient-to-r from-success to-success/80' : activity.progress > 0 ? 'bg-gradient-to-r from-primary to-holo-purple' : 'bg-info'
                        }`}
                        style={{ width: `${activity.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8">{activity.progress}%</span>
                  </div>

                  {/* Icons with hover effects */}
                  <div className="flex justify-center">
                    <div className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] transition-all cursor-pointer group/icon">
                      <BookOpen className="h-4 w-4 text-muted-foreground group-hover/icon:text-primary transition-colors" />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-2 rounded-lg hover:bg-holo-purple/10 hover:shadow-[0_0_12px_hsl(var(--holo-purple)/0.3)] transition-all cursor-pointer group/icon">
                      <BrainCircuit className="h-4 w-4 text-muted-foreground group-hover/icon:text-holo-purple transition-colors" />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] transition-all cursor-pointer group/icon">
                      <FileText className="h-4 w-4 text-muted-foreground group-hover/icon:text-primary transition-colors" />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-2 rounded-lg hover:bg-warning/10 hover:shadow-[0_0_12px_hsl(var(--warning)/0.3)] transition-all cursor-pointer group/icon">
                      <HelpCircle className="h-4 w-4 text-muted-foreground group-hover/icon:text-warning transition-colors" />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-2 rounded-lg hover:bg-holo-cyan/10 hover:shadow-[0_0_12px_hsl(var(--holo-cyan)/0.3)] transition-all cursor-pointer group/icon">
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover/icon:text-holo-cyan transition-colors" />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-2 rounded-lg hover:bg-holo-pink/10 hover:shadow-[0_0_12px_hsl(var(--holo-pink)/0.3)] transition-all cursor-pointer group/icon">
                      <BrainCircuit className="h-4 w-4 text-muted-foreground group-hover/icon:text-holo-pink transition-colors" />
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div className="flex justify-center">
                    {isCompleted ? (
                      <div className="p-1 rounded-lg bg-success/20 shadow-[0_0_15px_hsl(var(--success)/0.4)]">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 cursor-pointer transition-all duration-200" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRAMON v8 button - HOLOGRAPHIC */}
          <div className="flex justify-center mt-6">
            <Button 
              variant="outline" 
              className="relative gap-3 bg-gradient-to-r from-holo-pink/10 via-holo-purple/10 to-holo-pink/10 border-holo-pink/50 hover:border-holo-pink/80 shadow-[0_0_40px_hsl(var(--holo-pink)/0.25)] hover:shadow-[0_0_60px_hsl(var(--holo-pink)/0.4)] transition-all duration-500 px-8 py-6 overflow-hidden group/btn"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-holo-pink/0 via-holo-pink/20 to-holo-pink/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
              <Sparkles className="h-5 w-5 text-holo-pink animate-pulse relative z-10" />
              <span className="font-black text-lg bg-gradient-to-r from-holo-pink via-holo-purple to-holo-pink bg-clip-text text-transparent relative z-10">TRAMON v8</span>
              <Sparkles className="h-5 w-5 text-holo-pink animate-pulse relative z-10" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
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
  
  // 📅 CRONOGRAMA SELECTOR STATE
  const [selectedCronograma, setSelectedCronograma] = useState<CronogramaType>(null);
  
  // 🚀 HUB MODAL STATE
  const [activeModal, setActiveModal] = useState<HubAreaKey | null>(null);
  const activeModalArea = activeModal ? HUB_AREAS.find(a => a.key === activeModal) : null;
  
  // Modal content renderer
  // Modal loading fallback
  const ModalLoader = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const renderModalContent = () => {
    if (!activeModal) return null;
    
    switch (activeModal) {
      case "cronograma":
        return <Suspense fallback={<ModalLoader />}><CronogramaModalContent /></Suspense>;
      case "forum":
        return <Suspense fallback={<ModalLoader />}><ForumModalContent /></Suspense>;
      case "tutoria":
        return <Suspense fallback={<ModalLoader />}><TutoriaModalContent /></Suspense>;
      case "videoaulas":
        return <Suspense fallback={<ModalLoader />}><VideoaulasModalContent /></Suspense>;
      case "questoes":
        return <Suspense fallback={<ModalLoader />}><QuestoesModalContent /></Suspense>;
      case "flashcards":
        return <Suspense fallback={<ModalLoader />}><FlashcardsModalContent /></Suspense>;
      case "simulados":
        return <Suspense fallback={<ModalLoader />}><SimuladosModalContent /></Suspense>;
      case "mapas-mentais":
        return <Suspense fallback={<ModalLoader />}><MapasMentaisModalContent /></Suspense>;
      case "livros-web":
        return <Suspense fallback={<ModalLoader />}><LivrosWebModalContent /></Suspense>;
      default:
        return null;
    }
  };

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

  // 📅 SE NENHUM CRONOGRAMA SELECIONADO, MOSTRAR SELECTOR
  if (!selectedCronograma) {
    return (
      <div className="min-h-screen bg-background">
        <CronogramaSelector onSelect={setSelectedCronograma} />
      </div>
    );
  }

  // 📅 SE CRONOGRAMA DIFERENTE DE 'FEVEREIRO', MOSTRAR PLACEHOLDER
  if (selectedCronograma !== 'fevereiro') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-holo-purple/10 border border-primary/30 inline-block">
            <Calendar className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">
            {selectedCronograma === 'inteligente' 
              ? 'Cronograma Inteligente'
              : `Cronograma ${selectedCronograma.charAt(0).toUpperCase() + selectedCronograma.slice(1)}`}
          </h2>
          <p className="text-muted-foreground">
            Este cronograma estará disponível em breve. Por enquanto, experimente o Cronograma Extensivo Fevereiro.
          </p>
          <Button
            onClick={() => setSelectedCronograma(null)}
            className="bg-gradient-to-r from-primary to-holo-purple text-white"
          >
            Voltar para Seleção
          </Button>
        </div>
      </div>
    );
  }

  // 📅 CRONOGRAMA FEVEREIRO - CONTEÚDO ATUAL
  return (
    <>
      {/* 🚀 HUB MODAL SYSTEM */}
      <HubModal
        area={activeModalArea || null}
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
      >
        {renderModalContent()}
      </HubModal>
      
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* 🚀 HUB QUICK ACCESS BAR */}
        <div className="container mx-auto px-4 pt-4 relative z-10">
          <HubQuickAccessBar
            activeModal={activeModal}
            onOpenModal={setActiveModal}
          />
        </div>
        
        {/* 🌌 COSMIC BACKGROUND - GPU-only animations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Deep space gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_150%_100%_at_50%_-20%,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_80%_100%,hsl(var(--holo-purple)/0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_80%,hsl(var(--holo-cyan)/0.06),transparent_40%)]" />
        
        {/* Holographic grid lines */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        
        {/* Animated glow orbs - CSS only */}
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-holo-purple/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-holo-cyan/5 rounded-full blur-[150px]" />
      </div>
      {/* 🎛️ TOP BAR - HOLOGRAPHIC COMMAND CENTER */}
      <div className="relative border-b border-primary/20 bg-gradient-to-r from-card/90 via-card/70 to-card/90 backdrop-blur-2xl sticky top-0 z-20">
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-holo-cyan/40 to-transparent" />
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_49%,hsl(var(--primary)/0.03)_50%,transparent_51%)] bg-[length:100%_4px] pointer-events-none" />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Botão Voltar para Seleção */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCronograma(null)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
              Voltar
            </Button>
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
    </>
  );
}
