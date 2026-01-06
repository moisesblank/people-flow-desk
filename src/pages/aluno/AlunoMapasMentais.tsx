// ============================================
// 🧠 MAPAS MENTAIS - Portal do Aluno
// Visualização e criação de mapas mentais
// Integrado com IA via useLessonAI
// ============================================

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  Plus, 
  Search, 
  Filter,
  Sparkles,
  Loader2,
  ChevronLeft,
  RefreshCw,
  Download,
  ZoomIn,
  ZoomOut,
  Eye,
  Trash2,
  BookOpen,
  Brain,
  Layers,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLessonAI } from '@/hooks/ai/useLessonAI';
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

// ============================================
// COMPONENTE: Visualizador de Mapa Mental
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

interface ViewerDialogProps {
  open: boolean;
  onClose: () => void;
  mindmap: SavedMindmap | null;
}

const MindmapViewerDialog = memo(function MindmapViewerDialog({ open, onClose, mindmap }: ViewerDialogProps) {
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
// COMPONENTE: Modal de Geração por IA
// ============================================

interface GenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GenerateMindmapDialog = memo(function GenerateMindmapDialog({ open, onClose, onSuccess }: GenerateDialogProps) {
  const { generateContent, isLoading } = useLessonAI();
  const [topic, setTopic] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');

  // Buscar aulas disponíveis
  const { data: lessons } = useQuery({
    queryKey: ['lessons-for-mindmap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, areas:area_id(name)')
        .eq('status', 'published')
        .order('title')
        .limit(100);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const handleGenerate = async () => {
    if (!selectedLesson) {
      toast.error('Selecione uma aula');
      return;
    }

    const lesson = lessons?.find(l => l.id === selectedLesson);
    const context = topic || lesson?.title;

    const content = await generateContent(selectedLesson, 'mindmap', context);
    
    if (content) {
      toast.success('Mapa mental gerado com sucesso!');
      onSuccess();
      onClose();
      setTopic('');
      setSelectedLesson('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerar Mapa Mental com IA
          </DialogTitle>
          <DialogDescription>
            Escolha uma aula e a IA criará um mapa mental do conteúdo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Aula *</Label>
            <Select value={selectedLesson} onValueChange={setSelectedLesson}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma aula" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {lessons?.map(lesson => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tópico específico (opcional)</Label>
            <Textarea
              placeholder="Ex: Reações de substituição nucleofílica..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar o título da aula
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading || !selectedLesson}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Mapa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// PÁGINA PRINCIPAL
// ============================================

const AlunoMapasMentais = memo(function AlunoMapasMentais() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [viewingMap, setViewingMap] = useState<SavedMindmap | null>(null);

  // Buscar mapas mentais salvos
  const { data: mindmaps, isLoading, refetch } = useQuery({
    queryKey: ['user-mindmaps'],
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
        .limit(50);
      
      if (error) throw error;
      return data as SavedMindmap[];
    },
    staleTime: 30_000,
  });

  // Filtrar mapas
  const filteredMaps = useMemo(() => {
    if (!mindmaps) return [];
    if (!searchQuery) return mindmaps;
    
    const query = searchQuery.toLowerCase();
    return mindmaps.filter(map => {
      const content = map.content as Mindmap;
      return content.title?.toLowerCase().includes(query) ||
             map.lessons?.title?.toLowerCase().includes(query);
    });
  }, [mindmaps, searchQuery]);

  const handleSuccess = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/alunos/dashboard')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Network className="w-8 h-8 text-primary" />
                Mapas Mentais
              </h1>
              <p className="text-muted-foreground">
                Visualize conexões entre conceitos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={() => setIsGenerateOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar com IA
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Network className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mindmaps?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total de Mapas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(mindmaps?.map(m => m.lesson_id)).size || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Aulas Mapeadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Layers className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">∞</p>
                  <p className="text-xs text-muted-foreground">Conexões</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">IA</p>
                  <p className="text-xs text-muted-foreground">Geração Automática</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar mapas mentais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de Mapas */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredMaps.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Network className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhum mapa mental ainda</h3>
              <p className="text-muted-foreground mb-6">
                Gere seu primeiro mapa mental com IA para visualizar conceitos!
              </p>
              <Button onClick={() => setIsGenerateOpen(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Mapa Mental
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredMaps.map((map, idx) => {
                const content = map.content as Mindmap;
                const nodeCount = countNodes(content.nodes || []);
                
                return (
                  <motion.div
                    key={map.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
                      onClick={() => setViewingMap(map)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                              <Network className="w-5 h-5 text-primary" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {nodeCount} nós
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setViewingMap(map); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardTitle className="text-lg mt-2 line-clamp-2">
                          {content.title || 'Mapa Mental'}
                        </CardTitle>
                        {map.lessons?.title && (
                          <CardDescription className="line-clamp-1">
                            <BookOpen className="w-3 h-3 inline mr-1" />
                            {map.lessons.title}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(map.created_at), "dd MMM yyyy", { locale: ptBR })}
                          <span className="ml-auto">
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            Gerado por IA
                          </span>
                        </div>
                        
                        {/* Preview mini dos nós */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {getPreviewLabels(content.nodes || []).slice(0, 5).map((label, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                          {getPreviewLabels(content.nodes || []).length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{getPreviewLabels(content.nodes || []).length - 5}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modais */}
      <GenerateMindmapDialog
        open={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={handleSuccess}
      />

      <MindmapViewerDialog
        open={!!viewingMap}
        onClose={() => setViewingMap(null)}
        mindmap={viewingMap}
      />
    </div>
  );
});

// ============================================
// HELPERS
// ============================================

function countNodes(nodes: MindmapNode[]): number {
  let count = nodes.length;
  nodes.forEach(node => {
    if (node.children) {
      count += countNodes(node.children);
    }
  });
  return count;
}

function getPreviewLabels(nodes: MindmapNode[]): string[] {
  const labels: string[] = [];
  
  function traverse(nodeList: MindmapNode[]) {
    nodeList.forEach(node => {
      if (labels.length < 10) {
        labels.push(node.label);
      }
      if (node.children) {
        traverse(node.children);
      }
    });
  }
  
  traverse(nodes);
  return labels;
}

export default AlunoMapasMentais;
