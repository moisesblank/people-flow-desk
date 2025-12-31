// ============================================
// 📥 IMPORTADOR DE QUESTÕES - Sistema Completo
// CONTRATO v3.0 - State Machine + Inferência Rastreável
// Visual Futurístico Ano 2300
// ============================================

import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Filter,
  Download,
  Sparkles,
  Brain,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Check,
  XCircle,
  Info,
  HelpCircle,
  FileQuestion,
  Trash2,
  Edit3,
  Save,
  ArrowRight,
  Wand2,
  ShieldCheck,
  Clock,
  AlertOctagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { BANCAS, BANCAS_POR_CATEGORIA, CATEGORIA_LABELS, findBancaByValue } from '@/constants/bancas';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';

// ============================================
// TIPOS
// ============================================

type NivelCognitivo = 'memorizar' | 'compreender' | 'aplicar' | 'analisar' | 'avaliar';
type OrigemQuestao = 'oficial' | 'adaptada' | 'autoral_prof_moises';
type StatusRevisao = 'rascunho' | 'revisado' | 'publicado';

// ============================================
// STATE MACHINE - 5 ESTADOS CONTROLADOS
// ============================================

type ImportFlowState = 
  | 'arquivo_carregado'
  | 'inferencia_em_execucao'
  | 'inferencia_concluida'
  | 'validacao_humana_obrigatoria'
  | 'autorizacao_explicita'
  | 'importacao_concluida';

interface ParsedQuestion {
  id: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  explanation?: string;
  difficulty?: 'facil' | 'medio' | 'dificil';
  // Origem e Identidade
  banca?: string;
  ano?: number;
  origem?: OrigemQuestao;
  // Classificação Hierárquica
  macro?: string;
  micro?: string;
  tema?: string;
  subtema?: string;
  tags?: string[];
  // Metadados Pedagógicos
  competencia_enem?: string;
  habilidade_enem?: string;
  nivel_cognitivo?: NivelCognitivo;
  tempo_medio_segundos?: number;
  multidisciplinar?: boolean;
  // Mídia
  imagens_enunciado?: string[];
  imagens_alternativas?: Record<string, string>;
  tipo_imagem?: 'ilustrativa' | 'essencial' | 'decorativa';
  // Controle Editorial
  is_active: false;
  status_revisao: 'rascunho';
  // RASTREABILIDADE
  campos_inferidos: string[];
  campos_null: string[];
  // Status de Validação
  status: 'pending' | 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  selected: boolean;
  // Original data
  rawData?: Record<string, any>;
}

interface ImportStats {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
  selected: number;
  camposInferidos: number;
  camposNull: number;
}

interface QuestionImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================
// MAPEAMENTOS INTELIGENTES
// ============================================

const COLUMN_MAPPINGS: Record<string, string[]> = {
  // Enunciado - suporte ao seu Excel
  question_text: ['enunciado', 'question_text', 'pergunta', 'questao', 'questão', 'question', 'texto', 'statement'],

  // Alternativas - suporte a "ALTERNATIVA A", "ALTERNATIVA_A", "A", etc.
  option_a: ['alternativa a', 'alternativa_a', 'opcao_a', 'opção_a', 'option_a', 'alt_a', 'a'],
  option_b: ['alternativa b', 'alternativa_b', 'opcao_b', 'opção_b', 'option_b', 'alt_b', 'b'],
  option_c: ['alternativa c', 'alternativa_c', 'opcao_c', 'opção_c', 'option_c', 'alt_c', 'c'],
  option_d: ['alternativa d', 'alternativa_d', 'opcao_d', 'opção_d', 'option_d', 'alt_d', 'd'],
  option_e: ['alternativa e', 'alternativa_e', 'opcao_e', 'opção_e', 'option_e', 'alt_e', 'e'],

  // Gabarito
  correct_answer: ['gabarito', 'correct_answer', 'resposta', 'correta', 'correct', 'answer', 'resp', 'resposta_correta'],

  // Explicação/Resolução
  explanation: ['resolucao', 'resolução', 'resolucao_texto', 'explicacao', 'explicação', 'explanation', 'justificativa', 'comentario', 'comentário'],

  // Dificuldade
  difficulty: ['dificuldade', 'difficulty', 'dificuldade_texto', 'nivel', 'nível', 'level', 'grau'],

  // Banca e Ano
  banca: ['banca', 'board', 'organizadora', 'institution', 'instituicao', 'instituição'],
  ano: ['ano', 'year', 'data', 'date', 'edicao', 'edição'],

  // Taxonomia - suporte direto às suas colunas
  macro: ['macro', 'macro_assunto_texto', 'macro_texto', 'area', 'área', 'grande_area', 'grande área', 'macroArea', 'macro_area'],
  micro: ['micro', 'micro_assunto_texto', 'micro_texto', 'disciplina', 'subject', 'microArea', 'micro_area'],
  tema: ['tema', 'tema_texto', 'topic', 'assunto', 'conteudo', 'conteúdo', 'topico', 'tópico'],
  subtema: ['subtema', 'subtema_texto', 'subtopic', 'subassunto', 'sub_tema', 'sub tema'],

  // Extras
  tags: ['tags', 'etiquetas', 'labels', 'keywords', 'palavras_chave', 'palavras chave'],
  competencia_enem: ['competencia', 'competência', 'competencia_enem', 'competencia_area', 'competencia area', 'comp'],
  habilidade_enem: ['habilidade', 'habilidade_enem', 'habilidade_area', 'habilidade area', 'hab'],
};

const DIFFICULTY_MAPPING: Record<string, 'facil' | 'medio' | 'dificil'> = {
  'facil': 'facil', 'fácil': 'facil', 'easy': 'facil', 'baixa': 'facil', 'low': 'facil', '1': 'facil', 'f': 'facil',
  'medio': 'medio', 'médio': 'medio', 'medium': 'medio', 'média': 'medio', 'normal': 'medio', '2': 'medio', 'm': 'medio',
  'dificil': 'dificil', 'difícil': 'dificil', 'hard': 'dificil', 'alta': 'dificil', 'high': 'dificil', '3': 'dificil', 'd': 'dificil',
};

const ANSWER_MAPPING: Record<string, string> = {
  'a': 'a', '1': 'a', 'i': 'a',
  'b': 'b', '2': 'b', 'ii': 'b',
  'c': 'c', '3': 'c', 'iii': 'c',
  'd': 'd', '4': 'd', 'iv': 'd',
  'e': 'e', '5': 'e', 'v': 'e',
};

// Verbos para inferência de nível cognitivo (Taxonomia de Bloom)
const VERBOS_COGNITIVOS: Record<NivelCognitivo, string[]> = {
  'memorizar': ['defina', 'cite', 'liste', 'nomeie', 'identifique', 'reproduza', 'descreva', 'enumere'],
  'compreender': ['explique', 'resuma', 'interprete', 'classifique', 'exemplifique', 'traduza'],
  'aplicar': ['calcule', 'determine', 'resolva', 'aplique', 'demonstre', 'use', 'execute', 'construa'],
  'analisar': ['compare', 'relacione', 'diferencie', 'analise', 'distinga', 'examine', 'investigue'],
  'avaliar': ['julgue', 'avalie', 'critique', 'justifique', 'argumente', 'defenda', 'recomende'],
};

// ============================================
// FUNÇÕES DE PARSE
// ============================================

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function findColumnMapping(columnName: string): string | null {
  const normalized = normalizeColumnName(columnName);

  // Scoring para evitar falsos positivos (ex: alias "a" bater em "alternativa_b")
  let best: { field: string; score: number } | null = null;

  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    for (const alias of aliases) {
      const aliasNorm = normalizeColumnName(alias);
      if (!aliasNorm) continue;

      // Match exato é sempre o melhor
      if (normalized === aliasNorm) {
        const score = 1000 + aliasNorm.length;
        if (!best || score > best.score) best = { field, score };
        continue;
      }

      // Evita que aliases curtos ("a", "b", "c") batam por substring
      if (aliasNorm.length <= 2) {
        const tokens = normalized.split('_').filter(Boolean);
        if (tokens.includes(aliasNorm)) {
          const score = 200 + aliasNorm.length;
          if (!best || score > best.score) best = { field, score };
        }
        continue;
      }

      // Substring apenas para aliases "de verdade" (>=3)
      if (normalized.includes(aliasNorm)) {
        const score = 100 + aliasNorm.length;
        if (!best || score > best.score) best = { field, score };
      }
    }
  }

  return best?.field ?? null;
}

