// ============================================
// 📚 LIVROS DO MOISA - Página do Aluno
// Biblioteca e Leitor de Livros Web
// Agora com categorias dinâmicas do banco
// ============================================

import { memo, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WebBookLibrary, WebBookViewer } from '@/components/books';
import { BookOpen } from 'lucide-react';
import { MACRO_CATEGORIES, normalizeCategoryId, type MacroCategory } from '@/components/books/CategoryCover';
import { useBookCategories } from '@/hooks/useBookCategories';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const AlunoLivroWeb = memo(function AlunoLivroWeb() {
  const location = useLocation();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Buscar categorias do banco (com imagens customizadas)
  const { categories: dbCategories, isLoading: categoriesLoading } = useBookCategories();

  // Permite abrir um livro direto via URL: /alunos/livro-web?book=<uuid>
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookId = params.get('book');
    if (bookId) setSelectedBookId(bookId);
  }, [location.search]);

  const handleBookSelect = useCallback((bookId: string) => {
    setSelectedBookId(bookId);
  }, []);

  const handleCloseReader = useCallback(() => {
    setSelectedBookId(null);
  }, []);

  const handleCategoryClick = useCallback((categoryValue: string) => {
    setSelectedCategory(prev => prev === categoryValue ? null : categoryValue);
  }, []);

  // Usar categorias do banco se disponíveis, senão fallback estático
  const displayCategories = dbCategories.length > 0 ? dbCategories : MACRO_CATEGORIES.map(cat => ({
    ...cat,
    effectiveBanner: cat.banner,
    effectiveCover: cat.cover,
    banner_url: null,
    cover_url: null,
    gradient_start: null,
    gradient_end: null,
    position: 0,
    is_active: true,
    created_at: '',
    updated_at: '',
  }));

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {selectedBookId ? (
          // Leitor
          <motion.div
            key="reader"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="h-screen"
          >
            <WebBookViewer
              bookId={selectedBookId}
              onClose={handleCloseReader}
              className="h-full"
            />
          </motion.div>
        ) : (
          // Biblioteca
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="container mx-auto px-4 py-6 md:py-8"
          >
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Livros do Moisa
                  </h1>
                  <p className="text-muted-foreground">
                    Sua biblioteca digital de Química
                  </p>
                </div>
              </div>
            </header>

            {/* Filtros por Macro-Categoria com Capas (do banco) */}
            <section className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {displayCategories.map((cat) => {
                  const isActive = selectedCategory === cat.id || 
                    normalizeCategoryId(selectedCategory) === cat.id;
                  
                  // Usar banner para filtros horizontais
                  const imageUrl = cat.effectiveBanner || cat.effectiveCover;
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        isActive 
                          ? 'border-primary ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg' 
                          : 'border-border/50 hover:border-primary/30'
                      }`}
                    >
                      {/* Capa/Banner como fundo */}
                      <div className="aspect-[4/3] relative">
                        <img 
                          src={imageUrl} 
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay escuro para legibilidade */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        {/* Nome da categoria */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <span className="text-white text-sm font-bold drop-shadow-lg">
                            {cat.name}
                          </span>
                        </div>
                        {/* Indicador ativo */}
                        {isActive && (
                          <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Biblioteca */}
            <WebBookLibrary 
              onBookSelect={handleBookSelect} 
              externalCategory={selectedCategory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AlunoLivroWeb.displayName = 'AlunoLivroWeb';

export default AlunoLivroWeb;
