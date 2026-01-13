// ============================================
// 📚 ALUNO MATERIAIS — NETFLIX ULTRA PREMIUM 2300
// Year 2300 Cinematic Experience
// 5 Hub Cards Fixos
// ============================================

import { memo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
// ANIMAÇÕES REMOVIDAS: motion não mais usado
// import { motion } from 'framer-motion';
import { MaterialBooksHub, MATERIAL_BOOKS } from '@/components/materials/MaterialBooksHub';
import { MaterialsFilteredView } from '@/components/materials/MaterialsFilteredView';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { 
  Library, 
  Sparkles,
  BookOpen,
  Shield,
  Zap,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
  filterValue?: string;  // macro para questoes-mapas, tag para demais
  filterLabel?: string;
  microValue?: string;   // micro para questoes-mapas
  microLabel?: string;
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

  // Quando seleciona um Book e um filtro (com micro opcional para questoes-mapas)
  const handleSelectBook = useCallback((
    bookId: string,
    filter?: string,
    microValue?: string,
    microLabel?: string
  ) => {
    if (!filter) return;

    const book = MATERIAL_BOOKS.find(b => b.id === bookId);
    const filterObj = book?.filters.find(f => f.value === filter);

    setViewState({
      mode: 'filtered',
      bookId,
      bookName: book?.name || bookId,
      filterValue: filter,
      filterLabel: filterObj?.label || filter,
      microValue,
      microLabel,
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
          file_name: viewingMaterial.file_name,
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

      <div className="relative min-h-screen bg-[#030508]">
        {/* 🌌 CYBER BACKGROUND */}
        {isHighEnd && <CyberBackground variant="grid" />}
        
        <div className="relative z-10 container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          
          {/* 🎬 HERO HEADER — Netflix Ultra Premium 2300 — SEM ANIMAÇÃO */}
          {viewState.mode === 'hub' && (
            <div className="relative">
              <div className={cn(
                "relative rounded-3xl overflow-hidden",
                "bg-gradient-to-br from-[#0a0d12] via-[#0f1419] to-[#151a22]",
                "border border-primary/20"
              )}
                style={isHighEnd ? {
                  boxShadow: '0 0 80px -20px rgba(229, 9, 20, 0.25), 0 0 40px -20px rgba(6, 182, 212, 0.15)'
                } : undefined}
              >
                {/* Top Gradient Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                
                {/* Background Orbs — ESTÁTICOS */}
                {isHighEnd && (
                  <>
                    <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px]" />
                    
                    {/* Scan Line REMOVIDA */}
                  </>
                )}
                
                {/* Content */}
                <div className="relative p-8 md:p-12">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    {/* Left Side: Icon + Title + Description */}
                    <div className="flex items-start gap-5">
                      {/* Icon Container */}
                      <div className={cn(
                        "relative p-5 rounded-2xl",
                        "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5",
                        "border border-primary/30"
                      )}>
                        {isHighEnd && (
                          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-50" />
                        )}
                        <Library className="relative w-10 h-10 text-primary" />
                      </div>

                      {/* Title + Description */}
                      <div className="space-y-3">
                        <div>
                          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                            Materiais de Estudo
                          </h1>
                          <p className="text-muted-foreground text-lg mt-1">
                            Biblioteca completa organizada por categoria
                          </p>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl",
                            "bg-white/5 border border-white/10",
                            "hover:bg-white/10 transition-colors"
                          )}>
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-white">5 coleções</span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl",
                            "bg-white/5 border border-white/10",
                            "hover:bg-white/10 transition-colors"
                          )}>
                            <Shield className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-white">Watermark Forense</span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl",
                            "bg-white/5 border border-white/10",
                            "hover:bg-white/10 transition-colors"
                          )}>
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium text-white">Premium</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Decorative Element — ESTÁTICO (SEM ANIMAÇÕES ORBITAIS) */}
                    {isHighEnd && (
                      <div className="hidden xl:block relative w-40 h-40">
                        {/* Outer Glow */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 blur-xl" />
                        
                        {/* Main Circle */}
                        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#0a0d12] to-[#151a22] border border-white/10 flex items-center justify-center">
                          <FileText className="w-14 h-14 text-primary/40" />
                        </div>
                        
                        {/* Orbital Rings — ESTÁTICOS (SEM ANIMAÇÃO) */}
                        <div className="absolute inset-0 rounded-full border border-primary/20" />
                        <div className="absolute -inset-2 rounded-full border border-cyan-500/10" />
                        <div className="absolute -inset-4 rounded-full border border-primary/5" />
                        
                        {/* Orbiting Dots — ESTÁTICOS */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/40 rounded-tl-xl" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-500/30 rounded-tr-xl" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-xl" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/40 rounded-br-xl" />
              </div>
            </div>
          )}

          {/* 📚 CONTENT AREA — SEM ANIMAÇÃO */}
          <div>
            {viewState.mode === 'hub' && (
              <MaterialBooksHub onSelectBook={handleSelectBook} />
            )}

            {viewState.mode === 'filtered' && viewState.bookId && viewState.filterValue && (
              <MaterialsFilteredView
                bookId={viewState.bookId}
                bookName={viewState.bookName || ''}
                filterValue={viewState.filterValue}
                filterLabel={viewState.filterLabel || ''}
                microValue={viewState.microValue}
                microLabel={viewState.microLabel}
                onBack={handleBackToHub}
                onSelectMaterial={handleSelectMaterial}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default AlunoMateriaisNetflix;
