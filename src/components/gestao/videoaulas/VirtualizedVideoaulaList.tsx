// ============================================
// VIRTUALIZED VIDEOAULA LIST v1.1
// Renderiza apenas itens visíveis para performance
// Padrão permanente para /gestaofc/videoaulas
// CDN CORRIGIDO: b-vz-c3e3c21e-7ce.tv.pandavideo.com.br
// ============================================

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { 
  Video, Play, Edit2, Trash2, Eye, EyeOff, Clock, 
  BookOpen, ExternalLink, Copy, Settings2, MoreVertical,
  Youtube, Tv, Upload
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getThumbnailUrl } from "@/lib/video/thumbnails";
import { SacredImage } from "@/components/performance/SacredImage";

// Configuração de virtualização
const GRID_ITEM_HEIGHT = 340; // Altura aproximada do card em grid
const TABLE_ROW_HEIGHT = 56; // Altura de uma linha de tabela
const OVERSCAN = 3;

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
  module?: { id: string; title: string };
  area?: { id: string; name: string };
}

interface VirtualizedVideoaulaListProps {
  lessons: Lesson[];
  viewMode: 'grid' | 'table';
  startIndex: number;
  onEdit: (lesson: Lesson) => void;
  onConfig: (lesson: Lesson) => void;
  onPreview: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, is_published: boolean) => void;
}

// Helpers
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

// Card Grid Item Memoizado
const GridItem = memo(function GridItem({
  lesson,
  onEdit,
  onConfig,
  onPreview,
  onDelete,
  onTogglePublish,
}: {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onConfig: (lesson: Lesson) => void;
  onPreview: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, is_published: boolean) => void;
}) {
  // Gerar thumbnail dinamicamente a partir do panda_video_id ou thumbnail_url
  const thumbnailUrl = getThumbnailUrl(lesson);
  
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg h-full ${
      !lesson.is_published ? 'opacity-70 border-dashed' : ''
    }`}>
      {/* Thumbnail */}
      <div 
        className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 cursor-pointer group"
        onClick={() => onPreview(lesson)}
      >
        {thumbnailUrl ? (
          <SacredImage 
            src={thumbnailUrl} 
            alt={lesson.title}
            className="w-full h-full transition-transform group-hover:scale-105"
            objectFit="cover"
            onError={() => {}}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {getProviderIcon(lesson.video_provider)}
            <Video className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all shadow-lg">
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </div>
        </div>
        
        {/* Provider Badge */}
        <div className="absolute top-2 left-2 z-10">
          {getProviderBadge(lesson.video_provider)}
        </div>
        {/* Status Badge */}
        <div className="absolute top-2 right-2 z-10">
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
          <div className="absolute bottom-2 right-2 z-10">
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
            onClick={() => onEdit(lesson)}
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            size="sm"
            variant={lesson.is_published ? "secondary" : "default"}
            onClick={() => onTogglePublish(lesson.id, !lesson.is_published)}
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
              <DropdownMenuItem onClick={async () => {
                if (lesson.video_provider === 'panda' && lesson.panda_video_id) {
                  toast.loading("Gerando URL segura...", { id: "panda-url" });
                  try {
                    const { data, error } = await supabase.functions.invoke('get-panda-signed-url', {
                      body: { lessonId: lesson.id }
                    });
                    if (error) throw error;
                    if (data?.signedUrl) {
                      window.open(data.signedUrl, '_blank');
                      toast.success("Vídeo aberto!", { id: "panda-url" });
                    } else {
                      throw new Error("URL não gerada");
                    }
                  } catch (err) {
                    console.error('[Abrir vídeo] Erro:', err);
                    toast.error("Erro ao gerar URL do vídeo", { id: "panda-url" });
                  }
                } else if (lesson.video_provider === 'youtube' && lesson.youtube_video_id) {
                  window.open(`https://www.youtube.com/watch?v=${lesson.youtube_video_id}`, '_blank');
                } else if (lesson.video_url) {
                  window.open(lesson.video_url, '_blank');
                } else {
                  toast.error("Nenhuma URL de vídeo disponível");
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
              <DropdownMenuItem onClick={() => onConfig(lesson)}>
                <Settings2 className="w-4 h-4 mr-2" />
                Configurar Aula
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => {
                  if (confirm("Excluir esta videoaula?")) {
                    onDelete(lesson.id);
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
  );
});

