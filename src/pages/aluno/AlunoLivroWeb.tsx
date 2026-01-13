// ============================================
// 📚 LIVROS DO MOISA - Página do Aluno
// Biblioteca e Leitor de Livros Web
// Visual Netflix Ultra Premium + Year 2300
// ============================================

import { memo, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// ANIMAÇÕES REMOVIDAS: motion/AnimatePresence não mais usados
// import { motion, AnimatePresence } from 'framer-motion';
import { WebBookLibrary, WebBookViewer } from '@/components/books';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const AlunoLivroWeb = memo(function AlunoLivroWeb() {
  const location = useLocation();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [targetBookId, setTargetBookId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // P0 FIX: Garantir que o componente está montado antes de renderizar
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Permite abrir um livro direto via URL: /alunos/livro-web?book=<uuid>
  // Se ?section=<category> também abre a seção correspondente
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookId = params.get('book');
    const section = params.get('section');
    
    if (bookId) {
      // Se tem bookId, abre direto no leitor
      setSelectedBookId(bookId);
    } else if (section) {
      // Se só tem section, marca para auto-open na biblioteca
      // (não abre o leitor, só a seção)
    }
    
    // Sempre define targetBookId para auto-open da seção
    setTargetBookId(bookId || null);
  }, [location.search]);

  const handleBookSelect = useCallback((bookId: string) => {
    setSelectedBookId(bookId);
    // Atualiza URL para permitir navegação back/forward
    const url = new URL(window.location.href);
    url.searchParams.set('book', bookId);
    window.history.pushState({}, '', url.toString());
  }, []);

  const handleCloseReader = useCallback(() => {
    setSelectedBookId(null);
    // Mantém o targetBookId para auto-open quando voltar
    setTargetBookId(selectedBookId);
    // Remove book da URL mas mantém a seção aberta
    const url = new URL(window.location.href);
    url.searchParams.delete('book');
    window.history.pushState({}, '', url.toString());
  }, [selectedBookId]);

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
      {/* SEM ANIMAÇÕES — TRANSIÇÃO DIRETA */}
      {selectedBookId ? (
        // Leitor
        <div className="h-screen">
          <WebBookViewer
            bookId={selectedBookId}
            onClose={handleCloseReader}
            className="h-full"
          />
        </div>
      ) : (
        // Biblioteca — Agora é a ÚNICA seção
        <div>
          <WebBookLibrary onBookSelect={handleBookSelect} targetBookId={targetBookId} />
        </div>
      )}
    </div>
  );
});

AlunoLivroWeb.displayName = 'AlunoLivroWeb';

export default AlunoLivroWeb;
