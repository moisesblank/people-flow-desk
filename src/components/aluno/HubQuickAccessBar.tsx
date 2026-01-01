// ============================================
// 🚀 HUB QUICK ACCESS BAR - IRON MAN HUD 2300
// Visual cinematográfico impactante
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
  Hexagon
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
  description: string;
  badge?: string;
  badgeType?: "ai" | "xp" | "treino";
}

// Configuração das 9 áreas
export const HUB_AREAS: HubArea[] = [
  { key: "cronograma", label: "Cronograma", icon: Calendar, color: "#3B82F6", description: "Cronograma adaptativo por IA", badge: "IA", badgeType: "ai" },
  { key: "forum", label: "Fórum", icon: MessageSquare, color: "#A855F7", description: "Comunidade de alunos" },
  { key: "tutoria", label: "Tutoria IA", icon: Bot, color: "#10B981", description: "Tutor inteligente 24h", badge: "IA", badgeType: "ai" },
  { key: "videoaulas", label: "Videoaulas", icon: Video, color: "#EF4444", description: "Biblioteca de vídeos" },
  { key: "questoes", label: "Questões", icon: Target, color: "#F59E0B", description: "Modo Treino (0 XP)", badge: "TREINO", badgeType: "treino" },
  { key: "flashcards", label: "Flashcards", icon: Brain, color: "#EC4899", description: "Revisão espaçada" },
  { key: "simulados", label: "Simulados", icon: FileText, color: "#6366F1", description: "Provas oficiais (+10 XP)", badge: "+10 XP", badgeType: "xp" },
  { key: "mapas-mentais", label: "Mapas", icon: Network, color: "#06B6D4", description: "Mapas mentais visuais" },
  { key: "livros-web", label: "Livros", icon: BookOpen, color: "#F97316", description: "Biblioteca digital" }
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
      {/* ===== CAMADA 1: Glow externo pulsante ===== */}
      <div 
        className="absolute -inset-3 rounded-3xl opacity-40"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(168,85,247,0.3) 50%, rgba(6,182,212,0.3) 100%)',
          filter: 'blur(20px)',
          animation: 'pulse 3s ease-in-out infinite'
        }}
      />
      
      {/* ===== CAMADA 2: Border animada ===== */}
      <div 
        className="absolute -inset-px rounded-2xl"
        style={{
          background: 'linear-gradient(90deg, #3B82F6, #A855F7, #06B6D4, #3B82F6)',
          backgroundSize: '300% 100%',
          animation: 'gradientShift 4s linear infinite',
          padding: '1px'
        }}
      >
        <div className="w-full h-full rounded-2xl bg-background" />
      </div>
      
      {/* ===== CONTAINER PRINCIPAL ===== */}
      <div className="relative bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5">
        
        {/* ===== CAMADA 3: Grid pattern overlay ===== */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* ===== CAMADA 4: Scan line effect ===== */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.03) 50%, transparent 100%)',
            backgroundSize: '100% 4px',
            animation: 'scanLine 8s linear infinite'
          }}
        />
        
        {/* ===== HEADER ÉPICO ===== */}
        <div className="relative px-6 py-4 border-b border-white/10">
          {/* Linha holográfica superior */}
          <div 
            className="absolute top-0 left-1/4 right-1/4 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, #3B82F6, #A855F7, #06B6D4, transparent)'
            }}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hexágono animado */}
              <div className="relative">
                <Hexagon 
                  className="w-10 h-10 text-primary/20" 
                  style={{ animation: 'spin 20s linear infinite' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="w-3 h-3 rounded-full bg-primary"
                    style={{ 
                      boxShadow: '0 0 20px 5px rgba(59,130,246,0.5)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <h3 
                  className="text-sm font-black uppercase tracking-[0.3em] text-foreground"
                  style={{ textShadow: '0 0 20px rgba(59,130,246,0.3)' }}
                >
                  Hub Central
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Sistema Neural de Estudos
                </p>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <div 
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  style={{ 
                    boxShadow: '0 0 10px 2px rgba(16,185,129,0.5)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Online</span>
              </div>
              
              <Badge 
                className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 border border-primary/30 text-primary font-black text-xs px-3"
                style={{ textShadow: '0 0 10px rgba(59,130,246,0.5)' }}
              >
                9 MÓDULOS
              </Badge>
            </div>
          </div>
        </div>
        
        {/* ===== GRID DE MÓDULOS ===== */}
        <div className="p-5">
          <div className="grid grid-cols-9 gap-2">
            {HUB_AREAS.map((area, index) => {
              const Icon = area.icon;
              const isActive = activeModal === area.key;
              
              return (
                <button
                  key={area.key}
                  onClick={() => onOpenModal(area.key)}
                  className="group relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:-translate-y-2 focus:outline-none"
                  style={{
                    animationDelay: `${index * 80}ms`
                  }}
                >
                  {/* Glow ativo/hover */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-xl transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    style={{
                      background: `radial-gradient(circle at center, ${area.color}30 0%, transparent 70%)`,
                      filter: 'blur(8px)'
                    }}
                  />
                  
                  {/* Container do ícone */}
                  <div 
                    className={cn(
                      "relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
                      "group-hover:shadow-2xl",
                      isActive && "scale-110"
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${area.color}20 0%, ${area.color}40 100%)`,
                      border: `1px solid ${area.color}40`,
                      boxShadow: isActive 
                        ? `0 0 30px 5px ${area.color}50, inset 0 0 20px ${area.color}20`
                        : `0 4px 20px ${area.color}20`
                    }}
                  >
                    {/* Inner glow ring */}
                    <div 
                      className="absolute inset-1 rounded-lg opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${area.color}30 0%, transparent 50%, ${area.color}10 100%)`
                      }}
                    />
                    
                    {/* Ícone */}
                    <Icon 
                      className="relative w-6 h-6 transition-transform duration-300 group-hover:scale-110"
                      style={{ 
                        color: area.color,
                        filter: `drop-shadow(0 0 8px ${area.color}80)`
                      }}
                    />
                    
                    {/* Shine sweep */}
                    <div 
                      className="absolute inset-0 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                        animation: 'shimmer 2s infinite'
                      }}
                    />
                  </div>
                  
                  {/* Label */}
                  <span 
                    className={cn(
                      "mt-2 text-[11px] font-bold transition-all duration-300",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                    style={{
                      textShadow: isActive ? `0 0 10px ${area.color}80` : 'none'
                    }}
                  >
                    {area.label}
                  </span>
                  
                  {/* Badge flutuante */}
                  {area.badge && (
                    <div 
                      className="absolute -top-1 -right-0 px-1.5 py-0.5 rounded-md text-[8px] font-black text-white"
                      style={{
                        background: area.badgeType === 'ai' 
                          ? 'linear-gradient(135deg, #10B981, #06B6D4)'
                          : area.badgeType === 'xp'
                          ? 'linear-gradient(135deg, #F59E0B, #EAB308)'
                          : 'linear-gradient(135deg, #8B5CF6, #A855F7)',
                        boxShadow: `0 2px 10px ${area.badgeType === 'ai' ? '#10B98180' : area.badgeType === 'xp' ? '#F59E0B80' : '#8B5CF680'}`
                      }}
                    >
                      {area.badge}
                    </div>
                  )}
                  
                  {/* Active indicator bar */}
                  {isActive && (
                    <div 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${area.color}, transparent)`,
                        boxShadow: `0 0 10px ${area.color}`
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* ===== FOOTER STATUS BAR ===== */}
        <div className="px-6 py-3 border-t border-white/5 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
          <div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" style={{ boxShadow: '0 0 6px #3B82F6' }} />
              IA Ativa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px #10B981' }} />
              Sincronizado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" style={{ boxShadow: '0 0 6px #A855F7' }} />
              Progresso Salvo
            </span>
          </div>
        </div>
        
        {/* ===== LINHA HOLOGRÁFICA INFERIOR ===== */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #06B6D4, #A855F7, #3B82F6, transparent)'
          }}
        />
      </div>
      
      {/* CSS Keyframes inline */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
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
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 bg-background/98 backdrop-blur-2xl border-white/10 overflow-hidden">
        {/* Border glow */}
        <div 
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: `inset 0 0 100px ${area.color}10, 0 0 50px ${area.color}20`
          }}
        />
        
        {/* Top line */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${area.color}, transparent)` }}
        />
        
        {/* Header */}
        <DialogHeader className="relative border-b border-white/10 px-6 py-5 bg-gradient-to-r from-card/80 via-transparent to-card/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${area.color}30, ${area.color}50)`,
                  border: `1px solid ${area.color}50`,
                  boxShadow: `0 0 30px ${area.color}30`
                }}
              >
                <Icon className="w-6 h-6" style={{ color: area.color, filter: `drop-shadow(0 0 10px ${area.color})` }} />
              </div>
              
              <div>
                <DialogTitle className="text-xl font-black flex items-center gap-3">
                  {area.label}
                  {area.badge && (
                    <Badge 
                      className="text-xs font-bold text-white border-0"
                      style={{
                        background: area.badgeType === 'ai' 
                          ? 'linear-gradient(135deg, #10B981, #06B6D4)'
                          : area.badgeType === 'xp'
                          ? 'linear-gradient(135deg, #F59E0B, #EAB308)'
                          : 'linear-gradient(135deg, #8B5CF6, #A855F7)'
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
          style={{ background: `linear-gradient(90deg, transparent, ${area.color}50, transparent)` }}
        />
      </DialogContent>
    </Dialog>
  );
});

export default HubQuickAccessBar;
