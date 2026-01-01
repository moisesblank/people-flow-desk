// ============================================
// 📚 QUESTION RESOLUTION — COMPONENTE UNIVERSAL
// PADRÃO OBRIGATÓRIO PARA TODAS AS RESOLUÇÕES
// 
// ESTRUTURA VISUAL ORGANIZADA:
// - Parser inteligente detecta seções no texto
// - Cada seção renderizada em bloco visual distinto
// - Passos numerados destacados visualmente
// ============================================

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatChemicalFormulas } from '@/lib/chemicalFormatter';
import { getBancaLabel } from '@/constants/bancas';
import { 
  Sparkles, 
  Target, 
  FolderTree, 
  Lightbulb,
  AlertTriangle,
  Compass,
  CheckCircle,
  Beaker,
  Cog,
  BarChart3,
  GraduationCap,
  Zap,
} from 'lucide-react';

// Fallback padrão
const DEFAULT_BANCA_HEADER = 'QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS';

// Mapa de dificuldade
const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  'facil': { label: 'FÁCIL', color: 'text-green-500' },
  'medio': { label: 'MÉDIO', color: 'text-yellow-500' },
  'dificil': { label: 'DIFÍCIL', color: 'text-red-500' },
};

// Tipos de seção detectáveis
type SectionType = 
  | 'intro' 
  | 'passo' 
  | 'conclusao' 
  | 'competencia' 
  | 'estrategia' 
  | 'pegadinhas' 
  | 'dica'
  | 'afirmacao_correta'
  | 'afirmacao_incorreta';

interface ParsedSection {
  type: SectionType;
  title?: string;
  content: string;
  stepNumber?: number;
  afirmacaoNumber?: string;
}

interface QuestionResolutionProps {
  resolutionText: string;
  banca?: string | null;
  ano?: number | null;
  difficulty?: string | null;
  tema?: string | null;
  macro?: string | null;
  micro?: string | null;
  competenciaEnem?: string | null;
  habilidadeEnem?: string | null;
  className?: string;
}

/**
 * Limpa metadados/HTML indesejados do início do texto
 */
function cleanResolutionText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // PASSO 1: Remover TODO o lixo de HTML/interface copiado antes do conteúdo real
  // Encontrar onde começa o conteúdo real (QUESTÃO, 🔬, ✨, ou afirmação)
  const contentStartPatterns = [
    /QUESTÃO\s+SIMULADO/i,
    /🔬\s*RESOLUÇÃO/i,
    /✨\s*QUESTÃO/i,
    /O\s+gráfico/i,
    /Observando/i,
    /Analis/i,
    /A\s+questão/i,
  ];
  
  for (const pattern of contentStartPatterns) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined && match.index > 0) {
      // Se o conteúdo real começa depois de posição 0, remover o lixo antes
      cleaned = cleaned.substring(match.index);
      break;
    }
  }
  
  // PASSO 2: Limpar metadados específicos que podem ter sido copiados
  cleaned = cleaned
    // Remover atributos de HTML copiados
    .replace(/\*\]:[^"]*"[^>]*>/g, '')
    .replace(/\*\]:pointer-events[^"]*"[^>]*>/g, '')
    .replace(/\*\][^"]*scroll-mt[^"]*"[^>]*>/g, '')
    .replace(/dir="auto"[^>]*>/g, '')
    .replace(/tabindex="-?\d+"[^>]*>/g, '')
    .replace(/data-[a-z-]+="[^"]*"/gi, '')
    // Remover padrões de metadados copiados
    .replace(/\*\]:[^\s]+/g, '')
    .trim();
  
  // PASSO 3: Remover duplicatas de header que já renderizamos
  cleaned = cleaned
    .replace(/QUESTÃO SIMULADO PROF\. MOISÉS MEDEIROS/gi, '')
    .replace(/✨\s*QUESTÃO:\s*NÍVEL\s*(FÁCIL|MÉDIO|DIFÍCIL)/gi, '')
    .replace(/🧪\s*TEMA:[^\n]*/gi, '')
    .replace(/📁\s*CLASSIFICAÇÃO/gi, '')
    .replace(/🔹\s*Macroassunto:[^\n]*/gi, '')
    .replace(/🔹\s*Microassunto:[^\n]*/gi, '')
    .trim();
  
  return cleaned;
}

/**
 * Parser inteligente que detecta seções no texto da resolução
 */
