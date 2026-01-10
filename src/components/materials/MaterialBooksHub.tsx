// ============================================
// 📚 MATERIAL BOOKS HUB — NETFLIX ULTRA PREMIUM 2300
// Year 2300 Cinematic Experience
// 5 Hub Cards Fixos com Design Cinematográfico
// ============================================

import { memo, useState, useCallback } from 'react';
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
import '@/styles/dashboard-2300.css';

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
      { value: 'quimica_geral', label: 'Química Geral' },
      { value: 'fisico_quimica', label: 'Físico-Química' },
      { value: 'quimica_organica', label: 'Química Orgânica' },
      { value: 'quimica_ambiental', label: 'Química Ambiental' },
      { value: 'bioquimica', label: 'Bioquímica' },
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
  onSelectBook: (bookId: string, filter?: string) => void;
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
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={isHighEnd ? { 
        scale: 1.02, 
        y: -6,
        transition: { duration: 0.2 }
      } : undefined}
      className="group relative h-full"
    >
      {/* Outer Glow Effect */}
      {isHighEnd && (
        <div 
          className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
          style={{ backgroundColor: book.glowColor }}
        />
      )}
      
      {/* Main Card — Fixed Height */}
      <div 
        onClick={() => onSelect(book.id)}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-2xl h-full",
          "bg-gradient-to-br from-[#0a0b0f] via-[#0d0f14] to-[#12151c]",
          "border-2 transition-all duration-400",
          book.borderColor,
          "hover:border-opacity-80",
          isHighEnd && "hover:shadow-[0_20px_60px_-15px_var(--card-glow)]"
        )}
        style={{ 
          '--card-glow': book.glowColor,
          minHeight: '280px'
        } as React.CSSProperties}
      >
        {/* Top Gradient Bar — Netflix Style */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[3px]",
          "bg-gradient-to-r opacity-80 group-hover:opacity-100 transition-opacity"
        )} style={{
          backgroundImage: `linear-gradient(90deg, transparent, ${book.glowColor}, transparent)`
        }} />

        {/* Animated Background Gradient */}
        <div className={cn(
          "absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500",
          "bg-gradient-to-br",
          book.gradientFrom,
          book.gradientVia,
          book.gradientTo
        )} />

        {/* Cinematic Scan Line Effect */}
        {isHighEnd && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent"
              style={{
                animation: 'netflix-scan 2.5s linear infinite',
                transform: 'translateY(-100%)'
              }}
            />
          </div>
        )}

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px),
                              repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)`
          }}
        />

        {/* Content Container */}
        <div className="relative p-5 flex flex-col h-full justify-between">
          {/* Header: Icon + Badge */}
          <div className="flex items-start justify-between mb-4">
            {/* Icon Container — Glowing */}
            <div className={cn(
              "relative p-3.5 rounded-xl",
              "bg-gradient-to-br from-black/40 to-black/20",
              "border",
              book.borderColor,
              "group-hover:scale-105 transition-all duration-300"
            )}>
              {/* Icon Inner Glow */}
              {isHighEnd && (
                <div 
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-70 transition-opacity blur-lg"
                  style={{ backgroundColor: book.glowColor }}
                />
              )}
              {/* Pulsing Ring */}
              <div 
                className={cn(
                  "absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity",
                  "border",
                  book.borderColor
                )}
                style={{ animation: isHighEnd ? 'pulse 2s ease-in-out infinite' : undefined }}
              />
              <span className={cn("relative z-10", book.accentColor)}>
                {book.icon}
              </span>
            </div>

            {/* Badge — Premium Style */}
            {book.badge && (
              <span 
                className={cn(
                  "text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md",
                  "border",
                  book.borderColor,
                  book.accentColor
                )}
                style={{
                  background: `linear-gradient(135deg, ${book.glowColor.replace('0.4', '0.2')}, transparent)`
                }}
              >
                {book.badge}
              </span>
            )}
          </div>

          {/* Title + Description */}
          <div className="flex-1 space-y-2">
            <h3 className={cn(
              "text-lg font-bold text-white/95 group-hover:text-white transition-colors",
              "leading-tight line-clamp-2"
            )}>
              {book.name}
            </h3>
            <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
              {book.description}
            </p>
          </div>

          {/* Footer: Stats + Action */}
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/[0.06]">
            {/* Filter Count — Chip */}
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
              "bg-white/[0.04] border border-white/[0.08]",
              "group-hover:bg-white/[0.06] group-hover:border-white/[0.12] transition-all"
            )}>
              <Filter className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-[11px] font-medium text-white/60">
                {book.filters.length} {book.filters.length === 1 ? 'categoria' : 'categorias'}
              </span>
            </div>

            {/* Explore Button — Netflix Hover */}
            <button className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg",
              "border transition-all duration-300",
              book.borderColor,
              "group-hover:scale-105"
            )}
              style={{
                background: `linear-gradient(135deg, ${book.glowColor.replace('0.4', '0.15')}, transparent)`
              }}
            >
              <span className={cn("text-xs font-semibold", book.accentColor)}>
                Explorar
              </span>
              <ChevronRight className={cn("w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform", book.accentColor)} />
            </button>
          </div>
        </div>

        {/* Corner Accent Glow */}
        <div 
          className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full opacity-10 group-hover:opacity-25 transition-opacity blur-2xl pointer-events-none"
          style={{ backgroundColor: book.glowColor }}
        />
      </div>
    </motion.div>
  );
});

// ============================================
// 📂 BOOK DETAIL VIEW — FILTROS INTERNOS
// ============================================

interface BookDetailViewProps {
  book: MaterialBook;
  onBack: () => void;
  onSelectFilter: (bookId: string, filter: string) => void;
  isHighEnd: boolean;
}

const BookDetailView = memo(function BookDetailView({
  book,
  onBack,
  onSelectFilter,
  isHighEnd
}: BookDetailViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFilters = book.filters.filter(f => 
    f.label.toLowerCase().includes(searchTerm.toLowerCase())
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
            onClick={onBack}
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
            <h2 className="text-2xl font-bold text-white">{book.name}</h2>
            <p className="text-sm text-muted-foreground">{book.description}</p>
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
            {book.filters.length} categorias
          </Badge>
        </div>
      </div>

      {/* 🔍 SEARCH */}
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar categoria..."
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

      {/* 📂 FILTERS GRID */}
      <div className="space-y-8">
        {Object.entries(groupedFilters).map(([category, filters]) => (
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
                  onClick={() => onSelectFilter(book.id, filter.value)}
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
                    {filter.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        {filteredFilters.length === 0 && (
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

  const handleSelectFilter = useCallback((bookId: string, filter: string) => {
    onSelectBook(bookId, filter);
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
            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <BookMarked className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">Selecione uma Coleção</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
              <Badge variant="outline" className="border-white/20 text-white/60">
                {MATERIAL_BOOKS.length} coleções
              </Badge>
            </motion.div>

            {/* 🎬 NETFLIX ULTRA GRID — 5 UNIFORM CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 auto-rows-fr">
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
