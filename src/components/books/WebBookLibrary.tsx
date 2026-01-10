// ============================================
// 📚 LIVROS DO MOISA - STARK INDUSTRIES ARCHIVE v6.0
// Netflix Premium + Year 2300 HUD Interface
// Cinematográfico Ultra Premium — Marvel Studios Level
// ============================================

import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useWebBookLibrary, WebBookListItem } from '@/hooks/useWebBook';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Loader2, 
  Search, 
  Filter,
  CheckCircle,
  Eye,
  Sparkles,
  Zap,
  Database,
  Cpu
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getCategoryConfig, normalizeCategoryId } from './CategoryCover';
import { useBookCategories } from '@/hooks/useBookCategories';

// ============================================
// TIPOS
// ============================================

interface WebBookLibraryProps {
  onBookSelect: (bookId: string) => void;
  externalCategory?: string | null;
  className?: string;
}

// ============================================
// CATEGORIAS
// ============================================

const CATEGORIES = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'quimica_geral', label: '⚗️ Química Geral' },
  { value: 'quimica_organica', label: '🧪 Química Orgânica' },
  { value: 'fisico_quimica', label: '📊 Físico-Química' },
  { value: 'quimica_ambiental', label: '🌍 Química Ambiental' },
  { value: 'bioquimica', label: '🧬 Bioquímica' },
  { value: 'revisao_ciclica', label: '🔄 Revisão Cíclica' },
  { value: 'previsao_final', label: '🎯 Previsão Final' },
  { value: 'exercicios', label: '✏️ Exercícios' },
  { value: 'simulados', label: '📝 Simulados' },
  { value: 'resumos', label: '📋 Resumos' },
  { value: 'mapas_mentais', label: '🧠 Mapas Mentais' },
  { value: 'outros', label: '📚 Outros' },
];

// ============================================
// STARK BOOK CARD — HUD Style
// ============================================

interface BookCardProps {
  book: WebBookListItem;
  onClick: () => void;
  categoryCoverUrl?: string | null;
  index: number;
}

