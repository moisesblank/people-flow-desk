// ============================================
// 📝 GESTÃO DE QUESTÕES - Área Administrativa
// Gerenciamento completo do banco de questões
// Visual Futurístico Ano 2300
// ============================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Plus, 
  Edit, 
  Archive, 
  Eye, 
  Trash2,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Tag,
  Target,
  Zap,
  BarChart3,
  FileQuestion,
  Copy,
  Download,
  Upload,
  Settings2,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCacheManager } from '@/hooks/useCacheManager';

// ============================================
// TIPOS
// ============================================

interface QuestionOption {
  id: string;
  text: string;
  [key: string]: string; // Index signature for JSON compatibility
}

interface Question {
  id: string;
  area_id?: string | null;
  lesson_id?: string | null;
  quiz_id?: string | null;
  question_text: string;
  question_type: string;
  options: QuestionOption[];
  correct_answer: string;
  explanation?: string | null;
  difficulty: string;
  banca?: string | null;
  ano?: number | null;
  tags?: string[] | null;
  points: number;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QuestionStats {
  total: number;
  active: number;
  byDifficulty: { facil: number; medio: number; dificil: number };
  byArea: Record<string, number>;
}

// ============================================
// CONSTANTES
// ============================================

// ============================================
// ESTRUTURA HIERÁRQUICA: MACRO → MICRO → TEMA → SUBTEMA
// ============================================

const MACROS = [
  { value: 'quimica_geral', label: '⚗️ Química Geral' },
  { value: 'quimica_organica', label: '🧪 Química Orgânica' },
  { value: 'fisico_quimica', label: '📊 Físico-Química' },
];

const MICROS: Record<string, { value: string; label: string }[]> = {
  quimica_geral: [
    { value: 'introducao_a_inorganica', label: 'Introdução à Inorgânica' },
    { value: 'atomistica', label: 'Atomística' },
    { value: 'tabela_periodica', label: 'Tabela Periódica' },
    { value: 'ligacoes_quimicas', label: 'Ligações Químicas' },
    { value: 'funcoes_inorganicas', label: 'Funções Inorgânicas' },
    { value: 'reacoes_quimicas', label: 'Reações Químicas' },
    { value: 'balanceamento', label: 'Balanceamento' },
    { value: 'nox', label: 'NOX (Número de Oxidação)' },
    { value: 'gases', label: 'Gases' },
    { value: 'estequiometria', label: 'Estequiometria' },
    { value: 'calculos_quimicos', label: 'Cálculos Químicos' },
  ],
  quimica_organica: [
    { value: 'introducao_organica', label: 'Introdução à Orgânica' },
    { value: 'hidrocarbonetos', label: 'Hidrocarbonetos' },
    { value: 'funcoes_oxigenadas', label: 'Funções Oxigenadas' },
    { value: 'funcoes_nitrogenadas', label: 'Funções Nitrogenadas' },
    { value: 'isomeria', label: 'Isomeria' },
    { value: 'polimeros', label: 'Polímeros' },
    { value: 'bioquimica', label: 'Bioquímica' },
  ],
  fisico_quimica: [
    { value: 'termoquimica', label: 'Termoquímica' },
    { value: 'cinetica', label: 'Cinética Química' },
    { value: 'equilibrio', label: 'Equilíbrio Químico' },
    { value: 'eletroquimica', label: 'Eletroquímica' },
    { value: 'radioatividade', label: 'Radioatividade' },
    { value: 'propriedades_coligativas', label: 'Propriedades Coligativas' },
  ],
};

const TEMAS: Record<string, { value: string; label: string }[]> = {
  // === QUÍMICA GERAL ===
  introducao_a_inorganica: [
    { value: 'conceitos_basicos', label: 'Conceitos Básicos' },
    { value: 'estados_fisicos_da_materia', label: 'Estados Físicos da Matéria' },
    { value: 'sistemas_materiais', label: 'Sistemas Materiais' },
    { value: 'separacao_de_misturas', label: 'Separação de Misturas' },
    { value: 'comportamento_anomalo_da_agua', label: 'Comportamento Anômalo da Água' },
  ],
  atomistica: [
    { value: 'evolucao_dos_modelos_atomicos', label: 'Evolução dos Modelos Atômicos' },
    { value: 'estrutura_do_atomo', label: 'Estrutura do Átomo' },
    { value: 'numeros_atomicos', label: 'Números Atômicos' },
    { value: 'distribuicao_eletronica', label: 'Distribuição Eletrônica' },
    { value: 'numeros_quanticos', label: 'Números Quânticos' },
  ],
  tabela_periodica: [
    { value: 'historia_da_tabela_periodica', label: 'História da Tabela Periódica' },
    { value: 'organizacao_periodica', label: 'Organização Periódica' },
    { value: 'classificacao_dos_elementos', label: 'Classificação dos Elementos' },
    { value: 'propriedades_periodicas', label: 'Propriedades Periódicas' },
  ],
  ligacoes_quimicas: [
    { value: 'fundamentos_das_ligacoes', label: 'Fundamentos das Ligações' },
    { value: 'ligacao_ionica', label: 'Ligação Iônica' },
    { value: 'ligacao_covalente', label: 'Ligação Covalente' },
    { value: 'ligacao_metalica', label: 'Ligação Metálica' },
    { value: 'geometria_molecular', label: 'Geometria Molecular' },
    { value: 'polaridade', label: 'Polaridade' },
  ],
  funcoes_inorganicas: [
    { value: 'acidos', label: 'Ácidos' },
    { value: 'bases', label: 'Bases' },
    { value: 'sais', label: 'Sais' },
    { value: 'oxidos', label: 'Óxidos' },
  ],
  reacoes_quimicas: [
    { value: 'tipos_de_reacoes', label: 'Tipos de Reações' },
    { value: 'energetica_das_reacoes', label: 'Energética das Reações' },
  ],
  balanceamento: [
    { value: 'metodos_de_balanceamento', label: 'Métodos de Balanceamento' },
  ],
  nox: [
    { value: 'conceito_de_nox', label: 'Conceito de NOX' },
    { value: 'aplicacoes_do_nox', label: 'Aplicações do NOX' },
  ],
  gases: [
    { value: 'propriedades_dos_gases', label: 'Propriedades dos Gases' },
    { value: 'leis_dos_gases', label: 'Leis dos Gases' },
    { value: 'clapeyron', label: 'Clapeyron' },
  ],
  estequiometria: [
    { value: 'conceitos_fundamentais', label: 'Conceitos Fundamentais' },
    { value: 'casos_estequiometricos', label: 'Casos Estequiométricos' },
  ],
  calculos_quimicos: [
    { value: 'leis_ponderais', label: 'Leis Ponderais' },
    { value: 'formulas_quimicas', label: 'Fórmulas Químicas' },
    { value: 'grandezas_quimicas', label: 'Grandezas Químicas' },
  ],
  // === QUÍMICA ORGÂNICA ===
  hidrocarbonetos: [
    { value: 'alcanos', label: 'Alcanos' },
    { value: 'alcenos', label: 'Alcenos' },
    { value: 'alcinos', label: 'Alcinos' },
    { value: 'aromaticos', label: 'Aromáticos' },
  ],
  // === FÍSICO-QUÍMICA ===
  termoquimica: [
    { value: 'entalpia', label: 'Entalpia' },
    { value: 'lei_hess', label: 'Lei de Hess' },
    { value: 'energia_ligacao', label: 'Energia de Ligação' },
  ],
  equilibrio: [
    { value: 'constante_equilibrio', label: 'Constante de Equilíbrio' },
    { value: 'deslocamento', label: 'Deslocamento de Equilíbrio' },
    { value: 'equilibrio_ionico', label: 'Equilíbrio Iônico' },
    { value: 'ph_poh', label: 'pH e pOH' },
  ],
};

const SUBTEMAS: Record<string, { value: string; label: string }[]> = {
  // === QUÍMICA GERAL - INTRODUÇÃO À INORGÂNICA ===
  conceitos_basicos: [
    { value: 'quimica_como_ciencia', label: 'Química como Ciência' },
    { value: 'transformacoes_fisicas', label: 'Transformações Físicas' },
    { value: 'transformacoes_quimicas', label: 'Transformações Químicas' },
    { value: 'fenomenos_quimicos', label: 'Fenômenos Químicos' },
    { value: 'propriedades_da_materia', label: 'Propriedades da Matéria' },
  ],
  estados_fisicos_da_materia: [
    { value: 'solido', label: 'Sólido' },
    { value: 'liquido', label: 'Líquido' },
    { value: 'gasoso', label: 'Gasoso' },
    { value: 'plasma', label: 'Plasma' },
  ],
  sistemas_materiais: [
    { value: 'sistema_homogeneo', label: 'Sistema Homogêneo' },
    { value: 'sistema_heterogeneo', label: 'Sistema Heterogêneo' },
  ],
  separacao_de_misturas: [
    { value: 'misturas_homogeneas', label: 'Misturas Homogêneas' },
    { value: 'misturas_heterogeneas', label: 'Misturas Heterogêneas' },
  ],
  comportamento_anomalo_da_agua: [
    { value: 'densidade', label: 'Densidade' },
    { value: 'ligacoes_de_hidrogenio', label: 'Ligações de Hidrogênio' },
  ],
  // === QUÍMICA GERAL - ATOMÍSTICA ===
  evolucao_dos_modelos_atomicos: [
    { value: 'dalton', label: 'Dalton' },
    { value: 'thomson', label: 'Thomson' },
    { value: 'rutherford', label: 'Rutherford' },
    { value: 'bohr', label: 'Bohr' },
  ],
  estrutura_do_atomo: [
    { value: 'proton', label: 'Próton' },
    { value: 'neutron', label: 'Nêutron' },
    { value: 'eletron', label: 'Elétron' },
  ],
  numeros_atomicos: [
    { value: 'numero_atomico', label: 'Número Atômico' },
    { value: 'numero_de_massa', label: 'Número de Massa' },
  ],
  distribuicao_eletronica: [
    { value: 'ordem_de_energia', label: 'Ordem de Energia' },
    { value: 'diagrama_de_pauling', label: 'Diagrama de Pauling' },
    { value: 'principio_de_aufbau', label: 'Princípio de Aufbau' },
    { value: 'principio_da_exclusao', label: 'Princípio da Exclusão' },
    { value: 'regra_de_hund', label: 'Regra de Hund' },
  ],
  numeros_quanticos: [
    { value: 'principal', label: 'Principal (n)' },
    { value: 'secundario', label: 'Secundário (l)' },
    { value: 'magnetico', label: 'Magnético (ml)' },
    { value: 'spin', label: 'Spin (ms)' },
  ],
  // === QUÍMICA GERAL - TABELA PERIÓDICA ===
  historia_da_tabela_periodica: [
    { value: 'mendeleev', label: 'Mendeleev' },
  ],
  organizacao_periodica: [
    { value: 'periodos', label: 'Períodos' },
    { value: 'familias', label: 'Famílias' },
  ],
  classificacao_dos_elementos: [
    { value: 'metais', label: 'Metais' },
    { value: 'nao_metais', label: 'Não-Metais' },
    { value: 'semi_metais', label: 'Semimetais' },
    { value: 'gases_nobres', label: 'Gases Nobres' },
  ],
  propriedades_periodicas: [
    { value: 'raio_atomico', label: 'Raio Atômico' },
    { value: 'energia_de_ionizacao', label: 'Energia de Ionização' },
    { value: 'afinidade_eletronica', label: 'Afinidade Eletrônica' },
    { value: 'eletronegatividade', label: 'Eletronegatividade' },
  ],
  // === QUÍMICA GERAL - LIGAÇÕES QUÍMICAS ===
  fundamentos_das_ligacoes: [
    { value: 'estabilidade_quimica', label: 'Estabilidade Química' },
    { value: 'regra_do_octeto', label: 'Regra do Octeto' },
  ],
  ligacao_ionica: [
    { value: 'formacao_de_ions', label: 'Formação de Íons' },
    { value: 'reticulo_cristalino', label: 'Retículo Cristalino' },
  ],
  ligacao_covalente: [
    { value: 'simples', label: 'Simples' },
    { value: 'dupla', label: 'Dupla' },
    { value: 'tripla', label: 'Tripla' },
  ],
  ligacao_metalica: [
    { value: 'mar_de_eletrons', label: 'Mar de Elétrons' },
  ],
  geometria_molecular: [
    { value: 'linear', label: 'Linear' },
    { value: 'angular', label: 'Angular' },
    { value: 'trigonal_plana', label: 'Trigonal Plana' },
    { value: 'tetraedrica', label: 'Tetraédrica' },
  ],
  polaridade: [
    { value: 'ligacoes_polares', label: 'Ligações Polares' },
    { value: 'moleculas_polares', label: 'Moléculas Polares' },
  ],
  // === QUÍMICA GERAL - FUNÇÕES INORGÂNICAS ===
  acidos: [
    { value: 'definicao', label: 'Definição' },
    { value: 'forca_dos_acidos', label: 'Força dos Ácidos' },
    { value: 'nomenclatura', label: 'Nomenclatura' },
  ],
  bases: [
    { value: 'definicao', label: 'Definição' },
    { value: 'forca_das_bases', label: 'Força das Bases' },
    { value: 'nomenclatura', label: 'Nomenclatura' },
  ],
  sais: [
    { value: 'classificacao', label: 'Classificação' },
    { value: 'nomenclatura', label: 'Nomenclatura' },
  ],
  oxidos: [
    { value: 'acidos', label: 'Óxidos Ácidos' },
    { value: 'basicos', label: 'Óxidos Básicos' },
    { value: 'anfoteros', label: 'Óxidos Anfóteros' },
  ],
  // === QUÍMICA GERAL - REAÇÕES QUÍMICAS ===
  tipos_de_reacoes: [
    { value: 'sintese', label: 'Síntese' },
    { value: 'analise', label: 'Análise' },
    { value: 'simples_troca', label: 'Simples Troca' },
    { value: 'dupla_troca', label: 'Dupla Troca' },
  ],
  energetica_das_reacoes: [
    { value: 'endotermicas', label: 'Endotérmicas' },
    { value: 'exotermicas', label: 'Exotérmicas' },
  ],
  // === QUÍMICA GERAL - BALANCEAMENTO ===
  metodos_de_balanceamento: [
    { value: 'tentativa', label: 'Tentativa' },
    { value: 'oxirreducao', label: 'Oxirredução' },
  ],
  // === QUÍMICA GERAL - NOX ===
  conceito_de_nox: [
    { value: 'regras_de_atribuicao', label: 'Regras de Atribuição' },
  ],
  aplicacoes_do_nox: [
    { value: 'quimica_inorganica', label: 'Química Inorgânica' },
    { value: 'quimica_organica', label: 'Química Orgânica' },
  ],
  // === QUÍMICA GERAL - GASES ===
  propriedades_dos_gases: [
    { value: 'pressao', label: 'Pressão' },
    { value: 'volume', label: 'Volume' },
    { value: 'temperatura', label: 'Temperatura' },
  ],
  leis_dos_gases: [
    { value: 'boyle', label: 'Boyle' },
    { value: 'charles', label: 'Charles' },
    { value: 'gay_lussac', label: 'Gay-Lussac' },
  ],
  clapeyron: [
    { value: 'equacao_geral_dos_gases', label: 'Equação Geral dos Gases' },
  ],
  // === QUÍMICA GERAL - ESTEQUIOMETRIA ===
  conceitos_fundamentais: [
    { value: 'mol', label: 'Mol' },
    { value: 'massa_molar', label: 'Massa Molar' },
  ],
  casos_estequiometricos: [
    { value: 'caso_simples', label: 'Caso Simples' },
    { value: 'excesso_e_limitante', label: 'Excesso e Limitante' },
    { value: 'pureza', label: 'Pureza' },
    { value: 'rendimento', label: 'Rendimento' },
    { value: 'reacoes_consecutivas', label: 'Reações Consecutivas' },
  ],
  // === QUÍMICA GERAL - CÁLCULOS QUÍMICOS ===
  leis_ponderais: [
    { value: 'lavoisier', label: 'Lavoisier' },
    { value: 'proust', label: 'Proust' },
  ],
  formulas_quimicas: [
    { value: 'minima', label: 'Mínima' },
    { value: 'molecular', label: 'Molecular' },
  ],
  grandezas_quimicas: [
    { value: 'mol', label: 'Mol' },
    { value: 'massa', label: 'Massa' },
    { value: 'volume', label: 'Volume' },
  ],
  // === QUÍMICA ORGÂNICA ===
  alcanos: [
    { value: 'nomenclatura_alcanos', label: 'Nomenclatura de Alcanos' },
    { value: 'propriedades_alcanos', label: 'Propriedades de Alcanos' },
  ],
  // === FÍSICO-QUÍMICA ===
  ph_poh: [
    { value: 'calculo_ph', label: 'Cálculo de pH' },
    { value: 'solucao_tampao', label: 'Solução Tampão' },
  ],
};

const BANCAS = [
  { value: 'enem', label: 'ENEM' },
  { value: 'fuvest', label: 'FUVEST' },
  { value: 'unicamp', label: 'UNICAMP' },
  { value: 'unesp', label: 'UNESP' },
  { value: 'unifesp', label: 'UNIFESP' },
  { value: 'ita', label: 'ITA' },
  { value: 'ime', label: 'IME' },
  { value: 'uerj', label: 'UERJ' },
  { value: 'ufrj', label: 'UFRJ' },
  { value: 'ufmg', label: 'UFMG' },
  { value: 'propria', label: 'Própria' },
];

const DIFFICULTY_MAP = {
  facil: { label: 'Fácil', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  medio: { label: 'Médio', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  dificil: { label: 'Difícil', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
};

// ============================================
// DIALOG: CRIAR/EDITAR QUESTÃO
// ============================================

interface QuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question?: Question | null;
}

const QuestionDialog = memo(function QuestionDialog({ 
  open, 
  onClose, 
  onSuccess, 
  question 
}: QuestionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
      { id: 'e', text: '' },
    ] as QuestionOption[],
    correct_answer: 'a',
    explanation: '',
    difficulty: 'medio' as 'facil' | 'medio' | 'dificil',
    banca: 'enem',
    ano: new Date().getFullYear(),
    tags: [] as string[],
    points: 10,
    is_active: true,
    // Estrutura hierárquica
    macro: '',
    micro: '',
    tema: '',
    subtema: '',
    orgao_cargo: '',
  });

  // Preencher form ao editar
  useEffect(() => {
    if (question) {
      setForm({
        question_text: question.question_text || '',
        question_type: question.question_type || 'multiple_choice',
        options: question.options?.length ? question.options : [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
          { id: 'c', text: '' },
          { id: 'd', text: '' },
          { id: 'e', text: '' },
        ],
        correct_answer: question.correct_answer || 'a',
        explanation: question.explanation || '',
        difficulty: (question.difficulty as 'facil' | 'medio' | 'dificil') || 'medio',
        banca: question.banca || 'enem',
        ano: question.ano || new Date().getFullYear(),
        tags: question.tags || [],
        points: question.points || 10,
        is_active: question.is_active ?? true,
        // Estrutura hierárquica
        macro: (question as any).macro || '',
        micro: (question as any).micro || '',
        tema: (question as any).tema || '',
        subtema: (question as any).subtema || '',
        orgao_cargo: (question as any).orgao_cargo || '',
      });
    } else {
      // Reset para nova questão
      setForm({
        question_text: '',
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
          { id: 'c', text: '' },
          { id: 'd', text: '' },
          { id: 'e', text: '' },
        ],
        correct_answer: 'a',
        explanation: '',
        difficulty: 'medio',
        banca: 'enem',
        ano: new Date().getFullYear(),
        tags: [],
        points: 10,
        is_active: true,
        // Estrutura hierárquica
        macro: '',
        micro: '',
        tema: '',
        subtema: '',
        orgao_cargo: '',
      });
    }
  }, [question, open]);

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...form.options];
    newOptions[index] = { ...newOptions[index], text };
    setForm(f => ({ ...f, options: newOptions }));
  };

  const handleSubmit = async () => {
    if (!form.question_text.trim()) {
      toast.error('Digite o enunciado da questão');
      return;
    }

    // Verificar se tem pelo menos 2 alternativas preenchidas
    const filledOptions = form.options.filter(o => o.text.trim());
    if (filledOptions.length < 2) {
      toast.error('Preencha pelo menos 2 alternativas');
      return;
    }

    // Verificar se a resposta correta tem texto
    const correctOption = form.options.find(o => o.id === form.correct_answer);
    if (!correctOption?.text.trim()) {
      toast.error('A alternativa correta precisa ter texto');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        question_text: form.question_text.trim(),
        question_type: form.question_type,
        options: form.options.filter(o => o.text.trim()),
        correct_answer: form.correct_answer,
        explanation: form.explanation.trim() || null,
        difficulty: form.difficulty,
        banca: form.banca,
        ano: form.ano,
        tags: form.tags,
        points: form.points,
        is_active: form.is_active,
        // Estrutura hierárquica
        macro: form.macro || null,
        micro: form.micro || null,
        tema: form.tema || null,
        subtema: form.subtema || null,
        orgao_cargo: form.orgao_cargo || null,
      };

      if (question?.id) {
        // Atualizar
        const { error } = await supabase
          .from('quiz_questions')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', question.id);

        if (error) throw error;
        toast.success('Questão atualizada com sucesso!');
      } else {
        // Criar nova
        const { error } = await supabase
          .from('quiz_questions')
          .insert([payload]);

        if (error) throw error;
        toast.success('Questão criada com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar questão:', err);
      toast.error('Erro ao salvar questão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {question ? 'Editar Questão' : 'Nova Questão'}
          </DialogTitle>
          <DialogDescription>
            {question ? 'Edite os campos da questão' : 'Preencha os campos para criar uma nova questão'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* ============================================ */}
          {/* ESTRUTURA HIERÁRQUICA: MACRO → MICRO → TEMA → SUBTEMA */}
          {/* ============================================ */}
          <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <Label className="font-semibold text-primary">Classificação Hierárquica</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* MACRO */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Macro</Label>
                <Select 
                  value={form.macro} 
                  onValueChange={(v) => setForm(f => ({ ...f, macro: v, micro: '', tema: '', subtema: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MACROS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* MICRO */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Micro</Label>
                <Select 
                  value={form.micro} 
                  onValueChange={(v) => setForm(f => ({ ...f, micro: v, tema: '', subtema: '' }))}
                  disabled={!form.macro}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(MICROS[form.macro] || []).map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* TEMA */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tema</Label>
                <Select 
                  value={form.tema} 
                  onValueChange={(v) => setForm(f => ({ ...f, tema: v, subtema: '' }))}
                  disabled={!form.micro}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(TEMAS[form.micro] || []).map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SUBTEMA */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Subtema</Label>
                <Select 
                  value={form.subtema} 
                  onValueChange={(v) => setForm(f => ({ ...f, subtema: v }))}
                  disabled={!form.tema}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(SUBTEMAS[form.tema] || []).map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Enunciado */}
          <div className="space-y-2">
            <Label>Enunciado da Questão *</Label>
            <Textarea
              placeholder="Digite o enunciado completo da questão..."
              value={form.question_text}
              onChange={(e) => setForm(f => ({ ...f, question_text: e.target.value }))}
              className="min-h-[120px]"
            />
          </div>

          {/* Alternativas */}
          <div className="space-y-3">
            <Label>Alternativas *</Label>
            <RadioGroup
              value={form.correct_answer}
              onValueChange={(v) => setForm(f => ({ ...f, correct_answer: v }))}
            >
              {form.options.map((option, idx) => (
                <div key={option.id} className="flex items-center gap-3">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label 
                    htmlFor={option.id}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold text-sm cursor-pointer",
                      form.correct_answer === option.id 
                        ? "border-green-500 bg-green-500/20 text-green-500" 
                        : "border-muted-foreground/30"
                    )}
                  >
                    {option.id.toUpperCase()}
                  </Label>
                  <Input
                    placeholder={`Alternativa ${option.id.toUpperCase()}`}
                    value={option.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Selecione o radio button para marcar a alternativa correta
            </p>
          </div>

          {/* Grid 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select 
                value={form.difficulty} 
                onValueChange={(v: 'facil' | 'medio' | 'dificil') => setForm(f => ({ ...f, difficulty: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">🟢 Fácil</SelectItem>
                  <SelectItem value="medio">🟡 Médio</SelectItem>
                  <SelectItem value="dificil">🔴 Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Banca</Label>
              <Select 
                value={form.banca} 
                onValueChange={(v) => setForm(f => ({ ...f, banca: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANCAS.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Input
                type="number"
                min={2000}
                max={2030}
                value={form.ano}
                onChange={(e) => setForm(f => ({ ...f, ano: parseInt(e.target.value) || 2024 }))}
              />
            </div>
          </div>

          {/* Grid 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pontuação</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.points}
                onChange={(e) => setForm(f => ({ ...f, points: parseInt(e.target.value) || 10 }))}
              />
            </div>

            <div className="space-y-2 flex items-center justify-between pt-6">
              <Label>Questão Ativa</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))}
              />
            </div>
          </div>

          {/* Explicação */}
          <div className="space-y-2">
            <Label>Explicação (opcional)</Label>
            <Textarea
              placeholder="Explique o raciocínio para a resposta correta..."
              value={form.explanation}
              onChange={(e) => setForm(f => ({ ...f, explanation: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {question ? 'Atualizar' : 'Criar Questão'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function GestaoQuestoes() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [bancaFilter, setBancaFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('todas');
  
  // Dialog states
  const [questionDialog, setQuestionDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { clearQueryCache } = useCacheManager();

  // Carregar questões
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear para o tipo Question com fallbacks seguros
      const mapped = (data || []).map(q => ({
        ...q,
        options: (Array.isArray(q.options) ? q.options : []) as QuestionOption[],
        difficulty: q.difficulty || 'medio',
        points: q.points || 10,
        is_active: q.is_active ?? true,
      })) as unknown as Question[];
      
      setQuestions(mapped);
    } catch (err) {
      console.error('Erro ao carregar questões:', err);
      toast.error('Erro ao carregar questões');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Estatísticas
  const stats: QuestionStats = useMemo(() => {
    const active = questions.filter(q => q.is_active);
    return {
      total: questions.length,
      active: active.length,
      byDifficulty: {
        facil: questions.filter(q => q.difficulty === 'facil').length,
        medio: questions.filter(q => q.difficulty === 'medio').length,
        dificil: questions.filter(q => q.difficulty === 'dificil').length,
      },
      byArea: {},
    };
  }, [questions]);

  // Questões filtradas
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Filtro por aba
    if (activeTab === 'ativas') {
      filtered = filtered.filter(q => q.is_active);
    } else if (activeTab === 'inativas') {
      filtered = filtered.filter(q => !q.is_active);
    }

    // Filtro por dificuldade
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    // Filtro por banca
    if (bancaFilter !== 'all') {
      filtered = filtered.filter(q => q.banca === bancaFilter);
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(term) ||
        q.banca?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [questions, activeTab, difficultyFilter, bancaFilter, searchTerm]);

  // Handlers
  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Questão excluída');
      setDeleteConfirm(null);
      loadQuestions();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      toast.error('Erro ao excluir questão');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isActive ? 'Questão desativada' : 'Questão ativada');
      loadQuestions();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      toast.error('Erro ao alterar status');
    }
  };

  const handleDuplicate = async (question: Question) => {
    try {
      const { id, created_at, updated_at, ...rest } = question;
      const { error } = await supabase
        .from('quiz_questions')
        .insert([{ 
          ...rest, 
          question_text: `[CÓPIA] ${rest.question_text}`,
          is_active: false 
        }]);

      if (error) throw error;
      
      toast.success('Questão duplicada');
      loadQuestions();
    } catch (err) {
      console.error('Erro ao duplicar:', err);
      toast.error('Erro ao duplicar questão');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Banco de Questões
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie suas questões de Química
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadQuestions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            onClick={() => {
              setSelectedQuestion(null);
              setQuestionDialog(true);
            }}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Questão
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <FileQuestion className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-400/10 to-lime-500/10 border-green-400/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-400/20">
              <Target className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byDifficulty.facil}</p>
              <p className="text-xs text-muted-foreground">Fáceis</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byDifficulty.medio}</p>
              <p className="text-xs text-muted-foreground">Médias</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <TrendingUp className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byDifficulty.dificil}</p>
              <p className="text-xs text-muted-foreground">Difíceis</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs e Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="todas">Todas</TabsTrigger>
                  <TabsTrigger value="ativas">Ativas</TabsTrigger>
                  <TabsTrigger value="inativas">Inativas</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar questões..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="facil">🟢 Fácil</SelectItem>
                    <SelectItem value="medio">🟡 Médio</SelectItem>
                    <SelectItem value="dificil">🔴 Difícil</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={bancaFilter} onValueChange={setBancaFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Banca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {BANCAS.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabela de Questões */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Nenhuma questão encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || difficultyFilter !== 'all' || bancaFilter !== 'all'
                    ? 'Tente ajustar os filtros'
                    : 'Clique em "Nova Questão" para começar'}
                </p>
                <Button onClick={() => {
                  setSelectedQuestion(null);
                  setQuestionDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Questão
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Enunciado</TableHead>
                    <TableHead>Dificuldade</TableHead>
                    <TableHead>Banca</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-md">
                          <p className="line-clamp-2 text-sm">
                            {question.question_text}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border", DIFFICULTY_MAP[question.difficulty]?.color)}>
                          {DIFFICULTY_MAP[question.difficulty]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {BANCAS.find(b => b.value === question.banca)?.label || question.banca}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.ano}</TableCell>
                      <TableCell>
                        <Badge variant={question.is_active ? "default" : "secondary"}>
                          {question.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(question)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(question)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(question.id, question.is_active)}>
                              {question.is_active ? (
                                <>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteConfirm(question.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog de Questão */}
      <QuestionDialog
        open={questionDialog}
        onClose={() => {
          setQuestionDialog(false);
          setSelectedQuestion(null);
        }}
        onSuccess={loadQuestions}
        question={selectedQuestion}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A questão será permanentemente excluída do banco de dados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Questão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default memo(GestaoQuestoes);
