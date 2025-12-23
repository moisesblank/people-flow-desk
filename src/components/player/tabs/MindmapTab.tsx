// ============================================
// MAPA MENTAL TAB - Visualização do conteúdo
// Gerado por IA
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { Network, Download, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MindmapTabProps {
  lessonId: string;
}

interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
  color?: string;
}

const SAMPLE_MINDMAP: MindmapNode = {
  id: 'root',
  label: 'Diagramas de Fases',
  color: 'from-primary to-purple-500',
  children: [
    {
      id: 'estados',
      label: 'Estados Físicos',
      color: 'from-blue-500 to-cyan-500',
      children: [
        { id: 'solido', label: 'Sólido' },
        { id: 'liquido', label: 'Líquido' },
        { id: 'gasoso', label: 'Gasoso' },
        { id: 'supercritico', label: 'Supercrítico' }
      ]
    },
    {
      id: 'pontos',
      label: 'Pontos Especiais',
      color: 'from-amber-500 to-orange-500',
      children: [
        { id: 'triplo', label: 'Ponto Triplo' },
        { id: 'critico', label: 'Ponto Crítico' },
        { id: 'fusao', label: 'Ponto de Fusão' },
        { id: 'ebulicao', label: 'Ponto de Ebulição' }
      ]
    },
    {
      id: 'mudancas',
      label: 'Mudanças de Estado',
      color: 'from-green-500 to-emerald-500',
      children: [
        { id: 'fusao-m', label: 'Fusão' },
        { id: 'vaporizacao', label: 'Vaporização' },
        { id: 'sublimacao', label: 'Sublimação' },
        { id: 'solidificacao', label: 'Solidificação' }
      ]
    },
    {
      id: 'agua',
      label: 'Água - Caso Especial',
      color: 'from-pink-500 to-rose-500',
      children: [
        { id: 'anomalia', label: 'Anomalia da Água' },
        { id: 'densidade', label: 'Gelo menos denso' },
        { id: 'inclinacao', label: 'Linha de fusão negativa' }
      ]
    }
  ]
};

function MindmapNode({ node, level = 0, index = 0 }: { node: MindmapNode; level?: number; index?: number }) {
  const isRoot = level === 0;
  const delay = level * 0.1 + index * 0.05;

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
            ? `bg-gradient-to-r ${node.color} text-white text-lg py-3 px-6 shadow-lg` 
            : level === 1 
              ? `bg-gradient-to-r ${node.color} text-white shadow-md`
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
              <MindmapNode node={child} level={level + 1} index={idx} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function MindmapTab({ lessonId }: MindmapTabProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

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
              Visualização hierárquica do conteúdo
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
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerar
          </Button>
          <Button variant="outline" size="sm">
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
          <MindmapNode node={SAMPLE_MINDMAP} />
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
      </div>
    </div>
  );
}

export default MindmapTab;
