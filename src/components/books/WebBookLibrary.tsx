// ============================================
// 📚 LIVROS DO MOISA - NETFLIX ULTRA PREMIUM v10.0
// Year 2300 Cinematic Interface + Marvel Studios Level
// MAXIMUM VISUAL IMPACT — Iron Man HUD Experience
// ============================================

import React, { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useWebBookLibrary, WebBookListItem } from '@/hooks/useWebBook';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { 
  BookOpen, 
  Loader2, 
  Search, 
  CheckCircle,
  Play,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  Crown,
  Eye,
  BookMarked,
  Library,
  Flame,
  Award
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
// HERO BILLBOARD — Netflix Featured Content
// ============================================

interface HeroBillboardProps {
  book: WebBookListItem | null;
  onClick: () => void;
  categoryCoverUrl?: string | null;
}

const HeroBillboard = memo(function HeroBillboard({ book, onClick, categoryCoverUrl }: HeroBillboardProps) {
  if (!book) return null;
  
  const coverImage = book.coverUrl || categoryCoverUrl || getCategoryConfig(book.category)?.cover;
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-[60vh] min-h-[500px] overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <div className="absolute inset-0">
        {coverImage && (
          <motion.img
            src={coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
          />
        )}
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        
        {/* Animated Scanlines */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            )`,
            animation: 'scanline-move 8s linear infinite'
          }}
        />
        
        {/* Holographic Grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(229,9,20,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(229,9,20,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'grid-pulse 4s ease-in-out infinite'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-16 max-w-3xl">
        {/* Category Badge */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">Destaque</span>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm">
              <CheckCircle className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">Concluído</span>
            </div>
          )}
        </motion.div>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl lg:text-6xl font-black text-white leading-tight mb-4"
          style={{
            textShadow: '0 4px 30px rgba(0,0,0,0.8), 0 0 60px rgba(229,9,20,0.3)'
          }}
        >
          {book.title}
        </motion.h1>

        {/* Metadata */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center gap-4 mb-6 text-white/80"
        >
          {book.author && (
            <span className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">{book.author}</span>
            </span>
          )}
          {book.totalPages > 0 && (
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">{book.totalPages} páginas</span>
            </span>
          )}
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">{book.viewCount || 0} visualizações</span>
          </span>
          <span className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium">4.9</span>
          </span>
        </motion.div>

        {/* Description */}
        {book.subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/70 text-base lg:text-lg max-w-xl mb-8 line-clamp-3"
          >
            {book.subtitle}
          </motion.p>
        )}

        {/* Progress Bar (if started) */}
        {progress > 0 && !isCompleted && (
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.55 }}
            className="mb-6 max-w-md"
          >
            <div className="flex items-center justify-between text-sm text-white/60 mb-2">
              <span>Seu progresso</span>
              <span className="text-red-500 font-bold">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div 
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                style={{ boxShadow: '0 0 20px rgba(229,9,20,0.5)' }}
              />
            </div>
          </motion.div>
        )}

        {/* CTA Button */}
        <motion.button
          onClick={onClick}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="group flex items-center gap-3 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
            boxShadow: '0 10px 40px rgba(229,9,20,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset'
          }}
        >
          <Play className="w-6 h-6 text-white fill-white group-hover:scale-110 transition-transform" />
          <span className="text-white">{progress > 0 ? 'Continuar Lendo' : 'Começar a Ler'}</span>
        </motion.button>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-red-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${5 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
    </motion.div>
  );
});

// ============================================
// NETFLIX BOOK CARD — Premium Hover Experience
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex-shrink-0 group cursor-pointer"
      style={{ width: '220px' }}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.08, y: -10, zIndex: 30 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full rounded-lg overflow-hidden focus:outline-none"
        style={{ aspectRatio: '2/3' }}
      >
        {/* Cover Image */}
        <div className="absolute inset-0">
          {coverImage ? (
            <img
              src={coverImage}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-red-500/20" />
            </div>
          )}

          {/* Gradient Overlays */}
          <div 
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: isHovered 
                ? 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)'
            }}
          />

          {/* Scanlines */}
          <div 
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg, transparent 0px, transparent 1px,
                rgba(0,0,0,0.5) 1px, rgba(0,0,0,0.5) 2px
              )`
            }}
          />

          {/* Holographic Shimmer on Hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(229,9,20,0.1) 45%, rgba(255,255,255,0.1) 50%, rgba(229,9,20,0.1) 55%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: isHovered ? 'shimmer 1.5s ease-in-out infinite' : 'none'
            }}
          />
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
          <div 
            className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
            style={{
              background: isPdfMode ? 'rgba(229,9,20,0.9)' : 'rgba(29,185,84,0.9)',
              color: 'white',
              boxShadow: isPdfMode ? '0 2px 15px rgba(229,9,20,0.5)' : '0 2px 15px rgba(29,185,84,0.5)'
            }}
          >
            {isPdfMode ? 'PDF' : 'WEB'}
          </div>
          
          <div className="flex items-center gap-1 px-2 py-1 rounded backdrop-blur-sm bg-black/60 text-[10px] font-medium text-yellow-400">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{book.viewCount || 0}</span>
          </div>
        </div>

        {/* Completed Badge */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md"
                style={{
                  background: 'rgba(16,185,129,0.95)',
                  boxShadow: '0 0 40px rgba(16,185,129,0.6), 0 0 80px rgba(16,185,129,0.3)'
                }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        {hasStarted && !isCompleted && (
          <div className="absolute bottom-20 left-2 right-2 z-10">
            <div className="h-1 rounded-full overflow-hidden bg-white/20">
              <motion.div 
                className="h-full rounded-full bg-red-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ boxShadow: '0 0 15px rgba(229,9,20,0.6)' }}
              />
            </div>
          </div>
        )}

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-1.5 drop-shadow-lg">
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
              <span className="flex items-center gap-1 text-red-400">
                <Clock className="w-3 h-3" />
                {progress.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={isHovered ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)'
            }}
          >
            <Play className="w-7 h-7 text-black ml-1" fill="black" />
          </motion.div>
        </div>

        {/* Hover Glow Border */}
        <motion.div 
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            boxShadow: `
              inset 0 0 0 2px rgba(229,9,20,0.8),
              0 0 40px rgba(229,9,20,0.4),
              0 25px 60px rgba(0,0,0,0.6)
            `
          }}
        />
      </motion.button>
    </motion.div>
  );
});

