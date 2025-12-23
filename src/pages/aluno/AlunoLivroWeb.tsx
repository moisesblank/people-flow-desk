// ============================================
// 📚 LIVROS DO MOISA - Página do Aluno
// Biblioteca e Leitor de Livros Web
// ============================================

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { WebBookLibrary, WebBookViewer } from '@/components/books';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const AlunoLivroWeb = memo(function AlunoLivroWeb() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const handleBookSelect = useCallback((bookId: string) => {
    setSelectedBookId(bookId);
  }, []);

  const handleCloseReader = useCallback(() => {
    setSelectedBookId(null);
  }, []);

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

            {/* Categorias destacadas */}
            <section className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: '⚗️ Química Geral', color: 'from-blue-500/20 to-blue-600/10' },
                  { label: '🧪 Orgânica', color: 'from-green-500/20 to-green-600/10' },
                  { label: '📊 Físico-Química', color: 'from-purple-500/20 to-purple-600/10' },
                  { label: '🔄 Revisão', color: 'from-amber-500/20 to-amber-600/10' },
                  { label: '🎯 Previsão', color: 'from-rose-500/20 to-rose-600/10' },
                ].map((cat) => (
                  <div
                    key={cat.label}
                    className={`p-4 rounded-xl bg-gradient-to-br ${cat.color} border border-border/50 text-center hover:scale-105 transition-transform cursor-pointer`}
                  >
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Biblioteca */}
            <WebBookLibrary onBookSelect={handleBookSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AlunoLivroWeb.displayName = 'AlunoLivroWeb';

export default AlunoLivroWeb;
