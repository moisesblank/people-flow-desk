// ============================================
// 📂 MATERIAL BOOK SECTION — NETFLIX STYLE COLLAPSIBLE
// YEAR 2300 CINEMATIC EXPERIENCE
// ⚡ Estrutura duplicada de WebBookLibrary.tsx
// 🎯 SHELL ESTRUTURAL: Receberá PDFs posteriormente
// ============================================

import { memo, useState } from 'react';
import { 
  ChevronDown,
  ChevronUp,
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
// CONFIGURAÇÃO DAS 5 CATEGORIAS
// ============================================

type CategoryConfig = {
  icon: React.ElementType;
  gradient: string;
  accentColor: string;
  label: string;
  description: string;
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  quimica_geral: {
    icon: Atom,
    gradient: 'from-amber-600 via-amber-500 to-orange-500',
    accentColor: '#F59E0B',
    label: 'Química Geral',
    description: 'Fundamentos e conceitos essenciais'
  },
  quimica_organica: {
    icon: Beaker,
    gradient: 'from-purple-600 via-purple-500 to-violet-500',
    accentColor: '#A855F7',
    label: 'Química Orgânica',
    description: 'Compostos e reações orgânicas'
  },
  fisico_quimica: {
    icon: FlaskConical,
    gradient: 'from-cyan-600 via-cyan-500 to-blue-500',
    accentColor: '#06B6D4',
    label: 'Físico-Química',
    description: 'Termodinâmica e cinética'
  },
  quimica_ambiental: {
    icon: Leaf,
    gradient: 'from-emerald-600 via-emerald-500 to-green-500',
    accentColor: '#10B981',
    label: 'Química Ambiental',
    description: 'Meio ambiente e sustentabilidade'
  },
  bioquimica: {
    icon: Dna,
    gradient: 'from-pink-600 via-pink-500 to-rose-500',
    accentColor: '#EC4899',
    label: 'Bioquímica',
    description: 'Processos biológicos moleculares'
  },
};

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

export const MaterialBookSection = memo(function MaterialBookSection({
  categoryKey,
  items,
  onItemSelect,
  defaultOpen = true
}: MaterialBookSectionProps) {
  const { tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural';
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const config = CATEGORY_CONFIG[categoryKey] || {
    icon: Atom,
    gradient: 'from-gray-600 to-slate-500',
    accentColor: '#6B7280',
    label: 'Materiais',
    description: 'Conteúdos diversos'
  };

  const Icon = config.icon;

  if (items.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="w-full cursor-pointer group">
          <Card className={cn(
            "overflow-hidden border-0 transition-all duration-300",
            isOpen && "ring-2 ring-white/10"
          )}>
            {/* Section Header — Cinematic Gradient */}
            <div className={cn(
              "relative h-24 md:h-28 bg-gradient-to-r px-6 py-4",
              config.gradient,
              "flex items-center justify-between"
            )}>
              {/* Background effects */}
              {isHighEnd && (
                <>
                  <div className="absolute inset-0 opacity-20" 
                    style={{ 
                      backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 5px)` 
                    }} 
                  />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
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
        </div>
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
});

export default MaterialBookSection;
