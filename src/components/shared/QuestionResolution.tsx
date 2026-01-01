// ============================================
// 📚 QUESTION RESOLUTION — COMPONENTE UNIVERSAL
// PADRÃO OBRIGATÓRIO PARA TODAS AS RESOLUÇÕES
// 
// ESTRUTURA VISUAL ORGANIZADA EM BLOCOS:
// - Parser inteligente detecta seções e alternativas
// - CADA alternativa em seu bloco visual individual
// - Separação clara entre seções
// - Design profissional de 2300
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
  XCircle,
  CircleDot,
  MessageCircle,
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
  | 'afirmacao_incorreta'
  | 'alternativa_analise'
  | 'alternativa_correta'
  | 'alternativa_errada'
  | 'resumo';

interface ParsedSection {
  type: SectionType;
  title?: string;
  content: string;
  stepNumber?: number;
  afirmacaoNumber?: string;
  alternativaLetter?: string;
  isCorrect?: boolean;
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
  const contentStartPatterns = [
    /QUESTÃO\s+SIMULADO/i,
    /🔬\s*RESOLUÇÃO/i,
    /✨\s*QUESTÃO/i,
    /O\s+gráfico/i,
    /Observando/i,
    /Analis/i,
    /A\s+questão/i,
    /Meus\s+queridos/i,
    /Queridos/i,
    /Vamos\s+analisar/i,
  ];
  
  for (const pattern of contentStartPatterns) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined && match.index > 0) {
      cleaned = cleaned.substring(match.index);
      break;
    }
  }
  
  // PASSO 2: Limpar metadados específicos
  cleaned = cleaned
    .replace(/\*\]:[^"]*"[^>]*>/g, '')
    .replace(/\*\]:pointer-events[^"]*"[^>]*>/g, '')
    .replace(/\*\][^"]*scroll-mt[^"]*"[^>]*>/g, '')
    .replace(/dir="auto"[^>]*>/g, '')
    .replace(/tabindex="-?\d+"[^>]*>/g, '')
    .replace(/data-[a-z-]+="[^"]*"/gi, '')
    .replace(/\*\]:[^\s]+/g, '')
    .trim();
  
  // PASSO 3: Remover duplicatas de header
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
 * Parser inteligente AVANÇADO que detecta seções E alternativas
 */
