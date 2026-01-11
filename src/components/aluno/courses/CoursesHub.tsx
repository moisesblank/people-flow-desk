// ============================================
// 📚 COURSES HUB — YEAR 2300 ABSOLUTE CINEMA
// Marvel/Iron Man HUD • Netflix Ultra Premium
// DESIGN CINEMATOGRÁFICO MÁXIMO
// ============================================

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, BookOpen, FileQuestion, Award, Trophy, Gift,
  ChevronRight, Sparkles, Zap, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import logoMoisesMedeiros from '@/assets/logo-moises-medeiros.png';

// ============================================
// TIPOS
// ============================================
export interface CourseHubCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  borderColor: string;
  badge?: string;
  subcategories: string[];
}

// ============================================
// DEFINIÇÃO DOS 6 CARDS HUB
// ============================================
export const COURSE_HUB_CARDS: CourseHubCard[] = [
  {
    id: 'extensivas',
    name: 'Vídeo aulas Extensivas',
    description: 'Aulas completas ao vivo com conteúdo extensivo para aprovação',
    icon: <Play className="w-9 h-9" />,
    accentColor: 'text-rose-400',
    glowColor: 'rgba(244, 63, 94, 0.6)',
    gradientFrom: 'from-rose-500/40',
    gradientVia: 'via-rose-600/20',
    gradientTo: 'to-rose-900/10',
    borderColor: 'border-rose-500/50',
    badge: 'AO VIVO',
    subcategories: ['Aulas ao Vivo 2025 – Aulas Completas']
  },
  {
    id: 'por-assunto',
    name: 'Vídeo aulas por assunto',
    description: 'Aulas separadas por tema e área da química',
    icon: <BookOpen className="w-9 h-9" />,
    accentColor: 'text-cyan-400',
    glowColor: 'rgba(34, 211, 238, 0.6)',
    gradientFrom: 'from-cyan-500/40',
    gradientVia: 'via-cyan-600/20',
    gradientTo: 'to-cyan-900/10',
    borderColor: 'border-cyan-500/50',
    badge: '4 ÁREAS',
    subcategories: [
      'Química Geral – Aulas Separadas por Assunto',
      'Química Orgânica – Aulas Separadas por Assunto',
      'Físico-Química – Aulas Separadas por Assunto',
      'Química Ambiental – Aulas Separadas por Assunto'
    ]
  },
  {
    id: 'resolucao-questoes',
    name: 'Resolução de questões',
    description: 'Questões resolvidas e comentadas em vídeo',
    icon: <FileQuestion className="w-9 h-9" />,
    accentColor: 'text-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    gradientFrom: 'from-amber-500/40',
    gradientVia: 'via-amber-600/20',
    gradientTo: 'to-amber-900/10',
    borderColor: 'border-amber-500/50',
    badge: 'PRÁTICA',
    subcategories: [
      'Resolução de Questões',
      'Resolução de Questões – Revisão Cíclica',
      'Resolução de Questões – Previsão Final'
    ]
  },
  {
    id: 'enem-resolucao',
    name: 'Resoluções do ENEM',
    description: 'Provas do ENEM resolvidas por ano',
    icon: <Award className="w-9 h-9" />,
    accentColor: 'text-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.6)',
    gradientFrom: 'from-emerald-500/40',
    gradientVia: 'via-emerald-600/20',
    gradientTo: 'to-emerald-900/10',
    borderColor: 'border-emerald-500/50',
    badge: 'ENEM',
    subcategories: ['Resolução Provas ENEM por Ano']
  },
  {
    id: 'top10-enem',
    name: 'Top 10 ENEM',
    description: 'Os 10 assuntos mais cobrados no ENEM',
    icon: <Trophy className="w-9 h-9" />,
    accentColor: 'text-violet-400',
    glowColor: 'rgba(167, 139, 250, 0.6)',
    gradientFrom: 'from-violet-500/40',
    gradientVia: 'via-violet-600/20',
    gradientTo: 'to-violet-900/10',
    borderColor: 'border-violet-500/50',
    badge: 'TOP 10',
    subcategories: ['TOP 10 ENEM']
  },
  {
    id: 'bonus',
    name: 'Bônus',
    description: 'Conteúdos extras e direcionamentos específicos',
    icon: <Gift className="w-9 h-9" />,
    accentColor: 'text-pink-400',
    glowColor: 'rgba(244, 114, 182, 0.6)',
    gradientFrom: 'from-pink-500/40',
    gradientVia: 'via-pink-600/20',
    gradientTo: 'to-pink-900/10',
    borderColor: 'border-pink-500/50',
    badge: 'EXTRA',
    subcategories: [
      'Tópico Bônus',
      'Direcionamento Vestibulares Específicos'
    ]
  }
];