// ============================================
// HORIZONTAL CAROUSEL — Netflix Row
// ============================================

interface CarouselRowProps {
  title: string;
  icon: React.ReactNode;
  books: WebBookListItem[];
  onBookSelect: (bookId: string) => void;
  getCoverForBook: (book: WebBookListItem) => string | null;
}

const CarouselRow = memo(function CarouselRow({ 
  title, 
  icon, 
  books, 
  onBookSelect,
  getCoverForBook 
}: CarouselRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    const ref = scrollRef.current;
    ref?.addEventListener('scroll', updateScrollState);
    return () => ref?.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState, books]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (books.length === 0) return null;

  return (
    <div className="relative group/row py-4">
      {/* Row Title */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 px-6 lg:px-12 mb-4"
      >
        <div className="p-2 rounded-lg bg-red-600/20 backdrop-blur-sm">
          {icon}
        </div>
        <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
        <span className="text-white/40 text-sm font-medium">{books.length} livros</span>
      </motion.div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 z-20 w-16 lg:w-24 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, transparent 100%)'
              }}
            >
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-8 h-8 text-white" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right Arrow */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 z-20 w-16 lg:w-24 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(to left, rgba(0,0,0,0.9) 0%, transparent 100%)'
              }}
            >
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
                <ChevronRight className="w-8 h-8 text-white" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth px-6 lg:px-12 pb-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {books.map((book, index) => (
            <NetflixBookCard
              key={book.id}
              book={book}
              onClick={() => onBookSelect(book.id)}
              categoryCoverUrl={getCoverForBook(book)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// ============================================
// COMPONENTE PRINCIPAL — NETFLIX ULTRA PREMIUM
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

  // Mapa de categoria → capa do banco
  const categoryCoverMap = useMemo(() => {
    const map: Record<string, string> = {};
    dbCategories.forEach(cat => {
      if (cat.effectiveCover) {
        map[cat.id] = cat.effectiveCover;
      }
    });
    return map;
  }, [dbCategories]);

  const getCoverForBook = useCallback((book: WebBookListItem): string | null => {
    const normalizedCatId = normalizeCategoryId(book.category);
    if (normalizedCatId && categoryCoverMap[normalizedCatId]) {
      return categoryCoverMap[normalizedCatId];
    }
    return null;
  }, [categoryCoverMap]);

  useEffect(() => {
    if (externalCategory !== undefined) {
      const category = externalCategory || 'all';
      setSelectedCategory(category);
      loadBooks(externalCategory || undefined);
    }
  }, [externalCategory, loadBooks]);

  // Filtrar livros
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = !searchQuery || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  // Categorizar livros para rows
  const categorizedBooks = useMemo(() => {
    const inProgress = filteredBooks.filter(b => (b.progress?.progressPercent || 0) > 0 && !b.progress?.isCompleted);
    const completed = filteredBooks.filter(b => b.progress?.isCompleted);
    const trending = [...filteredBooks].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 15);
    const recent = filteredBooks.slice(0, 15); // Most recent by default order
    
    return { inProgress, completed, trending, recent, all: filteredBooks };
  }, [filteredBooks]);

  // Hero book (most viewed or in progress)
  const heroBook = useMemo(() => {
    if (categorizedBooks.inProgress.length > 0) return categorizedBooks.inProgress[0];
    if (categorizedBooks.trending.length > 0) return categorizedBooks.trending[0];
    return filteredBooks[0] || null;
  }, [categorizedBooks, filteredBooks]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    const backendCategory = category === 'all' ? undefined : category;
    loadBooks(backendCategory);
  }, [loadBooks]);

  // Loading State
  if (isLoading && books.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          {/* Netflix-style Loading Animation */}
          <div className="relative">
            <motion.div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
                boxShadow: '0 0 80px rgba(229,9,20,0.5)'
              }}
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 0 60px rgba(229,9,20,0.4)',
                  '0 0 100px rgba(229,9,20,0.6)',
                  '0 0 60px rgba(229,9,20,0.4)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Library className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Orbital Rings */}
            <motion.div 
              className="absolute -inset-6 rounded-full border-2 border-red-500/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute -inset-12 rounded-full border border-red-500/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute -inset-18 rounded-full border border-red-500/10"
              style={{ inset: '-4.5rem' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          <div className="text-center">
            <motion.p 
              className="text-white text-xl font-bold tracking-wide"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Carregando Biblioteca
            </motion.p>
            <p className="text-white/40 text-sm mt-2">Preparando sua experiência cinematográfica</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)',
              boxShadow: '0 0 40px rgba(153,27,27,0.5)'
            }}
          >
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Ops! Algo deu errado</h2>
          <p className="text-white/60">{error}</p>
          <button
            onClick={() => loadBooks()}
            className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-black", className)}>
      {/* Global Styles */}
      <style>{`
        @keyframes scanline-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.05; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Hero Billboard */}
      {heroBook && (
        <HeroBillboard 
          book={heroBook} 
          onClick={() => onBookSelect(heroBook.id)}
          categoryCoverUrl={getCoverForBook(heroBook)}
        />
      )}

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-black via-black/95 to-transparent backdrop-blur-xl py-4 px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-7xl mx-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="text"
              placeholder="Buscar livros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-lg focus:bg-white/10 focus:border-red-500/50 transition-all"
            />
          </div>

          {/* Category Select */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[220px] h-12 bg-white/5 border-white/10 text-white rounded-lg focus:ring-red-500/50">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white">
              {CATEGORIES.map(cat => (
                <SelectItem 
                  key={cat.value} 
                  value={cat.value}
                  className="text-white/80 focus:bg-red-600/30 focus:text-white"
                >
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stats */}
          <div className="hidden lg:flex items-center gap-6 ml-auto">
            <div className="flex items-center gap-2 text-white/60">
              <Library className="w-5 h-5 text-red-500" />
              <span className="font-medium">{filteredBooks.length} livros</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Award className="w-5 h-5 text-emerald-500" />
              <span className="font-medium">{categorizedBooks.completed.length} concluídos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="relative z-10 -mt-24 pt-4 pb-20 space-y-8">
        {/* Continue Watching */}
        {categorizedBooks.inProgress.length > 0 && (
          <CarouselRow
            title="Continuar Lendo"
            icon={<Clock className="w-5 h-5 text-red-500" />}
            books={categorizedBooks.inProgress}
            onBookSelect={onBookSelect}
            getCoverForBook={getCoverForBook}
          />
        )}

        {/* Completed */}
        {categorizedBooks.completed.length > 0 && (
          <CarouselRow
            title="Concluídos"
            icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
            books={categorizedBooks.completed}
            onBookSelect={onBookSelect}
            getCoverForBook={getCoverForBook}
          />
        )}

        {/* Trending */}
        {categorizedBooks.trending.length > 0 && (
          <CarouselRow
            title="Mais Populares"
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            books={categorizedBooks.trending}
            onBookSelect={onBookSelect}
            getCoverForBook={getCoverForBook}
          />
        )}

        {/* Recent */}
        {categorizedBooks.recent.length > 0 && (
          <CarouselRow
            title="Adicionados Recentemente"
            icon={<Sparkles className="w-5 h-5 text-purple-500" />}
            books={categorizedBooks.recent}
            onBookSelect={onBookSelect}
            getCoverForBook={getCoverForBook}
          />
        )}

        {/* All Books */}
        {filteredBooks.length > 15 && (
          <CarouselRow
            title="Todos os Livros"
            icon={<Library className="w-5 h-5 text-blue-500" />}
            books={filteredBooks}
            onBookSelect={onBookSelect}
            getCoverForBook={getCoverForBook}
          />
        )}

        {/* Empty State */}
        {filteredBooks.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
              style={{ 
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                boxShadow: '0 0 40px rgba(0,0,0,0.5)'
              }}
            >
              <Search className="w-12 h-12 text-white/20" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Nenhum livro encontrado</h3>
            <p className="text-white/50 max-w-md">
              Tente ajustar sua busca ou filtros para encontrar o que procura.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

WebBookLibrary.displayName = 'WebBookLibrary';
