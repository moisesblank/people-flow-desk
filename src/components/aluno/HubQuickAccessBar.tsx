// ============================================
// 🚀 HUB QUICK ACCESS BAR - ANO 2300 CINEMATIC
// Visual futurístico com hologramas e efeitos
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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos
export type HubAreaKey = 
  | "cronograma" 
  | "forum" 
  | "tutoria" 
  | "videoaulas" 
  | "questoes" 
  | "flashcards" 
  | "simulados" 
  | "mapas-mentais" 
  | "livros-web";

interface HubArea {
  key: HubAreaKey;
  label: string;
  icon: typeof Calendar;
  gradient: string;
  glowColor: string;
  description: string;
  badge?: string;
  badgeVariant?: "ai" | "xp" | "treino" | "new";
}

// Configuração das 9 áreas - Year 2300 Style
export const HUB_AREAS: HubArea[] = [
  {
    key: "cronograma",
    label: "Cronograma",
    icon: Calendar,
    gradient: "from-blue-500 via-cyan-400 to-blue-600",
    glowColor: "shadow-blue-500/50",
    description: "Cronograma adaptativo por IA",
    badge: "IA",
    badgeVariant: "ai"
  },
  {
    key: "forum",
    label: "Fórum",
    icon: MessageSquare,
    gradient: "from-purple-500 via-fuchsia-400 to-purple-600",
    glowColor: "shadow-purple-500/50",
    description: "Comunidade de alunos"
  },
  {
    key: "tutoria",
    label: "Tutoria IA",
    icon: Bot,
    gradient: "from-emerald-500 via-teal-400 to-emerald-600",
    glowColor: "shadow-emerald-500/50",
    description: "Tutor inteligente 24h",
    badge: "IA",
    badgeVariant: "ai"
  },
  {
    key: "videoaulas",
    label: "Videoaulas",
    icon: Video,
    gradient: "from-red-500 via-orange-400 to-red-600",
    glowColor: "shadow-red-500/50",
    description: "Biblioteca de vídeos"
  },
  {
    key: "questoes",
    label: "Questões",
    icon: Target,
    gradient: "from-amber-500 via-yellow-400 to-amber-600",
    glowColor: "shadow-amber-500/50",
    description: "Modo Treino (0 XP)",
    badge: "TREINO",
    badgeVariant: "treino"
  },
  {
    key: "flashcards",
    label: "Flashcards",
    icon: Brain,
    gradient: "from-pink-500 via-rose-400 to-pink-600",
    glowColor: "shadow-pink-500/50",
    description: "Revisão espaçada"
  },
  {
    key: "simulados",
    label: "Simulados",
    icon: FileText,
    gradient: "from-indigo-500 via-violet-400 to-indigo-600",
    glowColor: "shadow-indigo-500/50",
    description: "Provas oficiais (+10 XP)",
    badge: "+10 XP",
    badgeVariant: "xp"
  },
  {
    key: "mapas-mentais",
    label: "Mapas",
    icon: Network,
    gradient: "from-cyan-500 via-sky-400 to-cyan-600",
    glowColor: "shadow-cyan-500/50",
    description: "Mapas mentais visuais"
  },
  {
    key: "livros-web",
    label: "Livros",
    icon: BookOpen,
    gradient: "from-orange-500 via-amber-400 to-orange-600",
    glowColor: "shadow-orange-500/50",
    description: "Biblioteca digital"
  }
];

// Badge variants para cada tipo
const badgeStyles = {
  ai: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/30",
  xp: "bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-0 shadow-lg shadow-amber-500/30",
  treino: "bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 shadow-lg shadow-violet-500/30",
  new: "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 shadow-lg shadow-rose-500/30"
};

interface HubQuickAccessBarProps {
  activeModal: HubAreaKey | null;
  onOpenModal: (key: HubAreaKey) => void;
}

