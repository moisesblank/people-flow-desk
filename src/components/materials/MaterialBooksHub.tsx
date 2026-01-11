// ============================================
// 📚 MATERIAL BOOKS HUB — NETFLIX ULTRA PREMIUM 2300
// Year 2300 Cinematic Experience
// 5 Hub Cards Fixos com Design Cinematográfico
// Fluxo: Macro → Micro para Questões e Mapas Mentais
// ============================================

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  ScrollText,
  Sparkles,
  Layers,
  ChevronRight,
  ArrowLeft,
  Search,
  Filter,
  Zap,
  Target,
  Award,
  Brain,
  BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { useQuestionTaxonomy } from '@/hooks/useQuestionTaxonomy';
import { stripTaxonomyEmoji } from '@/lib/taxonomyLabelConverter';
import '@/styles/dashboard-2300.css';

// Logo para fundo dos cards
import logoMoisesMedeiros from '@/assets/logo-moises-medeiros.png';

// ============================================
// DEFINIÇÃO DOS 5 BOOKS FIXOS
// ============================================

export interface MaterialBook {
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
  filters: BookFilter[];
  badge?: string;
}

export interface BookFilter {
  value: string;
  label: string;
  category?: string;
}

// Bancas para Direcionamentos e Provas Anteriores
const BANCAS_FILTERS: BookFilter[] = [
  { value: 'enem', label: 'ENEM', category: 'nacional' },
  { value: 'fuvest', label: 'FUVEST', category: 'sp' },
  { value: 'unicamp', label: 'UNICAMP', category: 'sp' },
  { value: 'unesp', label: 'UNESP', category: 'sp' },
  { value: 'unifesp', label: 'UNIFESP', category: 'sp' },
  { value: 'famerp', label: 'FAMERP', category: 'sp' },
  { value: 'ita', label: 'ITA', category: 'militar' },
  { value: 'especex', label: 'ESPECEX', category: 'militar' },
  { value: 'unb', label: 'UNB', category: 'centro-oeste' },
  { value: 'ufpr', label: 'UFPR', category: 'sul' },
  { value: 'ufrgs', label: 'UFRGS', category: 'sul' },
  { value: 'uel', label: 'UEL', category: 'sul' },
  { value: 'uerj', label: 'UERJ', category: 'rj' },
  { value: 'upe', label: 'UPE', category: 'nordeste' },
  { value: 'uece', label: 'UECE', category: 'nordeste' },
  { value: 'uema', label: 'UEMA', category: 'nordeste' },
  { value: 'uneb', label: 'UNEB', category: 'nordeste' },
  { value: 'ufam', label: 'UFAM', category: 'norte' },
  { value: 'ufgd', label: 'UFGD', category: 'centro-oeste' },
];

