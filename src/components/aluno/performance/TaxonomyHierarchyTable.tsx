// =====================================================
// TaxonomyHierarchyTable - Tabela Expandível de Taxonomia
// MACRO → MICRO → TEMA (se houver)
// Acurácia %, Total, Erros - TUDO EXPANDIDO
// =====================================================

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TaxonomyNode } from "@/hooks/student-performance";

interface TaxonomyHierarchyTableProps {
  data: TaxonomyNode[];
  isLoading: boolean;
  className?: string;
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return "text-emerald-500";
  if (accuracy >= 50) return "text-amber-500";
  return "text-rose-500";
}

// Componente de linha para cada nível
function TaxonomyRowDisplay({ 
  name, 
  total, 
  correct, 
  accuracy, 
  level 
}: { 
  name: string; 
  total: number;
  correct: number;
  accuracy: number;
  level: number;
}) {
  const errors = total - correct;
  
  // Não renderizar linhas vazias
  if (!name || name.trim() === '') return null;
  
  return (
    <TableRow className={cn(
      "transition-colors",
      level === 0 && "bg-muted/40 font-semibold",
      level === 1 && "bg-muted/20",
      level === 2 && "bg-transparent"
    )}>
      <TableCell 
        className="py-2"
        style={{ paddingLeft: `${12 + level * 24}px` }}
      >
        <span className={cn(
          "text-sm",
          level === 0 && "font-semibold text-foreground",
          level === 1 && "font-medium text-foreground/90",
          level === 2 && "text-muted-foreground"
        )}>
          {level === 1 && "└ "}
          {level === 2 && "    └ "}
          {name}
        </span>
      </TableCell>
      
      {/* Acurácia */}
      <TableCell className="py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Progress 
            value={accuracy} 
            className="h-2 w-16"
          />
          <span className={cn(
            "text-sm font-medium min-w-[40px]",
            getAccuracyColor(accuracy)
          )}>
            {accuracy.toFixed(0)}%
          </span>
        </div>
      </TableCell>
      
      {/* Total */}
      <TableCell className="py-2 text-center">
        <span className={cn(
          "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium border",
          "bg-primary/10 border-primary/20 text-primary"
        )}>
          {total}
        </span>
      </TableCell>
      
      {/* Erros */}
      <TableCell className="py-2 text-center">
        <span className={cn(
          "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium border",
          errors > 0 
            ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
        )}>
          {errors}
        </span>
      </TableCell>
    </TableRow>
  );
}

// Função para gerar todas as linhas flat
function generateAllRows(data: TaxonomyNode[]): React.ReactNode[] {
  const rows: React.ReactNode[] = [];
  
  const sortedMacros = [...data].sort((a, b) => b.totalAttempts - a.totalAttempts);
  
  for (const macro of sortedMacros) {
    // MACRO (Nível 0)
    rows.push(
      <TaxonomyRowDisplay
        key={`macro-${macro.name}`}
        name={macro.name}
        total={macro.totalAttempts}
        correct={macro.correctAttempts}
        accuracy={macro.accuracyPercent}
        level={0}
      />
    );
    
    // MICROS (Nível 1)
    const sortedMicros = Array.from(macro.children.values())
      .filter(m => m.name && m.name.trim() !== '')
      .sort((a, b) => b.totalAttempts - a.totalAttempts);
    
    for (const micro of sortedMicros) {
      rows.push(
        <TaxonomyRowDisplay
          key={`micro-${macro.name}-${micro.name}`}
          name={micro.name}
          total={micro.totalAttempts}
          correct={micro.correctAttempts}
          accuracy={micro.accuracyPercent}
          level={1}
        />
      );
      
      // TEMAS (Nível 2) - SE HOUVER
      const sortedTemas = Array.from(micro.children.values())
        .filter(t => t.name && t.name.trim() !== '')
        .sort((a, b) => b.totalAttempts - a.totalAttempts);
      
      for (const tema of sortedTemas) {
        rows.push(
          <TaxonomyRowDisplay
            key={`tema-${macro.name}-${micro.name}-${tema.name}`}
            name={tema.name}
            total={tema.totalAttempts}
            correct={tema.correctAttempts}
            accuracy={tema.accuracyPercent}
            level={2}
          />
        );
      }
    }
  }
  
  return rows;
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
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50%]">Área / Assunto</TableHead>
                <TableHead className="text-center w-[20%]">Acurácia</TableHead>
                <TableHead className="text-center w-[15%]">Total</TableHead>
                <TableHead className="text-center w-[15%]">Erros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generateAllRows(data)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
