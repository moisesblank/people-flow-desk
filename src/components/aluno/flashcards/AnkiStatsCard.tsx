// ============================================
// 📊 ANKI STATS CARD - Year 2300 Cinematic
// Contagem de cartões estilo Iron Man HUD
// ============================================

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
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      glowColor: 'shadow-blue-500/20',
      icon: BookOpen,
      percent: counts.total > 0 ? Math.round((counts.new / counts.total) * 100) : 0,
    },
    {
      label: 'Aprendendo',
      value: counts.learning + counts.relearning,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      glowColor: 'shadow-orange-500/20',
      icon: GraduationCap,
      percent: counts.total > 0 ? Math.round(((counts.learning + counts.relearning) / counts.total) * 100) : 0,
    },
    {
      label: 'Revisão',
      value: counts.review,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      glowColor: 'shadow-green-500/20',
      icon: RotateCcw,
      percent: counts.total > 0 ? Math.round((counts.review / counts.total) * 100) : 0,
    },
    {
      label: 'Total',
      value: counts.total,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      glowColor: 'shadow-primary/20',
      icon: Layers,
      percent: 100,
    },
  ];

  return (
    <div className="rounded-xl bg-card/50 border border-border/50 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">Contagem de Cartões</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              'relative rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 border',
              item.bgColor,
              item.borderColor,
              'hover:shadow-lg',
              item.glowColor
            )}
          >
            <item.icon className={cn('w-5 h-5 mx-auto mb-2', item.color)} />
            <div className={cn('text-2xl md:text-3xl font-bold', item.color)}>
              {item.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            {item.label !== 'Total' && (
              <div className="text-[10px] text-muted-foreground/70 mt-1">
                {item.percent}%
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Barra de progresso visual - Energy Bar */}
      <div className="mt-5 h-2 bg-muted/50 rounded-full overflow-hidden flex">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-500"
          style={{ width: `${items[0].percent}%` }}
        />
        <div 
          className="bg-gradient-to-r from-orange-500 to-orange-400 h-full transition-all duration-500"
          style={{ width: `${items[1].percent}%` }}
        />
        <div 
          className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all duration-500"
          style={{ width: `${items[2].percent}%` }}
        />
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Novos</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Aprendendo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Revisão</span>
        </div>
      </div>
    </div>
  );
}
