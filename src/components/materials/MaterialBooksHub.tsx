// ============================================
// 📚 MATERIAL BOOKS HUB — 5 BOOKS FIXOS
// Year 2300 Cinematic Experience
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
  X,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  color: string;
  gradientFrom: string;
  gradientTo: string;
  filters: BookFilter[];
}

export interface BookFilter {
  value: string;
  label: string;
  category?: string; // Para agrupar filtros
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

// 5 BOOKS FIXOS
const MATERIAL_BOOKS: MaterialBook[] = [
  {
    id: 'questoes-mapas',
    name: 'Questões e Mapas Mentais',
    description: 'Material de estudo com questões comentadas e mapas mentais organizados por tema',
    icon: <FileText className="w-8 h-8" />,
    color: 'text-primary',
    gradientFrom: 'from-primary/20',
    gradientTo: 'to-primary/5',
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
    icon: <GraduationCap className="w-8 h-8" />,
    color: 'text-cyan-400',
    gradientFrom: 'from-cyan-500/20',
    gradientTo: 'to-cyan-500/5',
    filters: BANCAS_FILTERS
  },
  {
    id: 'provas-anteriores',
    name: 'Provas Anteriores',
    description: 'Provas anteriores resolvidas e comentadas de cada vestibular',
    icon: <ScrollText className="w-8 h-8" />,
    color: 'text-amber-400',
    gradientFrom: 'from-amber-500/20',
    gradientTo: 'to-amber-500/5',
    filters: BANCAS_FILTERS
  },
  {
    id: 'extras',
    name: 'Extras',
    description: 'Materiais complementares incluindo levantamentos, cronogramas e conteúdos extras',
    icon: <Layers className="w-8 h-8" />,
    color: 'text-emerald-400',
    gradientFrom: 'from-emerald-500/20',
    gradientTo: 'to-emerald-500/5',
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
    icon: <Sparkles className="w-8 h-8" />,
    color: 'text-purple-400',
    gradientFrom: 'from-purple-500/20',
    gradientTo: 'to-purple-500/5',
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
// BOOK CARD COMPONENT
// ============================================

const BookCard = memo(function BookCard({ 
  book, 
  onSelect,
  isHighEnd 
}: { 
  book: MaterialBook; 
  onSelect: (bookId: string) => void;
  isHighEnd: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isHighEnd ? 1.02 : 1, y: isHighEnd ? -4 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        onClick={() => onSelect(book.id)}
        className={cn(
          "relative cursor-pointer overflow-hidden",
          "bg-gradient-to-br from-[#0d1218] via-[#121922] to-[#1a1020]",
          "border border-white/10 hover:border-white/20",
          "transition-all duration-300",
          isHighEnd && "hover:shadow-[0_0_40px_-10px_rgba(229,9,20,0.3)]"
        )}
      >
        {/* Gradient overlay */}
        <div className={cn(
          "absolute inset-0 opacity-50",
          `bg-gradient-to-br ${book.gradientFrom} ${book.gradientTo}`
        )} />

        <CardContent className="relative p-6 space-y-4">
          {/* Icon + Title */}
          <div className="flex items-start justify-between">
            <div className={cn(
              "p-3 rounded-2xl",
              `bg-gradient-to-br ${book.gradientFrom} ${book.gradientTo}`,
              "border border-white/10"
            )}>
              <span className={book.color}>{book.icon}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Name + Description */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">{book.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {book.description}
            </p>
          </div>

          {/* Filter count badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-white/20 text-white/70">
              <Filter className="w-3 h-3 mr-1" />
              {book.filters.length} {book.filters.length === 1 ? 'categoria' : 'categorias'}
            </Badge>
          </div>

          {/* Corner accent */}
          <div className={cn(
            "absolute bottom-0 right-0 w-24 h-24",
            "bg-gradient-to-tl opacity-20 rounded-tl-full",
            book.gradientFrom.replace('from-', 'from-').replace('/20', '/30')
          )} />
        </CardContent>
      </Card>
    </motion.div>
  );
});

// ============================================
// BOOK DETAIL VIEW (Filtros internos)
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

  // Agrupar filtros por categoria (se existir)
  const groupedFilters = filteredFilters.reduce((acc, filter) => {
    const category = filter.category || 'geral';
    if (!acc[category]) acc[category] = [];
    acc[category].push(filter);
    return acc;
  }, {} as Record<string, BookFilter[]>);

  const categoryLabels: Record<string, string> = {
    'nacional': 'Nacional',
    'sp': 'São Paulo',
    'rj': 'Rio de Janeiro',
    'sul': 'Sul',
    'nordeste': 'Nordeste',
    'norte': 'Norte',
    'centro-oeste': 'Centro-Oeste',
    'militar': 'Militar',
    'geral': 'Geral'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack}
          className="rounded-full border border-white/10 hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-2xl",
            `bg-gradient-to-br ${book.gradientFrom} ${book.gradientTo}`,
            "border border-white/10"
          )}>
            <span className={book.color}>{book.icon}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{book.name}</h2>
            <p className="text-sm text-muted-foreground">{book.description}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 focus:border-primary/50"
        />
      </div>

      {/* Filters Grid - Agrupado por categoria */}
      <div className="space-y-6">
        {Object.entries(groupedFilters).map(([category, filters]) => (
          <div key={category} className="space-y-3">
            {/* Category label (se tiver mais de uma categoria) */}
            {Object.keys(groupedFilters).length > 1 && (
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {categoryLabels[category] || category}
              </h3>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filters.map((filter, idx) => (
                <motion.div
                  key={filter.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => onSelectFilter(book.id, filter.value)}
                    className={cn(
                      "w-full h-auto py-4 px-4",
                      "bg-gradient-to-br from-white/5 to-white/[0.02]",
                      "border-white/10 hover:border-white/30",
                      "hover:bg-white/10 transition-all",
                      isHighEnd && "hover:shadow-[0_0_20px_-5px_rgba(229,9,20,0.2)]"
                    )}
                  >
                    <span className="text-sm font-medium text-white">{filter.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {filteredFilters.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// 📚 MAIN HUB COMPONENT
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
    <div className={cn("space-y-6", className)}>
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {MATERIAL_BOOKS.map((book, idx) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <BookCard
                  book={book}
                  onSelect={handleSelectBook}
                  isHighEnd={isHighEnd}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MaterialBooksHub;
export { MATERIAL_BOOKS, BANCAS_FILTERS };
