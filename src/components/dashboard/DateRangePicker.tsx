// ============================================
// MOISES MEDEIROS v5.0 - DATE RANGE PICKER
// Pilar 4: Dashboard BI - Filtros Avançados
// ============================================

import { useState } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  showComparison?: boolean;
  onComparisonChange?: (enabled: boolean) => void;
  comparisonEnabled?: boolean;
}

const presets = [
  {
    label: "Hoje",
    getValue: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    label: "Últimos 7 dias",
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  {
    label: "Últimos 30 dias",
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
  },
  {
    label: "Este mês",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "Mês passado",
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "Últimos 3 meses",
    getValue: () => ({
      from: subMonths(new Date(), 3),
      to: new Date(),
    }),
  },
  {
    label: "Este ano",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: new Date(),
    }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  showComparison = false,
  onComparisonChange,
  comparisonEnabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    onChange(range);
    setSelectedPreset(preset.label);
    setIsOpen(false);
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setSelectedPreset(null);
    } else if (range?.from) {
      onChange({ from: range.from, to: range.from });
    }
  };

  const formatDateRange = () => {
    if (value.from.toDateString() === value.to.toDateString()) {
      return format(value.from, "dd 'de' MMMM, yyyy", { locale: ptBR });
    }
    return `${format(value.from, "dd MMM", { locale: ptBR })} - ${format(value.to, "dd MMM, yyyy", { locale: ptBR })}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-10 px-4 rounded-xl border-border/50 bg-secondary/30 hover:bg-secondary/50",
            !value && "text-muted-foreground"
          )}
        >
          <Calendar className="mr-2 h-4 w-4 text-primary" />
          <span className="flex-1">{formatDateRange()}</span>
          <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-auto p-0 border-border/50 bg-card/95 backdrop-blur-xl" 
        align="start"
        sideOffset={8}
      >
        <div className="flex">
          {/* Presets */}
          <div className="border-r border-border/30 p-3 space-y-1 min-w-[140px]">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">
              Período
            </p>
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                  selectedPreset === preset.label
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <CalendarComponent
              mode="range"
              defaultMonth={value.from}
              selected={{ from: value.from, to: value.to }}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={ptBR}
              className="rounded-lg"
            />
            
            {/* Comparison Toggle */}
            {showComparison && onComparisonChange && (
              <div className="flex items-center justify-between px-3 pt-3 mt-3 border-t border-border/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                  <span>Comparar com período anterior</span>
                </div>
                <Button
                  variant={comparisonEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => onComparisonChange(!comparisonEnabled)}
                  className="h-7 px-3 text-xs"
                >
                  {comparisonEnabled ? "Ativo" : "Ativar"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
