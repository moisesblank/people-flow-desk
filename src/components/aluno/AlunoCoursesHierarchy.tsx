// ============================================
// 📚 HIERARQUIA DE CURSOS DO ALUNO — DESIGN 2300
// Visualização: HUB 6 CARDS → Subcategorias → Módulos → Aulas
// Mesmo padrão visual da Gestão, mas modo leitura
// ============================================

import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Layers, Search, ChevronRight, PlayCircle,
  FolderOpen, BookOpen, Eye, Video, Clock, Sparkles, GraduationCap,
  ChevronUp, ChevronDown, Play, ChevronLeft, Info, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Chronolock, DateLock } from '@/components/ui/chronolock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { OmegaFortressPlayer } from '@/components/video/OmegaFortressPlayer';
import { LessonTabs } from '@/components/player/LessonTabs';
import { useModulesProgress, type ModuleProgressData } from '@/hooks/useModuleProgress';
import { getThumbnailUrl } from '@/lib/video/thumbnails';
import { detectVideoProviderFromUrl, looksLikeUrl, normalizePandaVideoId, getVideoTypeWithIntegrityGuard } from '@/lib/video/detectVideoProvider';
import { CoursesHub, COURSE_HUB_CARDS, type CourseHubCard } from '@/components/aluno/courses/CoursesHub';
// AnimatePresence e motion removidos para performance

// ============================================
// TIPOS
// ============================================
interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  subcategory: string | null;
  position: number;
  is_published: boolean;
  thumbnail_url: string | null;
  course?: { id: string; title: string; is_published: boolean; };
  _count?: { lessons: number; };
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  position: number;
  is_published: boolean;
  video_url: string | null;
  duration_minutes: number | null;
  panda_video_id: string | null;
  youtube_video_id: string | null;
  video_provider: string | null;
  thumbnail_url: string | null;
  // Material Complementar (PDF)
  material_url: string | null;
  material_nome: string | null;
}

interface Course {
  id: string;
  title: string;
  is_published: boolean;
}

// ============================================
// HOOKS
// Interface para ordenação de subcategorias
interface SubcategoryOrder {
  id: string;
  course_id: string;
  subcategory: string;
  position: number;
}

// ============================================
function usePublishedModules() {
  return useQuery({
    queryKey: ['aluno-all-modules-hierarchy'],
    queryFn: async () => {
      const { data: modules, error } = await supabase
        .from('modules')
        .select(`*, course:courses(id, title, is_published)`)
        .eq('is_published', true)
        .order('course_id')
        .order('position', { ascending: true });
      
      if (error) throw error;

      // Batch loading para >1000 aulas
      const BATCH_SIZE = 1000;
      let allLessons: { module_id: string; is_published: boolean }[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error: batchError } = await supabase
          .from('lessons')
          .select('module_id, is_published')
          .eq('is_published', true)
          .range(offset, offset + BATCH_SIZE - 1);
        
        if (batchError) throw batchError;
        if (batch && batch.length > 0) {
          allLessons = [...allLessons, ...batch];
          offset += BATCH_SIZE;
          hasMore = batch.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      console.log(`[AlunoCoursesHierarchy] Total aulas carregadas: ${allLessons.length}`);

      const countMap = new Map<string, number>();
      allLessons.forEach(l => {
        countMap.set(l.module_id, (countMap.get(l.module_id) || 0) + 1);
      });

      // Filtrar apenas módulos com cursos publicados
      return ((modules || [])
        .filter(m => m.course?.is_published)
        .map(m => ({
          ...m,
          _count: { lessons: countMap.get(m.id) || 0 }
        })) as Module[]);
    }
  });
}

function usePublishedCourses() {
  return useQuery({
    queryKey: ['aluno-courses-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, is_published')
        .eq('is_published', true)
        .order('title');
      if (error) throw error;
      return data as Course[];
    }
  });
}

// ============================================
// HOOK: Ordenação de Subcategorias (FONTE ÚNICA DE VERDADE)
// Usa a mesma tabela subcategory_ordering da gestão
// ============================================
function useSubcategoryOrdering() {
  return useQuery({
    queryKey: ['aluno-subcategory-ordering'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcategory_ordering')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as SubcategoryOrder[];
    },
    staleTime: 5 * 60 * 1000 // 5 minutos - sincronizado com gestão
  });
}

function useModuleLessons(moduleId: string | null) {
  return useQuery({
    queryKey: ['aluno-module-lessons', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('id, module_id, title, description, position, is_published, video_url, duration_minutes, panda_video_id, youtube_video_id, video_provider, thumbnail_url, material_url, material_nome')
        .eq('module_id', moduleId)
        .eq('is_published', true)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!moduleId
  });
}

// ============================================
// REALTIME HOOK
// ============================================
function useLMSRealtime() {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce 5s para conteúdo de gestão (evita Thundering Herd com 5.000 alunos)
  const debouncedInvalidate = useCallback((queryKeys: string[][]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
    }, 5000);
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('lms-aluno-hierarchy-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        debouncedInvalidate([['aluno-all-modules-hierarchy'], ['aluno-courses-dropdown']]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        debouncedInvalidate([['aluno-all-modules-hierarchy']]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        debouncedInvalidate([['aluno-all-modules-hierarchy'], ['aluno-module-lessons']]);
      })
      // SYNC CRÍTICO: Ordenação de subcategorias deve sincronizar em tempo real
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_ordering' }, () => {
        debouncedInvalidate([['aluno-subcategory-ordering']]);
      })
      .subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedInvalidate]);
}

// ============================================
// 🎯 HUD STAT ORB — YEAR 2300 CINEMATIC DESIGN
// Orbes flutuantes com glow holográfico intenso
// ============================================
function HudStatOrb({ 
  icon, 
  value, 
  label, 
  color,
  glowColor
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: string;
  glowColor?: string;
}) {
  return (
    <div className={cn(
      "group relative p-5 md:p-6 rounded-2xl border-2 backdrop-blur-xl transition-all duration-500",
      "bg-gradient-to-br hover:scale-[1.03] hover:shadow-2xl",
      "cursor-default select-none",
      color
    )}>
      {/* Outer glow ring */}
      <div className={cn(
        "absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500 -z-10",
        glowColor || "bg-primary"
      )} />
      
      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-current opacity-50 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-current opacity-50 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-current opacity-50 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-current opacity-50 rounded-br-xl" />
      
      <div className="flex items-center gap-4">
        {/* Icon container with pulse */}
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-current opacity-20 blur-md" />
          <div className="relative p-3 rounded-xl bg-background/30 backdrop-blur-sm border border-current/30 shadow-inner">
            {icon}
          </div>
        </div>
        
        {/* Value and label */}
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest opacity-80">{label}</p>
        </div>
      </div>
      
    </div>
  );
}

