// ============================================
// 🧠 GESTÃO DE MAPAS MENTAIS
// CRUD + Geração por IA + Sincronização
// Estrutura: src/types/flashcards.ts
// ============================================

import { memo, useState, useCallback, useMemo } from 'react';
import { 
  Network, 
  Plus, 
  Search, 
  Filter,
  Sparkles,
  Loader2,
  RefreshCw,
  Download,
  ZoomIn,
  ZoomOut,
  Eye,
  Trash2,
  BookOpen,
  Brain,
  Users,
  MoreVertical,
  Edit,
  Copy
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  model_used: string | null;
  tokens_used: number | null;
  lessons?: {
    title: string;
  } | null;
}

// ============================================
// COMPONENTE: Visualizador de Nó
// ============================================

function MindmapNodeComponent({ node, level = 0, index = 0 }: { node: MindmapNode; level?: number; index?: number }) {
  const isRoot = level === 0;

  const getColor = () => {
    if (node.color) return node.color;
    if (isRoot) return 'from-primary to-purple-500';
    if (level === 1) return 'from-blue-500 to-cyan-500';
    return '';
  };

  return (
    <div className={cn("relative", isRoot && "flex flex-col items-center")}>
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
    </div>
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
            {mindmap.lessons?.title || 'Visualização do mapa mental'}
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
            Exportar JSON
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

        {/* Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            {countNodes(content.nodes || [])} nós • 
            Gerado: {format(new Date(mindmap.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </span>
          <span>{mindmap.model_used || 'IA'}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// COMPONENTE: Modal de Geração
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

  const { data: lessons } = useQuery({
    queryKey: ['lessons-for-mindmap-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title')
        .order('title')
        .limit(200);
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
      toast.success('Mapa mental gerado!');
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
            Gerar Mapa Mental
          </DialogTitle>
          <DialogDescription>
            IA criará um mapa mental do conteúdo da aula
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
              placeholder="Ex: Reações de substituição..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading || !selectedLesson}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Gerar</>
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

const GestaoMapasMentais = memo(function GestaoMapasMentais() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [viewingMap, setViewingMap] = useState<SavedMindmap | null>(null);
  const [deletingMap, setDeletingMap] = useState<SavedMindmap | null>(null);

  // Buscar todos os mapas mentais
  const { data: mindmaps, isLoading, refetch } = useQuery({
    queryKey: ['admin-mindmaps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select(`
          id,
          lesson_id,
          content_type,
          content,
          created_at,
          model_used,
          tokens_used,
          lessons:lesson_id (
            title
          )
        `)
        .eq('content_type', 'mindmap')
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data as SavedMindmap[];
    },
    staleTime: 30_000,
  });

  // Estatísticas
  const stats = useMemo(() => {
    if (!mindmaps) return { total: 0, lessons: 0, tokens: 0 };
    return {
      total: mindmaps.length,
      lessons: new Set(mindmaps.map(m => m.lesson_id)).size,
      tokens: mindmaps.reduce((acc, m) => acc + (m.tokens_used || 0), 0),
    };
  }, [mindmaps]);

  // Filtrar
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

  // Deletar
  const handleDelete = async () => {
    if (!deletingMap) return;

    try {
      const { error } = await supabase
        .from('ai_generated_content')
        .delete()
        .eq('id', deletingMap.id);

      if (error) throw error;
      toast.success('Mapa mental excluído');
      setDeletingMap(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir');
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-mindmaps'] });
    toast.success('Dados atualizados!');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Network className="w-8 h-8 text-primary" />
              Gestão de Mapas Mentais
            </h1>
            <p className="text-muted-foreground">
              Gere e gerencie mapas mentais → Sincronizado com /alunos/mapas-mentais
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
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
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <p className="text-2xl font-bold">{stats.lessons}</p>
                  <p className="text-xs text-muted-foreground">Aulas Mapeadas</p>
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
                  <p className="text-2xl font-bold">{stats.tokens.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Tokens Usados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">∞</p>
                  <p className="text-xs text-muted-foreground">Alunos Acessam</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mapas mentais..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground mt-2">Carregando mapas mentais...</p>
              </div>
            ) : filteredMaps.length === 0 ? (
              <div className="p-8 text-center">
                <Network className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Nenhum mapa mental encontrado</p>
                <p className="text-muted-foreground">Gere mapas mentais com IA</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Aula</TableHead>
                    <TableHead>Nós</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaps.map((map) => {
                    const content = map.content as Mindmap;
                    const nodeCount = countNodes(content.nodes || []);
                    
                    return (
                      <TableRow key={map.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Network className="w-4 h-4 text-primary" />
                            <span className="truncate max-w-[200px]">
                              {content.title || 'Mapa Mental'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                            {map.lessons?.title || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{nodeCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {map.model_used || 'IA'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(map.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingMap(map)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const dataStr = JSON.stringify(content, null, 2);
                                navigator.clipboard.writeText(dataStr);
                                toast.success('JSON copiado!');
                              }}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar JSON
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeletingMap(map)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Rodapé */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Exibindo {filteredMaps.length} de {mindmaps?.length || 0} mapas</span>
          <span>Sincronizado com /alunos/mapas-mentais</span>
        </div>
      </div>

      {/* Modais */}
      <GenerateMindmapDialog
        open={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={refetch}
      />

      <MindmapViewerDialog
        open={!!viewingMap}
        onClose={() => setViewingMap(null)}
        mindmap={viewingMap}
      />

      {/* Dialog de exclusão */}
      <Dialog open={!!deletingMap} onOpenChange={() => setDeletingMap(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Mapa Mental?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingMap(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

export default GestaoMapasMentais;
