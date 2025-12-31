// =====================================================
// PersonalizedTipsPanel - Dicas de Estudo Personalizadas
// Baseado em performance + trends
// =====================================================

import { useState } from "react";
import { 
  AlertTriangle, 
  TrendingDown, 
  Target, 
  Clock, 
  Star, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StudyTip } from "@/hooks/student-performance";

interface PersonalizedTipsPanelProps {
  tips: StudyTip[];
  isLoading: boolean;
  className?: string;
  defaultExpanded?: boolean;
}

const iconMap = {
  'alert': AlertTriangle,
  'trending-down': TrendingDown,
  'target': Target,
  'clock': Clock,
  'star': Star,
  'book': BookOpen,
};

const priorityStyles = {
  high: {
    border: 'border-l-rose-500',
    bg: 'bg-rose-500/5',
    badge: 'bg-rose-500/10 text-rose-600',
    badgeText: 'Urgente',
  },
  medium: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/10 text-amber-600',
    badgeText: 'Importante',
  },
  low: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-500/10 text-emerald-600',
    badgeText: 'Positivo',
  },
};

export function PersonalizedTipsPanel({ 
  tips, 
  isLoading, 
  className,
  defaultExpanded = true 
}: PersonalizedTipsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (tips.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Continue respondendo questões para receber dicas personalizadas
          </p>
        </CardContent>
      </Card>
    );
  }

  const highPriorityCount = tips.filter(t => t.priority === 'high').length;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Dicas de Estudo</CardTitle>
            {highPriorityCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-medium">
                {highPriorityCount} urgente{highPriorityCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 pt-0">
          {tips.map((tip, index) => {
            const Icon = iconMap[tip.icon] || Lightbulb;
            const style = priorityStyles[tip.priority];

            return (
              <div
                key={tip.id}
                className={cn(
                  "p-3 rounded-lg border-l-4 transition-all duration-300",
                  "animate-fade-in hover:shadow-sm",
                  style.border,
                  style.bg
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className={cn(
                      "w-5 h-5",
                      tip.priority === 'high' ? 'text-rose-500' :
                      tip.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{tip.title}</h4>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full flex-shrink-0",
                        style.badge
                      )}>
                        {style.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tip.description}
                    </p>
                    {tip.actionLabel && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 mt-1 text-xs"
                      >
                        {tip.actionLabel} →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
