// ============================================
// 📚 ALUNO MATERIAIS — NETFLIX ULTRA PREMIUM
// Year 2300 Cinematic Experience
// FLUXO: Alunos = Estético Premium | Gestão = Minimalista
// ============================================

import { memo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useMaterialsWithProgress } from '@/hooks/useMaterialsWithProgress';
import { MaterialBookLibrary } from '@/components/materials/MaterialBookLibrary';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { 
  Loader2, 
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
import '@/styles/dashboard-2300.css';

const AlunoMateriaisNetflix = memo(function AlunoMateriaisNetflix() {
  const { bookItems, materials, loading, userId, refetch, stats } = useMaterialsWithProgress();
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null);
  const { tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural';

  // Buscar material completo para viewer
  const viewingMaterial = materials.find(m => m.id === viewingMaterialId);

  // Registrar visualização + abrir viewer
  const handleItemSelect = useCallback(async (itemId: string) => {
    const material = materials.find(m => m.id === itemId);
    if (!material) return;

    setViewingMaterialId(itemId);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      await supabase.from('material_access_logs').insert({
        material_id: itemId,
        user_id: userData.user?.id,
        event_type: 'view',
        user_email: userData.user?.email,
      });

      await supabase
        .from('materials')
        .update({ view_count: (material.view_count || 0) + 1 })
        .eq('id', itemId);
    } catch (e) {
      console.error('Erro ao registrar visualização:', e);
    }
  }, [materials]);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        {isHighEnd && <CyberBackground variant="grid" />}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center space-y-6"
        >
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
            {isHighEnd && (
              <div className="absolute inset-0 animate-pulse">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 blur-xl" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-foreground">Carregando Materiais</p>
            <p className="text-sm text-muted-foreground">Preparando sua biblioteca...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Viewer aberto (fullscreen)
  if (viewingMaterial) {
    return (
      <MaterialViewer
        material={{
          id: viewingMaterial.id,
          title: viewingMaterial.title,
          file_path: viewingMaterial.file_path,
          total_pages: viewingMaterial.total_pages,
          watermark_enabled: viewingMaterial.watermark_enabled,
        }}
        onClose={() => setViewingMaterialId(null)}
      />
    );
  }

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
                        Biblioteca completa organizada por área
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-white">{stats.total} materiais</span>
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

          {/* 📚 MATERIAL LIBRARY — Netflix Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <MaterialBookLibrary
              items={bookItems}
              onItemSelect={handleItemSelect}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
});

export default AlunoMateriaisNetflix;
