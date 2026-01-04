// ============================================
// CENTRAL DO ALUNO - VIDEOAULAS
// Sincronizado em tempo real com /gestaofc/videoaulas
// Suporta ?aula=UUID para abrir diretamente via QR Code
// ============================================

import { useState, useEffect, useMemo } from "react";
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
  ChevronRight, Star, X, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { OmegaFortressPlayer } from "@/components/video/OmegaFortressPlayer";
import { LessonTabs } from "@/components/player/LessonTabs";

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

export default function AlunoVideoaulas() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  
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
    setSearchParams({ aula: lesson.id });
  };

  // Função para fechar o player
  const closePlayer = () => {
    setSearchParams({});
  };

  // Determinar tipo de player
  const getVideoType = (lesson: Lesson): "youtube" | "panda" => {
    if (lesson.video_provider === 'panda') return "panda";
    if (lesson.video_provider === 'youtube') return "youtube";
    // Fallback: Se panda_video_id parece UUID, é Panda
    if (lesson.panda_video_id && /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(lesson.panda_video_id)) {
      return "panda";
    }
    return "youtube";
  };

  // Obter ID do vídeo
  const getVideoId = (lesson: Lesson): string => {
    const type = getVideoType(lesson);
    if (type === "panda") {
      return lesson.panda_video_id || "";
    }
    return lesson.youtube_video_id || lesson.panda_video_id || "";
  };

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel('videoaulas-aluno-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        queryClient.invalidateQueries({ queryKey: ['aluno-videoaulas'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filteredLessons = lessons?.filter(l => 
    l.title.toLowerCase().includes(busca.toLowerCase()) ||
    l.description?.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  return (
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
                  <Badge variant="outline" className="hidden sm:flex">
                    {getVideoType(selectedLesson) === 'panda' ? '🐼 Panda' : '▶️ YouTube'}
                  </Badge>
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
                    showSecurityBadge
                    showWatermark
                    autoplay
                  />
                </div>

                {/* Lesson Tabs (Resumo, Quiz, etc) */}
                <LessonTabs 
                  lessonId={selectedLesson.id}
                  lessonTitle={selectedLesson.title}
                />

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

      {/* Grid de Videoaulas */}
      {!isLoading && filteredLessons.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.5) }}
            >
              <Card 
                className="relative overflow-hidden transition-all hover:shadow-lg group cursor-pointer"
                onClick={() => openLesson(lesson)}
              >
                {/* Thumbnail */}
                {lesson.thumbnail_url && (
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img 
                      src={lesson.thumbnail_url} 
                      alt={lesson.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                    {lesson.duration_minutes && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70">
                        <Clock className="w-3 h-3 mr-1" />
                        {lesson.duration_minutes} min
                      </Badge>
                    )}
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-lg line-clamp-2">{lesson.title}</CardTitle>
                    </div>
                  </div>
                  {lesson.module?.title && (
                    <Badge variant="outline" className="w-fit">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {lesson.module.title}
                    </Badge>
                  )}
                  {lesson.description && (
                    <CardDescription className="line-clamp-2">{lesson.description}</CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {lesson.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lesson.duration_minutes} min
                      </span>
                    )}
                    {lesson.views_count && lesson.views_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {lesson.views_count} views
                      </span>
                    )}
                  </div>

                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); openLesson(lesson); }}>
                    Assistir aula
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Badge contador atualizado */}
      <div className="flex items-center gap-2 fixed bottom-4 right-4 z-40">
        <Badge variant="secondary" className="text-sm py-1 px-3 shadow-lg">
          <PlayCircle className="w-4 h-4 mr-2" />
          {filteredLessons.length} aula{filteredLessons.length !== 1 ? 's' : ''} disponíve{filteredLessons.length !== 1 ? 'is' : 'l'}
        </Badge>
      </div>
    </div>
  );
}