export const HubQuickAccessBar = memo(function HubQuickAccessBar({
  activeModal,
  onOpenModal
}: HubQuickAccessBarProps) {
  return (
    <div className="relative group">
      {/* Background glow layers */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-holo-purple/20 to-holo-cyan/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 via-transparent to-holo-cyan/10 rounded-2xl" />
      
      {/* Main container */}
      <div className="relative bg-gradient-to-br from-card/90 via-card/80 to-card/90 backdrop-blur-2xl border border-border/30 rounded-2xl overflow-hidden">
        {/* Top holographic line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
        
        {/* Animated corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-primary to-transparent" />
          <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-primary to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-16 h-16">
          <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-holo-cyan to-transparent" />
          <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-holo-cyan to-transparent" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/20">
          <div className="flex items-center gap-3">
            {/* Pulse indicator */}
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary/50 animate-ping" />
            </div>
            <span className="text-xs font-bold text-foreground/80 uppercase tracking-[0.2em]">
              Hub Central
            </span>
          </div>
          
          <Badge className="bg-gradient-to-r from-primary/20 to-holo-purple/20 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
            <Zap className="w-3 h-3 mr-1 animate-pulse" />
            9 Módulos
          </Badge>
        </div>
        
        {/* Grid de botões */}
        <div className="p-4">
          <div className="grid grid-cols-9 gap-3">
            {HUB_AREAS.map((area, index) => {
              const Icon = area.icon;
              const isActive = activeModal === area.key;
              
              return (
                <button
                  key={area.key}
                  onClick={() => onOpenModal(area.key)}
                  className={cn(
                    "relative group/btn flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300",
                    "hover:scale-105 hover:-translate-y-1",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    isActive && "scale-105 -translate-y-1"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Background glow on hover/active */}
                  <div className={cn(
                    "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
                    "bg-gradient-to-br",
                    area.gradient,
                    "group-hover/btn:opacity-10",
                    isActive && "opacity-20"
                  )} />
                  
                  {/* Icon container */}
                  <div className={cn(
                    "relative p-3 rounded-xl transition-all duration-300",
                    "bg-gradient-to-br shadow-lg",
                    area.gradient,
                    area.glowColor,
                    isActive && "shadow-xl scale-110",
                    "group-hover/btn:shadow-xl group-hover/btn:scale-110"
                  )}>
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    
                    <Icon className="relative w-5 h-5 text-white drop-shadow-lg" />
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div className="absolute -inset-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover/btn:animate-[shimmer_1.5s_ease-in-out]" />
                    </div>
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-[11px] font-semibold transition-colors duration-300",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover/btn:text-foreground"
                  )}>
                    {area.label}
                  </span>
                  
                  {/* Badge */}
                  {area.badge && (
                    <Badge 
                      className={cn(
                        "absolute -top-1 -right-1 text-[9px] px-1.5 py-0 h-4 font-bold",
                        area.badgeVariant ? badgeStyles[area.badgeVariant] : "bg-primary/80"
                      )}
                    >
                      {area.badge}
                    </Badge>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-gradient-to-r from-primary via-primary to-holo-cyan shadow-lg shadow-primary/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Bottom holographic line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-holo-cyan/50 to-transparent" />
      </div>
    </div>
  );
});

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
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-2xl border-border/30 overflow-hidden">
        {/* Holographic border effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn("absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent", area.gradient.replace('from-', 'via-').split(' ')[0])} />
          <div className={cn("absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-holo-cyan/50 to-transparent")} />
        </div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none">
          <div className={cn("absolute top-0 left-0 w-full h-px bg-gradient-to-r to-transparent", area.gradient.split(' ')[0])} />
          <div className={cn("absolute top-0 left-0 h-full w-px bg-gradient-to-b to-transparent", area.gradient.split(' ')[0])} />
        </div>
        
        {/* Header futurístico */}
        <DialogHeader className="relative border-b border-border/30 px-6 py-5 bg-gradient-to-r from-card/50 via-transparent to-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Icon with glow */}
              <div className={cn(
                "relative p-3 rounded-xl bg-gradient-to-br shadow-2xl",
                area.gradient,
                area.glowColor
              )}>
                <Icon className="w-6 h-6 text-white drop-shadow-lg" />
                <div className="absolute inset-0 rounded-xl bg-white/10" />
              </div>
              
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  {area.label}
                  {area.badge && (
                    <Badge className={cn(
                      "text-xs font-bold",
                      area.badgeVariant ? badgeStyles[area.badgeVariant] : "bg-primary"
                    )}>
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
              className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Content */}
        <ScrollArea className="flex-1 h-full">
          <div className="p-6">
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});

export default HubQuickAccessBar;
