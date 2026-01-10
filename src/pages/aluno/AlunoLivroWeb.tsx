// ============================================
// 📚 LIVROS DO MOISA - Página do Aluno
// Biblioteca e Leitor de Livros Web
// Visual Futurístico Ano 2300
// 🚨 BLACKOUT ANTI-PIRATARIA v1.0 INTEGRADO
// ============================================

import { memo, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WebBookLibrary, WebBookViewer } from '@/components/books';
import { BookOpen, Sparkles } from 'lucide-react';
import { FuturisticCategoryFilter } from '@/components/books/FuturisticCategoryFilter';
// SecurityBlackoutOverlay REMOVIDO - Agora integrado globalmente no App.tsx (v1.1)

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const AlunoLivroWeb = memo(function AlunoLivroWeb() {
  const location = useLocation();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // P0 FIX: Garantir que o componente está montado antes de renderizar
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(timer);
  }, []);

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

  const handleCategoryClick = useCallback((categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  // P0 anti-tela-preta: loader mínimo enquanto não está pronto
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* 🚨 BLACKOUT ANTI-PIRATARIA v1.1 - GLOBAL (App.tsx) */}
      
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
            {/* Header Futurístico */}
            <header className="mb-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-3 mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="text-left">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
                    Livros do Moisa
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Sua biblioteca digital de Química
                  </p>
                </div>
              </motion.div>
            </header>

            {/* Filtros de Categoria Futurísticos */}
            <FuturisticCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />

            {/* Biblioteca */}
            <WebBookLibrary 
              onBookSelect={handleBookSelect} 
              externalCategory={selectedCategory}
            />
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </>
  );
});

AlunoLivroWeb.displayName = 'AlunoLivroWeb';

export default AlunoLivroWeb;
