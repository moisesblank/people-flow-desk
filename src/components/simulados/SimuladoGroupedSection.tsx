/**
 * 🎯 SIMULADOS — Componente de Seção Agrupada
 * Constituição SYNAPSE Ω v10.0
 * 
 * Renderiza simulados organizados em grupos colapsáveis
 * com design Year 2300 Cinematic HUD
 */

import { memo, useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Beaker, Calendar, Flame as FlameIcon, Atom, Zap, TestTube, BookOpen, Target, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SimuladoListItem } from "@/hooks/simulados/useSimuladosList";

// ============================================
// 🗂️ CONFIGURAÇÃO DOS GRUPOS
// ============================================

export type SimuladoGroupId = 
  | "NIVELAMENTO"
  | "MESES_EXTENSIVO"
  | "MESES_INTENSIVO"
  | "QUIMICA_GERAL"
  | "FISICO_QUIMICA"
  | "QUIMICA_ORGANICA"
  | "OUTROS";

interface GroupConfig {
  id: SimuladoGroupId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
  isSubgroup?: boolean;
  parentGroup?: string;
}

const GROUP_CONFIGS: Record<SimuladoGroupId, GroupConfig> = {
  NIVELAMENTO: {
    id: "NIVELAMENTO",
    label: "Teste de Nivelamento",
    icon: Target,
    colorClass: "text-amber-400",
    bgClass: "bg-gradient-to-br from-amber-500/20 to-yellow-500/20",
    borderClass: "border-amber-500/30",
    glowClass: "shadow-[0_0_20px_hsl(45,100%,50%,0.15)]",
  },
  MESES_EXTENSIVO: {
    id: "MESES_EXTENSIVO",
    label: "Simulados - Meses Extensivo ENEM",
    icon: Calendar,
    colorClass: "text-blue-400",
    bgClass: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
    borderClass: "border-blue-500/30",
    glowClass: "shadow-[0_0_20px_hsl(220,100%,50%,0.15)]",
  },
  MESES_INTENSIVO: {
    id: "MESES_INTENSIVO",
    label: "Simulados - Meses Intensivos ENEM",
    icon: FlameIcon,
    colorClass: "text-orange-400",
    bgClass: "bg-gradient-to-br from-orange-500/20 to-red-500/20",
    borderClass: "border-orange-500/30",
    glowClass: "shadow-[0_0_20px_hsl(25,100%,50%,0.15)]",
  },
  QUIMICA_GERAL: {
    id: "QUIMICA_GERAL",
    label: "Química Geral (Inorgânica)",
    icon: Atom,
    colorClass: "text-emerald-400",
    bgClass: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10",
    borderClass: "border-emerald-500/20",
    glowClass: "shadow-[0_0_15px_hsl(160,100%,50%,0.1)]",
    isSubgroup: true,
    parentGroup: "POR_ASSUNTO",
  },
  FISICO_QUIMICA: {
    id: "FISICO_QUIMICA",
    label: "Físico-Química",
    icon: Zap,
    colorClass: "text-cyan-400",
    bgClass: "bg-gradient-to-br from-cyan-500/10 to-blue-500/10",
    borderClass: "border-cyan-500/20",
    glowClass: "shadow-[0_0_15px_hsl(190,100%,50%,0.1)]",
    isSubgroup: true,
    parentGroup: "POR_ASSUNTO",
  },
  QUIMICA_ORGANICA: {
    id: "QUIMICA_ORGANICA",
    label: "Química Orgânica",
    icon: TestTube,
    colorClass: "text-purple-400",
    bgClass: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
    borderClass: "border-purple-500/20",
    glowClass: "shadow-[0_0_15px_hsl(280,100%,50%,0.1)]",
    isSubgroup: true,
    parentGroup: "POR_ASSUNTO",
  },
  OUTROS: {
    id: "OUTROS",
    label: "Outros Simulados",
    icon: BookOpen,
    colorClass: "text-slate-400",
    bgClass: "bg-gradient-to-br from-slate-500/10 to-gray-500/10",
    borderClass: "border-slate-500/20",
    glowClass: "",
  },
};

// ============================================
// 🔍 MAPEAMENTO DE SLUGS → GRUPOS
// ============================================

