// ============================================
// 📚 COURSES HUB — NETFLIX ULTRA PREMIUM 2300
// 6 Cards Hub para navegação de Video Aulas
// Padrão visual idêntico ao MaterialBooksHub
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, BookOpen, FileQuestion, Award, Trophy, Gift,
  ChevronRight, Video, Layers
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
  subcategories: string[]; // Subcategorias que este card agrupa
}

// ============================================
// DEFINIÇÃO DOS 6 CARDS HUB
// ============================================
export const COURSE_HUB_CARDS: CourseHubCard[] = [
  {
    id: 'extensivas',
    name: 'Vídeo aulas Extensivas',
    description: 'Aulas completas ao vivo com conteúdo extensivo',
    icon: <Play className="w-7 h-7" />,
    accentColor: 'text-rose-400',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    gradientFrom: 'from-rose-500/20',
    gradientVia: 'via-rose-600/10',
    gradientTo: 'to-rose-900/5',
    borderColor: 'border-rose-500/30',
    badge: 'AO VIVO',
    subcategories: [
      'Aulas ao Vivo 2025 – Aulas Completas'
    ]
  },
  {
    id: 'por-assunto',
    name: 'Vídeo aulas por assunto',
    description: 'Aulas separadas por tema e área da química',
    icon: <BookOpen className="w-7 h-7" />,
    accentColor: 'text-cyan-400',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    gradientFrom: 'from-cyan-500/20',
    gradientVia: 'via-cyan-600/10',
    gradientTo: 'to-cyan-900/5',
    borderColor: 'border-cyan-500/30',
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
    name: 'Resolução de questões em vídeo',
    description: 'Questões resolvidas e comentadas em vídeo',
    icon: <FileQuestion className="w-7 h-7" />,
    accentColor: 'text-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    gradientFrom: 'from-amber-500/20',
    gradientVia: 'via-amber-600/10',
    gradientTo: 'to-amber-900/5',
    borderColor: 'border-amber-500/30',
    badge: 'PRÁTICA',
    subcategories: [
      'Resolução de Questões',
      'Resolução de Questões – Revisão Cíclica',
      'Resolução de Questões – Previsão Final'
    ]
  },
  {
    id: 'enem-resolucao',
    name: 'Resoluções do ENEM em vídeo',
    description: 'Provas do ENEM resolvidas por ano',
    icon: <Award className="w-7 h-7" />,
    accentColor: 'text-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    gradientFrom: 'from-emerald-500/20',
    gradientVia: 'via-emerald-600/10',
    gradientTo: 'to-emerald-900/5',
    borderColor: 'border-emerald-500/30',
    badge: 'ENEM',
    subcategories: [
      'Resolução Provas ENEM por Ano'
    ]
  },
  {
    id: 'top10-enem',
    name: 'Top 10 ENEM',
    description: 'Os 10 assuntos mais cobrados no ENEM',
    icon: <Trophy className="w-7 h-7" />,
    accentColor: 'text-violet-400',
    glowColor: 'rgba(167, 139, 250, 0.4)',
    gradientFrom: 'from-violet-500/20',
    gradientVia: 'via-violet-600/10',
    gradientTo: 'to-violet-900/5',
    borderColor: 'border-violet-500/30',
    badge: 'TOP 10',
    subcategories: [
      'TOP 10 ENEM'
    ]
  },
  {
    id: 'bonus',
    name: 'Bônus',
    description: 'Conteúdos extras e direcionamentos específicos',
    icon: <Gift className="w-7 h-7" />,
    accentColor: 'text-pink-400',
    glowColor: 'rgba(244, 114, 182, 0.4)',
    gradientFrom: 'from-pink-500/20',
    gradientVia: 'via-pink-600/10',
    gradientTo: 'to-pink-900/5',
    borderColor: 'border-pink-500/30',
    badge: 'EXTRA',
    subcategories: [
      'Tópico Bônus',
      'Direcionamento Vestibulares Específicos'
    ]
  }
];