// Table Row Memoizado
const TableRowItem = memo(function TableRowItem({
  lesson,
  index,
  onEdit,
  onConfig,
  onPreview,
  onDelete,
  onTogglePublish,
}: {
  lesson: Lesson;
  index: number;
  onEdit: (lesson: Lesson) => void;
  onConfig: (lesson: Lesson) => void;
  onPreview: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, is_published: boolean) => void;
}) {
  return (
    <TableRow className="group">
      <TableCell>{index + 1}</TableCell>
      <TableCell 
        className="font-medium max-w-[200px] truncate cursor-pointer hover:text-primary transition-colors"
        onClick={() => onPreview(lesson)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-3 h-3 text-primary" />
          </div>
          <span className="truncate">{lesson.title}</span>
        </div>
      </TableCell>
      <TableCell>{getProviderBadge(lesson.video_provider)}</TableCell>
      <TableCell>{lesson.module?.title || "-"}</TableCell>
      <TableCell>{lesson.duration_minutes ? `${lesson.duration_minutes}min` : "-"}</TableCell>
      <TableCell>{lesson.views_count || 0}</TableCell>
      <TableCell>
        <Switch
          checked={lesson.is_published}
          onCheckedChange={(checked) => onTogglePublish(lesson.id, checked)}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="ghost" onClick={() => onPreview(lesson)} title="Assistir vídeo">
          <Play className="w-4 h-4 text-primary" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(lesson)} title="Editar">
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onConfig(lesson)} title="Configurar">
          <Settings2 className="w-4 h-4 text-amber-500" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-destructive"
          onClick={() => {
            if (confirm("Excluir?")) onDelete(lesson.id);
          }}
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

export function VirtualizedVideoaulaList({
  lessons,
  viewMode,
  startIndex,
  onEdit,
  onConfig,
  onPreview,
  onDelete,
  onTogglePublish,
}: VirtualizedVideoaulaListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Observer para detectar mudanças de altura
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Handler de scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Reset scroll ao mudar lessons ou viewMode
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [lessons.length, viewMode]);

  if (lessons.length === 0) {
    return null;
  }

  // Virtualização para modo GRID (3 colunas)
  if (viewMode === 'grid') {
    const COLUMNS = 3;
    const ROW_HEIGHT = GRID_ITEM_HEIGHT + 16; // altura + gap
    const totalRows = Math.ceil(lessons.length / COLUMNS);
    const totalHeight = totalRows * ROW_HEIGHT;
    
    const startRowIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const endRowIndex = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
    
    const visibleStartIndex = startRowIndex * COLUMNS;
    const visibleEndIndex = Math.min(lessons.length, endRowIndex * COLUMNS);
    const visibleLessons = lessons.slice(visibleStartIndex, visibleEndIndex);
    const offsetY = startRowIndex * ROW_HEIGHT;

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto"
        style={{ height: 'calc(100vh - 450px)', minHeight: '400px' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div 
            style={{ transform: `translateY(${offsetY}px)` }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {visibleLessons.map((lesson) => (
              <div key={lesson.id} style={{ height: GRID_ITEM_HEIGHT }}>
                <GridItem
                  lesson={lesson}
                  onEdit={onEdit}
                  onConfig={onConfig}
                  onPreview={onPreview}
                  onDelete={onDelete}
                  onTogglePublish={onTogglePublish}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Virtualização para modo TABLE
  const totalHeight = lessons.length * TABLE_ROW_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / TABLE_ROW_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(lessons.length, Math.ceil((scrollTop + containerHeight) / TABLE_ROW_HEIGHT) + OVERSCAN);
  
  const visibleLessons = lessons.slice(startIdx, endIdx);
  const offsetY = startIdx * TABLE_ROW_HEIGHT;

  return (
    <Card>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto"
        style={{ height: '600px' }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
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
        </Table>
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            <Table>
              <TableBody>
                {visibleLessons.map((lesson, idx) => (
                  <TableRowItem
                    key={lesson.id}
                    lesson={lesson}
                    index={startIndex + startIdx + idx}
                    onEdit={onEdit}
                    onConfig={onConfig}
                    onPreview={onPreview}
                    onDelete={onDelete}
                    onTogglePublish={onTogglePublish}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default VirtualizedVideoaulaList;
