// ============================================
// MAPA MENTAL TAB - Visualização do conteúdo
// Integrado com IA via useLessonAI
// ANTES: Usava SAMPLE_MINDMAP estático
// DEPOIS: Gera via IA + cache + fallback
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Download, RefreshCw, ZoomIn, ZoomOut, Loader2, Sparkles, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLessonAI } from '@/hooks/ai/useLessonAI';
import { useQuery } from '@tanstack/react-query';
import type { MindmapNode, Mindmap } from '@/types/flashcards';

interface MindmapTabProps {
  lessonId: string;
  lessonTitle?: string;
}

// Mapa mental de fallback
const FALLBACK_MINDMAP: Mindmap = {
  title: 'Diagramas de Fases',
  nodes: [
    {
      id: 'root',
      label: 'Diagramas de Fases',
      type: 'root',
      color: 'from-primary to-purple-500',
      children: [
        {
          id: 'estados',
          label: 'Estados Físicos',
          type: 'branch',
          color: 'from-blue-500 to-cyan-500',
          children: [
            { id: 'solido', label: 'Sólido', type: 'leaf' },
            { id: 'liquido', label: 'Líquido', type: 'leaf' },
            { id: 'gasoso', label: 'Gasoso', type: 'leaf' },
            { id: 'supercritico', label: 'Supercrítico', type: 'leaf' }
          ]
        },
        {
          id: 'pontos',
          label: 'Pontos Especiais',
          type: 'branch',
          color: 'from-amber-500 to-orange-500',
          children: [
            { id: 'triplo', label: 'Ponto Triplo', type: 'leaf' },
            { id: 'critico', label: 'Ponto Crítico', type: 'leaf' },
            { id: 'fusao', label: 'Ponto de Fusão', type: 'leaf' },
            { id: 'ebulicao', label: 'Ponto de Ebulição', type: 'leaf' }
          ]
        },
        {
          id: 'mudancas',
          label: 'Mudanças de Estado',
          type: 'branch',
          color: 'from-green-500 to-emerald-500',
          children: [
            { id: 'fusao-m', label: 'Fusão', type: 'leaf' },
            { id: 'vaporizacao', label: 'Vaporização', type: 'leaf' },
            { id: 'sublimacao', label: 'Sublimação', type: 'leaf' },
            { id: 'solidificacao', label: 'Solidificação', type: 'leaf' }
          ]
        },
        {
          id: 'agua',
          label: 'Água - Caso Especial',
          type: 'branch',
          color: 'from-pink-500 to-rose-500',
          children: [
            { id: 'anomalia', label: 'Anomalia da Água', type: 'leaf' },
            { id: 'densidade', label: 'Gelo menos denso', type: 'leaf' },
            { id: 'inclinacao', label: 'Linha de fusão negativa', type: 'leaf' }
          ]
        }
      ]
    }
  ],
};