function detectBanca(text: string): string | null {
  const lower = text.toLowerCase();
  for (const banca of BANCAS) {
    if (lower.includes(banca.value.toLowerCase()) || lower.includes(banca.label.toLowerCase())) {
      return banca.value;
    }
  }
  return null;
}

function detectYear(text: string): number | null {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    if (year >= 1990 && year <= new Date().getFullYear() + 1) {
      return year;
    }
  }
  return null;
}

function parseDifficulty(value: any): 'facil' | 'medio' | 'dificil' | undefined {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase().trim();
  return DIFFICULTY_MAPPING[normalized] || undefined;
}

function parseCorrectAnswer(value: any): string {
  if (!value) return 'a';
  const normalized = String(value).toLowerCase().trim();
  return ANSWER_MAPPING[normalized] || 'a';
}

// ============================================
// INFERÊNCIA POR CAMPO (CONTRATO PARTE 3)
// ============================================

interface InferenceResult<T> {
  value: T | undefined;
  inferido: boolean;
  metodo: string;
}

function inferBanca(text: string, fromColumn?: string): InferenceResult<string> {
  // Método: analise_textual_por_questao
  if (fromColumn) {
    const detected = detectBanca(fromColumn);
    if (detected) return { value: detected, inferido: false, metodo: 'coluna_explicita' };
    // Se tem valor na coluna mas não é reconhecido, usar como está
    const trimmed = fromColumn.trim();
    if (trimmed) return { value: trimmed.toLowerCase(), inferido: false, metodo: 'coluna_explicita' };
  }
  
  // Tentar inferir do texto
  const detected = detectBanca(text);
  if (detected) return { value: detected, inferido: true, metodo: 'analise_textual_por_questao' };
  
  // Fallback: autoral_prof_moises (NÃO forçar, apenas marcar como inferido)
  return { value: 'autoral_prof_moises', inferido: true, metodo: 'fallback_autoral' };
}

function inferAno(text: string, fromColumn?: string): InferenceResult<number> {
  // Método: coluna_ano_ou_texto
  if (fromColumn) {
    const parsed = parseInt(String(fromColumn).trim(), 10);
    if (Number.isFinite(parsed) && parsed >= 1990 && parsed <= new Date().getFullYear() + 1) {
      return { value: parsed, inferido: false, metodo: 'coluna_explicita' };
    }
  }
  
  // Tentar inferir do texto
  const detected = detectYear(text);
  if (detected) return { value: detected, inferido: true, metodo: 'analise_textual_por_questao' };
  
  // Fallback: null (NÃO forçar)
  return { value: undefined, inferido: false, metodo: 'nao_identificado' };
}

function inferNivelCognitivo(text: string): InferenceResult<NivelCognitivo> {
  // Método: analise_de_verbo_e_estrutura
  const lower = text.toLowerCase();
  
  for (const nivel of ['avaliar', 'analisar', 'aplicar', 'compreender', 'memorizar'] as NivelCognitivo[]) {
    for (const verbo of VERBOS_COGNITIVOS[nivel]) {
      if (lower.includes(verbo)) {
        return { value: nivel, inferido: true, metodo: 'analise_de_verbo_e_estrutura' };
      }
    }
  }
  
  // Fallback: null
  return { value: undefined, inferido: false, metodo: 'nao_identificado' };
}

function inferTempoMedio(difficulty?: 'facil' | 'medio' | 'dificil'): InferenceResult<number> {
  // Método: inferir_por_dificuldade
  if (!difficulty) {
    // Fallback: 120 segundos
    return { value: 120, inferido: true, metodo: 'fallback_padrao' };
  }
  
  switch (difficulty) {
    case 'facil': return { value: 60, inferido: true, metodo: 'inferir_por_dificuldade' };
    case 'medio': return { value: 120, inferido: true, metodo: 'inferir_por_dificuldade' };
    case 'dificil': return { value: 180, inferido: true, metodo: 'inferir_por_dificuldade' };
  }
}

function inferOrigem(banca?: string): InferenceResult<OrigemQuestao> {
  if (!banca) return { value: 'autoral_prof_moises', inferido: true, metodo: 'sem_banca' };
  
  const bancaEncontrada = BANCAS.find(b => 
    b.value.toLowerCase() === banca.toLowerCase() || 
    b.label.toLowerCase() === banca.toLowerCase()
  );
  
  if (bancaEncontrada) return { value: 'oficial', inferido: true, metodo: 'banca_conhecida' };
  if (banca === 'autoral_prof_moises') return { value: 'autoral_prof_moises', inferido: false, metodo: 'explicito' };
  return { value: 'adaptada', inferido: true, metodo: 'banca_desconhecida' };
}

// ============================================
// INFERÊNCIA DE MACRO POR PALAVRAS-CHAVE (QUÍMICA)
// ============================================

const MACRO_KEYWORDS: Record<string, string[]> = {
  // Química Geral
  'quimica_geral': [
    'atomística', 'atomistica', 'átomo', 'atomo', 'modelo atômico', 'modelo atomico',
    'tabela periódica', 'tabela periodica', 'elemento químico', 'elemento quimico',
    'ligação química', 'ligacao quimica', 'ligações químicas', 'ligacoes quimicas',
    'ligação iônica', 'ligacao ionica', 'ligação covalente', 'ligacao covalente',
    'ligação metálica', 'ligacao metalica', 'geometria molecular', 'polaridade',
    'forças intermoleculares', 'forcas intermoleculares', 'dipolo', 'hibridização',
    'número atômico', 'numero atomico', 'massa atômica', 'massa atomica',
    'isótopos', 'isotopos', 'íons', 'ions', 'cátion', 'cation', 'ânion', 'anion',
    'configuração eletrônica', 'configuracao eletronica', 'orbital', 'elétron', 'eletron',
    'próton', 'proton', 'nêutron', 'neutron', 'rutherford', 'bohr', 'dalton',
  ],
  // Físico-Química
  'fisico_quimica': [
    'estequiometria', 'mol', 'massa molar', 'reação química', 'reacao quimica',
    'balanceamento', 'reagente limitante', 'excesso', 'rendimento',
    'termoquímica', 'termoquimica', 'entalpia', 'exotérmica', 'exotermica',
    'endotérmica', 'endotermica', 'lei de hess', 'energia de ligação',
    'cinética química', 'cinetica quimica', 'velocidade de reação', 'velocidade de reacao',
    'catalisador', 'equilíbrio químico', 'equilibrio quimico', 'kc', 'kp',
    'le chatelier', 'deslocamento de equilíbrio', 'deslocamento de equilibrio',
    'eletroquímica', 'eletroquimica', 'oxirredução', 'oxirreducao', 'nox',
    'pilha', 'eletrólise', 'eletrolise', 'potencial de redução', 'potencial de reducao',
    'cátodo', 'catodo', 'ânodo', 'anodo', 'corrosão', 'corrosao',
    'soluções', 'solucoes', 'concentração', 'concentracao', 'molaridade',
    'diluição', 'diluicao', 'mistura', 'soluto', 'solvente',
    'propriedades coligativas', 'tonoscopia', 'ebulioscopia', 'crioscopia', 'osmose',
    'ph', 'poh', 'ácido', 'acido', 'base', 'ácido-base', 'acido-base',
    'ka', 'kb', 'hidrólise', 'hidrolise', 'tampão', 'tampao', 'neutralização',
    'gases', 'lei dos gases', 'pv=nrt', 'pressão parcial', 'pressao parcial',
    'radioatividade', 'meia-vida', 'fusão nuclear', 'fusao nuclear', 'fissão', 'fissao',
  ],
  // Química Orgânica
  'quimica_organica': [
    'química orgânica', 'quimica organica', 'carbono', 'hidrocarboneto',
    'alcano', 'alceno', 'alcino', 'alcadieno', 'ciclano', 'aromático', 'aromatico',
    'benzeno', 'cadeia carbônica', 'cadeia carbonica', 'isomeria', 'isômero', 'isomero',
    'função orgânica', 'funcao organica', 'álcool', 'alcool', 'fenol', 'éter', 'eter',
    'aldeído', 'aldeido', 'cetona', 'ácido carboxílico', 'acido carboxilico',
    'éster', 'ester', 'amina', 'amida', 'nitrocomposto', 'haleto', 'halogênio',
    'reação de substituição', 'reacao de substituicao', 'reação de adição', 'reacao de adicao',
    'reação de eliminação', 'reacao de eliminacao', 'oxidação de álcoois', 'oxidacao de alcoois',
    'polímero', 'polimero', 'polimerização', 'polimerizacao', 'monômero', 'monomero',
    'plástico', 'plastico', 'borracha', 'nylon', 'pet', 'polietileno',
    'bioquímica', 'bioquimica', 'carboidrato', 'lipídio', 'lipidio', 'proteína', 'proteina',
    'aminoácido', 'aminoacido', 'enzima', 'dna', 'rna', 'nucleotídeo', 'nucleotideo',
    'saponificação', 'saponificacao', 'gordura', 'sabão', 'sabao', 'triglicerídeo',
    'petróleo', 'petroleo', 'destilação fracionada', 'destilacao fracionada', 'gasolina', 'diesel',
    'biodiesel', 'etanol', 'biocombustível', 'biocombustivel',
  ],
  // Química Ambiental
  'quimica_ambiental': [
    'meio ambiente', 'poluição', 'poluicao', 'impacto ambiental',
    'efeito estufa', 'aquecimento global', 'camada de ozônio', 'camada de ozonio',
    'cfc', 'chuva ácida', 'chuva acida', 'dióxido de carbono', 'dioxido de carbono',
    'monóxido de carbono', 'monoxido de carbono', 'metano', 'tratamento de água',
    'tratamento de agua', 'eutrofização', 'eutrofizacao', 'lixo', 'reciclagem',
    'sustentabilidade', 'energia renovável', 'energia renovavel', 'energia limpa',
  ],
};