// 5 BOOKS FIXOS — NETFLIX ULTRA PREMIUM DESIGN
const MATERIAL_BOOKS: MaterialBook[] = [
  {
    id: 'questoes-mapas',
    name: 'Questões e Mapas Mentais',
    description: 'Material de estudo com questões comentadas e mapas mentais organizados por tema',
    icon: <Brain className="w-7 h-7" />,
    accentColor: 'text-rose-400',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    gradientFrom: 'from-rose-500/20',
    gradientVia: 'via-rose-600/10',
    gradientTo: 'to-rose-900/5',
    borderColor: 'border-rose-500/30',
    badge: 'ESSENCIAL',
    filters: [
      { value: 'quimica_geral', label: '⚗️ Química Geral' },
      { value: 'fisico_quimica', label: '⚡ Físico-Química' },
      { value: 'quimica_organica', label: '🧪 Química Orgânica' },
      { value: 'quimica_ambiental', label: '🌿 Química Ambiental' },
      { value: 'bioquimica', label: '🧬 Bioquímica' },
    ]
  },
  {
    id: 'direcionamentos',
    name: 'Direcionamentos Vestibulares',
    description: 'Materiais direcionados para cada vestibular com foco específico na banca',
    icon: <Target className="w-7 h-7" />,
    accentColor: 'text-cyan-400',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    gradientFrom: 'from-cyan-500/20',
    gradientVia: 'via-cyan-600/10',
    gradientTo: 'to-cyan-900/5',
    borderColor: 'border-cyan-500/30',
    badge: '19 BANCAS',
    filters: BANCAS_FILTERS
  },
  {
    id: 'provas-anteriores',
    name: 'Provas Anteriores',
    description: 'Provas anteriores resolvidas e comentadas de cada vestibular',
    icon: <Award className="w-7 h-7" />,
    accentColor: 'text-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    gradientFrom: 'from-amber-500/20',
    gradientVia: 'via-amber-600/10',
    gradientTo: 'to-amber-900/5',
    borderColor: 'border-amber-500/30',
    badge: 'RESOLVIDAS',
    filters: BANCAS_FILTERS
  },
  {
    id: 'extras',
    name: 'Extras',
    description: 'Materiais complementares incluindo levantamentos, cronogramas e conteúdos extras',
    icon: <Layers className="w-7 h-7" />,
    accentColor: 'text-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    gradientFrom: 'from-emerald-500/20',
    gradientVia: 'via-emerald-600/10',
    gradientTo: 'to-emerald-900/5',
    borderColor: 'border-emerald-500/30',
    filters: [
      { value: 'levantamento_enem', label: 'Levantamento ENEM' },
      { value: 'cronograma', label: 'Cronograma' },
      { value: 'extras', label: 'Extras' },
    ]
  },
  {
    id: 'flush-card',
    name: 'Flush Card',
    description: 'Cards de revisão rápida para memorização eficiente',
    icon: <Zap className="w-7 h-7" />,
    accentColor: 'text-violet-400',
    glowColor: 'rgba(167, 139, 250, 0.4)',
    gradientFrom: 'from-violet-500/20',
    gradientVia: 'via-violet-600/10',
    gradientTo: 'to-violet-900/5',
    borderColor: 'border-violet-500/30',
    badge: 'REVISÃO',
    filters: [
      { value: 'flush_card', label: 'Flush Card' },
    ]
  }
];

// ============================================
// TIPOS
// ============================================

interface MaterialBooksHubProps {
  onSelectBook: (bookId: string, filter?: string, microValue?: string, microLabel?: string) => void;
  className?: string;
}

// ============================================
// 🎬 NETFLIX ULTRA PREMIUM BOOK CARD — UNIFORM SIZE
// Todos os 5 cards com mesma dimensão e formato
// ============================================