// ============================================
// 🎨 LEGENDA VISUAL — NETFLIX PREMIUM CINEMATIC
// Barra de navegação hierárquica com design Netflix
// ============================================
function HierarchyLegend() {
  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-r from-[#1a0a0a]/60 via-[#0a0e14]/80 to-[#1a0a0a]/60 border-2 border-[#E50914]/30 backdrop-blur-xl overflow-hidden">
      {/* Background glow orbs - Netflix red */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#E50914]/15 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-[#E50914]/10 rounded-full blur-3xl -z-10" />
      
      <div className="flex flex-wrap items-center gap-3 justify-center">
        <span className="text-sm font-bold text-slate-300 mr-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#E50914]" />
          NAVEGAÇÃO:
        </span>
        
        {/* Curso */}
        <Badge className="px-4 py-2 text-sm bg-[#E50914]/25 text-[#FF6B6B] border-2 border-[#E50914]/50 shadow-lg shadow-[#E50914]/30 hover:scale-105 transition-transform">
          <GraduationCap className="h-4 w-4 mr-2" />
          Curso
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-[#E50914]/70" />
        
        {/* Subcategoria */}
        <Badge className="px-4 py-2 text-sm bg-slate-700/50 text-slate-200 border-2 border-slate-500/40 shadow-lg hover:scale-105 transition-transform">
          <FolderOpen className="h-4 w-4 mr-2" />
          Subcategoria
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-slate-500" />
        
        {/* Módulo */}
        <Badge className="px-4 py-2 text-sm bg-slate-700/50 text-slate-200 border-2 border-slate-500/40 shadow-lg hover:scale-105 transition-transform">
          <Layers className="h-4 w-4 mr-2" />
          Módulo
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-slate-500" />
        
        {/* Aulas */}
        <Badge className="px-4 py-2 text-sm bg-[#E50914]/25 text-[#FF6B6B] border-2 border-[#E50914]/50 shadow-lg shadow-[#E50914]/30 hover:scale-105 transition-transform">
          <PlayCircle className="h-4 w-4 mr-2" />
          Videoaulas
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// 🧪 RESOLUÇÃO DE QUESTÕES — MACRO GROUPING CARDS
// Agrupa módulos por área: Química Geral, Orgânica, Físico-Química
// APENAS para subcategoria "Resolução de Questões"
// ============================================
const RESOLUCAO_MACRO_CARDS = [
  {
    id: 'quimica-geral',
    name: 'Resolução de questão - Química Geral',
    icon: '⚗️',
    gradient: 'from-amber-500/30 via-amber-600/20 to-amber-900/10',
    borderColor: 'border-amber-500/50',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    positionRange: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Positions 1-12 (Introdução à Gases)
  },
  {
    id: 'quimica-organica',
    name: 'Resolução de questão - Química Orgânica',
    icon: '🧪',
    gradient: 'from-purple-500/30 via-purple-600/20 to-purple-900/10',
    borderColor: 'border-purple-500/50',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    positionRange: [13, 14, 15, 16, 17, 18], // Positions 13-18 (Intro Orgânica à Polímeros)
  },
  {
    id: 'fisico-quimica',
    name: 'Resolução de questão - Físico-Química',
    icon: '⚡',
    gradient: 'from-cyan-500/30 via-cyan-600/20 to-cyan-900/10',
    borderColor: 'border-cyan-500/50',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    positionRange: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31], // Positions 19-31 (Soluções em diante)
  },
];

// ============================================
// 🎬 RESOLUÇÃO QUESTÕES MACRO VIEW
// Cards Netflix-style para agrupar módulos por área
// ============================================
const ResolucaoQuestoesMacroView = memo(function ResolucaoQuestoesMacroView({
  allModules,
  expandedModules,
  onToggleModule,
  onPlayLesson,
  progressMap
}: {
  allModules: Module[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onPlayLesson: (lesson: Lesson) => void;
  progressMap: Map<string, ModuleProgressData>;
}) {
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  
  // 🛡️ Os módulos já vêm filtrados da subcategoria "Resolução de Questões"
  // Agrupamos por POSITION (campo do banco de dados)
  const getModulesForMacro = useCallback((positionRange: number[]) => {
    return allModules.filter(m => {
      return positionRange.includes(m.position);
    }).sort((a, b) => a.position - b.position);
  }, [allModules]);
  
  // Módulos filtrados para o macro selecionado
  const filteredModules = useMemo(() => {
    if (!selectedMacro) return [];
    const card = RESOLUCAO_MACRO_CARDS.find(c => c.id === selectedMacro);
    if (!card) return [];
    return getModulesForMacro(card.positionRange);
  }, [selectedMacro, getModulesForMacro]);
  
  const selectedCard = RESOLUCAO_MACRO_CARDS.find(c => c.id === selectedMacro);

  // Se um macro está selecionado, mostra os módulos
  if (selectedMacro && selectedCard) {
    const totalLessons = filteredModules.reduce((a, m) => a + (m._count?.lessons || 0), 0);
    
    return (
      <div className="space-y-6">
        {/* Back Button + Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setSelectedMacro(null)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">{selectedCard.icon}</span>
              {selectedCard.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredModules.length} módulos • {totalLessons} videoaulas
            </p>
          </div>
        </div>
        
        {/* Módulos */}
        <div className="space-y-2">
          {filteredModules.map((module, idx) => (
            <NetflixModuleSection
              key={module.id}
              module={module}
              index={idx}
              isExpanded={expandedModules.has(module.id)}
              onToggle={() => onToggleModule(module.id)}
              onPlayLesson={onPlayLesson}
              progress={progressMap.get(module.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 🏛️ MACRO CARDS — YEAR 2300 CINEMATIC PREMIUM
  // Estética futurista cinematográfica de alto impacto
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2">
      {RESOLUCAO_MACRO_CARDS.map((card) => {
        const modules = getModulesForMacro(card.positionRange);
        const totalLessons = modules.reduce((a, m) => a + (m._count?.lessons || 0), 0);
        
        const cardStyles = {
          'quimica-geral': { 
            accent: 'amber',
            iconBg: 'from-amber-500 to-orange-600',
            border: 'hover:border-amber-500/60',
            glow: 'hover:shadow-amber-500/30',
            ring: 'group-hover:ring-amber-500/40',
            badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
          },
          'quimica-organica': { 
            accent: 'purple',
            iconBg: 'from-purple-500 to-fuchsia-600',
            border: 'hover:border-purple-500/60',
            glow: 'hover:shadow-purple-500/30',
            ring: 'group-hover:ring-purple-500/40',
            badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            bar: 'bg-gradient-to-r from-purple-500 to-fuchsia-500',
          },
          'fisico-quimica': { 
            accent: 'cyan',
            iconBg: 'from-cyan-500 to-blue-600',
            border: 'hover:border-cyan-500/60',
            glow: 'hover:shadow-cyan-500/30',
            ring: 'group-hover:ring-cyan-500/40',
            badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
            bar: 'bg-gradient-to-r from-cyan-500 to-blue-500',
          },
        };
        const style = cardStyles[card.id as keyof typeof cardStyles] || cardStyles['quimica-geral'];
        
        return (
          <div
            key={card.id}
            onClick={() => setSelectedMacro(card.id)}
            className={cn(
              "group relative cursor-pointer rounded-2xl overflow-hidden",
              "bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95",
              "border border-slate-700/50",
              style.border,
              "shadow-xl shadow-black/40",
              style.glow,
              "hover:shadow-2xl",
              "ring-1 ring-transparent",
              style.ring,
              "transition-all duration-300 ease-out transform-gpu",
              "hover:scale-[1.03] hover:-translate-y-1"
            )}
          >
            {/* ═══ HOLOGRAPHIC TOP BAR ═══ */}
            <div className={cn("h-1.5 w-full", style.bar)} />
            
            {/* ═══ AMBIENT GLOW EFFECT ═══ */}
            <div className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32",
              "bg-gradient-to-b opacity-0 group-hover:opacity-30",
              style.iconBg.replace('from-', 'from-').replace('to-', 'to-'),
              "blur-3xl transition-opacity duration-500 pointer-events-none"
            )} />
            
            {/* ═══ CARD CONTENT ═══ */}
            <div className="relative p-6">
              {/* Icon + Title Section */}
              <div className="flex items-start gap-4 mb-5">
                {/* Premium Icon Badge */}
                <div className={cn(
                  "flex-shrink-0 w-14 h-14 rounded-xl",
                  "bg-gradient-to-br", style.iconBg,
                  "flex items-center justify-center",
                  "shadow-lg shadow-black/30",
                  "ring-2 ring-white/10",
                  "group-hover:scale-110 transition-transform duration-300"
                )}>
                  <span className="text-3xl filter drop-shadow-lg">{card.icon}</span>
                </div>
                
                {/* Title & Subtitle */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white leading-tight mb-1 tracking-tight">
                    {card.name.replace('Resolução de questão - ', '')}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
                    Resoluções Comentadas
                  </p>
                </div>
              </div>
              
              {/* ═══ STATS SECTION ═══ */}
              <div className="flex items-center gap-3 mb-5">
                {/* Módulos Badge */}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                  "border backdrop-blur-sm",
                  style.badge
                )}>
                  <Layers className="h-4 w-4" />
                  <span className="text-sm font-bold">{modules.length}</span>
                  <span className="text-xs opacity-80">módulos</span>
                </div>
                
                {/* Aulas Badge */}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                  "border backdrop-blur-sm",
                  style.badge
                )}>
                  <Video className="h-4 w-4" />
                  <span className="text-sm font-bold">{totalLessons}</span>
                  <span className="text-xs opacity-80">aulas</span>
                </div>
              </div>
              
              {/* ═══ NETFLIX PREMIUM CTA BUTTON ═══ */}
              <button className={cn(
                "relative w-full flex items-center justify-center gap-3 py-4 rounded-lg overflow-hidden",
                // Netflix Red Background
                "bg-[#E50914]",
                // Text styling
                "text-white font-black text-sm uppercase tracking-widest",
                // Shadows - Netflix glow
                "shadow-[0_4px_20px_rgba(229,9,20,0.5)]",
                "group-hover:shadow-[0_8px_35px_rgba(229,9,20,0.7)]",
                // Hover state
                "group-hover:bg-[#F40612]",
                // Scale on hover
                "group-hover:scale-[1.03]",
                // Transition
                "transform-gpu transition-all duration-300 ease-out"
              )}>
                {/* Shimmer effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                
                {/* Button content */}
                <PlayCircle className="relative h-5 w-5 fill-white drop-shadow-lg" />
                <span className="relative drop-shadow-lg">ASSISTIR AGORA</span>
                <ArrowRight className="relative h-5 w-5 drop-shadow-lg opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </button>
            </div>
            
            {/* ═══ CORNER ACCENT ═══ */}
            <div className={cn(
              "absolute bottom-0 right-0 w-24 h-24",
              "bg-gradient-to-tl opacity-5",
              style.iconBg.replace('from-', 'from-').replace('to-', 'to-'),
              "pointer-events-none"
            )} />
          </div>
        );
      })}
    </div>
  );
});
ResolucaoQuestoesMacroView.displayName = 'ResolucaoQuestoesMacroView';

// ============================================
// 📚 COURSE SECTION — NETFLIX PREMIUM CINEMATIC
// Card de curso com design cinematográfico Netflix Red
// ============================================
function CourseSection({
  course, 
  subcategoryGroups, 
  expandedModules,
  onToggleModule,
  onPlayLesson
}: {
  course: Course | null;
  subcategoryGroups: { subcategory: string | null; modules: Module[] }[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onPlayLesson: (lesson: Lesson) => void;
}) {
  // ✅ COLLAPSIBLE: Cursos iniciam ABERTOS (exibe subcategorias)
  const [isOpen, setIsOpen] = useState(true);
  const totalModules = subcategoryGroups.reduce((acc, g) => acc + g.modules.length, 0);
  const totalLessons = subcategoryGroups.reduce((acc, g) => 
    acc + g.modules.reduce((a, m) => a + (m._count?.lessons || 0), 0), 0);
  const totalSubcats = subcategoryGroups.length;

  return (
    <Card className={cn(
      "group/card relative overflow-hidden transition-all duration-500",
      "bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#1a0a0a]",
      "border-2 border-[#E50914]/40 hover:border-[#E50914]/70",
      "shadow-2xl shadow-[#E50914]/15 hover:shadow-[#E50914]/40",
      "rounded-3xl"
    )}>
      {/* Netflix style corner accents */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-[#E50914]/60 rounded-tl-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-[#E50914]/50 rounded-tr-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-[#E50914]/50 rounded-bl-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-[#E50914]/60 rounded-br-3xl pointer-events-none" />
      
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/0 via-transparent to-[#E50914]/0 group-hover/card:from-[#E50914]/8 group-hover/card:to-[#E50914]/5 transition-all duration-500 pointer-events-none" />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer relative z-10 py-6 px-6 bg-gradient-to-r from-[#E50914]/20 via-[#0a0e14]/80 to-[#E50914]/15 border-b-2 border-[#E50914]/25 hover:from-[#E50914]/30 hover:to-[#E50914]/25 transition-all duration-300">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Netflix-style icon orb */}
                <div className="relative">
                  <div className="absolute inset-0 bg-[#E50914]/50 rounded-2xl blur-2xl opacity-70 group-hover/card:opacity-100 transition-opacity" />
                  <div className="relative p-4 rounded-2xl bg-gradient-to-br from-[#E50914]/50 to-[#E50914]/35 border-2 border-[#E50914]/60 shadow-xl shadow-[#E50914]/40">
                    <GraduationCap className="h-8 w-8 text-[#FF6B6B]" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-3 flex-wrap text-white">
                    {course?.title || 'Sem Curso'}
                    <Badge className="px-3 py-1 text-sm bg-emerald-500/30 text-emerald-300 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20">
                      <Eye className="h-4 w-4 mr-1" />
                      ATIVO
                    </Badge>
                  </CardTitle>
                  
                  {/* Stats row - Netflix premium style */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-600/30">
                      <Layers className="h-4 w-4 text-slate-300" />
                      <span className="text-lg font-bold text-white">{totalModules}</span>
                      <span className="text-xs text-slate-400 uppercase tracking-wide">módulos</span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-600/30">
                      <FolderOpen className="h-4 w-4 text-slate-300" />
                      <span className="text-lg font-bold text-white">{totalSubcats}</span>
                      <span className="text-xs text-slate-400 uppercase tracking-wide">subcategorias</span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E50914]/25 border border-[#E50914]/40">
                      <PlayCircle className="h-4 w-4 text-[#E50914]" />
                      <span className="text-lg font-bold text-[#FF6B6B]">{totalLessons}</span>
                      <span className="text-xs text-[#E50914]/90 uppercase tracking-wide">aulas</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Toggle button - Spider-Man red */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-xl border-2 border-[#E50914]/50 bg-[#E50914]/15 hover:bg-[#E50914]/35 hover:border-[#E50914]/70 transition-all shadow-lg shadow-[#E50914]/20"
              >
                {isOpen ? <ChevronUp className="h-6 w-6 text-[#FF6B6B]" /> : <ChevronDown className="h-6 w-6 text-[#FF6B6B]" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-0 bg-gradient-to-b from-transparent to-[#0a0a0a]/50">
            {/* SCROLLABLE CONTENT RULE: Conteúdo acessível sem limite de altura */}
            <div className="p-5 space-y-5">
              {subcategoryGroups.map(({ subcategory, modules: groupModules }) => (
                <SubcategorySection
                  key={subcategory || 'default'}
                  subcategory={subcategory}
                  modules={groupModules}
                  expandedModules={expandedModules}
                  onToggleModule={onToggleModule}
                  onPlayLesson={onPlayLesson}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================
// 📂 SUBCATEGORY SECTION — YEAR 2300 CINEMATIC
// Agrupador visual com design holográfico
// ============================================
function SubcategorySection({
  subcategory,
  modules,
  expandedModules,
  onToggleModule,
  onPlayLesson
}: {
  subcategory: string | null;
  modules: Module[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onPlayLesson: (lesson: Lesson) => void;
}) {
  // ✅ COLLAPSIBLE: Subcategorias iniciam FECHADAS (módulos só aparecem após clique)
  const [isOpen, setIsOpen] = useState(false);
  const totalLessons = modules.reduce((a, m) => a + (m._count?.lessons || 0), 0);
  
  // 📊 PROGRESS: Buscar progresso de todos os módulos desta subcategoria (UMA única query)
  const moduleIds = useMemo(() => modules.map(m => m.id), [modules]);
  const { progressMap } = useModulesProgress(isOpen ? moduleIds : []);

  return (
    <div className="space-y-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          {/* 🎬 NETFLIX PREMIUM SUBCATEGORY BUTTON — Gradient Design */}
          <button
            type="button"
            className={cn(
              "group relative w-full flex items-center gap-4 px-5 py-4 cursor-pointer overflow-hidden",
              "rounded-xl transition-all duration-300 transform-gpu",
              // 🎨 GRADIENT BACKGROUND — Netflix Premium Dark Red
              "bg-gradient-to-r from-[#1a0505]/90 via-[#0d0d0d]/95 to-[#1a0505]/90",
              // 🔥 HOVER: Gradient shifts to brighter red
              "hover:from-[#2d0a0a]/95 hover:via-[#1a0808]/98 hover:to-[#2d0a0a]/95",
              // 📐 BORDER — Gradient border simulation with ring
              "ring-1 ring-[#E50914]/40 hover:ring-[#E50914]/70",
              // ✨ SHADOW — Cinematic glow
              "shadow-lg shadow-[#E50914]/10 hover:shadow-xl hover:shadow-[#E50914]/25",
              // 🚀 SCALE on hover
              "hover:scale-[1.01] active:scale-[0.995]",
              // STATE: Open
              isOpen && "ring-[#E50914]/60 from-[#2d0a0a]/95 via-[#1a0808]/98 to-[#2d0a0a]/95 shadow-xl shadow-[#E50914]/20"
            )}
          >
            {/* 🌟 Animated glow border overlay */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#E50914]/0 via-[#E50914]/10 to-[#E50914]/0" />
            </div>
            
            {/* 🔴 LEFT ACCENT — Netflix Red Bar with glow */}
            <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-[#E50914] via-[#FF4B4B] to-[#E50914] shadow-lg shadow-[#E50914]/50" />
            <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#E50914] blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
            
            {/* 📁 FOLDER ICON — Gradient orb */}
            <div className="relative z-10 flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br from-[#E50914]/30 to-[#E50914]/10 border border-[#E50914]/30 group-hover:from-[#E50914]/40 group-hover:to-[#E50914]/20 group-hover:border-[#E50914]/50 transition-all duration-300">
              <FolderOpen className="h-5 w-5 text-[#FF6B6B] group-hover:text-[#FF8080] transition-colors" />
            </div>
            
            {/* ▶️ CHEVRON — Smooth rotation */}
            <div className={cn(
              "relative z-10 text-[#E50914] transition-all duration-300",
              "group-hover:text-[#FF4B4B]",
              isOpen && "rotate-90"
            )}>
              <ChevronRight className="h-5 w-5" />
            </div>
            
            {/* 📝 TITLE — Netflix bold typography */}
            <span className="relative z-10 flex-1 text-left font-bold text-base md:text-lg text-gray-100 group-hover:text-white tracking-wide transition-colors duration-200 truncate">
              {subcategory || 'Geral'}
            </span>
            
            {/* 📊 STATS BADGES — Netflix pill style */}
            <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
              {/* Módulos count */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-700/60 border border-slate-600/40 text-sm">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-bold text-white">{modules.length}</span>
              </div>
              
              {/* Aulas count — Red accent */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#E50914]/25 to-[#E50914]/15 border border-[#E50914]/40 text-sm">
                <PlayCircle className="h-3.5 w-3.5 text-[#E50914]" />
                <span className="font-bold text-[#FF6B6B]">{totalLessons}</span>
              </div>
            </div>
            
            {/* 🎭 Bottom highlight line */}
            <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#E50914]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* 🎬 NETFLIX MODULES LIST — Refined container */}
          <div className="mt-3 ml-3 pl-4 border-l-2 border-gradient-to-b border-[#E50914]/20 space-y-2">
            {subcategory === 'Resolução de Questões' ? (
              <ResolucaoQuestoesMacroView
                allModules={modules}
                expandedModules={expandedModules}
                onToggleModule={onToggleModule}
                onPlayLesson={onPlayLesson}
                progressMap={progressMap}
              />
            ) : subcategory?.toLowerCase().includes('previsão final') ? (
              <DateLock releaseDate="31/08">
                <NetflixCarouselRow
                  modules={modules}
                  expandedModules={expandedModules}
                  onToggleModule={onToggleModule}
                  onPlayLesson={onPlayLesson}
                  progressMap={progressMap}
                />
              </DateLock>
            ) : (
              <NetflixCarouselRow
                modules={modules}
                expandedModules={expandedModules}
                onToggleModule={onToggleModule}
                onPlayLesson={onPlayLesson}
                progressMap={progressMap}
              />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// 🎬 NETFLIX ULTRA PREMIUM — Full-Width Section Layout
// Cada módulo ocupa uma seção horizontal completa
// Design cinematográfico estilo streaming premium
// ============================================
const NetflixCarouselRow = memo(function NetflixCarouselRow({
  modules,
  expandedModules,
  onToggleModule,
  onPlayLesson,
  progressMap
}: {
  modules: Module[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onPlayLesson: (lesson: Lesson) => void;
  progressMap: Map<string, ModuleProgressData>;
}) {
  return (
    <div className="space-y-2">
      {modules.map((module, idx) => (
        <NetflixModuleSection
          key={module.id}
          module={module}
          index={idx}
          isExpanded={expandedModules.has(module.id)}
          onToggle={() => onToggleModule(module.id)}
          onPlayLesson={onPlayLesson}
          progress={progressMap.get(module.id)}
        />
      ))}
    </div>
  );
});
NetflixCarouselRow.displayName = 'NetflixCarouselRow';

// ============================================
// 🎬 LAZY VIDEO ROW — Performance Optimized
// Lazy loads video lessons row only when visible in viewport
// ============================================
const LazyVideoRow = memo(function LazyVideoRow({
  lessons,
  rowIndex,
  totalRows,
  onPlayLesson,
  isLowEnd,
  scrollRef
}: {
  lessons: Lesson[];
  rowIndex: number;
  totalRows: number;
  onPlayLesson: (lesson: Lesson) => void;
  isLowEnd: boolean;
  scrollRef?: React.RefObject<HTMLDivElement>;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const rowLessons = useMemo(() => lessons.slice(rowIndex * 7, (rowIndex + 1) * 7), [lessons, rowIndex]);
  const rowNumber = rowIndex + 1;

  // Lazy load row via IntersectionObserver
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );

    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  // ══════════════════════════════════════════════════════════════
  // 🏛️ LEI SUPREMA: LAYOUT VERTICAL OBRIGATÓRIO EM TODOS OS DISPOSITIVOS
  // Aulas SEMPRE em grid vertical (scroll-y), NUNCA horizontal (scroll-x)
  // ══════════════════════════════════════════════════════════════
  return (
    <div ref={rowRef} className="relative">
      {/* Row Label (if multiple rows) */}
      {totalRows > 1 && (
        <div className="flex items-center gap-2 px-4 sm:px-6 mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Série {rowNumber}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-700/50 to-transparent" />
          <span className="text-xs text-slate-600 font-medium">
            {rowIndex * 7 + 1}–{Math.min((rowIndex + 1) * 7, lessons.length)} de {lessons.length}
          </span>
        </div>
      )}
      
      {/* Only render cards when visible — VERTICAL GRID (NEVER horizontal scroll) */}
      {isVisible ? (
        <div className="px-4 sm:px-6">
          {/* 
            GRID VERTICAL RESPONSIVO — LEI IMUTÁVEL
            Mobile: 1 coluna | SM: 2 colunas | MD: 3 colunas | LG: 4 colunas | XL+: 5 colunas
            Scroll vertical habilitado, horizontal PROIBIDO
          */}
          <div 
            ref={scrollRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4"
          >
            {rowLessons.map((lesson, idx) => (
              <NetflixEpisodeCard
                key={lesson.id}
                lesson={lesson}
                index={rowIndex * 7 + idx}
                onPlay={() => onPlayLesson(lesson)}
                isLowEnd={isLowEnd}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Skeleton placeholder while loading — VERTICAL GRID */
        <div className="px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: Math.min(6, rowLessons.length) }, (_, i) => (
              <div key={i} className="rounded-xl bg-slate-800/50 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
LazyVideoRow.displayName = 'LazyVideoRow';

// ============================================
// 🎬 NETFLIX MODULE SECTION — Full-Width Premium
// Módulo com thumbnail grande + carrossel de aulas
// ============================================
const NetflixModuleSection = memo(function NetflixModuleSection({ 
  module, 
  index, 
  isExpanded, 
  onToggle,
  onPlayLesson,
  progress
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayLesson: (lesson: Lesson) => void;
  progress?: ModuleProgressData;
}) {
  const { data: lessons, isLoading } = useModuleLessons(isExpanded ? module.id : null);
  const { shouldAnimate, isLowEnd } = useConstitutionPerformance();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 🛡️ HOOKS RULE FIX: useMemo MUST be called unconditionally (before any returns)
  const lessonRows = useMemo(() => {
    if (!lessons || lessons.length === 0) return [];
    const totalRows = Math.ceil(lessons.length / 7);
    return Array.from({ length: totalRows }, (_, rowIndex) => ({
      rowIndex,
      totalRows,
    }));
  }, [lessons]);

  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const ref = scrollRef.current;
    if (!ref) return;
    ref.addEventListener('scroll', updateScrollButtons, { passive: true });
    const timer = setTimeout(updateScrollButtons, 100);
    return () => {
      ref.removeEventListener('scroll', updateScrollButtons);
      clearTimeout(timer);
    };
  }, [updateScrollButtons, lessons]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -400 : 400,
      behavior: shouldAnimate ? 'smooth' : 'auto'
    });
  }, [shouldAnimate]);

  const isChronolocked = module.title?.toLowerCase().includes('resolução provas enem 2025');
  const lessonCount = module._count?.lessons || 0;
  const progressPercent = progress?.progressPercent || 0;

  const sectionContent = (
    <div 
      className="group/section relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* === MODULE SECTION — NETFLIX ULTRA CINEMATIC === */}
      <div 
        onClick={onToggle}
        className={cn(
          "group/module relative flex flex-row items-center w-full cursor-pointer overflow-hidden",
          "min-h-[280px] md:min-h-[340px] lg:min-h-[380px]",
          "bg-gradient-to-r from-black via-[#0c1929] to-black",
          "rounded-xl border transition-all duration-500",
          isExpanded 
            ? "border-cyan-400/60 shadow-2xl shadow-cyan-500/20"
            : "border-slate-800/60 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10"
        )}
      >
        {/* === CINEMATIC BACKGROUND EFFECTS === */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated gradient sweep */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent",
            "translate-x-[-100%] group-hover/module:translate-x-[100%] transition-transform duration-1000"
          )} />
          {/* Top light reflection */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          {/* Ambient glow */}
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full",
            "bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl",
            "opacity-0 group-hover/module:opacity-100 transition-opacity duration-700"
          )} />
        </div>
        
        {/* === LEFT SIDE — MODULE INFO (Premium Typography) === */}
        <div className="flex-1 flex flex-col justify-center items-end text-right py-6 md:py-8 pr-8 md:pr-12 lg:pr-16 min-w-0 z-10">
          
          {/* Module Number Badge - Cinematic */}
          <div className="mb-4 md:mb-5">
            <div className={cn(
              "relative inline-flex items-center gap-2 px-5 py-2 rounded-lg overflow-hidden",
              "bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-600",
              "shadow-2xl shadow-cyan-500/50"
            )}>
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/30" />
              <span className="relative text-sm md:text-base font-black uppercase tracking-[0.2em] text-white drop-shadow-lg">
                Módulo {String(module.position + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
          
          {/* Title - Cinematic (-20% font size) */}
          <h3 className={cn(
            "font-black text-base md:text-lg lg:text-xl xl:text-2xl text-white leading-[1.1] uppercase",
            "tracking-wide line-clamp-2 transition-all duration-300",
            "drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]",
            isHovered && "text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200"
          )}>
            {module.title}
          </h3>
          
          {/* Description - Elegant */}
          {module.description && (
            <p className={cn(
              "mt-3 md:mt-4 text-base md:text-lg text-slate-300/90 font-medium line-clamp-2 max-w-[500px]",
              "leading-relaxed tracking-wide"
            )}>
              {module.description}
            </p>
          )}
        </div>
        
        {/* === CENTER — MODULE THUMBNAIL (Hero Poster) === */}
        <div className={cn(
          "relative shrink-0 rounded-xl overflow-hidden z-10",
          "w-44 h-60 md:w-56 md:h-76 lg:w-64 lg:h-88 xl:w-72 xl:h-96",
          "bg-gradient-to-br from-purple-900/50 to-slate-900",
          "border-2 border-white/10",
          "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(139,92,246,0.3)]",
          !isLowEnd && "transition-all duration-500 ease-out",
          !isLowEnd && isHovered && "scale-[1.03] shadow-[0_25px_80px_-10px_rgba(0,0,0,0.95),0_0_60px_-10px_rgba(139,92,246,0.5)]"
        )}>
          {module.thumbnail_url ? (
            <img
              src={module.thumbnail_url}
              alt={module.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#E50914] via-[#D63031] to-[#B91C1C]">
              <Layers className="h-14 w-14 text-white/80" />
            </div>
          )}
          
          {/* Poster overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
          
          {/* Progress Bar - Cinematic */}
          {progressPercent > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/90">
              <div 
                className={cn(
                  "h-full rounded-r transition-all duration-500",
                  progressPercent >= 100 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/50" 
                    : "bg-gradient-to-r from-[#E50914] to-[#FF4444] shadow-lg shadow-[#E50914]/50"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
        
        {/* === RIGHT SIDE — VIDEOAULAS + ACTIONS (Command Center) === */}
        <div className="flex-1 flex flex-col justify-center items-start text-left py-6 md:py-8 pl-8 md:pl-12 lg:pl-16 min-w-0 z-10">
          
          {/* Videoaulas Counter - Premium Badge */}
          <div className="flex items-center gap-3 mb-5 md:mb-6">
            <div className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
              "border border-slate-600/50 shadow-xl shadow-black/50"
            )}>
              <Play className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                {lessonCount}
              </span>
              <span className="text-sm md:text-base text-slate-400 font-semibold uppercase tracking-widest -mt-1">
                Videoaulas
              </span>
            </div>
          </div>
          
          {/* Progress Status - Premium Indicator */}
          {progressPercent > 0 && (
            <div className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-base md:text-lg font-bold mb-5 md:mb-6",
              "backdrop-blur-sm transition-all duration-300",
              progressPercent >= 100
                ? "bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/50 shadow-xl shadow-emerald-500/30"
                : "bg-slate-800/80 text-slate-200 border border-slate-600/50"
            )}>
              {progressPercent >= 100 ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="uppercase tracking-wider">Concluído</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span>{progressPercent}% completo</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons - Cinematic Command Panel */}
          <div className="flex items-center gap-4 flex-wrap">
            
            {/* Toggle Episodes - Ghost Premium */}
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={cn(
                "h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold rounded-xl",
                "bg-slate-900/90 border-2 backdrop-blur-sm",
                "transition-all duration-300 uppercase tracking-wider",
                isExpanded
                  ? "text-cyan-300 border-cyan-400/60 shadow-xl shadow-cyan-500/30 hover:bg-cyan-500/20"
                  : "text-slate-200 border-slate-600/60 hover:text-cyan-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20"
              )}
            >
              <ChevronDown className={cn(
                "w-5 h-5 mr-2 transition-transform duration-500",
                isExpanded && "rotate-180"
              )} />
              {isExpanded ? 'Ocultar' : 'Ver Videoaulas'}
            </Button>
            
            {/* Watch Now - Netflix RED Cinematic - FUNCIONA COMO "VER VIDEOAULAS" */}
            {lessonCount > 0 && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  // Se já expandido e temos aulas, toca a primeira
                  if (isExpanded && lessons && lessons.length > 0) {
                    onPlayLesson(lessons[0]);
                  } else {
                    // Se não está expandido, expande primeiro (mesma ação que "Ver Videoaulas")
                    onToggle();
                  }
                }}
                className={cn(
                  "relative h-12 md:h-14 px-7 md:px-10 text-base md:text-lg font-black uppercase tracking-widest rounded-xl",
                  "bg-gradient-to-r from-[#E50914] via-[#D63031] to-[#E50914] text-white border-0",
                  "hover:from-[#FF4444] hover:via-[#E50914] hover:to-[#FF4444]",
                  "shadow-2xl shadow-[#E50914]/60 hover:shadow-[#E50914]/80",
                  "transition-all duration-300 overflow-hidden group/btn"
                )}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                <Play className="w-5 h-5 md:w-6 md:h-6 mr-2 relative" fill="currentColor" />
                <span className="relative">Assistir</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* === VIDEO LESSONS GALLERY — NETFLIX PREMIUM === */}
      {isExpanded && (
        <div className={cn(
          "relative mt-4 rounded-2xl overflow-visible",
          "bg-gradient-to-b from-[#0c1018] via-[#0a0e14] to-[#080c10]",
          "border border-slate-800/60",
          "shadow-2xl shadow-black/50",
          shouldAnimate && "animate-fade-in"
        )}>
          {/* Section Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#E50914] to-[#B20710]" />
              <div>
                <h4 className="text-lg md:text-xl font-bold text-white tracking-wide">Videoaulas</h4>
                <p className="text-sm text-slate-400 font-medium">{lessonCount} disponíveis neste módulo</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Video className="w-5 h-5" />
              <span className="text-sm font-semibold hidden sm:inline">Scroll para navegar</span>
            </div>
          </div>
          
          {/* Lessons Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#E50914] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                <span className="text-base font-semibold">Carregando videoaulas...</span>
              </div>
            </div>
          ) : lessons && lessons.length > 0 ? (
            <div className="py-6 space-y-6">
              {/* Split lessons into rows of 7 - using pre-calculated lessonRows */}
              {lessonRows.map(({ rowIndex, totalRows }) => (
                <LazyVideoRow
                  key={`row-${rowIndex}`}
                  lessons={lessons}
                  rowIndex={rowIndex}
                  totalRows={totalRows}
                  onPlayLesson={onPlayLesson}
                  isLowEnd={isLowEnd}
                  scrollRef={rowIndex === 0 ? scrollRef : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <Video className="h-10 w-10 opacity-40" />
              </div>
              <span className="text-lg font-semibold">Nenhuma videoaula disponível</span>
              <span className="text-sm text-slate-600 mt-1">Este módulo ainda não possui conteúdo</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isChronolocked) {
    return (
      <Chronolock message="EM BREVE" subtitle="31/01" variant="warning">
        {sectionContent}
      </Chronolock>
    );
  }

  return sectionContent;
});
NetflixModuleSection.displayName = 'NetflixModuleSection';

// ============================================
// 🎬 NETFLIX EPISODE CARD — Ultra Premium Cinematic Design
// PERFORMANCE OPTIMIZED: Lazy loading, memoization, CSS-only effects
// ============================================
const NetflixEpisodeCard = memo(function NetflixEpisodeCard({ 
  lesson, 
  index,
  onPlay,
  isLowEnd
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
  isLowEnd: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasVideo = lesson.panda_video_id || lesson.video_url || lesson.youtube_video_id;
  const episodeNumber = index + 1;
  
  // 🎬 UNIVERSAL THUMBNAIL: Panda + YouTube CDN (lazy, ~30-80KB)
  const thumbnailUrl = useMemo(() => getThumbnailUrl(lesson), [lesson]);

  // Lazy loading via IntersectionObserver - only load when visible
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Handle click with individual animation
  const handleClick = () => {
    setIsClicked(true);
    // Trigger animation, then call onPlay after brief delay
    setTimeout(() => {
      onPlay();
      setIsClicked(false);
    }, 150);
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className={cn(
        "relative flex-shrink-0 cursor-pointer group/card",
        "w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px]",
        "rounded-xl overflow-hidden",
        // Only animate on hover, NOT on layout changes - removes global transition
        "hover:z-20",
        // Individual click animation - only this card scales
        isClicked && "scale-[0.95] transition-transform duration-150 ease-out",
        !isClicked && "hover:scale-[1.05] transition-transform duration-200 ease-out"
      )}
    >
      {/* === CARD CONTAINER === */}
      <div className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-b from-slate-900 to-slate-950",
        "border shadow-xl transition-all duration-200",
        // Hover sutil (cinza claro) - NÃO vermelho
        "border-slate-700/50 shadow-black/40",
        "group-hover/card:border-slate-500/60 group-hover/card:shadow-slate-500/20",
        // Netflix Red APENAS no clicado
        isClicked && "border-[#E50914]/80 shadow-2xl shadow-[#E50914]/40"
      )}>
        
        {/* === THUMBNAIL SECTION === */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
          {/* 🎬 UNIVERSAL THUMBNAIL: Panda + YouTube CDN (lazy, ~30-80KB) */}
          {isVisible && thumbnailUrl && !thumbnailError ? (
            <img
              src={thumbnailUrl}
              alt={lesson.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 180px, (max-width: 768px) 200px, (max-width: 1024px) 220px, 240px"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#E50914]/30 via-slate-900 to-slate-950">
              <div className="relative">
                <Video className="h-12 w-12 text-slate-600" />
                <div className="absolute -inset-4 rounded-full border border-slate-700/50" />
              </div>
            </div>
          )}
          
          {/* Dark Overlay - CSS only hover */}
          <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/40 transition-colors duration-300" />
          
          {/* Episode Number Badge */}
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-slate-600/50">
              <span className="text-[10px] text-slate-400 font-bold">EP</span>
              <span className="text-sm font-black text-white tabular-nums">
                {String(episodeNumber).padStart(2, '0')}
              </span>
            </div>
          </div>
          
          {/* Duration Badge */}
          {lesson.duration_minutes && (
            <div className="absolute top-2 right-2">
              <div className="px-2 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-slate-600/50">
                <span className="text-xs font-bold text-slate-300">{lesson.duration_minutes} min</span>
              </div>
            </div>
          )}
          
          {/* Play Button Overlay - Hover sutil */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              "bg-white/90 shadow-xl",
              "border-2 border-white/40",
              "group-hover/card:scale-105 transition-transform duration-200"
            )}>
              <Play className="h-6 w-6 text-slate-900 ml-0.5" fill="currentColor" />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
            <div className="h-full w-1/3 bg-gradient-to-r from-[#E50914] to-[#FF4444] rounded-r" />
          </div>
        </div>
        
        {/* === INFO SECTION === */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h4 className="font-bold text-sm md:text-base leading-tight line-clamp-2 min-h-[2.5rem] text-slate-200 group-hover/card:text-white transition-colors duration-200">
            {lesson.title}
          </h4>
          
          {/* Meta Info Row */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E50914]/25 text-[#FF6B6B] border border-[#E50914]/40">
              Videoaula
            </span>
            {hasVideo && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                HD
              </span>
            )}
          </div>
          
          {/* Watch Button - Netflix RED Always */}
          <button
            type="button"
            className="w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-[#E50914] to-[#FF4444] text-white border-0 shadow-lg shadow-[#E50914]/40 hover:from-[#FF4444] hover:to-[#E50914] hover:shadow-[#E50914]/60 transition-all duration-300"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Assistir Agora
          </button>
        </div>
        
        {/* Glow Effect - Netflix Red APENAS no clicado */}
        <div className={cn(
          "absolute inset-0 rounded-xl pointer-events-none transition-all duration-200",
          isClicked ? "ring-2 ring-[#E50914]/70" : "ring-0"
        )} />
      </div>
    </div>
  );
});
NetflixEpisodeCard.displayName = 'NetflixEpisodeCard';

// ============================================
// 🎬 NETFLIX LESSON CARD — Card Horizontal para Carousel
// Design cinematográfico com thumbnail + info
// ============================================
const NetflixLessonCard = memo(function NetflixLessonCard({ 
  lesson, 
  index,
  onPlay,
  shouldAnimate,
  isLowEnd
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
  shouldAnimate: boolean;
  isLowEnd: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasVideo = lesson.panda_video_id || lesson.video_url || lesson.youtube_video_id;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 cursor-pointer",
        "w-[200px] sm:w-[220px] md:w-[240px]",
        !isLowEnd && "transition-all duration-300",
        !isLowEnd && isHovered && "scale-105 z-10"
      )}
      onMouseEnter={() => !isLowEnd && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
    >
      <div className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br from-slate-800 to-slate-900",
        "border-2 transition-all duration-200",
        isHovered 
          ? "border-green-400/80 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
          : "border-slate-700/50 shadow-lg shadow-black/40"
      )}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {lesson.thumbnail_url ? (
            <img
              src={lesson.thumbnail_url}
              alt={lesson.title}
              className={cn(
                "absolute inset-0 w-full h-full object-cover",
                "transition-all duration-300",
                imageLoaded ? "opacity-100" : "opacity-0",
                !isLowEnd && isHovered && "scale-110"
              )}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900/30 to-cyan-900/30">
              <Video className="h-8 w-8 text-green-400/50" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300",
            isHovered 
              ? "bg-gradient-to-t from-black via-black/40 to-transparent"
              : "bg-gradient-to-t from-black/80 via-transparent to-transparent"
          )} />
          
          {/* Index badge */}
          <div className="absolute top-2 left-2">
            <span className="w-6 h-6 flex items-center justify-center rounded bg-green-500/90 text-white text-xs font-bold">
              {index + 1}
            </span>
          </div>
          
          {/* Duration badge */}
          {lesson.duration_minutes && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded text-xs bg-black/80 text-white flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.duration_minutes}min
              </span>
            </div>
          )}
          
          {/* Play button overlay */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <div className={cn(
              "p-4 rounded-full",
              "bg-green-500 text-white",
              "shadow-[0_0_30px_rgba(74,222,128,0.5)]",
              !isLowEnd && "animate-pulse"
            )}>
              <Play className="h-6 w-6" fill="white" />
            </div>
          </div>
          
          {/* Title at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h5 className={cn(
              "font-semibold text-white text-sm leading-tight",
              isHovered ? "line-clamp-3" : "line-clamp-2"
            )}>
              {lesson.title}
            </h5>
          </div>
        </div>
        
        {/* Hover info panel */}
        {!isLowEnd && isHovered && (
          <div className="p-3 bg-slate-900/95 border-t border-green-500/20 animate-fade-in">
            <div className="flex items-center gap-2">
              {hasVideo && (
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                  HD
                </span>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                Assistir
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
NetflixLessonCard.displayName = 'NetflixLessonCard';

// ============================================
// 🎬 NETFLIX MODULE CARD — LEGACY (for compatibility)
// Agora usa NetflixModuleSectionRow internally
// ============================================
const NetflixModuleCard = memo(function NetflixModuleCard({ 
  module, 
  index, 
  isExpanded, 
  onToggle,
  onPlayLesson,
  progress,
  isLowEnd,
  shouldAnimate,
  shouldBlur
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayLesson: (lesson: Lesson) => void;
  progress?: ModuleProgressData;
  isLowEnd: boolean;
  shouldAnimate: boolean;
  shouldBlur: boolean;
}) {
  // Legacy component now redirects to section row
  return null;
});
NetflixModuleCard.displayName = 'NetflixModuleCard';

// ============================================
// 🎬 NETFLIX LESSON ROW — Compact list item
// ============================================
const NetflixLessonRow = memo(function NetflixLessonRow({ 
  lesson, 
  index,
  onPlay
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className={cn(
        "w-full flex items-center gap-3 px-2 py-2 text-left rounded-lg",
        "hover:bg-cyan-500/20 transition-colors group"
      )}
    >
      <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-cyan-500/20 text-cyan-400 text-xs font-bold">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white group-hover:text-cyan-300 truncate transition-colors">
          {lesson.title}
        </p>
        {lesson.duration_minutes && (
          <p className="text-xs text-gray-500">{lesson.duration_minutes}min</p>
        )}
      </div>
      <Play className="h-4 w-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
    </button>
  );
});
NetflixLessonRow.displayName = 'NetflixLessonRow';

// ============================================
// 📦 MODULE CARD — LEGACY GRID VIEW (kept for compatibility)
// ============================================
const ModuleCard = memo(function ModuleCard({ 
  module, 
  index, 
  isExpanded, 
  onToggle,
  onPlayLesson,
  progress
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayLesson: (lesson: Lesson) => void;
  progress?: ModuleProgressData;
}) {
  return (
    <NetflixModuleCard
      module={module}
      index={index}
      isExpanded={isExpanded}
      onToggle={onToggle}
      onPlayLesson={onPlayLesson}
      progress={progress}
      isLowEnd={false}
      shouldAnimate={true}
      shouldBlur={true}
    />
  );
});
ModuleCard.displayName = 'ModuleCard';

// ============================================
// 🎬 LESSON CARD — CARD GRID ORIGINAL
// Design como no print: thumbnail + número + título + botão assistir
// PERFORMANCE: Memoizado para evitar re-renders
// ============================================
const LessonCard = memo(function LessonCard({ 
  lesson, 
  index,
  onPlay
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const hasValidThumbnail = lesson.thumbnail_url && !imageError;

  return (
    <div
      onClick={onPlay}
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden cursor-pointer",
        "bg-gradient-to-br from-slate-800/90 via-cyan-900/30 to-slate-800/90",
        "border-2 border-cyan-500/30 hover:border-cyan-400/70",
        "hover:shadow-[0_0_25px_rgba(34,211,238,0.2)]",
        "transition-all duration-300 hover:scale-[1.02]"
      )}
    >
      {/* ✨ Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-xl pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-xl pointer-events-none z-10" />
      
      {/* 🖼️ Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {hasValidThumbnail ? (
          <img
            src={lesson.thumbnail_url!}
            alt=""
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/50 to-blue-900/50">
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <Play className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* 🔢 Lesson number — Premium badge */}
        <div className="absolute top-2 left-2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/40 blur-sm rounded-lg" />
            <span className="relative px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs font-black border border-cyan-300/50 shadow-lg">
              #{String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
        
        {/* ⏱️ Duration badge */}
        {lesson.duration_minutes && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold border border-white/20 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lesson.duration_minutes}min
            </span>
          </div>
        )}
        
        {/* ▶️ Play button — Centered, pulsing */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "relative p-4 rounded-2xl transition-all duration-300",
            "bg-gradient-to-br from-green-500 to-emerald-600",
            "border-2 border-green-300/50",
            "shadow-[0_0_30px_rgba(34,197,94,0.4)]",
            "opacity-90 group-hover:opacity-100 group-hover:scale-110"
          )}>
            <div className="absolute inset-0 bg-green-400/30 rounded-2xl blur-xl animate-pulse" />
            <Play className="relative h-6 w-6 text-white" fill="white" />
          </div>
        </div>
      </div>
      
      {/* 📝 Content */}
      <div className="p-3 flex-1 flex flex-col gap-2 bg-gradient-to-b from-transparent to-slate-900/50">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-cyan-300 transition-colors">
          {lesson.title}
        </p>
        
        {/* Action bar */}
        <div className="mt-auto pt-2 border-t border-cyan-500/20">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold uppercase tracking-wider">
              <Video className="h-3.5 w-3.5" />
              Videoaula
            </span>
            <span className="flex items-center gap-1 text-xs text-green-400 font-bold group-hover:text-green-300 transition-colors">
              Assistir
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
LessonCard.displayName = 'LessonCard';

// ============================================
// 🎬 LESSON ROW — LISTA VERTICAL COMPACTA (LEGACY)
// Design clean: thumbnail pequena + título + duração
// PERFORMANCE: Memoizado para evitar re-renders
// ============================================
const LessonRow = memo(function LessonRow({ 
  lesson, 
  index,
  onPlay
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '--';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}min`;
    return `${mins}min`;
  };

  const hasValidThumbnail = lesson.thumbnail_url && !imageError;

  return (
    <button
      onClick={onPlay}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 text-left",
        "hover:bg-cyan-500/10 transition-colors duration-150",
        "group cursor-pointer"
      )}
    >
      {/* Número da aula */}
      <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 text-xs font-bold">
        {index + 1}
      </span>
      
      {/* Thumbnail pequena (opcional) */}
      <div className="shrink-0 w-16 h-10 rounded-md overflow-hidden bg-cyan-900/30">
        {hasValidThumbnail ? (
          <img
            src={lesson.thumbnail_url!}
            alt=""
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-4 w-4 text-cyan-500/50" />
          </div>
        )}
      </div>
      
      {/* Título */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">
          {lesson.title}
        </p>
        {lesson.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lesson.description}
          </p>
        )}
      </div>
      
      {/* Duração */}
      <div className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDuration(lesson.duration_minutes)}</span>
      </div>
      
      {/* Play icon on hover */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-1.5 rounded-full bg-green-500/20 text-green-400">
          <Play className="h-3.5 w-3.5 fill-current" />
        </div>
      </div>
    </button>
  );
});

LessonRow.displayName = 'LessonRow';

// ============================================
// VIEW STATE TYPES
// ============================================
type ViewMode = 'hub' | 'filtered';

interface ViewState {
  mode: ViewMode;
  selectedCardId: string | null;
  selectedCardName: string | null;
  allowedSubcategories: string[];
}

// ============================================
// MAIN COMPONENT
// ============================================
function AlunoCoursesHierarchy() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const [busca, setBusca] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  
  // HUB VIEW STATE
  const [viewState, setViewState] = useState<ViewState>({
    mode: 'hub',
    selectedCardId: null,
    selectedCardName: null,
    allowedSubcategories: []
  });

  // Handle card selection from Hub
  const handleSelectCard = useCallback((cardId: string, subcategories: string[]) => {
    const card = COURSE_HUB_CARDS.find(c => c.id === cardId);
    setViewState({
      mode: 'filtered',
      selectedCardId: cardId,
      selectedCardName: card?.name || '',
      allowedSubcategories: subcategories
    });
    setBusca('');
  }, []);

  // Back to hub
  const handleBackToHub = useCallback(() => {
    setViewState({
      mode: 'hub',
      selectedCardId: null,
      selectedCardName: null,
      allowedSubcategories: []
    });
    setBusca('');
  }, []);

  // Realtime sync
  useLMSRealtime();

  const { data: modules, isLoading: loadingModules } = usePublishedModules();
  const { data: courses } = usePublishedCourses();
  const { data: subcategoryOrdering } = useSubcategoryOrdering();

  // Agrupar por Curso → Subcategoria → Módulos (FILTRADO pelo Hub selecionado)
  const groupedData = useMemo(() => {
    if (!modules) return [];

    // Primeiro filtro: por subcategorias permitidas do Hub selecionado
    let filtered = modules;
    
    if (viewState.mode === 'filtered' && viewState.allowedSubcategories.length > 0) {
      filtered = modules.filter(m => 
        m.subcategory && viewState.allowedSubcategories.includes(m.subcategory)
      );
    }

    // Segundo filtro: busca textual
    if (busca) {
      const term = busca.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(term) || 
        m.course?.title.toLowerCase().includes(term) ||
        m.subcategory?.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term)
      );
    }

    const courseMap = new Map<string, { course: Course | null; subcategoryGroups: Map<string | null, Module[]> }>();

    filtered.forEach(module => {
      const courseId = module.course_id;
      const courseData = module.course || null;
      
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, { course: courseData, subcategoryGroups: new Map() });
      }

      const courseEntry = courseMap.get(courseId)!;
      const subcat = module.subcategory;

      if (!courseEntry.subcategoryGroups.has(subcat)) {
        courseEntry.subcategoryGroups.set(subcat, []);
      }
      courseEntry.subcategoryGroups.get(subcat)!.push(module);
    });

    // Criar mapa de posições a partir da tabela subcategory_ordering
    const getSubcatPosition = (courseId: string, subcategory: string | null): number => {
      if (!subcategory || !subcategoryOrdering) return 999999;
      const found = subcategoryOrdering.find(
        o => o.course_id === courseId && o.subcategory === subcategory
      );
      return found?.position ?? 999999;
    };

    return Array.from(courseMap.entries()).map(([courseId, data]) => ({
      courseId,
      course: data.course,
      subcategoryGroups: Array.from(data.subcategoryGroups.entries())
        .map(([subcat, mods]) => ({ subcategory: subcat, modules: mods }))
        .sort((a, b) => {
          const posA = getSubcatPosition(courseId, a.subcategory);
          const posB = getSubcatPosition(courseId, b.subcategory);
          if (posA !== posB) return posA - posB;
          return (a.subcategory || 'ZZZ').localeCompare(b.subcategory || 'ZZZ', 'pt-BR');
        })
    }));
  }, [modules, busca, subcategoryOrdering, viewState.mode, viewState.allowedSubcategories]);

  // Stats
  const stats = useMemo(() => {
    if (!modules) return { courses: 0, subcategories: 0, modules: 0, lessons: 0 };
    
    const uniqueCourses = new Set(modules.map(m => m.course_id)).size;
    const uniqueSubcats = new Set(modules.map(m => m.subcategory || 'default')).size;
    const totalLessons = modules.reduce((a, m) => a + (m._count?.lessons || 0), 0);

    return {
      courses: uniqueCourses,
      subcategories: uniqueSubcats,
      modules: modules.length,
      lessons: totalLessons
    };
  }, [modules]);

  // Auto-expand first module when entering filtered mode
  useEffect(() => {
    if (viewState.mode === 'filtered' && groupedData.length > 0) {
      const firstCourse = groupedData[0];
      if (firstCourse?.subcategoryGroups?.length > 0) {
        const firstSubcat = firstCourse.subcategoryGroups[0];
        if (firstSubcat?.modules?.length > 0) {
          const firstModule = firstSubcat.modules[0];
          if (firstModule?.id) {
            setExpandedModules(new Set([firstModule.id]));
          }
        }
      }
    }
  }, [viewState.mode, groupedData]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Video player helpers
  const extractYouTubeVideoId = (raw: string): string => {
    const s = (raw || '').trim();
    if (!s) return '';

    // Se já parece um ID do YouTube (11 chars), retorna direto
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

    // Tentar extrair de URL
    try {
      const u = new URL(s);
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      // youtu.be/<id>
      if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.replace('/', '');
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }

      // youtube.com/embed/<id>
      const embedMatch = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch?.[1]) return embedMatch[1];
    } catch {
      // ignore
    }

    return '';
  };

  // ✅ PADRÃO SOBERANO v2400 — Usa função centralizada com guard de integridade
  const getVideoType = (lesson: Lesson): "youtube" | "panda" => {
    const result = getVideoTypeWithIntegrityGuard(lesson);
    // Normalizar para o tipo esperado (sem vimeo aqui)
    return result === 'vimeo' ? 'youtube' : result;
  };

  const getVideoId = (lesson: Lesson): string => {
    const type = getVideoType(lesson);

    if (type === "panda") {
      const fromId = lesson.panda_video_id || "";
      if (fromId) return fromId;

      // Panda pode estar salvo apenas em video_url (UUID ou URL embed completa)
      const raw = (lesson.video_url || '').trim();
      if (!raw) return "";

      // Se vier URL, normaliza para extrair o v=... (id do Panda) quando aplicável.
      if (looksLikeUrl(raw)) return normalizePandaVideoId(raw);
      return normalizePandaVideoId(raw);
    }

    // YouTube pode estar salvo como video_url (URL completa) sem youtube_video_id
    const fromId = lesson.youtube_video_id || "";
    if (fromId) return fromId;

    const fromUrl = lesson.video_url ? extractYouTubeVideoId(lesson.video_url) : "";
    if (fromUrl) return fromUrl;

    // Fallback legado: alguns registros antigos podem ter panda_video_id preenchido
    return lesson.panda_video_id || "";
  };

  const handlePlayLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  const closePlayer = () => {
    setSelectedLesson(null);
  };

  return (
    <div className="space-y-6">
      {/* Video Player Modal - SCROLLABLE CONTENT RULE */}
      <Dialog open={!!selectedLesson} onOpenChange={(open) => !open && closePlayer()}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] flex flex-col p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-xl border-2 border-purple-500/30">
          {selectedLesson && (
            <>
              {/* Fixed Header */}
              <DialogHeader className="shrink-0 px-6 py-4 border-b-2 border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-card to-cyan-500/10">
                <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
                    <Video className="h-6 w-6 text-purple-300" />
                  </div>
                  <span className="line-clamp-1">{selectedLesson.title}</span>
                </DialogTitle>
              </DialogHeader>
              
              {/* Scrollable Body */}
              <DialogBody className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
                {/* Video Player */}
                <div className="aspect-video rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
                  <OmegaFortressPlayer
                    videoId={getVideoId(selectedLesson)}
                    type={getVideoType(selectedLesson)}
                    title={selectedLesson.title}
                    thumbnail={selectedLesson.thumbnail_url || undefined}
                    lessonId={selectedLesson.id}
                    showSecurityBadge
                    showWatermark
                    autoplay={false}
                  />
                </div>

                {/* Lesson Tabs */}
                <div className="rounded-2xl border-2 border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <LessonTabs 
                    lessonId={selectedLesson.id}
                    lessonTitle={selectedLesson.title}
                  />
                </div>

                {/* Description */}
                {selectedLesson.description && (
                  <Card className="bg-gradient-to-br from-card via-card to-purple-950/10 border-2 border-border/30 rounded-2xl">
                    <CardHeader className="pb-2 border-b border-border/20">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-400" />
                        Sobre esta aula
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {selectedLesson.description}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CONDITIONAL VIEW: HUB or FILTERED */}
      {/* CONDITIONAL VIEW: HUB or FILTERED - STATIC VERSION */}
      {viewState.mode === 'hub' ? (
        <div key="hub">
          <CoursesHub onSelectCard={handleSelectCard} />
        </div>
      ) : (
        <div key="filtered" className="space-y-6">
          {/* Back Button + Header */}
          <>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={handleBackToHub}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </Button>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{viewState.selectedCardName}</h2>
                <p className="text-sm text-muted-foreground">
                  {viewState.allowedSubcategories.length} subcategoria{viewState.allowedSubcategories.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar módulo ou aula..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
          </>

          {/* Content padrão para todos os Hubs */}
          {loadingModules ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i} className="opacity-50">
                  <CardHeader className="bg-muted/10">
                    <div className="h-12 bg-muted/30 rounded-lg" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : groupedData.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-xl border-border/30">
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">Nenhum conteúdo encontrado</h3>
              <p className="text-muted-foreground mt-2">
                {busca ? 'Nenhum resultado para sua busca.' : 'As aulas aparecerão aqui quando forem publicadas.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedData.map(({ courseId, course, subcategoryGroups }) => (
                <CourseSection
                  key={courseId}
                  course={course}
                  subcategoryGroups={subcategoryGroups}
                  expandedModules={expandedModules}
                  onToggleModule={toggleModule}
                  onPlayLesson={handlePlayLesson}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AlunoCoursesHierarchy;
