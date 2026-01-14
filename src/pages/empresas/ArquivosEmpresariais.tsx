// ============================================
// MOISÉS MEDEIROS v15.0 - ENTERPRISE COMPANY FILE VAULT
// Sistema de Arquivos Empresariais - Ano 2300
// Drive Corporativo Futurístico com IA
// ============================================

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderOpen, 
  FolderClosed,
  FileText, 
  Image, 
  Video, 
  FileSpreadsheet,
  Upload,
  Search,
  Download,
  Trash2,
  MoreVertical,
  Grid3X3,
  List,
  Plus,
  Loader2,
  Eye,
  RefreshCw,
  File,
  FileAudio,
  FileArchive,
  FileCode,
  Calendar,
  Clock,
  CalendarDays,
  CalendarRange,
  History,
  Archive,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Brain,
  Check,
  X,
  Filter,
  HardDrive,
  CloudUpload,
  Paperclip,
  Copy,
  Bot,
  Zap,
  Shield,
  Star,
  Bookmark,
  Share2,
  Tag,
  Layers,
  Activity,
  TrendingUp,
  Database,
  Globe,
  Lock,
  Unlock,
  FileSearch,
  FolderPlus,
  LayoutGrid,
  LayoutList,
  SortAsc,
  SortDesc,
  Cloud,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChart,
  FileType,
  FolderTree,
  Home,
  ChevronDown,
  Settings2,
  Building2,
  FileClock,
  ArrowUpRight,
  Cpu,
  Receipt,
  Music
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResizableDialog,
  ResizableDialogContent,
  ResizableDialogHeader,
  ResizableDialogBody,
  ResizableDialogFooter,
  ResizableDialogTitle,
} from "@/components/ui/resizable-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { FileUpload } from "@/components/FileUpload";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptimisticMutation } from "@/hooks/useSubspaceCommunication";
import { buscarArquivos, deleteFile, toggleIaLer, processarArquivoComIA, formatFileSize, getFileCategory, uploadFile } from "@/lib/fileUpload";
import { MinimizableSection, useMinimizable } from "@/components/ui/minimizable-section";
import { OmegaFortressPlayer } from "@/components/video";

// ═══════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════

interface ArquivoUniversal {
  id: string;
  nome: string;
  nome_storage: string;
  url: string;
  path: string;
  tipo: string;
  extensao: string | null;
  tamanho: number;
  bucket: string | null;
  categoria: string | null;
  pasta: string | null;
  ano: number;
  mes: number;
  semana: number;
  dia: number;
  data_upload: string | null;
  ia_ler: boolean | null;
  ia_processado: boolean | null;
  ia_resultado: any;
  descricao: string | null;
  tags: string[] | null;
  ativo: boolean | null;
  created_at: string;
  updated_at: string | null;
  empresa_id?: string;
}

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  ativo: boolean;
}

type ViewMode = "dashboard" | "files" | "months" | "years";
type PeriodFilter = "hoje" | "semana" | "mes" | "ano" | "10anos" | "todos";
type SortField = "nome" | "tamanho" | "created_at" | "categoria";
type SortOrder = "asc" | "desc";

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const CATEGORIAS = [
  { id: "todos", name: "Todos", icon: "📁", color: "from-primary/20 to-primary/5" },
  { id: "nota_fiscal", name: "Notas Fiscais", icon: "🧾", color: "from-amber-500/20 to-amber-500/5" },
  { id: "contrato", name: "Contratos", icon: "📝", color: "from-blue-500/20 to-blue-500/5" },
  { id: "financeiro", name: "Financeiro", icon: "💰", color: "from-green-500/20 to-green-500/5" },
  { id: "rh", name: "RH", icon: "👥", color: "from-purple-500/20 to-purple-500/5" },
  { id: "juridico", name: "Jurídico", icon: "⚖️", color: "from-red-500/20 to-red-500/5" },
  { id: "marketing", name: "Marketing", icon: "📣", color: "from-pink-500/20 to-pink-500/5" },
  { id: "operacional", name: "Operacional", icon: "⚙️", color: "from-cyan-500/20 to-cyan-500/5" },
  { id: "geral", name: "Geral", icon: "📂", color: "from-muted to-muted/50" },
];