const NetflixBookCard = memo(function NetflixBookCard({ 
  book, 
  index,
  onSelect,
  isHighEnd 
}: { 
  book: MaterialBook; 
  index: number;
  onSelect: (bookId: string) => void;
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
      {/* Outer Glow Effect — More Intense */}
      {isHighEnd && (
        <div 
          className="absolute -inset-3 rounded-3xl opacity-0 group-hover:opacity-60 transition-all duration-500 blur-2xl"
          style={{ backgroundColor: book.glowColor }}
        />
      )}
      
      {/* Main Card — Netflix Powerflix Ultra Premium Style */}
      <div 
        onClick={() => onSelect(book.id)}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-[#0a0a0c] via-[#0c0d10] to-[#0f1015]",
          "border-2 transition-all duration-300",
          book.borderColor,
          "hover:border-opacity-100",
          isHighEnd && "hover:shadow-[0_30px_80px_-20px_var(--card-glow)]"
        )}
        style={{ 
          '--card-glow': book.glowColor,
          minHeight: '380px'
        } as React.CSSProperties}
      >
        {/* Top Gradient Bar — Netflix Red Style */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          "bg-gradient-to-r opacity-90 group-hover:opacity-100 transition-opacity"
        )} style={{
          backgroundImage: `linear-gradient(90deg, transparent 5%, ${book.glowColor}, transparent 95%)`
        }} />

        {/* 🖼️ LOGO CENTERPIECE — BIG & PROMINENT — Powerflix Style */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Radial glow behind logo */}
          <div 
            className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-700 blur-3xl"
            style={{ backgroundColor: book.glowColor }}
          />
          {/* Logo — Big & Centered */}
          <img 
            src={logoMoisesMedeiros} 
            alt=""
            className="w-40 md:w-52 lg:w-60 h-auto opacity-[0.12] group-hover:opacity-[0.22] group-hover:scale-105 transition-all duration-700 drop-shadow-2xl"
            loading="lazy"
          />
        </div>

        {/* Animated Background Gradient — More Dramatic */}
        <div className={cn(
          "absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity duration-500",
          "bg-gradient-to-br",
          book.gradientFrom,
          book.gradientVia,
          book.gradientTo
        )} />

        {/* Cinematic Vignette Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)] opacity-80 pointer-events-none" />

        {/* Cinematic Scan Line Effect */}
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

        {/* Film Grain Effect */}
        {isHighEnd && (
          <div 
            className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />
        )}

        {/* Content Container */}
        <div className="relative p-6 flex flex-col h-full justify-between" style={{ minHeight: '380px' }}>
          {/* Header: Icon + Badge — Premium Positioning */}
          <div className="flex items-start justify-between">
            {/* Icon Container — Glowing Orb */}
            <div className={cn(
              "relative p-4 rounded-2xl",
              "bg-gradient-to-br from-black/60 to-black/30",
              "border-2",
              book.borderColor,
              "group-hover:scale-110 transition-all duration-400"
            )}>
              {/* Icon Inner Glow */}
              {isHighEnd && (
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-80 transition-opacity blur-xl"
                  style={{ backgroundColor: book.glowColor }}
                />
              )}
              {/* Pulsing Ring */}
              {isHighEnd && (
                <div 
                  className={cn(
                    "absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity",
                    "border-2",
                    book.borderColor
                  )}
                  style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                />
              )}
              <span className={cn("relative z-10", book.accentColor)} style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}>
                {book.icon}
              </span>
            </div>

            {/* Badge — Cinematic Premium Style */}
            {book.badge && (
              <span 
                className={cn(
                  "text-[10px] font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-lg",
                  "border-2 backdrop-blur-sm",
                  book.borderColor,
                  book.accentColor
                )}
                style={{
                  background: `linear-gradient(135deg, ${book.glowColor.replace('0.4', '0.3')}, transparent)`,
                  textShadow: `0 0 10px ${book.glowColor}`
                }}
              >
                {book.badge}
              </span>
            )}
          </div>

          {/* Center Space — Logo Area */}
          <div className="flex-1" />

          {/* Footer: Stats + Action — Netflix Premium */}
          <div className="space-y-4">
            {/* Categories Count */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl w-fit",
              "bg-black/40 backdrop-blur-sm border",
              book.borderColor.replace('/30', '/20')
            )}>
              <Filter className={cn("w-4 h-4", book.accentColor)} />
              <span className="text-sm font-semibold text-white/80">
                {book.filters.length} {book.filters.length === 1 ? 'categoria' : 'categorias'}
              </span>
            </div>

            {/* Action Button — Powerflix CTA */}
            <button className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
              "border-2 transition-all duration-300",
              "group-hover:scale-[1.02]",
              book.borderColor
            )}
              style={{
                background: `linear-gradient(135deg, ${book.glowColor.replace('0.4', '0.2')}, ${book.glowColor.replace('0.4', '0.05')})`
              }}
            >
              <span className={cn("text-sm font-bold tracking-wide uppercase", book.accentColor)}>
                Explorar
              </span>
              <ChevronRight className={cn("w-5 h-5 group-hover:translate-x-1 transition-transform", book.accentColor)} />
            </button>
          </div>
        </div>

        {/* Corner Accent Glows — Dramatic */}
        <div 
          className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full opacity-15 group-hover:opacity-35 transition-opacity blur-3xl pointer-events-none"
          style={{ backgroundColor: book.glowColor }}
        />
        <div 
          className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-10 group-hover:opacity-25 transition-opacity blur-2xl pointer-events-none"
          style={{ backgroundColor: book.glowColor }}
        />
      </div>

      {/* 📖 TEXT BELOW CARD — Netflix Typography */}
      <div className="mt-4 px-1 space-y-2">
        <h3 
          className={cn(
            "text-lg md:text-xl font-black text-white tracking-tight",
            "group-hover:text-opacity-100 transition-all duration-300"
          )}
          style={{ 
            textShadow: isHighEnd ? `0 2px 20px ${book.glowColor}` : undefined
          }}
        >
          {book.name}
        </h3>
        <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
          {book.description}
        </p>
      </div>
    </motion.div>
  );
});