// Componente recursivo para renderizar nós
function MindmapNodeComponent({ node, level = 0, index = 0 }: { node: MindmapNode; level?: number; index?: number }) {
  const isRoot = level === 0;
  const delay = level * 0.1 + index * 0.05;

  // Determinar cor baseada no nível se não especificada
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
      className={cn(
        "relative",
        isRoot && "flex flex-col items-center"
      )}
    >
      {/* Node */}
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

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className={cn(
          "flex gap-4 mt-4",
          isRoot ? "flex-row flex-wrap justify-center" : "flex-col ml-4"
        )}>
          {/* Connection lines for root children */}
          {isRoot && (
            <div className="absolute top-full left-1/2 w-px h-4 bg-border" />
          )}
          
          {node.children.map((child, idx) => (
            <div key={child.id} className="relative">
              {/* Vertical line for non-root */}
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

function MindmapTab({ lessonId, lessonTitle }: MindmapTabProps) {
  const { generateContent, getCachedContent, isLoading: isGenerating } = useLessonAI();
  const [zoom, setZoom] = useState(1);
  const [mindmap, setMindmap] = useState<Mindmap | null>(null);

  // Buscar mapa mental do cache IA
  const { data: cachedMindmap, isLoading, refetch } = useQuery({
    queryKey: ['lesson-mindmap', lessonId],
    queryFn: async () => {
      const cached = await getCachedContent(lessonId, 'mindmap');
      if (cached?.content) {
        return parseAIMindmap(cached.content, lessonTitle);
      }
      return null;
    },
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 30, // 30 min
  });

  // Atualizar mindmap quando cache carregar
  useEffect(() => {
    if (cachedMindmap) {
      setMindmap(cachedMindmap);
    } else if (!isLoading) {
      // Usar fallback se não tem cache
      setMindmap(FALLBACK_MINDMAP);
    }
  }, [cachedMindmap, isLoading]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  const handleRegenerate = useCallback(async () => {
    const content = await generateContent(lessonId, 'mindmap', lessonTitle);
    if (content) {
      const newMindmap = parseAIMindmap(content, lessonTitle);
      if (newMindmap) {
        setMindmap(newMindmap);
      }
    }
    refetch();
  }, [lessonId, lessonTitle, generateContent, refetch]);

  const handleExport = useCallback(() => {
    if (!mindmap) return;
    
    // Exportar como JSON
    const dataStr = JSON.stringify(mindmap, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${lessonId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [mindmap, lessonId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando mapa mental...</p>
        </div>
      </div>
    );
  }

  // Usar fallback se não tem mindmap
  const displayMindmap = mindmap || FALLBACK_MINDMAP;
  const rootNode = displayMindmap.nodes?.[0] || { id: 'empty', label: displayMindmap.title || 'Mapa Mental' };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Network className="h-5 w-5 text-pink-500" />
          </div>
          <div>
            <h3 className="font-semibold">Mapa Mental</h3>
            <p className="text-xs text-muted-foreground">
              {mindmap === FALLBACK_MINDMAP ? 'Exemplo • Gere o seu!' : 'Visualização hierárquica do conteúdo'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground min-w-[50px] text-center">
              {(zoom * 100).toFixed(0)}%
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRegenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {isGenerating ? 'Gerando...' : 'Regenerar'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Mindmap Container */}
      <div className="relative overflow-auto rounded-xl border border-border bg-muted/20 p-8 min-h-[400px]">
        <div 
          className="flex justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          <MindmapNodeComponent node={rootNode} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Badge variant="outline" className="gap-1">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-purple-500" />
          Tema Central
        </Badge>
        <Badge variant="outline" className="gap-1">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
          Subtemas
        </Badge>
        <Badge variant="outline" className="gap-1">
          <div className="w-2 h-2 rounded-full bg-muted" />
          Conceitos
        </Badge>
        {mindmap === FALLBACK_MINDMAP && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Clique em Regenerar para criar com IA
          </Badge>
        )}
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

/**
 * Parseia mapa mental gerado pela IA
 */
function parseAIMindmap(content: unknown, fallbackTitle?: string): Mindmap | null {
  try {
    if (!content) return null;
    
    // Se já é um Mindmap válido
    if (typeof content === 'object' && content !== null) {
      const obj = content as Record<string, unknown>;
      
      // Formato esperado: { title, nodes, summary }
      if (obj.title && Array.isArray(obj.nodes)) {
        return {
          title: String(obj.title),
          nodes: convertNodesToHierarchy(obj.nodes as unknown[]),
          summary: obj.summary ? String(obj.summary) : undefined,
        };
      }
      
      // Formato alternativo: { mindmap: {...} }
      if (obj.mindmap && typeof obj.mindmap === 'object') {
        return parseAIMindmap(obj.mindmap, fallbackTitle);
      }
      
      // Formato flat: array de nodes com parent
      if (Array.isArray(obj)) {
        return {
          title: fallbackTitle || 'Mapa Mental',
          nodes: convertNodesToHierarchy(obj),
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao parsear mindmap IA:', error);
    return null;
  }
}

/**
 * Converte array flat de nodes para estrutura hierárquica
 */
function convertNodesToHierarchy(flatNodes: unknown[]): MindmapNode[] {
  const nodeMap = new Map<string, MindmapNode>();
  const rootNodes: MindmapNode[] = [];
  
  // Primeiro passo: criar todos os nós
  flatNodes.forEach((item) => {
    if (typeof item !== 'object' || item === null) return;
    const obj = item as Record<string, unknown>;
    
    const node: MindmapNode = {
      id: String(obj.id || `node-${Math.random()}`),
      label: String(obj.label || obj.name || ''),
      type: (obj.type as MindmapNode['type']) || 'leaf',
      color: obj.color ? String(obj.color) : undefined,
      children: [],
    };
    
    nodeMap.set(node.id, node);
  });
  
  // Segundo passo: construir hierarquia
  flatNodes.forEach((item) => {
    if (typeof item !== 'object' || item === null) return;
    const obj = item as Record<string, unknown>;
    
    const nodeId = String(obj.id || '');
    const parentId = obj.parent ? String(obj.parent) : null;
    const node = nodeMap.get(nodeId);
    
    if (!node) return;
    
    if (parentId && nodeMap.has(parentId)) {
      const parent = nodeMap.get(parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else if (!parentId || obj.type === 'root') {
      rootNodes.push(node);
    }
  });
  
  return rootNodes.length > 0 ? rootNodes : Array.from(nodeMap.values()).slice(0, 1);
}

export default MindmapTab;
