// ============================================
// 📄 GESTÃO DE MATERIAIS PDF
// Organização: CONTEUDISTA → 5 MACROS → MICROS
// Tecnologia: PDF.js + Signed URLs + Watermarks
// COMPRESSÃO DE PDF: ATIVO (pdf-lib)
// ============================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Upload, 
  Edit, 
  Archive, 
  Eye, 
  Trash2,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Tag,
  Download,
  Shield,
  Users,
  Brain,
  HelpCircle,
  FlaskConical,
  Atom,
  Beaker,
  Leaf,
  Dna,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';
import { compressPdf, formatBytes } from '@/lib/pdfCompression';

// ============================================
// TIPOS
// ============================================

interface Material {
  id: string;
  title: string;
  description?: string;
  category: string;
  content_type: string;
  macro?: string;
  micro?: string;
  status: 'draft' | 'processing' | 'ready' | 'archived';
  tags: string[];
  total_pages: number;
  created_at: string;
  updated_at: string;
  view_count: number;
  download_count: number;
  unique_readers: number;
  cover_url?: string | null;
  file_path: string;
  file_name?: string;
  file_size_bytes?: number;
  watermark_enabled: boolean;
  is_premium: boolean;
  ano?: number;
  mes?: number;
  folder?: string;
  position?: number;
}

// ============================================
// TIPOS DE CONTEÚDO (CONTEUDISTA)
// ============================================

const CONTENT_TYPES = [
  { value: 'mapa_mental', label: '🧠 Mapa Mental', icon: Brain },
  { value: 'questoes', label: '❓ Questões', icon: HelpCircle },
  { value: 'resumo', label: '📋 Resumo', icon: FileText },
  { value: 'formula', label: '🔬 Fórmulas', icon: FlaskConical },
  { value: 'tabela', label: '📊 Tabela', icon: Tag },
  { value: 'outros', label: '📁 Outros', icon: FolderOpen },
];

// 5 MACROS CANÔNICOS
const MACRO_CONFIG: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  'quimica_geral': { icon: Atom, color: 'text-amber-500', gradient: 'from-amber-500 to-orange-500' },
  'fisico_quimica': { icon: FlaskConical, color: 'text-cyan-500', gradient: 'from-cyan-500 to-blue-500' },
  'quimica_organica': { icon: Beaker, color: 'text-purple-500', gradient: 'from-purple-500 to-violet-500' },
  'quimica_ambiental': { icon: Leaf, color: 'text-green-500', gradient: 'from-green-500 to-emerald-500' },
  'bioquimica': { icon: Dna, color: 'text-pink-500', gradient: 'from-pink-500 to-rose-500' },
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'bg-muted', icon: Edit },
  processing: { label: 'Processando', color: 'bg-blue-500', icon: Loader2 },
  ready: { label: 'Publicado', color: 'bg-green-500', icon: CheckCircle },
  archived: { label: 'Arquivado', color: 'bg-gray-500', icon: Archive },
};

// ============================================
// 5 HUB CARDS — ESPELHADO DE /alunos/materiais
// ============================================

interface CardFilter {
  value: string;
  label: string;
  category?: string;
}

interface HubCard {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  filters: CardFilter[];
}

// Bancas para Direcionamentos e Provas Anteriores (19 bancas)
const BANCAS_FILTERS: CardFilter[] = [
  { value: 'enem', label: 'ENEM', category: 'nacional' },
  { value: 'fuvest', label: 'FUVEST', category: 'sp' },
  { value: 'unicamp', label: 'UNICAMP', category: 'sp' },
  { value: 'unesp', label: 'UNESP', category: 'sp' },
  { value: 'unifesp', label: 'UNIFESP', category: 'sp' },
  { value: 'famerp', label: 'FAMERP', category: 'sp' },
  { value: 'ita', label: 'ITA', category: 'militar' },
  { value: 'especex', label: 'ESPECEX', category: 'militar' },
  { value: 'unb', label: 'UNB', category: 'centro-oeste' },
  { value: 'ufpr', label: 'UFPR', category: 'sul' },
  { value: 'ufrgs', label: 'UFRGS', category: 'sul' },
  { value: 'uel', label: 'UEL', category: 'sul' },
  { value: 'uerj', label: 'UERJ', category: 'rj' },
  { value: 'upe', label: 'UPE', category: 'nordeste' },
  { value: 'uece', label: 'UECE', category: 'nordeste' },
  { value: 'uema', label: 'UEMA', category: 'nordeste' },
  { value: 'uneb', label: 'UNEB', category: 'nordeste' },
  { value: 'ufam', label: 'UFAM', category: 'norte' },
  { value: 'ufgd', label: 'UFGD', category: 'centro-oeste' },
];

