// ============================================
// GRÁFICO DE PREVISÃO - Revisões Futuras
// Estilo Anki - Próximos 30 dias
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Calendar, TrendingUp } from 'lucide-react';
import type { ForecastDay } from '@/hooks/useFlashcardAnalytics';

interface ForecastChartProps {
  forecast: ForecastDay[];
}

export function ForecastChart({ forecast }: ForecastChartProps) {
  const maxCount = Math.max(...forecast.map(d => d.count), 1);
  
  // Resumo por período
  const todayCount = forecast[0]?.count || 0;
  const weekCount = forecast.slice(0, 7).reduce((s, d) => s + d.count, 0);
  const monthCount = forecast.reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Previsão de Revisões
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <div className="text-xl font-bold text-primary">{todayCount}</div>
            <div className="text-[10px] text-muted-foreground">Hoje</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-500/10">
            <div className="text-xl font-bold text-orange-500">{weekCount}</div>
            <div className="text-[10px] text-muted-foreground">7 dias</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <div className="text-xl font-bold text-blue-500">{monthCount}</div>
            <div className="text-[10px] text-muted-foreground">30 dias</div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="h-32 flex items-end gap-[2px]">
          {forecast.slice(0, 30).map((day, i) => {
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            const isToday = i === 0;
            const isWeek = i < 7;
            
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center"
                title={`${day.date}: ${day.count} cards`}
              >
                <div
                  className={cn(
                    'w-full rounded-t transition-all hover:opacity-80',
                    isToday ? 'bg-primary' : isWeek ? 'bg-orange-500' : 'bg-blue-500/70'
                  )}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Hoje</span>
          <span>1 semana</span>
          <span>2 semanas</span>
          <span>3 semanas</span>
          <span>4 semanas</span>
        </div>

        {monthCount === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-4">
            <TrendingUp className="w-8 h-8 mx-auto opacity-30 mb-2" />
            Sem revisões agendadas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
