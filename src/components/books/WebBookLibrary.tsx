// ============================================
// 📚 LIVROS DO MOISA - NETFLIX ULTRA PREMIUM v7.0
// Year 2300 Cinematic Interface + Marvel Studios Level
// Full Immersive Experience — No Header Section (Standalone)
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
  Play,
  Star,
  Clock,
  TrendingUp,
  Cpu,
  Shield
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
// NETFLIX BOOK CARD — Cinematic Premium
// ============================================

interface BookCardProps {
  book: WebBookListItem;
  onClick: () => void;
  categoryCoverUrl?: string | null;
  index: number;
}

const NetflixBookCard = memo(function NetflixBookCard({
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

  // Cores temáticas Netflix Red + categoria
  const categoryColors = useMemo(() => {
    const cat = book.category?.toLowerCase() || '';
    if (cat.includes('geral')) return { main: '#E50914', glow: 'rgba(229,9,20,0.6)', accent: '#FF3D47' };
    if (cat.includes('organic')) return { main: '#B81D24', glow: 'rgba(184,29,36,0.6)', accent: '#E23636' };
    if (cat.includes('fisico')) return { main: '#E50914', glow: 'rgba(229,9,20,0.6)', accent: '#FF5A5A' };
    if (cat.includes('ambiental')) return { main: '#1DB954', glow: 'rgba(29,185,84,0.5)', accent: '#4ADE80' };
    if (cat.includes('bio')) return { main: '#E50914', glow: 'rgba(229,9,20,0.6)', accent: '#FF6B6B' };
    if (cat.includes('revisao')) return { main: '#E50914', glow: 'rgba(229,9,20,0.6)', accent: '#FF4757' };
    if (cat.includes('previsao')) return { main: '#FFD700', glow: 'rgba(255,215,0,0.5)', accent: '#FFC107' };
    return { main: '#E50914', glow: 'rgba(229,9,20,0.6)', accent: '#FF3D47' };
  }, [book.category]);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.08, zIndex: 20 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "netflix-card group relative rounded-md overflow-hidden cursor-pointer text-left",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
      )}
      style={{
        aspectRatio: '2/3',
        transformOrigin: 'center bottom',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          LAYER 1: COVER IMAGE (Netflix Style)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden rounded-md">
        {coverImage ? (
          <>
            <img
              src={coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              draggable={false}
            />
            {/* Netflix Vignette Overlay */}
            <div 
              className="absolute inset-0 opacity-60 group-hover:opacity-40 transition-opacity duration-500"
              style={{
                background: `
                  linear-gradient(to bottom, 
                    transparent 0%, 
                    transparent 40%,
                    rgba(0,0,0,0.4) 60%,
                    rgba(0,0,0,0.95) 100%
                  ),
                  linear-gradient(to top,
                    transparent 85%,
                    rgba(0,0,0,0.3) 100%
                  )
                `
              }}
            />
          </>
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' }}
          >
            <BookOpen className="w-12 h-12 text-red-500/30" />
          </div>
        )}

        {/* Scanlines Cinematográficas */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.08] group-hover:opacity-[0.04] transition-opacity"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              rgba(0,0,0,0.5) 1px,
              rgba(0,0,0,0.5) 2px
            )`
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 2: TOP BADGES (Netflix Style)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
        {/* Category Badge */}
        <div 
          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
          style={{
            background: `${categoryColors.main}CC`,
            color: 'white',
            boxShadow: `0 2px 10px ${categoryColors.glow}`
          }}
        >
          {isPdfMode ? 'PDF' : 'DIGITAL'}
        </div>
        
        {/* Rating / Views Badge */}
        <div 
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono backdrop-blur-sm"
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: '#FFD700',
            border: '1px solid rgba(255,215,0,0.3)'
          }}
        >
          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
          <span>{book.viewCount || 0}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 3: COMPLETED BADGE (Netflix Checkmark)
      ══════════════════════════════════════════════════════════════════ */}
      {isCompleted && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{
              background: 'rgba(29,185,84,0.9)',
              boxShadow: '0 0 40px rgba(29,185,84,0.6), 0 0 80px rgba(29,185,84,0.3)'
            }}
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 4: PROGRESS BAR (Netflix Style)
      ══════════════════════════════════════════════════════════════════ */}
      {hasStarted && !isCompleted && (
        <div className="absolute bottom-[4.5rem] left-0 right-0 px-2 z-10">
          <div className="h-1 rounded-full overflow-hidden bg-white/20">
            <motion.div 
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ 
                background: categoryColors.main,
                boxShadow: `0 0 10px ${categoryColors.glow}`
              }}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 5: TITLE & INFO (Bottom - Netflix Style)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-1 drop-shadow-lg">
          {book.title}
        </h3>
        
        <div className="flex items-center gap-2 text-[10px] text-white/60 font-medium">
          {book.totalPages > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {book.totalPages} pág
            </span>
          )}
          {hasStarted && !isCompleted && (
            <span className="flex items-center gap-1" style={{ color: categoryColors.accent }}>
              <Clock className="w-3 h-3" />
              {progress.toFixed(0)}%
            </span>
          )}
        </div>

        {book.author && (
          <p className="text-[10px] text-white/40 mt-1 truncate">
            {book.author}
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 6: HOVER OVERLAY (Netflix Play)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 pointer-events-none">
        <motion.div 
          initial={{ scale: 0.5 }}
          whileHover={{ scale: 1 }}
          className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md"
          style={{
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.4)'
          }}
        >
          <Play className="w-7 h-7 text-black ml-1" fill="black" />
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 7: HOVER GLOW BORDER (Netflix Red)
      ══════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
        style={{
          boxShadow: `
            inset 0 0 0 2px ${categoryColors.main},
            0 0 30px ${categoryColors.glow},
            0 20px 50px rgba(0,0,0,0.5)
          `
        }}
      />
    </motion.button>
  );
});
NetflixBookCard.displayName = 'NetflixBookCard';

// ============================================
// COMPONENTE PRINCIPAL — NETFLIX ARCHIVE
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

  // Loading state — Netflix Style
  if (isLoading && books.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
                boxShadow: '0 0 60px rgba(229,9,20,0.5), 0 0 120px rgba(229,9,20,0.2)',
                animation: 'netflix-pulse 1.5s ease-in-out infinite'
              }}
            >
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            {/* Orbital rings */}
            <div 
              className="absolute -inset-4 rounded-full border border-red-500/30"
              style={{ animation: 'netflix-ring-spin 3s linear infinite' }}
            />
            <div 
              className="absolute -inset-8 rounded-full border border-red-500/20"
              style={{ animation: 'netflix-ring-spin 5s linear infinite reverse' }}
            />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg tracking-wide">Carregando biblioteca...</p>
            <p className="text-white/50 text-sm mt-1">Preparando sua experiência</p>
          </div>
        </div>
        <style>{`
          @keyframes netflix-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes netflix-ring-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state — Netflix Style
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
              boxShadow: '0 0 40px rgba(127,29,29,0.5)'
            }}
          >
            <Zap className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado</h3>
            <p className="text-white/60">{error}</p>
          </div>
          <Button 
            onClick={() => loadBooks()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 0: NETFLIX DARK VOID BACKGROUND
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 -z-10">
        {/* Pure Netflix Black */}
        <div className="absolute inset-0 bg-[#141414]" />
        
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 0%, rgba(229,9,20,0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 100%, rgba(229,9,20,0.04) 0%, transparent 40%)
            `
          }}
        />
        
        {/* Cinematic vignette */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)`
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 1: NETFLIX HERO HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 pt-8 pb-6 px-4 md:px-8 lg:px-12">
        {/* Main Title Row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            {/* Badge */}
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: 'linear-gradient(90deg, #E50914 0%, #B81D24 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(229,9,20,0.4)'
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  Premium
                </span>
              </div>
              <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-red-500/50 to-transparent" />
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
              Biblioteca Digital
            </h1>
            <p className="text-white/50 text-sm md:text-base mt-2 max-w-lg">
              Sua coleção completa de materiais de Química para conquistar o ENEM
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-white">{filteredBooks.length}</p>
              <p className="text-white/40 text-xs uppercase tracking-wider">Livros</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-red-500">
                {filteredBooks.filter(b => b.progress?.isCompleted).length}
              </p>
              <p className="text-white/40 text-xs uppercase tracking-wider">Completos</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            LAYER 2: SEARCH & FILTERS BAR (Netflix Style)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              placeholder="Buscar títulos, autores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-[#333333] border-none text-white placeholder:text-white/40 focus:bg-[#454545] focus:ring-1 focus:ring-white/20 rounded transition-all"
            />
          </div>
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-56 h-12 bg-[#333333] border-none text-white rounded focus:ring-1 focus:ring-white/20">
              <Filter className="w-4 h-4 mr-2 text-white/60" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10">
              {CATEGORIES.map(cat => (
                <SelectItem 
                  key={cat.value} 
                  value={cat.value}
                  className="text-white focus:bg-white/10 focus:text-white"
                >
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Trending Badge */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded bg-[#333333]">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-white/70 text-sm">Em alta esta semana</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 3: BOOK GRID (Netflix Poster Style)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 px-4 md:px-8 lg:px-12 pb-16">
        {/* Section Divider */}
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            {selectedCategory === 'all' ? 'Todos os Títulos' : 
              CATEGORIES.find(c => c.value === selectedCategory)?.label || 'Selecionados'}
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
        </div>

        {filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)'
              }}
            >
              <BookOpen className="w-12 h-12 text-white/20" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Nenhum livro encontrado</h3>
              <p className="text-white/50">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'A biblioteca está vazia'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredBooks.map((book, index) => (
                <NetflixBookCard
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
          GLOBAL STYLES
      ═══════════════════════════════════════════════════════════════════ */}
      <style>{`
        .netflix-card {
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease;
        }
        .netflix-card:hover {
          z-index: 20;
        }
      `}</style>
    </section>
  );
});

WebBookLibrary.displayName = 'WebBookLibrary';

export default WebBookLibrary;
