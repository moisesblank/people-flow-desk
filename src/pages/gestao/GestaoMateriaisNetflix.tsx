// ============================================
// 📚 GESTÃO MATERIAIS — MINIMALISTA + NETFLIX
// Combina: Lista de gestão + Preview Netflix
// Year 2300 Cinematic Experience
// ============================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Plus, 
  Upload, 
  Loader2,
  Eye,
  LayoutGrid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMaterialsWithProgress } from '@/hooks/useMaterialsWithProgress';
import { MaterialBookLibrary } from '@/components/materials/MaterialBookLibrary';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Import do UploadDialog do GestaoMateriais original (será lazy loaded)
import GestaoMateriais from './GestaoMateriais';

const GestaoMateriaisNetflix = memo(function GestaoMateriaisNetflix() {
  const { bookItems, materials, loading, stats, refetch } = useMaterialsWithProgress();
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'netflix' | 'table'>('netflix');

  // Buscar material completo para viewer
  const viewingMaterial = materials.find(m => m.id === viewingMaterialId);

  // Abrir viewer
  const handleItemSelect = useCallback((itemId: string) => {
    setViewingMaterialId(itemId);
  }, []);

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
        <title>Gestão de Materiais | Gestão</title>
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header com Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Materiais</h1>
            <p className="text-muted-foreground">
              {stats.total} materiais cadastrados
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={viewMode === 'netflix' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('netflix')}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Netflix
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                Tabela
              </Button>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'netflix' ? (
          <MaterialBookLibrary
            items={bookItems}
            onItemSelect={handleItemSelect}
          />
        ) : (
          // Renderiza componente original de tabela
          <GestaoMateriais />
        )}
      </div>
    </>
  );
});

export default GestaoMateriaisNetflix;