// 5 MACROS Químicos
const MACRO_FILTERS: CardFilter[] = [
  { value: 'quimica_geral', label: 'Química Geral' },
  { value: 'fisico_quimica', label: 'Físico-Química' },
  { value: 'quimica_organica', label: 'Química Orgânica' },
  { value: 'quimica_ambiental', label: 'Química Ambiental' },
  { value: 'bioquimica', label: 'Bioquímica' },
];

// 5 HUB CARDS — Exatamente igual a /alunos/materiais
const HUB_CARDS: HubCard[] = [
  {
    id: 'questoes-mapas',
    name: 'Questões e Mapas Mentais',
    icon: '🧠',
    description: 'Material de estudo com questões e mapas mentais',
    color: 'rose',
    filters: MACRO_FILTERS,
  },
  {
    id: 'direcionamentos',
    name: 'Direcionamentos Vestibulares',
    icon: '🎯',
    description: 'Materiais direcionados para cada vestibular',
    color: 'cyan',
    filters: BANCAS_FILTERS,
  },
  {
    id: 'provas-anteriores',
    name: 'Provas Anteriores',
    icon: '🏆',
    description: 'Provas anteriores resolvidas e comentadas',
    color: 'amber',
    filters: BANCAS_FILTERS,
  },
  {
    id: 'extras',
    name: 'Extras',
    icon: '📦',
    description: 'Levantamentos, cronogramas e extras',
    color: 'emerald',
    filters: [
      { value: 'levantamento_enem', label: 'Levantamento ENEM' },
      { value: 'cronograma', label: 'Cronograma' },
      { value: 'extras', label: 'Extras' },
    ],
  },
  {
    id: 'flush-card',
    name: 'Flush Card',
    icon: '⚡',
    description: 'Cards de revisão rápida',
    color: 'violet',
    filters: [
      { value: 'flush_card', label: 'Flush Card' },
    ],
  },
];

