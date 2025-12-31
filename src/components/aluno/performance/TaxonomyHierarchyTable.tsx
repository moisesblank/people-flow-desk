// =====================================================
// TaxonomyHierarchyTable - Tabela Expandível de Taxonomia
// =====================================================

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TaxonomyNode } from "@/hooks/student-performance";

interface TaxonomyHierarchyTableProps {
  data: TaxonomyNode[];
  isLoading: boolean;
  className?: string;
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return "bg-emerald-500";
  if (accuracy >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function TaxonomyRow({ 
  node, 
  level = 0,
  defaultExpanded = false 
}: { 
  node: TaxonomyNode; 
  level?: number;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = node.children.size > 0;
  const childrenArray = Array.from(node.children.values()).sort((a, b) => b.totalAttempts - a.totalAttempts);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50",
          level === 0 && "bg-muted/30 font-medium"
        )}
        style={{ paddingLeft: `${12 + level * 20}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <button className="w-5 h-5 flex items-center justify-center">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        
        <span className="flex-1 truncate text-sm">{node.name}</span>
        
        <span className="text-xs text-muted-foreground w-16 text-right">
          {node.totalAttempts} Q
        </span>
        
        <div className="w-24 flex items-center gap-2">
          <Progress 
            value={node.accuracyPercent} 
            className="h-2 flex-1"
          />
          <span className={cn(
            "text-xs font-medium w-10 text-right",
            node.accuracyPercent >= 70 ? "text-emerald-600" :
            node.accuracyPercent >= 50 ? "text-amber-600" : "text-rose-600"
          )}>
            {node.accuracyPercent}%
          </span>
        </div>
      </div>

      {isExpanded && childrenArray.map(child => (
        <TaxonomyRow key={child.name} node={child} level={level + 1} />
      ))}
    </>
  );
}

export function TaxonomyHierarchyTable({ data, isLoading, className }: TaxonomyHierarchyTableProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full mb-1" />)}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhum dado de taxonomia disponível
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Desempenho por Área</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {data.map((node, i) => (
            <TaxonomyRow key={node.name} node={node} defaultExpanded={i === 0} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
