// ============================================
// FILTROS DE PERÍODO FINANCEIRO
// Diário, Semanal, Mensal, Anual, 10 Anos
// Com clique em dia para adicionar gasto
// ============================================

import { motion } from "framer-motion";
import { Calendar, CalendarDays, CalendarRange, History, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import type { PeriodFilter } from "@/hooks/useFinancialHistory";
import { cn } from "@/lib/utils";

interface PeriodFilterTabsProps {
  period: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  customRange?: { start: Date; end: Date };
  onCustomRangeChange?: (range: { start: Date; end: Date }) => void;
  onDayClick?: (date: Date) => void;
}

const periodOptions: { value: PeriodFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "diario", label: "Hoje", icon: Clock },
  { value: "semanal", label: "Semana", icon: CalendarDays },
  { value: "mensal", label: "Mês", icon: Calendar },
  { value: "anual", label: "Ano", icon: CalendarRange },
  { value: "10anos", label: "10 Anos", icon: History },
];

export function PeriodFilterTabs({ 
  period, 
  onPeriodChange, 
  customRange,
  onCustomRangeChange,
  onDayClick,
}: PeriodFilterTabsProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const handleDaySelect = (date: Date | undefined) => {
    if (date && onDayClick) {
      onDayClick(date);
      setIsAddExpenseOpen(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      {periodOptions.map((option) => {
        const Icon = option.icon;
        const isActive = period === option.value;
        
        return (
          <Button
            key={option.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange(option.value)}
            className={cn(
              "gap-2 transition-all",
              isActive && "shadow-lg shadow-primary/25"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </Button>
        );
      })}
      
      {/* Período customizado */}
      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={period === "custom" ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-2",
              period === "custom" && "shadow-lg shadow-primary/25"
            )}
          >
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">
              {period === "custom" && customRange
                ? `${format(customRange.start, "dd/MM")} - ${format(customRange.end, "dd/MM")}`
                : "Personalizado"
              }
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-sm">Selecione o período</h4>
            <div className="grid gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Data inicial</label>
                <CalendarComponent
                  mode="single"
                  selected={customRange?.start}
                  onSelect={(date) => {
                    if (date && onCustomRangeChange) {
                      onCustomRangeChange({
                        start: date,
                        end: customRange?.end || date,
                      });
                    }
                  }}
                  locale={ptBR}
                  className="rounded-md border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Data final</label>
                <CalendarComponent
                  mode="single"
                  selected={customRange?.end}
                  onSelect={(date) => {
                    if (date && onCustomRangeChange) {
                      onCustomRangeChange({
                        start: customRange?.start || date,
                        end: date,
                      });
                      onPeriodChange("custom");
                      setIsCustomOpen(false);
                    }
                  }}
                  locale={ptBR}
                  className="rounded-md border"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Botão para adicionar gasto por data - NOVO */}
      {onDayClick && (
        <Popover open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/50 hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Adicionar por Data</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Clique em um dia para adicionar gasto
              </h4>
              <CalendarComponent
                mode="single"
                onSelect={handleDaySelect}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>
          </PopoverContent>
        </Popover>
      )}
    </motion.div>
  );
}
