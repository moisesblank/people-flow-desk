// ============================================
// ICON PICKER - Seletor de ícones Lucide
// Com busca, categorias e preview
// ============================================

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ICON_MAP, ICON_CATEGORIES, searchIcons, getIconComponent } from "@/lib/iconMap";
import { Search, ChevronDown } from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function IconPicker({ 
  value, 
  onChange, 
  placeholder = "Selecione um ícone",
  disabled = false 
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Ícone atual selecionado
  const CurrentIcon = value ? getIconComponent(value) : null;

  // Filtrar ícones baseado na busca ou categoria
  const filteredIcons = useMemo(() => {
    if (searchTerm) {
      return searchIcons(searchTerm);
    }
    
    if (activeCategory && ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES]) {
      return ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES];
    }
    
    // Mostrar ícones populares por padrão
    return [
      "LayoutDashboard", "Users", "Settings", "FileText", "Wallet",
      "Brain", "BookOpen", "Calendar", "BarChart3", "Shield",
      "PlayCircle", "MessageCircle", "Heart", "Star", "Zap",
      "Globe", "Code", "Activity", "Target", "Award",
      "Megaphone", "Rocket", "Crown", "Sparkles", "Trophy"
    ];
  }, [searchTerm, activeCategory]);

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            {CurrentIcon ? (
              <>
                <CurrentIcon className="h-4 w-4" />
                <span>{value}</span>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ícone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveCategory(null);
              }}
              className="pl-8"
            />
          </div>
        </div>

        {/* Categorias */}
        {!searchTerm && (
          <div className="p-2 border-b">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1 pb-1">
                <Button
                  variant={activeCategory === null ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(null)}
                  className="text-xs h-7"
                >
                  Populares
                </Button>
                {Object.keys(ICON_CATEGORIES).map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className="text-xs h-7"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Grid de Ícones */}
        <ScrollArea className="h-64">
          <div className="p-2 grid grid-cols-6 gap-1">
            {filteredIcons.map((iconName) => {
              const Icon = ICON_MAP[iconName];
              if (!Icon) return null;
              
              return (
                <Button
                  key={iconName}
                  variant={value === iconName ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0",
                    value === iconName && "ring-2 ring-primary"
                  )}
                  onClick={() => handleSelect(iconName)}
                  title={iconName}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              );
            })}
          </div>
          
          {filteredIcons.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum ícone encontrado
            </div>
          )}
        </ScrollArea>

        {/* Ícone selecionado */}
        {value && (
          <div className="p-2 border-t bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {CurrentIcon && <CurrentIcon className="h-4 w-4" />}
              <span className="text-muted-foreground">Selecionado:</span>
              <span className="font-medium">{value}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="h-6 px-2 text-xs"
            >
              Limpar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
