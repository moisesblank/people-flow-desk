// ============================================
// 📚 MATERIAL BOOK LIBRARY — NETFLIX ULTRA PREMIUM
// YEAR 2300 CINEMATIC EXPERIENCE
// ⚡ Estrutura duplicada de WebBookLibrary.tsx
// 🎯 SHELL ESTRUTURAL: Receberá PDFs posteriormente
// ============================================

import { memo, useMemo } from 'react';
import { 
  Library,
  Flame,
  Target,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { CyberBackground } from '@/components/ui/cyber-background';
import { MaterialBookSection } from './MaterialBookSection';
import { MaterialBookItem } from './MaterialBookCard';
import '@/styles/dashboard-2300.css';

// ============================================
// ORDEM CANÔNICA DAS 5 CATEGORIAS
// ============================================

const CATEGORY_ORDER = [
  'quimica_geral',
  'quimica_organica', 
  'fisico_quimica',
  'quimica_ambiental',
  'bioquimica'
];

// ============================================
// TIPOS
// ============================================

interface MaterialBookLibraryProps {
  items: MaterialBookItem[];
  onItemSelect: (itemId: string) => void;
  className?: string;
}

// ============================================
// 📚 LIBRARY PRINCIPAL
// ============================================

export const MaterialBookLibrary = memo(function MaterialBookLibrary({
  items,
  onItemSelect,
  className
}: MaterialBookLibraryProps) {
  const { tier, isLowEnd } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural';

  // Agrupar por categoria
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, MaterialBookItem[]> = {};
    CATEGORY_ORDER.forEach(cat => {
      grouped[cat] = items.filter(item => item.category === cat);
    });
    return grouped;
  }, [items]);

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    completed: items.filter(i => i.progress?.isCompleted).length,
    inProgress: items.filter(i => (i.progress?.progressPercent || 0) > 0 && !i.progress?.isCompleted).length,
    totalPages: items.reduce((sum, i) => sum + (i.totalPages || 0), 0),
  }), [items]);

  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* 🌌 CYBER BACKGROUND — Year 2300 */}
      {isHighEnd && <CyberBackground variant="grid" />}

      <div className="relative z-10 space-y-8">
        {/* 📊 STATS HEADER — HUD Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#0d1218] to-[#1a1020] border border-white/10 overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Library className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.total}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Materiais</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0d1218] to-[#1a1020] border border-white/10 overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.completed}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Concluídos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0d1218] to-[#1a1020] border border-white/10 overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.inProgress}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Em Progresso</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0d1218] to-[#1a1020] border border-white/10 overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.totalPages}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Páginas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📂 SECTIONS POR CATEGORIA */}
        <div className="space-y-6">
          {CATEGORY_ORDER.map((categoryKey, idx) => (
            <MaterialBookSection
              key={categoryKey}
              categoryKey={categoryKey}
              items={itemsByCategory[categoryKey]}
              onItemSelect={onItemSelect}
              defaultOpen={idx === 0} // Primeira categoria aberta por padrão
            />
          ))}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <Card className="bg-gradient-to-br from-[#0d1218] to-[#1a1020] border border-white/10 p-12 text-center">
            <Library className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum material disponível</h3>
            <p className="text-muted-foreground">Os materiais serão exibidos aqui quando cadastrados.</p>
          </Card>
        )}
      </div>
    </div>
  );
});

export default MaterialBookLibrary;
