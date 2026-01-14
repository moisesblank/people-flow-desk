// ============================================
// 📄 MATERIAIS DO ALUNO - Biblioteca de PDFs
// Visual Netflix Ultra Premium + Year 2300
// Organização: CONTEUDISTA → 5 MACROS → MICROS
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
  Loader2,
  Brain,
  HelpCircle,
  Atom,
  FlaskConical,
  Beaker,
  Leaf,
  Dna,
  FolderOpen
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';

// ============================================
// TIPOS
// ============================================

interface Material {
  id: string;
  title: string;
  description?: string;
  category: string;
  content_type: string;
  macro?: string;
  micro?: string;
  total_pages: number;
  view_count: number;
  download_count: number;
  cover_url?: string | null;
  file_path: string;
  watermark_enabled: boolean;
  is_premium: boolean;
}

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONTENT_TYPES = [
  { value: 'mapa_mental', label: '🧠 Mapas Mentais', icon: Brain, color: 'from-pink-500 to-rose-500' },
  { value: 'questoes', label: '❓ Questões', icon: HelpCircle, color: 'from-blue-500 to-cyan-500' },
  { value: 'resumo', label: '📋 Resumos', icon: FileText, color: 'from-emerald-500 to-green-500' },
  { value: 'formula', label: '🔬 Fórmulas', icon: FlaskConical, color: 'from-purple-500 to-violet-500' },
  { value: 'tabela', label: '📊 Tabelas', icon: FileText, color: 'from-amber-500 to-orange-500' },
  { value: 'outros', label: '📁 Outros', icon: FolderOpen, color: 'from-gray-500 to-slate-500' },
];

// ============================================
// 🏛️ MACRO CONFIG — IMPORTADO DA FONTE ÚNICA DE VERDADE
// Constituição SYNAPSE Ω v10.4 — NOMES VÊM DO BANCO, VISUAIS VÊM DAQUI
// ============================================
import { getMacroVisual, MACRO_VISUAL_CONFIG } from '@/lib/taxonomy/macroVisualConfig';

// Mapeamento VALUE → LABEL para lookup (materiais armazenam value como slug)
const MACRO_VALUE_TO_LABEL: Record<string, string> = {
  'quimica_geral': 'Química Geral',
  'fisico_quimica': 'Físico-Química',
  'quimica_organica': 'Química Orgânica',
  'quimica_ambiental': 'Química Ambiental',
  'bioquimica': 'Bioquímica',
};

/**
 * Obtém configuração visual de um macro (por value/slug ou label)
 */
function getMacroConfig(macroKey: string | undefined) {
  if (!macroKey) return { visual: getMacroVisual(null), label: 'Química' };
  const label = MACRO_VALUE_TO_LABEL[macroKey] || macroKey;
  return { visual: getMacroVisual(label), label };
}

// ============================================
// MATERIAL CARD (Netflix Style)
// ============================================

interface MaterialCardProps {
  material: Material;
  onView: () => void;
}