const PERIOD_OPTIONS = [
  { value: "hoje", label: "Hoje", icon: Clock },
  { value: "semana", label: "Semana", icon: CalendarDays },
  { value: "mes", label: "Mês", icon: Calendar },
  { value: "ano", label: "Ano", icon: CalendarRange },
  { value: "10anos", label: "10 Anos", icon: History },
  { value: "todos", label: "Todos", icon: Archive },
];

const FILE_TYPE_FILTERS = [
  { value: "todos", label: "Todos", icon: FileText },
  { value: "image", label: "Imagens", icon: Image },
  { value: "video", label: "Vídeos", icon: Video },
  { value: "audio", label: "Áudio", icon: FileAudio },
  { value: "document", label: "Documentos", icon: FileText },
  { value: "spreadsheet", label: "Planilhas", icon: FileSpreadsheet },
  { value: "archive", label: "Compactados", icon: FileArchive },
];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const getFileIcon = (tipo: string) => {
  if (tipo.includes('pdf')) return FileText;
  if (tipo.includes('image')) return Image;
  if (tipo.includes('video')) return Video;
  if (tipo.includes('audio')) return FileAudio;
  if (tipo.includes('spreadsheet') || tipo.includes('excel') || tipo.includes('csv')) return FileSpreadsheet;
  if (tipo.includes('zip') || tipo.includes('rar') || tipo.includes('7z') || tipo.includes('tar')) return FileArchive;
  if (tipo.includes('javascript') || tipo.includes('typescript') || tipo.includes('html') || tipo.includes('css') || tipo.includes('json')) return FileCode;
  return File;
};

const getFileColor = (tipo: string): string => {
  if (tipo.includes('pdf')) return "text-red-500";
  if (tipo.includes('image')) return "text-blue-500";
  if (tipo.includes('video')) return "text-purple-500";
  if (tipo.includes('audio')) return "text-pink-500";
  if (tipo.includes('spreadsheet') || tipo.includes('excel')) return "text-emerald-500";
  if (tipo.includes('zip') || tipo.includes('rar')) return "text-amber-500";
  if (tipo.includes('word') || tipo.includes('document')) return "text-blue-600";
  return "text-muted-foreground";
};

