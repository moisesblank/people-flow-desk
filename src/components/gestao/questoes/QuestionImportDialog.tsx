// ============================================
// 📥 IMPORTADOR DE QUESTÕES - Sistema Completo
// CONTRATO v3.0 - State Machine + Inferência Rastreável
// Visual Futurístico Ano 2300
// ============================================

import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Layers,
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
import QuestionTextField from '@/components/shared/QuestionTextField';
import * as XLSX from 'xlsx';
import { BANCAS, BANCAS_POR_CATEGORIA, CATEGORIA_LABELS, findBancaByValue } from '@/constants/bancas';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';
import { useLogQuestionAIIntervention } from '@/hooks/useLogQuestionAIIntervention';
import { parseWordFile, isWordFile } from '@/lib/parsers/wordQuestionParser';
import { FileType } from 'lucide-react';

// ============================================
// TIPOS E CONSTANTES CRÍTICAS
// ============================================

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE GATE v1.0 — THRESHOLD ABSOLUTO
// A IA SÓ pode preencher campos NULL se confidence >= 0.80
// Se confidence < 0.80, o campo DEVE permanecer NULL forever
// ═══════════════════════════════════════════════════════════════════════════════
const AI_CONFIDENCE_THRESHOLD = 0.80;

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
  options: { id: string; text: string; image_url?: string }[];
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
  image_url?: string;
  image_urls?: string[]; // NOVO: Múltiplas imagens do enunciado
  imagens_enunciado?: string[];
  imagens_alternativas?: Record<string, string>;
  tipo_imagem?: 'ilustrativa' | 'essencial' | 'decorativa';
  // Controle Editorial
  is_active: boolean;
  status_revisao: StatusRevisao;
  // RASTREABILIDADE
  campos_inferidos: string[];
  campos_null: string[];
  // ═══════════════════════════════════════════════════════════════════════════════
  // CONFIDENCE TRACKING: Score de confiança da IA (0-1)
  // Usado para auditoria e para aplicar o CONFIDENCE GATE (>= 0.80)
  // ═══════════════════════════════════════════════════════════════════════════════
  ai_confidence?: number;
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
  onSuccess: (importedCount?: number) => void;
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

  // Imagens das alternativas (NOVO PADRÃO)
  image_a: ['imagem_a', 'image_a', 'img_a', 'figura_a', 'imagem_alternativa_a', 'image_option_a'],
  image_b: ['imagem_b', 'image_b', 'img_b', 'figura_b', 'imagem_alternativa_b', 'image_option_b'],
  image_c: ['imagem_c', 'image_c', 'img_c', 'figura_c', 'imagem_alternativa_c', 'image_option_c'],
  image_d: ['imagem_d', 'image_d', 'img_d', 'figura_d', 'imagem_alternativa_d', 'image_option_d'],
  image_e: ['imagem_e', 'image_e', 'img_e', 'figura_e', 'imagem_alternativa_e', 'image_option_e'],

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
  
  // Imagem ÚNICA do enunciado (legacy)
  image_url: ['imagem', 'image', 'image_url', 'imagem_url', 'img', 'foto', 'figura', 'picture', 'url_imagem', 'imagem_enunciado'],
  
  // MÚLTIPLAS imagens do enunciado (imagem_1, imagem_2, imagem_3... até 10)
  image_1: ['imagem_1', 'image_1', 'img_1', 'figura_1', 'imagem_enunciado_1', 'image_enunciado_1'],
  image_2: ['imagem_2', 'image_2', 'img_2', 'figura_2', 'imagem_enunciado_2', 'image_enunciado_2'],
  image_3: ['imagem_3', 'image_3', 'img_3', 'figura_3', 'imagem_enunciado_3', 'image_enunciado_3'],
  image_4: ['imagem_4', 'image_4', 'img_4', 'figura_4', 'imagem_enunciado_4', 'image_enunciado_4'],
  image_5: ['imagem_5', 'image_5', 'img_5', 'figura_5', 'imagem_enunciado_5', 'image_enunciado_5'],
  image_6: ['imagem_6', 'image_6', 'img_6', 'figura_6', 'imagem_enunciado_6', 'image_enunciado_6'],
  image_7: ['imagem_7', 'image_7', 'img_7', 'figura_7', 'imagem_enunciado_7', 'image_enunciado_7'],
  image_8: ['imagem_8', 'image_8', 'img_8', 'figura_8', 'imagem_enunciado_8', 'image_enunciado_8'],
  image_9: ['imagem_9', 'image_9', 'img_9', 'figura_9', 'imagem_enunciado_9', 'image_enunciado_9'],
  image_10: ['imagem_10', 'image_10', 'img_10', 'figura_10', 'imagem_enunciado_10', 'image_enunciado_10'],
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
  
  // Dados - MÚLTIPLOS ARQUIVOS
  const [files, setFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileResults, setFileResults] = useState<{ name: string; rows: number; status: 'pending' | 'processing' | 'done' | 'error'; error?: string }[]>([]);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  
  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [batchMode, setBatchMode] = useState(false);
  
  // Resultado final da importação
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    camposInferidos: string[];
    camposNull: string[];
    filesProcessed: number;
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

  // QUESTION_DOMAIN: Agrupamento pós-importação (SIMULADOS ou MODO_TREINO)
  type QuestionGroup = 'SIMULADOS' | 'MODO_TREINO';
  const [selectedGroup, setSelectedGroup] = useState<QuestionGroup>('MODO_TREINO');
  
  // ESTILO DA QUESTÃO: Seleção obrigatória antes de processar
  type QuestionStyle = 'multiple_choice' | 'discursive' | 'outros' | '';
  const [selectedStyle, setSelectedStyle] = useState<QuestionStyle>('');
  
  // MACRO/MICRO/TEMA/SUBTEMA/DIFICULDADE OBRIGATÓRIOS: Pré-seleção antes de processar
  const [selectedMacro, setSelectedMacro] = useState<string>('');
  const [selectedMicro, setSelectedMicro] = useState<string>('');
  const [selectedTema, setSelectedTema] = useState<string>('');
  const [selectedSubtema, setSelectedSubtema] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  
  const { macros, getMicrosForSelect, getTemasForSelect, getSubtemasForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();
  
  // Micros filtrados pelo macro selecionado
  const filteredMicros = useMemo(() => {
    if (!selectedMacro || selectedMacro === '__AUTO_AI__') return [];
    return getMicrosForSelect(selectedMacro);
  }, [selectedMacro, getMicrosForSelect]);
  
  // Temas filtrados pelo micro selecionado
  const filteredTemas = useMemo(() => {
    if (!selectedMicro || selectedMicro === '__AUTO_AI__') return [];
    return getTemasForSelect(selectedMicro);
  }, [selectedMicro, getTemasForSelect]);
  
  // Subtemas filtrados pelo tema selecionado
  const filteredSubtemas = useMemo(() => {
    if (!selectedTema || selectedTema === '__AUTO_AI__') return [];
    return getSubtemasForSelect(selectedTema);
  }, [selectedTema, getSubtemasForSelect]);
  
  // Reset micro, tema e subtema quando macro muda
  useEffect(() => {
    setSelectedMicro('');
    setSelectedTema('');
    setSelectedSubtema('');
  }, [selectedMacro]);
  
  // Reset tema e subtema quando micro muda
  useEffect(() => {
    setSelectedTema('');
    setSelectedSubtema('');
  }, [selectedMicro]);
  
  // Reset subtema quando tema muda
  useEffect(() => {
    setSelectedSubtema('');
  }, [selectedTema]);
  
  // ============================================
  // LEI SUPREMA: Funções para converter VALUE → LABEL (NUNCA expor VALUE)
  // ============================================
  const getMacroLabel = useCallback((value: string): string => {
    if (!value || value === '__AUTO_AI__' || value === '__TODOS__') return '';
    const found = macros.find(m => m.value === value);
    return found?.label || 'Carregando...';
  }, [macros]);

  const getMicroLabel = useCallback((value: string): string => {
    if (!value || value === '__AUTO_AI__' || value === '__TODOS__') return '';
    const found = filteredMicros.find(m => m.value === value);
    return found?.label || 'Carregando...';
  }, [filteredMicros]);

  const getTemaLabel = useCallback((value: string): string => {
    if (!value || value === '__AUTO_AI__' || value === '__TODOS__') return '';
    const found = filteredTemas.find(t => t.value === value);
    return found?.label || 'Carregando...';
  }, [filteredTemas]);

  const getSubtemaLabel = useCallback((value: string): string => {
    if (!value || value === '__AUTO_AI__' || value === '__TODOS__') return '';
    const found = filteredSubtemas.find(s => s.value === value);
    return found?.label || 'Carregando...';
  }, [filteredSubtemas]);
  
  // Hook para registrar intervenções de IA
  const { logInterventions } = useLogQuestionAIIntervention();

  // Garantia P0: zero trabalho manual no "Finalizar Import"
  const hasAutoAuthorizedRef = useRef(false);

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

  // Reset autorização apenas quando inicia um novo ciclo (não a cada mudança de seleção)
  useEffect(() => {
    if (uiStep === 'preview') return;
    setHumanAuthorization(false);
    hasAutoAuthorizedRef.current = false;
  }, [uiStep]);

  // Garantia P0: seleção automática (zero trabalho manual)
  useEffect(() => {
    if (uiStep !== 'preview') return;
    if (parsedQuestions.length === 0) return;

    const anySelected = parsedQuestions.some((q) => q.status !== 'error' && q.selected);
    if (!anySelected) {
      setParsedQuestions((prev) => prev.map((q) => ({ ...q, selected: q.status !== 'error' })));
    }

    // Garantia P0: autorização automática 1x por ciclo (evita travar no "nada acontece")
    if (!hasAutoAuthorizedRef.current) {
      setHumanAuthorization(true);
      setFlowState('autorizacao_explicita');
      hasAutoAuthorizedRef.current = true;
    }
  }, [uiStep, parsedQuestions]);

  // ============================================
  // HANDLERS
  // ============================================

  // Função para processar um único arquivo (Excel, CSV, TXT ou Word)
  const parseFileUniversal = useCallback(async (file: File): Promise<{ data: Record<string, any>[]; headers: string[]; warnings?: string[] }> => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');
    const isTxt = file.name.endsWith('.txt');
    const isWord = isWordFile(file);

    let data: Record<string, any>[] = [];
    let detectedHeaders: string[] = [];
    let warnings: string[] = [];

    // NOVO: Suporte a Word (.docx)
    if (isWord) {
      console.log('[IMPORT] Processando arquivo Word:', file.name);
      const wordResult = await parseWordFile(file);
      data = wordResult.data;
      detectedHeaders = wordResult.headers;
      warnings = wordResult.warnings;
      
      if (warnings.length > 0) {
        console.log('[IMPORT] Avisos do parser Word:', warnings);
      }
    } else if (isExcel || isCsv) {
      const buffer = await file.arrayBuffer();
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
      const text = await file.text();
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

    return { data, headers: detectedHeaders, warnings };
  }, []);

  // Handler para seleção de MÚLTIPLOS arquivos
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[IMPORT] handleFileSelect triggered');
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      console.log('[IMPORT] No files selected');
      return;
    }

    const fileArray = Array.from(selectedFiles);
    console.log('[IMPORT] Files selected:', fileArray.length);
    
    setFiles(fileArray);
    setBatchMode(fileArray.length > 1);
    setFileResults(fileArray.map(f => ({ name: f.name, rows: 0, status: 'pending' as const })));
    setIsProcessing(true);
    setFlowState('arquivo_carregado');

    try {
      // Processar TODOS os arquivos e combinar dados
      let allData: Record<string, any>[] = [];
      let combinedHeaders: string[] = [];
      const results: typeof fileResults = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setCurrentFileIndex(i);
        
        try {
          const { data, headers: fileHeaders, warnings } = await parseFileUniversal(file);
          
          // Se houver avisos do parser (especialmente Word), exibir
          if (warnings && warnings.length > 0) {
            warnings.forEach(w => console.warn(`[IMPORT] Aviso ${file.name}:`, w));
          }
          
          // Na primeira iteração, usar os headers como base
          if (i === 0) {
            combinedHeaders = fileHeaders;
          }
          
          allData = [...allData, ...data];
          results.push({ name: file.name, rows: data.length, status: 'done' });
          
          console.log(`[IMPORT] File ${i + 1}/${fileArray.length}: ${file.name} - ${data.length} rows`);
        } catch (err) {
          console.error(`[IMPORT] Error processing ${file.name}:`, err);
          results.push({ 
            name: file.name, 
            rows: 0, 
            status: 'error', 
            error: err instanceof Error ? err.message : String(err) 
          });
        }
        
        setFileResults([...results]);
      }

      setRawData(allData);
      setHeaders(combinedHeaders);
      
      // Auto-detectar mapeamento
      const autoMapping: Record<string, string> = {};
      combinedHeaders.forEach(header => {
        const mapped = findColumnMapping(header);
        if (mapped) autoMapping[header] = mapped;
      });
      setColumnMapping(autoMapping);
      
      const successCount = results.filter(r => r.status === 'done').length;
      const totalRows = results.reduce((acc, r) => acc + r.rows, 0);
      
      console.log('[IMPORT] Headers detected:', combinedHeaders);
      console.log('[IMPORT] Auto mapping:', autoMapping);
      console.log('[IMPORT] Total data rows:', allData.length);
      
      if (allData.length > 0) {
        setUiStep('mapping');
        toast.success(`✅ ${successCount}/${fileArray.length} arquivos processados • ${totalRows} questões detectadas`, {
          duration: 5000,
        });
      } else {
        toast.error('Nenhum dado encontrado nos arquivos');
        setFlowState(null);
      }
    } catch (err) {
      console.error('[IMPORT] Erro ao processar arquivos:', err);
      toast.error('Erro ao processar arquivos: ' + (err instanceof Error ? err.message : String(err)));
      setFlowState(null);
    } finally {
      setIsProcessing(false);
    }
  }, [parseFileUniversal]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const input = document.getElementById('file-import-input') as HTMLInputElement;
      if (input) {
        const dt = new DataTransfer();
        // Suportar múltiplos arquivos
        Array.from(droppedFiles).forEach(file => dt.items.add(file));
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  // ============================================
  // INFERÊNCIA INTELIGENTE VIA IA (SYNAPSE Ω)
  // ============================================
  
  const [aiInferenceEnabled, setAiInferenceEnabled] = useState(true);
  const [aiInferenceProgress, setAiInferenceProgress] = useState(0);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // MODO AGENTE v3.0 — COMPLETUDE OBRIGATÓRIA
  // A IA preenche TODOS os campos vazios (MICRO, TEMA, SUBTEMA, difficulty, banca, ano, explanation)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  interface AIAgentResult {
    macro: string;
    micro: string;
    tema: string;
    subtema: string;
    difficulty: string;
    banca: string;
    ano: number;
    explanation: string;
    confidence: number;
    reasoning: string;
    fields_inferred: string[];
    corrections: string[];
  }
  
  const callAITaxonomyInference = useCallback(async (questions: ParsedQuestion[]): Promise<Map<string, AIAgentResult>> => {
    const results = new Map<string, AIAgentResult>();
    
    // Preparar payload COMPLETO para a IA (MODO AGENTE)
    const questionsForAI = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      suggested_macro: q.macro,
      suggested_micro: q.micro,
      suggested_tema: q.tema,
      suggested_subtema: q.subtema,
      suggested_difficulty: q.difficulty,
      suggested_banca: q.banca,
      suggested_ano: q.ano,
    }));
    
    try {
      console.log(`🤖 [AGENT MODE] Chamando inferência COMPLETA para ${questionsForAI.length} questões...`);
      
      const { data, error } = await supabase.functions.invoke('infer-question-taxonomy', {
        body: { questions: questionsForAI }
      });
      
      if (error) {
        console.error('❌ [AGENT] Erro na inferência:', error);
        throw error;
      }
      
        if (data?.results) {
        for (const result of data.results) {
          const confidence = result.confidence || 0;
          const meetsThreshold = confidence >= AI_CONFIDENCE_THRESHOLD;
          
          // ═══════════════════════════════════════════════════════════════════
          // CONFIDENCE GATE: Só aplicar valores inferidos se confidence >= 0.80
          // Campos com confidence < 0.80 ficam UNDEFINED (serão NULL no banco)
          // ═══════════════════════════════════════════════════════════════════
          results.set(result.id, {
            macro: meetsThreshold ? result.macro : undefined,
            micro: meetsThreshold ? result.micro : undefined,
            tema: meetsThreshold ? result.tema : undefined,
            subtema: meetsThreshold ? result.subtema : undefined,
            difficulty: meetsThreshold ? result.difficulty : undefined,
            banca: meetsThreshold ? result.banca : undefined,
            ano: meetsThreshold ? result.ano : undefined,
            explanation: meetsThreshold ? result.explanation : undefined,
            confidence: confidence,
            reasoning: result.reasoning || '',
            fields_inferred: meetsThreshold ? (result.fields_inferred || []) : [],
            corrections: result.corrections || [],
          });
          
          if (!meetsThreshold) {
            console.log(`⚠️ [CONFIDENCE GATE] Questão ${result.id}: confidence ${(confidence * 100).toFixed(1)}% < 80% — inferência BLOQUEADA, campos ficam NULL`);
          }
        }
        
        const stats = data.stats || {};
        console.log(`✅ [AGENT] Completude garantida para ${results.size} questões.`);
        console.log(`   📊 Campos inferidos: ${stats.total_fields_inferred || 0}`);
        console.log(`   🔧 Questões com inferência: ${stats.questions_with_inference || 0}`);
        console.log(`   🎯 Confidence média: ${((stats.average_confidence || 0) * 100).toFixed(1)}%`);
      }
    } catch (err) {
      console.error('❌ [AGENT] Falha na inferência inteligente:', err);
      toast.error('Falha na inferência de IA - aplicando fallbacks');
    }
    
    return results;
  }, []);

  // ============================================
  // PROCESSAMENTO COM INFERÊNCIA RASTREÁVEL
  // ============================================

  const processQuestions = useCallback(async () => {
    if (!Object.values(columnMapping).includes('question_text')) {
      toast.error('Mapeie a coluna "Enunciado" para continuar');
      return;
    }

    setIsProcessing(true);
    setFlowState('inferencia_em_execucao');
    
    try {
      // FASE 1: Parse inicial das colunas do Excel
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
          image_url: undefined,
          image_urls: [],
          imagens_enunciado: undefined,
          imagens_alternativas: undefined,
          tipo_imagem: undefined,
          is_active: true,
          status_revisao: 'publicado',
          campos_inferidos: [],
          campos_null: [],
          status: 'pending',
          errors: [],
          warnings: [],
          selected: true,
          rawData: row,
        };

        // MAPEAR CAMPOS EXPLÍCITOS DAS COLUNAS
        for (const [header, field] of Object.entries(columnMapping)) {
          const value = row[header];
          if (value === undefined || value === null || String(value).trim() === '') continue;

          switch (field) {
            case 'question_text':
              let questionText = String(value);
              const imagemMatch = questionText.match(/\[IMAGEM:\s*(https?:\/\/[^\]\s]+)\]/i);
              if (imagemMatch && imagemMatch[1]) {
                question.image_url = imagemMatch[1].trim();
                questionText = questionText.replace(/\[IMAGEM:\s*https?:\/\/[^\]]+\]/gi, '').trim();
              }
              question.question_text = extractTextFromHtml(questionText);
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
            case 'image_url':
              let url = String(value).trim();
              url = url.replace(/^\[/, '').replace(/\]$/, '');
              question.image_url = url || undefined;
              break;
            case 'image_1':
            case 'image_2':
            case 'image_3':
            case 'image_4':
            case 'image_5':
            case 'image_6':
            case 'image_7':
            case 'image_8':
            case 'image_9':
            case 'image_10':
              let multiImgUrl = String(value).trim();
              multiImgUrl = multiImgUrl.replace(/^\[/, '').replace(/\]$/, '');
              if (multiImgUrl && !question.image_urls?.includes(multiImgUrl)) {
                question.image_urls = [...(question.image_urls || []), multiImgUrl];
              }
              break;
            case 'image_a':
            case 'image_b':
            case 'image_c':
            case 'image_d':
            case 'image_e':
              const imgOptionId = field.replace('image_', '');
              let imgUrl = String(value).trim();
              imgUrl = imgUrl.replace(/^\[/, '').replace(/\]$/, '');
              if (imgUrl) {
                const existingOpt = question.options.find(o => o.id === imgOptionId);
                if (existingOpt) {
                  existingOpt.image_url = imgUrl;
                } else {
                  question.options.push({ id: imgOptionId, text: '', image_url: imgUrl });
                }
              }
              break;
          }
        }

        // INFERÊNCIA LOCAL (campos simples)
        const enunciado = question.question_text || '';

        if (!question.banca) {
          const bancaResult = inferBanca(enunciado);
          if (bancaResult.value) {
            question.banca = bancaResult.value;
            if (bancaResult.inferido) camposInferidos.push(`banca:${bancaResult.metodo}`);
          }
        }

        if (!question.ano) {
          const anoResult = inferAno(enunciado);
          if (anoResult.value) {
            question.ano = anoResult.value;
            if (anoResult.inferido) camposInferidos.push(`ano:${anoResult.metodo}`);
          } else {
            camposNull.push('ano');
          }
        }

        if (!question.nivel_cognitivo) {
          const nivelResult = inferNivelCognitivo(enunciado);
          if (nivelResult.value) {
            question.nivel_cognitivo = nivelResult.value;
            camposInferidos.push(`nivel_cognitivo:${nivelResult.metodo}`);
          } else {
            camposNull.push('nivel_cognitivo');
          }
        }

        if (!question.tempo_medio_segundos) {
          const tempoResult = inferTempoMedio(question.difficulty);
          question.tempo_medio_segundos = tempoResult.value;
          camposInferidos.push(`tempo_medio_segundos:${tempoResult.metodo}`);
        }

        if (!question.origem) {
          const origemResult = inferOrigem(question.banca);
          question.origem = origemResult.value;
          if (origemResult.inferido) camposInferidos.push(`origem:${origemResult.metodo}`);
        }

        if (!question.competencia_enem) camposNull.push('competencia_enem');
        if (!question.habilidade_enem) camposNull.push('habilidade_enem');
        
        // INFERÊNCIA LOCAL DE MACRO (palavras-chave)
        if (!question.macro) {
          const macroResult = inferMacro(enunciado);
          if (macroResult.value) {
            question.macro = macroResult.value;
            camposInferidos.push(`macro:${macroResult.metodo}`);
          } else {
            camposNull.push('macro');
          }
        }
        
        if (!question.micro) camposNull.push('micro');
        if (!question.tema) camposNull.push('tema');
        if (!question.subtema) camposNull.push('subtema');
        
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

        question.campos_inferidos = camposInferidos;
        question.campos_null = camposNull;

        return question;
      });

      console.log('[IMPORT] Parse inicial:', questions.length, 'questões');

      // FASE 2: INFERÊNCIA INTELIGENTE VIA IA (se habilitada)
      let finalQuestions = questions;
      
      if (aiInferenceEnabled && questions.length > 0) {
        toast.info('🧠 Iniciando inferência inteligente de taxonomia via IA...');
        setAiInferenceProgress(10);
        
        const aiResults = await callAITaxonomyInference(questions);
        setAiInferenceProgress(80);
        
        // Aplicar resultados da IA (MODO AGENTE COMPLETO)
        finalQuestions = questions.map(q => {
          const aiResult = aiResults.get(q.id);
          if (!aiResult) return q;
          
          const updated = { ...q };
          const newInferidos = [...q.campos_inferidos];
          
          // ═══════════════════════════════════════════════════════════════════
          // SOBERANIA DO USUÁRIO v1.0 — CONFIDENCE GATE ABSOLUTO
          // IA SÓ preenche campos NULL se confidence >= 80%
          // Se confidence < 80%, o campo fica NULL forever
          // ═══════════════════════════════════════════════════════════════════
          
          const confidence = aiResult.confidence || 0;
          const meetsThreshold = confidence >= AI_CONFIDENCE_THRESHOLD;
          
          // SALVAR CONFIDENCE NO OBJETO PARA AUDITORIA
          updated.ai_confidence = confidence;
          
          // Log do gate
          if (!meetsThreshold) {
            console.log(`⚠️ [CONFIDENCE GATE] Questão ${q.id}: ${(confidence * 100).toFixed(1)}% < 80% — campos ficam NULL`);
          }
          
          // ═══════════════════════════════════════════════════════════════════
          // MACRO (apenas se vazio E confidence >= 80%)
          // ═══════════════════════════════════════════════════════════════════
          if (!q.macro && aiResult.macro && meetsThreshold) {
            updated.macro = aiResult.macro;
            newInferidos.push('macro:ai_inference');
          } else if (!q.macro && aiResult.macro && !meetsThreshold) {
            // NULL PRESERVATION: Confidence baixo, não preenche
            updated.warnings.push(`⚠️ MACRO sugerido pela IA: ${aiResult.macro} (confidence ${(confidence * 100).toFixed(0)}% < 80% — NÃO APLICADO)`);
          }
          
          // ═══════════════════════════════════════════════════════════════════
          // MICRO (apenas se vazio E confidence >= 80%)
          // ═══════════════════════════════════════════════════════════════════
          if (!q.micro && aiResult.micro && meetsThreshold) {
            updated.micro = aiResult.micro;
            newInferidos.push('micro:ai_inference');
          } else if (!q.micro && aiResult.micro && !meetsThreshold) {
            updated.warnings.push(`⚠️ MICRO sugerido pela IA: ${aiResult.micro} (confidence ${(confidence * 100).toFixed(0)}% < 80% — NÃO APLICADO)`);
          } else if (q.micro && aiResult.micro && q.micro !== aiResult.micro && meetsThreshold) {
            // Correção de valor existente APENAS com confidence alto
            updated.warnings.push(`IA corrigiu MICRO: ${q.micro} → ${aiResult.micro}`);
            updated.micro = aiResult.micro;
          }
          
          // ═══════════════════════════════════════════════════════════════════
          // TEMA (apenas se vazio E confidence >= 80%)
          // ═══════════════════════════════════════════════════════════════════
          if (!q.tema && aiResult.tema && meetsThreshold) {
            updated.tema = aiResult.tema;
            newInferidos.push('tema:ai_inference');
          } else if (!q.tema && aiResult.tema && !meetsThreshold) {
            updated.warnings.push(`⚠️ TEMA sugerido pela IA: ${aiResult.tema} (confidence ${(confidence * 100).toFixed(0)}% < 80% — NÃO APLICADO)`);
          } else if (q.tema && aiResult.tema && q.tema !== aiResult.tema && meetsThreshold) {
            updated.warnings.push(`IA corrigiu TEMA: ${q.tema} → ${aiResult.tema}`);
            updated.tema = aiResult.tema;
          }
          
          // ═══════════════════════════════════════════════════════════════════
          // SUBTEMA (apenas se vazio E confidence >= 80%)
          // ═══════════════════════════════════════════════════════════════════
          if (!q.subtema && aiResult.subtema && meetsThreshold) {
            updated.subtema = aiResult.subtema;
            newInferidos.push('subtema:ai_inference');
          } else if (!q.subtema && aiResult.subtema && !meetsThreshold) {
            updated.warnings.push(`⚠️ SUBTEMA sugerido pela IA: ${aiResult.subtema} (confidence ${(confidence * 100).toFixed(0)}% < 80% — NÃO APLICADO)`);
          } else if (q.subtema && aiResult.subtema && q.subtema !== aiResult.subtema && meetsThreshold) {
            updated.warnings.push(`IA corrigiu SUBTEMA: ${q.subtema} → ${aiResult.subtema}`);
            updated.subtema = aiResult.subtema;
          }
          
          // ═══════════════════════════════════════════════════════════════════
          // DIFICULDADE (apenas se vazio E confidence >= 80%)
          // ═══════════════════════════════════════════════════════════════════
          if (!q.difficulty && aiResult.difficulty && meetsThreshold) {
            updated.difficulty = aiResult.difficulty as 'facil' | 'medio' | 'dificil';
            newInferidos.push('difficulty:ai_inference');
          } else if (!q.difficulty && aiResult.difficulty && !meetsThreshold) {
            updated.warnings.push(`⚠️ DIFICULDADE sugerida pela IA: ${aiResult.difficulty} (confidence ${(confidence * 100).toFixed(0)}% < 80% — NÃO APLICADO)`);
          }
          
          // ═══════════════════════════════════════════════════════════════════
          // BANCA (apenas se vazio E confidence >= 80%)
          // ═══════════════════════════════════════════════════════════════════
          if (!q.banca && aiResult.banca && meetsThreshold) {
            updated.banca = aiResult.banca;
            newInferidos.push('banca:ai_inference');
          } else if (!q.banca && aiResult.banca && !meetsThreshold) {
            updated.warnings.push(`⚠️ BANCA sugerida pela IA: ${aiResult.banca} (confidence ${(confidence * 100).toFixed(0)}% < 80% — NÃO APLICADO)`);
          }
          
          // ═══════════════════════════════════════════════════════════════════
          // ANO (apenas se vazio E confidence >= 80%)
          // ═══════════════════════════════════════════════════════════════════
          if (!q.ano && aiResult.ano && meetsThreshold) {
            updated.ano = aiResult.ano;
            newInferidos.push('ano:ai_inference');
          } else if (!q.ano && aiResult.ano && !meetsThreshold) {
            updated.warnings.push(`⚠️ ANO sugerido pela IA: ${aiResult.ano} (confidence ${(confidence * 100).toFixed(0)}% < 80% — NÃO APLICADO)`);
          }
          
          // ═══════════════════════════════════════════════════════════════════
          // EXPLICAÇÃO (apenas se vazio E confidence >= 80%)
          // ═══════════════════════════════════════════════════════════════════
          if (!q.explanation && aiResult.explanation && meetsThreshold) {
            updated.explanation = aiResult.explanation;
            newInferidos.push('explanation:ai_generated');
          } else if (!q.explanation && aiResult.explanation && !meetsThreshold) {
            updated.warnings.push(`⚠️ EXPLICAÇÃO gerada pela IA (confidence ${(confidence * 100).toFixed(0)}% < 80% — NÃO APLICADO)`);
          }
          
          // Adicionar campos inferidos pela IA ao tracking
          if (aiResult.fields_inferred?.length > 0 && meetsThreshold) {
            for (const field of aiResult.fields_inferred) {
              const key = `${field.toLowerCase()}:ai_inference`;
              if (!newInferidos.includes(key)) {
                // Campo já foi adicionado acima, apenas para logging
              }
            }
          }
          
          // Remover campos null que foram preenchidos
          updated.campos_null = q.campos_null.filter(c => 
            !(c === 'macro' && updated.macro) &&
            !(c === 'micro' && updated.micro) &&
            !(c === 'tema' && updated.tema) &&
            !(c === 'subtema' && updated.subtema) &&
            !(c === 'difficulty' && updated.difficulty) &&
            !(c === 'banca' && updated.banca) &&
            !(c === 'ano' && updated.ano) &&
            !(c === 'explanation' && updated.explanation)
          );
          
          updated.campos_inferidos = newInferidos;
          
          // Adicionar confidence score como metadado
          if (aiResult.confidence < 0.7) {
            updated.warnings.push(`⚠️ Confidence baixo: ${(aiResult.confidence * 100).toFixed(0)}%`);
          }
          
          return updated;
        });
        
        setAiInferenceProgress(100);
        const inferenceCount = finalQuestions.filter(q => 
          q.campos_inferidos.some(c => c.includes('ai_inference') || c.includes('ai_generated'))
        ).length;
        
        if (inferenceCount > 0) {
          toast.success(`🤖 MODO AGENTE: ${inferenceCount} questões completadas pela IA`);
        }
      }

      // FASE 3: VALIDAÇÃO FINAL
      // ═══════════════════════════════════════════════════════════════════
      // CRITÉRIO MÍNIMO ÚNICO: ENUNCIADO NÃO PODE ESTAR VAZIO
      // Todos os outros campos são opcionais (warnings informativos)
      // ═══════════════════════════════════════════════════════════════════
      const validatedQuestions = finalQuestions.map(q => {
        const updated = { ...q };
        updated.errors = [];
        
        // ÚNICO CRITÉRIO OBRIGATÓRIO: Enunciado
        if (!updated.question_text.trim()) {
          updated.errors.push('Enunciado vazio');
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // TODOS OS OUTROS CAMPOS SÃO OPCIONAIS - APENAS WARNINGS
        // ═══════════════════════════════════════════════════════════════════
        
        const filledOptions = updated.options.filter(o => o.text.trim());
        if (filledOptions.length < 2) {
          updated.warnings.push('Menos de 2 alternativas preenchidas');
        }

        const correctOption = updated.options.find(o => o.id === updated.correct_answer);
        if (!correctOption?.text.trim()) {
          updated.warnings.push('Alternativa correta não tem texto');
        }

        if (!updated.macro?.trim()) {
          updated.warnings.push('MACRO não informado (opcional)');
        }
        if (!updated.micro?.trim()) {
          updated.warnings.push('MICRO não informado (opcional)');
        }
        if (!updated.tema?.trim()) {
          updated.warnings.push('TEMA não informado (opcional)');
        }
        if (!updated.subtema?.trim()) {
          updated.warnings.push('SUBTEMA não informado (opcional)');
        }

        // Warnings informativos
        if (updated.campos_inferidos?.some(c => c.includes('ai_inference'))) {
          updated.warnings.push('🧠 Taxonomia validada/corrigida por IA');
        }
        if (updated.campos_inferidos?.some(c => c.startsWith('difficulty:'))) {
          updated.warnings.push(`Dificuldade inferida: ${updated.difficulty}`);
        }

        // Status final
        if (updated.errors.length > 0) {
          updated.status = 'error';
          updated.selected = false;
        } else if (updated.warnings.length > 0) {
          updated.status = 'warning';
          updated.selected = true;
        } else {
          updated.status = 'valid';
          updated.selected = true;
        }

        return updated;
      });

      console.log('[IMPORT] Questões processadas:', validatedQuestions.length);
      setParsedQuestions(validatedQuestions);
      setFlowState('inferencia_concluida');
      setUiStep('preview');
      
      setTimeout(() => {
        if (hasAutoAuthorizedRef.current) return;
        setFlowState('validacao_humana_obrigatoria');
      }, 100);
      
      const validCount = validatedQuestions.filter(q => q.status !== 'error').length;
      const aiCorrected = validatedQuestions.filter(q => 
        q.campos_inferidos.some(c => c.includes('ai_inference'))
      ).length;
      
      toast.success(`✅ Inferência concluída: ${validCount} questões prontas${aiCorrected > 0 ? ` (${aiCorrected} com IA)` : ''}`);
      
    } catch (err) {
      console.error('Erro ao processar questões:', err);
      toast.error('Erro ao processar questões');
      setFlowState('arquivo_carregado');
    } finally {
      setIsProcessing(false);
      setAiInferenceProgress(0);
    }
  }, [rawData, columnMapping, aiInferenceEnabled, callAITaxonomyInference]);

  const toggleSelectAll = useCallback((selected: boolean) => {
    setParsedQuestions(prev => prev.map(q => ({
      ...q,
      selected: q.status !== 'error' ? selected : false,
    })));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setParsedQuestions((prev) =>
      prev.map((q) =>
        q.id === id && q.status !== 'error'
          ? { ...q, selected: !q.selected }
          : q
      )
    );
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
      // Banca/Ano: defaults silenciosos (zero trabalho extra)

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

    const currentYear = new Date().getFullYear();
    const startTime = Date.now();
    
    // ═══════════════════════════════════════════════════════════════════
    // CRIAR HISTÓRICO PRIMEIRO para vincular questões (RASTREABILIDADE v1.0)
    // ═══════════════════════════════════════════════════════════════════
    let importHistoryId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Consolidar campos inferidos e null únicos ANTES de começar
      const allInferidos = new Set<string>();
      const allNull = new Set<string>();
      toImport.forEach(q => {
        q.campos_inferidos.forEach(c => allInferidos.add(c.split(':')[0]));
        q.campos_null.forEach(c => allNull.add(c));
      });
      
      const { data: historyData, error: historyError } = await supabase
        .from('question_import_history')
        .insert({
          imported_by: user?.id,
          file_names: files.map(f => f.name),
          total_files: files.length,
          total_questions: toImport.length,
          imported_count: 0, // Será atualizado ao final
          failed_count: 0,   // Será atualizado ao final
          target_group: selectedGroup,
          campos_inferidos: Array.from(allInferidos),
          campos_null: Array.from(allNull),
          duration_ms: null, // Será atualizado ao final
          status: 'processing',
        })
        .select('id')
        .single();
      
      if (!historyError && historyData) {
        importHistoryId = historyData.id;
        console.log('[IMPORT] Histórico criado:', importHistoryId);
      }
    } catch (historyErr) {
      console.error('Erro ao criar histórico (continuando sem rastreabilidade):', historyErr);
    }
    
    for (let i = 0; i < toImport.length; i++) {
      const q = toImport[i];
      
      try {
        // ═══════════════════════════════════════════════════════════════════
        // POLÍTICA DE COMPLETUDE FINAL v1.0
        // Nenhum campo obrigatório pode ficar null
        // ═══════════════════════════════════════════════════════════════════
        
        const camposInferidos = [...(q.campos_inferidos || [])];
        
        // ═══════════════════════════════════════════════════════════════════
        // PRÉ-SELEÇÃO OBRIGATÓRIA: MACRO e MICRO selecionados no diálogo
        // Esses valores têm PRIORIDADE ABSOLUTA sobre quaisquer outros
        // EXCETO quando selecionado "__AUTO_AI__" (modo automático)
        // ═══════════════════════════════════════════════════════════════════
        
        // MODO AUTOMÁTICO (IA): Se selecionado '__AUTO_AI__', respeitar Excel
        // e deixar para IA preencher campos vazios (já tratado na inferência com threshold 80%)
        const isMacroAutoAI = selectedMacro === '__AUTO_AI__';
        const isMicroAutoAI = selectedMicro === '__AUTO_AI__';
        
        // MACRO: Se modo automático, usar o que veio do Excel/inferência. Se não, usar pré-seleção.
        const macro = isMacroAutoAI 
          ? (q.macro || 'Química Geral') // Respeita Excel, fallback se vazio
          : (selectedMacro || q.macro || 'Química Geral');
        if (!q.macro && isMacroAutoAI) camposInferidos.push('macro:auto_ai_mode');
        if (!isMacroAutoAI && selectedMacro && selectedMacro !== q.macro) camposInferidos.push('macro:pre_selected');
        
        // ═══════════════════════════════════════════════════════════════════
        // MICRO: Se modo automático, usar o que veio do Excel/inferência.
        //        Se __TODOS__, será tratado no batch de importação (multi-micro).
        //        Se não, usar pré-seleção.
        // CORREÇÃO CONSTITUCIONAL: selectedMicro tem prioridade absoluta (exceto __AUTO_AI__ e __TODOS__)
        // ═══════════════════════════════════════════════════════════════════
        const isMicroTodos = selectedMicro === '__TODOS__';
        
        // Se TODOS, o micro será o primeiro da lista como "âncora", mas a questão terá associação multi-micro
        const micro = isMicroAutoAI 
          ? (q.micro || '') // Respeita o que já tem no Excel ou inferido pela IA
          : isMicroTodos
            ? (filteredMicros.length > 0 ? filteredMicros[0].value : q.micro || '') // Usa primeiro micro como âncora
            : (selectedMicro || q.micro || '');
        if (!q.micro && isMicroAutoAI) camposInferidos.push('micro:auto_ai_mode');
        if (isMicroTodos) camposInferidos.push(`micro:TODOS(${filteredMicros.length})`);
        if (!isMicroAutoAI && !isMicroTodos && selectedMicro && selectedMicro !== q.micro) camposInferidos.push('micro:pre_selected');
        
        // ═══════════════════════════════════════════════════════════════════
        // TEMA: Se modo automático, usar o que veio do Excel/inferência.
        //       Se __TODOS__, será tratado no batch de importação (multi-tema).
        //       Se não, usar pré-seleção.
        // CORREÇÃO CONSTITUCIONAL: selectedTema tem prioridade absoluta (exceto __AUTO_AI__ e __TODOS__)
        // ═══════════════════════════════════════════════════════════════════
        const isTemaAutoAI = selectedTema === '__AUTO_AI__' || selectedMicro === '__AUTO_AI__';
        const isTemaTodos = selectedTema === '__TODOS__';
        
        // Se TODOS, o tema será o primeiro da lista como "âncora", mas a questão terá associação multi-tema
        const tema = isTemaAutoAI 
          ? (q.tema || '') // Respeita o que já tem no Excel ou inferido pela IA
          : isTemaTodos
            ? (filteredTemas.length > 0 ? filteredTemas[0].value : q.tema || '') // Usa primeiro tema como âncora
            : (selectedTema || q.tema || '');
        if (!q.tema && isTemaAutoAI) camposInferidos.push('tema:auto_ai_mode');
        if (isTemaTodos) camposInferidos.push(`tema:TODOS(${filteredTemas.length})`);
        if (!isTemaAutoAI && !isTemaTodos && selectedTema && selectedTema !== q.tema) camposInferidos.push('tema:pre_selected');
        
        // ═══════════════════════════════════════════════════════════════════
        // SUBTEMA: Se modo automático, usar o que veio do Excel/inferência. Se não, usar pré-seleção.
        // CORREÇÃO CONSTITUCIONAL: selectedSubtema tem prioridade absoluta (exceto __AUTO_AI__)
        // ═══════════════════════════════════════════════════════════════════
        const isSubtemaAutoAI = selectedSubtema === '__AUTO_AI__' || selectedTema === '__AUTO_AI__' || selectedMicro === '__AUTO_AI__';
        const subtema = isSubtemaAutoAI 
          ? (q.subtema || '') // Respeita o que já tem no Excel ou inferido pela IA
          : (selectedSubtema || q.subtema || '');
        if (!q.subtema && isSubtemaAutoAI) camposInferidos.push('subtema:auto_ai_mode');
        if (!isSubtemaAutoAI && selectedSubtema && selectedSubtema !== q.subtema) camposInferidos.push('subtema:pre_selected');
        
        // ═══════════════════════════════════════════════════════════════════
        // DIFICULDADE: SOBERANIA ABSOLUTA DO USUÁRIO
        // 1. Se usuário selecionou dificuldade → USA ESSA (prioridade máxima)
        // 2. Se __AUTO_AI__ → usa do Excel/inferência SE existir
        // 3. Se nenhum dos dois → NULL (não força fallback)
        // ═══════════════════════════════════════════════════════════════════
        const isDifficultyAutoAI = selectedDifficulty === '__AUTO_AI__' || !selectedDifficulty;
        let difficulty: 'facil' | 'medio' | 'dificil' | null;
        
        if (!isDifficultyAutoAI && selectedDifficulty) {
          // Usuário selecionou explicitamente → SOBERANIA ABSOLUTA
          difficulty = selectedDifficulty as 'facil' | 'medio' | 'dificil';
          if (selectedDifficulty !== q.difficulty) camposInferidos.push('difficulty:user_selected');
        } else if (q.difficulty) {
          // Veio do Excel ou inferência com confidence >= 80%
          difficulty = q.difficulty;
        } else {
          // NULL PRESERVATION: Sem valor definido = NULL (não força fallback)
          difficulty = null;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // BANCA: SOBERANIA ABSOLUTA DO USUÁRIO
        // Se usuário não selecionou e não há no Excel → NULL (não força "Autoral")
        // ═══════════════════════════════════════════════════════════════════
        const banca = q.banca || null; // Removido fallback forçado
        
        // REGRA: Questões sem ano ficam SEM ANO (null) - NUNCA forçar ano
        const ano = q.ano || null;
        
        // ═══════════════════════════════════════════════════════════════════
        // EXPLANATION: NULL PRESERVATION
        // Se não há explicação → NULL (não força texto genérico)
        // ═══════════════════════════════════════════════════════════════════
        const explanation = q.explanation || null;
        
        // ═══════════════════════════════════════════════════════════════════
        // PAYLOAD FINAL: RESPEITO TOTAL ÀS SELEÇÕES DO USUÁRIO
        // Campos null são aceitos — melhor null que dado inventado
        // ═══════════════════════════════════════════════════════════════════
        const payload = {
          question_text: q.question_text,
          question_type: selectedStyle || 'multiple_choice',
          options: q.options.filter(o => o.text.trim() || o.image_url).map(o => ({ id: o.id, text: o.text, ...(o.image_url && { image_url: o.image_url }) })),
          correct_answer: q.correct_answer,
          explanation: explanation,           // NULL se não informado
          difficulty: difficulty,             // NULL se não definido
          banca: banca,                       // NULL se não informado
          ano: ano,                           // NULL se não informado
          macro: macro,                       // Seleção do usuário ou Excel
          micro: micro,                       // Seleção do usuário ou Excel
          tema: tema,                         // Seleção do usuário ou Excel
          subtema: subtema,                   // Seleção do usuário ou Excel
          tags: [...new Set([...(q.tags || []), selectedGroup])], // QUESTION_DOMAIN: Deduplicado
          points: selectedGroup === 'MODO_TREINO' ? 0 : 10, // MODO_TREINO: 0 pts, SIMULADOS: 10 pts
          // IMPORTAÇÃO DIRETA - Questões já entram ATIVAS e PUBLICADAS
          is_active: true,
          status_revisao: 'publicado',
          // Metadados pedagógicos
          tempo_medio_segundos: q.tempo_medio_segundos || 120,
          nivel_cognitivo: q.nivel_cognitivo || null,
          origem: q.origem || 'autoral_prof_moises',
          // Imagem ÚNICA do enunciado (legacy)
          image_url: q.image_url || null,
          // MÚLTIPLAS imagens do enunciado (NOVO)
          image_urls: q.image_urls && q.image_urls.length > 0 ? q.image_urls : [],
          // Rastreabilidade (inclui fallbacks aplicados)
          campos_inferidos: camposInferidos,
          // RASTREABILIDADE v1.0: Vincular ao histórico de importação
          import_history_id: importHistoryId,
        };

        const { data: insertedData, error } = await supabase
          .from('quiz_questions')
          .insert([payload as any])
          .select('id')
          .single();

        if (error) throw error;
        
        // ═══════════════════════════════════════════════════════════════════
        // REGISTRAR LOGS DE INTERVENÇÃO DE IA
        // ═══════════════════════════════════════════════════════════════════
        // ═══════════════════════════════════════════════════════════════════
        // REGISTRAR LOGS DE INTERVENÇÃO DE IA
        // ═══════════════════════════════════════════════════════════════════
        // CORREÇÃO CONSTITUCIONAL: SÓ registrar log quando há VALOR REAL no AFTER
        // Logs com AFTER vazio são INCONSISTENTES e violam a política de auditoria
        // ═══════════════════════════════════════════════════════════════════
        if (insertedData?.id && camposInferidos.length > 0) {
          const aiLogs = camposInferidos
            // Captura inferências reais (ai_inference) e fallbacks (fallback_*)
            .filter((c) => {
              const [, method] = c.split(':');
              if (!method) return false;
              return (
                method.includes('ai_inference') ||
                method.includes('ai_generated') ||
                method.includes('fallback')
              );
            })
            .map(campo => {
              const [field, method] = campo.split(':');
              const interventionType = method.includes('ai_inference') 
                ? 'AI_CLASSIFICATION_INFERENCE' 
                : method.includes('ai_generated')
                  ? 'AI_ADDITION'
                  : method.includes('fallback')
                    ? 'AI_AUTOFILL'
                    : 'AI_SUGGESTION_APPLIED';
              
              // Obter valor final do banco
              const finalValue = (insertedData as any)[field] ?? (payload as any)[field] ?? '';
              
              return {
                question_id: insertedData.id,
                intervention_type: interventionType as any,
                field_affected: field,
                value_before: null,
                value_after: String(finalValue),
                action_description: `Campo "${field}" inferido como "${String(finalValue).slice(0, 50)}"`,
                source_type: 'import' as const,
                source_file: files[0]?.name || 'importação',
                ai_confidence_score: q.ai_confidence ?? null, // Usa o confidence real da IA
                has_real_value: !!finalValue && String(finalValue).trim() !== '',
              };
            })
            // ═══════════════════════════════════════════════════════════════════
            // FILTRO CRÍTICO: Só registrar logs com VALOR REAL no AFTER
            // ═══════════════════════════════════════════════════════════════════
            .filter(log => log.has_real_value);
          
          if (aiLogs.length > 0) {
            // Remover campo auxiliar antes de enviar
            const cleanLogs = aiLogs.map(({ has_real_value, ...rest }) => rest);
            // Não aguardar para não bloquear a importação
            logInterventions(cleanLogs).catch(err => 
              console.error('[IMPORT] Erro ao registrar logs de IA:', err)
            );
          }
        }
        
        imported++;
      } catch (err) {
        console.error('Erro ao importar questão:', err);
        failed++;
      }

      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    // ═══════════════════════════════════════════════════════════════════
    // ATUALIZAR HISTÓRICO COM RESULTADOS FINAIS
    // ═══════════════════════════════════════════════════════════════════
    if (importHistoryId) {
      try {
        const durationMs = Date.now() - startTime;
        await supabase
          .from('question_import_history')
          .update({
            imported_count: imported,
            failed_count: failed,
            duration_ms: durationMs,
            status: failed === 0 ? 'completed' : imported > 0 ? 'partial' : 'failed',
          })
          .eq('id', importHistoryId);
        console.log('[IMPORT] Histórico atualizado:', { imported, failed, durationMs });
      } catch (historyErr) {
        console.error('Erro ao atualizar histórico:', historyErr);
      }
    }

    // Consolidar campos para resultado (recalcular aqui)
    const finalInferidos = new Set<string>();
    const finalNull = new Set<string>();
    toImport.forEach(q => {
      q.campos_inferidos.forEach(c => finalInferidos.add(c.split(':')[0]));
      q.campos_null.forEach(c => finalNull.add(c));
    });

    // Salvar resultado e ir para estado terminal
    setImportResult({
      imported,
      failed,
      camposInferidos: Array.from(finalInferidos),
      camposNull: Array.from(finalNull),
      filesProcessed: files.length,
    });
    setFlowState('importacao_concluida');
    setUiStep('resultado');
  }, [canProcess, parsedQuestions, selectedGroup, files, logInterventions]); // CRITICAL: selectedGroup, files e logInterventions devem estar nas deps

  const reset = useCallback(() => {
    hasAutoAuthorizedRef.current = false;
    setUiStep('upload');
    setFlowState(null);
    setFiles([]);
    setCurrentFileIndex(0);
    setFileResults([]);
    setBatchMode(false);
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
    setSelectedGroup('MODO_TREINO'); // Reset grupo
    setSelectedStyle(''); // Reset estilo obrigatório
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
      <DialogContent className="w-[min(98vw,90rem)] max-w-none h-[95vh] max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 flex-wrap">
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
            {/* NOME DO ARQUIVO EM EVIDÊNCIA */}
            {files.length > 0 && uiStep !== 'upload' && (
              <Badge className="ml-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 text-sm">
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                {files.length === 1 ? files[0].name : `${files.length} arquivos (${files[currentFileIndex]?.name || '...'})`}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Importe questões com inferência rastreável. Campos não identificados permanecerão vazios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <AnimatePresence mode="wait">
            {/* STEP 1: UPLOAD */}
            {uiStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="min-h-full flex flex-col items-center justify-start p-8 pt-4"
              >
                {/* SELEÇÃO OBRIGATÓRIA: ESTILO + MACRO + MICRO */}
                <div className="w-full max-w-2xl mb-6 space-y-4">
                  {/* Card de Estilo */}
                  <Card className={cn(
                    "border-2 transition-all",
                    selectedStyle ? "border-green-500/50 bg-green-500/5" : "border-amber-500/50 bg-amber-500/5"
                  )}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5 text-primary" />
                        Estilo das Questões
                        <Badge variant={selectedStyle ? "default" : "destructive"} className="ml-auto">
                          {selectedStyle ? '✓ Obrigatório' : '⚠ Obrigatório'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div
                          onClick={() => setSelectedStyle('multiple_choice')}
                          className={cn(
                            "p-4 rounded-lg border-2 cursor-pointer transition-all text-center hover:border-primary/50",
                            selectedStyle === 'multiple_choice' 
                              ? "border-primary bg-primary/10" 
                              : "border-muted-foreground/20"
                          )}
                        >
                          <div className="text-2xl mb-2">✅</div>
                          <h4 className="font-semibold text-sm">Múltipla Escolha</h4>
                          <p className="text-xs text-muted-foreground mt-1">A, B, C, D ou A, B, C, D, E</p>
                        </div>
                        <div
                          onClick={() => setSelectedStyle('discursive')}
                          className={cn(
                            "p-4 rounded-lg border-2 cursor-pointer transition-all text-center hover:border-primary/50",
                            selectedStyle === 'discursive' 
                              ? "border-primary bg-primary/10" 
                              : "border-muted-foreground/20"
                          )}
                        >
                          <div className="text-2xl mb-2">✍️</div>
                          <h4 className="font-semibold text-sm">Discursiva</h4>
                          <p className="text-xs text-muted-foreground mt-1">Sem alternativas, resposta livre</p>
                        </div>
                        <div
                          onClick={() => setSelectedStyle('outros')}
                          className={cn(
                            "p-4 rounded-lg border-2 cursor-pointer transition-all text-center hover:border-primary/50",
                            selectedStyle === 'outros' 
                              ? "border-primary bg-primary/10" 
                              : "border-muted-foreground/20"
                          )}
                        >
                          <div className="text-2xl mb-2">🔢</div>
                          <h4 className="font-semibold text-sm">Outros Tipos</h4>
                          <p className="text-xs text-muted-foreground mt-1">V/F, Soma de Itens, etc.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Card de Taxonomia OBRIGATÓRIA */}
                  <Card className={cn(
                    "border-2 transition-all",
                    (selectedMacro && selectedMicro) ? "border-green-500/50 bg-green-500/5" : "border-amber-500/50 bg-amber-500/5"
                  )}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Brain className="h-5 w-5 text-primary" />
                        Classificação Taxonômica
                        <Badge variant={(selectedMacro && selectedMicro) ? "default" : "destructive"} className="ml-auto">
                          {(selectedMacro && selectedMicro) ? '✓ Obrigatório' : '⚠ Obrigatório'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Todas as questões importadas receberão esta classificação
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* MACRO */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            🎯 Macro Assunto
                            {selectedMacro && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </Label>
                          <Select
                            value={selectedMacro}
                            onValueChange={setSelectedMacro}
                            disabled={taxonomyLoading}
                          >
                            <SelectTrigger className={cn(
                              "h-11",
                              !selectedMacro && "border-amber-500/50"
                            )}>
                              <SelectValue placeholder="Selecione o Macro..." />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {/* OPÇÃO AUTOMÁTICO (IA) - Respeita Excel e só corrige se confiança ≥80% */}
                              <SelectItem value="__AUTO_AI__" className="border-b border-primary/20 mb-1">
                                <span className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-primary">Automático (IA)</span>
                                </span>
                              </SelectItem>
                              {macros.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedMacro === '__AUTO_AI__' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              IA infere MACRO com base no conteúdo. Corrige somente se confiança ≥80%.
                            </p>
                          )}
                        </div>
                        
                        {/* MICRO */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            📚 Micro Assunto
                            {selectedMicro && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </Label>
                          <Select
                            value={selectedMicro}
                            onValueChange={setSelectedMicro}
                            disabled={!selectedMacro || taxonomyLoading}
                          >
                            <SelectTrigger className={cn(
                              "h-11",
                              selectedMacro && !selectedMicro && "border-amber-500/50"
                            )}>
                              <SelectValue placeholder={selectedMacro ? "Selecione o Micro..." : "Primeiro selecione o Macro"} />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {/* OPÇÃO AUTOMÁTICO (IA) - Respeita Excel e só corrige se confiança ≥80% */}
                              <SelectItem value="__AUTO_AI__" className="border-b border-primary/20 mb-1">
                                <span className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-primary">Automático (IA)</span>
                                </span>
                              </SelectItem>
                              {/* OPÇÃO TODOS - Aplica TODOS os micros disponíveis (Constitucional v10.0) */}
                              {filteredMicros.length > 0 && (
                                <SelectItem value="__TODOS__" className="border-b border-emerald-500/30 mb-1 bg-emerald-500/5">
                                  <span className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-emerald-500" />
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">TODOS ({filteredMicros.length} micros)</span>
                                  </span>
                                </SelectItem>
                              )}
                              {filteredMicros.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedMicro === '__AUTO_AI__' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              IA preenche campos vazios. Corrige MICRO/TEMA/SUBTEMA somente se confiança ≥80%.
                            </p>
                          )}
                          {selectedMicro === '__TODOS__' && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                              <Layers className="h-3 w-3" />
                              TODOS os {filteredMicros.length} micros serão associados a cada questão importada.
                            </p>
                          )}
                        </div>
                        
                        {/* TEMA */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            📖 Tema
                            {selectedTema && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </Label>
                          <Select
                            value={selectedTema}
                            onValueChange={setSelectedTema}
                            disabled={!selectedMicro || selectedMicro === '__AUTO_AI__' || taxonomyLoading}
                          >
                            <SelectTrigger className={cn(
                              "h-11",
                              selectedMicro && selectedMicro !== '__AUTO_AI__' && !selectedTema && "border-amber-500/50"
                            )}>
                              <SelectValue placeholder={
                                !selectedMicro 
                                  ? "Primeiro selecione o Micro" 
                                  : selectedMicro === '__AUTO_AI__' 
                                    ? "IA determinará automaticamente" 
                                    : "Selecione o Tema..."
                              } />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {/* OPÇÃO AUTOMÁTICO (IA) - Respeita Excel e só corrige se confiança ≥80% */}
                              <SelectItem value="__AUTO_AI__" className="border-b border-primary/20 mb-1">
                                <span className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-primary">Automático (IA)</span>
                                </span>
                              </SelectItem>
                              {/* OPÇÃO TODOS - Aplica TODOS os temas disponíveis (Constitucional v10.0) */}
                              {filteredTemas.length > 0 && (
                                <SelectItem value="__TODOS__" className="border-b border-emerald-500/30 mb-1 bg-emerald-500/5">
                                  <span className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-emerald-500" />
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">TODOS ({filteredTemas.length} temas)</span>
                                  </span>
                                </SelectItem>
                              )}
                              {filteredTemas.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedTema === '__AUTO_AI__' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              IA preenche campos vazios. Corrige TEMA/SUBTEMA somente se confiança ≥80%.
                            </p>
                          )}
                          {selectedTema === '__TODOS__' && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                              <Layers className="h-3 w-3" />
                              TODOS os {filteredTemas.length} temas serão associados a cada questão importada.
                            </p>
                          )}
                          {selectedMicro === '__AUTO_AI__' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-primary" />
                              Tema será determinado automaticamente pela IA (Micro = Auto)
                            </p>
                          )}
                        </div>
                        
                        {/* SUBTEMA */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            🔖 Subtema
                            {selectedSubtema && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </Label>
                          <Select
                            value={selectedSubtema}
                            onValueChange={setSelectedSubtema}
                            disabled={!selectedTema || selectedTema === '__AUTO_AI__' || selectedMicro === '__AUTO_AI__' || taxonomyLoading}
                          >
                            <SelectTrigger className={cn(
                              "h-11",
                              selectedTema && selectedTema !== '__AUTO_AI__' && selectedMicro !== '__AUTO_AI__' && !selectedSubtema && "border-amber-500/50"
                            )}>
                              <SelectValue placeholder={
                                !selectedTema 
                                  ? "Primeiro selecione o Tema" 
                                  : (selectedTema === '__AUTO_AI__' || selectedMicro === '__AUTO_AI__')
                                    ? "IA determinará automaticamente" 
                                    : "Selecione o Subtema..."
                              } />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {/* OPÇÃO AUTOMÁTICO (IA) - Respeita Excel e só corrige se confiança ≥80% */}
                              <SelectItem value="__AUTO_AI__" className="border-b border-primary/20 mb-1">
                                <span className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-primary">Automático (IA)</span>
                                </span>
                              </SelectItem>
                              {filteredSubtemas.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedSubtema === '__AUTO_AI__' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              IA preenche campos vazios. Corrige SUBTEMA somente se confiança ≥80%.
                            </p>
                          )}
                          {(selectedMicro === '__AUTO_AI__' || selectedTema === '__AUTO_AI__') && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-primary" />
                              Subtema será determinado automaticamente pela IA
                            </p>
                          )}
                        </div>
                        
                        {/* DIFICULDADE */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            📊 Nível de Dificuldade
                            {selectedDifficulty && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </Label>
                          <Select
                            value={selectedDifficulty}
                            onValueChange={setSelectedDifficulty}
                          >
                            <SelectTrigger className={cn(
                              "h-11",
                              !selectedDifficulty && "border-amber-500/50"
                            )}>
                              <SelectValue placeholder="Selecione a Dificuldade..." />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {/* OPÇÃO AUTOMÁTICO (IA) - Respeita Excel e só corrige se confiança ≥80% */}
                              <SelectItem value="__AUTO_AI__" className="border-b border-primary/20 mb-1">
                                <span className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-primary">Automático (IA)</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="facil">🟢 Fácil</SelectItem>
                              <SelectItem value="medio">🟡 Médio</SelectItem>
                              <SelectItem value="dificil">🔴 Difícil</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedDifficulty === '__AUTO_AI__' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              IA infere dificuldade com base na complexidade. Corrige somente se confiança ≥80%.
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Preview da seleção */}
                      {(selectedMacro || selectedMicro || selectedTema || selectedSubtema || selectedDifficulty) && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
                          <p className="text-xs text-muted-foreground mb-1">Classificação aplicada:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedMacro && (
                              <Badge variant="secondary" className={cn("gap-1", selectedMacro === '__AUTO_AI__' && "bg-primary/20 text-primary border-primary/30")}>
                                {selectedMacro === '__AUTO_AI__' ? (
                                  <><Sparkles className="h-3 w-3" /> Macro: Automático (IA)</>
                                ) : selectedMacro === '__TODOS__' ? (
                                  <>🎯 TODOS ({macros.length} macros)</>
                                ) : (
                                  <>🎯 {getMacroLabel(selectedMacro)}</>
                                )}
                              </Badge>
                            )}
                            {selectedMicro && (
                              <Badge variant="secondary" className={cn("gap-1", selectedMicro === '__AUTO_AI__' && "bg-primary/20 text-primary border-primary/30")}>
                                {selectedMicro === '__AUTO_AI__' ? (
                                  <><Sparkles className="h-3 w-3" /> Micro: Automático (IA)</>
                                ) : selectedMicro === '__TODOS__' ? (
                                  <>📚 TODOS ({filteredMicros.length} micros)</>
                                ) : (
                                  <>📚 {getMicroLabel(selectedMicro)}</>
                                )}
                              </Badge>
                            )}
                            {selectedTema && (
                              <Badge variant="secondary" className={cn("gap-1", selectedTema === '__AUTO_AI__' && "bg-primary/20 text-primary border-primary/30")}>
                                {selectedTema === '__AUTO_AI__' ? (
                                  <><Sparkles className="h-3 w-3" /> Tema: Automático (IA)</>
                                ) : selectedTema === '__TODOS__' ? (
                                  <>📖 TODOS ({filteredTemas.length} temas)</>
                                ) : (
                                  <>📖 {getTemaLabel(selectedTema)}</>
                                )}
                              </Badge>
                            )}
                            {selectedSubtema && (
                              <Badge variant="secondary" className={cn("gap-1", selectedSubtema === '__AUTO_AI__' && "bg-primary/20 text-primary border-primary/30")}>
                                {selectedSubtema === '__AUTO_AI__' ? (
                                  <><Sparkles className="h-3 w-3" /> Subtema: Automático (IA)</>
                                ) : selectedSubtema === '__TODOS__' ? (
                                  <>🔖 TODOS ({filteredSubtemas.length} subtemas)</>
                                ) : (
                                  <>🔖 {getSubtemaLabel(selectedSubtema)}</>
                                )}
                              </Badge>
                            )}
                            {selectedDifficulty && (
                              <Badge variant="secondary" className={cn("gap-1", selectedDifficulty === '__AUTO_AI__' && "bg-primary/20 text-primary border-primary/30")}>
                                {selectedDifficulty === '__AUTO_AI__' ? (
                                  <><Sparkles className="h-3 w-3" /> Dificuldade: Automático (IA)</>
                                ) : (
                                  <>📊 {selectedDifficulty === 'facil' ? '🟢 Fácil' : selectedDifficulty === 'medio' ? '🟡 Médio' : '🔴 Difícil'}</>
                                )}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ÁREA DE UPLOAD (só habilitada após selecionar estilo + macro + micro + tema + subtema + dificuldade) */}
                {(() => {
                  // Se Micro = Auto, Tema e Subtema são automaticamente Auto também
                  // Se Tema = Auto, Subtema é automaticamente Auto também
                  const temaResolved = selectedMicro === '__AUTO_AI__' ? '__AUTO_AI__' : selectedTema;
                  const subtemaResolved = (selectedMicro === '__AUTO_AI__' || selectedTema === '__AUTO_AI__') ? '__AUTO_AI__' : selectedSubtema;
                  const canUpload = selectedStyle && selectedMacro && selectedMicro && temaResolved && subtemaResolved && selectedDifficulty;
                  const missingItems = [];
                  if (!selectedStyle) missingItems.push('estilo');
                  if (!selectedMacro) missingItems.push('macro');
                  if (!selectedMicro) missingItems.push('micro');
                  if (!temaResolved) missingItems.push('tema');
                  if (!subtemaResolved) missingItems.push('subtema');
                  if (!selectedDifficulty) missingItems.push('dificuldade');
                  
                  return (
                    <div
                      onDrop={canUpload ? handleDrop : (e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                      className={cn(
                        "w-full max-w-2xl p-12 border-2 border-dashed rounded-xl transition-all",
                        canUpload 
                          ? "border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 cursor-pointer"
                          : "border-muted-foreground/20 bg-muted/10 cursor-not-allowed opacity-60"
                      )}
                      onClick={() => canUpload && document.getElementById('file-import-input')?.click()}
                    >
                      <input
                        id="file-import-input"
                        type="file"
                        accept=".xlsx,.xls,.csv,.txt,.docx"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={!canUpload}
                      />
                      
                      <div className="flex flex-col items-center gap-4 text-center">
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                            <div className="space-y-2 w-full max-w-md">
                              <p className="text-sm font-medium">
                                Processando {currentFileIndex + 1} de {files.length} arquivos...
                              </p>
                              <Progress value={(currentFileIndex / files.length) * 100} className="h-2" />
                            </div>
                          </>
                        ) : (
                          <div className={cn(
                            "p-4 rounded-2xl",
                            canUpload 
                              ? "bg-gradient-to-br from-primary/20 to-purple-500/20" 
                              : "bg-muted/30"
                          )}>
                            <FileSpreadsheet className={cn(
                              "h-12 w-12",
                              canUpload ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                        )}
                        
                        {!isProcessing && (
                          <div>
                            <h3 className={cn(
                              "text-lg font-semibold",
                              !canUpload && "text-muted-foreground"
                            )}>
                              {canUpload 
                                ? 'Arraste os arquivos aqui' 
                                : `Primeiro selecione: ${missingItems.join(', ')} ↑`}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {canUpload 
                                ? <>ou clique para selecionar <strong>(até 20 arquivos)</strong></>
                                : 'O upload será liberado após as seleções obrigatórias'}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 justify-center">
                          <Badge variant="outline" className="gap-1">
                            <FileSpreadsheet className="h-3 w-3" />
                            Excel (.xlsx)
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <FileText className="h-3 w-3" />
                            CSV
                          </Badge>
                          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1">
                            <FileType className="h-3 w-3" />
                            Word (.docx)
                          </Badge>
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
                            <Zap className="h-3 w-3" />
                            Múltiplos arquivos
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Lista de arquivos selecionados (se houver) */}
                {fileResults.length > 0 && (
                  <div className="mt-6 w-full max-w-2xl">
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Arquivos Selecionados ({fileResults.length})
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {fileResults.map((fr, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "flex items-center justify-between p-2 rounded text-sm",
                              fr.status === 'done' && "bg-green-500/10",
                              fr.status === 'processing' && "bg-blue-500/10",
                              fr.status === 'error' && "bg-red-500/10",
                              fr.status === 'pending' && "bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {fr.status === 'done' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {fr.status === 'processing' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                              {fr.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                              {fr.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                              <span className="truncate max-w-[250px]">{fr.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {fr.rows > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {fr.rows} questões
                                </Badge>
                              )}
                              {fr.error && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span><AlertCircle className="h-4 w-4 text-red-500 cursor-help" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs max-w-[200px]">{fr.error}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {fileResults.some(f => f.status === 'done') && (
                        <div className="mt-3 pt-3 border-t flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Total: <strong>{fileResults.reduce((acc, f) => acc + f.rows, 0)}</strong> questões
                          </span>
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            {fileResults.filter(f => f.status === 'done').length} arquivos OK
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Regras do contrato */}
                <div className="mt-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 max-w-2xl w-full">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold text-sm">Regras de Importação em Lote</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Múltiplos arquivos</strong> serão combinados em uma única importação</li>
                    <li>• Todos os arquivos devem ter a <strong>mesma estrutura de colunas</strong></li>
                    <li>• Campos não identificáveis permanecerão <strong>NULL</strong></li>
                    <li>• Autorização explícita será exigida antes da importação</li>
                  </ul>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Não tem um arquivo? Baixe nosso template:
                  </p>
                  <Button variant="outline" size="sm" onClick={() => {
                    const template = [
                      ['ENUNCIADO', 'ALTERNATIVA A', 'ALTERNATIVA B', 'ALTERNATIVA C', 'ALTERNATIVA D', 'ALTERNATIVA E', 'GABARITO', 'RESOLUCAO', 'DIFICULDADE', 'BANCA', 'ANO', 'MACRO', 'MICRO', 'TEMA', 'SUBTEMA', 'IMAGEM', 'COMPETENCIA_ENEM', 'HABILIDADE_ENEM', 'TAGS'],
                      ['Qual é o símbolo do elemento Ouro?', 'Au', 'Ag', 'Fe', 'Cu', 'Zn', 'A', '✅ ALTERNATIVA A (CORRETA)\nO símbolo Au vem do latim Aurum.\n\n❌ ALTERNATIVA B (INCORRETA)\nAg é o símbolo da Prata (Argentum).\n\n🎯 CONCLUSÃO:\nO ouro é representado pelo símbolo Au devido à sua origem latina.', 'Fácil', 'ENEM', '2023', 'Química Geral', 'Tabela Periódica', 'Elementos Químicos', 'Metais', '', '', '', 'SIMULADOS'],
                    ];
                    const ws = XLSX.utils.aoa_to_sheet(template);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Questões');
                    XLSX.writeFile(wb, 'template_questoes_padrao.xlsx');
                    toast.success('Template baixado!');
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Template Excel (19 colunas)
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
                className="flex flex-col min-h-0"
              >
                <div className="flex items-center justify-between p-4 border-b gap-3">
                  <div>
                    <h3 className="font-semibold">Mapeamento de Colunas</h3>
                    <p className="text-sm text-muted-foreground">
                      {batchMode && <><strong>{files.length} arquivos</strong> • </>}
                      {rawData.length} questões • {headers.length} colunas detectadas
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

                <div className="min-h-0 p-4 pb-8">
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

                <DialogFooter className="border-t p-4 bg-background mt-4">
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
                className="flex flex-col min-h-0"
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
                <div className="min-h-0">
                  <div className="p-4 pb-8 space-y-2 min-w-[980px]">
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
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Badge className="bg-blue-500/20 text-blue-500 text-[10px] h-5 cursor-help">
                                            <Sparkles className="h-2.5 w-2.5 mr-1" />
                                            {q.campos_inferidos.length} inferidos
                                          </Badge>
                                        </span>
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
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Badge className="bg-orange-500/20 text-orange-500 text-[10px] h-5 cursor-help">
                                            <AlertOctagon className="h-2.5 w-2.5 mr-1" />
                                            {q.campos_null.length} null
                                          </Badge>
                                        </span>
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
                                    <QuestionTextField content={opt.text} fieldType="alternativa" emptyText="vazio" emptyAsItalic inline />
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

                {/* Footer com autorização */}
                <div className="border-t bg-background p-4 space-y-4 mt-4">
                  {/* QUESTION_DOMAIN: Seleção de Grupo pós-importação - MOVIDO PARA O TOPO */}
                  <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-purple-500" />
                      <span className="font-semibold text-sm text-purple-500">Atribuir questões ao grupo:</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedGroup('SIMULADOS')}
                        className={cn(
                          "flex-1 p-3 rounded-lg border-2 transition-all text-left",
                          selectedGroup === 'SIMULADOS'
                            ? "border-red-500 bg-red-600/30 ring-2 ring-red-500/50"
                            : "border-red-500/50 bg-red-600/20 hover:bg-red-600/30"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-600 text-white">SIMULADOS</Badge>
                          {selectedGroup === 'SIMULADOS' && <CheckCircle className="h-4 w-4 text-red-500 ml-auto" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Questões para provas simuladas
                        </p>
                      </button>
                      <button
                        onClick={() => setSelectedGroup('MODO_TREINO')}
                        className={cn(
                          "flex-1 p-3 rounded-lg border-2 transition-all text-left",
                          selectedGroup === 'MODO_TREINO'
                            ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30"
                          : "border-muted hover:border-purple-500/50 hover:bg-purple-500/5"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-600 text-white">MODO_TREINO</Badge>
                          {selectedGroup === 'MODO_TREINO' && <CheckCircle className="h-4 w-4 text-purple-500 ml-auto" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Questões para modo treino/prática (0 XP)
                        </p>
                      </button>
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
                        — Grupo: <Badge variant="outline" className={cn(
                          "ml-1",
                          selectedGroup === 'SIMULADOS' ? "text-red-500 border-red-500/30" : "text-purple-500 border-purple-500/30"
                        )}>{selectedGroup === 'SIMULADOS' ? 'SIMULADOS' : 'MODO_TREINO'}</Badge>
                      </span>
                    </Label>
                    <ShieldCheck
                      className={cn(
                        "h-5 w-5 transition-colors",
                        humanAuthorization ? "text-green-500" : "text-muted-foreground"
                      )}
                    />
                  </div>

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
                        // Garantia P0: se por qualquer motivo nada estiver selecionado,
                        // selecionamos tudo automaticamente e seguimos.
                        if (stats.selected === 0 && parsedQuestions.length > 0) {
                          console.log('[IMPORT] Auto-select all (selected estava 0)');
                          toggleSelectAll(true);

                          if (flowState === 'autorizacao_explicita' && humanAuthorization) {
                            setTimeout(() => {
                              console.log('[IMPORT] handleImport() (after auto-select)');
                              handleImport();
                            }, 0);
                          } else {
                            toast.info('Selecionamos todas automaticamente. Agora marque a confirmação para importar.');
                            document.getElementById('human-auth')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                          return;
                        }

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
                          Importar {stats.selected} Questões (ATIVAS)
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
                      {stats.selected} questões sendo importadas como <strong>ATIVAS</strong>
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
                      Questões salvas como <strong>ATIVAS</strong> no grupo{' '}
                      <Badge className={cn(
                        "ml-1",
                        selectedGroup === 'SIMULADOS' ? "bg-red-600" : "bg-purple-600"
                      )}>
                        {selectedGroup === 'SIMULADOS' ? 'Simulados' : 'Treino'}
                      </Badge>
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
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {importResult.filesProcessed > 1 && (
                          <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <div className="text-2xl font-bold text-purple-500">{importResult.filesProcessed}</div>
                            <div className="text-xs text-muted-foreground">Arquivos</div>
                          </div>
                        )}
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
                            <Badge variant="outline" className="text-green-500 border-green-500/30">
                              ATIVAS
                            </Badge>{' '}
                            e já estão <strong>publicadas</strong>.
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
                        // Passa a quantidade importada para o pai poder exibir toast informativo
                        onSuccess(importResult?.imported ?? 0);
                        onClose();
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
                      className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
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
