// ============================================
// 📚 COURSES HUB — NETFLIX ULTRA PREMIUM 2300
// 6 Cards Hub para navegação de Video Aulas
// Design CINEMATOGRÁFICO estilo Marvel/Iron Man
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, BookOpen, FileQuestion, Award, Trophy, Gift,
  ChevronRight, Sparkles
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
    description: 'Aulas completas ao vivo com conteúdo extensivo',
    icon: <Play className="w-8 h-8" />,
    accentColor: 'text-rose-400',
    glowColor: 'rgba(244, 63, 94, 0.5)',
    gradientFrom: 'from-rose-500/30',
    gradientVia: 'via-rose-600/15',
    gradientTo: 'to-rose-900/5',
    borderColor: 'border-rose-500/40',
    badge: 'AO VIVO',
    subcategories: ['Aulas ao Vivo 2025 – Aulas Completas']
  },
  {
    id: 'por-assunto',
    name: 'Vídeo aulas por assunto',
    description: 'Aulas separadas por tema e área da química',
    icon: <BookOpen className="w-8 h-8" />,
    accentColor: 'text-cyan-400',
    glowColor: 'rgba(34, 211, 238, 0.5)',
    gradientFrom: 'from-cyan-500/30',
    gradientVia: 'via-cyan-600/15',
    gradientTo: 'to-cyan-900/5',
    borderColor: 'border-cyan-500/40',
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
    icon: <FileQuestion className="w-8 h-8" />,
    accentColor: 'text-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    gradientFrom: 'from-amber-500/30',
    gradientVia: 'via-amber-600/15',
    gradientTo: 'to-amber-900/5',
    borderColor: 'border-amber-500/40',
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
    icon: <Award className="w-8 h-8" />,
    accentColor: 'text-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.5)',
    gradientFrom: 'from-emerald-500/30',
    gradientVia: 'via-emerald-600/15',
    gradientTo: 'to-emerald-900/5',
    borderColor: 'border-emerald-500/40',
    badge: 'ENEM',
    subcategories: ['Resolução Provas ENEM por Ano']
  },
  {
    id: 'top10-enem',
    name: 'Top 10 ENEM',
    description: 'Os 10 assuntos mais cobrados no ENEM',
    icon: <Trophy className="w-8 h-8" />,
    accentColor: 'text-violet-400',
    glowColor: 'rgba(167, 139, 250, 0.5)',
    gradientFrom: 'from-violet-500/30',
    gradientVia: 'via-violet-600/15',
    gradientTo: 'to-violet-900/5',
    borderColor: 'border-violet-500/40',
    badge: 'TOP 10',
    subcategories: ['TOP 10 ENEM']
  },
  {
    id: 'bonus',
    name: 'Bônus',
    description: 'Conteúdos extras e direcionamentos específicos',
    icon: <Gift className="w-8 h-8" />,
    accentColor: 'text-pink-400',
    glowColor: 'rgba(244, 114, 182, 0.5)',
    gradientFrom: 'from-pink-500/30',
    gradientVia: 'via-pink-600/15',
    gradientTo: 'to-pink-900/5',
    borderColor: 'border-pink-500/40',
    badge: 'EXTRA',
    subcategories: [
      'Tópico Bônus',
      'Direcionamento Vestibulares Específicos'
    ]
  }
];

