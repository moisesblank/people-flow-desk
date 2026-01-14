// ============================================
// 📂 MATERIAL BOOK SECTION — NETFLIX STYLE COLLAPSIBLE
// YEAR 2300 CINEMATIC EXPERIENCE
// ⚡ Estrutura duplicada de WebBookLibrary.tsx
// 🎯 SHELL ESTRUTURAL: Receberá PDFs posteriormente
// ============================================

import { memo, useState, forwardRef } from 'react';
import { 
  ChevronDown,
  Flame,
  GraduationCap,
  Atom,
  FlaskConical,
  Beaker,
  Leaf,
  Dna
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { MaterialBookCard, MaterialBookItem } from './MaterialBookCard';

// ============================================
// 🏛️ CONFIGURAÇÃO DAS 5 CATEGORIAS — FONTE ÚNICA DE VERDADE
// Constituição SYNAPSE Ω v10.4 — NOMES DO BANCO, VISUAIS CENTRALIZADOS
// ============================================
import { getMacroVisual, type MacroVisualConfig } from '@/lib/taxonomy/macroVisualConfig';

type CategoryConfig = {
  icon: React.ElementType;
  gradient: string;
  accentColor: string;
  label: string;
  description: string;
};

// Mapeamento VALUE → LABEL para lookup
const MACRO_VALUE_TO_LABEL: Record<string, string> = {
  'quimica_geral': 'Química Geral',
  'fisico_quimica': 'Físico-Química',
  'quimica_organica': 'Química Orgânica',
  'quimica_ambiental': 'Química Ambiental',
  'bioquimica': 'Bioquímica',
};

// Descrições fixas por categoria (não são taxonomia, são UI)
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Química Geral': 'Fundamentos e conceitos essenciais',
  'Química Orgânica': 'Compostos e reações orgânicas',
  'Físico-Química': 'Termodinâmica e cinética',
  'Química Ambiental': 'Meio ambiente e sustentabilidade',
  'Bioquímica': 'Processos biológicos moleculares',
};

// Cores hex para accentColor (usado em efeitos visuais)
const MACRO_HEX_COLORS: Record<string, string> = {
  'Química Geral': '#F59E0B',
  'Físico-Química': '#06B6D4',
  'Química Orgânica': '#A855F7',
  'Química Ambiental': '#10B981',
  'Bioquímica': '#EC4899',
};

/**
 * Obtém configuração completa de uma categoria
 */
function getCategoryConfig(categoryKey: string): CategoryConfig {
  const label = MACRO_VALUE_TO_LABEL[categoryKey] || categoryKey;
  const visual = getMacroVisual(label);
  // Expande gradient para 3-stop (Netflix style)
  const baseGradient = visual.gradient;
  const expandedGradient = baseGradient.includes('via-') 
    ? baseGradient 
    : baseGradient.replace(' to-', ' via-').replace(/to-(\w+)-(\d+)$/, 'via-$1-$2 to-$1-600');
  
  return {
    icon: visual.icon,
    gradient: expandedGradient,
    accentColor: MACRO_HEX_COLORS[label] || '#888888',
    label,
    description: CATEGORY_DESCRIPTIONS[label] || 'Conteúdo de química',
  };
}

// ============================================
// TIPOS
// ============================================

interface MaterialBookSectionProps {
  categoryKey: string;
  items: MaterialBookItem[];
  onItemSelect: (itemId: string) => void;
  defaultOpen?: boolean;
}

// ============================================
// 📂 MATERIAL BOOK SECTION
// ============================================

export const MaterialBookSection = memo(forwardRef<HTMLDivElement, MaterialBookSectionProps>(function MaterialBookSection({
  categoryKey,
  items,
  onItemSelect,
  defaultOpen = true
}, ref) {
  const { tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural';
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const config = getCategoryConfig(categoryKey);
  const Icon = config.icon;

  if (items.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full text-left">
        <Card className={cn(
          "overflow-hidden border-0 transition-all duration-300 cursor-pointer group",
          isOpen && "ring-2 ring-white/10"
        )}>
          {/* Section Header — Cinematic Gradient */}
          <div className={cn(
            "relative h-24 md:h-28 bg-gradient-to-r px-6 py-4",
            config.gradient,
            "flex items-center justify-between"
          )}>
            {/* Background effects — MAIS EVIDENTES */}
            {isHighEnd && (
              <>
                <div className="absolute inset-0 opacity-40" 
                  style={{ 
                    backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 5px)` 
                  }} 
                />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/25 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              </>
            )}

            {/* Content */}
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {config.label}
                  </h2>
                  <Badge className="bg-white/20 text-white border-0 font-bold">
                    {items.length}
                  </Badge>
                </div>
                <p className="text-white/80 text-sm">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Chevron */}
            <div className={cn(
              "p-2 rounded-xl bg-white/10 backdrop-blur-sm transition-transform duration-300",
              isOpen && "rotate-180"
            )}>
              <ChevronDown className="w-6 h-6 text-white" />
            </div>

            {/* Corner accents */}
            <div 
              className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 rounded-tl-xl opacity-50"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            />
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 rounded-br-xl opacity-50"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            />
          </div>
        </Card>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-4 space-y-4">
          {items.map((item, index) => (
            <MaterialBookCard
              key={item.id}
              item={item}
              index={index}
              onSelect={() => onItemSelect(item.id)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}));

export default MaterialBookSection;
