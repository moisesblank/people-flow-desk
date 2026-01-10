// ============================================
// 📚 ALUNO MATERIAIS — NETFLIX ULTRA PREMIUM
// Year 2300 Cinematic Experience
// Usa MaterialBookLibrary duplicado de Web-Books
// ============================================

import { memo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useMaterialsWithProgress } from '@/hooks/useMaterialsWithProgress';
import { MaterialBookLibrary } from '@/components/materials/MaterialBookLibrary';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AlunoMateriaisNetflix = memo(function AlunoMateriaisNetflix() {
  const { bookItems, materials, loading, userId, refetch } = useMaterialsWithProgress();
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null);

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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando materiais...</p>
        </div>
      </div>
    );
  }

  // Viewer aberto
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

      <div className="container mx-auto p-4 md:p-6">
        <MaterialBookLibrary
          items={bookItems}
          onItemSelect={handleItemSelect}
        />
      </div>
    </>
  );
});

export default AlunoMateriaisNetflix;