// ============================================
// NETFLIX ULTRA PREMIUM CARD COMPONENT
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
      initial={isHighEnd ? { opacity: 0, y: 40, scale: 0.9 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={isHighEnd ? { 
        scale: 1.05, 
        y: -12,
        transition: { duration: 0.3, ease: "easeOut" }
      } : undefined}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col cursor-pointer"
      onClick={() => onSelect(card.id)}
    >
      {/* === OUTER GLOW LAYER === */}
      {isHighEnd && (
        <div 
          className="absolute -inset-4 rounded-[28px] opacity-0 group-hover:opacity-70 transition-all duration-700 blur-3xl pointer-events-none"
          style={{ backgroundColor: card.glowColor }}
        />
      )}
      
      {/* === MAIN CARD CONTAINER === */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-[#08080a] via-[#0a0b0e] to-[#0d0e12]",
          "border-2 transition-all duration-500",
          card.borderColor,
          "group-hover:border-opacity-100",
          isHighEnd && "group-hover:shadow-[0_40px_100px_-30px_var(--card-glow)]"
        )}
        style={{ 
          '--card-glow': card.glowColor,
          minHeight: '400px'
        } as React.CSSProperties}
      >
        {/* === TOP ACCENT LINE === */}
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${card.glowColor} 30%, ${card.glowColor} 70%, transparent 100%)`
          }} 
        />

        {/* === HERO LOGO BACKGROUND === */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Radial Glow Behind Logo */}
          <div 
            className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full opacity-[0.12] group-hover:opacity-[0.25] group-hover:scale-110 transition-all duration-1000 blur-[60px]"
            style={{ backgroundColor: card.glowColor }}
          />
          {/* Logo Image */}
          <img 
            src={logoMoisesMedeiros} 
            alt=""
            className="w-48 md:w-56 lg:w-64 h-auto opacity-[0.08] group-hover:opacity-[0.18] group-hover:scale-110 transition-all duration-700"
            style={{ filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.8))' }}
            loading="lazy"
          />
        </div>

        {/* === GRADIENT OVERLAY === */}
        <div className={cn(
          "absolute inset-0 opacity-50 group-hover:opacity-80 transition-opacity duration-700",
          "bg-gradient-to-br",
          card.gradientFrom,
          card.gradientVia,
          card.gradientTo
        )} />

        {/* === CINEMATIC VIGNETTE === */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

        {/* === FILM GRAIN TEXTURE === */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />

        {/* === SCAN LINE EFFECT === */}
        {isHighEnd && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent animate-netflix-scan"
            />
          </div>
        )}

        {/* === CONTENT LAYER === */}
        <div className="relative z-10 p-6 md:p-7 flex flex-col h-full" style={{ minHeight: '400px' }}>
          
          {/* HEADER ROW: Icon + Badge */}
          <div className="flex items-start justify-between mb-4">
            {/* Icon Container with Glow */}
            <div className={cn(
              "relative p-4 rounded-2xl",
              "bg-gradient-to-br from-black/70 to-black/40",
              "border-2 backdrop-blur-sm",
              card.borderColor,
              "group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
            )}>
              {isHighEnd && (
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                  style={{ backgroundColor: card.glowColor }}
                />
              )}
              <span 
                className={cn("relative z-10 block", card.accentColor)}
                style={{ filter: `drop-shadow(0 0 12px currentColor)` }}
              >
                {card.icon}
              </span>
            </div>

            {/* Badge */}
            {card.badge && (
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 + 0.3 }}
                className={cn(
                  "text-[10px] font-black tracking-[0.2em] uppercase px-4 py-2 rounded-xl",
                  "border-2 backdrop-blur-md",
                  card.borderColor,
                  card.accentColor
                )}
                style={{
                  background: `linear-gradient(135deg, ${card.glowColor.replace('0.5', '0.4')}, ${card.glowColor.replace('0.5', '0.1')})`,
                  textShadow: `0 0 15px ${card.glowColor}`,
                  boxShadow: `0 0 20px ${card.glowColor.replace('0.5', '0.3')}`
                }}
              >
                {card.badge}
              </motion.span>
            )}
          </div>

          {/* SPACER */}
          <div className="flex-1" />

          {/* FOOTER: Title + Description + CTA */}
          <div className="space-y-4">
            {/* Title */}
            <h3 
              className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight"
              style={{ textShadow: '0 4px 20px rgba(0,0,0,0.7)' }}
            >
              {card.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-300/80 leading-relaxed line-clamp-2">
              {card.description}
            </p>

            {/* Subcategories Count */}
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
              "bg-black/50 backdrop-blur-md border",
              card.borderColor.replace('/40', '/25')
            )}>
              <Sparkles className={cn("w-4 h-4", card.accentColor)} />
              <span className="text-sm font-bold text-white/90">
                {card.subcategories.length} {card.subcategories.length === 1 ? 'subcategoria' : 'subcategorias'}
              </span>
            </div>

            {/* CTA Button */}
            <button 
              className={cn(
                "w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl",
                "border-2 transition-all duration-400",
                "group-hover:scale-[1.02]",
                card.borderColor
              )}
              style={{
                background: `linear-gradient(135deg, ${card.glowColor.replace('0.5', '0.35')}, ${card.glowColor.replace('0.5', '0.08')})`,
                boxShadow: isHighEnd ? `0 10px 40px -10px ${card.glowColor}` : undefined
              }}
            >
              <Play className={cn("w-5 h-5 fill-current", card.accentColor)} />
              <span 
                className={cn("text-sm font-black tracking-wider uppercase", card.accentColor)}
                style={{ textShadow: `0 0 10px ${card.glowColor}` }}
              >
                Assistir
              </span>
              <ChevronRight className={cn("w-5 h-5 group-hover:translate-x-2 transition-transform duration-300", card.accentColor)} />
            </button>
          </div>
        </div>

        {/* === CORNER ACCENT GLOWS === */}
        <div 
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full opacity-20 group-hover:opacity-50 transition-opacity duration-700 blur-[80px] pointer-events-none"
          style={{ backgroundColor: card.glowColor }}
        />
        <div 
          className="absolute -top-16 -left-16 w-40 h-40 rounded-full opacity-15 group-hover:opacity-35 transition-opacity duration-700 blur-[50px] pointer-events-none"
          style={{ backgroundColor: card.glowColor }}
        />

        {/* === BOTTOM ACCENT LINE === */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-80 transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${card.glowColor} 50%, transparent 100%)`
          }} 
        />
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
    <div className="relative py-4">
      {/* === AMBIENT BACKGROUND ORBS === */}
      {isHighEnd && (
        <>
          <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-rose-500/8 rounded-full blur-[150px] -z-10 animate-pulse" />
          <div className="absolute bottom-20 right-0 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[150px] -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[180px] -z-10" />
        </>
      )}

      {/* === CINEMATIC HEADER === */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-10 md:mb-12"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4"
        >
          <Play className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold text-white/70 tracking-widest uppercase">Video Aulas</span>
        </motion.div>
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
          Escolha uma <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">categoria</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Navegue pelas videoaulas organizadas por tema
        </p>
      </motion.div>

      {/* === CARDS GRID === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
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

      {/* === SCAN LINE ANIMATION CSS === */}
      <style>{`
        @keyframes netflix-scan {
          0% { transform: translateY(-200%); }
          100% { transform: translateY(600%); }
        }
        .animate-netflix-scan {
          animation: netflix-scan 2.5s linear infinite;
        }
      `}</style>
    </div>
  );
});

export default CoursesHub;
