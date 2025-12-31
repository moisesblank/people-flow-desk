// ============================================
// CARD DE CONTAGEM - Estilo Anki
// Novos | Aprendendo | Revisão | Total
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, GraduationCap, RotateCcw, Layers } from 'lucide-react';
import type { CardCountByState } from '@/hooks/useFlashcardAnalytics';

interface AnkiStatsCardProps {
  counts: CardCountByState;
}

export function AnkiStatsCard({ counts }: AnkiStatsCardProps) {
  const items = [
    {
      label: 'Novos',
      value: counts.new,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      icon: BookOpen,
      percent: counts.total > 0 ? Math.round((counts.new / counts.total) * 100) : 0,
    },
    {
      label: 'Aprendendo',
      value: counts.learning + counts.relearning,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      icon: GraduationCap,
      percent: counts.total > 0 ? Math.round(((counts.learning + counts.relearning) / counts.total) * 100) : 0,
    },
    {
      label: 'Revisão',
      value: counts.review,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      icon: RotateCcw,
      percent: counts.total > 0 ? Math.round((counts.review / counts.total) * 100) : 0,
    },
    {
      label: 'Total',
      value: counts.total,
      color: 'text-primary',
      bg: 'bg-primary/10',
      icon: Layers,
      percent: 100,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Contagem de Cartões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={cn(
                'rounded-lg p-3 text-center transition-all hover:scale-105',
                item.bg
              )}
            >
              <item.icon className={cn('w-5 h-5 mx-auto mb-1', item.color)} />
              <div className={cn('text-2xl font-bold', item.color)}>
                {item.value}
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
              {item.label !== 'Total' && (
                <div className="text-[10px] text-muted-foreground/70 mt-1">
                  {item.percent}%
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Barra de progresso visual */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden flex">
          <div 
            className="bg-blue-500 h-full transition-all"
            style={{ width: `${items[0].percent}%` }}
          />
          <div 
            className="bg-orange-500 h-full transition-all"
            style={{ width: `${items[1].percent}%` }}
          />
          <div 
            className="bg-green-500 h-full transition-all"
            style={{ width: `${items[2].percent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
