// ============================================
// 📚 LIVROS DO MOISA - Página do Aluno
// Biblioteca e Leitor de Livros Web
// Visual Netflix Ultra Premium + Year 2300
// ============================================

import { memo, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WebBookLibrary, WebBookViewer } from '@/components/books';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const AlunoLivroWeb = memo(function AlunoLivroWeb() {
  const location = useLocation();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
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

  // P0 anti-tela-preta: loader mínimo enquanto não está pronto
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          // Biblioteca — Agora é a ÚNICA seção
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <WebBookLibrary onBookSelect={handleBookSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AlunoLivroWeb.displayName = 'AlunoLivroWeb';

export default AlunoLivroWeb;
