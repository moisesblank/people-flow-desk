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
    <section className="relative py-8 overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 0: COSMIC VOID — Deep Space Background (como FuturisticCategoryFilter)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 -z-10">
        {/* Void gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-[hsl(var(--system-cosmos-deep))] to-background" />
        
        {/* Nebula clouds */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 60% at 20% 30%, hsl(var(--primary) / 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 80% 70%, hsl(var(--holo-cyan) / 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 120% 80% at 50% 100%, hsl(var(--holo-purple) / 0.06) 0%, transparent 40%)
            `
          }}
        />
        
        {/* Holographic grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, hsl(var(--primary) / 0.8) 1px, transparent 1px),
              linear-gradient(0deg, hsl(var(--primary) / 0.8) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Header removido conforme solicitação do usuário */}

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 2: COMMAND GRID — 6 Módulos
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-9 gap-3 md:gap-4">
          {HUB_AREAS.map((area, index) => {
            const Icon = area.icon;
            const isActive = activeModal === area.key;
            
            return (
              <button
                key={area.key}
                onClick={() => onOpenModal(area.key)}
                className={cn(
                  "group relative flex flex-col items-center p-4 rounded-xl transition-all duration-300",
                  "micro-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isActive && "scale-105"
                )}
                style={{
                  background: isActive 
                    ? `linear-gradient(135deg, hsl(${area.hue} 80% 50% / 0.15), hsl(${area.hue} 80% 50% / 0.05))`
                    : 'transparent'
                }}
              >
                {/* Glow ring on hover/active */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-xl transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  style={{
                    boxShadow: `inset 0 0 30px hsl(${area.hue} 80% 50% / 0.1), 0 0 40px hsl(${area.hue} 80% 50% / 0.15)`,
                    border: `1px solid hsl(${area.hue} 80% 50% / 0.3)`
                  }}
                />
                
                {/* Icon container - Hexagonal style */}
                <div 
                  className={cn(
                    "relative w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-all duration-300",
                    "group-hover:scale-110 group-hover:-translate-y-1",
                    isActive && "scale-110 -translate-y-1"
                  )}
                  style={{
                    background: `linear-gradient(135deg, hsl(${area.hue} 80% 55% / 0.25), hsl(${area.hue} 80% 45% / 0.4))`,
                    border: `1px solid hsl(${area.hue} 80% 60% / 0.5)`,
                    boxShadow: isActive 
                      ? `0 0 40px hsl(${area.hue} 80% 50% / 0.4), 0 10px 40px hsl(${area.hue} 80% 50% / 0.2), inset 0 0 20px hsl(${area.hue} 80% 70% / 0.1)`
                      : `0 4px 20px hsl(${area.hue} 80% 50% / 0.15)`
                  }}
                >
                  {/* Inner glow layer */}
                  <div 
                    className="absolute inset-1 rounded-lg opacity-40"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, hsl(${area.hue} 80% 80% / 0.3), transparent 60%)`
                    }}
                  />
                  
                  {/* Icon */}
                  <Icon 
                    className="relative w-6 h-6 md:w-7 md:h-7 transition-transform duration-300"
                    style={{ 
                      color: `hsl(${area.hue} 80% 70%)`,
                      filter: `drop-shadow(0 0 10px hsl(${area.hue} 80% 60% / 0.8))`
                    }}
                  />
                </div>
                
                {/* Label */}
                <span 
                  className={cn(
                    "mt-3 text-[11px] md:text-xs font-bold tracking-wide transition-all duration-300",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  style={{
                    textShadow: isActive ? `0 0 20px hsl(${area.hue} 80% 60% / 0.6)` : 'none'
                  }}
                >
                  {area.label}
                </span>
                
                {/* Badge */}
                {area.badge && (
                  <div 
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-black text-white"
                    style={{
                      background: area.badgeType === 'ai' 
                        ? 'linear-gradient(135deg, hsl(160 80% 45%), hsl(180 80% 45%))'
                        : area.badgeType === 'xp'
                        ? 'linear-gradient(135deg, hsl(40 90% 50%), hsl(45 90% 55%))'
                        : 'linear-gradient(135deg, hsl(280 80% 55%), hsl(300 80% 55%))',
                      boxShadow: area.badgeType === 'ai' 
                        ? '0 2px 12px hsl(170 80% 50% / 0.5)'
                        : area.badgeType === 'xp'
                        ? '0 2px 12px hsl(45 90% 50% / 0.5)'
                        : '0 2px 12px hsl(290 80% 55% / 0.5)'
                    }}
                  >
                    {area.badge}
                  </div>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, hsl(${area.hue} 80% 60%), transparent)`,
                      boxShadow: `0 0 15px hsl(${area.hue} 80% 60% / 0.8)`
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer removido conforme solicitação do usuário */}
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