function parseResolutionText(text: string): ParsedSection[] {
  if (!text) return [];
  
  // Limpar texto primeiro
  const cleanedText = cleanResolutionText(text);
  if (!cleanedText) return [];

  const sections: ParsedSection[] = [];
  
  // Padrões de detecção (ordem importa!)
  const patterns: { regex: RegExp; type: SectionType; isAfirmacao?: boolean }[] = [
    // Afirmações corretas/incorretas
    { regex: /[✅✔️]\s*AFIRMAÇÃO\s*([IVX]+)/gi, type: 'afirmacao_correta', isAfirmacao: true },
    { regex: /[❌✖️]\s*AFIRMAÇÃO\s*([IVX]+)/gi, type: 'afirmacao_incorreta', isAfirmacao: true },
    // Conclusão
    { regex: /[🧬📊✅]\s*CONCLUSÃO[:\s]*/gi, type: 'conclusao' },
    { regex: /A alternativa correta é/gi, type: 'conclusao' },
    // Competência e Habilidade
    { regex: /🎯\s*COMPETÊNCIA E HABILIDADE\s*[-–]?\s*ENEM[:\s]*/gi, type: 'competencia' },
    // Estratégia
    { regex: /📌\s*DIRECIONAMENTO\s*[\/]?\s*ESTRATÉGIA[:\s]*/gi, type: 'estrategia' },
    // Pegadinhas
    { regex: /⚠️\s*PEGADINHAS?(\s*COMUNS?)?[:\s]*/gi, type: 'pegadinhas' },
    // Dica de Ouro
    { regex: /💡\s*DICA DE OURO[:\s]*/gi, type: 'dica' },
    // Passos
    { regex: /[📊⚗️⚙️🔬]\s*PASSO\s*(\d+)[:\s]*/gi, type: 'passo' },
    { regex: /PASSO\s*(\d+)[:\s]*/gi, type: 'passo' },
  ];

  // Primeiro, encontrar todas as posições de início de seção
  const sectionStarts: { index: number; type: SectionType; match: string; stepNumber?: number; afirmacaoNumber?: string }[] = [];
  
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, 'gi');
    while ((match = regex.exec(cleanedText)) !== null) {
      sectionStarts.push({
        index: match.index,
        type: pattern.type,
        match: match[0],
        stepNumber: pattern.type === 'passo' ? parseInt(match[1] || '0') : undefined,
        afirmacaoNumber: pattern.isAfirmacao ? match[1] : undefined,
      });
    }
  }

  // Ordenar por posição
  sectionStarts.sort((a, b) => a.index - b.index);

  // Extrair conteúdo de cada seção
  if (sectionStarts.length === 0) {
    // Sem seções detectadas, retorna como intro
    return [{ type: 'intro', content: cleanedText.trim() }];
  }

  // Intro (texto antes da primeira seção detectada)
  const firstSection = sectionStarts[0];
  if (firstSection.index > 0) {
    const introText = cleanedText.substring(0, firstSection.index).trim();
    // Limpar marcadores já processados do intro
    const cleanedIntro = introText
      .replace(/🔬\s*RESOLUÇÃO COMENTADA PELO PROF\. MOISÉS MEDEIROS[:\s]*/gi, '')
      .replace(/RESOLUÇÃO COMENTADA PELO PROF\. MOISÉS MEDEIROS[:\s]*/gi, '')
      .trim();
    if (cleanedIntro) {
      sections.push({ type: 'intro', content: cleanedIntro });
    }
  }

  // Processar cada seção
  for (let i = 0; i < sectionStarts.length; i++) {
    const current = sectionStarts[i];
    const next = sectionStarts[i + 1];
    
    const startIndex = current.index + current.match.length;
    const endIndex = next ? next.index : cleanedText.length;
    const content = cleanedText.substring(startIndex, endIndex).trim();

    if (content) {
      sections.push({
        type: current.type,
        content,
        stepNumber: current.stepNumber,
        afirmacaoNumber: current.afirmacaoNumber,
        title: current.match.trim(),
      });
    }
  }

  return sections;
}

/**
 * Ícone para cada tipo de seção
 */