// ============================================
// NETFLIX YEAR 2300 ABSOLUTE CARD
// ============================================
const NetflixCourseCard = memo(function NetflixCourseCard({ 
  card, 
  index,
  onSelect,
  isHighEnd 
}: { 
  card: CourseHubCard; 
  index: number;
  onSelect: (cardId: string) => void;
  isHighEnd: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={isHighEnd ? { opacity: 0, y: 50, scale: 0.85, rotateX: 15 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={isHighEnd ? { 
        scale: 1.06, 
        y: -16,
        rotateY: 2,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
      } : undefined}
      whileTap={{ scale: 0.97 }}
      className="group relative flex flex-col cursor-pointer perspective-1000"
      style={{ transformStyle: 'preserve-3d' }}
      onClick={() => onSelect(card.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* === MEGA OUTER GLOW === */}
      {isHighEnd && (
        <>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered ? 0.8 : 0, 
              scale: isHovered ? 1.1 : 0.9 
            }}
            transition={{ duration: 0.5 }}
            className="absolute -inset-6 rounded-[32px] blur-[40px] pointer-events-none"
            style={{ backgroundColor: card.glowColor }}
          />
          {/* Secondary pulsing glow */}
          <div 
            className="absolute -inset-8 rounded-[40px] opacity-0 group-hover:opacity-40 transition-all duration-1000 blur-[60px] pointer-events-none animate-pulse-slow"
            style={{ backgroundColor: card.glowColor }}
          />
        </>
      )}
      
      {/* === HOLOGRAPHIC BORDER RING === */}
      {isHighEnd && (
        <div 
          className="absolute -inset-[2px] rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${card.glowColor}, transparent, ${card.glowColor})`,
            backgroundSize: '200% 200%',
            animation: isHovered ? 'holo-shift 2s linear infinite' : 'none'
          }}
        />
      )}

      {/* === MAIN CARD === */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-[20px]",
          "bg-gradient-to-br from-[#06060a] via-[#08090d] to-[#0b0c12]",
          "border-2 transition-all duration-600",
          card.borderColor,
          "group-hover:border-opacity-100",
          isHighEnd && "group-hover:shadow-[0_50px_120px_-40px_var(--card-glow)]"
        )}
        style={{ 
          '--card-glow': card.glowColor,
          minHeight: '420px',
          transform: 'translateZ(0)'
        } as React.CSSProperties}
      >
        {/* === TOP ENERGY BAR === */}
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
          <div 
            className="h-full opacity-90 group-hover:opacity-100"
            style={{
              background: `linear-gradient(90deg, transparent, ${card.glowColor} 20%, ${card.glowColor} 80%, transparent)`,
            }} 
          />
          {isHighEnd && (
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{
                background: `linear-gradient(90deg, transparent, white 50%, transparent)`,
                animation: isHovered ? 'energy-flow 1.5s linear infinite' : 'none'
              }}
            />
          )}
        </div>

        {/* === CORNER TECH ACCENTS === */}
        <div className="absolute top-3 left-3 w-8 h-8 pointer-events-none opacity-30 group-hover:opacity-70 transition-opacity">
          <div className={cn("absolute top-0 left-0 w-full h-[2px]", card.borderColor.replace('border-', 'bg-').replace('/50', ''))} />
          <div className={cn("absolute top-0 left-0 w-[2px] h-full", card.borderColor.replace('border-', 'bg-').replace('/50', ''))} />
        </div>
        <div className="absolute top-3 right-3 w-8 h-8 pointer-events-none opacity-30 group-hover:opacity-70 transition-opacity">
          <div className={cn("absolute top-0 right-0 w-full h-[2px]", card.borderColor.replace('border-', 'bg-').replace('/50', ''))} />
          <div className={cn("absolute top-0 right-0 w-[2px] h-full", card.borderColor.replace('border-', 'bg-').replace('/50', ''))} />
        </div>
        <div className="absolute bottom-3 left-3 w-8 h-8 pointer-events-none opacity-30 group-hover:opacity-70 transition-opacity">
          <div className={cn("absolute bottom-0 left-0 w-full h-[2px]", card.borderColor.replace('border-', 'bg-').replace('/50', ''))} />
          <div className={cn("absolute bottom-0 left-0 w-[2px] h-full", card.borderColor.replace('border-', 'bg-').replace('/50', ''))} />
        </div>
        <div className="absolute bottom-3 right-3 w-8 h-8 pointer-events-none opacity-30 group-hover:opacity-70 transition-opacity">
          <div className={cn("absolute bottom-0 right-0 w-full h-[2px]", card.borderColor.replace('border-', 'bg-').replace('/50', ''))} />
          <div className={cn("absolute bottom-0 right-0 w-[2px] h-full", card.borderColor.replace('border-', 'bg-').replace('/50', ''))} />
        </div>

        {/* === HERO LOGO CENTERPIECE === */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Multi-layer glow */}
          <div 
            className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full opacity-[0.15] group-hover:opacity-[0.35] group-hover:scale-125 transition-all duration-1000 blur-[80px]"
            style={{ backgroundColor: card.glowColor }}
          />
          <div 
            className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full opacity-[0.10] group-hover:opacity-[0.25] group-hover:scale-110 transition-all duration-700 blur-[50px]"
            style={{ backgroundColor: card.glowColor }}
          />
          {/* Logo */}
          <motion.img 
            src={logoMoisesMedeiros} 
            alt=""
            className="w-44 md:w-52 lg:w-60 h-auto"
            initial={{ opacity: 0.06, scale: 1 }}
            animate={{ 
              opacity: isHovered ? 0.2 : 0.08, 
              scale: isHovered ? 1.15 : 1,
              rotate: isHovered ? 3 : 0
            }}
            transition={{ duration: 0.6 }}
            style={{ filter: 'drop-shadow(0 0 50px rgba(0,0,0,0.9))' }}
            loading="lazy"
          />
        </div>

        {/* === GRADIENT OVERLAY === */}
        <div className={cn(
          "absolute inset-0 opacity-60 group-hover:opacity-90 transition-opacity duration-700",
          "bg-gradient-to-br",
          card.gradientFrom,
          card.gradientVia,
          card.gradientTo
        )} />

        {/* === CINEMATIC VIGNETTE === */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.75)_100%)] pointer-events-none" />

        {/* === HOLOGRAPHIC SHIMMER === */}
        {isHighEnd && (
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden"
          >
            <div 
              className="absolute inset-x-0 h-full"
              style={{
                background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.03) 35%, transparent 40%)',
                animation: isHovered ? 'holographic-sweep 2s ease-in-out infinite' : 'none'
              }}
            />
          </div>
        )}

        {/* === SCAN LINE === */}
        {isHighEnd && isHovered && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-x-0 h-48 bg-gradient-to-b from-transparent via-white/[0.07] to-transparent animate-scan-line"
            />
          </div>
        )}

        {/* === PARTICLE FIELD === */}
        {isHighEnd && isHovered && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ backgroundColor: card.glowColor }}
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: '110%',
                  opacity: 0 
                }}
                animate={{ 
                  y: '-10%',
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'linear'
                }}
              />
            ))}
          </div>
        )}

        {/* === CONTENT === */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col h-full" style={{ minHeight: '420px' }}>
          
          {/* HEADER */}
          <div className="flex items-start justify-between mb-6">
            {/* Icon */}
            <motion.div 
              className={cn(
                "relative p-5 rounded-2xl",
                "bg-gradient-to-br from-black/80 to-black/50",
                "border-2 backdrop-blur-md",
                card.borderColor
              )}
              animate={{ 
                scale: isHovered ? 1.12 : 1,
                rotate: isHovered ? 5 : 0
              }}
              transition={{ duration: 0.4 }}
            >
              {isHighEnd && (
                <>
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                    style={{ backgroundColor: card.glowColor }}
                  />
                  <div 
                    className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-md -z-10"
                    style={{ backgroundColor: card.glowColor }}
                  />
                </>
              )}
              <span 
                className={cn("relative z-10 block", card.accentColor)}
                style={{ 
                  filter: `drop-shadow(0 0 15px currentColor) drop-shadow(0 0 30px currentColor)` 
                }}
              >
                {card.icon}
              </span>
            </motion.div>

            {/* Badge */}
            {card.badge && (
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.4, type: 'spring', stiffness: 200 }}
                className="relative"
              >
                <div 
                  className="absolute inset-0 rounded-xl blur-lg opacity-60"
                  style={{ backgroundColor: card.glowColor }}
                />
                <span 
                  className={cn(
                    "relative block text-[10px] font-black tracking-[0.25em] uppercase px-4 py-2.5 rounded-xl",
                    "border-2 backdrop-blur-md",
                    card.borderColor,
                    card.accentColor
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${card.glowColor.replace('0.6', '0.5')}, ${card.glowColor.replace('0.6', '0.15')})`,
                    textShadow: `0 0 20px ${card.glowColor}`,
                    boxShadow: `0 0 30px ${card.glowColor.replace('0.6', '0.4')}, inset 0 1px 0 rgba(255,255,255,0.1)`
                  }}
                >
                  <Zap className="inline w-3 h-3 mr-1 -mt-0.5" />
                  {card.badge}
                </span>
              </motion.div>
            )}
          </div>

          {/* SPACER */}
          <div className="flex-1" />

          {/* FOOTER */}
          <div className="space-y-5">
            {/* Title with glow */}
            <h3 
              className="text-2xl md:text-[1.7rem] font-black text-white leading-tight tracking-tight"
              style={{ 
                textShadow: `0 4px 30px rgba(0,0,0,0.8), 0 0 40px ${card.glowColor.replace('0.6', '0.3')}` 
              }}
            >
              {card.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-300/90 leading-relaxed line-clamp-2">
              {card.description}
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl",
                "bg-black/60 backdrop-blur-md border",
                card.borderColor.replace('/50', '/30')
              )}>
                <Sparkles className={cn("w-4 h-4", card.accentColor)} style={{ filter: 'drop-shadow(0 0 5px currentColor)' }} />
                <span className="text-sm font-bold text-white">
                  {card.subcategories.length} {card.subcategories.length === 1 ? 'subcategoria' : 'subcategorias'}
                </span>
              </div>
              {isHighEnd && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((star) => (
                    <Star 
                      key={star}
                      className={cn("w-4 h-4 fill-current", card.accentColor)}
                      style={{ 
                        filter: 'drop-shadow(0 0 3px currentColor)',
                        opacity: 0.8 
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* CTA Button */}
            <motion.button 
              className={cn(
                "relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl",
                "border-2 overflow-hidden",
                card.borderColor
              )}
              style={{
                background: `linear-gradient(135deg, ${card.glowColor.replace('0.6', '0.4')}, ${card.glowColor.replace('0.6', '0.1')})`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Button glow */}
              {isHighEnd && (
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    boxShadow: `inset 0 0 30px ${card.glowColor.replace('0.6', '0.4')}, 0 10px 50px -15px ${card.glowColor}`
                  }}
                />
              )}
              {/* Shimmer effect */}
              {isHighEnd && (
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                    animation: isHovered ? 'btn-shimmer 1.5s ease infinite' : 'none'
                  }}
                />
              )}
              <Play className={cn("w-5 h-5 fill-current relative z-10", card.accentColor)} style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
              <span 
                className={cn("relative z-10 text-sm font-black tracking-widest uppercase", card.accentColor)}
                style={{ textShadow: `0 0 15px ${card.glowColor}` }}
              >
                Assistir
              </span>
              <ChevronRight 
                className={cn("w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform duration-300", card.accentColor)} 
              />
            </motion.button>
          </div>
        </div>

        {/* === CORNER MEGA GLOWS === */}
        <div 
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-25 group-hover:opacity-60 transition-all duration-700 blur-[100px] pointer-events-none"
          style={{ backgroundColor: card.glowColor }}
        />
        <div 
          className="absolute -top-20 -left-20 w-48 h-48 rounded-full opacity-15 group-hover:opacity-40 transition-all duration-700 blur-[60px] pointer-events-none"
          style={{ backgroundColor: card.glowColor }}
        />

        {/* === BOTTOM ENERGY LINE === */}
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
          <div 
            className="h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(90deg, transparent, ${card.glowColor} 50%, transparent)`
            }} 
          />
        </div>
      </div>
    </motion.div>
  );
});