const SLUG_MAPPINGS: Record<SimuladoGroupId, string[]> = {
  NIVELAMENTO: [
    "teste-nivelamento",
  ],
  MESES_EXTENSIVO: [
    "marco-9b0aaa2c",
    "abril-4ae68da1",
    "maio-2ac43141",
    "junho-4c030952",
    "julho-8ffd0a7f",
    "agosto-a7a9c7d3",
    "setembro-de0b17b0",
    "outubro-08cb043e",
    "novembro-3e35f55e",
  ],
  MESES_INTENSIVO: [
    "mes-1-intensivo",
    "mes-2-intensivo",
    "mes-3-intensivo",
    "mes-4-intensivo",
    "mes-5-intensivo",
  ],
  QUIMICA_GERAL: [
    "introducao-a-inorganica",
    "atomistica",
    "tabela-periodica",
    "ligacoes-quimicas",
    "nox",
    "funcoes-inorganicas",
    "balanceamento",
    "reacoes-inorganicas",
    "estequiometria",
    "gases",
    "calculos-quimicos",
  ],
  FISICO_QUIMICA: [
    "solucoes",
    "termoquimica",
    "cinetica-quimica",
    "equilibrio-quimico",
    "equilibrio-ionico",
    "solucao-tampao",
    "eletroquimica",
    "hidrolise",
    "kps-produto-de-solubilidade",
    "radioatividade",
    "propriedades-coligativas-bb664bab", // Físico-química
  ],
  QUIMICA_ORGANICA: [
    "introducao-a-organica",
    "funcoes-organicas",
    "isomeria-plana",
    "isomeria-espacial",
    "propriedades-coligativas-44a9803f", // Orgânica
    "reacoes-organicas",
    "polimeros",
  ],
  OUTROS: [],
};

// ============================================
// 🧮 FUNÇÃO DE CLASSIFICAÇÃO
// ============================================

export function classifySimuladosByGroup(simulados: SimuladoListItem[]): Record<SimuladoGroupId, SimuladoListItem[]> {
  const groups: Record<SimuladoGroupId, SimuladoListItem[]> = {
    NIVELAMENTO: [],
    MESES_EXTENSIVO: [],
    MESES_INTENSIVO: [],
    QUIMICA_GERAL: [],
    FISICO_QUIMICA: [],
    QUIMICA_ORGANICA: [],
    OUTROS: [],
  };

  const assignedIds = new Set<string>();

  // Iterar sobre cada grupo e mapear simulados
  for (const [groupId, slugPatterns] of Object.entries(SLUG_MAPPINGS) as [SimuladoGroupId, string[]][]) {
    if (groupId === "OUTROS") continue;

    for (const simulado of simulados) {
      if (assignedIds.has(simulado.id)) continue;
      if (!simulado.slug) continue;

      // Verificar se o slug corresponde ao padrão
      const matches = slugPatterns.some(pattern => {
        // Match exato ou prefixo
        return simulado.slug === pattern || simulado.slug?.startsWith(pattern);
      });

      if (matches) {
        groups[groupId].push(simulado);
        assignedIds.add(simulado.id);
      }
    }
  }

  // Colocar simulados não classificados em "OUTROS"
  for (const simulado of simulados) {
    if (!assignedIds.has(simulado.id)) {
      groups.OUTROS.push(simulado);
    }
  }

  return groups;
}

// ============================================
// 🎨 COMPONENTE DE GRUPO COLAPSÁVEL
// ============================================

interface SimuladoGroupSectionProps {
  groupId: SimuladoGroupId;
  simulados: SimuladoListItem[];
  renderCard: (simulado: SimuladoListItem, index: number) => React.ReactNode;
  shouldAnimate?: boolean;
  defaultOpen?: boolean;
}

