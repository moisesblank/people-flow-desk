// ============================================
// 🎬 GESTÃO VIDEOAULAS v2300
// CRUD completo + Panda Video + YouTube
// Sincronizado em tempo real com /alunos/videoaulas
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { 
  Video, Plus, Search, Filter, Play, Pause, Edit2, Trash2, 
  Eye, EyeOff, Clock, BookOpen, Upload, Youtube, Tv,
  ChevronDown, MoreVertical, ExternalLink, Copy, Check,
  TrendingUp, Users, Zap, RefreshCw, Settings2, Layers,
  GripVertical, ArrowUpDown, BarChart3, QrCode, Bomb, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X
} from "lucide-react";
import { OmegaFortressPlayer } from "@/components/video/OmegaFortressPlayer";
import { getVideoTypeWithIntegrityGuard } from "@/lib/video/detectVideoProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatError } from "@/lib/utils/formatError";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { LegacyQRImportDialog } from "@/components/gestao/videoaulas/LegacyQRImportDialog";
import { BulkOrganizationImportDialog } from "@/components/gestao/videoaulas/BulkOrganizationImportDialog";
import { VideoLinkImportDialog } from "@/components/gestao/videoaulas/VideoLinkImportDialog";
import { LessonFullConfigDialog } from "@/components/gestao/videoaulas/LessonFullConfigDialog";
import { VirtualizedVideoaulaList } from "@/components/gestao/videoaulas/VirtualizedVideoaulaList";
import { VideoOverlayConfigDialog } from "@/components/gestao/videoaulas/VideoOverlayConfigDialog";

type VideoProvider = 'panda' | 'youtube' | 'vimeo' | 'upload';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_provider: VideoProvider;
  panda_video_id: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  position: number | null;
  is_free: boolean;
  is_published: boolean;
  views_count: number;
  likes_count: number;
  module_id: string;
  area_id: string | null;
  legacy_qr_id: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  module?: { id: string; title: string };
  area?: { id: string; name: string };
}

interface Module {
  id: string;
  title: string;
  description: string | null;
}

interface Area {
  id: string;
  name: string;
}

// Hook para buscar videoaulas
function useVideoaulas() {
  return useQuery({
    queryKey: ['gestao-videoaulas'],
    queryFn: async () => {
      // Fetch all lessons with pagination to bypass 1000 row limit
      const allLessons: Lesson[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('lessons')
          .select(`
            *,
            module:modules(id, title),
            area:areas(id, name)
          `)
          .order('position', { ascending: true })
          .range(from, to);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allLessons.push(...(data as unknown as Lesson[]));
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      return allLessons;
    }
  });
}

// Hook para estatísticas via RPC (sem limite de 1000)
function useVideoaulasStats() {
  return useQuery({
    queryKey: ['gestao-videoaulas-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_videoaulas_stats');
      if (error) throw error;
      return data?.[0] || {
        total_aulas: 0,
        aulas_publicadas: 0,
        aulas_panda: 0,
        aulas_youtube: 0,
        total_views: 0,
        total_minutes: 0
      };
    },
    staleTime: 10000 // 10s
  });
}

// Hook para buscar módulos
function useModules() {
  return useQuery({
    queryKey: ['gestao-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, description')
        .order('title');
      
      if (error) throw error;
      return (data || []) as Module[];
    }
  });
}

// Hook para buscar áreas
function useAreas() {
  return useQuery({
    queryKey: ['gestao-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Area[];
    }
  });
}

