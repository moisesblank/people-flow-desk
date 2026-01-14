// ============================================
// 📋 GESTÃO DE PLANEJAMENTO SEMANAL
// /gestaofc/planejamento
// Gestão: CRUD de semanas, aulas, materiais
// 🔗 v2.0 - Vinculação com Videoaulas existentes
// ============================================

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Icons
import {
  Plus,
  Calendar,
  Play,
  FileText,
  Clock,
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Video,
  CheckCircle2,
  AlertCircle,
  Archive,
  Copy,
  LayoutGrid,
  List,
  ChevronRight,
  Settings,
  Target,
  Zap,
  GraduationCap,
  TrendingUp,
  Link2,
  Unlink,
  ExternalLink,
  Radio,
} from "lucide-react";

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Imagens dos cronogramas
import capaFevereiro from "@/assets/cronograma/capa-fevereiro.png";
import capaMarco from "@/assets/cronograma/capa-marco.png";
import capaAbril from "@/assets/cronograma/capa-abril.png";
import capaMaio from "@/assets/cronograma/capa-maio.png";
import capaMonteSeu from "@/assets/cronograma/capa-monte-seu.png";

// Types - Existing Lessons from lessons table
interface ExistingLesson {
  id: string;
  title: string;
  video_url: string | null;
  panda_video_id: string | null;
  duration_minutes: number | null;
  module?: { id: string; title: string } | null;
  area?: { id: string; name: string } | null;
}

