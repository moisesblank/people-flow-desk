// ============================================
// 📚 COURSES HUB — STATIC PERFORMANCE VERSION
// Sem animações framer-motion
// ============================================

import { memo, useState } from 'react';
import { 
  Play, BookOpen, FileQuestion, Award, Trophy, Gift,
  ChevronRight, Sparkles, Zap, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';

// Imagens de fundo para cada hub
import hubImg1 from '@/assets/hub-1-extensivas.jpg';
import hubImg2 from '@/assets/hub-2-por-assunto.jpg';
import hubImg3 from '@/assets/hub-3-resolucao.jpg';
import hubImg4 from '@/assets/hub-4-enem.jpg';
import hubImg5 from '@/assets/hub-5-top10.jpg';
import hubImg6 from '@/assets/hub-6-bonus.jpg';

// Array de imagens por ordem de hub
const HUB_IMAGES = [hubImg1, hubImg2, hubImg3, hubImg4, hubImg5, hubImg6];

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
    name: 'Resolução de questões (GERAL, ORGÂNICA E FÍSICO QUÍMICA)',
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
      'Tópico Bônus'
    ]
  }
];

// ============================================
// STATIC NETFLIX CARD
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
    <div
      className={cn(
        "group relative flex flex-col cursor-pointer",
        "transform-gpu transition-all duration-300 ease-out",
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
      onClick={() => onSelect(card.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* === MAIN CARD === */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-[20px]",
          "bg-gradient-to-br from-[#06060a] via-[#08090d] to-[#0b0c12]",
          "border-2 transition-all duration-300",
          card.borderColor,
          "group-hover:border-opacity-100"
        )}
        style={{ 
          minHeight: '420px',
          transform: 'translateZ(0)'
        }}
      >
        {/* === TOP ENERGY BAR === */}
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
          <div 
            className="h-full opacity-90 group-hover:opacity-100"
            style={{
              background: `linear-gradient(90deg, transparent, ${card.glowColor} 20%, ${card.glowColor} 80%, transparent)`,
            }} 
          />
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

        {/* === HERO BACKGROUND IMAGE === */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img 
            src={HUB_IMAGES[index]} 
            alt=""
            className={cn(
              "absolute inset-0 w-full h-full object-cover object-center transform-gpu transition-all duration-500",
              "opacity-30 group-hover:opacity-70 group-hover:scale-105"
            )}
            style={{ 
              filter: `brightness(0.7) contrast(1.1) saturate(1.2)` 
            }}
            loading="lazy"
          />
        </div>

        {/* === GRADIENT OVERLAY === */}
        <div className={cn(
          "absolute inset-0 opacity-60 group-hover:opacity-90 transition-opacity duration-500",
          "bg-gradient-to-br",
          card.gradientFrom,
          card.gradientVia,
          card.gradientTo
        )} />

        {/* === CINEMATIC VIGNETTE === */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.75)_100%)] pointer-events-none" />

        {/* === CONTENT === */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col h-full" style={{ minHeight: '420px' }}>
          
          {/* HEADER */}
          <div className="flex items-start justify-between mb-6">
            {/* Icon */}
            <div 
              className={cn(
                "relative p-5 rounded-2xl transition-transform duration-300",
                "bg-gradient-to-br from-black/80 to-black/50",
                "border-2 backdrop-blur-md",
                card.borderColor,
                isHovered && "scale-110"
              )}
            >
              <span 
                className={cn("relative z-10 block", card.accentColor)}
                style={{ 
                  filter: `drop-shadow(0 0 15px currentColor)` 
                }}
              >
                {card.icon}
              </span>
            </div>

            {/* Badge */}
            {card.badge && (
              <div className="relative">
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
                  }}
                >
                  <Zap className="inline w-3 h-3 mr-1 -mt-0.5" />
                  {card.badge}
                </span>
              </div>
            )}
          </div>

          {/* SPACER */}
          <div className="flex-1" />

          {/* FOOTER */}
          <div className="space-y-5">
            {/* Title */}
            <h3 
              className={cn(
                "text-2xl md:text-3xl lg:text-[2rem] font-black leading-tight tracking-tight",
                card.accentColor
              )}
              style={{ 
                textShadow: `0 0 30px ${card.glowColor}, 0 4px 20px rgba(0,0,0,0.9)`,
              }}
            >
              {card.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-white leading-relaxed line-clamp-2 font-bold">
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
                <span className="text-sm font-black text-white">
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
            <button 
              className={cn(
                "relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl",
                "border-2 overflow-hidden transition-all duration-300",
                "hover:scale-[1.02] active:scale-[0.98]",
                card.borderColor
              )}
              style={{
                background: `linear-gradient(135deg, ${card.glowColor.replace('0.6', '0.4')}, ${card.glowColor.replace('0.6', '0.1')})`,
              }}
            >
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
            </button>
          </div>
        </div>

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
    </div>
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
      {/* === CINEMATIC HEADER === */}
      <div className="text-center mb-12 md:mb-16">
        {/* Pre-header badge */}
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500/10 via-violet-500/10 to-cyan-500/10 border border-white/10 backdrop-blur-md mb-6">
          <Play className="w-5 h-5 text-rose-400" />
          <span className="text-sm font-bold text-white/80 tracking-[0.2em] uppercase">Video Aulas Premium</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        
        {/* Main title */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
          Escolha uma{' '}
          <span 
            className="bg-gradient-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent"
          >
            categoria
          </span>
        </h2>
        
        {/* Subtitle */}
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
          Navegue pelas videoaulas organizadas por tema e conquiste sua aprovação
        </p>

        {/* Decorative line */}
        <div className="mt-8 mx-auto w-48 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

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
    </div>
  );
});

export default CoursesHub;
