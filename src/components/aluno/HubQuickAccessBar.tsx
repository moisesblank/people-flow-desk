// ============================================
// 🚀 HUB QUICK ACCESS BAR - STARK INDUSTRIES 2300
// Performance máxima: CSS-only, tokens semânticos
// ============================================

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  MessageSquare, 
  Bot, 
  Video, 
  Target, 
  Brain, 
  FileText, 
  Network, 
  BookOpen,
  Sparkles,
  X,
  Hexagon,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos
export type HubAreaKey = 
  | "cronograma" 
  | "tutoria"
  | "questoes" 
  | "simulados" 
  | "materiais"
  | "livros-web";

interface HubArea {
  key: HubAreaKey;
  label: string;
  icon: typeof Calendar;
  hue: number;
  description: string;
  badge?: string;
  badgeType?: "ai" | "xp" | "treino";
}

// Configuração das áreas com HSL para tokens semânticos
export const HUB_AREAS: HubArea[] = [
  { key: "cronograma", label: "Cronograma", icon: Calendar, hue: 210, description: "Cronograma adaptativo por IA", badge: "IA", badgeType: "ai" },
  { key: "tutoria", label: "Tutoria IA", icon: Bot, hue: 160, description: "Tutor inteligente 24h", badge: "IA", badgeType: "ai" },
  { key: "questoes", label: "Questões", icon: Target, hue: 40, description: "Modo Treino (0 XP)", badge: "MODO_TREINO", badgeType: "treino" },
  { key: "simulados", label: "Simulados", icon: FileText, hue: 250, description: "Provas oficiais (+10 XP)", badge: "+10 XP", badgeType: "xp" },
  { key: "materiais", label: "Materiais", icon: Brain, hue: 330, description: "Flashcards & Mapas Mentais" },
  { key: "livros-web", label: "Livros", icon: BookOpen, hue: 25, description: "Biblioteca digital" }
];

interface HubQuickAccessBarProps {
  activeModal: HubAreaKey | null;
  onOpenModal: (key: HubAreaKey) => void;
}

export const HubQuickAccessBar = memo(function HubQuickAccessBar({
  activeModal,
  onOpenModal
}: HubQuickAccessBarProps) {
  return (
    <section className="relative py-3 overflow-hidden rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm">
      {/* ═══════════════════════════════════════════════════════════════════
          COMMAND GRID — 6 Módulos Compactos e Responsivos
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 px-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {HUB_AREAS.map((area) => {
            const Icon = area.icon;
            const isActive = activeModal === area.key;
            
            return (
              <button
                key={area.key}
                onClick={() => onOpenModal(area.key)}
                className={cn(
                  "group relative flex flex-col items-center p-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isActive && "bg-primary/15"
                )}
              >
                {/* Icon container */}
                <div 
                  className={cn(
                    "relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                    "group-hover:scale-105",
                    isActive && "scale-105"
                  )}
                  style={{
                    background: `linear-gradient(135deg, hsl(${area.hue} 70% 50% / 0.2), hsl(${area.hue} 70% 40% / 0.3))`,
                    border: `1px solid hsl(${area.hue} 70% 55% / 0.4)`,
                    boxShadow: `0 2px 10px hsl(${area.hue} 70% 50% / 0.15)`
                  }}
                >
                  <Icon 
                    className="w-5 h-5"
                    style={{ 
                      color: `hsl(${area.hue} 70% 65%)`,
                      filter: `drop-shadow(0 0 6px hsl(${area.hue} 70% 60% / 0.6))`
                    }}
                  />
                </div>
                
                {/* Label */}
                <span 
                  className={cn(
                    "mt-1.5 text-[10px] font-semibold tracking-wide transition-colors duration-200 text-center leading-tight",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {area.label}
                </span>
                
                {/* Badge */}
                {area.badge && (
                  <div 
                    className="absolute -top-0.5 -right-0.5 px-1 py-px rounded text-[7px] font-bold text-white"
                    style={{
                      background: area.badgeType === 'ai' 
                        ? 'linear-gradient(135deg, hsl(160 70% 45%), hsl(180 70% 45%))'
                        : area.badgeType === 'xp'
                        ? 'linear-gradient(135deg, hsl(40 85% 50%), hsl(45 85% 55%))'
                        : 'linear-gradient(135deg, hsl(280 70% 55%), hsl(300 70% 55%))',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.3)'
                    }}
                  >
                    {area.badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

// Status indicator component
function StatusIndicator({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span 
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ 
          backgroundColor: `hsl(${color} 80% 55%)`,
          boxShadow: `0 0 8px hsl(${color} 80% 55%)` 
        }} 
      />
      {label}
    </span>
  );
}

// ============================================
// MODAL WRAPPER - Container Year 2300
// ============================================

interface HubModalProps {
  area: HubArea | null;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const HubModal = memo(function HubModal({
  area,
  isOpen,
  onClose,
  children
}: HubModalProps) {
  if (!area) return null;
  
  const Icon = area.icon;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-6xl h-[90vh] p-0 gap-0 bg-background/98 backdrop-blur-xl border-border/30 overflow-hidden"
        style={{
          boxShadow: `0 0 80px hsl(${area.hue} 80% 50% / 0.15), inset 0 0 100px hsl(${area.hue} 80% 50% / 0.03)`
        }}
      >
        {/* Top holographic line */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, hsl(${area.hue} 80% 60%), transparent)` }}
        />
        
        {/* Header */}
        <DialogHeader className="relative border-b border-border/30 px-6 py-5 bg-gradient-to-r from-card/80 via-transparent to-card/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, hsl(${area.hue} 80% 55% / 0.3), hsl(${area.hue} 80% 45% / 0.5))`,
                  border: `1px solid hsl(${area.hue} 80% 60% / 0.5)`,
                  boxShadow: `0 0 30px hsl(${area.hue} 80% 50% / 0.3)`
                }}
              >
                <Icon 
                  className="w-6 h-6" 
                  style={{ 
                    color: `hsl(${area.hue} 80% 70%)`, 
                    filter: `drop-shadow(0 0 10px hsl(${area.hue} 80% 60%))` 
                  }} 
                />
              </div>
              
              <div>
                <DialogTitle className="text-xl font-black flex items-center gap-3">
                  {area.label}
                  {area.badge && (
                    <Badge 
                      className="text-xs font-bold text-white border-0"
                      style={{
                        background: area.badgeType === 'ai' 
                          ? 'linear-gradient(135deg, hsl(160 80% 45%), hsl(180 80% 45%))'
                          : area.badgeType === 'xp'
                          ? 'linear-gradient(135deg, hsl(40 90% 50%), hsl(45 90% 55%))'
                          : 'linear-gradient(135deg, hsl(280 80% 55%), hsl(300 80% 55%))'
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {area.badge}
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{area.description}</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-destructive/20 hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 h-full">
          <div className="p-6">{children}</div>
        </ScrollArea>
        
        {/* Bottom line */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, hsl(${area.hue} 80% 50% / 0.5), transparent)` }}
        />
      </DialogContent>
    </Dialog>
  );
});

export default HubQuickAccessBar;
