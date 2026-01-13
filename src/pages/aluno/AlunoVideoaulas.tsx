// ============================================
// CENTRAL DO ALUNO - VIDEOAULAS v2300
// Sincronizado em tempo real com /gestaofc/videoaulas
// Suporta ?aula=UUID para abrir diretamente via QR Code
// VIRTUALIZADO + PAGINADO (25 itens/página)
// 🚨 BLACKOUT ANTI-PIRATARIA v1.0 INTEGRADO
// ============================================

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  PlayCircle, Search, Clock, BookOpen,
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  Star, ArrowLeft
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { OmegaFortressPlayer } from "@/components/video/OmegaFortressPlayer";
import { LessonTabs } from "@/components/player/LessonTabs";
import { detectVideoProviderFromUrl, isPandaUrl, getVideoTypeWithIntegrityGuard } from "@/lib/video/detectVideoProvider";
import { VirtualizedAlunoVideoaulaList } from "@/components/aluno/videoaulas/VirtualizedAlunoVideoaulaList";
// SecurityBlackoutOverlay REMOVIDO - Agora integrado globalmente no App.tsx (v1.1)

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  views_count: number | null;
  panda_video_id: string | null;
  youtube_video_id: string | null;
  video_provider: string | null;
  video_url?: string | null; // PATCH: suporte a embed/UUID no campo legado
  is_published: boolean;
  position: number;
  module: { id: string; title: string } | null;
}