const StarkBookCard = memo(function StarkBookCard({
  book,
  onClick,
  categoryCoverUrl,
  index
}: BookCardProps) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const isPdfMode = book.totalPages === 0;
  const coverImage = book.coverUrl || categoryCoverUrl || getCategoryConfig(book.category)?.cover;

  // Cor temática baseada na categoria
  const categoryColors = useMemo(() => {
    const cat = book.category?.toLowerCase() || '';
    if (cat.includes('geral')) return { hue: 350, rgb: '255, 50, 80', main: '#FF324F' };
    if (cat.includes('organic')) return { hue: 280, rgb: '180, 80, 255', main: '#B450FF' };
    if (cat.includes('fisico')) return { hue: 150, rgb: '0, 255, 150', main: '#00FF96' };
    if (cat.includes('ambiental')) return { hue: 120, rgb: '50, 255, 100', main: '#32FF64' };
    if (cat.includes('bio')) return { hue: 320, rgb: '255, 100, 200', main: '#FF64C8' };
    if (cat.includes('revisao')) return { hue: 200, rgb: '0, 200, 255', main: '#00C8FF' };
    if (cat.includes('previsao')) return { hue: 45, rgb: '255, 200, 0', main: '#FFC800' };
    return { hue: 180, rgb: '0, 255, 255', main: '#00FFFF' };
  }, [book.category]);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "stark-book-card group relative rounded-xl overflow-hidden cursor-pointer text-left w-full",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${categoryColors.hue},30%,6%) 0%, hsl(${categoryColors.hue},20%,3%) 50%, hsl(${categoryColors.hue},25%,5%) 100%)`,
        boxShadow: `0 15px 40px rgba(0,0,0,0.6), 0 0 30px rgba(${categoryColors.rgb},0.1)`,
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          LAYER 0: CORNER BRACKETS (HUD Frame)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top-Left Bracket */}
        <div className="absolute top-0 left-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 8V2H8" stroke={categoryColors.main} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
          </svg>
        </div>
        {/* Top-Right Bracket */}
        <div className="absolute top-0 right-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 2H22V8" stroke={categoryColors.main} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
          </svg>
        </div>
        {/* Bottom-Left Bracket */}
        <div className="absolute bottom-0 left-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 16V22H8" stroke={categoryColors.main} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
          </svg>
        </div>
        {/* Bottom-Right Bracket */}
        <div className="absolute bottom-0 right-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22 16V22H16" stroke={categoryColors.main} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
          </svg>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 1: COVER IMAGE
      ══════════════════════════════════════════════════════════════════ */}
      <div className="aspect-[3/4] relative overflow-hidden">
        {coverImage ? (
          <>
            <img
              src={coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              style={{
                filter: isCompleted 
                  ? 'saturate(1.3) contrast(1.1)' 
                  : 'saturate(0.9) contrast(1)',
              }}
              draggable={false}
            />
            {/* Holographic overlay */}
            <div 
              className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
              style={{
                background: `linear-gradient(135deg, 
                  transparent 0%, 
                  rgba(${categoryColors.rgb},0.1) 25%, 
                  transparent 50%, 
                  rgba(${categoryColors.rgb},0.15) 75%, 
                  transparent 100%)`
              }}
            />
          </>
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, hsl(${categoryColors.hue},40%,8%) 0%, hsl(${categoryColors.hue},30%,4%) 100%)` }}
          >
            <BookOpen className="w-12 h-12" style={{ color: categoryColors.main, opacity: 0.5 }} />
          </div>
        )}

        {/* Scanlines */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(0,0,0,0.3) 2px,
              rgba(0,0,0,0.3) 4px
            )`
          }}
        />

        {/* Dark gradient overlay for text */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, 
              rgba(0,0,0,0.95) 0%, 
              rgba(0,0,0,0.5) 40%, 
              rgba(0,0,0,0.1) 70%,
              transparent 100%)`
          }}
        />

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 2: STATUS BADGES
        ══════════════════════════════════════════════════════════════════ */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-20">
          {/* PDF Badge */}
          {isPdfMode && (
            <div 
              className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
              style={{
                background: `rgba(${categoryColors.rgb},0.2)`,
                border: `1px solid rgba(${categoryColors.rgb},0.5)`,
                color: categoryColors.main,
                boxShadow: `0 0 10px rgba(${categoryColors.rgb},0.3)`
              }}
            >
              PDF
            </div>
          )}
          
          {/* Completed Badge */}
          {isCompleted && (
            <div 
              className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ml-auto"
              style={{
                background: 'rgba(0,255,150,0.2)',
                border: '1px solid rgba(0,255,150,0.5)',
                color: '#00FF96',
                boxShadow: '0 0 10px rgba(0,255,150,0.3)'
              }}
            >
              <CheckCircle className="w-3 h-3" />
              DONE
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 3: PROGRESS BAR (HUD Style)
        ══════════════════════════════════════════════════════════════════ */}
        {hasStarted && !isCompleted && (
          <div className="absolute bottom-16 left-2 right-2 z-20">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span style={{ color: categoryColors.main }} className="opacity-80">PROGRESS</span>
              <span style={{ color: categoryColors.main }}>{progress.toFixed(0)}%</span>
            </div>
            <div 
              className="h-1 rounded-full overflow-hidden"
              style={{ background: `rgba(${categoryColors.rgb},0.2)` }}
            >
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${categoryColors.main}, rgba(${categoryColors.rgb},0.6))`,
                  boxShadow: `0 0 10px ${categoryColors.main}`
                }}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 4: TITLE & INFO (Bottom)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
          <h3 
            className="font-bold text-sm line-clamp-2 mb-1"
            style={{ 
              color: 'white',
              textShadow: `0 0 20px rgba(${categoryColors.rgb},0.5)`
            }}
          >
            {book.title}
          </h3>
          
          {book.subtitle && (
            <p 
              className="text-[10px] uppercase tracking-wider line-clamp-1 mb-2 font-mono"
              style={{ color: `rgba(${categoryColors.rgb},0.8)` }}
            >
              {book.subtitle}
            </p>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" style={{ color: categoryColors.main }} />
              {book.totalPages > 0 ? `${book.totalPages} PG` : 'PDF'}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" style={{ color: categoryColors.main }} />
              {book.viewCount || 0}
            </span>
          </div>

          <p className="text-[10px] mt-1 truncate" style={{ color: categoryColors.main, opacity: 0.7 }}>
            {book.author}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 5: HOVER GLOW EFFECT
      ══════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-30"
        style={{
          boxShadow: `inset 0 0 60px rgba(${categoryColors.rgb},0.15), 0 0 40px rgba(${categoryColors.rgb},0.2)`,
          border: `1px solid rgba(${categoryColors.rgb},0.4)`
        }}
      />

      {/* Hover CTA */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-40 pointer-events-none">
        <div 
          className="px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider backdrop-blur-sm"
          style={{
            background: `rgba(${categoryColors.rgb},0.2)`,
            border: `1px solid ${categoryColors.main}`,
            color: categoryColors.main,
            boxShadow: `0 0 30px rgba(${categoryColors.rgb},0.4)`
          }}
        >
          {hasStarted ? '◉ CONTINUE' : '▶ ACCESS'}
        </div>
      </div>
    </motion.button>
  );
});
StarkBookCard.displayName = 'StarkBookCard';

// ============================================
// COMPONENTE PRINCIPAL — STARK ARCHIVE
// ============================================

export const WebBookLibrary = memo(function WebBookLibrary({
  onBookSelect,
  externalCategory,
  className
}: WebBookLibraryProps) {
  const { books, isLoading, error, loadBooks } = useWebBookLibrary();
  const { categories: dbCategories } = useBookCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mapa de categoria → capa do banco para lookup rápido
  const categoryCoverMap = useMemo(() => {
    const map: Record<string, string> = {};
    dbCategories.forEach(cat => {
      if (cat.effectiveCover) {
        map[cat.id] = cat.effectiveCover;
      }
    });
    return map;
  }, [dbCategories]);

  // Função para obter capa da categoria do livro
  const getCoverForBook = useCallback((book: WebBookListItem): string | null => {
    const normalizedCatId = normalizeCategoryId(book.category);
    if (normalizedCatId && categoryCoverMap[normalizedCatId]) {
      return categoryCoverMap[normalizedCatId];
    }
    return null;
  }, [categoryCoverMap]);

  // Sincroniza categoria externa (botões macro) com estado interno
  useEffect(() => {
    if (externalCategory !== undefined) {
      const category = externalCategory || 'all';
      setSelectedCategory(category);
      loadBooks(externalCategory || undefined);
    }
  }, [externalCategory, loadBooks]);

  // Filtrar livros
  const filteredBooks = books.filter(book => {
    const matchesSearch = !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Atualizar categoria
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    const backendCategory = category === 'all' ? undefined : category;
    loadBooks(backendCategory);
  }, [loadBooks]);

  // Loading state
  if (isLoading && books.length === 0) {
    return (
      <div className="relative py-16">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full border-2 border-cyan-500/30 flex items-center justify-center"
              style={{ 
                boxShadow: '0 0 40px rgba(0,255,255,0.2), inset 0 0 20px rgba(0,255,255,0.1)',
                animation: 'stark-core-pulse 2s ease-in-out infinite'
              }}
            >
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            {/* Orbital ring */}
            <div 
              className="absolute inset-0 rounded-full border border-cyan-500/20"
              style={{ 
                transform: 'scale(1.5)',
                animation: 'stark-ring-spin 3s linear infinite'
              }}
            />
          </div>
          <p className="text-cyan-400 font-mono text-sm tracking-wider animate-pulse">
            LOADING ARCHIVE...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative py-16">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div 
            className="w-16 h-16 rounded-full border-2 border-red-500/50 flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(255,0,0,0.2)' }}
          >
            <Zap className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-mono text-red-400 mb-2">ARCHIVE ERROR</h3>
            <p className="text-red-400/60 text-sm">{error}</p>
          </div>
          <Button 
            onClick={() => loadBooks()}
            className="font-mono text-xs uppercase tracking-wider"
            style={{
              background: 'rgba(255,50,80,0.2)',
              border: '1px solid rgba(255,50,80,0.5)',
              color: '#FF324F'
            }}
          >
            RETRY CONNECTION
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className={cn("relative py-12 overflow-hidden", className)}>
      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 0: COSMIC VOID BACKGROUND
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#030308] to-[#000000]" />
        
        {/* Nebula glow */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 30% 40%, hsla(180,100%,50%,0.06) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 70% 60%, hsla(280,100%,50%,0.04) 0%, transparent 50%)
            `
          }}
        />
        
        {/* Stars */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 8 === 0 ? '2px' : '1px',
                height: i % 8 === 0 ? '2px' : '1px',
                left: `${(i * 11.3) % 100}%`,
                top: `${(i * 17.7) % 100}%`,
                background: i % 2 === 0 ? 'hsl(180,100%,80%)' : 'white',
                boxShadow: `0 0 ${3 + (i % 5)}px currentColor`,
                animation: `stark-star-twinkle ${2 + (i % 4) * 0.5}s ease-in-out infinite`,
                animationDelay: `${(i % 15) * 0.1}s`,
                opacity: 0.3 + (i % 8) * 0.08
              }}
            />
          ))}
        </div>

        {/* Grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, hsla(180,100%,70%,0.8) 1px, transparent 1px),
              linear-gradient(0deg, hsla(180,100%,70%,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 1: STARK ARCHIVE HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 text-center mb-10">
        {/* Top tech ornament */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-[2px] w-16 md:w-32 bg-gradient-to-r from-transparent via-cyan-500/60 to-cyan-400" 
               style={{ boxShadow: '0 0 15px hsla(180,100%,50%,0.4)' }} />
          
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/5"
               style={{ boxShadow: '0 0 20px hsla(180,100%,50%,0.1)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" 
                 style={{ boxShadow: '0 0 8px hsl(180,100%,50%)' }} />
            <span className="text-[9px] md:text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase">
              Digital Archive
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" 
                 style={{ boxShadow: '0 0 8px hsl(180,100%,50%)' }} />
          </div>
          
          <div className="h-[2px] w-16 md:w-32 bg-gradient-to-l from-transparent via-cyan-500/60 to-cyan-400" 
               style={{ boxShadow: '0 0 15px hsla(180,100%,50%,0.4)' }} />
        </div>

        {/* Main title */}
        <h2 
          className="text-3xl md:text-5xl font-black tracking-[0.1em] uppercase flex items-center justify-center gap-3"
          style={{
            background: 'linear-gradient(180deg, hsl(180,100%,85%) 0%, hsl(180,100%,70%) 50%, hsl(200,100%,60%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px hsla(180,100%,50%,0.4)',
            filter: 'drop-shadow(0 0 30px hsla(180,100%,50%,0.2))'
          }}
        >
          <Database className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" style={{ filter: 'drop-shadow(0 0 10px hsl(180,100%,50%))' }} />
          Biblioteca Digital
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-cyan-300 animate-pulse" />
        </h2>
        
        {/* Subtitle with count */}
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="w-3 h-3 rotate-45 border border-cyan-500/40" />
          <p className="text-cyan-400/60 text-xs font-mono tracking-[0.3em] uppercase">
            {filteredBooks.length} ARQUIVO{filteredBooks.length !== 1 ? 'S' : ''} DISPONÍVE{filteredBooks.length !== 1 ? 'IS' : 'L'}
          </p>
          <div className="w-3 h-3 rotate-45 border border-cyan-500/40" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 2: SEARCH & FILTERS (HUD CONTROL PANEL)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 mb-10">
        <div 
          className="flex flex-col md:flex-row gap-4 items-center justify-center p-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,255,0.03) 0%, rgba(0,0,0,0.5) 50%, rgba(0,255,255,0.02) 100%)',
            border: '1px solid rgba(0,255,255,0.15)',
            boxShadow: '0 0 40px rgba(0,255,255,0.05), inset 0 0 30px rgba(0,0,0,0.3)'
          }}
        >
          {/* Search Input */}
          <div className="relative flex-1 w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/60" />
            <Input
              placeholder="Buscar na biblioteca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/50 border-cyan-500/30 text-cyan-100 placeholder:text-cyan-400/40 focus:border-cyan-400/60 font-mono text-sm"
              style={{ boxShadow: 'inset 0 0 20px rgba(0,255,255,0.05)' }}
            />
          </div>
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger 
              className="w-full md:w-56 bg-black/50 border-cyan-500/30 text-cyan-100 font-mono text-sm"
              style={{ boxShadow: 'inset 0 0 20px rgba(0,255,255,0.05)' }}
            >
              <Filter className="w-4 h-4 mr-2 text-cyan-400" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-cyan-500/30 backdrop-blur-xl">
              {CATEGORIES.map(cat => (
                <SelectItem 
                  key={cat.value} 
                  value={cat.value}
                  className="text-cyan-100 focus:bg-cyan-500/20 focus:text-cyan-50 font-mono text-sm"
                >
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-wider">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 3: BOOK GRID (NETFLIX STYLE)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[250px] gap-6 text-center">
            <div 
              className="w-20 h-20 rounded-full border-2 border-cyan-500/30 flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(0,255,255,0.1)' }}
            >
              <BookOpen className="w-10 h-10 text-cyan-400/50" />
            </div>
            <div>
              <h3 className="text-lg font-mono text-cyan-400 mb-2">NO ARCHIVES FOUND</h3>
              <p className="text-cyan-400/50 text-sm font-mono">
                {searchQuery || selectedCategory !== 'all'
                  ? 'ADJUST SEARCH PARAMETERS'
                  : 'ARCHIVE EMPTY'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredBooks.map((book, index) => (
                <StarkBookCard
                  key={book.id}
                  book={book}
                  onClick={() => onBookSelect(book.id)}
                  categoryCoverUrl={getCoverForBook(book)}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          GLOBAL KEYFRAME ANIMATIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes stark-star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes stark-core-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.3); }
        }
        @keyframes stark-ring-spin {
          from { transform: scale(1.5) rotate(0deg); }
          to { transform: scale(1.5) rotate(360deg); }
        }
        .stark-book-card {
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
      `}</style>
    </section>
  );
});

WebBookLibrary.displayName = 'WebBookLibrary';

export default WebBookLibrary;