function getSectionIcon(type: SectionType, stepNumber?: number) {
  switch (type) {
    case 'passo':
      if (stepNumber === 1) return Cog;
      if (stepNumber === 2) return Beaker;
      if (stepNumber === 3) return BarChart3;
      if (stepNumber === 4) return CheckCircle;
      return Zap;
    case 'conclusao':
      return CheckCircle;
    case 'competencia':
      return GraduationCap;
    case 'estrategia':
      return Compass;
    case 'pegadinhas':
      return AlertTriangle;
    case 'dica':
      return Lightbulb;
    case 'afirmacao_correta':
      return CheckCircle;
    case 'afirmacao_incorreta':
      return AlertTriangle;
    default:
      return Sparkles;
  }
}

/**
 * Cor para cada tipo de seção
 */
function getSectionColor(type: SectionType): string {
  switch (type) {
    case 'passo':
      return 'border-blue-500/40 bg-blue-500/5';
    case 'conclusao':
      return 'border-emerald-500/40 bg-emerald-500/5';
    case 'competencia':
      return 'border-purple-500/40 bg-purple-500/5';
    case 'estrategia':
      return 'border-amber-500/40 bg-amber-500/5';
    case 'pegadinhas':
      return 'border-orange-500/40 bg-orange-500/5';
    case 'dica':
      return 'border-yellow-500/40 bg-yellow-500/5';
    case 'afirmacao_correta':
      return 'border-green-500/40 bg-green-500/5';
    case 'afirmacao_incorreta':
      return 'border-red-500/40 bg-red-500/5';
    default:
      return 'border-border/50 bg-muted/30';
  }
}

function getSectionIconColor(type: SectionType): string {
  switch (type) {
    case 'passo':
      return 'text-blue-500';
    case 'conclusao':
      return 'text-emerald-500';
    case 'competencia':
      return 'text-purple-500';
    case 'estrategia':
      return 'text-amber-500';
    case 'pegadinhas':
      return 'text-orange-500';
    case 'dica':
      return 'text-yellow-500';
    case 'afirmacao_correta':
      return 'text-green-500';
    case 'afirmacao_incorreta':
      return 'text-red-500';
    default:
      return 'text-primary';
  }
}

function getSectionTitle(section: ParsedSection): string {
  switch (section.type) {
    case 'passo':
      return `PASSO ${section.stepNumber || ''}`;
    case 'conclusao':
      return '✅ CONCLUSÃO E GABARITO';
    case 'competencia':
      return '🎯 COMPETÊNCIA E HABILIDADE - ENEM';
    case 'estrategia':
      return '📌 DIRECIONAMENTO / ESTRATÉGIA';
    case 'pegadinhas':
      return '⚠️ PEGADINHAS COMUNS';
    case 'dica':
      return '💡 DICA DE OURO';
    case 'afirmacao_correta':
      return `✅ AFIRMAÇÃO ${section.afirmacaoNumber || ''}`;
    case 'afirmacao_incorreta':
      return `❌ AFIRMAÇÃO ${section.afirmacaoNumber || ''}`;
    default:
      return '';
  }
}

/**
 * Bloco visual para cada seção
 */