// Types
interface PlanningWeek {
  id: string;
  title: string;
  description: string | null;
  week_number: number;
  status: "draft" | "active" | "archived";
  start_date: string | null;
  end_date: string | null;
  thumbnail_url: string | null;
  estimated_hours: number | null;
  difficulty: "easy" | "medium" | "hard";
  is_template: boolean;
  course_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface PlanningLesson {
  id: string;
  week_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_provider: "panda" | "youtube" | "vimeo" | null;
  duration_minutes: number | null;
  position: number;
  lesson_type: "video" | "reading" | "exercise" | "quiz" | "live";
  is_required: boolean;
  estimated_time_minutes: number | null;
  xp_reward: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 🎯 5 MANAGEMENT CARDS - Year 2300 Premium
// Sincronização em tempo real com /alunos/planejamento
// ============================================
function ManagementCards({ 
  weeks, 
  lessons,
  onNewWeek,
  onViewAll,
}: { 
  weeks: PlanningWeek[]; 
  lessons: PlanningLesson[];
  onNewWeek: () => void;
  onViewAll: () => void;
}) {
  const stats = useMemo(() => {
    const active = weeks.filter(w => w.status === "active").length;
    const draft = weeks.filter(w => w.status === "draft").length;
    const archived = weeks.filter(w => w.status === "archived").length;
    const templates = weeks.filter(w => w.is_template).length;
    const totalLessons = lessons.length;
    const linkedLessons = lessons.filter(l => l.video_url).length;
    const totalHours = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60;
    const totalXP = lessons.reduce((sum, l) => sum + (l.xp_reward || 0), 0);
    
    return { 
      active, 
      draft, 
      archived,
      templates, 
      totalLessons, 
      linkedLessons,
      totalHours: Math.round(totalHours * 10) / 10,
      totalXP,
      total: weeks.length,
      syncStatus: active > 0 ? "online" : "pending"
    };
  }, [weeks, lessons]);

  const cards = [
    {
      id: "semanas",
      title: "Semanas Ativas",
      value: stats.active,
      subtitle: `${stats.total} total • ${stats.draft} rascunhos`,
      icon: Calendar,
      gradient: "from-primary/20 via-primary/10 to-transparent",
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      borderColor: "border-primary/30",
      glowColor: "shadow-[0_0_30px_hsl(var(--primary)/0.2)]",
      badge: stats.active > 0 ? "SYNC" : null,
      badgeColor: "bg-green-500/20 text-green-500 border-green-500/30",
      onClick: onViewAll,
    },
    {
      id: "videoaulas",
      title: "Videoaulas Vinculadas",
      value: stats.linkedLessons,
      subtitle: `${stats.totalLessons} aulas cadastradas`,
      icon: Video,
      gradient: "from-holo-cyan/20 via-holo-cyan/10 to-transparent",
      iconBg: "bg-holo-cyan/20",
      iconColor: "text-holo-cyan",
      borderColor: "border-holo-cyan/30",
      glowColor: "shadow-[0_0_30px_hsl(var(--holo-cyan)/0.2)]",
      badge: stats.linkedLessons > 0 ? "LIVE" : null,
      badgeColor: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
      progress: stats.totalLessons > 0 ? (stats.linkedLessons / stats.totalLessons) * 100 : 0,
    },
    {
      id: "horas",
      title: "Carga Horária",
      value: `${stats.totalHours}h`,
      subtitle: "Tempo total de conteúdo",
      icon: Clock,
      gradient: "from-warning/20 via-warning/10 to-transparent",
      iconBg: "bg-warning/20",
      iconColor: "text-warning",
      borderColor: "border-warning/30",
      glowColor: "shadow-[0_0_30px_hsl(var(--warning)/0.2)]",
    },
    {
      id: "xp",
      title: "XP Disponível",
      value: stats.totalXP,
      subtitle: "Recompensa total para alunos",
      icon: Zap,
      gradient: "from-holo-purple/20 via-holo-purple/10 to-transparent",
      iconBg: "bg-holo-purple/20",
      iconColor: "text-holo-purple",
      borderColor: "border-holo-purple/30",
      glowColor: "shadow-[0_0_30px_hsl(var(--holo-purple)/0.2)]",
      badge: "XP",
      badgeColor: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    },
    {
      id: "sync",
      title: "Sincronização",
      value: stats.syncStatus === "online" ? "Online" : "Aguardando",
      subtitle: "Reflete em /alunos/planejamento",
      icon: Radio,
      gradient: stats.syncStatus === "online" 
        ? "from-green-500/20 via-green-500/10 to-transparent"
        : "from-muted/20 via-muted/10 to-transparent",
      iconBg: stats.syncStatus === "online" ? "bg-green-500/20" : "bg-muted/30",
      iconColor: stats.syncStatus === "online" ? "text-green-500" : "text-muted-foreground",
      borderColor: stats.syncStatus === "online" ? "border-green-500/30" : "border-muted/50",
      glowColor: stats.syncStatus === "online" 
        ? "shadow-[0_0_30px_hsl(142_76%_36%/0.2)]" 
        : "",
      badge: "REALTIME",
      badgeColor: stats.syncStatus === "online" 
        ? "bg-green-500/20 text-green-500 border-green-500/30 animate-pulse"
        : "bg-muted/30 text-muted-foreground border-muted/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group"
          >
            <Card 
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all duration-500",
                `bg-gradient-to-br ${card.gradient}`,
                card.borderColor,
                card.glowColor,
                "hover:shadow-xl"
              )}
              onClick={card.onClick}
            >
              {/* Top accent line */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-0.5",
                `bg-gradient-to-r ${card.gradient.replace('to-transparent', `to-${card.iconColor.replace('text-', '')}/50`)}`
              )} />
              
              {/* Badge */}
              {card.badge && (
                <Badge className={cn(
                  "absolute top-3 right-3 text-[9px] px-1.5 py-0.5 font-bold",
                  card.badgeColor
                )}>
                  {card.badge}
                </Badge>
              )}
              
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-all duration-300",
                    card.iconBg,
                    "group-hover:scale-110 group-hover:shadow-lg"
                  )}>
                    <Icon className={cn("h-5 w-5", card.iconColor)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-black tracking-tight">{card.value}</p>
                    <p className="text-xs font-medium text-foreground/80 truncate">{card.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{card.subtitle}</p>
                    
                    {/* Progress bar for videoaulas */}
                    {card.progress !== undefined && (
                      <div className="mt-2">
                        <Progress 
                          value={card.progress} 
                          className="h-1.5 bg-muted/30"
                        />
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {Math.round(card.progress)}% vinculadas
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================
// 🎯 5 CRONOGRAMA CARDS - Sync with /alunos/planejamento
// Mostra os 5 tipos de cronograma para gestão
// ============================================

const CRONOGRAMAS_CONFIG = [
  {
    id: 'fevereiro',
    title: 'EXTENSIVO FEVEREIRO',
    semanas: 39,
    highlight: '39 SEMANAS',
    image: capaFevereiro,
    status: 'active' as const,
    description: 'Cronograma completo iniciando em fevereiro',
  },
  {
    id: 'marco',
    title: 'EXTENSIVO MARÇO',
    semanas: 35,
    highlight: '35 SEMANAS',
    image: capaMarco,
    status: 'coming_soon' as const,
    description: 'Cronograma iniciando em março',
  },
  {
    id: 'abril',
    title: 'EXTENSIVO ABRIL',
    semanas: 30,
    highlight: '30 SEMANAS',
    image: capaAbril,
    status: 'coming_soon' as const,
    description: 'Cronograma iniciando em abril',
  },
  {
    id: 'maio',
    title: 'EXTENSIVO MAIO',
    semanas: 26,
    highlight: '26 SEMANAS',
    image: capaMaio,
    status: 'coming_soon' as const,
    description: 'Cronograma iniciando em maio',
  },
  {
    id: 'inteligente',
    title: 'INTELIGENTE',
    semanas: null,
    highlight: 'MONTE O SEU',
    image: capaMonteSeu,
    status: 'coming_soon' as const,
    description: 'Cronograma personalizado pelo aluno',
  },
];

function CronogramasGestaoCards({ 
  weeks, 
  onSelectCronograma,
}: { 
  weeks: PlanningWeek[];
  onSelectCronograma: (id: string) => void;
}) {
  // Calcular stats por cronograma (baseado em templates ou semanas ativas)
  const stats = useMemo(() => {
    return CRONOGRAMAS_CONFIG.map(crono => {
      const cronogramaWeeks = weeks.filter(w => 
        w.title.toLowerCase().includes(crono.id) || 
        (crono.id === 'fevereiro' && w.status === 'active')
      );
      return {
        ...crono,
        weekCount: cronogramaWeeks.length,
        activeWeeks: cronogramaWeeks.filter(w => w.status === 'active').length,
      };
    });
  }, [weeks]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-holo-purple/10 border border-primary/30">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Cronogramas do Aluno</h2>
            <p className="text-xs text-muted-foreground">
              Sincronizado com /alunos/planejamento
            </p>
          </div>
        </div>
        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 animate-pulse">
          <Radio className="h-3 w-3 mr-1" />
          REALTIME
        </Badge>
      </div>

      {/* Cards Grid - 5 cards iguais ao aluno */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {stats.map((crono, index) => (
          <div
            key={crono.id}
            onClick={() => onSelectCronograma(crono.id)}
            style={{ animationDelay: `${index * 80}ms` }}
            className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 animate-fade-in transform-gpu transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-primary/40"
          >
            {/* Background Image */}
            <img
              src={crono.image}
              alt={crono.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-85 group-hover:opacity-70 transition-opacity duration-300" />

            {/* Status Indicator */}
            <div className="absolute top-2 right-2">
              {crono.status === 'active' ? (
                <Badge className="bg-green-500/90 text-white text-[10px] px-2 py-0.5">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  ATIVO
                </Badge>
              ) : (
                <Badge className="bg-yellow-500/90 text-black text-[10px] px-2 py-0.5">
                  <Clock className="h-3 w-3 mr-1" />
                  EM BREVE
                </Badge>
              )}
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-3">
              {/* Highlight Badge */}
              <div className="mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/90 text-primary-foreground text-[10px] font-black rounded-full shadow-[0_0_15px_hsl(var(--primary)/0.5)]">
                  <Zap className="h-2.5 w-2.5" />
                  {crono.highlight}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-white text-xs font-bold leading-tight mb-1 drop-shadow-lg line-clamp-2">
                {crono.title}
              </h3>

              {/* Stats */}
              <div className="flex items-center gap-2 text-[10px] text-white/80">
                <span className="flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  {crono.activeWeeks}/{crono.semanas || '∞'}
                </span>
                {crono.weekCount > 0 && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-2.5 w-2.5" />
                    {crono.weekCount} semanas
                  </span>
                )}
              </div>

              {/* CTA Arrow */}
              <div className="flex items-center gap-1 text-primary text-[10px] font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 mt-1">
                <span>Gerenciar</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-l-2 border-t-2 border-white/30 rounded-tl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-r-2 border-t-2 border-white/30 rounded-tr opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-l-2 border-b-2 border-white/30 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r-2 border-b-2 border-white/30 rounded-br opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Holographic Glow */}
            <div className="absolute inset-0 rounded-xl group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-shadow duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Week Card Component
function WeekCard({ 
  week, 
  lessons,
  onEdit, 
  onDelete, 
  onDuplicate,
  onViewLessons,
}: { 
  week: PlanningWeek;
  lessons: PlanningLesson[];
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onViewLessons: () => void;
}) {
  const weekLessons = lessons.filter(l => l.week_id === week.id);
  const totalMinutes = weekLessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  
  const statusConfig = {
    draft: { label: "Rascunho", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
    active: { label: "Ativa", color: "bg-green-500/20 text-green-500 border-green-500/30" },
    archived: { label: "Arquivada", color: "bg-gray-500/20 text-gray-500 border-gray-500/30" },
  };

  const difficultyConfig = {
    easy: { label: "Fácil", color: "text-green-500" },
    medium: { label: "Médio", color: "text-yellow-500" },
    hard: { label: "Difícil", color: "text-red-500" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30">
        {/* Thumbnail */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
          {week.thumbnail_url ? (
            <img src={week.thumbnail_url} alt={week.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-16 w-16 text-primary/30" />
            </div>
          )}
          
          {/* Status Badge */}
          <Badge className={`absolute top-3 left-3 ${statusConfig[week.status].color}`}>
            {statusConfig[week.status].label}
          </Badge>
          
          {/* Template Badge */}
          {week.is_template && (
            <Badge className="absolute top-3 right-3 bg-purple-500/20 text-purple-500 border-purple-500/30">
              Template
            </Badge>
          )}
          
          {/* Week Number */}
          <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-sm font-bold">Semana {week.week_number}</span>
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{week.title}</CardTitle>
              {week.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {week.description}
                </CardDescription>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewLessons}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Aulas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-4">
          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Video className="h-4 w-4" />
              <span>{weekLessons.length} aulas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{Math.round(totalMinutes / 60)}h {totalMinutes % 60}min</span>
            </div>
            <div className={`flex items-center gap-1.5 ${difficultyConfig[week.difficulty].color}`}>
              <Target className="h-4 w-4" />
              <span>{difficultyConfig[week.difficulty].label}</span>
            </div>
          </div>

          {/* Date Range */}
          {(week.start_date || week.end_date) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {week.start_date && format(new Date(week.start_date), "dd MMM", { locale: ptBR })}
                {week.start_date && week.end_date && " - "}
                {week.end_date && format(new Date(week.end_date), "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" onClick={onViewLessons}>
            <Eye className="h-4 w-4 mr-2" />
            Gerenciar Aulas
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Create/Edit Week Dialog
function WeekFormDialog({
  open,
  onOpenChange,
  week,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  week?: PlanningWeek | null;
  onSave: (data: Partial<PlanningWeek>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    week_number: 1,
    status: "draft" as PlanningWeek["status"],
    difficulty: "medium" as PlanningWeek["difficulty"],
    estimated_hours: 10,
    is_template: false,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (week) {
      setFormData({
        title: week.title,
        description: week.description || "",
        week_number: week.week_number,
        status: week.status,
        difficulty: week.difficulty,
        estimated_hours: week.estimated_hours || 10,
        is_template: week.is_template,
        start_date: week.start_date || "",
        end_date: week.end_date || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        week_number: 1,
        status: "draft",
        difficulty: "medium",
        estimated_hours: 10,
        is_template: false,
        start_date: "",
        end_date: "",
      });
    }
  }, [week, open]);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    onSave({
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{week ? "Editar Semana" : "Nova Semana de Planejamento"}</DialogTitle>
          <DialogDescription>
            {week ? "Atualize os dados da semana" : "Crie uma nova semana de estudo para os alunos"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Semana 1 - Introdução à Química"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o conteúdo desta semana..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="week_number">Número da Semana</Label>
              <Input
                id="week_number"
                type="number"
                min={1}
                value={formData.week_number}
                onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estimated_hours">Horas Estimadas</Label>
              <Input
                id="estimated_hours"
                type="number"
                min={1}
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as PlanningWeek["status"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="archived">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v as PlanningWeek["difficulty"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Data Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end_date">Data Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_template"
              checked={formData.is_template}
              onCheckedChange={(checked) => setFormData({ ...formData, is_template: checked })}
            />
            <Label htmlFor="is_template">Salvar como template (modelo reutilizável)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : week ? "Salvar Alterações" : "Criar Semana"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Lessons Management Dialog with Videoaulas Linking
function LessonsManagementDialog({
  open,
  onOpenChange,
  week,
  lessons,
  existingLessons,
  onAddLesson,
  onDeleteLesson,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  week: PlanningWeek | null;
  lessons: PlanningLesson[];
  existingLessons: ExistingLesson[];
  onAddLesson: (data: Partial<PlanningLesson>) => void;
  onDeleteLesson: (id: string) => void;
  isLoading: boolean;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [linkExisting, setLinkExisting] = useState(true); // Toggle: vincular existente vs criar nova
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [lessonSearchOpen, setLessonSearchOpen] = useState(false);
  const [lessonSearchQuery, setLessonSearchQuery] = useState("");
  
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    video_url: "",
    duration_minutes: 30,
    lesson_type: "video" as const,
    is_required: true,
    xp_reward: 10,
  });

  const weekLessons = lessons.filter(l => l.week_id === week?.id).sort((a, b) => a.position - b.position);

  // Group existing lessons by module for better UX
  const groupedLessons = useMemo(() => {
    const groups: Record<string, ExistingLesson[]> = {};
    existingLessons.forEach(lesson => {
      const moduleName = lesson.module?.title || "Sem Módulo";
      if (!groups[moduleName]) groups[moduleName] = [];
      groups[moduleName].push(lesson);
    });
    return groups;
  }, [existingLessons]);

  // Filtered lessons based on search
  const filteredLessons = useMemo(() => {
    if (!lessonSearchQuery) return existingLessons;
    const query = lessonSearchQuery.toLowerCase();
    return existingLessons.filter(
      l => l.title.toLowerCase().includes(query) || 
           l.module?.title?.toLowerCase().includes(query)
    );
  }, [existingLessons, lessonSearchQuery]);

  const selectedExistingLesson = existingLessons.find(l => l.id === selectedLessonId);

  const handleSelectExistingLesson = (lesson: ExistingLesson) => {
    setSelectedLessonId(lesson.id);
    setLessonSearchOpen(false);
    
    // Auto-fill form with selected lesson data
    const videoUrl = lesson.video_url || 
      (lesson.panda_video_id ? `https://player-vz-7a0cccc3-0dc.tv.pandavideo.com.br/embed/?v=${lesson.panda_video_id}` : "");
    
    setNewLesson({
      ...newLesson,
      title: lesson.title,
      video_url: videoUrl,
      duration_minutes: lesson.duration_minutes || 30,
    });
  };

  const handleSubmit = () => {
    if (linkExisting && !selectedLessonId) {
      toast.error("Selecione uma aula existente");
      return;
    }
    if (!linkExisting && !newLesson.title.trim()) {
      toast.error("Título da aula é obrigatório");
      return;
    }
    
    onAddLesson({
      ...newLesson,
      week_id: week!.id,
      position: weekLessons.length + 1,
    });
    
    // Reset form
    setNewLesson({
      title: "",
      description: "",
      video_url: "",
      duration_minutes: 30,
      lesson_type: "video",
      is_required: true,
      xp_reward: 10,
    });
    setSelectedLessonId("");
    setShowAddForm(false);
  };

  const typeConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
    video: { icon: Video, label: "Videoaula", color: "text-blue-500 bg-blue-500/20" },
    reading: { icon: BookOpen, label: "Leitura", color: "text-green-500 bg-green-500/20" },
    exercise: { icon: FileText, label: "Exercício", color: "text-orange-500 bg-orange-500/20" },
    quiz: { icon: Target, label: "Quiz", color: "text-purple-500 bg-purple-500/20" },
    live: { icon: Play, label: "Live", color: "text-red-500 bg-red-500/20" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Gerenciar Aulas - {week?.title}
          </DialogTitle>
          <DialogDescription>
            Semana {week?.week_number} • {weekLessons.length} aulas cadastradas
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            {/* Add Lesson Button / Form */}
            {!showAddForm ? (
              <Button onClick={() => setShowAddForm(true)} variant="outline" className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Nova Aula
              </Button>
            ) : (
              <Card className="border-primary/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Nova Aula</CardTitle>
                    
                    {/* Toggle: Link Existing vs Create New */}
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => {
                          setLinkExisting(true);
                          setSelectedLessonId("");
                          setNewLesson({ ...newLesson, title: "", video_url: "", duration_minutes: 30 });
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                          linkExisting 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Vincular Existente
                      </button>
                      <button
                        onClick={() => {
                          setLinkExisting(false);
                          setSelectedLessonId("");
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                          !linkExisting 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        Criar Nova
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Link Existing Mode */}
                  {linkExisting && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-primary" />
                          Selecionar Videoaula Existente
                        </Label>
                        <Popover open={lessonSearchOpen} onOpenChange={setLessonSearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={lessonSearchOpen}
                              className="w-full justify-between h-auto min-h-10 py-2"
                            >
                              {selectedExistingLesson ? (
                                <div className="flex items-center gap-2 text-left">
                                  <Video className="h-4 w-4 text-primary shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{selectedExistingLesson.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {selectedExistingLesson.module?.title || "Sem módulo"} 
                                      {selectedExistingLesson.duration_minutes && ` • ${selectedExistingLesson.duration_minutes}min`}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Buscar videoaula...</span>
                              )}
                              <Search className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[500px] p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Buscar por título ou módulo..." 
                                value={lessonSearchQuery}
                                onValueChange={setLessonSearchQuery}
                              />
                              <CommandList className="max-h-[300px]">
                                <CommandEmpty>Nenhuma videoaula encontrada</CommandEmpty>
                                {Object.entries(groupedLessons).map(([moduleName, moduleLessons]) => {
                                  const filtered = moduleLessons.filter(l => 
                                    !lessonSearchQuery || 
                                    l.title.toLowerCase().includes(lessonSearchQuery.toLowerCase())
                                  );
                                  if (filtered.length === 0) return null;
                                  
                                  return (
                                    <CommandGroup key={moduleName} heading={moduleName}>
                                      {filtered.map(lesson => (
                                        <CommandItem
                                          key={lesson.id}
                                          value={lesson.title}
                                          onSelect={() => handleSelectExistingLesson(lesson)}
                                          className="flex items-center gap-3 py-3"
                                        >
                                          <div className={cn(
                                            "p-1.5 rounded-md",
                                            lesson.video_url || lesson.panda_video_id 
                                              ? "bg-green-500/20 text-green-500" 
                                              : "bg-yellow-500/20 text-yellow-500"
                                          )}>
                                            <Video className="h-3.5 w-3.5" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{lesson.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                              {lesson.duration_minutes && (
                                                <span className="flex items-center gap-1">
                                                  <Clock className="h-3 w-3" />
                                                  {lesson.duration_minutes}min
                                                </span>
                                              )}
                                              {(lesson.video_url || lesson.panda_video_id) && (
                                                <Badge variant="outline" className="text-[10px] h-4">
                                                  Com vídeo
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          {selectedLessonId === lesson.id && (
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  );
                                })}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        
                        <p className="text-xs text-muted-foreground">
                          {existingLessons.length} videoaulas disponíveis em /gestaofc/videoaulas
                        </p>
                      </div>
                      
                      {/* Preview of selected lesson */}
                      {selectedExistingLesson && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-green-500/20 text-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Aula Selecionada
                            </Badge>
                            <a 
                              href={`/gestaofc/videoaulas?id=${selectedExistingLesson.id}`}
                              target="_blank"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              Ver no Gestão
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Título</p>
                              <p className="font-medium">{newLesson.title}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Duração</p>
                              <p className="font-medium">{newLesson.duration_minutes} minutos</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create New Mode */}
                  {!linkExisting && (
                    <>
                      <div className="grid gap-2">
                        <Label>Título *</Label>
                        <Input
                          value={newLesson.title}
                          onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                          placeholder="Ex: Aula 1 - Introdução"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={newLesson.description}
                          onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                          placeholder="Descrição da aula..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Tipo</Label>
                          <Select 
                            value={newLesson.lesson_type} 
                            onValueChange={(v) => setNewLesson({ ...newLesson, lesson_type: v as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">Videoaula</SelectItem>
                              <SelectItem value="reading">Leitura</SelectItem>
                              <SelectItem value="exercise">Exercício</SelectItem>
                              <SelectItem value="quiz">Quiz</SelectItem>
                              <SelectItem value="live">Live</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Duração (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={newLesson.duration_minutes}
                            onChange={(e) => setNewLesson({ ...newLesson, duration_minutes: parseInt(e.target.value) || 30 })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>URL do Vídeo</Label>
                          <Input
                            value={newLesson.video_url}
                            onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>XP Recompensa</Label>
                          <Input
                            type="number"
                            min={0}
                            value={newLesson.xp_reward}
                            onChange={(e) => setNewLesson({ ...newLesson, xp_reward: parseInt(e.target.value) || 10 })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Common fields */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newLesson.is_required}
                      onCheckedChange={(v) => setNewLesson({ ...newLesson, is_required: v })}
                    />
                    <Label>Aula obrigatória</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSubmit} disabled={isLoading}>
                      {isLoading ? "Salvando..." : linkExisting ? "Vincular Aula" : "Salvar Aula"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowAddForm(false);
                      setSelectedLessonId("");
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lessons List */}
            {weekLessons.length === 0 && !showAddForm ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma aula cadastrada nesta semana</p>
                <p className="text-sm">Clique no botão acima para adicionar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {weekLessons.map((lesson, index) => {
                  const config = typeConfig[lesson.lesson_type] || typeConfig.video;
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                        {index + 1}
                      </div>
                      
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lesson.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{config.label}</span>
                          {lesson.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.duration_minutes} min
                            </span>
                          )}
                          {lesson.xp_reward && (
                            <span className="text-yellow-500">+{lesson.xp_reward} XP</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {lesson.is_required && (
                          <Badge variant="outline" className="text-xs">Obrigatória</Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                if (confirm("Excluir esta aula?")) {
                                  onDeleteLesson(lesson.id);
                                }
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function GestaoPlanejamento() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<PlanningWeek | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<PlanningWeek | null>(null);

  // Fetch weeks
  const { data: weeks = [], isLoading: weeksLoading } = useQuery({
    queryKey: ["planning-weeks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_weeks")
        .select("*")
        .order("week_number", { ascending: true });
      if (error) throw error;
      return data as PlanningWeek[];
    },
  });

  // Fetch planning lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ["planning-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_lessons")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data as PlanningLesson[];
    },
  });

  // Fetch existing videoaulas from lessons table for linking
  const { data: existingLessons = [] } = useQuery({
    queryKey: ["existing-videoaulas-for-planning"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          id,
          title,
          video_url,
          panda_video_id,
          duration_minutes,
          module:modules(id, title),
          area:areas(id, name)
        `)
        .eq("is_published", true)
        .order("title", { ascending: true });
      if (error) throw error;
      return data as ExistingLesson[];
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("planning-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "planning_weeks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["planning-weeks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "planning_lessons" }, () => {
        queryClient.invalidateQueries({ queryKey: ["planning-lessons"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create week mutation
  const createWeekMutation = useMutation({
    mutationFn: async (data: Partial<PlanningWeek>) => {
      const { data: result, error } = await supabase
        .from("planning_weeks")
        .insert({
          title: data.title!,
          description: data.description,
          week_number: data.week_number!,
          status: data.status || "draft",
          difficulty: data.difficulty || "medium",
          estimated_hours: data.estimated_hours,
          is_template: data.is_template || false,
          start_date: data.start_date,
          end_date: data.end_date,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-weeks"] });
      toast.success("Semana criada com sucesso!");
      setFormDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao criar semana: " + error.message);
    },
  });

  // Update week mutation
  const updateWeekMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlanningWeek> }) => {
      const { data: result, error } = await supabase
        .from("planning_weeks")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-weeks"] });
      toast.success("Semana atualizada!");
      setFormDialogOpen(false);
      setEditingWeek(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  // Delete week mutation
  const deleteWeekMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planning_weeks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-weeks"] });
      toast.success("Semana excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (data: Partial<PlanningLesson>) => {
      const { data: result, error } = await supabase
        .from("planning_lessons")
        .insert({
          week_id: data.week_id!,
          title: data.title!,
          description: data.description,
          video_url: data.video_url,
          video_provider: data.video_url?.includes("panda") ? "panda" : data.video_url?.includes("youtube") ? "youtube" : "vimeo",
          duration_minutes: data.duration_minutes,
          position: data.position || 1,
          lesson_type: data.lesson_type || "video",
          is_required: data.is_required ?? true,
          estimated_time_minutes: data.duration_minutes,
          xp_reward: data.xp_reward || 10,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-lessons"] });
      toast.success("Aula adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar aula: " + error.message);
    },
  });

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planning_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-lessons"] });
      toast.success("Aula excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  // Filter weeks
  const filteredWeeks = useMemo(() => {
    return weeks.filter((week) => {
      const matchesSearch = week.title.toLowerCase().includes(search.toLowerCase()) ||
        week.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || week.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [weeks, search, statusFilter]);

  const handleSaveWeek = (data: Partial<PlanningWeek>) => {
    if (editingWeek) {
      updateWeekMutation.mutate({ id: editingWeek.id, data });
    } else {
      createWeekMutation.mutate(data);
    }
  };

  const handleDuplicate = (week: PlanningWeek) => {
    createWeekMutation.mutate({
      ...week,
      title: `${week.title} (Cópia)`,
      status: "draft",
      is_template: false,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Planejamento Semanal
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as semanas de estudo e aulas para os alunos
            </p>
          </div>

          <Button onClick={() => {
            setEditingWeek(null);
            setFormDialogOpen(true);
          }} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nova Semana
          </Button>
        </div>

        {/* 🎯 5 MANAGEMENT CARDS - Year 2300 Premium */}
        <ManagementCards 
          weeks={weeks} 
          lessons={lessons}
          onNewWeek={() => {
            setEditingWeek(null);
            setFormDialogOpen(true);
          }}
          onViewAll={() => setStatusFilter("all")}
        />

        {/* 🎯 5 CRONOGRAMA CARDS - Sync with /alunos/planejamento */}
        <CronogramasGestaoCards 
          weeks={weeks}
          onSelectCronograma={(id) => {
            toast.info(`Gerenciando cronograma: ${id.toUpperCase()}`);
            // Filtrar semanas por cronograma selecionado
            if (id === 'fevereiro') {
              setStatusFilter("active");
            }
          }}
        />

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar semanas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="archived">Arquivadas</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weeks Grid */}
        {weeksLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredWeeks.length === 0 ? (
          <Card className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma semana encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca"
                  : "Crie a primeira semana de planejamento"}
              </p>
              {!search && statusFilter === "all" && (
                <Button onClick={() => setFormDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Semana
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            <AnimatePresence mode="popLayout">
              {filteredWeeks.map((week) => (
                <WeekCard
                  key={week.id}
                  week={week}
                  lessons={lessons}
                  onEdit={() => {
                    setEditingWeek(week);
                    setFormDialogOpen(true);
                  }}
                  onDelete={() => {
                    if (confirm("Tem certeza que deseja excluir esta semana?")) {
                      deleteWeekMutation.mutate(week.id);
                    }
                  }}
                  onDuplicate={() => handleDuplicate(week)}
                  onViewLessons={() => setSelectedWeek(week)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Form Dialog */}
        <WeekFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          week={editingWeek}
          onSave={handleSaveWeek}
          isLoading={createWeekMutation.isPending || updateWeekMutation.isPending}
        />

        {/* Lessons Management Dialog */}
        <LessonsManagementDialog
          open={selectedWeek !== null}
          onOpenChange={(open) => !open && setSelectedWeek(null)}
          week={selectedWeek}
          lessons={lessons}
          existingLessons={existingLessons}
          onAddLesson={(data) => createLessonMutation.mutate(data)}
          onDeleteLesson={(id) => deleteLessonMutation.mutate(id)}
          isLoading={createLessonMutation.isPending}
        />
      </div>
    </div>
  );
}