export const SimuladoGroupSection = memo(function SimuladoGroupSection({
  groupId,
  simulados,
  renderCard,
  shouldAnimate = true,
  defaultOpen = true,
}: SimuladoGroupSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config = GROUP_CONFIGS[groupId];

  if (simulados.length === 0) return null;

  const Icon = config.icon;

  return (
    <div className={cn(
      "rounded-2xl overflow-hidden transition-all duration-300",
      config.bgClass,
      config.borderClass,
      "border",
      isOpen && config.glowClass,
      shouldAnimate && "animate-fade-in"
    )}>
      {/* Header Clicável */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 md:p-5",
          "hover:bg-white/5 transition-colors group"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            config.bgClass,
            config.borderClass,
            "border"
          )}>
            <Icon className={cn("w-5 h-5", config.colorClass)} />
          </div>
          <div className="text-left">
            <h3 className={cn("font-bold text-lg", config.colorClass)}>
              {config.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {simulados.length} simulado{simulados.length > 1 ? "s" : ""} disponíve{simulados.length > 1 ? "is" : "l"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={cn(
              "hidden sm:flex",
              config.borderClass,
              config.colorClass
            )}
          >
            {simulados.length}
          </Badge>
          <div className={cn(
            "p-1.5 rounded-lg transition-transform duration-200",
            config.bgClass,
            isOpen && "rotate-180"
          )}>
            <ChevronDown className={cn("w-5 h-5", config.colorClass)} />
          </div>
        </div>
      </button>

      {/* Conteúdo */}
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-4 md:p-5 pt-0">
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {simulados.map((simulado, index) => renderCard(simulado, index))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 🧪 COMPONENTE GRUPO PAI "POR ASSUNTO"
// ============================================

interface SimuladosBySubjectSectionProps {
  groups: Record<SimuladoGroupId, SimuladoListItem[]>;
  renderCard: (simulado: SimuladoListItem, index: number) => React.ReactNode;
  shouldAnimate?: boolean;
}

export const SimuladosBySubjectSection = memo(function SimuladosBySubjectSection({
  groups,
  renderCard,
  shouldAnimate = true,
}: SimuladosBySubjectSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Contar total de simulados nos subgrupos
  const totalCount = useMemo(() => {
    return (groups.QUIMICA_GERAL?.length || 0) + 
           (groups.FISICO_QUIMICA?.length || 0) + 
           (groups.QUIMICA_ORGANICA?.length || 0);
  }, [groups]);

  if (totalCount === 0) return null;

  return (
    <div className={cn(
      "rounded-2xl overflow-hidden transition-all duration-300",
      "bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10",
      "border border-violet-500/30",
      isOpen && "shadow-[0_0_30px_hsl(270,100%,50%,0.15)]",
      shouldAnimate && "animate-fade-in"
    )}>
      {/* Header Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-5",
          "hover:bg-white/5 transition-colors"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 border border-violet-500/40">
            <Beaker className="w-6 h-6 text-violet-400" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-xl text-violet-400">
              Simulados por Assunto
            </h2>
            <p className="text-sm text-muted-foreground">
              Pratique por área específica da Química
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className="border-violet-500/50 text-violet-400 hidden sm:flex"
          >
            {totalCount} simulados
          </Badge>
          <div className={cn(
            "p-2 rounded-lg bg-violet-500/20 transition-transform duration-200",
            isOpen && "rotate-180"
          )}>
            <ChevronDown className="w-5 h-5 text-violet-400" />
          </div>
        </div>
      </button>

      {/* Subgrupos */}
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[10000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-4 md:p-5 pt-0 space-y-4">
          {/* Química Geral */}
          {groups.QUIMICA_GERAL?.length > 0 && (
            <SimuladoGroupSection
              groupId="QUIMICA_GERAL"
              simulados={groups.QUIMICA_GERAL}
              renderCard={renderCard}
              shouldAnimate={shouldAnimate}
              defaultOpen={false}
            />
          )}

          {/* Físico-Química */}
          {groups.FISICO_QUIMICA?.length > 0 && (
            <SimuladoGroupSection
              groupId="FISICO_QUIMICA"
              simulados={groups.FISICO_QUIMICA}
              renderCard={renderCard}
              shouldAnimate={shouldAnimate}
              defaultOpen={false}
            />
          )}

          {/* Química Orgânica */}
          {groups.QUIMICA_ORGANICA?.length > 0 && (
            <SimuladoGroupSection
              groupId="QUIMICA_ORGANICA"
              simulados={groups.QUIMICA_ORGANICA}
              renderCard={renderCard}
              shouldAnimate={shouldAnimate}
              defaultOpen={false}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export { GROUP_CONFIGS };