const MaterialCard = memo(function MaterialCard({ material, onView }: MaterialCardProps) {
  const { visual, label } = getMacroConfig(material.macro);
  const MacroIcon = visual.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm hover:ring-2 hover:ring-primary/30"
        onClick={onView}
      >
        <CardContent className="p-0">
          {/* Cover / Gradient Header */}
          <div className={cn(
            "relative h-28 bg-gradient-to-br flex items-center justify-center",
            macroConfig?.gradient || 'from-primary/20 to-primary/5'
          )}>
            <MacroIcon className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform" />
            
            {/* Badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {material.watermark_enabled && (
                <Badge className="bg-black/50 text-white border-0 text-xs gap-1">
                  <Shield className="w-3 h-3" />
                </Badge>
              )}
              {material.is_premium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                </Badge>
              )}
            </div>

            {/* Content Type Badge */}
            <Badge className="absolute bottom-2 left-2 bg-black/60 text-white border-0 text-xs">
              {material.content_type === 'mapa_mental' ? '🧠 Mapa Mental' : 
               material.content_type === 'questoes' ? '❓ Questões' : 
               material.content_type}
            </Badge>
          </div>

          {/* Info */}
          <div className="p-4 space-y-2">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors text-sm">
              {material.title}
            </h3>
            {material.micro && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {material.micro}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {material.view_count || 0}
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
// MACRO SECTION (Collapsible Netflix Style)
// ============================================

interface MacroSectionProps {
  macroValue: string;
  materials: Material[];
  onViewMaterial: (m: Material) => void;
  defaultOpen?: boolean;
}

const MacroSection = memo(function MacroSection({ 
  macroValue, 
  materials, 
  onViewMaterial,
  defaultOpen = false 
}: MacroSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { visual, label } = getMacroConfig(macroValue);
  const Icon = visual.icon;

  if (materials.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.005 }}
          className="w-full"
        >
          <Card className={cn(
            "cursor-pointer overflow-hidden transition-all duration-300 border-0",
            isOpen && "ring-2 ring-primary/20"
          )}>
            <div className={cn(
              "h-20 md:h-24 bg-gradient-to-r",
              config.gradient,
              "flex items-center justify-between px-4 md:px-6"
            )}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    {config.label}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {materials.length} {materials.length === 1 ? 'material' : 'materiais'} disponíveis
                  </p>
                </div>
              </div>
              <ChevronDown className={cn(
                "w-8 h-8 text-white/80 transition-transform duration-300",
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
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-4"
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
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [macroFilter, setMacroFilter] = useState<string>('all');
  const [microFilter, setMicroFilter] = useState<string>('all');
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);

  const { macros, getMicrosForSelect } = useTaxonomyForSelects();
  const microsForFilter = macroFilter && macroFilter !== 'all' ? getMicrosForSelect(macroFilter) : [];

  // Reset micro filter when macro changes
  const handleMacroFilterChange = (value: string) => {
    setMacroFilter(value);
    setMicroFilter('all');
  };

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

    const channel = supabase
      .channel('materials_aluno_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        fetchMaterials();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMaterials]);

  // Filtros
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.micro?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesContentType = contentTypeFilter === 'all' || m.content_type === contentTypeFilter;
      const matchesMacro = macroFilter === 'all' || m.macro === macroFilter;
      const matchesMicro = microFilter === 'all' || m.micro === microFilter;
      return matchesSearch && matchesContentType && matchesMacro && matchesMicro;
    });
  }, [materials, searchQuery, contentTypeFilter, macroFilter, microFilter]);

  // Agrupar por MACRO
  const materialsByMacro = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    Object.keys(MACRO_VALUE_TO_LABEL).forEach(macroKey => {
      grouped[macroKey] = filteredMaterials.filter(m => m.macro === macroKey);
    });
    return grouped;
  }, [filteredMaterials]);

  // Registrar visualização
  const handleViewMaterial = useCallback(async (material: Material) => {
    setViewingMaterial(material);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      await supabase.from('material_access_logs').insert({
        material_id: material.id,
        user_id: userData.user?.id,
        event_type: 'view',
        user_email: userData.user?.email,
      });

      await supabase
        .from('materials')
        .update({ view_count: (material.view_count || 0) + 1 })
        .eq('id', material.id);
    } catch (e) {
      console.error('Erro ao registrar visualização:', e);
    }
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: materials.length,
    mapas: materials.filter(m => m.content_type === 'mapa_mental').length,
    questoes: materials.filter(m => m.content_type === 'questoes').length,
    macrosAtivos: Object.values(materialsByMacro).filter(arr => arr.length > 0).length,
  }), [materials, materialsByMacro]);

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
              <h1 className="text-2xl md:text-3xl font-bold">Materiais de Estudo</h1>
              <p className="text-muted-foreground">
                Mapas mentais, questões e materiais organizados por área
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Materiais</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pink-500">{stats.mapas}</p>
              <p className="text-sm text-muted-foreground">Mapas Mentais</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-500">{stats.questoes}</p>
              <p className="text-sm text-muted-foreground">Questões</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-500">{stats.macrosAtivos}</p>
              <p className="text-sm text-muted-foreground">Áreas</p>
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
        <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {CONTENT_TYPES.map(ct => (
              <SelectItem key={ct.value} value={ct.value}>
                {ct.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={macroFilter} onValueChange={handleMacroFilterChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Macro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Macros</SelectItem>
            {macros.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={microFilter} 
          onValueChange={setMicroFilter}
          disabled={macroFilter === 'all'}
        >
          <SelectTrigger className={cn(
            "w-full sm:w-44",
            macroFilter === 'all' && "opacity-50"
          )}>
            <SelectValue placeholder="Micro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Micros</SelectItem>
            {microsForFilter.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista por MACRO (5 Áreas) */}
      <div className="space-y-4">
        {filteredMaterials.length === 0 ? (
          <Card className="p-12 text-center border-0 bg-card/50">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum material encontrado</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Tente uma busca diferente' : 'Em breve teremos materiais disponíveis'}
            </p>
          </Card>
        ) : (
          Object.keys(MACRO_VALUE_TO_LABEL).map((macroKey, index) => (
            <MacroSection
              key={macroKey}
              macroValue={macroKey}
              materials={materialsByMacro[macroKey] || []}
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