function parseResolutionText(text: string): ParsedSection[] {
  if (!text) return [];
  
  const cleanedText = cleanResolutionText(text);
  if (!cleanedText) return [];

  const sections: ParsedSection[] = [];
  
  // ========== DETECTAR ALTERNATIVAS INDIVIDUAIS ==========
  // Padrões para alternativas: "❌ Alternativa A", "✅ Alternativa D", "🔵 Alternativa A"
  const alternativaPatterns = [
    // Alternativas erradas com X
    { 
      regex: /[❌✖️✗]\s*Alternativa\s*([A-E])\s*/gi, 
      type: 'alternativa_errada' as SectionType,
      isCorrect: false 
    },
    // Alternativas corretas com check
    { 
      regex: /[✅✔️✓]\s*Alternativa\s*([A-E])\s*/gi, 
      type: 'alternativa_correta' as SectionType,
      isCorrect: true 
    },
    // Alternativas neutras (para análise)
    { 
      regex: /[🔵🔹▪️•]\s*Alternativa\s*([A-E])\s*/gi, 
      type: 'alternativa_analise' as SectionType,
      isCorrect: false 
    },
    // Afirmações corretas
    { 
      regex: /[✅✔️]\s*AFIRMAÇÃO\s*([IVX]+)/gi, 
      type: 'afirmacao_correta' as SectionType,
      isCorrect: true 
    },
    // Afirmações incorretas
    { 
      regex: /[❌✖️]\s*AFIRMAÇÃO\s*([IVX]+)/gi, 
      type: 'afirmacao_incorreta' as SectionType,
      isCorrect: false 
    },
  ];

  // Padrões de seções especiais
  const sectionPatterns = [
    { regex: /[🧬📊✅]\s*CONCLUSÃO[:\s]*/gi, type: 'conclusao' as SectionType },
    { regex: /A alternativa correta é/gi, type: 'conclusao' as SectionType },
    { regex: /🎯\s*COMPETÊNCIA E HABILIDADE\s*[-–]?\s*ENEM[:\s]*/gi, type: 'competencia' as SectionType },
    { regex: /📌\s*DIRECIONAMENTO\s*[\/]?\s*ESTRATÉGIA[:\s]*/gi, type: 'estrategia' as SectionType },
    { regex: /⚠️\s*PEGADINHAS?(\s*COMUNS?)?[:\s]*/gi, type: 'pegadinhas' as SectionType },
    { regex: /💡\s*DICA DE OURO[:\s]*/gi, type: 'dica' as SectionType },
    { regex: /[📊⚗️⚙️🔬]\s*PASSO\s*(\d+)[:\s]*/gi, type: 'passo' as SectionType },
    { regex: /PASSO\s*(\d+)[:\s]*/gi, type: 'passo' as SectionType },
    { regex: /Agora reunindo tudo/gi, type: 'resumo' as SectionType },
    { regex: /Reunindo tudo/gi, type: 'resumo' as SectionType },
    { regex: /Apenas\s+Alternativa/gi, type: 'conclusao' as SectionType },
  ];

  // Coletar todas as posições
  interface SectionStart {
    index: number;
    type: SectionType;
    match: string;
    stepNumber?: number;
    afirmacaoNumber?: string;
    alternativaLetter?: string;
    isCorrect?: boolean;
  }
  
  const allStarts: SectionStart[] = [];

  // Buscar alternativas
  for (const pattern of alternativaPatterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, 'gi');
    while ((match = regex.exec(cleanedText)) !== null) {
      allStarts.push({
        index: match.index,
        type: pattern.type,
        match: match[0],
        alternativaLetter: match[1]?.toUpperCase(),
        afirmacaoNumber: pattern.type.includes('afirmacao') ? match[1] : undefined,
        isCorrect: pattern.isCorrect,
      });
    }
  }

  // Buscar seções especiais
  for (const pattern of sectionPatterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, 'gi');
    while ((match = regex.exec(cleanedText)) !== null) {
      allStarts.push({
        index: match.index,
        type: pattern.type,
        match: match[0],
        stepNumber: pattern.type === 'passo' ? parseInt(match[1] || '0') : undefined,
      });
    }
  }

  // Ordenar por posição
  allStarts.sort((a, b) => a.index - b.index);

  // Sem seções = retorna como intro
  if (allStarts.length === 0) {
    return [{ type: 'intro', content: cleanedText.trim() }];
  }

  // Intro (texto antes da primeira seção)
  const firstSection = allStarts[0];
  if (firstSection.index > 0) {
    const introText = cleanedText.substring(0, firstSection.index).trim();
    const cleanedIntro = introText
      .replace(/🔬\s*RESOLUÇÃO COMENTADA PELO PROF\. MOISÉS MEDEIROS[:\s]*/gi, '')
      .replace(/RESOLUÇÃO COMENTADA PELO PROF\. MOISÉS MEDEIROS[:\s]*/gi, '')
      .trim();
    if (cleanedIntro) {
      sections.push({ type: 'intro', content: cleanedIntro });
    }
  }

  // Processar cada seção
  for (let i = 0; i < allStarts.length; i++) {
    const current = allStarts[i];
    const next = allStarts[i + 1];
    
    const startIndex = current.index + current.match.length;
    const endIndex = next ? next.index : cleanedText.length;
    let content = cleanedText.substring(startIndex, endIndex).trim();

    // Limpar emojis redundantes do início do conteúdo
    content = content.replace(/^[🔵🔹▪️•❌✅✓✗✔️✖️]\s*/g, '').trim();

    if (content) {
      sections.push({
        type: current.type,
        content,
        stepNumber: current.stepNumber,
        afirmacaoNumber: current.afirmacaoNumber,
        alternativaLetter: current.alternativaLetter,
        isCorrect: current.isCorrect,
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
    case 'alternativa_correta':
      return CheckCircle;
    case 'afirmacao_incorreta':
    case 'alternativa_errada':
      return XCircle;
    case 'alternativa_analise':
      return CircleDot;
    case 'resumo':
      return MessageCircle;
    default:
      return Sparkles;
  }
}

/**
 * Configuração visual para cada tipo de seção
 */
function getSectionStyles(type: SectionType, isCorrect?: boolean): { 
  border: string; 
  bg: string; 
  iconColor: string; 
  titleColor: string;
  accentColor: string;
} {
  switch (type) {
    case 'alternativa_correta':
      return {
        border: 'border-l-4 border-l-green-500 border-t border-r border-b border-green-500/30',
        bg: 'bg-green-500/10',
        iconColor: 'text-green-500',
        titleColor: 'text-green-500',
        accentColor: 'bg-green-500/20',
      };
    case 'alternativa_errada':
      return {
        border: 'border-l-4 border-l-red-500 border-t border-r border-b border-red-500/30',
        bg: 'bg-red-500/5',
        iconColor: 'text-red-500',
        titleColor: 'text-red-500',
        accentColor: 'bg-red-500/20',
      };
    case 'alternativa_analise':
      return {
        border: 'border-l-4 border-l-blue-500 border-t border-r border-b border-blue-500/30',
        bg: 'bg-blue-500/5',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-500',
        accentColor: 'bg-blue-500/20',
      };
    case 'afirmacao_correta':
      return {
        border: 'border-l-4 border-l-green-500 border-t border-r border-b border-green-500/30',
        bg: 'bg-green-500/10',
        iconColor: 'text-green-500',
        titleColor: 'text-green-500',
        accentColor: 'bg-green-500/20',
      };
    case 'afirmacao_incorreta':
      return {
        border: 'border-l-4 border-l-red-500 border-t border-r border-b border-red-500/30',
        bg: 'bg-red-500/5',
        iconColor: 'text-red-500',
        titleColor: 'text-red-500',
        accentColor: 'bg-red-500/20',
      };
    case 'passo':
      return {
        border: 'border-l-4 border-l-blue-500 border-t border-r border-b border-blue-500/30',
        bg: 'bg-blue-500/5',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-500',
        accentColor: 'bg-blue-500/20',
      };
    case 'conclusao':
      return {
        border: 'border-l-4 border-l-emerald-500 border-t border-r border-b border-emerald-500/30',
        bg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        titleColor: 'text-emerald-500',
        accentColor: 'bg-emerald-500/20',
      };
    case 'competencia':
      return {
        border: 'border-l-4 border-l-purple-500 border-t border-r border-b border-purple-500/30',
        bg: 'bg-purple-500/5',
        iconColor: 'text-purple-500',
        titleColor: 'text-purple-500',
        accentColor: 'bg-purple-500/20',
      };
    case 'estrategia':
      return {
        border: 'border-l-4 border-l-amber-500 border-t border-r border-b border-amber-500/30',
        bg: 'bg-amber-500/5',
        iconColor: 'text-amber-500',
        titleColor: 'text-amber-500',
        accentColor: 'bg-amber-500/20',
      };
    case 'pegadinhas':
      return {
        border: 'border-l-4 border-l-orange-500 border-t border-r border-b border-orange-500/30',
        bg: 'bg-orange-500/5',
        iconColor: 'text-orange-500',
        titleColor: 'text-orange-500',
        accentColor: 'bg-orange-500/20',
      };
    case 'dica':
      return {
        border: 'border-l-4 border-l-yellow-500 border-t border-r border-b border-yellow-500/30',
        bg: 'bg-yellow-500/5',
        iconColor: 'text-yellow-500',
        titleColor: 'text-yellow-500',
        accentColor: 'bg-yellow-500/20',
      };
    case 'resumo':
      return {
        border: 'border-l-4 border-l-cyan-500 border-t border-r border-b border-cyan-500/30',
        bg: 'bg-cyan-500/5',
        iconColor: 'text-cyan-500',
        titleColor: 'text-cyan-500',
        accentColor: 'bg-cyan-500/20',
      };
    default:
      return {
        border: 'border border-border/50',
        bg: 'bg-muted/20',
        iconColor: 'text-primary',
        titleColor: 'text-foreground',
        accentColor: 'bg-primary/20',
      };
  }
}

/**
 * Título formatado para cada tipo de seção
 */
function getSectionTitle(section: ParsedSection): string {
  switch (section.type) {
    case 'alternativa_correta':
      return `✅ ALTERNATIVA ${section.alternativaLetter} — CORRETA`;
    case 'alternativa_errada':
      return `❌ ALTERNATIVA ${section.alternativaLetter} — ERRADA`;
    case 'alternativa_analise':
      return `🔵 ALTERNATIVA ${section.alternativaLetter}`;
    case 'afirmacao_correta':
      return `✅ AFIRMAÇÃO ${section.afirmacaoNumber} — CORRETA`;
    case 'afirmacao_incorreta':
      return `❌ AFIRMAÇÃO ${section.afirmacaoNumber} — ERRADA`;
    case 'passo':
      return `📊 PASSO ${section.stepNumber}`;
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
    case 'resumo':
      return '📋 RESUMO FINAL';
    default:
      return '';
  }
}

/**
 * Formata conteúdo com fórmulas químicas
 */
const formatContent = (content: string) => {
  return formatChemicalFormulas(
    content
      .replace(/👉\s*/g, '\n• ')
      .replace(/Reunindo:/gi, '\n📋 Reunindo:')
      .trim()
  );
};

/**
 * Item de alternativa dentro do bloco agrupado
 */
const AlternativaItem = memo(function AlternativaItem({ section }: { section: ParsedSection }) {
  const isCorrect = section.type === 'alternativa_correta' || section.type === 'afirmacao_correta';
  const isErrada = section.type === 'alternativa_errada' || section.type === 'afirmacao_incorreta';
  
  const letter = section.alternativaLetter || section.afirmacaoNumber || '';
  const icon = isCorrect ? '✅' : isErrada ? '❌' : '🔵';
  const statusText = isCorrect ? 'CORRETA' : isErrada ? 'ERRADA' : '';
  
  return (
    <div className={cn(
      "py-3 border-l-4 pl-4",
      isCorrect && "border-l-green-500 bg-green-500/5",
      isErrada && "border-l-red-500 bg-red-500/5",
      !isCorrect && !isErrada && "border-l-blue-500 bg-blue-500/5"
    )}>
      <div className="flex items-start gap-2">
        <span className={cn(
          "font-bold text-sm shrink-0",
          isCorrect && "text-green-500",
          isErrada && "text-red-500",
          !isCorrect && !isErrada && "text-blue-500"
        )}>
          {icon} Alternativa {letter}
          {statusText && <span className="ml-1">— {statusText}</span>}
        </span>
      </div>
      <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
        {formatContent(section.content)}
      </p>
    </div>
  );
});

/**
 * Bloco visual para seções NÃO-alternativas
 */
const SectionBlock = memo(function SectionBlock({ section }: { section: ParsedSection }) {
  const Icon = getSectionIcon(section.type, section.stepNumber);
  const styles = getSectionStyles(section.type, section.isCorrect);
  const title = getSectionTitle(section);

  // INTRO — Bloco especial
  if (section.type === 'intro') {
    return (
      <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/20">
            <Sparkles className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-emerald-500 mb-2">
              📝 ANÁLISE DA QUESTÃO
            </h4>
            <p className="text-justify leading-relaxed text-sm text-foreground/90">
              {formatContent(section.content)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden", styles.border, styles.bg)}>
      {/* Header do bloco */}
      <div className={cn("px-4 py-2.5 flex items-center gap-2", styles.accentColor)}>
        <Icon className={cn("h-4 w-4", styles.iconColor)} />
        <h4 className={cn("font-bold text-sm", styles.titleColor)}>
          {title}
        </h4>
      </div>
      
      {/* Conteúdo do bloco */}
      <div className="px-4 py-3">
        <div className="text-justify leading-relaxed text-sm text-foreground/90 whitespace-pre-wrap">
          {formatContent(section.content)}
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
 * Com parsing inteligente e organização visual em blocos SEPARADOS
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

  // Parser inteligente AVANÇADO
  const parsedSections = useMemo(() => parseResolutionText(resolutionText), [resolutionText]);

  // Verificações
  const hasClassification = macro || micro;
  const hasEnemInText = parsedSections.some(s => s.type === 'competencia');
  const showEnemBlock = (competenciaEnem || habilidadeEnem) && !hasEnemInText;

  // Agrupar seções por categoria para melhor visualização
  const alternativasSections = parsedSections.filter(s => 
    s.type === 'alternativa_correta' || 
    s.type === 'alternativa_errada' || 
    s.type === 'alternativa_analise' ||
    s.type === 'afirmacao_correta' ||
    s.type === 'afirmacao_incorreta'
  );
  const otherSections = parsedSections.filter(s => 
    !alternativasSections.includes(s) && s.type !== 'intro'
  );
  const introSection = parsedSections.find(s => s.type === 'intro');

  return (
    <div className={cn("space-y-6", className)}>
      {/* ========== HEADER ========== */}
      <div className="text-center pb-3 border-b-2 border-primary/20">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-primary">
          {bancaHeader}
        </h3>
      </div>

      {/* ========== METADADOS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Nível + Tema */}
        {(difficultyData || tema) && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex flex-col gap-2 text-sm">
              {difficultyData && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">✨ NÍVEL:</span>
                  <span className={cn("font-bold px-2 py-0.5 rounded", difficultyData.color)}>
                    {difficultyData.label}
                  </span>
                </div>
              )}
              {tema && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">🧪 TEMA:</span>
                  <span className="text-muted-foreground">{tema}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Classificação */}
        {hasClassification && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FolderTree className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm text-blue-500">CLASSIFICAÇÃO</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              {macro && (
                <div>
                  <span className="font-medium text-blue-400">Macro:</span>{' '}
                  <span className="text-muted-foreground">{macro}</span>
                </div>
              )}
              {micro && (
                <div>
                  <span className="font-medium text-blue-400">Micro:</span>{' '}
                  <span className="text-muted-foreground">{micro}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========== TÍTULO PRINCIPAL ========== */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30">
          <Sparkles className="h-6 w-6 text-emerald-500" />
          <h4 className="text-xl font-bold text-emerald-500">
            🔬 RESOLUÇÃO COMENTADA PELO PROF. MOISÉS MEDEIROS
          </h4>
        </div>
      </div>

      {/* ========== INTRO (ANÁLISE) ========== */}
      {introSection && (
        <SectionBlock section={introSection} />
      )}

      {/* ========== ALTERNATIVAS / AFIRMAÇÕES — BLOCO ÚNICO ========== */}
      {alternativasSections.length > 0 && (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/10">
          {/* Header do bloco de alternativas */}
          <div className="px-4 py-3 bg-muted/30 border-b border-border/30 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-sm text-primary uppercase tracking-wide">
              📋 Análise das Alternativas
            </h4>
          </div>
          
          {/* Alternativas como tópicos dentro do bloco */}
          <div className="divide-y divide-border/30">
            {alternativasSections.map((section, index) => (
              <AlternativaItem key={`alt-${section.type}-${index}`} section={section} />
            ))}
          </div>
        </div>
      )}

      {/* ========== OUTRAS SEÇÕES ========== */}
      {otherSections.length > 0 && (
        <div className="space-y-3">
          {otherSections.map((section, index) => (
            <SectionBlock key={`sec-${section.type}-${index}`} section={section} />
          ))}
        </div>
      )}

      {/* ========== COMPETÊNCIA ENEM (se não no texto) ========== */}
      {showEnemBlock && (
        <div className="rounded-xl overflow-hidden border-l-4 border-l-purple-500 border-t border-r border-b border-purple-500/30 bg-purple-500/5">
          <div className="px-4 py-3 flex items-center gap-3 bg-purple-500/20">
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-background/60 text-purple-500">
              <Target className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-sm text-purple-500">
              🎯 COMPETÊNCIA E HABILIDADE - ENEM
            </h4>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm">
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
      )}
    </div>
  );
});

export default QuestionResolution;

// ============================================
// REGRAS OBRIGATÓRIAS v2.0:
// 1. Parser detecta ALTERNATIVAS (A-E) e AFIRMAÇÕES (I-V)
// 2. CADA alternativa em bloco visual SEPARADO
// 3. Bordas laterais coloridas para indicar correto/errado
// 4. Agrupamento inteligente por categoria
// 5. NÃO modifica conteúdo, apenas organiza visualmente
// ============================================
