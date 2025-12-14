import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SECTORS, STATUS_OPTIONS, type Sector, type EmployeeStatus } from "@/types/employee";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: EmployeeStatus | "all";
  onStatusChange: (value: EmployeeStatus | "all") => void;
  sectorFilter: Sector | "all";
  onSectorChange: (value: Sector | "all") => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export function SearchFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sectorFilter,
  onSectorChange,
  activeFiltersCount,
  onClearFilters,
}: SearchFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome, função ou email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 pr-10 h-12 search-input rounded-xl"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as EmployeeStatus | "all")}>
            <SelectTrigger className="w-[140px] h-12 bg-secondary/50 border-border/50 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todos Status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sectorFilter} onValueChange={(v) => onSectorChange(v as Sector | "all")}>
            <SelectTrigger className="w-[160px] h-12 bg-secondary/50 border-border/50 rounded-xl">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todos Setores</SelectItem>
              {SECTORS.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros ativos:
            </span>
            
            {search && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 rounded-lg">
                Busca: "{search.slice(0, 15)}{search.length > 15 ? '...' : ''}"
                <button onClick={() => onSearchChange("")} className="ml-1 hover:bg-muted rounded p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 rounded-lg">
                Status: {STATUS_OPTIONS.find(s => s.value === statusFilter)?.label}
                <button onClick={() => onStatusChange("all")} className="ml-1 hover:bg-muted rounded p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {sectorFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1 rounded-lg">
                Setor: {sectorFilter}
                <button onClick={() => onSectorChange("all")} className="ml-1 hover:bg-muted rounded p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
            >
              Limpar todos
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
