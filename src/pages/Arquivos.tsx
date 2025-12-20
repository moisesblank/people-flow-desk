// ============================================
// MOISÉS MEDEIROS v15.0 - ENTERPRISE FILE VAULT
// Sistema de Arquivos de Multinacional - Ano 2300
// Drive Empresarial Futurístico com IA
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
  CloudOff,
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
  Maximize2,
  Move,
  FileCheck,
  FileClock,
  FileX,
  FolderSearch,
  Command,
  ArrowUpRight,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
import { uploadFile, deleteFile, formatFileSize, getFileCategory } from "@/lib/fileUpload";

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
}

type ViewMode = "files" | "folders" | "months" | "years" | "dashboard";
type PeriodFilter = "diario" | "semanal" | "mensal" | "anual" | "10anos" | "todos";
type SortField = "nome" | "tamanho" | "created_at" | "categoria";
type SortOrder = "asc" | "desc";

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const AREAS = [
  { id: "todos", name: "Todos", icon: "🗂️", color: "bg-gradient-to-r from-primary/20 to-primary/10", borderColor: "border-primary/40" },
  { id: "aulas", name: "Materiais de Aula", icon: "📚", color: "bg-gradient-to-r from-blue-500/20 to-blue-400/10", borderColor: "border-blue-500/40" },
  { id: "lancamentos", name: "Lançamentos", icon: "🚀", color: "bg-gradient-to-r from-orange-500/20 to-orange-400/10", borderColor: "border-orange-500/40" },
  { id: "contratos", name: "Contratos", icon: "📝", color: "bg-gradient-to-r from-emerald-500/20 to-emerald-400/10", borderColor: "border-emerald-500/40" },
  { id: "marketing", name: "Marketing", icon: "📣", color: "bg-gradient-to-r from-purple-500/20 to-purple-400/10", borderColor: "border-purple-500/40" },
  { id: "videos", name: "Vídeos", icon: "🎬", color: "bg-gradient-to-r from-red-500/20 to-red-400/10", borderColor: "border-red-500/40" },
  { id: "fiscal", name: "Fiscal", icon: "🧾", color: "bg-gradient-to-r from-amber-500/20 to-amber-400/10", borderColor: "border-amber-500/40" },
  { id: "financeiro", name: "Financeiro", icon: "💰", color: "bg-gradient-to-r from-green-500/20 to-green-400/10", borderColor: "border-green-500/40" },
  { id: "rh", name: "RH", icon: "👥", color: "bg-gradient-to-r from-cyan-500/20 to-cyan-400/10", borderColor: "border-cyan-500/40" },
  { id: "alunos", name: "Alunos", icon: "🎓", color: "bg-gradient-to-r from-pink-500/20 to-pink-400/10", borderColor: "border-pink-500/40" },
  { id: "geral", name: "Geral", icon: "📂", color: "bg-gradient-to-r from-muted to-muted/50", borderColor: "border-border" },
];

