// ============================================
// 🎬 GESTÃO VIDEOAULAS v2300
// CRUD completo + Panda Video + YouTube
// Sincronizado em tempo real com /alunos/videoaulas
// ============================================

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, Plus, Search, Filter, Play, Pause, Edit2, Trash2, 
  Eye, EyeOff, Clock, BookOpen, Upload, Youtube, Tv,
  ChevronDown, MoreVertical, ExternalLink, Copy, Check,
  TrendingUp, Users, Zap, RefreshCw, Settings2, Layers,
  GripVertical, ArrowUpDown, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          module:modules(id, title),
          area:areas(id, name)
        `)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as Lesson[];
    }
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
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { data: lessons, isLoading, refetch } = useVideoaulas();
  const { data: modules } = useModules();
  const { data: areas } = useAreas();

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
    onError: (error) => {
      toast.error(`Erro ao criar: ${error.message}`);
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
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
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
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    }
  });

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

  // Filtros
  const filteredLessons = lessons?.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(search.toLowerCase()) ||
                          lesson.description?.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = filterProvider === 'all' || lesson.video_provider === filterProvider;
    const matchesPublished = filterPublished === 'all' || 
                             (filterPublished === 'published' && lesson.is_published) ||
                             (filterPublished === 'draft' && !lesson.is_published);
    return matchesSearch && matchesProvider && matchesPublished;
  }) || [];

  // Stats
  const stats = {
    total: lessons?.length || 0,
    published: lessons?.filter(l => l.is_published).length || 0,
    panda: lessons?.filter(l => l.video_provider === 'panda').length || 0,
    youtube: lessons?.filter(l => l.video_provider === 'youtube').length || 0,
    totalViews: lessons?.reduce((acc, l) => acc + (l.views_count || 0), 0) || 0,
    totalMinutes: lessons?.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) || 0
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary">
            <Zap className="w-3 h-3 mr-1" />
            Realtime Ativo
          </Badge>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Videoaula
          </Button>
        </div>
      </div>

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

      {/* Content */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredLessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className={`overflow-hidden transition-all hover:shadow-lg ${
                  !lesson.is_published ? 'opacity-70 border-dashed' : ''
                }`}>
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
                    {lesson.thumbnail_url ? (
                      <img 
                        src={lesson.thumbnail_url} 
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getProviderIcon(lesson.video_provider)}
                        <Video className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Provider Badge */}
                    <div className="absolute top-2 left-2">
                      {getProviderBadge(lesson.video_provider)}
                    </div>
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {lesson.is_published ? (
                        <Badge className="bg-green-500/90">
                          <Eye className="w-3 h-3 mr-1" />
                          Publicada
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    {/* Duration */}
                    {lesson.duration_minutes && (
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                          <Clock className="w-3 h-3 mr-1" />
                          {lesson.duration_minutes}min
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{lesson.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {lesson.description || "Sem descrição"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {lesson.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {lesson.module?.title || "Sem módulo"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setEditingLesson(lesson)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={lesson.is_published ? "secondary" : "default"}
                        onClick={() => togglePublishMutation.mutate({ 
                          id: lesson.id, 
                          is_published: !lesson.is_published 
                        })}
                      >
                        {lesson.is_published ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            if (lesson.video_url) {
                              window.open(lesson.video_url, '_blank');
                            }
                          }}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir vídeo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(lesson.id);
                            toast.success("ID copiado!");
                          }}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("Excluir esta videoaula?")) {
                                deleteMutation.mutate(lesson.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson, index) => (
                  <TableRow key={lesson.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {lesson.title}
                    </TableCell>
                    <TableCell>{getProviderBadge(lesson.video_provider)}</TableCell>
                    <TableCell>{lesson.module?.title || "-"}</TableCell>
                    <TableCell>{lesson.duration_minutes ? `${lesson.duration_minutes}min` : "-"}</TableCell>
                    <TableCell>{lesson.views_count || 0}</TableCell>
                    <TableCell>
                      <Switch
                        checked={lesson.is_published}
                        onCheckedChange={(checked) => 
                          togglePublishMutation.mutate({ id: lesson.id, is_published: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditingLesson(lesson)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Excluir?")) deleteMutation.mutate(lesson.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
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
  const [formData, setFormData] = useState<Partial<Lesson>>({
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
    module_id: ''
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
        module_id: lesson.module_id
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
        module_id: ''
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
              placeholder="Ex: Introdução à Química Orgânica"
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

          {/* Provider e URL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
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

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="video_url">URL do Vídeo</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder="Cole a URL do vídeo aqui..."
              />
            </div>
          </div>

          {/* IDs específicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.video_provider === 'panda' && (
              <div className="space-y-2">
                <Label htmlFor="panda_video_id">Panda Video ID</Label>
                <Input
                  id="panda_video_id"
                  value={formData.panda_video_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, panda_video_id: e.target.value }))}
                  placeholder="ID do vídeo no Panda"
                />
              </div>
            )}
            {formData.video_provider === 'youtube' && (
              <div className="space-y-2">
                <Label htmlFor="youtube_video_id">YouTube Video ID</Label>
                <Input
                  id="youtube_video_id"
                  value={formData.youtube_video_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtube_video_id: e.target.value }))}
                  placeholder="Ex: dQw4w9WgXcQ"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="URL da imagem de capa"
              />
            </div>
          </div>

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
                value={formData.area_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, area_id: value || null }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
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
