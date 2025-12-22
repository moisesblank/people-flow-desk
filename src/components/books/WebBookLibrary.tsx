// ============================================
// 📚 LIVROS DO MOISA - Biblioteca de Livros
// Listagem e navegação de livros disponíveis
// ============================================

import React, { memo, useState, useCallback } from 'react';
import { useWebBookLibrary, WebBookListItem } from '@/hooks/useWebBook';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Loader2, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface WebBookLibraryProps {
  onBookSelect: (bookId: string) => void;
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
  { value: 'revisao_ciclica', label: '🔄 Revisão Cíclica' },
  { value: 'previsao_final', label: '🎯 Previsão Final' },
  { value: 'exercicios', label: '✏️ Exercícios' },
  { value: 'simulados', label: '📝 Simulados' },
  { value: 'resumos', label: '📋 Resumos' },
  { value: 'mapas_mentais', label: '🧠 Mapas Mentais' },
  { value: 'outros', label: '📚 Outros' },
];

// ============================================
// BOOK CARD
// ============================================

const BookCard = memo(function BookCard({
  book,
  onClick
}: {
  book: WebBookListItem;
  onClick: () => void;
}) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative bg-card rounded-xl border border-border overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Capa */}
        <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Overlay de status */}
          {isCompleted && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500 text-white gap-1">
                <CheckCircle className="w-3 h-3" />
                Concluído
              </Badge>
            </div>
          )}

          {/* Barra de progresso */}
          {hasStarted && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-3 py-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          
          {book.subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {book.subtitle}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {book.totalPages} páginas
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {book.viewCount || 0}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">{book.author}</p>
        </div>

        {/* Ação ao hover */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="bg-primary text-primary-foreground rounded-full px-4 py-2 font-medium text-sm shadow-lg">
            {hasStarted ? 'Continuar lendo' : 'Começar a ler'}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
BookCard.displayName = 'BookCard';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const WebBookLibrary = memo(function WebBookLibrary({
  onBookSelect,
  className
}: WebBookLibraryProps) {
  const { books, isLoading, error, loadBooks } = useWebBookLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
    loadBooks(category || undefined);
  }, [loadBooks]);

  // Loading state
  if (isLoading && books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando biblioteca...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Erro ao carregar biblioteca</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => loadBooks()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Biblioteca Digital
          </h2>
          <p className="text-muted-foreground">
            {filteredBooks.length} livro{filteredBooks.length !== 1 ? 's' : ''} disponível{filteredBooks.length !== 1 ? 'is' : ''}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar livros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de livros */}
      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">Nenhum livro encontrado</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory
              ? 'Tente ajustar os filtros de busca'
              : 'Ainda não há livros disponíveis na biblioteca'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          <AnimatePresence>
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BookCard 
                  book={book} 
                  onClick={() => onBookSelect(book.id)} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

WebBookLibrary.displayName = 'WebBookLibrary';

export default WebBookLibrary;