const SectionBlock = memo(function SectionBlock({ section }: { section: ParsedSection }) {
  const Icon = getSectionIcon(section.type, section.stepNumber);
  const colorClass = getSectionColor(section.type);
  const iconColor = getSectionIconColor(section.type);
  const title = getSectionTitle(section);

  // Para afirmações, formatar o conteúdo com indicador de resultado
  const isAfirmacao = section.type === 'afirmacao_correta' || section.type === 'afirmacao_incorreta';

  if (section.type === 'intro') {
    return (
      <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="text-justify leading-relaxed whitespace-pre-wrap text-sm">
            {formatChemicalFormulas(section.content)}
          </p>
        </div>
      </div>
    );
  }

  // Formatar conteúdo: separar indicador final de resultado
  const formatContent = (content: string) => {
    // Separar "👉 Afirmação X está correta/incorreta" em linha própria
    const formattedContent = content
      .replace(/👉\s*/g, '\n\n👉 ')
      .replace(/Reunindo:/gi, '\n\n📋 Reunindo:')
      .trim();
    return formatChemicalFormulas(formattedContent);
  };

  return (
    <div className={cn("p-4 rounded-xl border", colorClass)}>
      <div className="flex items-start gap-3">
        <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg bg-background/50 flex-shrink-0", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn("font-bold text-sm mb-2", iconColor)}>
              {title}
            </h4>
          )}
          <div className="text-justify leading-relaxed whitespace-pre-wrap text-sm">
            {isAfirmacao ? (
              <div className="space-y-2">
                {formatContent(section.content)}
              </div>
            ) : (
              formatContent(section.content)
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Formata o header da banca
 */
const formatBancaHeader = (banca?: string | null, ano?: number | null): string => {
  if (banca) {
    const bancaLabel = getBancaLabel(banca);
    return ano ? `${bancaLabel} (${ano})` : bancaLabel;
  }
  return DEFAULT_BANCA_HEADER;
};

/**
 * Componente universal para exibir resolução de questão
 * Com parsing inteligente e organização visual em blocos
 */
const QuestionResolution = memo(function QuestionResolution({
  resolutionText,
  banca,
  ano,
  difficulty,
  tema,
  macro,
  micro,
  competenciaEnem,
  habilidadeEnem,
  className,
}: QuestionResolutionProps) {
  const bancaHeader = formatBancaHeader(banca, ano);
  const difficultyData = difficulty ? DIFFICULTY_LABELS[difficulty] : null;

  // Parser inteligente
  const parsedSections = useMemo(() => parseResolutionText(resolutionText), [resolutionText]);

  // Verifica se tem classificação
  const hasClassification = macro || micro;
  
  // Verifica se o texto já tem seção de competência
  const hasEnemInText = parsedSections.some(s => s.type === 'competencia');
  const showEnemBlock = (competenciaEnem || habilidadeEnem) && !hasEnemInText;

  return (
    <div className={cn("space-y-4", className)}>
      {/* HEADER — Centralizado */}
      <div className="text-center pb-2 border-b border-border/30">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-primary">
          {bancaHeader}
        </h3>
      </div>

      {/* METADADOS — Nível + Tema + Classificação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card Nível + Tema */}
        {(difficultyData || tema) && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {difficultyData && (
                <span>
                  <span className="font-semibold">✨ NÍVEL:</span>{' '}
                  <span className={cn("font-bold", difficultyData.color)}>{difficultyData.label}</span>
                </span>
              )}
              {tema && (
                <span>
                  <span className="font-semibold">🧪 TEMA:</span>{' '}
                  <span className="text-muted-foreground">{tema}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Card Classificação */}
        {hasClassification && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <FolderTree className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm text-blue-500">CLASSIFICAÇÃO</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {macro && (
                <span>
                  <span className="font-medium text-blue-400">Macro:</span>{' '}
                  <span className="text-muted-foreground">{macro}</span>
                </span>
              )}
              {micro && (
                <span>
                  <span className="font-medium text-blue-400">Micro:</span>{' '}
                  <span className="text-muted-foreground">{micro}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TÍTULO DA RESOLUÇÃO */}
      <div className="text-center pt-4 pb-3">
        <h4 className="text-2xl font-bold text-emerald-500 inline-flex items-center justify-center gap-3">
          <Sparkles className="h-6 w-6" />
          🔬 RESOLUÇÃO COMENTADA PELO PROF. MOISÉS MEDEIROS
        </h4>
      </div>

      {/* SEÇÕES PARSEADAS — Cada uma em seu bloco visual */}
      <div className="space-y-3">
        {parsedSections.map((section, index) => (
          <SectionBlock key={`${section.type}-${index}`} section={section} />
        ))}
      </div>

      {/* COMPETÊNCIA ENEM — Se não estiver no texto */}
      {showEnemBlock && (
        <div className="p-4 rounded-xl border border-purple-500/40 bg-purple-500/5">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-background/50 text-purple-500 flex-shrink-0">
              <Target className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-2 text-purple-500">
                🎯 COMPETÊNCIA E HABILIDADE - ENEM
              </h4>
              <div className="space-y-1 text-sm">
                {competenciaEnem && (
                  <p>
                    <span className="font-medium text-purple-400">📘 Competência:</span>{' '}
                    <span className="text-muted-foreground">{competenciaEnem}</span>
                  </p>
                )}
                {habilidadeEnem && (
                  <p>
                    <span className="font-medium text-purple-400">📘 Habilidade:</span>{' '}
                    <span className="text-muted-foreground">{habilidadeEnem}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default QuestionResolution;

// ============================================
// REGRAS:
// 1. Parser detecta automaticamente seções no texto
// 2. Cada seção exibida em bloco visual distinto
// 3. Cores e ícones específicos por tipo
// 4. NÃO modifica conteúdo, apenas organiza visualmente
// ============================================
