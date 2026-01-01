// ============================================
// 🚀 HUB QUICK ACCESS BAR - ANO 2300
// Barra de atalhos rápidos para todas as áreas
// Abre modais dentro de /alunos/planejamento
// ============================================

import { memo, lazy, Suspense } from "react";
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
  X
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
  color: string;
  gradient: string;
  description: string;
  badge?: string;
}

// Configuração das 9 áreas
export const HUB_AREAS: HubArea[] = [
  {
    key: "cronograma",
    label: "Cronograma",
    icon: Calendar,
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    description: "Cronograma adaptativo por IA",
    badge: "IA"
  },
  {
    key: "forum",
    label: "Fórum",
    icon: MessageSquare,
    color: "text-purple-500",
    gradient: "from-purple-500 to-pink-500",
    description: "Comunidade de alunos"
  },
  {
    key: "tutoria",
    label: "Tutoria IA",
    icon: Bot,
    color: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
    description: "Tutor inteligente 24h",
    badge: "IA"
  },
  {
    key: "videoaulas",
    label: "Videoaulas",
    icon: Video,
    color: "text-red-500",
    gradient: "from-red-500 to-orange-500",
    description: "Biblioteca de vídeos"
  },
  {
    key: "questoes",
    label: "Questões",
    icon: Target,
    color: "text-amber-500",
    gradient: "from-amber-500 to-yellow-500",
    description: "Modo Treino (0 XP)",
    badge: "TREINO"
  },
  {
    key: "flashcards",
    label: "Flashcards",
    icon: Brain,
    color: "text-pink-500",
    gradient: "from-pink-500 to-rose-500",
    description: "Revisão espaçada"
  },
  {
    key: "simulados",
    label: "Simulados",
    icon: FileText,
    color: "text-indigo-500",
    gradient: "from-indigo-500 to-violet-500",
    description: "Provas oficiais (+10 XP)",
    badge: "XP"
  },
  {
    key: "mapas-mentais",
    label: "Mapas",
    icon: Network,
    color: "text-cyan-500",
    gradient: "from-cyan-500 to-sky-500",
    description: "Mapas mentais visuais"
  },
  {
    key: "livros-web",
    label: "Livros",
    icon: BookOpen,
    color: "text-orange-500",
    gradient: "from-orange-500 to-amber-500",
    description: "Biblioteca digital"
  }
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
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-holo-purple/5 to-holo-cyan/5 rounded-2xl blur-xl" />
      
      <div className="relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-3 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Acesso Rápido
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Hub Central
          </Badge>
        </div>
        
        {/* Botões de atalho */}
        <div className="grid grid-cols-9 gap-2">
          {HUB_AREAS.map((area) => {
            const Icon = area.icon;
            const isActive = activeModal === area.key;
            
            return (
              <Button
                key={area.key}
                variant="ghost"
                onClick={() => onOpenModal(area.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 h-auto py-3 px-2 rounded-xl transition-all duration-300",
                  "hover:bg-gradient-to-br hover:shadow-lg",
                  isActive 
                    ? `bg-gradient-to-br ${area.gradient} text-white shadow-lg` 
                    : "hover:from-muted/80 hover:to-muted/50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-all",
                  isActive 
                    ? "bg-white/20" 
                    : `bg-gradient-to-br ${area.gradient} bg-opacity-10`
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    isActive ? "text-white" : area.color
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium truncate max-w-full",
                  isActive ? "text-white" : "text-muted-foreground"
                )}>
                  {area.label}
                </span>
                {area.badge && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[8px] px-1 py-0 h-3.5",
                      isActive 
                        ? "bg-white/20 border-white/30 text-white" 
                        : "bg-primary/10 border-primary/20"
                    )}
                  >
                    {area.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ============================================
// MODAL WRAPPER - Container para conteúdo lazy
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
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
        {/* Header futurístico */}
        <DialogHeader className="relative border-b border-border/50 px-6 py-4">
          {/* Top glow line */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent",
            `via-${area.color.replace('text-', '')}`
          )} />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
                area.gradient
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  {area.label}
                  {area.badge && (
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {area.badge}
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{area.description}</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
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