// ============================================
// 📂 BOOK DETAIL VIEW — FILTROS INTERNOS
// Com navegação Macro → Micro para 'questoes-mapas'
// ============================================

interface BookDetailViewProps {
  book: MaterialBook;
  onBack: () => void;
  onSelectFilter: (bookId: string, filter: string, microValue?: string, microLabel?: string) => void;
  isHighEnd: boolean;
}

const BookDetailView = memo(function BookDetailView({
  book,
  onBack,
  onSelectFilter,
  isHighEnd
}: BookDetailViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  const { data: taxonomy } = useQuestionTaxonomy();

  const isQuestoesMapas = book.id === 'questoes-mapas';

  // Obter micros do macro selecionado
  const microsForMacro = useMemo(() => {
    if (!isQuestoesMapas || !selectedMacro || !taxonomy?.tree) return [];
    return taxonomy.tree.getMicros(selectedMacro);
  }, [isQuestoesMapas, selectedMacro, taxonomy]);

  const filteredFilters = book.filters.filter(f => 
    f.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMicros = microsForMacro.filter(m =>
    m.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar filtros por categoria
  const groupedFilters = filteredFilters.reduce((acc, filter) => {
    const category = filter.category || 'geral';
    if (!acc[category]) acc[category] = [];
    acc[category].push(filter);
    return acc;
  }, {} as Record<string, BookFilter[]>);

  const categoryLabels: Record<string, string> = {
    'nacional': '🇧🇷 Nacional',
    'sp': '📍 São Paulo',
    'rj': '📍 Rio de Janeiro',
    'sul': '📍 Sul',
    'nordeste': '📍 Nordeste',
    'norte': '📍 Norte',
    'centro-oeste': '📍 Centro-Oeste',
    'militar': '🎖️ Militar',
    'geral': '📚 Geral'
  };

  // Handler para clique em filtro
  const handleFilterClick = useCallback((filterValue: string) => {
    if (isQuestoesMapas && !selectedMacro) {
      // Primeiro nível: selecionar macro
      setSelectedMacro(filterValue);
      setSearchTerm('');
    } else if (isQuestoesMapas && selectedMacro) {
      // Segundo nível: selecionar micro - passa macro + micro
      const micro = microsForMacro.find(m => m.value === filterValue);
      // LEI SUPREMA: nunca vazar value se label não existir
      const safeMicroLabel = stripTaxonomyEmoji(micro?.label) || '';
      onSelectFilter(book.id, selectedMacro, filterValue, safeMicroLabel);
    } else {
      // Cards normais: ir direto para materiais
      onSelectFilter(book.id, filterValue);
    }
  }, [isQuestoesMapas, selectedMacro, book.id, onSelectFilter, microsForMacro]);

  // Handler para voltar do micro para macro
  const handleBackFromMicro = useCallback(() => {
    setSelectedMacro(null);
    setSearchTerm('');
  }, []);

  // Obter label do macro selecionado
  const selectedMacroLabel = useMemo(() => {
    if (!selectedMacro) return '';
    const filter = book.filters.find(f => f.value === selectedMacro);
    return filter?.label || selectedMacro;
  }, [selectedMacro, book.filters]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      {/* 🎬 HEADER CINEMATOGRÁFICO */}
      <div className={cn(
        "relative rounded-2xl overflow-hidden p-6",
        "bg-gradient-to-br from-[#0a0d12] via-[#0f1419] to-[#151a22]",
        "border",
        book.borderColor
      )}>
        {/* Background Gradient */}
        <div className={cn(
          "absolute inset-0 opacity-50",
          "bg-gradient-to-br",
          book.gradientFrom,
          book.gradientVia,
          book.gradientTo
        )} />

        {/* Top Bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          "bg-gradient-to-r",
          book.gradientFrom.replace('/20', ''),
          book.gradientTo.replace('/5', '/80')
        )} />

        <div className="relative flex items-center gap-4">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={selectedMacro ? handleBackFromMicro : onBack}
            className={cn(
              "rounded-xl h-12 w-12",
              "bg-white/5 border border-white/10",
              "hover:bg-white/10 hover:border-white/20",
              "transition-all duration-300"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Icon */}
          <div className={cn(
            "p-4 rounded-xl",
            "bg-gradient-to-br",
            book.gradientFrom,
            book.gradientTo,
            "border",
            book.borderColor
          )}>
            <span className={book.accentColor}>{book.icon}</span>
          </div>

          {/* Title + Description */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-white">{book.name}</h2>
              {selectedMacro && (
                <>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <Badge 
                    className={cn(
                      "text-sm font-bold px-3 py-1",
                      "bg-gradient-to-r border-0",
                      book.gradientFrom.replace('/20', '/40'),
                      book.gradientTo.replace('/5', '/20'),
                      book.accentColor
                    )}
                  >
                    {selectedMacroLabel}
                  </Badge>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedMacro 
                ? `Selecione o micro-assunto de ${selectedMacroLabel}`
                : book.description
              }
            </p>
          </div>

          {/* Filter Count */}
          <Badge 
            className={cn(
              "text-sm font-bold px-4 py-2",
              "bg-gradient-to-r border-0",
              book.gradientFrom.replace('/20', '/40'),
              book.gradientTo.replace('/5', '/20'),
              book.accentColor
            )}
          >
            {selectedMacro ? `${microsForMacro.length} micros` : `${book.filters.length} categorias`}
          </Badge>
        </div>
      </div>

      {/* 🔍 SEARCH */}
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={selectedMacro ? "Buscar micro-assunto..." : "Buscar categoria..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
            "pl-12 h-12 text-base",
            "bg-[#0a0d12] border-white/10",
            "focus:border-white/30 focus:ring-1 focus:ring-white/20",
            "rounded-xl"
          )}
        />
      </div>

      {/* 📂 FILTERS/MICROS GRID */}
      <div className="space-y-8">
        {/* Se está mostrando micros (segundo nível) */}
        {isQuestoesMapas && selectedMacro ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              🧪 Micro-Assuntos de {selectedMacroLabel}
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredMicros.map((micro, idx) => (
                <motion.button
                  key={micro.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  whileHover={isHighEnd ? { scale: 1.05, y: -2 } : undefined}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFilterClick(micro.value)}
                  className={cn(
                    "relative px-4 py-4 rounded-xl text-center",
                    "bg-gradient-to-br from-[#0a0d12] to-[#151a22]",
                    "border transition-all duration-300",
                    book.borderColor,
                    "hover:border-opacity-100",
                    "group"
                  )}
                  style={isHighEnd ? {
                    boxShadow: `0 0 0 1px transparent`
                  } : undefined}
                  onMouseEnter={(e) => {
                    if (isHighEnd) {
                      e.currentTarget.style.boxShadow = `0 10px 30px -10px ${book.glowColor}`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isHighEnd) {
                      e.currentTarget.style.boxShadow = `0 0 0 1px transparent`;
                    }
                  }}
                >
                  {/* Gradient Overlay on Hover */}
                  <div className={cn(
                    "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity",
                    "bg-gradient-to-br",
                    book.gradientFrom,
                    book.gradientTo
                  )} />
                  
                  <span className={cn(
                    "relative text-sm font-semibold text-white/80 group-hover:text-white transition-colors"
                  )}>
                    {micro.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {filteredMicros.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Search className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Nenhum micro-assunto encontrado</p>
                <p className="text-muted-foreground/60 text-sm mt-1">Tente buscar com outro termo</p>
              </motion.div>
            )}
          </div>
        ) : (
          /* Mostrando macros/filtros (primeiro nível) */
          Object.entries(groupedFilters).map(([category, filters]) => (
            <div key={category} className="space-y-4">
              {/* Category Label */}
              {Object.keys(groupedFilters).length > 1 && (
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  {categoryLabels[category] || category}
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                </h3>
              )}
              
              {/* Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filters.map((filter, idx) => (
                  <motion.button
                    key={filter.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    whileHover={isHighEnd ? { scale: 1.05, y: -2 } : undefined}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFilterClick(filter.value)}
                    className={cn(
                      "relative px-4 py-4 rounded-xl text-center",
                      "bg-gradient-to-br from-[#0a0d12] to-[#151a22]",
                      "border transition-all duration-300",
                      book.borderColor,
                      "hover:border-opacity-100",
                      "group"
                    )}
                    style={isHighEnd ? {
                      boxShadow: `0 0 0 1px transparent`
                    } : undefined}
                    onMouseEnter={(e) => {
                      if (isHighEnd) {
                        e.currentTarget.style.boxShadow = `0 10px 30px -10px ${book.glowColor}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isHighEnd) {
                        e.currentTarget.style.boxShadow = `0 0 0 1px transparent`;
                      }
                    }}
                  >
                    {/* Gradient Overlay on Hover */}
                    <div className={cn(
                      "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity",
                      "bg-gradient-to-br",
                      book.gradientFrom,
                      book.gradientTo
                    )} />
                    
                    {/* Show arrow for macros in questoes-mapas */}
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn(
                        "relative text-sm font-semibold text-white/80 group-hover:text-white transition-colors"
                      )}>
                        {filter.label}
                      </span>
                      {isQuestoesMapas && (
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ))
        )}

        {!selectedMacro && filteredFilters.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Nenhuma categoria encontrada</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Tente buscar com outro termo</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});
// ============================================
// 📚 MAIN HUB COMPONENT — NETFLIX ULTRA PREMIUM
// ============================================

export const MaterialBooksHub = memo(function MaterialBooksHub({
  onSelectBook,
  className
}: MaterialBooksHubProps) {
  const { tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural';
  const [selectedBook, setSelectedBook] = useState<MaterialBook | null>(null);

  const handleSelectBook = useCallback((bookId: string) => {
    const book = MATERIAL_BOOKS.find(b => b.id === bookId);
    if (book) {
      setSelectedBook(book);
    }
  }, []);

  const handleSelectFilter = useCallback((
    bookId: string,
    filter: string,
    microValue?: string,
    microLabel?: string
  ) => {
    onSelectBook(bookId, filter, microValue, microLabel);
  }, [onSelectBook]);

  const handleBack = useCallback(() => {
    setSelectedBook(null);
  }, []);

  return (
    <div className={cn("space-y-8", className)}>
      <AnimatePresence mode="wait">
        {selectedBook ? (
          <BookDetailView
            key="detail"
            book={selectedBook}
            onBack={handleBack}
            onSelectFilter={handleSelectFilter}
            isHighEnd={isHighEnd}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
          >
            {/* 🎬 POWERFLIX HEADER — Cinematic Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-900/10 border border-rose-500/30">
                  <BookMarked className="w-6 h-6 text-rose-400" style={{ filter: 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.6))' }} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Biblioteca de Materiais
                  </h2>
                  <p className="text-sm text-muted-foreground/70 mt-0.5">
                    Selecione uma coleção para explorar
                  </p>
                </div>
                <div className="flex-1" />
                <Badge 
                  variant="outline" 
                  className="border-rose-500/30 text-rose-400 bg-rose-500/10 px-3 py-1"
                >
                  {MATERIAL_BOOKS.length} coleções
                </Badge>
              </div>
              {/* Gradient divider */}
              <div className="h-px bg-gradient-to-r from-rose-500/40 via-rose-500/20 to-transparent" />
            </motion.div>

            {/* 🎬 NETFLIX POWERFLIX GRID — Premium Cards with Gap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 xl:gap-5">
              {MATERIAL_BOOKS.map((book, idx) => (
                <NetflixBookCard
                  key={book.id}
                  book={book}
                  index={idx}
                  onSelect={handleSelectBook}
                  isHighEnd={isHighEnd}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Netflix Scan Animation Keyframes */}
      <style>{`
        @keyframes netflix-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
      `}</style>
    </div>
  );
});

export default MaterialBooksHub;
export { MATERIAL_BOOKS, BANCAS_FILTERS };