// ============================================
// UPLOAD DIALOG COM TAXONOMIA — BATCH 50 PDFs
// ============================================

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FileWithMeta {
  file: File;
  id: string;
  title: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const MAX_FILES = 50;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB per file

const UploadDialog = memo(function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const [files, setFiles] = useState<FileWithMeta[]>([]);
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('mapa_mental');
  const [selectedCard, setSelectedCard] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedMicro, setSelectedMicro] = useState('');
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [isPremium, setIsPremium] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // Get taxonomy for micro selection
  const { getMicrosForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();

  // Get current card and its filters
  const currentCard = HUB_CARDS.find(c => c.id === selectedCard);
  const cardFilters = currentCard?.filters || [];
  
  // Get micros for selected macro (only for questoes-mapas card)
  const isQuestoesMapas = selectedCard === 'questoes-mapas';
  const availableMicros = isQuestoesMapas && selectedFilter ? getMicrosForSelect(selectedFilter) : [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const tooMany = rejectedFiles.find(r => r.errors.some(e => e.code === 'too-many-files'));
        if (tooMany) {
          toast.error(`Máximo de ${MAX_FILES} arquivos permitidos`);
        }
        rejectedFiles.forEach(r => {
          r.errors.forEach(e => {
            if (e.code === 'file-too-large') {
              toast.error(`${r.file.name}: Arquivo muito grande (máx 100MB)`);
            }
          });
        });
      }

      const currentCount = files.length;
      const availableSlots = MAX_FILES - currentCount;
      const filesToAdd = acceptedFiles.slice(0, availableSlots);

      if (acceptedFiles.length > availableSlots) {
        toast.warning(`Apenas ${availableSlots} arquivos adicionados (limite de ${MAX_FILES})`);
      }

      const newFiles: FileWithMeta[] = filesToAdd.map(f => ({
        file: f,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: f.name.replace(/\.pdf$/i, ''),
        status: 'pending' as const,
        progress: 0,
      }));

      setFiles(prev => [...prev, ...newFiles]);
    }
  });

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleTitleChange = useCallback((id: string, newTitle: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, title: newTitle } : f
    ));
  }, []);

  const handleCardChange = (value: string) => {
    setSelectedCard(value);
    setSelectedFilter(''); // Reset filter when card changes
    setSelectedMicro(''); // Reset micro when card changes
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    setSelectedMicro(''); // Reset micro when filter changes
  };

  const uploadSingleFile = async (
    fileMeta: FileWithMeta, 
    userId: string, 
    now: Date
  ): Promise<boolean> => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileMeta.id ? { ...f, status: 'uploading', progress: 5 } : f
      ));

      // ============================================
      // COMPRESSÃO DE PDF OBRIGATÓRIA (MATERIAIS)
      // ============================================
      let fileToUpload = fileMeta.file;
      let originalSize = fileMeta.file.size;
      let compressedSize = fileMeta.file.size;
      
      if (fileMeta.file.type === 'application/pdf' || fileMeta.file.name.toLowerCase().endsWith('.pdf')) {
        setFiles(prev => prev.map(f => 
          f.id === fileMeta.id ? { ...f, progress: 10 } : f
        ));
        
        const compressionResult = await compressPdf(fileMeta.file);
        fileToUpload = compressionResult.file;
        originalSize = compressionResult.originalSize;
        compressedSize = compressionResult.compressedSize;
        
        if (compressionResult.reductionPercent > 0) {
          console.log(`[Materiais] PDF comprimido: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${compressionResult.reductionPercent.toFixed(1)}%)`);
        }
      }

      setFiles(prev => prev.map(f => 
        f.id === fileMeta.id ? { ...f, progress: 25 } : f
      ));

      const ano = now.getFullYear();
      const mes = now.getMonth() + 1;
      const dia = now.getDate();
      const semana = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);

      // Organizar por: card/filter/data
      const folder = `${selectedCard}/${selectedFilter || 'geral'}/${ano}/${String(mes).padStart(2, '0')}`;
      const fileName = `${Date.now()}_${fileMeta.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${folder}/${fileName}`;

      setFiles(prev => prev.map(f => 
        f.id === fileMeta.id ? { ...f, progress: 40 } : f
      ));

      // Upload do arquivo (comprimido se PDF)
      const { error: uploadError } = await supabase.storage
        .from('materiais')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setFiles(prev => prev.map(f => 
        f.id === fileMeta.id ? { ...f, progress: 70 } : f
      ));

      // Determine macro based on card type
      const isQuestoesMacro = selectedCard === 'questoes-mapas';
      const macroValue = isQuestoesMacro ? selectedFilter : null;

      const { error: dbError } = await supabase
        .from('materials')
        .insert({
          title: fileMeta.title.trim(),
          description: description.trim() || null,
          category: selectedCard, // Card ID = category (para mapeamento com alunos)
          content_type: contentType,
          // Se for questoes-mapas, o filtro vai em macro (5 macros químicos) e micro
          // Para os demais cards, o filtro vai em tags (bancas, extras, etc.)
          macro: isQuestoesMacro ? selectedFilter : null,
          micro: isQuestoesMacro && selectedMicro ? selectedMicro : null,
          tags: !isQuestoesMacro && selectedFilter ? [selectedFilter] : [],
          status: 'ready',
          file_path: filePath,
          file_name: fileMeta.file.name,
          file_size_bytes: compressedSize, // Tamanho COMPRIMIDO salvo no banco
          watermark_enabled: watermarkEnabled,
          is_premium: isPremium,
          created_by: userId,
        });

      if (dbError) throw dbError;

      setFiles(prev => prev.map(f => 
        f.id === fileMeta.id ? { ...f, status: 'success', progress: 100 } : f
      ));

      return true;
    } catch (error: any) {
      console.error(`Erro no upload de ${fileMeta.file.name}:`, error);
      setFiles(prev => prev.map(f => 
        f.id === fileMeta.id ? { ...f, status: 'error', error: error.message, progress: 0 } : f
      ));
      return false;
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    
    if (pendingFiles.length === 0) {
      toast.error('Nenhum arquivo para enviar');
      return;
    }
    if (!selectedCard) {
      toast.error('Selecione um Card de destino');
      return;
    }
    if (!selectedFilter) {
      toast.error('Selecione um Filtro');
      return;
    }

    const emptyTitles = pendingFiles.filter(f => !f.title.trim());
    if (emptyTitles.length > 0) {
      toast.error(`${emptyTitles.length} arquivo(s) sem título`);
      return;
    }

    setUploading(true);
    setOverallProgress(0);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');

      const now = new Date();
      let successCount = 0;
      let errorCount = 0;

      const BATCH_SIZE = 5;
      for (let i = 0; i < pendingFiles.length; i += BATCH_SIZE) {
        const batch = pendingFiles.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(f => uploadSingleFile(f, userData.user!.id, now))
        );
        
        successCount += results.filter(r => r).length;
        errorCount += results.filter(r => !r).length;
        
        setOverallProgress(Math.round(((i + batch.length) / pendingFiles.length) * 100));
      }

      if (successCount > 0) {
        toast.success(`${successCount} material(is) enviado(s) para "${currentCard?.name}"!`);
        onSuccess();
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} arquivo(s) com erro`);
      }

      setFiles(prev => prev.filter(f => f.status !== 'success'));

      if (errorCount === 0) {
        onOpenChange(false);
        resetForm();
      }

    } catch (error: any) {
      console.error('Erro geral no upload:', error);
      toast.error(error.message || 'Erro no upload');
    } finally {
      setUploading(false);
      setOverallProgress(0);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setDescription('');
    setContentType('mapa_mental');
    setSelectedCard('');
    setSelectedFilter('');
    setWatermarkEnabled(true);
    setIsPremium(true);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Novo Material PDF
            <Badge variant="outline" className="ml-2">
              Até {MAX_FILES} arquivos
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Selecione o Card e Filtro de destino — espelha /alunos/materiais
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
              isDragActive && "border-primary bg-primary/5 scale-[1.02]",
              files.length > 0 && "border-green-500/50 bg-green-500/5"
            )}
          >
            <input {...getInputProps()} />
            <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">
              {isDragActive ? 'Solte os arquivos aqui...' : 'Arraste PDFs aqui'}
            </p>
            <p className="text-sm text-muted-foreground">
              ou clique para selecionar (máx 100MB cada)
            </p>
            {files.length > 0 && (
              <Badge className="mt-2" variant="secondary">
                {files.length}/{MAX_FILES} arquivos selecionados
              </Badge>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Arquivos ({files.length})</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar todos
                </Button>
              </div>
              <ScrollArea className="h-[150px] border rounded-lg p-2">
                <div className="space-y-2">
                  {files.map((fileMeta) => (
                    <div 
                      key={fileMeta.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                        fileMeta.status === 'success' && "bg-green-500/10 border-green-500/30",
                        fileMeta.status === 'error' && "bg-red-500/10 border-red-500/30",
                        fileMeta.status === 'uploading' && "bg-blue-500/10 border-blue-500/30"
                      )}
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        {fileMeta.status === 'pending' && (
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        )}
                        {fileMeta.status === 'uploading' && (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {fileMeta.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {fileMeta.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input
                          value={fileMeta.title}
                          onChange={(e) => handleTitleChange(fileMeta.id, e.target.value)}
                          placeholder="Título do material"
                          disabled={uploading || fileMeta.status === 'success'}
                          className="h-8 text-sm"
                        />
                        {fileMeta.status === 'uploading' && (
                          <Progress value={fileMeta.progress} className="h-1 mt-1" />
                        )}
                        {fileMeta.error && (
                          <p className="text-xs text-red-500 mt-1 truncate">{fileMeta.error}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {(fileMeta.file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveFile(fileMeta.id)}
                        disabled={uploading || fileMeta.status === 'uploading'}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {(successCount > 0 || errorCount > 0) && (
                <div className="flex gap-2 text-sm">
                  {successCount > 0 && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {successCount} enviado(s)
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge variant="secondary" className="bg-red-500/20 text-red-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errorCount} erro(s)
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tipo de Conteúdo */}
          <div className="space-y-2">
            <Label>Tipo de Conteúdo *</Label>
            <Select value={contentType} onValueChange={setContentType} disabled={uploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>
                    {ct.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CARD SELECTION — Espelha /alunos/materiais */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Card de Destino * <span className="text-xs text-muted-foreground">(5 Cards do Portal Aluno)</span>
            </Label>
            <Select value={selectedCard} onValueChange={handleCardChange} disabled={uploading}>
              <SelectTrigger className={cn(
                "h-12",
                selectedCard && `border-${HUB_CARDS.find(c => c.id === selectedCard)?.color}-500/50`
              )}>
                <SelectValue placeholder="Selecione o card de destino..." />
              </SelectTrigger>
              <SelectContent>
                {HUB_CARDS.map((card, index) => (
                  <SelectItem key={card.id} value={card.id}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{card.icon}</span>
                      <div>
                        <span className="font-medium">{card.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({card.filters.length} filtros)
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentCard && (
              <p className="text-xs text-muted-foreground">
                {currentCard.description}
              </p>
            )}
          </div>

          {/* FILTER SELECTION — Baseado no Card selecionado */}
          {selectedCard && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {isQuestoesMapas ? 'Macro *' : 'Filtro *'} <span className="text-xs text-muted-foreground">({cardFilters.length} opções)</span>
              </Label>
              <Select value={selectedFilter} onValueChange={handleFilterChange} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder={isQuestoesMapas ? "Selecione o macro..." : "Selecione o filtro..."} />
                </SelectTrigger>
                <SelectContent>
                  {cardFilters.map(filter => (
                    <SelectItem key={filter.value} value={filter.value}>
                      <div className="flex items-center gap-2">
                        <span>{filter.label}</span>
                        {filter.category && (
                          <Badge variant="outline" className="text-xs">
                            {filter.category}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* MICRO SELECTION — Apenas para card questoes-mapas quando macro selecionado */}
          {isQuestoesMapas && selectedFilter && availableMicros.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Micro <span className="text-xs text-muted-foreground">(opcional, {availableMicros.length} opções)</span>
              </Label>
              <Select value={selectedMicro} onValueChange={setSelectedMicro} disabled={uploading || taxonomyLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o micro (opcional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <span className="text-muted-foreground">Nenhum (apenas macro)</span>
                  </SelectItem>
                  {availableMicros.map(micro => (
                    <SelectItem key={micro.value} value={micro.value}>
                      {micro.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview do destino */}
          {selectedCard && selectedFilter && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                <CheckCircle className="w-4 h-4 text-primary" />
                Destino: <span className="text-primary">{currentCard?.icon} {currentCard?.name}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-primary">{cardFilters.find(f => f.value === selectedFilter)?.label}</span>
                {isQuestoesMapas && selectedMicro && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-primary">{availableMicros.find(m => m.value === selectedMicro)?.label}</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição (aplicada a todos)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do material..."
              rows={2}
              disabled={uploading}
            />
          </div>

          {/* Opções */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={watermarkEnabled}
                onCheckedChange={setWatermarkEnabled}
                disabled={uploading}
              />
              <Label className="flex items-center gap-1 cursor-pointer">
                <Shield className="w-4 h-4" />
                Marca d'água
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isPremium}
                onCheckedChange={setIsPremium}
                disabled={uploading}
              />
              <Label className="flex items-center gap-1 cursor-pointer">
                <Users className="w-4 h-4" />
                Apenas Premium
              </Label>
            </div>
          </div>

          {/* Overall Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={overallProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Enviando... {overallProgress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUploadAll} 
            disabled={uploading || pendingCount === 0 || !selectedCard || !selectedFilter}
            className="min-w-[140px]"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar {pendingCount > 1 ? `${pendingCount} PDFs` : 'PDF'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// MATERIAL ROW
// ============================================

interface MaterialRowProps {
  material: Material;
  onView: () => void;
  onStatusChange: (id: string, status: 'draft' | 'processing' | 'ready' | 'archived') => void;
  onDelete: (id: string) => void;
}

const MaterialRow = memo(function MaterialRow({ 
  material, 
  onView, 
  onStatusChange, 
  onDelete 
}: MaterialRowProps) {
  const macroConfig = MACRO_CONFIG[material.macro || ''];
  const MacroIcon = macroConfig?.icon || Atom;
  
  return (
    <TableRow className="group hover:bg-muted/30 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[200px]" title={material.title}>
              {material.title}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {material.file_name}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {material.macro?.replace('_', ' ') || 'Geral'}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {material.micro || '-'}
        </span>
      </TableCell>
      <TableCell>
        <Select 
          value={material.status} 
          onValueChange={(val: any) => onStatusChange(material.id, val)}
        >
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="ready">Pronto</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="w-3 h-3" />
          {material.view_count || 0}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {new Date(material.created_at).toLocaleDateString()}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(material.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

// ============================================
// MACRO SECTION (Collapsible)
// ============================================

interface MacroSectionProps {
  macroValue: string;
  macroLabel: string;
  materials: Material[];
  onView: (m: Material) => void;
  onStatusChange: (id: string, status: 'draft' | 'processing' | 'ready' | 'archived') => void;
  onDelete: (id: string) => void;
  defaultOpen?: boolean;
}

const MacroSection = memo(function MacroSection({ 
  macroValue, 
  macroLabel, 
  materials, 
  onView, 
  onStatusChange, 
  onDelete,
  defaultOpen = false 
}: MacroSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config = MACRO_CONFIG[macroValue] || MACRO_CONFIG['quimica_geral'];
  const Icon = config.icon;

  if (materials.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-all">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-gradient-to-br", config.gradient)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">{macroLabel}</CardTitle>
                  <CardDescription>{materials.length} materiais</CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <Card className="mt-2 border-t-0 rounded-t-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Macro</TableHead>
                <TableHead>Micro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map(m => (
                <MaterialRow
                  key={m.id}
                  material={m}
                  onView={() => onView(m)}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const GestaoMateriais = memo(function GestaoMateriais() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [macroFilter, setMacroFilter] = useState<string>('all');
  const [microFilter, setMicroFilter] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);

  const { macros, getMicrosForSelect } = useTaxonomyForSelects();
  const microsForFilter = macroFilter && macroFilter !== 'all' ? getMicrosForSelect(macroFilter) : [];

  // Reset micro filter when macro changes
  const handleMacroFilterChange = (value: string) => {
    setMacroFilter(value);
    setMicroFilter('all');
  };

  // Buscar materiais
  const fetchMaterials = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials((data as Material[]) || []);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();

    const channel = supabase
      .channel('materials_gestao_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        fetchMaterials();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMaterials]);

  // Filtros
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesContentType = contentTypeFilter === 'all' || m.content_type === contentTypeFilter;
      const matchesMacro = macroFilter === 'all' || m.macro === macroFilter;
      const matchesMicro = microFilter === 'all' || m.micro === microFilter;
      return matchesSearch && matchesContentType && matchesMacro && matchesMicro;
    });
  }, [materials, searchQuery, contentTypeFilter, macroFilter, microFilter]);

  // Agrupar por MACRO
  const materialsByMacro = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    macros.forEach(m => {
      grouped[m.value] = filteredMaterials.filter(mat => mat.macro === m.value);
    });
    // Adicionar materiais sem macro
    grouped['sem_macro'] = filteredMaterials.filter(m => !m.macro);
    return grouped;
  }, [filteredMaterials, macros]);

  // Ações
  const handleStatusChange = async (id: string, newStatus: 'draft' | 'processing' | 'ready' | 'archived') => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Status atualizado');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;
    
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Material excluído');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir');
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: materials.length,
    mapas: materials.filter(m => m.content_type === 'mapa_mental').length,
    questoes: materials.filter(m => m.content_type === 'questoes').length,
    published: materials.filter(m => m.status === 'ready').length,
  }), [materials]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Gestão de Materiais PDF
          </h1>
          <p className="text-muted-foreground">
            Organize por tipo de conteúdo e taxonomia (5 Macros)
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Material
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-pink-500" />
            <div>
              <p className="text-2xl font-bold">{stats.mapas}</p>
              <p className="text-sm text-muted-foreground">Mapas Mentais</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.questoes}</p>
              <p className="text-sm text-muted-foreground">Questões</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <p className="text-sm text-muted-foreground">Publicados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {CONTENT_TYPES.map(ct => (
              <SelectItem key={ct.value} value={ct.value}>
                {ct.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={macroFilter} onValueChange={handleMacroFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Macro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Macros</SelectItem>
            {macros.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={microFilter} 
          onValueChange={setMicroFilter}
          disabled={macroFilter === 'all'}
        >
          <SelectTrigger className={cn(
            "w-full sm:w-48",
            macroFilter === 'all' && "opacity-50"
          )}>
            <SelectValue placeholder="Micro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Micros</SelectItem>
            {microsForFilter.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista por MACRO */}
      <div className="space-y-4">
        {filteredMaterials.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum material encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece enviando seu primeiro PDF
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Material
            </Button>
          </Card>
        ) : (
          macros.map((macro, index) => (
            <MacroSection
              key={macro.value}
              macroValue={macro.value}
              macroLabel={macro.label}
              materials={materialsByMacro[macro.value] || []}
              onView={setViewingMaterial}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              defaultOpen={index === 0}
            />
          ))
        )}

        {/* Materiais sem MACRO */}
        {materialsByMacro['sem_macro']?.length > 0 && (
          <Card className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
                Sem Macro Definido
              </CardTitle>
            </CardHeader>
            <Table>
              <TableBody>
                {materialsByMacro['sem_macro'].map(m => (
                  <MaterialRow
                    key={m.id}
                    material={m}
                    onView={() => setViewingMaterial(m)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={fetchMaterials}
      />

      {/* Material Viewer */}
      <AnimatePresence>
        {viewingMaterial && (
          <MaterialViewer
            material={viewingMaterial}
            onClose={() => setViewingMaterial(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default GestaoMateriais;
