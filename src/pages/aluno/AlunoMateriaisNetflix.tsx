// ============================================
// 📚 ALUNO MATERIAIS — NETFLIX ULTRA PREMIUM 2300
// Year 2300 Cinematic Experience
// 5 Hub Cards Fixos
// Flash Cards integrado
// ============================================

import { memo, useState, useCallback, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { MaterialBooksHub, MATERIAL_BOOKS } from '@/components/materials/MaterialBooksHub';
import { MaterialsFilteredView } from '@/components/materials/MaterialsFilteredView';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { 
  Library, 
  BookOpen,
  Shield,
  Zap,
  FileText,
  ArrowLeft,
  Lightbulb,
  MousePointer,
  Eye,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { CyberBackground } from '@/components/ui/cyber-background';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import '@/styles/dashboard-2300.css';

// Lazy load do sistema de flashcards
const FlashcardsEmbedded = lazy(() => import('@/components/materials/FlashcardsEmbedded'));

// ============================================
// TIPOS
// ============================================

interface ViewState {
  mode: 'hub' | 'filtered' | 'viewer' | 'flashcards';
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
    // FLASH CARDS: Renderiza sistema de flashcards embedido
    if (bookId === 'flash-cards') {
      setViewState({ mode: 'flashcards', bookId, bookName: 'Flash Cards' });
      return;
    }

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

          {/* ══════════════════════════════════════════════════════════════
              INITIAL GUIDANCE - Orientações para Leigos (Year 2300)
          ══════════════════════════════════════════════════════════════ */}
          {viewState.mode === 'hub' && (
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-cyan-950/10 p-5 shadow-xl shadow-primary/5">
              {/* Efeitos holográficos */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary/40 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/40 rounded-tr-xl" />
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Como Usar a Biblioteca de Materiais</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
                </div>
                
                {/* 3 Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-rose-600/5 border border-primary/20 hover:border-primary/40 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/30">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-primary flex items-center gap-2">
                        <MousePointer className="w-4 h-4" />
                        Escolha uma Coleção
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Clique em <span className="text-primary">"Explorar"</span> no card da coleção desejada e selecione a <span className="text-primary">categoria específica</span> do conteúdo.
                      </p>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/5 border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/30">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-cyan-400 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Visualize o Material
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Abra PDFs, imagens ou apostilas direto no <span className="text-cyan-300">leitor integrado</span> com proteção contra pirataria e <span className="text-cyan-300">watermark forense</span>.
                      </p>
                    </div>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="group flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20 hover:border-violet-400/40 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-500/30">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-violet-400 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Use os Flash Cards
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Acesse os <span className="text-violet-300">Flash Cards</span> para memorização com <span className="text-violet-300">repetição espaçada</span> — ideal para fixar fórmulas e conceitos!
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Dica extra */}
                <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-bold text-amber-400">Dica:</span> Os materiais são protegidos com seu nome embutido. Compartilhamento é rastreável e pode resultar em banimento! 🔒
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 📚 CONTENT AREA — SEM ANIMAÇÃO */}
          <div>
            {viewState.mode === 'hub' && (
              <MaterialBooksHub onSelectBook={handleSelectBook} />
            )}

            {viewState.mode === 'flashcards' && (
              <div className="space-y-6">
                {/* Header com botão voltar */}
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={handleBackToHub} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Zap className="w-6 h-6 text-violet-400" />
                      Flash Cards
                    </h2>
                    <p className="text-muted-foreground text-sm">Sistema de memorização com repetição espaçada</p>
                  </div>
                </div>
                
                <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>}>
                  <FlashcardsEmbedded onBack={handleBackToHub} />
                </Suspense>
              </div>
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