// Componente principal
export default function GestaoVideoaulas() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterPublished, setFilterPublished] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isVideoLinkImportOpen, setIsVideoLinkImportOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Paginação v2300 - 25 itens por página
  const ITEMS_PER_PAGE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Aniquilação Total state
  const [isAnnihilateOpen, setIsAnnihilateOpen] = useState(false);
  const [annihilateConfirmText, setAnnihilateConfirmText] = useState("");
  const [annihilateCheckbox, setAnnihilateCheckbox] = useState(false);
  const [isAnnihilating, setIsAnnihilating] = useState(false);
  
  // 🎬 Modal de preview de vídeo
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  
  // 🎛️ Modal de configuração completa
  const [configLesson, setConfigLesson] = useState<Lesson | null>(null);
  
  // 🆕 OVERLAY: Modal de configuração do disclaimer
  const [isOverlayConfigOpen, setIsOverlayConfigOpen] = useState(false);

  const { data: lessons, isLoading, refetch } = useVideoaulas();
  const { data: statsData, refetch: refetchStats } = useVideoaulasStats();
  const { data: modules } = useModules();
  const { data: areas } = useAreas();

  // ============================================
  // AUDIT LOG F: Frontend Rendering Diagnostics
  // ============================================
  useEffect(() => {
    if (lessons && lessons.length > 0) {
      const sample = lessons[0];
      console.log('[AUDIT-F] Lessons loaded:', {
        count: lessons.length,
        first_lesson: {
          id: sample.id,
          title: sample.title,
          provider: sample.video_provider,
          legacy_qr_id: sample.legacy_qr_id,
          module_id: sample.module_id,
          youtube_id: sample.youtube_video_id,
          panda_id: sample.panda_video_id
        }
      });
    } else if (!isLoading) {
      console.warn('[AUDIT-F] ⚠️ No lessons loaded!');
    }
  }, [lessons, isLoading]);

  // ============================================
  // REALTIME: Sincronização em tempo real
  // ============================================
  useEffect(() => {
    const channel = supabase
      .channel('videoaulas-realtime-gestao')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons'
        },
        (payload) => {
          console.log('[Realtime] Lesson change:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
          queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas-stats'] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Videoaulas channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (lesson: Partial<Lesson>) => {
      const { module, area, ...lessonData } = lesson as any;
      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Videoaula criada com sucesso!");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao criar: ${formatError(error)}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Lesson> & { id: string }) => {
      const { error } = await supabase
        .from('lessons')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Videoaula atualizada!");
      setEditingLesson(null);
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao atualizar: ${formatError(error)}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Videoaula excluída!");
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao excluir: ${formatError(error)}`);
    }
  });

  // ============================================
  // ANIQUILAÇÃO TOTAL: Excluir TODAS as videoaulas + módulos
  // ============================================
  const handleAnnihilateAll = async () => {
    // 🛡️ PATCH: Apenas texto como confirmação (checkbox removido para simplificar UX)
    if (annihilateConfirmText.trim() !== "CONFIRMAR EXCLUSÃO TOTAL") {
      toast.error("Digite exatamente: CONFIRMAR EXCLUSÃO TOTAL");
      return;
    }

    setIsAnnihilating(true);
    
    try {
      console.log("[ANNIHILATE] 🔥 Iniciando aniquilação total de vídeos...");
      
      // 1. Excluir todas as lessons
      const { error: lessonsError } = await supabase
        .from('lessons')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (workaround)
      
      if (lessonsError) throw lessonsError;
      console.log(`[ANNIHILATE] ✅ Lessons excluídas`);
      
      // 2. Excluir todos os modules (após lessons para evitar FK)
      const { error: modulesError } = await supabase
        .from('modules')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (modulesError) throw modulesError;
      console.log(`[ANNIHILATE] ✅ Modules excluídos`);
      
      // 3. Invalidar caches
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-modules'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      
      toast.success("ANIQUILAÇÃO TOTAL CONCLUÍDA! Todas as videoaulas e módulos foram excluídos.");
      
      // Reset dialog
      setIsAnnihilateOpen(false);
      setAnnihilateConfirmText("");
      setAnnihilateCheckbox(false);
      
    } catch (error: unknown) {
      console.error("[ANNIHILATE] ❌ Erro:", error);
      toast.error(`Erro na aniquilação: ${formatError(error)}`);
    } finally {
      setIsAnnihilating(false);
    }
  };

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.is_published ? "Videoaula publicada!" : "Videoaula despublicada!");
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
    }
  });

  // Filtros - inclui busca por título, descrição e embed ID (panda/youtube)
  const filteredLessons = lessons?.filter(lesson => {
    const searchLower = search.toLowerCase().trim();
    const matchesSearch = 
      lesson.title.toLowerCase().includes(searchLower) ||
      lesson.description?.toLowerCase().includes(searchLower) ||
      lesson.panda_video_id?.toLowerCase().includes(searchLower) ||
      lesson.youtube_video_id?.toLowerCase().includes(searchLower);
    const matchesProvider = filterProvider === 'all' || lesson.video_provider === filterProvider;
    const matchesPublished = filterPublished === 'all' || 
                             (filterPublished === 'published' && lesson.is_published) ||
                             (filterPublished === 'draft' && !lesson.is_published);
    return matchesSearch && matchesProvider && matchesPublished;
  }) || [];

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterProvider, filterPublished]);

  // Paginação v2300 - 25 itens por página
  const totalPages = Math.ceil(filteredLessons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLessons = filteredLessons.slice(startIndex, endIndex);

  // Funções de navegação
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Stats - usando RPC para contagem correta (sem limite de 1000)
  const stats = {
    total: Number(statsData?.total_aulas || 0),
    published: Number(statsData?.aulas_publicadas || 0),
    panda: Number(statsData?.aulas_panda || 0),
    youtube: Number(statsData?.aulas_youtube || 0),
    totalViews: Number(statsData?.total_views || 0),
    totalMinutes: Number(statsData?.total_minutes || 0)
  };

  const getProviderIcon = (provider: VideoProvider) => {
    switch (provider) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
      case 'panda': return <Tv className="w-4 h-4 text-primary" />;
      case 'vimeo': return <Play className="w-4 h-4 text-blue-500" />;
      default: return <Upload className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getProviderBadge = (provider: VideoProvider) => {
    const variants: Record<VideoProvider, string> = {
      panda: "bg-primary/10 text-primary border-primary/20",
      youtube: "bg-red-500/10 text-red-500 border-red-500/20",
      vimeo: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      upload: "bg-muted text-muted-foreground border-muted"
    };
    return (
      <Badge variant="outline" className={variants[provider]}>
        {getProviderIcon(provider)}
        <span className="ml-1 capitalize">{provider}</span>
      </Badge>
    );
  };

  // 🎬 Helpers para o player de vídeo
  const getVideoId = useCallback((lesson: Lesson): string => {
    if (lesson.video_provider === 'panda' && lesson.panda_video_id) {
      return lesson.panda_video_id;
    }
    if (lesson.video_provider === 'youtube' && lesson.youtube_video_id) {
      return lesson.youtube_video_id;
    }
    // Fallback: extrair ID da URL
    if (lesson.video_url) {
      const ytMatch = lesson.video_url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) return ytMatch[1];
      const pandaMatch = lesson.video_url.match(/[a-f0-9-]{36}/i);
      if (pandaMatch) return pandaMatch[0];
    }
    return '';
  }, []);

  // ✅ PADRÃO SOBERANO v2400 — Usa função centralizada com guard de integridade
  const getVideoType = useCallback((lesson: Lesson): 'youtube' | 'panda' | 'vimeo' => {
    return getVideoTypeWithIntegrityGuard(lesson);
  }, []);

  const hasVideo = useCallback((lesson: Lesson): boolean => {
    return !!(lesson.video_url || lesson.panda_video_id || lesson.youtube_video_id);
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Video className="w-8 h-8 text-primary" />
            Gestão de Videoaulas
          </h1>
          <p className="text-muted-foreground">
            Gerencie aulas Panda Video + YouTube • Sincronizado com Portal do Aluno
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-primary border-primary">
            <Zap className="w-3 h-3 mr-1" />
            Realtime Ativo
          </Badge>
          {/* 🆕 BOTÃO OVERLAY - Configura a imagem de disclaimer */}
          <Button 
            variant="outline" 
            className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600 hover:border-amber-700"
            onClick={() => setIsOverlayConfigOpen(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            OVERLAY
          </Button>
          <Button 
            variant="outline" 
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
            onClick={() => setIsAnnihilateOpen(true)}
          >
            <Bomb className="w-4 h-4 mr-2" />
            Aniquilar Tudo
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            Importar QR Simples
          </Button>
          <Button variant="outline" onClick={() => setIsVideoLinkImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Links de Vídeo
          </Button>
          <Button variant="default" onClick={() => setIsBulkImportOpen(true)}>
            <Layers className="w-4 h-4 mr-2" />
            Importar Organizado
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Videoaula
          </Button>
        </div>
      </div>

      {/* 🆕 OVERLAY CONFIG DIALOG */}
      <VideoOverlayConfigDialog 
        open={isOverlayConfigOpen} 
        onClose={() => setIsOverlayConfigOpen(false)} 
      />

      <VideoLinkImportDialog open={isVideoLinkImportOpen} onOpenChange={setIsVideoLinkImportOpen} />

      <Dialog open={isAnnihilateOpen} onOpenChange={setIsAnnihilateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              ANIQUILAÇÃO TOTAL DE VÍDEOS
            </DialogTitle>
            <DialogDescription className="text-destructive">
              Esta ação é IRREVERSÍVEL. Todas as videoaulas e módulos serão permanentemente excluídos do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              {/* P0 FIX: <ul> não pode estar como sibling direto de <p> no mesmo container causando React #61 */}
              <div className="text-sm font-medium text-destructive">
                ⚠️ ATENÇÃO: Serão excluídos permanentemente:
              </div>
              <ul className="mt-2 text-sm text-destructive/80 list-disc list-inside space-y-1">
                <li>Todas as <strong>{stats.total}</strong> videoaulas (lessons)</li>
                <li>Todos os módulos vinculados</li>
                <li>Progresso dos alunos associado</li>
                <li>Esta ação NÃO pode ser desfeita</li>
              </ul>
            </div>

            <div className="p-3 bg-background border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Eu entendo que esta ação é <strong className="text-destructive">IRREVERSÍVEL</strong> e que todos os dados de videoaulas serão permanentemente perdidos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annihilate-text" className="text-sm">
                Digite <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">CONFIRMAR EXCLUSÃO TOTAL</code> para prosseguir:
              </Label>
              <Input
                id="annihilate-text"
                value={annihilateConfirmText}
                onChange={(e) => setAnnihilateConfirmText(e.target.value)}
                placeholder="CONFIRMAR EXCLUSÃO TOTAL"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnnihilateOpen(false)} disabled={isAnnihilating}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnnihilateAll}
              disabled={isAnnihilating || annihilateConfirmText.trim() !== "CONFIRMAR EXCLUSÃO TOTAL"}
            >
              {isAnnihilating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Aniquilando...
                </>
              ) : (
                <>
                  <Bomb className="w-4 h-4 mr-2" />
                  ANIQUILAR TUDO
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🎬 Modal de Preview de Vídeo */}
      <Dialog open={!!previewLesson} onOpenChange={(open) => !open && setPreviewLesson(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden" showMaximize defaultSize={{ width: 1000, height: 600 }}>
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {previewLesson && getProviderBadge(previewLesson.video_provider)}
                <div>
                  <DialogTitle className="text-lg">{previewLesson?.title}</DialogTitle>
                  <DialogDescription className="text-sm">
                    {previewLesson?.module?.title || "Sem módulo"} • {previewLesson?.duration_minutes ? `${previewLesson.duration_minutes} min` : "Duração desconhecida"}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPreviewLesson(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="relative w-full aspect-video bg-black">
            {previewLesson && hasVideo(previewLesson) ? (
              <OmegaFortressPlayer
                videoId={getVideoId(previewLesson)}
                type={getVideoType(previewLesson)}
                title={previewLesson.title}
                thumbnail={previewLesson.thumbnail_url || undefined}
                lessonId={previewLesson.id}
                showSecurityBadge={false}
                showWatermark={false}
                autoplay
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Video className="w-16 h-16 mb-4 opacity-50" />
                <p>Nenhum vídeo vinculado a esta aula</p>
                <p className="text-sm mt-1">Configure o vídeo usando o botão "Editar"</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-xs text-muted-foreground">Publicadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.panda}</p>
                <p className="text-xs text-muted-foreground">Panda</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.youtube}</p>
                <p className="text-xs text-muted-foreground">YouTube</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.totalMinutes / 60)}h</p>
                <p className="text-xs text-muted-foreground">Conteúdo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar videoaulas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Providers</SelectItem>
            <SelectItem value="panda">Panda Video</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="upload">Upload</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPublished} onValueChange={setFilterPublished}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="published">Publicadas</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Info header - virtualização cuida da navegação */}
      {!isLoading && filteredLessons.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredLessons.length.toLocaleString('pt-BR')}</span> aulas encontradas
            {filteredLessons.length !== stats.total && (
              <span className="ml-2">(de {stats.total.toLocaleString('pt-BR')} total)</span>
            )}
          </p>
        </div>
      )}

      {/* Controles de Paginação - Topo */}
      {!isLoading && filteredLessons.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Exibindo <span className="font-semibold text-foreground">{startIndex + 1}</span> a{' '}
            <span className="font-semibold text-foreground">{Math.min(endIndex, filteredLessons.length)}</span> de{' '}
            <span className="font-semibold text-foreground">{filteredLessons.length.toLocaleString('pt-BR')}</span> aulas
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goToFirstPage} disabled={currentPage === 1} className="h-8 w-8">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage === 1} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3 font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage === totalPages} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToLastPage} disabled={currentPage === totalPages} className="h-8 w-8">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content - PAGINADO + VIRTUALIZADO */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : (
        <VirtualizedVideoaulaList
          lessons={paginatedLessons}
          viewMode={viewMode}
          startIndex={startIndex}
          onEdit={setEditingLesson}
          onConfig={setConfigLesson}
          onPreview={setPreviewLesson}
          onDelete={(id) => deleteMutation.mutate(id)}
          onTogglePublish={(id, is_published) => togglePublishMutation.mutate({ id, is_published })}
        />
      )}

      {/* Controles de Paginação - Rodapé */}
      {!isLoading && filteredLessons.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Página <span className="font-semibold text-foreground">{currentPage}</span> de{' '}
            <span className="font-semibold text-foreground">{totalPages}</span>
            {filteredLessons.length !== stats.total && (
              <span className="ml-2">(filtradas de {stats.total.toLocaleString('pt-BR')} total)</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goToFirstPage} disabled={currentPage === 1} className="h-8 w-8">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage === 1} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3 font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage === totalPages} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToLastPage} disabled={currentPage === totalPages} className="h-8 w-8">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredLessons.length === 0 && (
        <Card className="p-12 text-center">
          <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Nenhuma videoaula encontrada</h3>
          <p className="text-muted-foreground mb-4">
            {search ? "Tente ajustar a busca" : "Comece criando sua primeira videoaula"}
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Videoaula
          </Button>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <LessonFormModal
        open={isCreateOpen || !!editingLesson}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingLesson(null);
        }}
        lesson={editingLesson}
        modules={modules || []}
        areas={areas || []}
        onSubmit={(data) => {
          if (editingLesson) {
            updateMutation.mutate({ id: editingLesson.id, ...data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Import Legacy QR Modal (simple, no organization) */}
      <LegacyQRImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        modules={modules || []}
      />

      {/* Bulk Organization Import Modal (full hierarchy) */}
      <BulkOrganizationImportDialog
        open={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      {/* 🎛️ Modal de Configuração Completa da Aula */}
      <LessonFullConfigDialog
        lesson={configLesson}
        open={!!configLesson}
        onOpenChange={(open) => !open && setConfigLesson(null)}
      />
    </div>
  );
}

// Modal de formulário
interface LessonFormModalProps {
  open: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  modules: Module[];
  areas: Area[];
  onSubmit: (data: Partial<Lesson>) => void;
  isLoading: boolean;
}

function LessonFormModal({ open, onClose, lesson, modules, areas, onSubmit, isLoading }: LessonFormModalProps) {
  const [formData, setFormData] = useState<Partial<Lesson & { legacy_qr_id?: number }>>({
    title: '',
    description: '',
    video_provider: 'panda',
    video_url: '',
    panda_video_id: '',
    youtube_video_id: '',
    thumbnail_url: '',
    duration_minutes: undefined,
    position: 1,
    is_free: false,
    is_published: false,
    module_id: '',
    legacy_qr_id: undefined
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        description: lesson.description || '',
        video_provider: lesson.video_provider,
        video_url: lesson.video_url || '',
        panda_video_id: lesson.panda_video_id || '',
        youtube_video_id: lesson.youtube_video_id || '',
        thumbnail_url: lesson.thumbnail_url || '',
        duration_minutes: lesson.duration_minutes || undefined,
        position: lesson.position || 1,
        is_free: lesson.is_free,
        is_published: lesson.is_published,
        module_id: lesson.module_id,
        legacy_qr_id: (lesson as any).legacy_qr_id || undefined
      });
    } else {
      setFormData({
        title: '',
        description: '',
        video_provider: 'panda',
        video_url: '',
        panda_video_id: '',
        youtube_video_id: '',
        thumbnail_url: '',
        duration_minutes: undefined,
        position: 1,
        is_free: false,
        is_published: false,
        module_id: '',
        legacy_qr_id: undefined
      });
    }
  }, [lesson, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.module_id) {
      toast.error("Preencha título e módulo");
      return;
    }
    onSubmit(formData);
  };

  // Auto-detectar YouTube ID
  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const handleVideoUrlChange = (url: string) => {
    setFormData(prev => {
      const update = { ...prev, video_url: url };
      
      // Auto-detect provider
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        update.video_provider = 'youtube';
        update.youtube_video_id = extractYouTubeId(url) || '';
      } else if (url.includes('panda')) {
        update.video_provider = 'panda';
      } else if (url.includes('vimeo')) {
        update.video_provider = 'vimeo';
      }
      
      return update;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            {lesson ? 'Editar Videoaula' : 'Nova Videoaula'}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da videoaula. Suporta Panda Video, YouTube e Vimeo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Introdução à orgânica"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o conteúdo da aula..."
              rows={3}
            />
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>Provider *</Label>
            <Select
              value={formData.video_provider}
              onValueChange={(value: VideoProvider) => 
                setFormData(prev => ({ ...prev, video_provider: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="panda">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-primary" />
                    Panda Video
                  </div>
                </SelectItem>
                <SelectItem value="youtube">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    YouTube
                  </div>
                </SelectItem>
                <SelectItem value="vimeo">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-blue-500" />
                    Vimeo
                  </div>
                </SelectItem>
                <SelectItem value="upload">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ============================================ */}
          {/* PANDA VIDEO - Configuração Completa */}
          {/* ============================================ */}
          {formData.video_provider === 'panda' && (
            <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Tv className="w-5 h-5" />
                Configuração Panda Video
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panda_video_id">ID do Panda Video *</Label>
                  <Input
                    id="panda_video_id"
                    value={formData.panda_video_id}
                    onChange={(e) => {
                      const videoId = e.target.value.trim();
                      // Auto-preenche thumbnail_url quando digitar o Panda Video ID
                      // Usando o CDN correto: b-vz-c3e3c21e-7ce.tv.pandavideo.com.br
                      const autoThumbnail = videoId && /^[a-f0-9-]{36}$/i.test(videoId)
                        ? `https://b-vz-c3e3c21e-7ce.tv.pandavideo.com.br/${videoId}/thumbnail.jpg`
                        : '';
                      setFormData(prev => ({ 
                        ...prev, 
                        panda_video_id: videoId,
                        // Só preenche se estiver vazio ou já for auto-gerado
                        thumbnail_url: !prev.thumbnail_url || prev.thumbnail_url.includes('pandavideo.com.br') || prev.thumbnail_url.includes('b-cdn.net')
                          ? autoThumbnail 
                          : prev.thumbnail_url
                      }));
                    }}
                    placeholder="Ex: a7ce1bfd-0af1-4b03-b33b-7ed7226c5fb0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato UUID do Panda Video (thumbnail será preenchida automaticamente)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url_panda">URL do Vídeo (opcional)</Label>
                  <Input
                    id="video_url_panda"
                    value={formData.video_url}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="Cole a URL do Panda Video aqui..."
                  />
                  <p className="text-xs text-muted-foreground">
                    URL completa do player Panda
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail_url_panda">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url_panda"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="URL da imagem de capa"
                />
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* YOUTUBE - Configuração Completa */}
          {/* ============================================ */}
          {formData.video_provider === 'youtube' && (
            <div className="space-y-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 text-red-500 font-medium">
                <Youtube className="w-5 h-5" />
                Configuração YouTube
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube_video_id">ID do YouTube *</Label>
                  <Input
                    id="youtube_video_id"
                    value={formData.youtube_video_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, youtube_video_id: e.target.value }))}
                    placeholder="Ex: 9Zr70n-KH6Y"
                  />
                  <p className="text-xs text-muted-foreground">
                    Código de 11 caracteres do vídeo
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url_youtube">URL do Vídeo (opcional)</Label>
                  <Input
                    id="video_url_youtube"
                    value={formData.video_url}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="Ex: https://www.youtube.com/watch?v=9Zr70n-KH6Y"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole a URL do YouTube e o ID será extraído automaticamente
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail_url_youtube">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url_youtube"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="URL da imagem de capa (opcional - gerada automaticamente do YouTube)"
                />
                <p className="text-xs text-muted-foreground">
                  Se não informada, será usada a thumbnail do YouTube
                </p>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* VIMEO - Configuração Completa */}
          {/* ============================================ */}
          {formData.video_provider === 'vimeo' && (
            <div className="space-y-4 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-2 text-blue-500 font-medium">
                <Play className="w-5 h-5" />
                Configuração Vimeo
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vimeo_video_id">ID do Vimeo *</Label>
                  <Input
                    id="vimeo_video_id"
                    value={formData.video_url?.replace('https://vimeo.com/', '') || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: `https://vimeo.com/${e.target.value}` }))}
                    placeholder="Ex: 123456789"
                  />
                  <p className="text-xs text-muted-foreground">
                    Código numérico do vídeo
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url_vimeo">URL do Vídeo (opcional)</Label>
                  <Input
                    id="video_url_vimeo"
                    value={formData.video_url}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="Ex: https://vimeo.com/123456789"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail_url_vimeo">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url_vimeo"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="URL da imagem de capa"
                />
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* UPLOAD - Configuração Completa */}
          {/* ============================================ */}
          {formData.video_provider === 'upload' && (
            <div className="space-y-4 p-4 rounded-lg border border-muted bg-muted/5">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Upload className="w-5 h-5" />
                Configuração Upload Manual
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="video_url_upload">URL do Vídeo *</Label>
                  <Input
                    id="video_url_upload"
                    value={formData.video_url}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="URL direta do arquivo de vídeo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail_url_upload">Thumbnail URL</Label>
                  <Input
                    id="thumbnail_url_upload"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    placeholder="URL da imagem de capa"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Módulo e Área */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Módulo *</Label>
              <Select
                value={formData.module_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(mod => (
                    <SelectItem key={mod.id} value={mod.id}>{mod.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Área (opcional)</Label>
              <Select
                value={formData.area_id || '__none__'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, area_id: value === '__none__' ? null : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duração e Posição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  duration_minutes: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="Ex: 45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Posição/Ordem</Label>
              <Input
                id="position"
                type="number"
                value={formData.position || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  position: e.target.value ? parseInt(e.target.value) : 1 
                }))}
                min={1}
              />
            </div>
          </div>

          {/* Legacy QR ID - Para QR Codes físicos */}
          <div className="space-y-2 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 text-amber-600 font-medium mb-2">
              <QrCode className="w-5 h-5" />
              QR Code Legado (Livros Físicos)
            </div>
            <div className="space-y-2">
              <Label htmlFor="legacy_qr_id">ID do QR Code Legado</Label>
              <Input
                id="legacy_qr_id"
                type="number"
                value={formData.legacy_qr_id || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  legacy_qr_id: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="Ex: 10745"
                disabled={!!lesson && !!(lesson as any).legacy_qr_id}
              />
              <p className="text-xs text-muted-foreground">
                Identificador numérico único usado nos QR Codes impressos. <strong>Não pode ser alterado após criação.</strong>
              </p>
              {formData.legacy_qr_id && (
                <p className="text-xs text-amber-600">
                  URL do QR: <code className="bg-muted px-1 rounded">/qr?v={formData.legacy_qr_id}</code>
                </p>
              )}
            </div>
          </div>

          {/* Switches */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_free: checked }))}
              />
              <Label htmlFor="is_free">Aula gratuita</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
              <Label htmlFor="is_published">Publicar agora</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : lesson ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Videoaula
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