// ============================================
// NETFLIX CARD COMPONENT
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
  return (
    <motion.div
      initial={isHighEnd ? { opacity: 0, y: 30, scale: 0.95 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={isHighEnd ? { 
        scale: 1.04, 
        y: -10,
        transition: { duration: 0.25, ease: "easeOut" }
      } : undefined}
      className="group relative flex flex-col"
    >
      {/* Outer Glow Effect */}
      {isHighEnd && (
        <div 
          className="absolute -inset-3 rounded-3xl opacity-0 group-hover:opacity-60 transition-all duration-500 blur-2xl"
          style={{ backgroundColor: card.glowColor }}
        />
      )}
      
      {/* Main Card */}
      <div 
        onClick={() => onSelect(card.id)}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-[#0a0a0c] via-[#0c0d10] to-[#0f1015]",
          "border-2 transition-all duration-300",
          card.borderColor,
          "hover:border-opacity-100",
          isHighEnd && "hover:shadow-[0_30px_80px_-20px_var(--card-glow)]"
        )}
        style={{ 
          '--card-glow': card.glowColor,
          minHeight: '360px'
        } as React.CSSProperties}
      >
        {/* Top Gradient Bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          "bg-gradient-to-r opacity-90 group-hover:opacity-100 transition-opacity"
        )} style={{
          backgroundImage: `linear-gradient(90deg, transparent 5%, ${card.glowColor}, transparent 95%)`
        }} />

        {/* Logo Centerpiece */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div 
            className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-700 blur-3xl"
            style={{ backgroundColor: card.glowColor }}
          />
          <img 
            src={logoMoisesMedeiros} 
            alt=""
            className="w-40 md:w-48 lg:w-56 h-auto opacity-[0.10] group-hover:opacity-[0.20] group-hover:scale-105 transition-all duration-700 drop-shadow-2xl"
            loading="lazy"
          />
        </div>

        {/* Animated Background Gradient */}
        <div className={cn(
          "absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity duration-500",
          "bg-gradient-to-br",
          card.gradientFrom,
          card.gradientVia,
          card.gradientTo
        )} />

        {/* Cinematic Vignette Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)] opacity-80 pointer-events-none" />

        {/* Scan Line Effect */}
        {isHighEnd && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent"
              style={{
                animation: 'netflix-scan 2s linear infinite',
                transform: 'translateY(-100%)'
              }}
            />
          </div>
        )}

        {/* Content Container */}
        <div className="relative p-6 flex flex-col h-full justify-between" style={{ minHeight: '360px' }}>
          {/* Header: Icon + Badge */}
          <div className="flex items-start justify-between">
            {/* Icon Container */}
            <div className={cn(
              "relative p-4 rounded-2xl",
              "bg-gradient-to-br from-black/60 to-black/30",
              "border-2",
              card.borderColor,
              "group-hover:scale-110 transition-all duration-400"
            )}>
              {isHighEnd && (
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-80 transition-opacity blur-xl"
                  style={{ backgroundColor: card.glowColor }}
                />
              )}
              <span className={cn("relative z-10", card.accentColor)} style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}>
                {card.icon}
              </span>
            </div>

            {/* Badge */}
            {card.badge && (
              <span 
                className={cn(
                  "text-[10px] font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-lg",
                  "border-2 backdrop-blur-sm",
                  card.borderColor,
                  card.accentColor
                )}
                style={{
                  background: `linear-gradient(135deg, ${card.glowColor.replace('0.4', '0.3')}, transparent)`,
                  textShadow: `0 0 10px ${card.glowColor}`
                }}
              >
                {card.badge}
              </span>
            )}
          </div>

          {/* Center Space */}
          <div className="flex-1" />

          {/* Footer: Stats + Action */}
          <div className="space-y-4">
            {/* Subcategories Count */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl w-fit",
              "bg-black/40 backdrop-blur-sm border",
              card.borderColor.replace('/30', '/20')
            )}>
              <Layers className={cn("w-4 h-4", card.accentColor)} />
              <span className="text-sm font-semibold text-white/80">
                {card.subcategories.length} {card.subcategories.length === 1 ? 'subcategoria' : 'subcategorias'}
              </span>
            </div>

            {/* Action Button */}
            <button className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
              "border-2 transition-all duration-300",
              "group-hover:scale-[1.02]",
              card.borderColor
            )}
              style={{
                background: `linear-gradient(135deg, ${card.glowColor.replace('0.4', '0.2')}, ${card.glowColor.replace('0.4', '0.05')})`
              }}
            >
              <Video className={cn("w-5 h-5", card.accentColor)} />
              <span className={cn("text-sm font-bold tracking-wide uppercase", card.accentColor)}>
                Acessar
              </span>
              <ChevronRight className={cn("w-5 h-5 group-hover:translate-x-1 transition-transform", card.accentColor)} />
            </button>
          </div>
        </div>

        {/* Corner Accent Glows */}
        <div 
          className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full opacity-15 group-hover:opacity-35 transition-opacity blur-3xl pointer-events-none"
          style={{ backgroundColor: card.glowColor }}
        />
        <div 
          className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-10 group-hover:opacity-25 transition-opacity blur-2xl pointer-events-none"
          style={{ backgroundColor: card.glowColor }}
        />
      </div>

      {/* Text Below Card */}
      <div className="mt-4 px-1 space-y-2">
        <h3 
          className={cn(
            "text-lg font-bold leading-tight text-white",
            "group-hover:text-opacity-100 transition-colors"
          )}
          style={{ textShadow: `0 2px 10px rgba(0,0,0,0.5)` }}
        >
          {card.name}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
          {card.description}
        </p>
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
    <div className="relative">
      {/* Background Glow Orbs */}
      {isHighEnd && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] -z-10" />
        </>
      )}

      {/* Hub Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
          Escolha uma categoria
        </h2>
        <p className="text-slate-400">
          Navegue pelas videoaulas organizadas por tema
        </p>
      </div>

      {/* Cards Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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

      {/* CSS Animation for Scan Line */}
      <style>{`
        @keyframes netflix-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(500%); }
        }
      `}</style>
    </div>
  );
});

export default CoursesHub;
