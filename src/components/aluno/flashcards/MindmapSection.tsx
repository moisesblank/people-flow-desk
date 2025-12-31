// ============================================
// SEÇÃO DE MAPAS MENTAIS - Integrada aos Flashcards
// Sincronização em tempo real com Supabase Realtime
// ============================================

import { memo, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  RefreshCw,
  Sparkles,
  Clock,
  ZoomIn,
  ZoomOut,
  Download,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Mindmap, MindmapNode } from '@/types/flashcards';

// ============================================
// TIPOS
// ============================================

interface SavedMindmap {
  id: string;
  lesson_id: string;
  content_type: string;
  content: unknown;
  created_at: string;
  lessons?: {
    title: string;
  } | null;
}

interface MindmapSectionProps {
  className?: string;
  defaultExpanded?: boolean;
}

// ============================================
// COMPONENTE: Nó do Mapa Mental
// ============================================

function MindmapNodeComponent({ node, level = 0, index = 0 }: { node: MindmapNode; level?: number; index?: number }) {
  const isRoot = level === 0;
  const delay = level * 0.1 + index * 0.05;

  const getColor = () => {
    if (node.color) return node.color;
    if (isRoot) return 'from-primary to-purple-500';
    if (level === 1) return 'from-blue-500 to-cyan-500';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className={cn("relative", isRoot && "flex flex-col items-center")}
    >
      <div
        className={cn(
          "px-4 py-2 rounded-xl font-medium text-center transition-all",
          "hover:scale-105 cursor-pointer",
          isRoot 
            ? `bg-gradient-to-r ${getColor()} text-white text-lg py-3 px-6 shadow-lg` 
            : level === 1 
              ? `bg-gradient-to-r ${getColor()} text-white shadow-md`
              : "bg-muted/80 text-foreground text-sm border border-border"
        )}
      >
        {node.label}
      </div>

      {node.children && node.children.length > 0 && (
        <div className={cn(
          "flex gap-4 mt-4",
          isRoot ? "flex-row flex-wrap justify-center" : "flex-col ml-4"
        )}>
          {node.children.map((child, idx) => (
            <div key={child.id} className="relative">
              {!isRoot && (
                <div className="absolute -left-4 top-1/2 w-4 h-px bg-border" />
              )}
              <MindmapNodeComponent node={child} level={level + 1} index={idx} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// COMPONENTE: Modal de Visualização
// ============================================

const MindmapViewerDialog = memo(function MindmapViewerDialog({ 
  open, 
  onClose, 
  mindmap 
}: { 
  open: boolean; 
  onClose: () => void; 
  mindmap: SavedMindmap | null;
}) {
  const [zoom, setZoom] = useState(1);

  if (!mindmap) return null;

  const content = mindmap.content as Mindmap;
  const rootNode = content.nodes?.[0] || { id: 'empty', label: content.title || 'Mapa Mental' };

  const handleExport = () => {
    const dataStr = JSON.stringify(content, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapa-mental-${mindmap.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            {content.title || 'Mapa Mental'}
          </DialogTitle>
          <DialogDescription>
            {mindmap.lessons?.title || 'Mapa gerado por IA'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm text-muted-foreground min-w-[50px] text-center">
              {(zoom * 100).toFixed(0)}%
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>

        <div className="flex-1 overflow-auto rounded-lg bg-muted/20 p-8 min-h-[400px]">
          <div 
            className="flex justify-center transition-transform"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            <MindmapNodeComponent node={rootNode} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// COMPONENTE PRINCIPAL: Seção de Mapas Mentais
// ============================================

export const MindmapSection = memo(function MindmapSection({ 
  className, 
  defaultExpanded = false 
}: MindmapSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewingMap, setViewingMap] = useState<SavedMindmap | null>(null);
  const queryClient = useQueryClient();

  // Buscar mapas mentais
  const { data: mindmaps, isLoading, refetch } = useQuery({
    queryKey: ['flashcards-mindmaps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select(`
          id,
          lesson_id,
          content_type,
          content,
          created_at,
          lessons:lesson_id (
            title
          )
        `)
        .eq('content_type', 'mindmap')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as SavedMindmap[];
    },
    staleTime: 30_000,
  });

  // ============================================
  // REALTIME: Sincronização em tempo real
  // ============================================
  useEffect(() => {
    const channel = supabase
      .channel('mindmaps-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ai_generated_content',
          filter: 'content_type=eq.mindmap'
        },
        (payload) => {
          console.log('[Realtime] Mindmap change:', payload.eventType);
          // Refetch imediato ao detectar mudança
          queryClient.invalidateQueries({ queryKey: ['flashcards-mindmaps'] });
          
          if (payload.eventType === 'INSERT') {
            toast.info('Novo mapa mental disponível!', {
              icon: <Network className="w-4 h-4" />
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Estatísticas rápidas
  const stats = useMemo(() => {
    if (!mindmaps) return { total: 0, recent: 0 };
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      total: mindmaps.length,
      recent: mindmaps.filter(m => new Date(m.created_at) > weekAgo).length
    };
  }, [mindmaps]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header colapsável */}
      <Card 
        className="cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Mapas Mentais</span>
              <Badge variant="secondary" className="text-xs">
                {stats.total} mapas
              </Badge>
              {stats.recent > 0 && (
                <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                  +{stats.recent} esta semana
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Preview rápido quando colapsado */}
          {!isExpanded && mindmaps && mindmaps.length > 0 && (
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <Layers className="w-4 h-4 text-orange-500" />
                <span className="text-muted-foreground">
                  {mindmaps[0] ? (mindmaps[0].content as Mindmap).title?.slice(0, 30) + '...' : 'Nenhum mapa'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Mapas Mentais expandida */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    Seus Mapas Mentais
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                    e.stopPropagation();
                    refetch();
                    toast.success('Atualizado!');
                  }}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {mindmaps && mindmaps.length > 0 ? (
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="space-y-2">
                      {mindmaps.map((map, index) => {
                        const content = map.content as Mindmap;
                        return (
                          <motion.div
                            key={map.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card 
                              className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-orange-500"
                              onClick={() => setViewingMap(map)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate text-sm">
                                    {content.title || 'Mapa Mental'}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {map.lessons?.title || 'Sem aula vinculada'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(map.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingMap(map);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Network className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum mapa mental disponível</p>
                    <p className="text-xs mt-1">
                      Mapas mentais serão sincronizados automaticamente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Visualização */}
      <MindmapViewerDialog
        open={!!viewingMap}
        onClose={() => setViewingMap(null)}
        mindmap={viewingMap}
      />
    </div>
  );
});

export default MindmapSection;
