// ============================================
// 📂 MATERIALS FILTERED VIEW — NETFLIX ULTRA PREMIUM 2300
// Exibe materiais filtrados por Book + Categoria
// Year 2300 Cinematic Experience
// VIRTUALIZAÇÃO ATIVA — Performance para 5000+ usuários
// ============================================

import { memo, useState, useMemo, useCallback, forwardRef, useRef, useEffect } from 'react';
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
  AlertCircle,
  Sparkles,
  Clock,
  FileStack
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

// Configuração de virtualização
const VIRTUALIZATION_THRESHOLD = 12; // Virtualiza apenas se > 12 itens
const CARD_HEIGHT = 340; // Altura aproximada de cada card em px
const CARDS_PER_ROW = { sm: 1, md: 2, lg: 3, xl: 4 };
const OVERSCAN = 2; // Renderiza 2 linhas extras acima/abaixo

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
  filterValue: string;   // macro para questoes-mapas, tag para demais
  filterLabel: string;
  microValue?: string;   // micro para questoes-mapas
  microLabel?: string;
  onBack: () => void;
  onSelectMaterial: (materialId: string) => void;
}

// ============================================
// 🎬 NETFLIX MATERIAL CARD
// ============================================

// Logo para fundo dos cards
import logoMoisesMedeiros from '@/assets/logo-moises-medeiros.png';

const MaterialCard = memo(forwardRef<HTMLDivElement, {
  material: MaterialItem;
  onSelect: (id: string) => void;
  isHighEnd: boolean;
  index: number;
}>(function MaterialCard({ material, onSelect, isHighEnd, index }, ref) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={isHighEnd ? { scale: 1.03, y: -5 } : undefined}
      className="group relative flex flex-col"
    >
      {/* Glow Behind Card */}
      {isHighEnd && (
        <div className="absolute -inset-1 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      )}

      {/* Main Card */}
      <div
        onClick={() => onSelect(material.id)}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-2xl flex-1",
          "bg-gradient-to-br from-[#0a0d12] via-[#0f1419] to-[#151a22]",
          "border-2 border-white/10 hover:border-primary/50",
          "transition-all duration-500",
          "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7)]",
          "hover:shadow-[0_25px_50px_-12px_rgba(229,9,20,0.35)]"
        )}
      >
        {/* Top Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

        {/* Cover with Logo Background — Netflix Style */}
        <div className="relative h-56 md:h-64 bg-gradient-to-br from-primary/10 via-primary/5 to-cyan-500/10 flex items-center justify-center overflow-hidden">
          {/* Logo Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img 
              src={logoMoisesMedeiros} 
              alt=""
              className="w-32 md:w-40 h-auto opacity-[0.60] group-hover:opacity-[0.70] transition-opacity duration-500 drop-shadow-lg"
              loading="lazy"
            />
          </div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(229,9,20,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(229,9,20,0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          {/* Cover Image or Icon */}
          {material.cover_url ? (
            <img 
              src={material.cover_url} 
              alt={material.title}
              className="relative z-10 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <FileText className="relative z-10 w-20 h-20 text-primary/40 group-hover:text-primary/60 transition-colors" />
          )}
          
          {/* Premium badge */}
          {material.is_premium && (
            <div className="absolute top-3 right-3 z-20">
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 text-[10px] font-bold shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                PREMIUM
              </Badge>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d12] via-transparent to-transparent opacity-80" />

          {/* Cinematic Scan Line */}
          {isHighEnd && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden pointer-events-none">
              <div 
                className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent"
                style={{
                  animation: 'material-scan 2s linear infinite',
                  transform: 'translateY(-100%)'
                }}
              />
            </div>
          )}
        </div>

        {/* Stats Bar (above content) */}
        <div className="relative px-4 py-2 flex items-center gap-4 border-t border-white/5 bg-black/30">
          {/* Pages */}
          {material.total_pages > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileStack className="w-3.5 h-3.5 text-primary/70" />
              <span>{material.total_pages} págs</span>
            </div>
          )}
          
          {/* Views */}
          {material.view_count > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="w-3.5 h-3.5 text-cyan-400/70" />
              <span>{material.view_count}</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Open Button */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full",
            "bg-gradient-to-r from-primary/30 to-primary/20",
            "border border-primary/40",
            "group-hover:from-primary/50 group-hover:to-primary/30 transition-all"
          )}>
            <span className="text-xs font-bold text-white">Abrir</span>
          </div>
        </div>

        {/* Bottom Corner Glow */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* 📖 TEXT BELOW CARD — Netflix Style */}
      <div className="mt-3 px-1 space-y-1">
        <h3 className="text-sm md:text-base font-bold text-white line-clamp-2 leading-tight group-hover:text-primary/90 transition-colors">
          {material.title}
        </h3>
        {material.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {material.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}));


// ============================================
// 📊 VIRTUALIZED MATERIAL GRID — Performance
// Renderiza apenas os cards visíveis na viewport
// ============================================

