// ============================================
// 📄 GESTÃO DE MATERIAIS
// Organização: CONTEUDISTA → 5 MACROS → MICROS
// Tecnologia: PDF.js + Signed URLs + Watermarks
// Aceita QUALQUER tipo de arquivo (PDF, imagem, DOC, etc.)
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
import { convertMicroValueToLabel } from '@/lib/taxonomyLabelConverter';
import { compressPdf, formatBytes } from '@/lib/pdfCompression';
import { usePdfPreviewGenerator } from '@/hooks/usePdfPreviewGenerator';

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
  bucket?: string;
  preview_status?: 'pending' | 'processing' | 'ready' | 'error' | 'skipped';
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

// 5 MACROS Químicos — valores CANÔNICOS (slug) para espelhar /alunos/materiais
// (o label exibido segue humano; o value precisa bater com MaterialsFilteredView.eq('macro', filterValue))
// ZERO EMOJIS (Constituição v10.4)
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
    id: 'flash-cards',
    name: 'Flash Cards',
    icon: '⚡',
    description: 'Cards de revisão rápida',
    color: 'violet',
    filters: [
      { value: 'flash_cards', label: 'Flash Cards' },
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

  // PDF Preview Generator
  const { generatePreviewFromFile, updateRecordPreview } = usePdfPreviewGenerator();

  // Get taxonomy for micro selection
  const { getMicrosForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();

  // Get current card and its filters
  const currentCard = HUB_CARDS.find(c => c.id === selectedCard);
  const cardFilters = currentCard?.filters || [];
  
  // Get micros for selected macro (only for questoes-mapas card)
  const isQuestoesMapas = selectedCard === 'questoes-mapas';
  const availableMicros = isQuestoesMapas && selectedFilter ? getMicrosForSelect(selectedFilter) : [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    // Aceita QUALQUER tipo de arquivo (não apenas PDF)
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

      const newFiles: FileWithMeta[] = filesToAdd.map(f => {
        // Remove extensão do título (qualquer extensão, não só .pdf)
        const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '');
        return {
          file: f,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: nameWithoutExt,
          status: 'pending' as const,
          progress: 0,
        };
      });

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

      // Determinar se é PDF para gerar preview
      const isPdf = fileMeta.file.type === 'application/pdf' || fileMeta.file.name.toLowerCase().endsWith('.pdf');

      const { data: insertedData, error: dbError } = await supabase
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
          preview_status: isPdf ? 'processing' : 'skipped', // Marca status inicial
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      setFiles(prev => prev.map(f => 
        f.id === fileMeta.id ? { ...f, progress: 80 } : f
      ));

      // ============================================
      // GERAR PREVIEW DO PDF (ASSÍNCRONO)
      // ============================================
      if (isPdf && insertedData?.id) {
        // Gerar preview em background (não bloqueia o upload)
        const previewPath = `materials/${insertedData.id}.webp`;
        
        generatePreviewFromFile(fileToUpload, previewPath)
          .then(async (result) => {
            if (result.success && result.previewUrl) {
              await updateRecordPreview('materials', insertedData.id, result.previewUrl, 'ready');
              console.log(`[Materiais] Preview gerada: ${fileMeta.title}`);
            } else {
              await updateRecordPreview('materials', insertedData.id, null, 'error');
              console.warn(`[Materiais] Falha ao gerar preview: ${result.error}`);
            }
          })
          .catch((err) => {
            console.error(`[Materiais] Erro ao gerar preview:`, err);
            updateRecordPreview('materials', insertedData.id, null, 'error');
          });
      }

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
            Novo Material
            <Badge variant="outline" className="ml-2">
              Até {MAX_FILES} arquivos
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Aceita qualquer tipo de arquivo (PDF, imagem, DOC, etc.) — espelha /alunos/materiais
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
              {isDragActive ? 'Solte os arquivos aqui...' : 'Arraste arquivos aqui'}
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, imagens, documentos e mais (máx 100MB cada)
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

          {/* MICRO SELECTION — Questões e Mapas Mentais */}
          {isQuestoesMapas && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Micro-assuntos
                <span className="text-xs text-muted-foreground">
                  (por macro — espelha /alunos/materiais{taxonomyLoading ? ', carregando…' : ''})
                </span>
              </Label>

              {/* ✅ Seleção rápida: 5 macros + TODOS os micros associados */}
              <div className="rounded-lg border bg-card/30 p-3 space-y-3">
                {taxonomyLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando taxonomia…</div>
                ) : (
                  <div className="space-y-4">
                    {MACRO_FILTERS.map((macro) => {
                      const micros = getMicrosForSelect(macro.value);
                      const isSelectedMacro = selectedFilter === macro.value;

                      return (
                        <div key={macro.value} className="space-y-2">
                          <button
                            type="button"
                            onClick={() => handleFilterChange(macro.value)}
                            className={cn(
                              "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left",
                              "border transition-colors",
                              isSelectedMacro ? "bg-accent/30 border-accent" : "bg-background/20 border-border hover:bg-accent/20"
                            )}
                          >
                            <span className="font-medium text-sm">{macro.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {micros.length} micros
                            </Badge>
                          </button>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant={isSelectedMacro && !selectedMicro ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => {
                                handleFilterChange(macro.value);
                                setSelectedMicro('');
                              }}
                            >
                              Apenas macro
                            </Button>

                            {micros.map((micro) => (
                              <Button
                                key={micro.value}
                                type="button"
                                variant={isSelectedMacro && selectedMicro === micro.value ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  handleFilterChange(macro.value);
                                  setSelectedMicro(micro.value);
                                }}
                              >
                                {micro.label}
                              </Button>
                            ))}

                            {micros.length === 0 && (
                              <span className="text-xs text-muted-foreground">Nenhum micro cadastrado para este macro.</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 🔽 MICRO ASSUNTO — Aparece SOMENTE após selecionar Macro */}
          {isQuestoesMapas && selectedFilter && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span>📚 Micro Assunto</span>
                <Badge variant="outline" className="text-xs">Opcional</Badge>
              </Label>
              <Select
                value={selectedMicro || "__none__"}
                onValueChange={(val) => setSelectedMicro(val === "__none__" ? "" : val)}
                disabled={uploading || taxonomyLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o micro assunto..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">Nenhum (apenas macro)</span>
                  </SelectItem>
                  {getMicrosForSelect(selectedFilter).map((micro) => (
                    <SelectItem key={micro.value} value={micro.value || micro.label}>
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
// MATERIAL ROW — Exibe associações completas
// ============================================

interface MaterialRowProps {
  material: Material;
  onView: () => void;
  onStatusChange: (id: string, status: 'draft' | 'processing' | 'ready' | 'archived') => void;
  onDelete: (id: string) => void;
  getMicroLabel: (microValue: string, macroValue: string) => string;
}

// Helper para obter info do Hub Card
const getHubCardInfo = (category: string) => {
  const card = HUB_CARDS.find(c => c.id === category);
  return card || { id: 'unknown', name: 'Desconhecido', icon: '📄', color: 'gray', filters: [] };
};

// Helper para obter label do filtro
const getFilterLabel = (category: string, filterValue: string) => {
  const card = HUB_CARDS.find(c => c.id === category);
  if (!card) return filterValue;
  const filter = card.filters.find(f => f.value === filterValue);
  return filter?.label || filterValue;
};

// Helper para obter label do macro
const getMacroLabel = (macro: string) => {
  const macroFilter = MACRO_FILTERS.find(m => m.value === macro);
  return macroFilter?.label || macro?.replace('_', ' ') || '';
};

const MaterialRow = memo(function MaterialRow({ 
  material, 
  onView, 
  onStatusChange, 
  onDelete,
  getMicroLabel,
}: MaterialRowProps) {
  const cardInfo = getHubCardInfo(material.category);
  const isQuestoesMapas = material.category === 'questoes-mapas';
  
  // Para questoes-mapas: filtro está no macro
  // Para outros cards: filtro está nas tags[0]
  const filterValue = isQuestoesMapas ? material.macro : (material.tags?.[0] || '');
  const filterLabel = isQuestoesMapas 
    ? getMacroLabel(material.macro || '') 
    : getFilterLabel(material.category, filterValue || '');
  
  return (
    <TableRow className="group hover:bg-muted/30 transition-colors">
      {/* Material */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[180px]" title={material.title}>
              {material.title}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
              {material.file_name}
            </p>
          </div>
        </div>
      </TableCell>
      
      {/* Hub Card */}
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className="text-base">{cardInfo.icon}</span>
          <span className="text-xs font-medium truncate max-w-[100px]" title={cardInfo.name}>
            {cardInfo.name.length > 12 ? cardInfo.name.substring(0, 12) + '...' : cardInfo.name}
          </span>
        </div>
      </TableCell>
      
      {/* Filtro/Associação */}
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {filterLabel || '-'}
        </Badge>
      </TableCell>
      
      {/* Micro (apenas para questoes-mapas) */}
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {isQuestoesMapas && material.micro
            ? (getMicroLabel(material.micro, material.macro || '') || '-')
            : '-'}
        </span>
      </TableCell>
      
      {/* Status */}
      <TableCell>
        <Select 
          value={material.status} 
          onValueChange={(val: any) => onStatusChange(material.id, val)}
        >
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="ready">Pronto</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      
      {/* Views */}
      <TableCell>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="w-3 h-3" />
          {material.view_count || 0}
        </div>
      </TableCell>
      
      {/* Data */}
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {new Date(material.created_at).toLocaleDateString('pt-BR')}
        </span>
      </TableCell>
      
      {/* Ações */}
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
// HUB CARD SECTION (Collapsible) — Agrupa por Card
// ============================================

interface HubCardSectionProps {
  card: HubCard;
  materials: Material[];
  onView: (m: Material) => void;
  onStatusChange: (id: string, status: 'draft' | 'processing' | 'ready' | 'archived') => void;
  onDelete: (id: string) => void;
  getMicroLabel: (microValue: string, macroValue: string) => string;
  defaultOpen?: boolean;
}

// Color mapping for hub cards
const HUB_CARD_GRADIENTS: Record<string, string> = {
  'questoes-mapas': 'from-rose-500 to-pink-500',
  'direcionamentos': 'from-cyan-500 to-blue-500',
  'provas-anteriores': 'from-amber-500 to-orange-500',
  'extras': 'from-emerald-500 to-green-500',
  'flush-card': 'from-violet-500 to-purple-500',
};

const HubCardSection = memo(function HubCardSection({ 
  card, 
  materials, 
  onView, 
  onStatusChange, 
  onDelete,
  getMicroLabel,
  defaultOpen = false 
}: HubCardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const gradient = HUB_CARD_GRADIENTS[card.id] || 'from-gray-500 to-slate-500';

  if (materials.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-all">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-gradient-to-br", gradient)}>
                  <span className="text-xl">{card.icon}</span>
                </div>
                <div>
                  <CardTitle className="text-base">{card.name}</CardTitle>
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
                <TableHead>Hub Card</TableHead>
                <TableHead>Filtro</TableHead>
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
                  getMicroLabel={getMicroLabel}
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

const ITEMS_PER_PAGE = 20;

const GestaoMateriais = memo(function GestaoMateriais() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardFilter, setCardFilter] = useState<string>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [macroFilter, setMacroFilter] = useState<string>('all');
  const [microFilter, setMicroFilter] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Batch preview generation state
  const [generatingPreviews, setGeneratingPreviews] = useState(false);
  const [previewProgress, setPreviewProgress] = useState({ current: 0, total: 0 });
  const { generatePreview, updateRecordPreview } = usePdfPreviewGenerator();

  const { macros, getMicrosForSelect } = useTaxonomyForSelects();
  const microsForFilter = macroFilter && macroFilter !== 'all' ? getMicrosForSelect(macroFilter) : [];

  // Converter micro value → label (NUNCA expor value se label não existir)
  const getMicroLabel = useCallback((microValue: string, macroValue: string) => {
    return convertMicroValueToLabel(microValue, macroValue, getMicrosForSelect);
  }, [getMicrosForSelect]);

  // Reset filters when card changes
  const handleCardFilterChange = (value: string) => {
    setCardFilter(value);
    if (value !== 'questoes-mapas') {
      setMacroFilter('all');
      setMicroFilter('all');
    }
  };

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, cardFilter, contentTypeFilter, macroFilter, microFilter]);

  // Filtros
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCard = cardFilter === 'all' || m.category === cardFilter;
      const matchesContentType = contentTypeFilter === 'all' || m.content_type === contentTypeFilter;
      const matchesMacro = macroFilter === 'all' || m.macro === macroFilter;
      const matchesMicro = microFilter === 'all' || m.micro === microFilter;
      return matchesSearch && matchesCard && matchesContentType && matchesMacro && matchesMicro;
    });
  }, [materials, searchQuery, cardFilter, contentTypeFilter, macroFilter, microFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMaterials.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMaterials, currentPage]);

  // Agrupar materiais PAGINADOS por HUB CARD (category)
  const materialsByCard = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    HUB_CARDS.forEach(card => {
      grouped[card.id] = paginatedMaterials.filter(mat => mat.category === card.id);
    });
    // Adicionar materiais sem categoria definida
    grouped['sem_card'] = paginatedMaterials.filter(m => !m.category || !HUB_CARDS.some(c => c.id === m.category));
    return grouped;
  }, [paginatedMaterials]);

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

  // Stats — por Hub Card
  const stats = useMemo(() => ({
    total: materials.length,
    byCard: HUB_CARDS.reduce((acc, card) => {
      acc[card.id] = materials.filter(m => m.category === card.id).length;
      return acc;
    }, {} as Record<string, number>),
    published: materials.filter(m => m.status === 'ready').length,
    pendingPreviews: materials.filter(m => 
      (!m.cover_url || m.preview_status === 'pending' || m.preview_status === 'error') &&
      (m.file_path?.toLowerCase().endsWith('.pdf'))
    ).length,
  }), [materials]);

  // ============================================
  // GERAR PREVIEWS EM LOTE
  // ============================================
  const handleBatchGeneratePreviews = useCallback(async () => {
    // Filtrar materiais PDF sem preview
    const pendingMaterials = materials.filter(m => 
      (!m.cover_url || m.preview_status === 'pending' || m.preview_status === 'error') &&
      (m.file_path?.toLowerCase().endsWith('.pdf')) &&
      m.bucket
    );

    if (pendingMaterials.length === 0) {
      toast.info('Todos os materiais já possuem preview!');
      return;
    }

    setGeneratingPreviews(true);
    setPreviewProgress({ current: 0, total: pendingMaterials.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < pendingMaterials.length; i++) {
      const material = pendingMaterials[i];
      setPreviewProgress({ current: i + 1, total: pendingMaterials.length });

      try {
        // Marcar como processing
        await supabase
          .from('materials')
          .update({ preview_status: 'processing' })
          .eq('id', material.id);

        // Obter signed URL do PDF
        const { data: signedData, error: signedError } = await supabase.storage
          .from(material.bucket!)
          .createSignedUrl(material.file_path!, 300); // 5 minutos

        if (signedError || !signedData?.signedUrl) {
          throw new Error(`Falha ao obter URL assinada: ${signedError?.message}`);
        }

        // Gerar preview
        const previewPath = `materials/${material.id}.webp`;
        const result = await generatePreview(signedData.signedUrl, previewPath);

        if (result.success && result.previewUrl) {
          await updateRecordPreview('materials', material.id, result.previewUrl, 'ready');
          successCount++;
        } else {
          await updateRecordPreview('materials', material.id, null, 'error');
          errorCount++;
        }
      } catch (error: any) {
        console.error(`[Batch Preview] Erro em ${material.title}:`, error);
        await updateRecordPreview('materials', material.id, null, 'error');
        errorCount++;
      }

      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setGeneratingPreviews(false);
    setPreviewProgress({ current: 0, total: 0 });
    fetchMaterials();

    if (successCount > 0 && errorCount === 0) {
      toast.success(`${successCount} previews gerados com sucesso!`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`${successCount} previews gerados, ${errorCount} erros`);
    } else {
      toast.error(`Falha ao gerar previews: ${errorCount} erros`);
    }
  }, [materials, generatePreview, updateRecordPreview, fetchMaterials]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* ============================================ */}
      {/* 🏠 HEADER — GESTÃO DE MATERIAIS */}
      {/* ============================================ */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/70">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            Gestão de Materiais
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Organização SUPREMA por <span className="font-semibold text-primary">5 Hub Cards</span> — 
            Espelhamento perfeito do Portal Aluno
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30">🧠 Questões</Badge>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">🎯 Direcion.</Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">🏆 Provas</Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">📦 Extras</Badge>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">⚡ Flush</Badge>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          {/* Botão de Gerar Previews em Lote */}
          {stats.pendingPreviews > 0 && (
            <Button 
              onClick={handleBatchGeneratePreviews} 
              variant="outline"
              size="lg" 
              className="gap-2"
              disabled={generatingPreviews}
            >
              {generatingPreviews ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando {previewProgress.current}/{previewProgress.total}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar Previews ({stats.pendingPreviews})
                </>
              )}
            </Button>
          )}
          <Button onClick={() => setUploadOpen(true)} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Novo Material
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* 📊 STATS DOS 5 HUB CARDS — VERDADE ABSOLUTA */}
      {/* ============================================ */}
      <div className="space-y-4">
        {/* Card de TOTAL (destaque) */}
        <Card className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Materiais</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {stats.published} publicados
              </p>
              <p className="text-xs text-muted-foreground/70">
                {materials.filter(m => m.status === 'archived').length} arquivados
              </p>
            </div>
          </div>
        </Card>

        {/* 5 HUB CARDS — Grid Organizado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {HUB_CARDS.map((card, index) => {
            const count = stats.byCard[card.id] || 0;
            const gradientClasses: Record<string, string> = {
              'rose': 'from-rose-500/20 to-pink-500/10 border-rose-500/30 hover:border-rose-500/50',
              'cyan': 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 hover:border-cyan-500/50',
              'amber': 'from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50',
              'emerald': 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 hover:border-emerald-500/50',
              'violet': 'from-violet-500/20 to-purple-500/10 border-violet-500/30 hover:border-violet-500/50',
            };
            const textColors: Record<string, string> = {
              'rose': 'text-rose-400',
              'cyan': 'text-cyan-400',
              'amber': 'text-amber-400',
              'emerald': 'text-emerald-400',
              'violet': 'text-violet-400',
            };

            return (
              <Card 
                key={card.id} 
                className={cn(
                  "p-4 bg-gradient-to-br transition-all cursor-pointer group",
                  gradientClasses[card.color] || 'from-gray-500/20 to-slate-500/10 border-gray-500/30'
                )}
                onClick={() => handleCardFilterChange(card.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{card.icon}</span>
                      <p className={cn("text-3xl font-bold", textColors[card.color] || 'text-foreground')}>
                        {count}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-sm leading-tight">
                        {card.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                      textColors[card.color]
                    )}
                  >
                    #{index + 1}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* FILTRO POR HUB CARD */}
        <Select value={cardFilter} onValueChange={handleCardFilterChange}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Hub Card" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Cards</SelectItem>
            {HUB_CARDS.map(card => (
              <SelectItem key={card.id} value={card.id}>
                <div className="flex items-center gap-2">
                  <span>{card.icon}</span>
                  <span>{card.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
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
        {/* Macro filter (only visible for questoes-mapas card) */}
        {(cardFilter === 'all' || cardFilter === 'questoes-mapas') && (
          <Select value={macroFilter} onValueChange={handleMacroFilterChange}>
            <SelectTrigger className="w-full sm:w-40">
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
        )}
        {/* Micro filter (only when macro selected) */}
        {(cardFilter === 'all' || cardFilter === 'questoes-mapas') && macroFilter !== 'all' && (
          <Select 
            value={microFilter} 
            onValueChange={setMicroFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Micro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Micros</SelectItem>
              {microsForFilter.map(m => (
                <SelectItem key={m.value || m.label} value={m.value || m.label}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Pagination Info */}
      {filteredMaterials.length > 0 && (
        <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            Exibindo <span className="font-semibold text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a{' '}
            <span className="font-semibold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMaterials.length)}</span> de{' '}
            <span className="font-semibold text-foreground">{filteredMaterials.length}</span> materiais
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próximo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lista por MACRO */}
      <div className="space-y-4">
        {filteredMaterials.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum material encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece enviando seu primeiro arquivo
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Material
            </Button>
          </Card>
        ) : (
          <>
            {/* Materiais sem Card (mostrar primeiro se existirem) */}
            {materialsByCard['sem_card']?.length > 0 && (
              <Card className="border-amber-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span>Sem Card Definido</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({materialsByCard['sem_card'].length} materiais)
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Hub Card</TableHead>
                      <TableHead>Filtro</TableHead>
                      <TableHead>Micro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialsByCard['sem_card'].map(m => (
                      <MaterialRow
                        key={m.id}
                        material={m}
                        onView={() => setViewingMaterial(m)}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        getMicroLabel={getMicroLabel}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Hub Cards agrupados */}
            {HUB_CARDS.map((card, index) => (
              <HubCardSection
                key={card.id}
                card={card}
                materials={materialsByCard[card.id] || []}
                onView={setViewingMaterial}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                getMicroLabel={getMicroLabel}
                defaultOpen={materialsByCard['sem_card']?.length === 0 && index === 0}
              />
            ))}
          </>
        )}
      </div>

      {/* Pagination Bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            Primeira
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm px-4">
            Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Última
          </Button>
        </div>
      )}

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
