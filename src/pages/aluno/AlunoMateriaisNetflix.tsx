// ============================================
// 📚 ALUNO MATERIAIS — 5 BOOKS FIXOS
// Year 2300 Cinematic Experience
// ============================================

import { memo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MaterialBooksHub, MATERIAL_BOOKS } from '@/components/materials/MaterialBooksHub';
import { MaterialsFilteredView } from '@/components/materials/MaterialsFilteredView';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { 
  Library, 
  Sparkles,
  BookOpen,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { CyberBackground } from '@/components/ui/cyber-background';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import '@/styles/dashboard-2300.css';

// ============================================
// TIPOS
// ============================================

interface ViewState {
  mode: 'hub' | 'filtered' | 'viewer';
  bookId?: string;
  bookName?: string;
  filterValue?: string;
  filterLabel?: string;
  materialId?: string;
}

// ============================================
// 📚 MAIN PAGE
// ============================================

const AlunoMateriaisNetflix = memo(function AlunoMateriaisNetflix() {
  const { tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural';
  
  const [viewState, setViewState] = useState<ViewState>({ mode: 'hub' });

  // Buscar material para viewer
  const { data: viewingMaterial } = useQuery({
    queryKey: ['material', viewState.materialId],
    queryFn: async () => {
      if (!viewState.materialId) return null;
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', viewState.materialId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!viewState.materialId && viewState.mode === 'viewer',
  });

  // Quando seleciona um Book e um filtro
  const handleSelectBook = useCallback((bookId: string, filter?: string) => {
    if (!filter) return;
    
    const book = MATERIAL_BOOKS.find(b => b.id === bookId);
    const filterObj = book?.filters.find(f => f.value === filter);
    
    setViewState({
      mode: 'filtered',
      bookId,
      bookName: book?.name || bookId,
      filterValue: filter,
      filterLabel: filterObj?.label || filter,
    });
  }, []);

  // Quando seleciona um material para visualizar
  const handleSelectMaterial = useCallback(async (materialId: string) => {
    setViewState(prev => ({
      ...prev,
      mode: 'viewer',
      materialId,
    }));

    // Log de acesso
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('material_access_logs').insert({
        material_id: materialId,
        user_id: userData.user?.id,
        event_type: 'view',
        user_email: userData.user?.email,
      });
    } catch (e) {
      console.error('Erro ao registrar visualização:', e);
    }
  }, []);

  // Voltar para lista filtrada
  const handleBackToFiltered = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      mode: 'filtered',
      materialId: undefined,
    }));
  }, []);

  // Voltar para hub
  const handleBackToHub = useCallback(() => {
    setViewState({ mode: 'hub' });
  }, []);

  // ============================================
  // RENDER: VIEWER
  // ============================================
  if (viewState.mode === 'viewer' && viewingMaterial) {
    return (
      <MaterialViewer
        material={{
          id: viewingMaterial.id,
          title: viewingMaterial.title,
          file_path: viewingMaterial.file_path,
          total_pages: viewingMaterial.total_pages,
          watermark_enabled: viewingMaterial.watermark_enabled,
        }}
        onClose={handleBackToFiltered}
      />
    );
  }

  // ============================================
  // RENDER: MAIN PAGE
  // ============================================
  return (
    <>
      <Helmet>
        <title>Materiais de Estudo | Portal do Aluno</title>
      </Helmet>

      <div className="relative min-h-screen">
        {/* 🌌 CYBER BACKGROUND */}
        {isHighEnd && <CyberBackground variant="grid" />}
        
        <div className="relative z-10 container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          
          {/* 🎬 HERO HEADER — Year 2300 Cinematic */}
          {viewState.mode === 'hub' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className={cn(
                "relative rounded-3xl overflow-hidden p-8 md:p-12",
                "bg-gradient-to-br from-[#0d1218] via-[#121922] to-[#1a1020]",
                "border border-white/10",
                isHighEnd && "shadow-[0_0_60px_-15px_rgba(229,9,20,0.3)]"
              )}>
                {/* Background effects */}
                {isHighEnd && (
                  <>
                    <div className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(229, 9, 20, 0.15) 0%, transparent 50%),
                                          radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)`
                      }}
                    />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
                  </>
                )}
                
                {/* Content */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-2xl",
                        "bg-gradient-to-br from-primary/30 to-primary/10",
                        "border border-primary/20"
                      )}>
                        <Library className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                          Materiais de Estudo
                        </h1>
                        <p className="text-muted-foreground">
                          Biblioteca completa organizada por categoria
                        </p>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-white">5 coleções</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-white">Protegido com Watermark</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium text-white">Acesso Premium</span>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Element */}
                  {isHighEnd && (
                    <div className="hidden lg:block relative w-32 h-32">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 animate-pulse" />
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#0d1218] to-[#1a1020] flex items-center justify-center">
                        <Library className="w-12 h-12 text-primary/60" />
                      </div>
                      {/* Orbital ring */}
                      <div className="absolute inset-0 rounded-full border border-primary/20 animate-spin" style={{ animationDuration: '20s' }} />
                      <div className="absolute inset-[-4px] rounded-full border border-cyan-500/10 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
                    </div>
                  )}
                </div>

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-3xl" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-500/30 rounded-br-3xl" />
              </div>
            </motion.div>
          )}

          {/* 📚 CONTENT AREA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {viewState.mode === 'hub' && (
              <MaterialBooksHub onSelectBook={handleSelectBook} />
            )}

            {viewState.mode === 'filtered' && viewState.bookId && viewState.filterValue && (
              <MaterialsFilteredView
                bookId={viewState.bookId}
                bookName={viewState.bookName || ''}
                filterValue={viewState.filterValue}
                filterLabel={viewState.filterLabel || ''}
                onBack={handleBackToHub}
                onSelectMaterial={handleSelectMaterial}
              />
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
});

export default AlunoMateriaisNetflix;
