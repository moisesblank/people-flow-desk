// ============================================
// CENTRAL DO ALUNO - VIDEOAULAS
// Sincronizado em tempo real com /gestaofc/videoaulas
// ============================================

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlayCircle, Search, Clock, BookOpen,
  ChevronRight, Lock, CheckCircle2, Star
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

// Hook para buscar videoaulas publicadas
function useVideoaulasAluno() {
  return useQuery({
    queryKey: ['aluno-videoaulas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, module:modules(id, title)')
        .eq('is_published', true)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });
}

export default function AlunoVideoaulas() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  
  const { data: lessons, isLoading } = useVideoaulasAluno();

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Videoaulas</h1>
          <p className="text-muted-foreground">Assista às aulas e domine a Química</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary">
            <PlayCircle className="w-3 h-3 mr-1" />
            128 aulas disponíveis
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
              transition={{ delay: index * 0.05 }}
            >
              <Card className="relative overflow-hidden transition-all hover:shadow-lg group">
                {/* Thumbnail */}
                {lesson.thumbnail_url && (
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img 
                      src={lesson.thumbnail_url} 
                      alt={lesson.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
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
                      <PlayCircle className="w-5 h-5 text-primary" />
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
                    {lesson.views_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {lesson.views_count} views
                      </span>
                    )}
                  </div>

                  <Button className="w-full">
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
      <div className="flex items-center gap-2 fixed bottom-4 right-4">
        <Badge variant="secondary" className="text-sm py-1 px-3">
          <PlayCircle className="w-4 h-4 mr-2" />
          {filteredLessons.length} aula{filteredLessons.length !== 1 ? 's' : ''} disponíve{filteredLessons.length !== 1 ? 'is' : 'l'}
        </Badge>
      </div>
    </div>
  );
}