const getFileGradient = (tipo: string): string => {
  if (tipo.includes('pdf')) return "from-red-500/20 to-red-600/10";
  if (tipo.includes('image')) return "from-blue-500/20 to-blue-600/10";
  if (tipo.includes('video')) return "from-purple-500/20 to-purple-600/10";
  if (tipo.includes('audio')) return "from-pink-500/20 to-pink-600/10";
  if (tipo.includes('spreadsheet') || tipo.includes('excel')) return "from-emerald-500/20 to-emerald-600/10";
  if (tipo.includes('zip') || tipo.includes('rar')) return "from-amber-500/20 to-amber-600/10";
  return "from-muted to-muted/50";
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function ArquivosEmpresariais() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Estado da empresa selecionada
  const [empresaId, setEmpresaId] = useState<string>("");

  // Navegação e filtros
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [period, setPeriod] = useState<PeriodFilter>("todos");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Modais e dialogs
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ArquivoUniversal | null>(null);
  const [fileToDelete, setFileToDelete] = useState<ArquivoUniversal | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingIA, setProcessingIA] = useState<string | null>(null);

  // Upload form
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadCategory, setUploadCategory] = useState("geral");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadIaLer, setUploadIaLer] = useState(false);
  const [uploadTags, setUploadTags] = useState("");

  // ═══════════════════════════════════════════════════════════════
  // BUSCAR EMPRESAS
  // ═══════════════════════════════════════════════════════════════

  const { data: empresas, isLoading: empresasLoading } = useQuery({
    queryKey: ['empresas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome, cnpj, ativo')
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as Empresa[];
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!empresaId && (empresas || []).length > 0) {
      setEmpresaId(empresas![0].id);
    }
  }, [empresaId, empresas]);

  const empresaSelecionada = useMemo(
    () => (empresas || []).find((e) => e.id === empresaId),
    [empresas, empresaId]
  );

  // ═══════════════════════════════════════════════════════════════
  // BUSCAR ARQUIVOS
  // ═══════════════════════════════════════════════════════════════

  const { data: arquivosData, isLoading, refetch } = useQuery({
    queryKey: ['arquivos-empresa', empresaId, period, selectedYear, selectedMonth, selectedCategory, searchQuery],
    queryFn: async () => {
      if (!empresaId || !empresaSelecionada) return { arquivos: [], total: 0 };
      
      const cnpjClean = empresaSelecionada.cnpj.replace(/\D/g, '');
      
      return buscarArquivos({
        busca: searchQuery || undefined,
        pasta: `empresas/${cnpjClean}`,
        empresaId: empresaId,
        tipo: filterType !== 'todos' ? filterType : undefined,
        ano: period === 'ano' || period === 'mes' ? selectedYear : undefined,
        mes: period === 'mes' ? selectedMonth : undefined,
        categoria: selectedCategory !== 'todos' ? selectedCategory : undefined,
        limite: 500,
      });
    },
    enabled: !!empresaId && !!empresaSelecionada,
    refetchOnWindowFocus: false,
  });

  const arquivos = arquivosData?.arquivos || [];
  const total = arquivosData?.total || 0;

  // Realtime subscription
  useEffect(() => {
    if (!empresaId || !empresaSelecionada) return;
    
    const cnpjClean = empresaSelecionada.cnpj.replace(/\D/g, '');
    
    const channel = supabase
      .channel('arquivos-empresa-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'arquivos_universal'
      }, (payload) => {
        // Verificar se o arquivo pertence a esta empresa pela pasta
        const pasta = (payload.new as any)?.pasta || (payload.old as any)?.pasta;
        if (pasta && pasta.startsWith(`empresas/${cnpjClean}`)) {
          refetch();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, empresaSelecionada, refetch]);

  // ═══════════════════════════════════════════════════════════════
  // FILTROS E ORDENAÇÃO
  // ═══════════════════════════════════════════════════════════════

  const filteredArquivos = useMemo(() => {
    let result = arquivos.filter((arquivo: ArquivoUniversal) => {
      if (searchQuery && !arquivo.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType !== "todos") {
        if (filterType === "image" && !arquivo.tipo.includes('image')) return false;
        if (filterType === "video" && !arquivo.tipo.includes('video')) return false;
        if (filterType === "audio" && !arquivo.tipo.includes('audio')) return false;
        if (filterType === "document" && !['pdf', 'word', 'document', 'text'].some(t => arquivo.tipo.includes(t))) return false;
        if (filterType === "spreadsheet" && !['spreadsheet', 'excel', 'csv'].some(t => arquivo.tipo.includes(t))) return false;
        if (filterType === "archive" && !['zip', 'rar', '7z', 'tar'].some(t => arquivo.tipo.includes(t))) return false;
      }
      return true;
    });

    result.sort((a: ArquivoUniversal, b: ArquivoUniversal) => {
      let comparison = 0;
      if (sortField === "nome") {
        comparison = a.nome.localeCompare(b.nome);
      } else if (sortField === "tamanho") {
        comparison = (a.tamanho || 0) - (b.tamanho || 0);
      } else if (sortField === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "categoria") {
        comparison = (a.categoria || "").localeCompare(b.categoria || "");
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [arquivos, searchQuery, filterType, sortField, sortOrder]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalSize = arquivos.reduce((acc: number, a: ArquivoUniversal) => acc + (a.tamanho || 0), 0);
    const byCategory: Record<string, { count: number; size: number }> = {};
    const byType: Record<string, number> = {};
    const iaProcessed = arquivos.filter((a: ArquivoUniversal) => a.ia_processado).length;
    const iaPending = arquivos.filter((a: ArquivoUniversal) => a.ia_ler && !a.ia_processado).length;
    
    arquivos.forEach((a: ArquivoUniversal) => {
      const cat = a.categoria || 'geral';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, size: 0 };
      byCategory[cat].count++;
      byCategory[cat].size += a.tamanho || 0;

      const cat2 = getFileCategory(a.tipo);
      byType[cat2] = (byType[cat2] || 0) + 1;
    });

    const recentCount = arquivos.filter((a: ArquivoUniversal) => {
      const createdAt = new Date(a.created_at);
      const now = new Date();
      return now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000;
    }).length;

    return { 
      total: arquivos.length, 
      totalSize, 
      byCategory, 
      byType,
      iaProcessed,
      iaPending,
      recentCount
    };
  }, [arquivos]);

  // Anos com dados
  const yearsWithData = useMemo(() => {
    const years = new Set(arquivos.map((a: ArquivoUniversal) => a.ano));
    return Array.from(years).sort((a, b) => b - a);
  }, [arquivos]);

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadFiles(files);
      setUploadModalOpen(true);
    }
  }, []);

  const handleUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      toast.error('Selecione ao menos um arquivo');
      return;
    }

    if (!empresaId || !empresaSelecionada) {
      toast.error('Selecione uma empresa');
      return;
    }

    setUploading(true);

    try {
      const filesArray = Array.from(uploadFiles);
      const cnpjClean = empresaSelecionada.cnpj.replace(/\D/g, '');

      for (const file of filesArray) {
        await uploadFile({
          file,
          folder: `empresas/${cnpjClean}`,
          categoria: uploadCategory,
          iaLer: uploadIaLer,
          descricao: uploadDescription,
          tags: uploadTags ? uploadTags.split(',').map(t => t.trim()) : undefined,
          relacionamentos: {
            empresaId: empresaId
          }
        });
      }

      toast.success(`${filesArray.length} arquivo(s) enviado(s) com sucesso!`);
      setUploadModalOpen(false);
      setUploadFiles(null);
      setUploadDescription("");
      setUploadTags("");
      setUploadIaLer(false);
      queryClient.invalidateQueries({ queryKey: ['arquivos-empresa'] });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      await deleteFile(fileToDelete.id);
      toast.success('Arquivo excluído!');
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['arquivos-empresa'] });
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleDownload = (arquivo: ArquivoUniversal) => {
    window.open(arquivo.url, '_blank');
  };

  const handlePreview = (arquivo: ArquivoUniversal) => {
    setSelectedFile(arquivo);
    setPreviewModalOpen(true);
  };

  const handleProcessarIA = async (id: string) => {
    setProcessingIA(id);
    try {
      await processarArquivoComIA(id);
      toast.success('Processado pela IA!');
      queryClient.invalidateQueries({ queryKey: ['arquivos-empresa'] });
    } catch (e: any) { 
      toast.error(e.message); 
    } finally { 
      setProcessingIA(null); 
    }
  };

  // FASE 3 - useOptimisticMutation (0ms)
  const toggleIAMutation = useOptimisticMutation<ArquivoUniversal[], { id: string; iaLer: boolean }, void>({
    queryKey: ['arquivos-empresa'],
    mutationFn: ({ id, iaLer }) => toggleIaLer(id, iaLer),
    optimisticUpdate: (old, { id, iaLer }) => {
      return (old || []).map(a => a.id === id ? { ...a, ia_ler: iaLer } : a);
    },
    errorMessage: 'Erro ao alterar IA',
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDER DASHBOARD
  // ═══════════════════════════════════════════════════════════════

  const renderDashboard = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Total de Arquivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{stats.total}</div>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.recentCount} hoje
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Armazenamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-500">{formatFileSize(stats.totalSize)}</div>
              <div className="mt-3">
                <Progress value={Math.min((stats.totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">de 10 GB disponível</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Processamento IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-500">{stats.iaProcessed}</div>
              <div className="flex items-center gap-2 mt-2 text-sm">
                {stats.iaPending > 0 && (
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {stats.iaPending} pendentes
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card 
            className="relative overflow-hidden border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all group"
            onClick={() => setUploadModalOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-full py-8">
              <div className="p-4 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors mb-3">
                <CloudUpload className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-foreground">Upload de Arquivos</p>
              <p className="text-xs text-muted-foreground mt-1">Arraste ou clique aqui</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tipos de Arquivo */}
      <MinimizableSection
        title="Distribuição por Tipo"
        icon={<PieChart className="h-5 w-5" />}
        variant="card"
        storageKey="empresa-files-types"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {FILE_TYPE_FILTERS.filter(f => f.value !== "todos").map((type) => {
            const Icon = type.icon;
            const count = stats.byType[type.value] || 0;
            return (
              <motion.div
                key={type.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setFilterType(type.value);
                  setViewMode("files");
                }}
                className={cn(
                  "p-4 rounded-xl cursor-pointer transition-all border",
                  count > 0 
                    ? "bg-card hover:bg-card-hover border-border/50 hover:border-primary/30" 
                    : "bg-muted/30 border-border/30 opacity-50"
                )}
              >
                <Icon className={cn("h-6 w-6 mb-2", count > 0 ? "text-primary" : "text-muted-foreground")} />
                <p className="font-bold text-xl text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{type.label}</p>
              </motion.div>
            );
          })}
        </div>
      </MinimizableSection>

      {/* Categorias */}
      <MinimizableSection
        title="Pastas e Categorias"
        icon={<FolderTree className="h-5 w-5" />}
        variant="card"
        storageKey="empresa-files-categories"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {CATEGORIAS.filter(a => a.id !== "todos").map((area) => {
            const data = stats.byCategory[area.id] || { count: 0, size: 0 };
            return (
              <motion.div
                key={area.id}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedCategory(area.id);
                  setViewMode("files");
                }}
                className={cn(
                  "p-4 rounded-xl cursor-pointer transition-all border-2 bg-gradient-to-br",
                  area.color,
                  "border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{area.icon}</span>
                  {data.count > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {data.count}
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-foreground truncate">{area.name}</p>
                {data.count > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(data.size)}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </MinimizableSection>

      {/* Arquivos Recentes */}
      <MinimizableSection
        title="Arquivos Recentes"
        icon={<FileClock className="h-5 w-5" />}
        variant="card"
        storageKey="empresa-files-recent"
        actions={
          <Button variant="ghost" size="sm" onClick={() => setViewMode("files")} className="gap-2">
            Ver todos <ArrowUpRight className="h-4 w-4" />
          </Button>
        }
      >
        {arquivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum arquivo ainda</p>
            <Button onClick={() => setUploadModalOpen(true)} className="mt-4 gap-2">
              <Upload className="h-4 w-4" />
              Fazer primeiro upload
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredArquivos.slice(0, 5).map((arquivo: ArquivoUniversal) => {
              const FileIconComponent = getFileIcon(arquivo.tipo);
              const categoria = CATEGORIAS.find(a => a.id === arquivo.categoria) || CATEGORIAS.find(a => a.id === 'geral')!;
              return (
                <motion.div
                  key={arquivo.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
                  onClick={() => handlePreview(arquivo)}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center overflow-hidden flex-shrink-0",
                    getFileGradient(arquivo.tipo)
                  )}>
                    {arquivo.tipo.includes('image') ? (
                      <img 
                        src={arquivo.url} 
                        alt={arquivo.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <FileIconComponent className={cn(
                      "h-6 w-6", 
                      getFileColor(arquivo.tipo),
                      arquivo.tipo.includes('image') ? 'hidden' : ''
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{arquivo.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{categoria.icon} {categoria.name}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(arquivo.tamanho)}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(arquivo.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  {arquivo.ia_ler && <Brain className="h-4 w-4 text-purple-500" />}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDownload(arquivo); }}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </MinimizableSection>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER FILES LIST
  // ═══════════════════════════════════════════════════════════════

  const renderFilesList = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Toolbar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar arquivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPE_FILTERS.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <FolderOpen className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button
                variant={displayMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setDisplayMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={displayMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setDisplayMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredArquivos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum arquivo encontrado</p>
            <Button onClick={() => setUploadModalOpen(true)} className="mt-4 gap-2">
              <Upload className="h-4 w-4" />
              Fazer upload
            </Button>
          </CardContent>
        </Card>
      ) : displayMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredArquivos.map((arquivo: ArquivoUniversal) => {
            const FileIconComponent = getFileIcon(arquivo.tipo);
            return (
              <motion.div key={arquivo.id} whileHover={{ scale: 1.02 }}>
                <Card 
                  className="group hover:border-primary/50 cursor-pointer transition-all"
                  onClick={() => handlePreview(arquivo)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-2 overflow-hidden">
                      {arquivo.tipo.startsWith('image/') ? (
                        <img src={arquivo.url} className="w-full h-full object-cover" />
                      ) : (
                        <FileIconComponent className={cn("h-10 w-10", getFileColor(arquivo.tipo))} />
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{arquivo.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(arquivo.tamanho)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {arquivo.ia_ler && <Brain className="h-3 w-3 text-purple-500" />}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {filteredArquivos.map((arquivo: ArquivoUniversal) => {
              const FileIconComponent = getFileIcon(arquivo.tipo);
              return (
                <div 
                  key={arquivo.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handlePreview(arquivo)}
                >
                  <div className={cn("w-10 h-10 rounded bg-gradient-to-br flex items-center justify-center", getFileGradient(arquivo.tipo))}>
                    {arquivo.tipo.startsWith('image/') ? (
                      <img src={arquivo.url} className="w-full h-full object-cover rounded" />
                    ) : (
                      <FileIconComponent className={cn("h-5 w-5", getFileColor(arquivo.tipo))} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{arquivo.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(arquivo.tamanho)} • {format(new Date(arquivo.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {arquivo.ia_ler && <Brain className="h-4 w-4 text-purple-500" />}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(arquivo)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleIAMutation.mutate({ id: arquivo.id, iaLer: !arquivo.ia_ler })}>
                        <Brain className="h-4 w-4 mr-2" />
                        {arquivo.ia_ler ? 'Desativar' : 'Ativar'} IA
                      </DropdownMenuItem>
                      {arquivo.ia_ler && !arquivo.ia_processado && (
                        <DropdownMenuItem 
                          onClick={() => handleProcessarIA(arquivo.id)} 
                          disabled={processingIA === arquivo.id}
                        >
                          {processingIA === arquivo.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Brain className="h-4 w-4 mr-2 text-purple-500" />
                          )}
                          Processar IA
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => { setFileToDelete(arquivo); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <TooltipProvider>
      <div 
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        ref={dropZoneRef}
      >
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            >
              <div className="bg-background border-2 border-dashed border-primary rounded-2xl p-12 text-center">
                <CloudUpload className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-xl font-semibold">Solte os arquivos aqui</p>
                <p className="text-muted-foreground">Arraste e solte para fazer upload</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                    <Zap className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Enterprise Company File Vault
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Central de Arquivos Empresariais com IA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Seletor de Empresa */}
                <Select value={empresaId} onValueChange={setEmpresaId} disabled={empresasLoading}>
                  <SelectTrigger className="w-64">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={empresasLoading ? 'Carregando...' : 'Selecione a empresa'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(empresas || []).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {e.nome} • {e.cnpj}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Atualizar
                </Button>
                <Button size="sm" onClick={() => setUploadModalOpen(true)} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
              {[
                { value: "dashboard", label: "Dashboard", icon: Home },
                { value: "files", label: "Arquivos", icon: FolderOpen },
                { value: "months", label: "Meses", icon: Calendar },
                { value: "years", label: "Anos", icon: Archive },
              ].map(nav => (
                <Button
                  key={nav.value}
                  variant={viewMode === nav.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(nav.value as ViewMode)}
                  className="gap-2"
                >
                  <nav.icon className="h-4 w-4" />
                  {nav.label}
                </Button>
              ))}

              <Separator orientation="vertical" className="h-6 mx-2" />

              {PERIOD_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={period === opt.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(opt.value as PeriodFilter)}
                  className="gap-1"
                >
                  <opt.icon className="h-3 w-3" />
                  {opt.label}
                </Button>
              ))}

              <Separator orientation="vertical" className="h-6 mx-2" />

              <Badge variant="outline" className="text-primary">
                {total} arquivo(s)
              </Badge>
              {empresaSelecionada && (
                <Badge variant="secondary">
                  {empresaSelecionada.cnpj}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          {!empresaId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-xl font-semibold">Selecione uma empresa</p>
                <p className="text-muted-foreground mt-2">Escolha uma empresa para visualizar e gerenciar os arquivos</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Carregando arquivos...</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'dashboard' && renderDashboard()}
              {viewMode === 'files' && renderFilesList()}
              {viewMode === 'months' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {MONTH_NAMES.map((month, index) => {
                    const monthData = arquivos.filter((a: ArquivoUniversal) => a.mes === index + 1 && a.ano === selectedYear);
                    return (
                      <Card 
                        key={index} 
                        className="cursor-pointer hover:border-primary/50 transition-all"
                        onClick={() => { setSelectedMonth(index + 1); setViewMode('files'); }}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">{month}</h4>
                          <p className="text-2xl font-bold text-primary">{monthData.length}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(monthData.reduce((acc: number, a: ArquivoUniversal) => acc + (a.tamanho || 0), 0))}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              {viewMode === 'years' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {yearsWithData.length > 0 ? yearsWithData.map((year) => {
                    const yearData = arquivos.filter((a: ArquivoUniversal) => a.ano === year);
                    return (
                      <Card 
                        key={year} 
                        className="cursor-pointer hover:border-primary/50 transition-all"
                        onClick={() => { setSelectedYear(year); setViewMode('months'); }}
                      >
                        <CardContent className="p-4">
                          <h4 className="text-2xl font-bold mb-2">{year}</h4>
                          <p className="text-xl font-semibold text-primary">{yearData.length} arquivos</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(yearData.reduce((acc: number, a: ArquivoUniversal) => acc + (a.tamanho || 0), 0))}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }) : (
                    <Card className="col-span-full">
                      <CardContent className="py-12 text-center">
                        <Archive className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Nenhum arquivo encontrado</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Upload Modal */}
        <ResizableDialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <ResizableDialogContent
            showMaximize
            defaultSize={{ width: 600, height: 550 }}
            minSize={{ width: 400, height: 400 }}
          >
            <ResizableDialogHeader>
              <ResizableDialogTitle className="flex items-center gap-2">
                <CloudUpload className="h-5 w-5 text-primary" />
                Upload de Arquivos
                {empresaSelecionada && (
                  <Badge variant="secondary">{empresaSelecionada.nome}</Badge>
                )}
              </ResizableDialogTitle>
            </ResizableDialogHeader>
            <ResizableDialogBody>
              <div className="space-y-4">
                {/* File Input */}
                <div>
                  <Label>Arquivos</Label>
                  <div 
                    className="mt-2 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                    onClick={() => document.getElementById('file-input-empresa')?.click()}
                  >
                    <CloudUpload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Clique para selecionar arquivos</p>
                    <p className="text-sm text-muted-foreground mt-1">ou arraste e solte aqui</p>
                    <p className="text-xs text-muted-foreground mt-2">Suporte a múltiplos arquivos • Até 2GB cada</p>
                    <input
                      id="file-input-empresa"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => setUploadFiles(e.target.files)}
                    />
                  </div>
                  {uploadFiles && uploadFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {Array.from(uploadFiles).map((file, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <File className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <MinimizableSection
                  title="Configurações do Upload"
                  icon={<Settings2 className="h-4 w-4" />}
                  variant="card"
                  storageKey="empresa-upload-settings"
                >
                  <div className="space-y-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={uploadCategory} onValueChange={setUploadCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.filter(c => c.id !== 'todos').map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                {cat.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Descrição (opcional)</Label>
                      <Textarea
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="Descreva o arquivo..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Tags (separadas por vírgula)</Label>
                      <Input
                        value={uploadTags}
                        onChange={(e) => setUploadTags(e.target.value)}
                        placeholder="financeiro, 2024, importante"
                      />
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <div className="flex-1">
                        <Label>IA deve ler este arquivo?</Label>
                        <p className="text-xs text-muted-foreground">A IA poderá extrair e analisar o conteúdo</p>
                      </div>
                      <Switch checked={uploadIaLer} onCheckedChange={setUploadIaLer} />
                    </div>
                  </div>
                </MinimizableSection>
              </div>
            </ResizableDialogBody>
            <ResizableDialogFooter>
              <Button variant="outline" onClick={() => setUploadModalOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleUpload} 
                disabled={uploading || !uploadFiles || uploadFiles.length === 0}
                className="gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Enviando...' : 'Enviar Arquivos'}
              </Button>
            </ResizableDialogFooter>
          </ResizableDialogContent>
        </ResizableDialog>

        {/* Preview Modal */}
        <ResizableDialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
          <ResizableDialogContent
            showMaximize
            defaultSize={{ width: 800, height: 600 }}
            minSize={{ width: 500, height: 400 }}
          >
            <ResizableDialogHeader>
              <ResizableDialogTitle className="flex items-center gap-2">
                {selectedFile && (
                  <>
                    {(() => {
                      const Icon = getFileIcon(selectedFile.tipo);
                      return <Icon className={cn("h-5 w-5", getFileColor(selectedFile.tipo))} />;
                    })()}
                    {selectedFile.nome}
                  </>
                )}
              </ResizableDialogTitle>
            </ResizableDialogHeader>
            <ResizableDialogBody>
              {selectedFile && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted overflow-hidden max-h-[50vh] flex items-center justify-center">
                    {selectedFile.tipo.startsWith('image/') ? (
                      <img src={selectedFile.url} className="max-w-full max-h-[50vh] object-contain" />
                    ) : selectedFile.tipo.startsWith('video/') ? (
                      <div className="w-full aspect-video rounded-lg overflow-hidden">
                        <OmegaFortressPlayer
                          videoId={selectedFile.url}
                          type="youtube"
                          title={selectedFile.nome}
                          showSecurityBadge
                          showWatermark
                          autoplay={false}
                        />
                      </div>
                    ) : selectedFile.tipo.startsWith('audio/') ? (
                      <audio src={selectedFile.url} controls />
                    ) : selectedFile.tipo === 'application/pdf' ? (
                      <iframe src={selectedFile.url} className="w-full h-[50vh]" />
                    ) : (
                      <div className="p-12 text-center">
                        {(() => {
                          const Icon = getFileIcon(selectedFile.tipo);
                          return <Icon className="h-20 w-20 mx-auto text-muted-foreground" />;
                        })()}
                        <p className="mt-4 text-muted-foreground">Preview não disponível</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Brain className={selectedFile.ia_ler ? 'text-purple-500' : 'text-muted-foreground'} />
                      <Label>IA deve ler?</Label>
                    </div>
                    <Switch 
                      checked={selectedFile.ia_ler || false} 
                      onCheckedChange={(c) => {
                        toggleIAMutation.mutate({ id: selectedFile.id, iaLer: c });
                        setSelectedFile((p) => p ? { ...p, ia_ler: c } : p);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tamanho</p>
                      <p className="font-medium">{formatFileSize(selectedFile.tamanho)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium">{format(new Date(selectedFile.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>
                </div>
              )}
            </ResizableDialogBody>
            <ResizableDialogFooter>
              <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>Fechar</Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  setFileToDelete(selectedFile);
                  setDeleteDialogOpen(true);
                  setPreviewModalOpen(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
              <Button onClick={() => selectedFile && handleDownload(selectedFile)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </ResizableDialogFooter>
          </ResizableDialogContent>
        </ResizableDialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{fileToDelete?.nome}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