function inferMacro(text: string): InferenceResult<string> {
  const lower = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos para comparação
  
  // Contagem de matches por macro
  const scores: Record<string, number> = {};
  
  for (const [macro, keywords] of Object.entries(MACRO_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      const keywordNorm = keyword
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(keywordNorm)) {
        score++;
      }
    }
    if (score > 0) {
      scores[macro] = score;
    }
  }
  
  // Encontrar macro com maior score
  let bestMacro: string | undefined;
  let bestScore = 0;
  
  for (const [macro, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestMacro = macro;
    }
  }
  
  if (bestMacro && bestScore >= 1) {
    return { value: bestMacro, inferido: true, metodo: 'analise_palavras_chave' };
  }
  
  return { value: undefined, inferido: false, metodo: 'nao_identificado' };
}

// ============================================
// INFERÊNCIA DE DIFICULDADE POR ANÁLISE DE TEXTO
// ============================================

function inferDificuldade(text: string): InferenceResult<'facil' | 'medio' | 'dificil'> {
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  
  // Indicadores de dificuldade alta
  const indicadoresDificil = [
    'considere', 'analise criticamente', 'discuta', 'avalie',
    'compare e contraste', 'demonstre', 'justifique',
    'explique detalhadamente', 'elabore', 'correlacione',
    'mecanismo', 'intermediário', 'complexo', 'multietapa',
  ];
  
  // Indicadores de dificuldade baixa
  const indicadoresFacil = [
    'defina', 'cite', 'liste', 'nomeie', 'identifique',
    'qual é', 'qual o', 'o que é', 'o que significa',
    'assinale a alternativa', 'marque a opção',
  ];
  
  let scoreDificil = 0;
  let scoreFacil = 0;
  
  for (const ind of indicadoresDificil) {
    if (lower.includes(ind)) scoreDificil++;
  }
  
  for (const ind of indicadoresFacil) {
    if (lower.includes(ind)) scoreFacil++;
  }
  
  // Palavras longas também indicam complexidade
  if (wordCount > 150) scoreDificil += 2;
  else if (wordCount > 80) scoreDificil++;
  else if (wordCount < 30) scoreFacil++;
  
  if (scoreDificil >= 2) {
    return { value: 'dificil', inferido: true, metodo: 'analise_complexidade' };
  } else if (scoreFacil >= 2 || wordCount < 25) {
    return { value: 'facil', inferido: true, metodo: 'analise_complexidade' };
  }
  
  // Fallback: médio
  return { value: 'medio', inferido: true, metodo: 'fallback_medio' };
}

function extractTextFromHtml(html: string): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function parseAlternativesFromHtml(html: string): { options: { id: string; text: string }[]; correctAnswer: string } {
  const options: { id: string; text: string }[] = [];
  let correctAnswer = 'a';
  
  const patterns = [
    /\(?([A-Ea-e])\)?\s*[\.\)\-]?\s*([^(A-E][^\n]+?)(?=\(?[A-Ea-e]\)|$)/gi,
    /<li[^>]*>\s*\(?([A-Ea-e])\)?\s*[\.\)\-]?\s*(.*?)<\/li>/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const letter = match[1].toLowerCase();
      const text = extractTextFromHtml(match[2]);
      if (text.trim()) {
        options.push({ id: letter, text: text.trim() });
      }
    }
    if (options.length >= 2) break;
  }
  
  const correctPatterns = [
    /\(?([A-Ea-e])\)?\s*[\.\)\-]?\s*✓/i,
    /\(?([A-Ea-e])\)?\s*[\.\)\-]?\s*\[x\]/i,
    /resposta[:\s]+\(?([A-Ea-e])\)?/i,
    /gabarito[:\s]+\(?([A-Ea-e])\)?/i,
    /correta[:\s]+\(?([A-Ea-e])\)?/i,
  ];
  
  for (const pattern of correctPatterns) {
    const match = html.match(pattern);
    if (match) {
      correctAnswer = match[1].toLowerCase();
      break;
    }
  }
  
  return { options, correctAnswer };
}

