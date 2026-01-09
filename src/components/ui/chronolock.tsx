// ============================================
// 🔒 CHRONOLOCK - Sistema de Bloqueio Temporal
// Overlay futurista estilo 2300 para conteúdos bloqueados
// Uso: <Chronolock message="LIBERADO APENAS DIA 31/01">...conteúdo...</Chronolock>
// ============================================

import { memo, ReactNode } from "react";
import { Lock, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChronolockProps {
  /** Conteúdo que será exibido ao fundo (com blur) */
  children: ReactNode;
  
  /** Mensagem principal do bloqueio */
  message?: string;
  
  /** Subtítulo opcional */
  subtitle?: string;
  
  /** Se true, o bloqueio está ativo. Se false, mostra o conteúdo normalmente */
  isLocked?: boolean;
  
  /** Data de liberação (opcional, para exibição automática) */
  releaseDate?: Date | string;
  
  /** Classe CSS adicional para o container */
  className?: string;
  
  /** Intensidade do blur (1-20, default: 8) */
  blurIntensity?: number;
  
  /** Opacidade do overlay (0-1, default: 0.85) */
  overlayOpacity?: number;
  
  /** Variante visual */
  variant?: 'default' | 'danger' | 'warning' | 'premium';
  
  /** Ícone customizado */
  icon?: ReactNode;
}

const variantStyles = {
  default: {
    gradient: "from-cyan-500/20 via-transparent to-purple-500/20",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
    text: "text-cyan-400",
    iconBg: "bg-cyan-500/20",
  },
  danger: {
    gradient: "from-red-500/20 via-transparent to-orange-500/20",
    border: "border-red-500/30",
    glow: "shadow-red-500/20",
    text: "text-red-400",
    iconBg: "bg-red-500/20",
  },
  warning: {
    gradient: "from-amber-500/20 via-transparent to-yellow-500/20",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
    text: "text-amber-400",
    iconBg: "bg-amber-500/20",
  },
  premium: {
    gradient: "from-purple-500/20 via-transparent to-pink-500/20",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20",
    text: "text-purple-400",
    iconBg: "bg-purple-500/20",
  },
};

export const Chronolock = memo(function Chronolock({
  children,
  message = "CONTEÚDO BLOQUEADO",
  subtitle,
  isLocked = true,
  releaseDate,
  className,
  blurIntensity = 8,
  overlayOpacity = 0.85,
  variant = 'default',
  icon,
}: ChronolockProps) {
  // Se não está bloqueado, renderiza normalmente
  if (!isLocked) {
    return <>{children}</>;
  }

  const styles = variantStyles[variant];
  
  // Formata data de liberação se fornecida
  const formattedDate = releaseDate
    ? typeof releaseDate === 'string'
      ? releaseDate
      : releaseDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : null;

  const displayMessage = formattedDate 
    ? `LIBERADO APENAS DIA ${formattedDate}`
    : message;

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Conteúdo de fundo com blur */}
      <div 
        className="select-none pointer-events-none"
        style={{ 
          filter: `blur(${blurIntensity}px)`,
          transform: 'scale(1.02)', // Evita bordas brancas do blur
        }}
      >
        {children}
      </div>
      
      {/* Overlay escuro com gradiente */}
      <div 
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center",
          "bg-gradient-to-br",
          styles.gradient
        )}
        style={{ 
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
        }}
      >
        {/* Container da mensagem */}
        <div className={cn(
          "flex flex-col items-center gap-4 p-6 rounded-xl",
          "border backdrop-blur-sm",
          "shadow-2xl",
          styles.border,
          styles.glow
        )}>
          {/* Ícone */}
          <div className={cn(
            "p-4 rounded-full",
            styles.iconBg,
            "animate-pulse"
          )}>
            {icon || (
              releaseDate ? (
                <Calendar className={cn("w-8 h-8", styles.text)} />
              ) : (
                <Lock className={cn("w-8 h-8", styles.text)} />
              )
            )}
          </div>
          
          {/* Mensagem principal */}
          <h3 className={cn(
            "text-lg md:text-xl font-bold text-center",
            "tracking-wider",
            styles.text
          )}>
            {displayMessage}
          </h3>
          
          {/* Subtítulo opcional */}
          {subtitle && (
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {subtitle}
            </p>
          )}
          
          {/* Indicador de tempo (opcional) */}
          {releaseDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Aguarde a liberação</span>
            </div>
          )}
        </div>
        
        {/* Efeito de scan lines sutil */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
      </div>
    </div>
  );
});

// Atalho para bloqueio por data
export const DateLock = memo(function DateLock({
  children,
  releaseDate,
  ...props
}: Omit<ChronolockProps, 'message'> & { releaseDate: Date | string }) {
  return (
    <Chronolock 
      releaseDate={releaseDate}
      {...props}
    >
      {children}
    </Chronolock>
  );
});

// Atalho para conteúdo premium
export const PremiumLock = memo(function PremiumLock({
  children,
  message = "CONTEÚDO EXCLUSIVO",
  ...props
}: ChronolockProps) {
  return (
    <Chronolock 
      message={message}
      variant="premium"
      subtitle="Disponível apenas para assinantes premium"
      {...props}
    >
      {children}
    </Chronolock>
  );
});

export default Chronolock;