const PERIOD_OPTIONS = [
  { value: "diario", label: "Hoje", icon: Clock, description: "Arquivos de hoje" },
  { value: "semanal", label: "Semana", icon: CalendarDays, description: "Últimos 7 dias" },
  { value: "mensal", label: "Mês", icon: Calendar, description: "Este mês" },
  { value: "anual", label: "Ano", icon: CalendarRange, description: "Este ano" },
  { value: "10anos", label: "Década", icon: History, description: "Últimos 10 anos" },
  { value: "todos", label: "Tudo", icon: Archive, description: "Todos os arquivos" },
];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const FILE_TYPE_FILTERS = [
  { value: "todos", label: "Todos", icon: FileText },
  { value: "image", label: "Imagens", icon: Image },
  { value: "video", label: "Vídeos", icon: Video },
  { value: "audio", label: "Áudio", icon: FileAudio },
  { value: "document", label: "Documentos", icon: FileText },
  { value: "spreadsheet", label: "Planilhas", icon: FileSpreadsheet },
  { value: "archive", label: "Compactados", icon: FileArchive },
  { value: "code", label: "Código", icon: FileCode },
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

export default function Arquivos() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Estado principal
  const [arquivos, setArquivos] = useState<ArquivoUniversal[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Navegação e filtros
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [period, setPeriod] = useState<PeriodFilter>("todos");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedArea, setSelectedArea] = useState("todos");
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
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Upload form
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadCategory, setUploadCategory] = useState("geral");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadIaLer, setUploadIaLer] = useState(false);
  const [uploadTags, setUploadTags] = useState("");

  // ═══════════════════════════════════════════════════════════════
  // FETCH DATA COM REALTIME
  // ═══════════════════════════════════════════════════════════════

  const fetchArquivos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('arquivos_universal')
        .select('*')
        .eq('ativo', true);

      // Filtro por período
      const now = new Date();
      if (period === "diario") {
        query = query
          .eq('ano', now.getFullYear())
          .eq('mes', now.getMonth() + 1)
          .eq('dia', now.getDate());
      } else if (period === "semanal") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        query = query.gte('created_at', weekStart.toISOString());
      } else if (period === "mensal") {
        query = query.eq('ano', selectedYear).eq('mes', selectedMonth);
      } else if (period === "anual") {
        query = query.eq('ano', selectedYear);
      } else if (period === "10anos") {
        query = query.gte('ano', currentYear - 10);
      }
      // todos = sem filtro de período

      // Filtro por área/categoria
      if (selectedArea !== "todos") {
        query = query.eq('categoria', selectedArea);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setArquivos(data || []);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  }, [period, selectedYear, selectedMonth, selectedArea, currentYear]);

  useEffect(() => {
    fetchArquivos();
  }, [fetchArquivos]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('arquivos-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'arquivos_universal'
      }, () => {
        fetchArquivos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchArquivos]);

  // ═══════════════════════════════════════════════════════════════
  // FILTERED AND SORTED DATA
  // ═══════════════════════════════════════════════════════════════

  const filteredArquivos = useMemo(() => {
    let result = arquivos.filter(arquivo => {
      if (searchQuery && !arquivo.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType !== "todos") {
        if (filterType === "image" && !arquivo.tipo.includes('image')) return false;
        if (filterType === "video" && !arquivo.tipo.includes('video')) return false;
        if (filterType === "audio" && !arquivo.tipo.includes('audio')) return false;
        if (filterType === "document" && !['pdf', 'word', 'document', 'text'].some(t => arquivo.tipo.includes(t))) return false;
        if (filterType === "spreadsheet" && !['spreadsheet', 'excel', 'csv'].some(t => arquivo.tipo.includes(t))) return false;
        if (filterType === "archive" && !['zip', 'rar', '7z', 'tar'].some(t => arquivo.tipo.includes(t))) return false;
        if (filterType === "code" && !['javascript', 'typescript', 'html', 'css', 'json', 'code'].some(t => arquivo.tipo.includes(t))) return false;
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
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

  // Estatísticas avançadas
  const stats = useMemo(() => {
    const totalSize = arquivos.reduce((acc, a) => acc + (a.tamanho || 0), 0);
    const byCategory: Record<string, { count: number; size: number }> = {};
    const byType: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    const iaProcessed = arquivos.filter(a => a.ia_processado).length;
    const iaPending = arquivos.filter(a => a.ia_ler && !a.ia_processado).length;
    
    arquivos.forEach(a => {
      const cat = a.categoria || 'geral';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, size: 0 };
      byCategory[cat].count++;
      byCategory[cat].size += a.tamanho || 0;

      const cat2 = getFileCategory(a.tipo);
      byType[cat2] = (byType[cat2] || 0) + 1;

      const monthKey = `${a.ano}-${String(a.mes).padStart(2, '0')}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    });

    // Arquivos recentes (últimas 24h)
    const recentCount = arquivos.filter(a => {
      const createdAt = new Date(a.created_at);
      const now = new Date();
      return now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000;
    }).length;

    return { 
      total: arquivos.length, 
      totalSize, 
      byCategory, 
      byType, 
      byMonth,
      iaProcessed,
      iaPending,
      recentCount
    };
  }, [arquivos]);

  // Anos e meses com dados
  const yearsWithData = useMemo(() => {
    const years = new Set(arquivos.map(a => a.ano));
    return Array.from(years).sort((a, b) => b - a);
  }, [arquivos]);

  const monthsWithData = useMemo(() => {
    return arquivos
      .filter(a => a.ano === selectedYear)
      .map(a => a.mes)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);
  }, [arquivos, selectedYear]);

  const availableYears = useMemo(() => {
    return Array.from({ length: 61 }, (_, i) => currentYear - 10 + i);
  }, [currentYear]);

  // ═══════════════════════════════════════════════════════════════
  // DRAG AND DROP
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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadFiles(files);
      setUploadModalOpen(true);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      toast.error('Selecione ao menos um arquivo');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const filesArray = Array.from(uploadFiles);
      let completed = 0;

      for (const file of filesArray) {
        await uploadFile({
          file,
          folder: uploadCategory,
          categoria: uploadCategory,
          iaLer: uploadIaLer,
          descricao: uploadDescription,
          tags: uploadTags ? uploadTags.split(',').map(t => t.trim()) : undefined,
          onProgress: (p) => {
            const totalProgress = ((completed / filesArray.length) * 100) + (p / filesArray.length);
            setUploadProgress(totalProgress);
          }
        });
        completed++;
      }

      toast.success(`${filesArray.length} arquivo(s) enviado(s) com sucesso!`);
      setUploadModalOpen(false);
      setUploadFiles(null);
      setUploadDescription("");
      setUploadTags("");
      setUploadIaLer(false);
      await fetchArquivos();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      await deleteFile(fileToDelete.id);
      toast.success('Arquivo excluído!');
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      await fetchArquivos();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    try {
      for (const fileId of selectedFiles) {
        await deleteFile(fileId);
      }
      toast.success(`${selectedFiles.size} arquivo(s) excluído(s)!`);
      setSelectedFiles(new Set());
      setBulkDeleteDialogOpen(false);
      await fetchArquivos();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleDownload = async (arquivo: ArquivoUniversal) => {
    try {
      const { data, error } = await supabase.storage
        .from(arquivo.bucket || 'arquivos')
        .createSignedUrl(arquivo.path, 3600);

      if (error) throw error;

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = arquivo.nome;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download iniciado!');
    } catch {
      window.open(arquivo.url, '_blank');
    }
  };

  const handleView = async (arquivo: ArquivoUniversal) => {
    try {
      const { data, error } = await supabase.storage
        .from(arquivo.bucket || 'arquivos')
        .createSignedUrl(arquivo.path, 3600);

      if (error) {
        window.open(arquivo.url, '_blank');
      } else {
        window.open(data.signedUrl, '_blank');
      }
    } catch {
      window.open(arquivo.url, '_blank');
    }
  };

  const handlePreview = (arquivo: ArquivoUniversal) => {
    setSelectedFile(arquivo);
    setPreviewModalOpen(true);
  };

  const handleProcessIA = async (arquivo: ArquivoUniversal) => {
    try {
      toast.loading('Processando com IA...', { id: 'ia-process' });
      
      const { data, error } = await supabase.functions.invoke('extract-document', {
        body: { 
          fileUrl: arquivo.url,
          fileName: arquivo.nome,
          fileType: arquivo.tipo
        }
      });

      if (error) throw error;

      await supabase
        .from('arquivos_universal')
        .update({ 
          ia_processado: true,
          ia_resultado: data
        })
        .eq('id', arquivo.id);

      toast.success('Arquivo processado pela IA!', { id: 'ia-process' });
      await fetchArquivos();
    } catch (error: any) {
      toast.error('Erro ao processar: ' + error.message, { id: 'ia-process' });
    }
  };

  const toggleIaLer = async (arquivo: ArquivoUniversal) => {
    try {
      const newValue = !arquivo.ia_ler;
      await supabase
        .from('arquivos_universal')
        .update({ ia_ler: newValue })
        .eq('id', arquivo.id);

      toast.success(newValue ? 'IA ativada' : 'IA desativada');
      await fetchArquivos();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const copyUrl = (arquivo: ArquivoUniversal) => {
    navigator.clipboard.writeText(arquivo.url);
    toast.success('URL copiada!');
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredArquivos.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredArquivos.map(a => a.id)));
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER DASHBOARD
  // ═══════════════════════════════════════════════════════════════

  const renderDashboard = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Hero Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-[hsl(var(--stats-blue))]/20 bg-gradient-to-br from-[hsl(var(--stats-blue))]/10 to-[hsl(var(--stats-blue))]/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--stats-blue))]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Armazenamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[hsl(var(--stats-blue))]">{formatFileSize(stats.totalSize)}</div>
              <div className="mt-3">
                <Progress value={Math.min((stats.totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">de 10 GB disponível</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-[hsl(var(--stats-purple))]/20 bg-gradient-to-br from-[hsl(var(--stats-purple))]/10 to-[hsl(var(--stats-purple))]/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--stats-purple))]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Processamento IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[hsl(var(--stats-purple))]">{stats.iaProcessed}</div>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5 text-primary" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Categorias/Áreas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderTree className="h-5 w-5 text-primary" />
              Pastas e Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {AREAS.filter(a => a.id !== "todos").map((area) => {
                const data = stats.byCategory[area.id] || { count: 0, size: 0 };
                return (
                  <motion.div
                    key={area.id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedArea(area.id);
                      setViewMode("files");
                    }}
                    className={cn(
                      "p-4 rounded-xl cursor-pointer transition-all border-2",
                      area.color,
                      area.borderColor,
                      "hover:shadow-lg hover:shadow-primary/10"
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Arquivos Recentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileClock className="h-5 w-5 text-primary" />
              Arquivos Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setViewMode("files")} className="gap-2">
              Ver todos <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
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
                {arquivos.slice(0, 5).map((arquivo) => {
                  const FileIcon = getFileIcon(arquivo.tipo);
                  const area = AREAS.find(a => a.id === arquivo.categoria) || AREAS.find(a => a.id === 'geral')!;
                  return (
                    <motion.div
                      key={arquivo.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
                      onClick={() => handlePreview(arquivo)}
                    >
                      <div className={cn("p-3 rounded-xl bg-gradient-to-br", getFileGradient(arquivo.tipo))}>
                        <FileIcon className={cn("h-6 w-6", getFileColor(arquivo.tipo))} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{arquivo.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{area.icon} {area.name}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(arquivo.tamanho)}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(arquivo.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDownload(arquivo); }}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Baixar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleView(arquivo); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualizar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER FILES LIST
  // ═══════════════════════════════════════════════════════════════

  const renderFilesList = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Toolbar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar arquivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPE_FILTERS.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  Ordenar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSortField("created_at"); setSortOrder("desc"); }}>
                  <Clock className="h-4 w-4 mr-2" /> Mais recentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortField("created_at"); setSortOrder("asc"); }}>
                  <Clock className="h-4 w-4 mr-2" /> Mais antigos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setSortField("nome"); setSortOrder("asc"); }}>
                  <SortAsc className="h-4 w-4 mr-2" /> Nome A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortField("nome"); setSortOrder("desc"); }}>
                  <SortDesc className="h-4 w-4 mr-2" /> Nome Z-A
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setSortField("tamanho"); setSortOrder("desc"); }}>
                  <HardDrive className="h-4 w-4 mr-2" /> Maior tamanho
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortField("tamanho"); setSortOrder("asc"); }}>
                  <HardDrive className="h-4 w-4 mr-2" /> Menor tamanho
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button 
                variant={displayMode === "grid" ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none"
                onClick={() => setDisplayMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={displayMode === "list" ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none"
                onClick={() => setDisplayMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>

            {/* Refresh */}
            <Button variant="outline" size="icon" onClick={fetchArquivos}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>

            {/* Upload */}
            <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>

          {/* Selected Actions */}
          {selectedFiles.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-3 mt-4 pt-4 border-t"
            >
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                {selectedFiles.size} selecionado(s)
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setSelectedFiles(new Set())}>
                Limpar seleção
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir selecionados
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Area Tabs */}
      <Tabs value={selectedArea} onValueChange={setSelectedArea}>
        <ScrollArea className="w-full">
          <TabsList className="bg-secondary/50 h-auto gap-1 p-1.5 flex-wrap">
            {AREAS.map(area => {
              const count = area.id === "todos" ? stats.total : (stats.byCategory[area.id]?.count || 0);
              return (
                <TabsTrigger key={area.id} value={area.id} className="gap-2 data-[state=active]:shadow-lg">
                  <span>{area.icon}</span>
                  <span className="hidden md:inline">{area.name}</span>
                  {count > 0 && (
                    <Badge variant="outline" className="ml-1 h-5 text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </ScrollArea>
      </Tabs>

      {/* Files Grid/List */}
      <Card className="border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando arquivos...</p>
            </div>
          </div>
        ) : filteredArquivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-6 rounded-full bg-muted/50">
              <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">Nenhum arquivo encontrado</p>
              <p className="text-muted-foreground mt-1">
                {searchQuery ? "Tente uma busca diferente" : "Faça upload do seu primeiro arquivo"}
              </p>
            </div>
            <Button onClick={() => setUploadModalOpen(true)} className="gap-2 mt-2">
              <Upload className="h-4 w-4" /> Fazer Upload
            </Button>
          </div>
        ) : displayMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50 sticky top-0">
                <tr>
                  <th className="text-left p-4 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedFiles.size === filteredArquivos.length && filteredArquivos.length > 0}
                      onChange={selectAllFiles}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-bold text-foreground">Nome</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground hidden md:table-cell">Categoria</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground hidden lg:table-cell">Data</th>
                  <th className="text-right p-4 text-sm font-bold text-foreground">Tamanho</th>
                  <th className="text-center p-4 text-sm font-bold text-foreground hidden sm:table-cell">IA</th>
                  <th className="text-right p-4 text-sm font-bold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredArquivos.map((arquivo, index) => {
                    const FileIcon = getFileIcon(arquivo.tipo);
                    const area = AREAS.find(a => a.id === arquivo.categoria) || AREAS.find(a => a.id === 'geral')!;
                    const isSelected = selectedFiles.has(arquivo.id);
                    
                    return (
                      <motion.tr 
                        key={arquivo.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "border-t border-border/30 hover:bg-secondary/30 transition-colors",
                          isSelected && "bg-primary/10 hover:bg-primary/15"
                        )}
                      >
                        <td className="p-4">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleFileSelection(arquivo.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", getFileGradient(arquivo.tipo))}>
                              <FileIcon className={cn("h-5 w-5", getFileColor(arquivo.tipo))} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-[250px]">{arquivo.nome}</p>
                              {arquivo.descricao && (
                                <p className="text-xs text-muted-foreground truncate max-w-[250px]">{arquivo.descricao}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <Badge variant="secondary" className={cn("gap-1", area.color)}>
                            <span>{area.icon}</span>
                            <span className="hidden lg:inline">{area.name}</span>
                          </Badge>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <div className="text-sm text-foreground">
                            {format(new Date(arquivo.created_at), "dd/MM/yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(arquivo.created_at), "HH:mm")}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-medium text-foreground">{formatFileSize(arquivo.tamanho)}</span>
                        </td>
                        <td className="p-4 text-center hidden sm:table-cell">
                          {arquivo.ia_processado ? (
                            <Badge className="bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))] gap-1">
                              <Cpu className="h-3 w-3" />
                            </Badge>
                          ) : arquivo.ia_ler ? (
                            <Badge className="bg-amber-500/20 text-amber-500 gap-1">
                              <Clock className="h-3 w-3" />
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="opacity-50">
                              <X className="h-3 w-3" />
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(arquivo)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Visualizar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(arquivo)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Baixar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handlePreview(arquivo)}>
                                  <Info className="h-4 w-4 mr-2" /> Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleView(arquivo)}>
                                  <Eye className="h-4 w-4 mr-2" /> Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(arquivo)}>
                                  <Download className="h-4 w-4 mr-2" /> Baixar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyUrl(arquivo)}>
                                  <Copy className="h-4 w-4 mr-2" /> Copiar URL
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleIaLer(arquivo)}>
                                  <Brain className="h-4 w-4 mr-2" />
                                  {arquivo.ia_ler ? 'Desativar IA' : 'Ativar IA'}
                                </DropdownMenuItem>
                                {!arquivo.ia_processado && arquivo.ia_ler && (
                                  <DropdownMenuItem onClick={() => handleProcessIA(arquivo)}>
                                    <Zap className="h-4 w-4 mr-2" /> Processar com IA
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => { setFileToDelete(arquivo); setDeleteDialogOpen(true); }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <AnimatePresence>
              {filteredArquivos.map((arquivo, index) => {
                const FileIcon = getFileIcon(arquivo.tipo);
                const isSelected = selectedFiles.has(arquivo.id);
                
                return (
                  <motion.div
                    key={arquivo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ y: -4 }}
                    className={cn(
                      "relative rounded-xl p-4 cursor-pointer transition-all group border-2",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border/50 bg-card hover:border-primary/30 hover:bg-card-hover"
                    )}
                    onClick={() => handlePreview(arquivo)}
                  >
                    {/* Selection checkbox */}
                    <div 
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => { e.stopPropagation(); toggleFileSelection(arquivo.id); }}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        isSelected 
                          ? "border-primary bg-primary" 
                          : "border-border bg-background opacity-0 group-hover:opacity-100"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </div>

                    {/* File icon */}
                    <div className={cn(
                      "p-6 rounded-xl bg-gradient-to-br mb-4 flex items-center justify-center",
                      getFileGradient(arquivo.tipo)
                    )}>
                      <FileIcon className={cn("h-12 w-12", getFileColor(arquivo.tipo))} />
                    </div>

                    {/* File info */}
                    <p className="font-medium text-foreground text-sm truncate">{arquivo.nome}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatFileSize(arquivo.tamanho)}</p>

                    {/* IA Badge */}
                    {arquivo.ia_processado && (
                      <Badge className="absolute top-2 right-2 bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))] gap-1 h-6">
                        <Cpu className="h-3 w-3" /> IA
                      </Badge>
                    )}

                    {/* Hover actions */}
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={(e) => { e.stopPropagation(); handleDownload(arquivo); }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-7 w-7 text-destructive" 
                        onClick={(e) => { e.stopPropagation(); setFileToDelete(arquivo); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredArquivos.length} de {stats.total} arquivos</span>
        <span>Total: {formatFileSize(filteredArquivos.reduce((acc, a) => acc + (a.tamanho || 0), 0))}</span>
      </div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER MONTHS/YEARS
  // ═══════════════════════════════════════════════════════════════

  const renderMonthFolders = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-primary" />
            Meses de {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
              const hasData = monthsWithData.includes(mes);
              const filesInMonth = arquivos.filter(a => a.ano === selectedYear && a.mes === mes).length;

              return (
                <motion.div
                  key={mes}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedMonth(mes);
                    setPeriod("mensal");
                    setViewMode("files");
                  }}
                  className={cn(
                    "p-5 rounded-xl cursor-pointer transition-all border-2",
                    hasData 
                      ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/60" 
                      : "bg-muted/30 border-border/30 opacity-50 hover:opacity-100"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    {hasData ? (
                      <FolderOpen className="h-8 w-8 text-primary" />
                    ) : (
                      <FolderClosed className="h-8 w-8 text-muted-foreground" />
                    )}
                    {hasData && (
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        {filesInMonth}
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-foreground">{MONTH_NAMES[mes - 1]}</p>
                  {hasData && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {filesInMonth} arquivo(s)
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderYearFolders = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Archive className="h-6 w-6 text-primary" />
            Arquivo de Anos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
            {availableYears.map((ano) => {
              const hasData = yearsWithData.includes(ano);
              const filesInYear = arquivos.filter(a => a.ano === ano).length;

              return (
                <motion.div
                  key={ano}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedYear(ano);
                    setViewMode("months");
                  }}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all border-2 text-center",
                    hasData 
                      ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/60" 
                      : "bg-muted/20 border-border/20 opacity-40 hover:opacity-70"
                  )}
                >
                  <p className={cn(
                    "font-bold text-lg",
                    ano === currentYear ? "text-primary" : "text-foreground"
                  )}>
                    {ano}
                  </p>
                  {hasData && (
                    <p className="text-xs text-muted-foreground">{filesInYear}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════
  // MAIN RETURN
  // ═══════════════════════════════════════════════════════════════

  return (
    <div 
      ref={dropZoneRef}
      className="p-4 md:p-6 lg:p-8 min-h-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="p-12 rounded-3xl border-4 border-dashed border-primary bg-primary/10 text-center"
            >
              <CloudUpload className="h-24 w-24 text-primary mx-auto mb-6" />
              <p className="text-2xl font-bold text-foreground">Solte os arquivos aqui</p>
              <p className="text-muted-foreground mt-2">Aceita qualquer tipo de arquivo até 2GB</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <motion.div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium tracking-wide uppercase">Enterprise File Vault</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Central de Arquivos
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Sistema de gerenciamento empresarial com IA integrada
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/50">
                <Database className="h-4 w-4 text-primary" />
                <span className="font-semibold">{stats.total}</span>
                <span className="text-muted-foreground text-sm">arquivos</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/50">
                <HardDrive className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
                <span className="font-semibold">{formatFileSize(stats.totalSize)}</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* View Mode Tabs */}
                <div className="flex bg-secondary/50 rounded-lg p-1">
                  <Button 
                    variant={viewMode === "dashboard" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setViewMode("dashboard")}
                    className="gap-2"
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                  <Button 
                    variant={viewMode === "files" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setViewMode("files")}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Arquivos</span>
                  </Button>
                  <Button 
                    variant={viewMode === "months" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setViewMode("months")}
                    className="gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Meses</span>
                  </Button>
                  <Button 
                    variant={viewMode === "years" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setViewMode("years")}
                    className="gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    <span className="hidden sm:inline">Anos</span>
                  </Button>
                </div>

                {/* Period Filter */}
                <Separator orientation="vertical" className="h-8 hidden lg:block" />
                
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = period === opt.value;
                    return (
                      <TooltipProvider key={opt.value}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPeriod(opt.value as PeriodFilter)}
                              className={cn("gap-2", isActive && "shadow-lg shadow-primary/25")}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="hidden md:inline">{opt.label}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{opt.description}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>

                {/* Year/Month Selector */}
                {(period === "mensal" || period === "anual") && (
                  <>
                    <Separator orientation="vertical" className="h-8 hidden lg:block" />
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(y => y - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {availableYears.map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {period === "mensal" && (
                        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>{MONTH_NAMES[i]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(y => y + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.nav>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === "dashboard" && renderDashboard()}
          {viewMode === "files" && renderFilesList()}
          {viewMode === "months" && renderMonthFolders()}
          {viewMode === "years" && renderYearFolders()}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-primary/20">
                <CloudUpload className="h-6 w-6 text-primary" />
              </div>
              Upload de Arquivos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Drop Zone */}
            <div 
              className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload-modal')?.click()}
            >
              <input
                type="file"
                multiple
                onChange={(e) => setUploadFiles(e.target.files)}
                className="hidden"
                id="file-upload-modal"
              />
              <div className="p-4 rounded-full bg-primary/20 w-fit mx-auto mb-4">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground">Clique para selecionar arquivos</p>
              <p className="text-sm text-muted-foreground mt-1">ou arraste e solte aqui</p>
              <p className="text-xs text-muted-foreground mt-3">Aceita qualquer tipo de arquivo • Até 2GB por arquivo</p>
            </div>

            {/* Selected Files */}
            {uploadFiles && uploadFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">{uploadFiles.length} arquivo(s) selecionado(s)</Label>
                <ScrollArea className="max-h-32">
                  <div className="space-y-2">
                    {Array.from(uploadFiles).map((file, i) => {
                      const FileIcon = getFileIcon(file.type);
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                          <FileIcon className={cn("h-5 w-5", getFileColor(file.type))} />
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Category */}
            <div>
              <Label className="font-semibold">Categoria</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.filter(a => a.id !== 'todos').map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      <span className="flex items-center gap-2">
                        <span>{area.icon}</span>
                        {area.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label className="font-semibold">Descrição (opcional)</Label>
              <Textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Adicione uma descrição..."
                className="mt-1.5"
                rows={2}
              />
            </div>

            {/* Tags */}
            <div>
              <Label className="font-semibold">Tags (opcional)</Label>
              <Input
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="importante, contrato, 2024 (separado por vírgula)"
                className="mt-1.5"
              />
            </div>

            {/* AI Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Brain className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <Label className="font-semibold text-foreground">Processar com IA</Label>
                  <p className="text-xs text-muted-foreground">Extrair texto e analisar conteúdo automaticamente</p>
                </div>
              </div>
              <Switch
                checked={uploadIaLer}
                onCheckedChange={setUploadIaLer}
              />
            </div>

            {/* Progress */}
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">{Math.round(uploadProgress)}% concluído</p>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleUpload} 
              className="w-full gap-2 h-12 text-lg" 
              disabled={uploading || !uploadFiles || uploadFiles.length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Enviar {uploadFiles ? `${uploadFiles.length} arquivo(s)` : 'Arquivos'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedFile && (
                <>
                  <div className={cn("p-2 rounded-xl bg-gradient-to-br", getFileGradient(selectedFile.tipo))}>
                    {(() => { const Icon = getFileIcon(selectedFile.tipo); return <Icon className={cn("h-6 w-6", getFileColor(selectedFile.tipo))} />; })()}
                  </div>
                  <span className="truncate">{selectedFile.nome}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-6 pt-4">
              {/* File Preview */}
              {selectedFile.tipo.includes('image') && (
                <div className="rounded-xl overflow-hidden bg-secondary/50 flex items-center justify-center p-4">
                  <img 
                    src={selectedFile.url} 
                    alt={selectedFile.nome}
                    className="max-h-64 rounded-lg object-contain"
                  />
                </div>
              )}

              {/* File Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Tamanho</p>
                  <p className="font-semibold text-foreground">{formatFileSize(selectedFile.tamanho)}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <p className="font-semibold text-foreground">{selectedFile.extensao || selectedFile.tipo}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Categoria</p>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <span>{AREAS.find(a => a.id === selectedFile.categoria)?.icon || "📂"}</span>
                    {AREAS.find(a => a.id === selectedFile.categoria)?.name || "Geral"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Data de Upload</p>
                  <p className="font-semibold text-foreground">
                    {format(new Date(selectedFile.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedFile.descricao && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-foreground">{selectedFile.descricao}</p>
                </div>
              )}

              {/* IA Status */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-semibold text-foreground">Status IA</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedFile.ia_processado 
                          ? "Processado pela IA" 
                          : selectedFile.ia_ler 
                            ? "Aguardando processamento"
                            : "Não configurado para IA"
                        }
                      </p>
                    </div>
                  </div>
                  {selectedFile.ia_processado ? (
                    <Badge className="bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Concluído
                    </Badge>
                  ) : selectedFile.ia_ler ? (
                    <Badge className="bg-amber-500/20 text-amber-500">
                      <Clock className="h-4 w-4 mr-1" /> Pendente
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => toggleIaLer(selectedFile)}>
                      Ativar IA
                    </Button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 gap-2" onClick={() => handleView(selectedFile)}>
                  <Eye className="h-4 w-4" /> Visualizar
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => handleDownload(selectedFile)}>
                  <Download className="h-4 w-4" /> Baixar
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyUrl(selectedFile)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <span className="font-semibold text-foreground">"{fileToDelete?.nome}"</span>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir Múltiplos Arquivos
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <span className="font-semibold text-foreground">{selectedFiles.size} arquivo(s)</span>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir {selectedFiles.size} arquivo(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