function generateQuestionId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const QuestionImportDialog = memo(function QuestionImportDialog({
  open,
  onClose,
  onSuccess,
}: QuestionImportDialogProps) {
  // UI Step (upload | mapping | preview | importing | resultado)
  const [uiStep, setUiStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'resultado'>('upload');
  
  // STATE MACHINE - Fluxo Controlado
  const [flowState, setFlowState] = useState<ImportFlowState | null>(null);
  
  // Dados
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  
  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  // Resultado final da importação
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    camposInferidos: string[];
    camposNull: string[];
  } | null>(null);
  
  // UI state
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'valid' | 'warning' | 'error'>('all');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  
  // AUTORIZAÇÃO EXPLÍCITA (checkbox obrigatório)
  const [humanAuthorization, setHumanAuthorization] = useState(false);
  
  // Defaults globais OPCIONAIS (não forçados automaticamente)
  const [globalDefaults, setGlobalDefaults] = useState({
    banca: '' as string,
    ano: '' as '' | number,
    difficulty: '' as '' | 'facil' | 'medio' | 'dificil',
    macro: '',
    micro: '',
    tema: '',
    subtema: '',
  });
  
  const { macros, getMicrosForSelect, getTemasForSelect, getSubtemasForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();

  // ============================================
  // ESTATÍSTICAS
  // ============================================
  
  const stats: ImportStats = useMemo(() => {
    const valid = parsedQuestions.filter(q => q.status === 'valid').length;
    const warnings = parsedQuestions.filter(q => q.status === 'warning').length;
    const errors = parsedQuestions.filter(q => q.status === 'error').length;
    const selected = parsedQuestions.filter(q => q.selected).length;
    const camposInferidos = parsedQuestions.reduce((acc, q) => acc + q.campos_inferidos.length, 0);
    const camposNull = parsedQuestions.reduce((acc, q) => acc + q.campos_null.length, 0);
    
    return { total: parsedQuestions.length, valid, warnings, errors, selected, camposInferidos, camposNull };
  }, [parsedQuestions]);

  const filteredQuestions = useMemo(() => {
    if (filterStatus === 'all') return parsedQuestions;
    if (filterStatus === 'ready') return parsedQuestions.filter(q => q.status !== 'error');
    return parsedQuestions.filter(q => q.status === filterStatus);
  }, [parsedQuestions, filterStatus]);

  // ============================================
  // VALIDAÇÃO DE ESTADO PARA BOTÕES / GATES
  // ============================================

  const mappingValid = useMemo(() => {
    return Object.values(columnMapping).includes('question_text');
  }, [columnMapping]);

  const canProcess = useMemo(() => {
    // Condição única: estado === autorizacao_explicita
    return (
      flowState === 'autorizacao_explicita' &&
      humanAuthorization === true &&
      parsedQuestions.length > 0 &&
      stats.selected > 0
    );
  }, [flowState, humanAuthorization, parsedQuestions.length, stats.selected]);

  // Reset autorização quando questões mudam
  useEffect(() => {
    setHumanAuthorization(false);
  }, [parsedQuestions]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[IMPORT] handleFileSelect triggered');
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      console.log('[IMPORT] No file selected');
      return;
    }

    console.log('[IMPORT] File selected:', selectedFile.name, selectedFile.size, 'bytes');
    setFile(selectedFile);
    setIsProcessing(true);
    setFlowState('arquivo_carregado');

    try {
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      const isCsv = selectedFile.name.endsWith('.csv');
      const isTxt = selectedFile.name.endsWith('.txt');

      let data: Record<string, any>[] = [];
      let detectedHeaders: string[] = [];

      if (isExcel || isCsv) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];
        
        if (data.length > 0) {
          detectedHeaders = (data[0] as any[]).map(h => String(h || '').trim());
          data = data.slice(1).map(row => {
            const obj: Record<string, any> = {};
            detectedHeaders.forEach((header, i) => {
              obj[header] = (row as any[])[i];
            });
            return obj;
          }).filter(row => Object.values(row).some(v => v));
        }
      } else if (isTxt) {
        const text = await selectedFile.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const delimiter = lines[0].includes('\t') ? '\t' : ',';
          detectedHeaders = lines[0].split(delimiter).map(h => h.trim());
          data = lines.slice(1).map(line => {
            const values = line.split(delimiter);
            const obj: Record<string, any> = {};
            detectedHeaders.forEach((header, i) => {
              obj[header] = values[i]?.trim() || '';
            });
            return obj;
          });
        }
      }

      setRawData(data);
      setHeaders(detectedHeaders);
      
      // Auto-detectar mapeamento
      const autoMapping: Record<string, string> = {};
      detectedHeaders.forEach(header => {
        const mapped = findColumnMapping(header);
        if (mapped) autoMapping[header] = mapped;
      });
      setColumnMapping(autoMapping);
      
      console.log('[IMPORT] Headers detected:', detectedHeaders);
      console.log('[IMPORT] Auto mapping:', autoMapping);
      console.log('[IMPORT] Data rows:', data.length);
      
      if (data.length > 0) {
        setUiStep('mapping');
        toast.success(`${data.length} linhas detectadas no arquivo`);
      } else {
        toast.error('Nenhum dado encontrado no arquivo');
        setFlowState(null);
      }
    } catch (err) {
      console.error('[IMPORT] Erro ao processar arquivo:', err);
      toast.error('Erro ao processar arquivo: ' + (err instanceof Error ? err.message : String(err)));
      setFlowState(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const input = document.getElementById('file-import-input') as HTMLInputElement;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  // ============================================
  // PROCESSAMENTO COM INFERÊNCIA RASTREÁVEL
  // ============================================

  const processQuestions = useCallback(() => {
    if (!Object.values(columnMapping).includes('question_text')) {
      toast.error('Mapeie a coluna "Enunciado" para continuar');
      return;
    }

    setIsProcessing(true);
    setFlowState('inferencia_em_execucao');
    
    // Simular delay para mostrar estado
    setTimeout(() => {
      try {
        const questions: ParsedQuestion[] = rawData.map((row, index) => {
          const camposInferidos: string[] = [];
          const camposNull: string[] = [];
          
          // Inicializar questão com TUDO undefined/null
          const question: ParsedQuestion = {
            id: generateQuestionId(),
            question_text: '',
            options: [],
            correct_answer: 'a',
            explanation: undefined,
            difficulty: undefined,
            banca: undefined,
            ano: undefined,
            origem: undefined,
            macro: undefined,
            micro: undefined,
            tema: undefined,
            subtema: undefined,
            tags: undefined,
            competencia_enem: undefined,
            habilidade_enem: undefined,
            nivel_cognitivo: undefined,
            tempo_medio_segundos: undefined,
            multidisciplinar: undefined,
            imagens_enunciado: undefined,
            imagens_alternativas: undefined,
            tipo_imagem: undefined,
            // Controle Editorial - SEMPRE
            is_active: false,
            status_revisao: 'rascunho',
            // Rastreabilidade
            campos_inferidos: [],
            campos_null: [],
            // Status
            status: 'pending',
            errors: [],
            warnings: [],
            selected: true,
            rawData: row,
          };

          // ============================================
          // MAPEAR CAMPOS EXPLÍCITOS DAS COLUNAS
          // ============================================
          
          for (const [header, field] of Object.entries(columnMapping)) {
            const value = row[header];
            if (value === undefined || value === null || String(value).trim() === '') continue;

            switch (field) {
              case 'question_text':
                question.question_text = extractTextFromHtml(String(value));
                if (String(value).includes('<')) {
                  const { options, correctAnswer } = parseAlternativesFromHtml(String(value));
                  if (options.length >= 2) {
                    question.options = options;
                    question.correct_answer = correctAnswer;
                  }
                }
                break;
              case 'option_a':
              case 'option_b':
              case 'option_c':
              case 'option_d':
              case 'option_e':
                const optionId = field.replace('option_', '');
                const existing = question.options.find(o => o.id === optionId);
                if (existing) {
                  existing.text = extractTextFromHtml(String(value));
                } else {
                  question.options.push({ id: optionId, text: extractTextFromHtml(String(value)) });
                }
                break;
              case 'correct_answer':
                question.correct_answer = parseCorrectAnswer(value);
                break;
              case 'explanation':
                question.explanation = extractTextFromHtml(String(value));
                break;
              case 'difficulty':
                question.difficulty = parseDifficulty(value);
                break;
              case 'banca':
                question.banca = String(value).trim().toLowerCase() || undefined;
                break;
              case 'ano':
                const anoVal = parseInt(String(value).trim(), 10);
                question.ano = Number.isFinite(anoVal) ? anoVal : undefined;
                break;
              case 'macro':
                question.macro = String(value).trim() || undefined;
                break;
              case 'micro':
                question.micro = String(value).trim() || undefined;
                break;
              case 'tema':
                question.tema = String(value).trim() || undefined;
                break;
              case 'subtema':
                question.subtema = String(value).trim() || undefined;
                break;
              case 'tags':
                question.tags = String(value).split(/[,;]/).map(t => t.trim()).filter(t => t);
                break;
              case 'competencia_enem':
                question.competencia_enem = String(value).trim() || undefined;
                break;
              case 'habilidade_enem':
                question.habilidade_enem = String(value).trim() || undefined;
                break;
            }
          }

          // ============================================
          // INFERÊNCIA POR CAMPO (CONTRATO PARTE 3)
          // ============================================
          
          const enunciado = question.question_text || '';

          // BANCA: analise_textual_por_questao, fallback = autoral_prof_moises
          if (!question.banca) {
            const bancaResult = inferBanca(enunciado);
            if (bancaResult.value) {
              question.banca = bancaResult.value;
              if (bancaResult.inferido) camposInferidos.push(`banca:${bancaResult.metodo}`);
            }
          }

          // ANO: coluna_ano_ou_texto, fallback = null
          if (!question.ano) {
            const anoResult = inferAno(enunciado);
            if (anoResult.value) {
              question.ano = anoResult.value;
              if (anoResult.inferido) camposInferidos.push(`ano:${anoResult.metodo}`);
            } else {
              camposNull.push('ano');
            }
          }

          // NIVEL_COGNITIVO: analise_de_verbo_e_estrutura, fallback = null
          if (!question.nivel_cognitivo) {
            const nivelResult = inferNivelCognitivo(enunciado);
            if (nivelResult.value) {
              question.nivel_cognitivo = nivelResult.value;
              camposInferidos.push(`nivel_cognitivo:${nivelResult.metodo}`);
            } else {
              camposNull.push('nivel_cognitivo');
            }
          }

          // TEMPO_MEDIO: inferir_por_dificuldade, fallback = 120
          if (!question.tempo_medio_segundos) {
            const tempoResult = inferTempoMedio(question.difficulty);
            question.tempo_medio_segundos = tempoResult.value;
            camposInferidos.push(`tempo_medio_segundos:${tempoResult.metodo}`);
          }

          // ORIGEM: baseado na banca
          if (!question.origem) {
            const origemResult = inferOrigem(question.banca);
            question.origem = origemResult.value;
            if (origemResult.inferido) camposInferidos.push(`origem:${origemResult.metodo}`);
          }

          // TIPO_IMAGEM: fallback = ilustrativa (se houver imagens)
          // Por enquanto, sem imagens detectadas
          
          // COMPETENCIA/HABILIDADE: só se existir coluna (já mapeado acima)
          if (!question.competencia_enem) camposNull.push('competencia_enem');
          if (!question.habilidade_enem) camposNull.push('habilidade_enem');
          
          // ============================================
          // INFERÊNCIA DE MACRO POR PALAVRAS-CHAVE
          // ============================================
          if (!question.macro) {
            const macroResult = inferMacro(enunciado);
            if (macroResult.value) {
              question.macro = macroResult.value;
              camposInferidos.push(`macro:${macroResult.metodo}`);
            } else {
              camposNull.push('macro');
            }
          }
          
          // Micro/tema/subtema dependem de taxonomia dinâmica - só marcar como null
          if (!question.micro) camposNull.push('micro');
          if (!question.tema) camposNull.push('tema');
          if (!question.subtema) camposNull.push('subtema');
          
          // ============================================
          // INFERÊNCIA DE DIFICULDADE
          // ============================================
          if (!question.difficulty) {
            const diffResult = inferDificuldade(enunciado);
            if (diffResult.value) {
              question.difficulty = diffResult.value;
              camposInferidos.push(`difficulty:${diffResult.metodo}`);
            } else {
              camposNull.push('difficulty');
            }
          }

          // Ordenar alternativas
          const existingIds = question.options.map(o => o.id);
          const allIds = ['a', 'b', 'c', 'd', 'e'];
          for (const id of allIds) {
            if (!existingIds.includes(id)) {
              question.options.push({ id, text: '' });
            }
          }
          question.options.sort((a, b) => a.id.localeCompare(b.id));

          // Registrar rastreabilidade
          question.campos_inferidos = camposInferidos;
          question.campos_null = camposNull;

          // ============================================
          // VALIDAÇÃO
          // ============================================
          
          if (!question.question_text.trim()) {
            question.errors.push('Enunciado vazio');
          }
          
          const filledOptions = question.options.filter(o => o.text.trim());
          if (filledOptions.length < 2) {
            question.errors.push('Menos de 2 alternativas preenchidas');
          }

          const correctOption = question.options.find(o => o.id === question.correct_answer);
          if (!correctOption?.text.trim()) {
            question.errors.push('Alternativa correta não tem texto');
          }

          // Warnings (somente o que realmente exige ação manual)
          // Banca e Ano: quando ausentes, aplicamos defaults silenciosos (zero trabalho extra)

          if (!question.macro) {
            question.warnings.push('Macro não identificado - classificação manual necessária');
          } else if (question.campos_inferidos?.some(c => c.startsWith('macro:'))) {
            question.warnings.push(`Macro inferido automaticamente: ${question.macro}`);
          }
          if (question.campos_inferidos?.some(c => c.startsWith('difficulty:'))) {
            question.warnings.push(`Dificuldade inferida: ${question.difficulty}`);
          }

          // Definir status
          if (question.errors.length > 0) {
            question.status = 'error';
            question.selected = false;
          } else if (question.warnings.length > 0) {
            question.status = 'warning';
          } else {
            question.status = 'valid';
          }

          return question;
        });

        console.log('[IMPORT] Questões processadas:', questions.length);
        setParsedQuestions(questions);
        console.log('[IMPORT] setFlowState(inferencia_concluida)');
        setFlowState('inferencia_concluida');
        console.log('[IMPORT] setUiStep(preview)');
        setUiStep('preview');
        
        // Avançar para validação humana
        setTimeout(() => {
          console.log('[IMPORT] setFlowState(validacao_humana_obrigatoria)');
          setFlowState('validacao_humana_obrigatoria');
        }, 100);
        
        const validCount = questions.filter(q => q.status !== 'error').length;
        toast.success(`Inferência concluída: ${validCount} questões prontas para revisão`);
        toast.message('As questões ainda NÃO foram salvas. Para persistir, confirme e clique em “Finalizar Import”.');
      } catch (err) {
        console.error('Erro ao processar questões:', err);
        toast.error('Erro ao processar questões');
        setFlowState('arquivo_carregado');
      } finally {
        setIsProcessing(false);
      }
    }, 500);
  }, [rawData, columnMapping]);

  const toggleSelectAll = useCallback((selected: boolean) => {
    setParsedQuestions(prev => prev.map(q => ({
      ...q,
      selected: q.status !== 'error' ? selected : false,
    })));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setParsedQuestions(prev => prev.map(q => 
      q.id === id && q.status !== 'error' 
        ? { ...q, selected: !q.selected } 
        : q
    ));
  }, []);

  const updateQuestion = useCallback((id: string, updates: Partial<ParsedQuestion>) => {
    setParsedQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      
      const updated = { ...q, ...updates };
      
      // Revalidar
      updated.errors = [];
      updated.warnings = [];
      
      if (!updated.question_text.trim()) {
        updated.errors.push('Enunciado vazio');
      }
      
      const filledOptions = updated.options.filter(o => o.text.trim());
      if (filledOptions.length < 2) {
        updated.errors.push('Menos de 2 alternativas preenchidas');
      }

      const correctOption = updated.options.find(o => o.id === updated.correct_answer);
      if (!correctOption?.text.trim()) {
        updated.errors.push('Alternativa correta não tem texto');
      }

      // Banca/Ano: defaults silenciosos (sem aviso)
      // Mantemos warnings apenas para campos que realmente travam seu objetivo (taxonomia)


      if (updated.errors.length > 0) {
        updated.status = 'error';
        updated.selected = false;
      } else if (updated.warnings.length > 0) {
        updated.status = 'warning';
      } else {
        updated.status = 'valid';
      }
      
      return updated;
    }));
  }, []);

  const applyGlobalDefaults = useCallback(() => {
    if (!globalDefaults.banca && !globalDefaults.ano && !globalDefaults.macro && !globalDefaults.difficulty) {
      toast.info('Nenhum valor padrão definido para aplicar');
      return;
    }

    setParsedQuestions(prev => prev.map(q => {
      const updated = { ...q };
      const newInferidos = [...q.campos_inferidos];
      const newNull = [...q.campos_null];
      
      if (globalDefaults.banca && !q.banca) {
        updated.banca = globalDefaults.banca;
        newInferidos.push('banca:aplicado_manual');
        const idx = newNull.indexOf('banca');
        if (idx > -1) newNull.splice(idx, 1);
      }
      if (typeof globalDefaults.ano === 'number' && !q.ano) {
        updated.ano = globalDefaults.ano;
        newInferidos.push('ano:aplicado_manual');
        const idx = newNull.indexOf('ano');
        if (idx > -1) newNull.splice(idx, 1);
      }
      if (globalDefaults.macro && !q.macro) {
        updated.macro = globalDefaults.macro;
        newInferidos.push('macro:aplicado_manual');
        const idx = newNull.indexOf('macro');
        if (idx > -1) newNull.splice(idx, 1);
      }
      if (globalDefaults.difficulty && !q.difficulty) {
        updated.difficulty = globalDefaults.difficulty;
        newInferidos.push('difficulty:aplicado_manual');
        const idx = newNull.indexOf('difficulty');
        if (idx > -1) newNull.splice(idx, 1);
      }
      
      updated.campos_inferidos = newInferidos;
      updated.campos_null = newNull;
      
      // Revalidar warnings
      updated.warnings = [];
      if (!updated.banca || updated.banca === 'autoral_prof_moises') {
        updated.warnings.push('Banca não identificada');
      }
      if (!updated.ano) updated.warnings.push('Ano não identificado');
      
      if (updated.errors.length > 0) {
        updated.status = 'error';
      } else if (updated.warnings.length > 0) {
        updated.status = 'warning';
      } else {
        updated.status = 'valid';
      }
      
      return updated;
    }));
    
    toast.success('Valores padrão aplicados às questões com campos vazios!');
  }, [globalDefaults]);

  // ============================================
  // IMPORTAÇÃO FINAL
  // ============================================

  const handleImport = useCallback(async () => {
    if (!canProcess) {
      toast.error('Autorização explícita necessária para importar');
      return;
    }

    const toImport = parsedQuestions.filter(q => q.selected && q.status !== 'error');
    
    if (toImport.length === 0) {
      toast.error('Nenhuma questão selecionada para importar');
      return;
    }

    setUiStep('importing');
    setImportProgress(0);

    let imported = 0;
    let failed = 0;

    for (let i = 0; i < toImport.length; i++) {
      const q = toImport[i];
      
      try {
        // RESULTADO FINAL OBRIGATÓRIO DO CONTRATO
        const payload = {
          question_text: q.question_text,
          question_type: 'multiple_choice',
          options: q.options.filter(o => o.text.trim()).map(o => ({ id: o.id, text: o.text })),
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          difficulty: q.difficulty || null,
          banca: q.banca || null,
          ano: q.ano || null,
          macro: q.macro || null,
          micro: q.micro || null,
          tema: q.tema || null,
          subtema: q.subtema || null,
          tags: q.tags || [],
          points: 10,
          // IMPORTAÇÃO DIRETA - Questões já entram ATIVAS e PUBLICADAS
          is_active: true,
          status_revisao: 'publicada',
          // Metadados pedagógicos
          tempo_medio_segundos: q.tempo_medio_segundos || 120,
          nivel_cognitivo: q.nivel_cognitivo || null,
          origem: q.origem || 'autoral_prof_moises',
          competencia_enem: q.competencia_enem || null,
          habilidade_enem: q.habilidade_enem || null,
          // Rastreabilidade
          campos_inferidos: q.campos_inferidos,
        };

        const { error } = await supabase
          .from('quiz_questions')
          .insert([payload as any]);

        if (error) throw error;
        imported++;
      } catch (err) {
        console.error('Erro ao importar questão:', err);
        failed++;
      }

      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    // Consolidar campos inferidos e null únicos
    const allInferidos = new Set<string>();
    const allNull = new Set<string>();
    toImport.forEach(q => {
      q.campos_inferidos.forEach(c => allInferidos.add(c.split(':')[0]));
      q.campos_null.forEach(c => allNull.add(c));
    });

    // Salvar resultado e ir para estado terminal
    setImportResult({
      imported,
      failed,
      camposInferidos: Array.from(allInferidos),
      camposNull: Array.from(allNull),
    });
    setFlowState('importacao_concluida');
    setUiStep('resultado');
  }, [canProcess, parsedQuestions]);

  const reset = useCallback(() => {
    setUiStep('upload');
    setFlowState(null);
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setColumnMapping({});
    setParsedQuestions([]);
    setImportProgress(0);
    setExpandedQuestion(null);
    setEditingQuestion(null);
    setFilterStatus('all');
    setHumanAuthorization(false);
    setImportResult(null);
    setGlobalDefaults({
      banca: '',
      ano: '',
      difficulty: '',
      macro: '',
      micro: '',
      tema: '',
      subtema: '',
    });
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(98vw,90rem)] max-w-none max-h-[95vh] overflow-hidden flex flex-col min-h-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <span>Importar Questões</span>
            <Badge variant="outline" className="ml-2">
              {uiStep === 'upload' && 'Upload'}
              {uiStep === 'mapping' && 'Mapeamento'}
              {uiStep === 'preview' && 'Validação Humana'}
              {uiStep === 'importing' && 'Importando...'}
              {uiStep === 'resultado' && 'Concluído'}
            </Badge>
            {flowState && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {flowState.replace(/_/g, ' ')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Importe questões com inferência rastreável. Campos não identificados permanecerão vazios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            {/* STEP 1: UPLOAD */}
            {uiStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col items-center justify-center p-8"
              >
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="w-full max-w-lg p-12 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => document.getElementById('file-import-input')?.click()}
                >
                  <input
                    id="file-import-input"
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col items-center gap-4 text-center">
                    {isProcessing ? (
                      <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    ) : (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                        <FileSpreadsheet className="h-12 w-12 text-primary" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-semibold">
                        {isProcessing ? 'Processando...' : 'Arraste o arquivo aqui'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        ou clique para selecionar
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="outline" className="gap-1">
                        <FileSpreadsheet className="h-3 w-3" />
                        Excel
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        CSV
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        TXT
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Regras do contrato */}
                <div className="mt-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 max-w-lg">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold text-sm">Regras de Importação</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Campos não identificáveis permanecerão <strong>NULL</strong></li>
                    <li>• Nenhum valor padrão será forçado automaticamente</li>
                    <li>• Questões serão importadas como <strong>RASCUNHO</strong> (inativas)</li>
                    <li>• Autorização explícita será exigida antes da importação</li>
                  </ul>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Não tem um arquivo? Baixe nosso template:
                  </p>
                  <Button variant="outline" size="sm" onClick={() => {
                    const template = [
                      ['Pergunta', 'A', 'B', 'C', 'D', 'E', 'Resposta', 'Explicação', 'Dificuldade', 'Banca', 'Ano', 'Macro', 'Micro', 'Tema'],
                      ['Qual é o símbolo do elemento Ouro?', 'Au', 'Ag', 'Fe', 'Cu', 'Zn', 'A', 'O símbolo Au vem do latim Aurum', 'Fácil', 'ENEM', '2023', 'Ciências da Natureza', 'Química', 'Tabela Periódica'],
                    ];
                    const ws = XLSX.utils.aoa_to_sheet(template);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Questões');
                    XLSX.writeFile(wb, 'template_questoes.xlsx');
                    toast.success('Template baixado!');
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Template Excel
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: MAPPING */}
            {uiStep === 'mapping' && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col overflow-hidden min-h-0"
              >
                <div className="flex items-center justify-between p-4 border-b gap-3">
                  <div>
                    <h3 className="font-semibold">Mapeamento de Colunas</h3>
                    <p className="text-sm text-muted-foreground">
                      {rawData.length} linhas • {headers.length} colunas detectadas
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {!mappingValid && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertOctagon className="h-3 w-3" />
                        Mapear “Enunciado”
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      {Object.keys(columnMapping).length} auto-detectadas
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {flowState}
                    </Badge>

                    {/* CTA redundante (topo) para evitar loop de tela sem avanço */}
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!mappingValid) {
                          console.log('[IMPORT] CTA topo bloqueado: mapping inválido');
                          toast.error('Mapeie a coluna "Enunciado" para continuar');
                          return;
                        }
                        console.log('[IMPORT] CTA topo: processQuestions()');
                        processQuestions();
                      }}
                      disabled={!mappingValid || isProcessing}
                      className="whitespace-nowrap"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processando…
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Executar Inferência
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 min-h-0 pb-44">
                  <div className="min-w-[1100px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {headers.map(header => (
                        <div key={header} className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            {header}
                            {columnMapping[header] && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </Label>
                          <Select
                            value={columnMapping[header] || '_skip'}
                            onValueChange={(v) => {
                              if (v === '_skip') {
                                const { [header]: _, ...rest } = columnMapping;
                                setColumnMapping(rest);
                              } else {
                                setColumnMapping(prev => ({ ...prev, [header]: v }));
                              }
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Pular" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="_skip">— Pular —</SelectItem>
                              <SelectItem value="question_text">📝 Enunciado</SelectItem>
                              <SelectItem value="option_a">🅰️ Alternativa A</SelectItem>
                              <SelectItem value="option_b">🅱️ Alternativa B</SelectItem>
                              <SelectItem value="option_c">©️ Alternativa C</SelectItem>
                              <SelectItem value="option_d">🅳 Alternativa D</SelectItem>
                              <SelectItem value="option_e">🅴 Alternativa E</SelectItem>
                              <SelectItem value="correct_answer">✅ Resposta Correta</SelectItem>
                              <SelectItem value="explanation">💡 Explicação</SelectItem>
                              <SelectItem value="difficulty">📊 Dificuldade</SelectItem>
                              <SelectItem value="banca">🏛️ Banca</SelectItem>
                              <SelectItem value="ano">📅 Ano</SelectItem>
                              <SelectItem value="macro">🎯 Macro</SelectItem>
                              <SelectItem value="micro">📚 Micro</SelectItem>
                              <SelectItem value="tema">📖 Tema</SelectItem>
                              <SelectItem value="subtema">📑 Subtema</SelectItem>
                              <SelectItem value="tags">🏷️ Tags</SelectItem>
                              <SelectItem value="competencia_enem">🎓 Competência ENEM</SelectItem>
                              <SelectItem value="habilidade_enem">📐 Habilidade ENEM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {/* Valores Padrão (OPCIONAIS) */}
                    <div className="mt-8 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                      <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="h-4 w-4 text-blue-500" />
                        <h4 className="font-semibold text-blue-600 dark:text-blue-400">Valores Padrão (opcionais - aplicar manualmente depois)</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Estes valores <strong>NÃO serão aplicados automaticamente</strong>. Use "Aplicar Padrões" na próxima tela.
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Banca</Label>
                          <Select
                            value={globalDefaults.banca || '_none'}
                            onValueChange={(v) => setGlobalDefaults(prev => ({ ...prev, banca: v === '_none' ? '' : v }))}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="— Não definir —" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] z-[9999]">
                              <SelectItem value="_none">— Não definir —</SelectItem>
                              {Object.entries(BANCAS_POR_CATEGORIA).map(([categoria, bancas]) => (
                                <div key={categoria}>
                                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                    {CATEGORIA_LABELS[categoria as keyof typeof CATEGORIA_LABELS]}
                                  </div>
                                  {bancas.map(b => (
                                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Ano</Label>
                          <Input
                            type="number"
                            min={1990}
                            max={new Date().getFullYear() + 1}
                            value={globalDefaults.ano}
                            placeholder="(não definir)"
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (!raw) {
                                setGlobalDefaults(prev => ({ ...prev, ano: '' }));
                                return;
                              }
                              const parsed = parseInt(raw, 10);
                              setGlobalDefaults(prev => ({ ...prev, ano: Number.isFinite(parsed) ? parsed : '' }));
                            }}
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Dificuldade</Label>
                          <Select
                            value={globalDefaults.difficulty || '_none'}
                            onValueChange={(v) => setGlobalDefaults(prev => ({ ...prev, difficulty: v === '_none' ? '' : v as any }))}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="— Não definir —" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="_none">— Não definir —</SelectItem>
                              <SelectItem value="facil">🟢 Fácil</SelectItem>
                              <SelectItem value="medio">🟡 Médio</SelectItem>
                              <SelectItem value="dificil">🔴 Difícil</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Macro</Label>
                          <Select
                            value={globalDefaults.macro || '_none'}
                            onValueChange={(v) => setGlobalDefaults(prev => ({ ...prev, macro: v === '_none' ? '' : v, micro: '', tema: '', subtema: '' }))}
                            disabled={taxonomyLoading}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="— Não definir —" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="_none">— Não definir —</SelectItem>
                              {macros.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-2 text-sm">Preview dos dados (primeiras 3 linhas)</h4>
                      <div className="overflow-x-auto rounded border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {headers.map(h => (
                                <TableHead key={h} className="text-xs whitespace-nowrap">
                                  {h}
                                  {columnMapping[h] && (
                                    <span className="ml-1 text-primary">→ {columnMapping[h]}</span>
                                  )}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rawData.slice(0, 3).map((row, i) => (
                              <TableRow key={i}>
                                {headers.map(h => (
                                  <TableCell key={h} className="text-xs max-w-[200px] truncate">
                                    {String(row[h] || '').slice(0, 50)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="sticky bottom-0 z-20 p-4 border-t bg-background/80 backdrop-blur">
                  <Button variant="outline" onClick={reset}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      if (!mappingValid) {
                        console.log('[IMPORT] CTA rodapé bloqueado: mapping inválido');
                        toast.error('Mapeie a coluna "Enunciado" para continuar');
                        return;
                      }
                      console.log('[IMPORT] CTA rodapé: processQuestions()');
                      processQuestions();
                    }}
                    disabled={!mappingValid || isProcessing}
                    className="bg-gradient-to-r from-primary to-purple-600"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Executando Inferência...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Executar Inferência
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* STEP 3: PREVIEW (VALIDAÇÃO HUMANA) */}
            {uiStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col overflow-hidden min-h-0"
              >
                {/* Stats bar */}
                <div className="flex items-center justify-between p-4 border-b gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      <FileQuestion className="h-3 w-3" />
                      {stats.total} total
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {stats.valid} sem avisos
                    </Badge>
                    {stats.warnings > 0 && (
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.warnings} avisos
                      </Badge>
                    )}
                    {stats.errors > 0 && (
                      <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1">
                        <XCircle className="h-3 w-3" />
                        {stats.errors} erros
                      </Badge>
                    )}
                    <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1">
                      <Sparkles className="h-3 w-3" />
                      {stats.camposInferidos} inferidos
                    </Badge>
                    <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 gap-1">
                      <AlertOctagon className="h-3 w-3" />
                      {stats.camposNull} null
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                      <SelectTrigger className="w-[170px] h-8 text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="ready">Prontas (sem erros)</SelectItem>
                        <SelectItem value="valid">Sem avisos</SelectItem>
                        <SelectItem value="warning">Com Aviso</SelectItem>
                        <SelectItem value="error">Com Erro</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="sm" onClick={applyGlobalDefaults}>
                      <Wand2 className="h-3 w-3 mr-1" />
                      Aplicar Padrões
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSelectAll(stats.selected !== stats.valid + stats.warnings)}
                    >
                      {stats.selected === stats.valid + stats.warnings ? (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Desmarcar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selecionar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Questions list */}
                <div className="flex-1 overflow-auto min-h-0">
                  <div className="p-4 pb-44 space-y-2 min-w-[980px]">
                    {filteredQuestions.map((q, index) => (
                      <Card
                        key={q.id}
                        className={cn(
                          "transition-all",
                          q.status === 'valid' && "border-green-500/30",
                          q.status === 'warning' && "border-yellow-500/30",
                          q.status === 'error' && "border-red-500/30 opacity-60",
                          q.selected && "ring-2 ring-primary/50"
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={q.selected}
                              onCheckedChange={() => toggleSelect(q.id)}
                              disabled={q.status === 'error'}
                              className="mt-1"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-mono text-muted-foreground">
                                  #{index + 1}
                                </span>
                                
                                {q.status === 'valid' && (
                                  <Badge className="bg-green-500/20 text-green-500 text-[10px] h-5">
                                    <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                    Válida
                                  </Badge>
                                )}
                                {q.status === 'warning' && (
                                  <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px] h-5">
                                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                    Aviso
                                  </Badge>
                                )}
                                {q.status === 'error' && (
                                  <Badge className="bg-red-500/20 text-red-500 text-[10px] h-5">
                                    <XCircle className="h-2.5 w-2.5 mr-1" />
                                    Erro
                                  </Badge>
                                )}
                                
                                {/* Campos Inferidos */}
                                {q.campos_inferidos.length > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge className="bg-blue-500/20 text-blue-500 text-[10px] h-5 cursor-help">
                                          <Sparkles className="h-2.5 w-2.5 mr-1" />
                                          {q.campos_inferidos.length} inferidos
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-xs space-y-1">
                                          {q.campos_inferidos.map((c, i) => (
                                            <div key={i} className="text-blue-400">• {c}</div>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                {/* Campos NULL */}
                                {q.campos_null.length > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge className="bg-orange-500/20 text-orange-500 text-[10px] h-5 cursor-help">
                                          <AlertOctagon className="h-2.5 w-2.5 mr-1" />
                                          {q.campos_null.length} null
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-xs space-y-1">
                                          {q.campos_null.map((c, i) => (
                                            <div key={i} className="text-orange-400">• {c}</div>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                {/* Metadados */}
                                {q.banca && (
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] h-5",
                                    q.campos_inferidos.some(c => c.startsWith('banca:')) && "border-blue-500/50 bg-blue-500/10"
                                  )}>
                                    🏛️ {q.banca}
                                  </Badge>
                                )}
                                {q.ano && (
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] h-5",
                                    q.campos_inferidos.some(c => c.startsWith('ano:')) && "border-blue-500/50 bg-blue-500/10"
                                  )}>
                                    📅 {q.ano}
                                  </Badge>
                                )}
                                {q.difficulty && (
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {q.difficulty === 'facil' && '🟢'}
                                    {q.difficulty === 'medio' && '🟡'}
                                    {q.difficulty === 'dificil' && '🔴'}
                                    {' '}{q.difficulty}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm line-clamp-2">
                                {q.question_text || <span className="text-red-500 italic">Enunciado vazio</span>}
                              </p>
                              
                              {/* Erros/Warnings */}
                              {(q.errors.length > 0 || q.warnings.length > 0) && (
                                <div className="mt-2 space-y-1">
                                  {q.errors.map((e, i) => (
                                    <div key={i} className="text-xs text-red-500 flex items-center gap-1">
                                      <XCircle className="h-3 w-3" />
                                      {e}
                                    </div>
                                  ))}
                                  {q.warnings.map((w, i) => (
                                    <div key={i} className="text-xs text-yellow-500 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {w}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                            >
                              {expandedQuestion === q.id ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          {/* Expanded view */}
                          {expandedQuestion === q.id && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div className="grid grid-cols-5 gap-2">
                                {q.options.map(opt => (
                                  <div
                                    key={opt.id}
                                    className={cn(
                                      "p-2 rounded text-xs",
                                      opt.id === q.correct_answer
                                        ? "bg-green-500/20 border border-green-500/30"
                                        : "bg-muted/50"
                                    )}
                                  >
                                    <span className="font-bold uppercase">{opt.id})</span>{' '}
                                    {opt.text || <span className="text-muted-foreground italic">vazio</span>}
                                  </div>
                                ))}
                              </div>
                              
                              {q.explanation && (
                                <div className="p-2 rounded bg-blue-500/10 text-xs">
                                  <strong>Explicação:</strong> {q.explanation}
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-2 text-[10px]">
                                {q.nivel_cognitivo && (
                                  <Badge variant="secondary">🧠 {q.nivel_cognitivo}</Badge>
                                )}
                                {q.tempo_medio_segundos && (
                                  <Badge variant="secondary">⏱️ {q.tempo_medio_segundos}s</Badge>
                                )}
                                {q.origem && (
                                  <Badge variant="secondary">📌 {q.origem}</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Footer com autorização (sempre visível) */}
                <div className="sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4 space-y-4">
                  {/* Resumo final (obrigatório) */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="p-3 rounded-lg border bg-muted/20">
                      <div className="text-xs text-muted-foreground">Total carregadas</div>
                      <div className="text-lg font-semibold">{stats.total}</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/20">
                      <div className="text-xs text-muted-foreground">Campos inferidos</div>
                      <div className="text-lg font-semibold">{stats.camposInferidos}</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/20">
                      <div className="text-xs text-muted-foreground">Campos vazios</div>
                      <div className="text-lg font-semibold">{stats.camposNull}</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/20">
                      <div className="text-xs text-muted-foreground">Warnings</div>
                      <div className="text-lg font-semibold">{stats.warnings}</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/20">
                      <div className="text-xs text-muted-foreground">Selecionadas</div>
                      <div className="text-lg font-semibold">{stats.selected}</div>
                    </div>
                  </div>

                  {/* Checkbox de autorização explícita */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <Checkbox
                      id="human-auth"
                      checked={humanAuthorization}
                      onCheckedChange={(checked) => {
                        setHumanAuthorization(checked === true);
                        if (checked) {
                          setFlowState('autorizacao_explicita');
                        } else {
                          setFlowState('validacao_humana_obrigatoria');
                        }
                      }}
                    />
                    <Label htmlFor="human-auth" className="text-sm cursor-pointer flex-1">
                      <span className="font-semibold text-primary">Autorizo a importação</span>
                      <span className="text-muted-foreground ml-1">
                        — I confirm that I reviewed the inferred data and accept that non-identified fields remain empty.
                      </span>
                    </Label>
                    <ShieldCheck
                      className={cn(
                        "h-5 w-5 transition-colors",
                        humanAuthorization ? "text-green-500" : "text-muted-foreground"
                      )}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUiStep('mapping');
                        setFlowState('arquivo_carregado');
                      }}
                    >
                      <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                      Voltar
                    </Button>
                    <Button
                      onClick={() => {
                        // Mantém sempre clicável para evitar sensação de "não acontece nada"
                        if (!canProcess) {
                          console.log('[IMPORT] Import bloqueado:', {
                            flowState,
                            humanAuthorization,
                            parsedQuestions: parsedQuestions.length,
                            selected: stats.selected,
                          });
                          toast.error('Para importar: marque a confirmação e mantenha ao menos 1 questão selecionada.');
                          // Levar o usuário ao checkbox de autorização
                          document.getElementById('human-auth')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          return;
                        }
                        console.log('[IMPORT] handleImport()');
                        handleImport();
                      }}
                      className={cn(
                        "bg-gradient-to-r",
                        canProcess ? "from-green-600 to-emerald-600" : "from-muted to-muted"
                      )}
                    >
                      {canProcess ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Importar {stats.selected} Questões como Rascunho
                        </>
                      ) : (
                        <>
                          <AlertOctagon className="h-4 w-4 mr-2" />
                          Finalizar Import (exige confirmação)
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </motion.div>
            )}

            {/* STEP 4: IMPORTING */}
            {uiStep === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-8"
              >
                <div className="w-full max-w-md text-center space-y-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 inline-block">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Importando Questões...</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.selected} questões sendo importadas como <strong>RASCUNHO</strong>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-sm font-mono">{importProgress}%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: RESULTADO FINAL (ESTADO TERMINAL) */}
            {uiStep === 'resultado' && importResult && (
              <motion.div
                key="resultado"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center p-8"
              >
                <div className="w-full max-w-2xl space-y-6">
                  {/* Ícone de sucesso */}
                  <div className="text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 inline-block mb-4">
                      <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-500">Importação Concluída!</h2>
                    <p className="text-muted-foreground mt-1">
                      Questões salvas como <strong>RASCUNHO</strong> (is_active: false)
                    </p>
                  </div>

                  {/* Resumo estatístico */}
                  <Card className="border-green-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Resumo Final da Importação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="text-2xl font-bold text-green-500">{importResult.imported}</div>
                          <div className="text-xs text-muted-foreground">Importadas</div>
                        </div>
                        {importResult.failed > 0 && (
                          <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="text-2xl font-bold text-red-500">{importResult.failed}</div>
                            <div className="text-xs text-muted-foreground">Falharam</div>
                          </div>
                        )}
                        <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="text-2xl font-bold text-blue-500">{importResult.camposInferidos.length}</div>
                          <div className="text-xs text-muted-foreground">Campos Inferidos</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="text-2xl font-bold text-orange-500">{importResult.camposNull.length}</div>
                          <div className="text-xs text-muted-foreground">Campos Vazios</div>
                        </div>
                      </div>

                      {/* Detalhes dos campos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {importResult.camposInferidos.length > 0 && (
                          <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-semibold text-blue-500">Campos Inferidos</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {importResult.camposInferidos.map((campo, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-blue-500/10 text-blue-400">
                                  {campo}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {importResult.camposNull.length > 0 && (
                          <div className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertOctagon className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-semibold text-orange-500">Campos Não Identificados</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {importResult.camposNull.map((campo, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-orange-500/10 text-orange-400">
                                  {campo}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status final */}
                      <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="flex items-center gap-2 text-sm">
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                          <span>
                            <strong>Status Final:</strong> Todas as questões foram salvas como{' '}
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                              RASCUNHO
                            </Badge>{' '}
                            e precisam de <strong>revisão editorial</strong> antes de serem publicadas.
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Botão de finalização */}
                  <div className="flex justify-center gap-4">
                    <Button
                      size="lg"
                      onClick={() => {
                        onSuccess();
                        onClose();
                        toast.success('Importação concluída com sucesso. Questões salvas como rascunho.');
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Finalizar Importação
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        reset();
                        toast.info('Pronto para nova importação');
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Nova Importação
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
});