// ============================================
// MAIN HUB COMPONENT
// ============================================
interface CoursesHubProps {
  onSelectCard: (cardId: string, subcategories: string[]) => void;
}

export const CoursesHub = memo(function CoursesHub({ onSelectCard }: CoursesHubProps) {
  const { tier, isLowEnd } = useConstitutionPerformance();
  const isHighEnd = !isLowEnd && (tier === 'neural' || tier === 'quantum' || tier === 'enhanced');

  const handleSelect = (cardId: string) => {
    const card = COURSE_HUB_CARDS.find(c => c.id === cardId);
    if (card) {
      onSelectCard(cardId, card.subcategories);
    }
  };

  return (
    <div className="relative py-6">
      {/* === AMBIENT BACKGROUND === */}
      {isHighEnd && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[180px] animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[180px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/8 rounded-full blur-[200px]" />
          {/* Grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
      )}

      {/* === CINEMATIC HEADER === */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12 md:mb-16"
      >
        {/* Pre-header badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500/10 via-violet-500/10 to-cyan-500/10 border border-white/10 backdrop-blur-md mb-6"
        >
          <div className="relative">
            <Play className="w-5 h-5 text-rose-400" />
            <div className="absolute inset-0 animate-ping">
              <Play className="w-5 h-5 text-rose-400 opacity-40" />
            </div>
          </div>
          <span className="text-sm font-bold text-white/80 tracking-[0.2em] uppercase">Video Aulas Premium</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </motion.div>
        
        {/* Main title */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight"
        >
          Escolha uma{' '}
          <span 
            className="bg-gradient-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent"
            style={{ textShadow: '0 0 80px rgba(244, 114, 182, 0.5)' }}
          >
            categoria
          </span>
        </motion.h2>
        
        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto"
        >
          Navegue pelas videoaulas organizadas por tema e conquiste sua aprovação
        </motion.p>

        {/* Decorative line */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 mx-auto w-48 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />
      </motion.div>

      {/* === CARDS GRID === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
        {COURSE_HUB_CARDS.map((card, index) => (
          <NetflixCourseCard
            key={card.id}
            card={card}
            index={index}
            onSelect={handleSelect}
            isHighEnd={isHighEnd}
          />
        ))}
      </div>

      {/* === ANIMATIONS CSS === */}
      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        @keyframes energy-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes holo-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes holographic-sweep {
          0% { transform: translateX(-100%) rotate(15deg); }
          100% { transform: translateX(200%) rotate(15deg); }
        }
        
        @keyframes btn-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
});

export default CoursesHub;