const VirtualizedMaterialGrid = memo(function VirtualizedMaterialGrid({
  materials,
  onSelect,
  isHighEnd
}: {
  materials: MaterialItem[];
  onSelect: (id: string) => void;
  isHighEnd: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [cardsPerRow, setCardsPerRow] = useState(4);

  // Detectar quantidade de colunas baseado na largura
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      if (width < 640) setCardsPerRow(CARDS_PER_ROW.sm);
      else if (width < 1024) setCardsPerRow(CARDS_PER_ROW.md);
      else if (width < 1280) setCardsPerRow(CARDS_PER_ROW.lg);
      else setCardsPerRow(CARDS_PER_ROW.xl);
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // Observer para altura do container
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Se poucos itens, renderiza sem virtualização
  if (materials.length <= VIRTUALIZATION_THRESHOLD) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <AnimatePresence mode="popLayout">
          {materials.map((material, idx) => (
            <MaterialCard
              key={material.id}
              material={material}
              onSelect={onSelect}
              isHighEnd={isHighEnd}
              index={idx}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Cálculos de virtualização
  const totalRows = Math.ceil(materials.length / cardsPerRow);
  const totalHeight = totalRows * CARD_HEIGHT;
  const startRow = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT) - OVERSCAN);
  const endRow = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / CARD_HEIGHT) + OVERSCAN);
  const startIndex = startRow * cardsPerRow;
  const endIndex = Math.min(materials.length, endRow * cardsPerRow);
  const visibleMaterials = materials.slice(startIndex, endIndex);
  const offsetY = startRow * CARD_HEIGHT;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto max-h-[calc(100vh-400px)] min-h-[400px] rounded-xl"
      style={{ contain: 'strict' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 absolute left-0 right-0"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleMaterials.map((material, idx) => (
            <MaterialCard
              key={material.id}
              material={material}
              onSelect={onSelect}
              isHighEnd={isHighEnd}
              index={idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// ============================================
// 📂 MAIN COMPONENT
// ============================================

export const MaterialsFilteredView = memo(function MaterialsFilteredView({
  bookId,
  bookName,
  filterValue,
  filterLabel,
  microValue,
  microLabel,
  onBack,
  onSelectMaterial
}: MaterialsFilteredViewProps) {
  const { tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural';
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar materiais
  // Para 'questoes-mapas', o filtro está em 'macro' (5 macros químicos) + 'micro' opcional
  // Para os demais cards (bancas, extras), o filtro está em 'tags[]'
  const isQuestoesMapas = bookId === 'questoes-mapas';

  const { data: materials, isLoading, error } = useQuery({
    queryKey: ['materials-filtered', bookId, filterValue, microValue],
    queryFn: async () => {
      let query = supabase
        .from('materials')
        .select('*')
        .eq('status', 'ready')
        .eq('category', bookId);

      // Filtrar por macro (questoes-mapas) ou por tags (demais cards)
      if (isQuestoesMapas) {
        query = query.eq('macro', filterValue);
        // Se micro foi fornecido, filtrar também por micro
        if (microValue) {
          query = query.eq('micro', microValue);
        }
      } else {
        query = query.contains('tags', [filterValue]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as MaterialItem[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filtrar por busca local
  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    if (!searchTerm.trim()) return materials;
    
    const term = searchTerm.toLowerCase();
    return materials.filter(m => 
      m.title.toLowerCase().includes(term) ||
      m.description?.toLowerCase().includes(term)
    );
  }, [materials, searchTerm]);

  // Label para exibir no header (inclui micro se presente)
  const displayLabel = useMemo(() => {
    const microPart = (microLabel || microValue) ? (microLabel || microValue) : '';
    return microPart ? `${filterLabel} → ${microPart}` : filterLabel;
  }, [filterLabel, microLabel, microValue]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      {/* 🎬 HEADER */}
      <div className={cn(
        "relative rounded-2xl overflow-hidden p-6",
        "bg-gradient-to-br from-[#0a0d12] via-[#0f1419] to-[#151a22]",
        "border border-primary/20"
      )}>
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        {/* Background Orb */}
        {isHighEnd && (
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />
        )}

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBack}
              className={cn(
                "rounded-xl h-12 w-12",
                "bg-white/5 border border-white/10",
                "hover:bg-white/10 hover:border-white/20 hover:scale-105",
                "transition-all duration-300"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* Icon + Labels */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-4 rounded-xl",
                "bg-gradient-to-br from-primary/20 to-primary/5",
                "border border-primary/30"
              )}>
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-bold text-white">{displayLabel}</h2>
                  <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                    {bookName}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  {isLoading ? 'Carregando...' : `${filteredMaterials.length} material(is) encontrado(s)`}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-11 h-11",
                "bg-white/5 border-white/10",
                "focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
                "rounded-xl"
              )}
            />
          </div>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-primary/30 rounded-tl" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-primary/30 rounded-br" />
      </div>

      {/* 📚 CONTENT */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            {isHighEnd && (
              <div className="absolute inset-0 w-12 h-12 bg-primary/30 rounded-full blur-xl animate-pulse" />
            )}
          </div>
          <p className="text-muted-foreground mt-4">Carregando materiais...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive font-medium">Erro ao carregar materiais</p>
          <p className="text-muted-foreground text-sm mt-1">Tente novamente mais tarde</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-col items-center justify-center py-20 rounded-2xl",
            "bg-gradient-to-br from-[#0a0d12] to-[#151a22]",
            "border border-white/10"
          )}
        >
          <div className="relative">
            <FileText className="w-20 h-20 text-muted-foreground/20" />
            {isHighEnd && (
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
            )}
          </div>
          <h3 className="text-xl font-bold text-white mt-6">Nenhum material encontrado</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-md">
            {searchTerm 
              ? `Nenhum resultado para "${searchTerm}"`
              : 'Os materiais desta categoria ainda não foram publicados'
            }
          </p>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="mt-6 border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às categorias
          </Button>
        </motion.div>
      ) : (
        <VirtualizedMaterialGrid
          materials={filteredMaterials}
          onSelect={onSelectMaterial}
          isHighEnd={isHighEnd}
        />
      )}

      {/* Keyframes for Netflix-style scan animation */}
      <style>{`
        @keyframes material-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(500%); }
        }
      `}</style>
    </motion.div>
  );
});

export default MaterialsFilteredView;
