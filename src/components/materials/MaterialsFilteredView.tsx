// ============================================
// 📂 MATERIALS FILTERED VIEW
// Exibe materiais filtrados por Book + Categoria
// Year 2300 Cinematic Experience
// ============================================

import { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Download,
  Eye,
  Search,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import '@/styles/dashboard-2300.css';

// ============================================
// TIPOS
// ============================================

interface MaterialItem {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  total_pages: number;
  view_count: number;
  download_count: number;
  cover_url?: string;
  watermark_enabled: boolean;
  is_premium: boolean;
  created_at: string;
}

interface MaterialsFilteredViewProps {
  bookId: string;
  bookName: string;
  filterValue: string;
  filterLabel: string;
  onBack: () => void;
  onSelectMaterial: (materialId: string) => void;
}

// ============================================
// MATERIAL CARD
// ============================================

const MaterialCard = memo(function MaterialCard({
  material,
  onSelect,
  isHighEnd
}: {
  material: MaterialItem;
  onSelect: (id: string) => void;
  isHighEnd: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isHighEnd ? 1.02 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={() => onSelect(material.id)}
        className={cn(
          "cursor-pointer overflow-hidden",
          "bg-gradient-to-br from-[#0d1218] via-[#121922] to-[#1a1020]",
          "border border-white/10 hover:border-primary/30",
          "transition-all duration-300",
          isHighEnd && "hover:shadow-[0_0_30px_-10px_rgba(229,9,20,0.3)]"
        )}
      >
        {/* Cover / Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-primary/10 to-cyan-500/10 flex items-center justify-center">
          {material.cover_url ? (
            <img 
              src={material.cover_url} 
              alt={material.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileText className="w-16 h-16 text-primary/30" />
          )}
          
          {/* Premium badge */}
          {material.is_premium && (
            <Badge className="absolute top-2 right-2 bg-amber-500/80 text-white">
              Premium
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold text-white line-clamp-2">{material.title}</h3>
          
          {material.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {material.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{material.total_pages || '?'} págs</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{material.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{material.download_count || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// ============================================
// 📂 MAIN VIEW
// ============================================

export const MaterialsFilteredView = memo(function MaterialsFilteredView({
  bookId,
  bookName,
  filterValue,
  filterLabel,
  onBack,
  onSelectMaterial
}: MaterialsFilteredViewProps) {
  const { tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural';
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar materiais filtrados
  const { data: materials = [], isLoading, error } = useQuery({
    queryKey: ['materials', bookId, filterValue],
    queryFn: async () => {
      // Mapeamento de book_id para campo de filtro
      let query = supabase
        .from('materials')
        .select('*')
        .eq('status', 'ready')
        .order('position', { ascending: true });

      // Aplicar filtro baseado no book e categoria
      // category do material = bookId (ex: 'questoes-mapas')
      // macro/micro = filterValue (ex: 'quimica_geral' ou 'fuvest')
      query = query
        .eq('category', bookId)
        .eq('macro', filterValue);

      const { data, error } = await query;
      if (error) throw error;
      return data as MaterialItem[];
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // Filtrar por busca local
  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return materials;
    const term = searchTerm.toLowerCase();
    return materials.filter(m => 
      m.title.toLowerCase().includes(term) ||
      m.description?.toLowerCase().includes(term)
    );
  }, [materials, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack}
          className="rounded-full border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">{filterLabel}</h2>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {bookName}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materiais'} disponíveis
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar material..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 focus:border-primary/50"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20 p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>Erro ao carregar materiais</p>
          </div>
        </Card>
      )}

      {/* Materials Grid */}
      {!isLoading && !error && (
        <AnimatePresence>
          {filteredMaterials.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {filteredMaterials.map((material, idx) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <MaterialCard
                    material={material}
                    onSelect={onSelectMaterial}
                    isHighEnd={isHighEnd}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="bg-gradient-to-br from-[#0d1218] to-[#1a1020] border border-white/10 p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Nenhum material encontrado
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Tente uma busca diferente' 
                  : 'Os materiais serão adicionados em breve pela gestão'}
              </p>
            </Card>
          )}
        </AnimatePresence>
      )}
    </div>
  );
});

export default MaterialsFilteredView;
