// ============================================
// 📄 MATERIAIS DO ALUNO - Biblioteca de PDFs
// Visual Netflix Ultra Premium + Year 2300
// Tecnologia: PDF.js + Signed URLs + Watermarks
// ============================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Download,
  Eye,
  Shield,
  Sparkles,
  ChevronDown,
  BookOpen,
  Filter,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MaterialViewer } from '@/components/materials/MaterialViewer';

// ============================================
// TIPOS
// ============================================

interface Material {
  id: string;
  title: string;
  description?: string;
  category: string;
  total_pages: number;
  view_count: number;
  download_count: number;
  cover_url?: string | null;
  file_path: string;
  watermark_enabled: boolean;
  is_premium: boolean;
}

// ============================================
// CATEGORIAS
// ============================================

const CATEGORIES = [
  { value: 'apostilas', label: '📚 Apostilas', color: 'from-blue-500 to-cyan-500' },
  { value: 'resumos', label: '📋 Resumos', color: 'from-emerald-500 to-green-500' },
  { value: 'exercicios', label: '✏️ Exercícios', color: 'from-amber-500 to-orange-500' },
  { value: 'simulados', label: '📝 Simulados', color: 'from-purple-500 to-violet-500' },
  { value: 'mapas_mentais', label: '🧠 Mapas Mentais', color: 'from-pink-500 to-rose-500' },
  { value: 'formulas', label: '🔬 Fórmulas', color: 'from-indigo-500 to-blue-500' },
  { value: 'tabelas', label: '📊 Tabelas', color: 'from-teal-500 to-cyan-500' },
  { value: 'revisao', label: '🔄 Revisão', color: 'from-red-500 to-pink-500' },
  { value: 'extras', label: '⭐ Extras', color: 'from-yellow-500 to-amber-500' },
  { value: 'outros', label: '📁 Outros', color: 'from-gray-500 to-slate-500' },
];

// ============================================
// MATERIAL CARD
// ============================================

interface MaterialCardProps {
  material: Material;
  onView: () => void;
}

const MaterialCard = memo(function MaterialCard({ material, onView }: MaterialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm"
        onClick={onView}
      >
        <CardContent className="p-0">
          {/* Cover / Icon */}
          <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <FileText className="w-16 h-16 text-primary/50 group-hover:scale-110 transition-transform" />
            {material.watermark_enabled && (
              <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 gap-1">
                <Shield className="w-3 h-3" />
                Protegido
              </Badge>
            )}
            {material.is_premium && (
              <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 gap-1">
                <Sparkles className="w-3 h-3" />
                Premium
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="p-4 space-y-2">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {material.title}
            </h3>
            {material.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {material.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {material.view_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {material.download_count || 0}
              </span>
              {material.total_pages > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {material.total_pages} págs
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// ============================================
// CATEGORY SECTION
// ============================================

interface CategorySectionProps {
  category: typeof CATEGORIES[0];
  materials: Material[];
  onViewMaterial: (m: Material) => void;
  defaultOpen?: boolean;
}

const CategorySection = memo(function CategorySection({ 
  category, 
  materials, 
  onViewMaterial,
  defaultOpen = false 
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (materials.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.005 }}
          className="w-full"
        >
          <Card className={cn(
            "cursor-pointer overflow-hidden transition-all duration-300",
            isOpen && "ring-2 ring-primary/20"
          )}>
            <div className={cn(
              "h-16 md:h-20 bg-gradient-to-r",
              category.color,
              "flex items-center justify-between px-4 md:px-6"
            )}>
              <div className="flex items-center gap-4">
                <span className="text-2xl md:text-3xl">{category.label.split(' ')[0]}</span>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">
                    {category.label.split(' ').slice(1).join(' ')}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {materials.length} {materials.length === 1 ? 'material' : 'materiais'}
                  </p>
                </div>
              </div>
              <ChevronDown className={cn(
                "w-6 h-6 text-white transition-transform duration-300",
                isOpen && "rotate-180"
              )} />
            </div>
          </Card>
        </motion.div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4"
        >
          {materials.map(material => (
            <MaterialCard
              key={material.id}
              material={material}
              onView={() => onViewMaterial(material)}
            />
          ))}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const AlunoMateriaisPage = memo(function AlunoMateriaisPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);

  // Buscar materiais
  const fetchMaterials = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'ready')
        .order('position', { ascending: true });

      if (error) throw error;
      setMaterials((data as Material[]) || []);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Filtros
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, categoryFilter]);

  // Agrupar por categoria
  const materialsByCategory = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    CATEGORIES.forEach(cat => {
      grouped[cat.value] = filteredMaterials.filter(m => m.category === cat.value);
    });
    return grouped;
  }, [filteredMaterials]);

  // Registrar visualização
  const handleViewMaterial = useCallback(async (material: Material) => {
    setViewingMaterial(material);
    
    // Log de acesso e incrementar view_count
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Log de acesso
      await supabase.from('material_access_logs').insert({
        material_id: material.id,
        user_id: userData.user?.id,
        event_type: 'view',
        user_email: userData.user?.email,
      });

      // Incrementar view_count diretamente
      await supabase
        .from('materials')
        .update({ view_count: (material.view_count || 0) + 1 })
        .eq('id', material.id);
    } catch (e) {
      console.error('Erro ao registrar visualização:', e);
    }
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

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 p-6 md:p-10"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/20">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Materiais PDF</h1>
              <p className="text-muted-foreground">
                Apostilas, resumos e exercícios protegidos
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mt-6">
            <div>
              <p className="text-3xl font-bold text-primary">{materials.length}</p>
              <p className="text-sm text-muted-foreground">Materiais</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-500">
                {CATEGORIES.filter(c => materialsByCategory[c.value]?.length > 0).length}
              </p>
              <p className="text-sm text-muted-foreground">Categorias</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {filteredMaterials.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum material encontrado</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Tente uma busca diferente' : 'Em breve teremos materiais disponíveis'}
            </p>
          </Card>
        ) : (
          CATEGORIES.map((category, index) => (
            <CategorySection
              key={category.value}
              category={category}
              materials={materialsByCategory[category.value]}
              onViewMaterial={handleViewMaterial}
              defaultOpen={index === 0}
            />
          ))
        )}
      </div>

      {/* Material Viewer */}
      <AnimatePresence>
        {viewingMaterial && (
          <MaterialViewer
            material={viewingMaterial}
            onClose={() => setViewingMaterial(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default AlunoMateriaisPage;