// Hook para buscar videoaulas publicadas
function useVideoaulasAluno() {
  return useQuery({
    queryKey: ['aluno-videoaulas'],
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
          .select('*, module:modules(id, title)')
          .eq('is_published', true)
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

// CONSTANTE DE PAGINAÇÃO v2300
const ITEMS_PER_PAGE = 25;

export default function AlunoVideoaulas() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: lessons, isLoading } = useVideoaulasAluno();

  // 📱 CAPTURA DO PARÂMETRO ?aula= (vindo do QR Code)
  const aulaIdFromUrl = searchParams.get("aula");
  
  // Encontrar a aula selecionada pelo ID
  const selectedLesson = useMemo(() => {
    if (!aulaIdFromUrl || !lessons) return null;
    return lessons.find(l => l.id === aulaIdFromUrl) || null;
  }, [aulaIdFromUrl, lessons]);

  // Função para abrir uma aula
  const openLesson = (lesson: Lesson) => {
    const videoType = getVideoType(lesson);
    const videoId = getVideoId(lesson);
    console.log('▶️ Play lesson:', { 
      id: lesson.id, 
      title: lesson.title,
      panda_video_id: lesson.panda_video_id,
      youtube_video_id: lesson.youtube_video_id,
      video_provider: lesson.video_provider,
      detected_type: videoType,
      resolved_video_id: videoId 
    });
    setSearchParams({ aula: lesson.id });
  };

  // Função para fechar o player
  const closePlayer = () => {
    setSearchParams({});
  };

  // ✅ PADRÃO SOBERANO v2400 — Usa função centralizada com guard de integridade
  const getVideoType = (lesson: Lesson): "youtube" | "panda" => {
    const result = getVideoTypeWithIntegrityGuard(lesson);
    // Normalizar para o tipo esperado (sem vimeo aqui)
    return result === 'vimeo' ? 'youtube' : result;
  };

  // Obter ID/URL do vídeo
  // PATCH: Panda aceita UUID OU embed URL completa (video_url)
  const getVideoId = (lesson: Lesson): string => {
    const type = getVideoType(lesson);

    if (type === "panda") {
      if (lesson.panda_video_id) return lesson.panda_video_id;
      if (lesson.video_url && (isPandaUrl(lesson.video_url) || lesson.video_url.startsWith('http'))) return lesson.video_url;
      return lesson.video_url || "";
    }

    // YouTube: priorizar youtube_video_id, fallback legado
    return lesson.youtube_video_id || lesson.panda_video_id || lesson.video_url || "";
  };

  // Realtime sync com debounce (5s para conteúdo de gestão - evita Thundering Herd)
  const invalidateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedInvalidate = useCallback(() => {
    if (invalidateRef.current) clearTimeout(invalidateRef.current);
    invalidateRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['aluno-videoaulas'] });
    }, 5000); // 5s debounce para lessons
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('videoaulas-aluno-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, debouncedInvalidate)
      .subscribe();
    return () => {
      if (invalidateRef.current) clearTimeout(invalidateRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedInvalidate]);

  // Filtrar lições por busca - inclui título, descrição e embed ID (panda/youtube)
  const filteredLessons = useMemo(() => {
    const searchLower = busca.toLowerCase().trim();
    return lessons?.filter(l => 
      l.title.toLowerCase().includes(searchLower) ||
      l.description?.toLowerCase().includes(searchLower) ||
      l.panda_video_id?.toLowerCase().includes(searchLower) ||
      l.youtube_video_id?.toLowerCase().includes(searchLower)
    ) || [];
  }, [lessons, busca]);

  // Reset página ao mudar busca
  useEffect(() => {
    setCurrentPage(1);
  }, [busca]);

  // Cálculos de paginação
  const totalItems = filteredLessons.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedLessons = filteredLessons.slice(startIndex, endIndex);

  // Funções de navegação
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* 🚨 BLACKOUT ANTI-PIRATARIA v1.1 - GLOBAL (App.tsx) */}
      
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* ============================================ */}
      {/* MODAL DO PLAYER - Aberto via ?aula=UUID    */}
      {/* ============================================ */}
      <AnimatePresence>
        {selectedLesson && (
          <Dialog open={!!selectedLesson} onOpenChange={(open) => !open && closePlayer()}>
            <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] overflow-y-auto p-0">
              <DialogHeader className="p-4 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={closePlayer}
                      className="h-8 w-8"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <DialogTitle className="text-lg font-semibold line-clamp-1">
                        {selectedLesson.title}
                      </DialogTitle>
                      {selectedLesson.module?.title && (
                        <p className="text-sm text-muted-foreground">
                          {selectedLesson.module.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="p-4 space-y-4">
                {/* Video Player */}
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <OmegaFortressPlayer
                    videoId={getVideoId(selectedLesson)}
                    type={getVideoType(selectedLesson)}
                    title={selectedLesson.title}
                    thumbnail={selectedLesson.thumbnail_url || undefined}
                    lessonId={selectedLesson.id}
                    showSecurityBadge={false}
                    showWatermark
                    autoplay={false} // 🔒 Disclaimer obrigatório: só iniciar após interação explícita
                  />
                </div>

                {/* Lesson Tabs (Resumo, Quiz, etc) - TEMPORARIAMENTE DESATIVADO
                <LessonTabs 
                  lessonId={selectedLesson.id}
                  lessonTitle={selectedLesson.title}
                />
                */}

                {/* Descrição da aula */}
                {selectedLesson.description && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Sobre esta aula</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {selectedLesson.description}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* LISTAGEM DE VIDEOAULAS                      */}
      {/* ============================================ */}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Videoaulas</h1>
          <p className="text-muted-foreground">Assista às aulas e domine a Química</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary">
            <PlayCircle className="w-3 h-3 mr-1" />
            {lessons?.length || 0} aulas disponíveis
          </Badge>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por módulo ou assunto..." 
            className="pl-10"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Tabs value={filtro} onValueChange={setFiltro} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="em-andamento">Em andamento</TabsTrigger>
            <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-10 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredLessons.length === 0 && (
        <Card className="p-8 text-center">
          <PlayCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma videoaula disponível</h3>
          <p className="text-muted-foreground">
            {busca ? "Nenhuma aula encontrada para sua busca." : "Em breve novas aulas serão publicadas."}
          </p>
        </Card>
      )}

      {/* ============================================ */}
      {/* BARRA DE PAGINAÇÃO (TOPO)                   */}
      {/* ============================================ */}
      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
          <span className="text-sm text-muted-foreground">
            Exibindo <span className="font-semibold text-foreground">{startIndex + 1} - {endIndex}</span> de{" "}
            <span className="font-semibold text-foreground">{totalItems}</span> aulas
          </span>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-3 py-1 text-sm bg-primary/10 rounded-md border border-primary/20">
              Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Grid de Videoaulas (VIRTUALIZADO + PAGINADO) */}
      {!isLoading && paginatedLessons.length > 0 && (
        <VirtualizedAlunoVideoaulaList
          lessons={paginatedLessons}
          onOpenLesson={openLesson}
        />
      )}

      {/* ============================================ */}
      {/* BARRA DE PAGINAÇÃO (RODAPÉ)                 */}
      {/* ============================================ */}
      {!isLoading && totalItems > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
          <span className="text-sm text-muted-foreground">
            Exibindo <span className="font-semibold text-foreground">{startIndex + 1} - {endIndex}</span> de{" "}
            <span className="font-semibold text-foreground">{totalItems}</span> aulas
          </span>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-3 py-1 text-sm bg-primary/10 rounded-md border border-primary/20">
              Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
