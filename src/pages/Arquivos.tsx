// ============================================
// MOISÉS MEDEIROS v10.0 - CENTRAL DE ARQUIVOS
// Sistema Estilo Google Drive Empresarial
// Navegação por Área/Ano/Mês/Semana/Dia
// Suporte a qualquer tipo de arquivo
// ============================================

import { useState, useEffect, useMemo } from "react";
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
  Grid,
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
  ChevronDown,
  ChevronUp,
  Sparkles,
  Brain,
  Check,
  X,
  Filter,
  HardDrive,
  CloudUpload,
  ArrowLeft,
  Paperclip,
  ExternalLink,
  Copy,
  Share2,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format } from "date-fns";
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

type ViewMode = "files" | "folders" | "months" | "years";
type PeriodFilter = "diario" | "semanal" | "mensal" | "anual" | "10anos" | "50anos";

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const AREAS = [
  { id: "todos", name: "Todos", icon: "📁", color: "bg-primary/20 text-primary" },
  { id: "aulas", name: "Materiais de Aula", icon: "📚", color: "bg-blue-500/20 text-blue-500" },
  { id: "lancamentos", name: "Lançamentos", icon: "🚀", color: "bg-orange-500/20 text-orange-500" },
  { id: "contratos", name: "Contratos", icon: "📝", color: "bg-emerald-500/20 text-emerald-500" },
  { id: "marketing", name: "Marketing", icon: "📣", color: "bg-purple-500/20 text-purple-500" },
  { id: "videos", name: "Vídeos Gravados", icon: "🎬", color: "bg-red-500/20 text-red-500" },
  { id: "fiscal", name: "Documentos Fiscais", icon: "🧾", color: "bg-amber-500/20 text-amber-500" },
  { id: "financeiro", name: "Financeiro", icon: "💰", color: "bg-green-500/20 text-green-500" },
  { id: "rh", name: "RH / Funcionários", icon: "👥", color: "bg-cyan-500/20 text-cyan-500" },
  { id: "alunos", name: "Alunos", icon: "🎓", color: "bg-pink-500/20 text-pink-500" },
  { id: "geral", name: "Geral", icon: "📂", color: "bg-muted text-muted-foreground" },
];

const PERIOD_OPTIONS = [
  { value: "diario", label: "Hoje", icon: Clock },
  { value: "semanal", label: "Semana", icon: CalendarDays },
  { value: "mensal", label: "Mês", icon: Calendar },
  { value: "anual", label: "Ano", icon: CalendarRange },
  { value: "10anos", label: "10 Anos", icon: History },
  { value: "50anos", label: "50 Anos", icon: Archive },
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

const getFileColor = (tipo: string) => {
  if (tipo.includes('pdf')) return "text-red-500";
  if (tipo.includes('image')) return "text-blue-500";
  if (tipo.includes('video')) return "text-purple-500";
  if (tipo.includes('audio')) return "text-pink-500";
  if (tipo.includes('spreadsheet') || tipo.includes('excel')) return "text-emerald-500";
  if (tipo.includes('zip') || tipo.includes('rar')) return "text-amber-500";
  if (tipo.includes('word') || tipo.includes('document')) return "text-blue-600";
  return "text-muted-foreground";
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function Arquivos() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Estado principal
  const [arquivos, setArquivos] = useState<ArquivoUniversal[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Navegação e filtros
  const [viewMode, setViewMode] = useState<ViewMode>("files");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("list");
  const [period, setPeriod] = useState<PeriodFilter>("mensal");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedArea, setSelectedArea] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("todos");

  // Modais e dialogs
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewFileModalOpen, setViewFileModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ArquivoUniversal | null>(null);
  const [fileToDelete, setFileToDelete] = useState<ArquivoUniversal | null>(null);

  // Upload form
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadCategory, setUploadCategory] = useState("geral");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadIaLer, setUploadIaLer] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════════

  const fetchArquivos = async () => {
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
      // 50anos = todos

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
  };

  useEffect(() => {
    fetchArquivos();
  }, [period, selectedYear, selectedMonth, selectedArea]);

  // ═══════════════════════════════════════════════════════════════
  // FILTERED DATA
  // ═══════════════════════════════════════════════════════════════

  const filteredArquivos = useMemo(() => {
    return arquivos.filter(arquivo => {
      if (searchQuery && !arquivo.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType !== "todos") {
        if (filterType === "image" && !arquivo.tipo.includes('image')) return false;
        if (filterType === "video" && !arquivo.tipo.includes('video')) return false;
        if (filterType === "audio" && !arquivo.tipo.includes('audio')) return false;
        if (filterType === "document" && !['pdf', 'word', 'document', 'text'].some(t => arquivo.tipo.includes(t))) return false;
        if (filterType === "spreadsheet" && !['spreadsheet', 'excel', 'csv'].some(t => arquivo.tipo.includes(t))) return false;
      }
      return true;
    });
  }, [arquivos, searchQuery, filterType]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalSize = arquivos.reduce((acc, a) => acc + (a.tamanho || 0), 0);
    const byCategory: Record<string, { count: number; size: number }> = {};
    
    arquivos.forEach(a => {
      const cat = a.categoria || 'geral';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, size: 0 };
      byCategory[cat].count++;
      byCategory[cat].size += a.tamanho || 0;
    });

    const byType: Record<string, number> = {};
    arquivos.forEach(a => {
      const cat = getFileCategory(a.tipo);
      byType[cat] = (byType[cat] || 0) + 1;
    });

    return { total: arquivos.length, totalSize, byCategory, byType };
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

  const handleDownload = async (arquivo: ArquivoUniversal) => {
    try {
      // Criar signed URL para download
      const { data, error } = await supabase.storage
        .from(arquivo.bucket || 'arquivos')
        .createSignedUrl(arquivo.path, 3600);

      if (error) throw error;

      // Abrir em nova aba para download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = arquivo.nome;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      // Fallback para URL pública
      window.open(arquivo.url, '_blank');
    }
  };

  const handleView = async (arquivo: ArquivoUniversal) => {
    try {
      // Criar signed URL para visualização
      const { data, error } = await supabase.storage
        .from(arquivo.bucket || 'arquivos')
        .createSignedUrl(arquivo.path, 3600);

      if (error) {
        // Fallback para URL pública
        window.open(arquivo.url, '_blank');
      } else {
        window.open(data.signedUrl, '_blank');
      }
    } catch {
      window.open(arquivo.url, '_blank');
    }
  };

  const handleProcessIA = async (arquivo: ArquivoUniversal) => {
    try {
      toast.loading('Processando com IA...');
      
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

      toast.dismiss();
      toast.success('Arquivo processado pela IA!');
      await fetchArquivos();
    } catch (error: any) {
      toast.dismiss();
      toast.error('Erro ao processar: ' + error.message);
    }
  };

  const toggleIaLer = async (arquivo: ArquivoUniversal) => {
    try {
      const newValue = !arquivo.ia_ler;
      await supabase
        .from('arquivos_universal')
        .update({ ia_ler: newValue })
        .eq('id', arquivo.id);

      toast.success(newValue ? 'IA vai ler este arquivo' : 'IA não vai ler este arquivo');
      await fetchArquivos();
    } catch (error: any) {
      toast.error('Erro ao atualizar');
    }
  };

  const copyUrl = (arquivo: ArquivoUniversal) => {
    navigator.clipboard.writeText(arquivo.url);
    toast.success('URL copiada!');
  };

  // Gerar anos disponíveis (50 anos)
  const availableYears = useMemo(() => {
    return Array.from({ length: 61 }, (_, i) => currentYear - 10 + i);
  }, [currentYear]);

  // ═══════════════════════════════════════════════════════════════
  // RENDERS
  // ═══════════════════════════════════════════════════════════════

  const renderStatsCards = () => (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8"
    >
      <div className="glass-card rounded-2xl p-5 border-l-4 border-primary">
        <div className="flex items-center justify-between mb-3">
          <FolderOpen className="h-6 w-6 text-primary" />
          <Badge variant="outline">{stats.total}</Badge>
        </div>
        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        <p className="text-sm text-muted-foreground">Arquivos</p>
      </div>

      <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-blue))]">
        <div className="flex items-center justify-between mb-3">
          <HardDrive className="h-6 w-6 text-[hsl(var(--stats-blue))]" />
        </div>
        <p className="text-2xl font-bold text-[hsl(var(--stats-blue))]">{formatFileSize(stats.totalSize)}</p>
        <p className="text-sm text-muted-foreground">Armazenamento</p>
      </div>

      <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-green))]">
        <div className="flex items-center justify-between mb-3">
          <Image className="h-6 w-6 text-[hsl(var(--stats-green))]" />
          <Badge variant="outline">{stats.byType['image'] || 0}</Badge>
        </div>
        <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">{stats.byType['image'] || 0}</p>
        <p className="text-sm text-muted-foreground">Imagens</p>
      </div>

      <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-purple))]">
        <div className="flex items-center justify-between mb-3">
          <FileText className="h-6 w-6 text-[hsl(var(--stats-purple))]" />
          <Badge variant="outline">{stats.byType['document'] || 0}</Badge>
        </div>
        <p className="text-2xl font-bold text-[hsl(var(--stats-purple))]">{stats.byType['document'] || 0}</p>
        <p className="text-sm text-muted-foreground">Documentos</p>
      </div>

      <div className="glass-card rounded-2xl p-5 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <Button onClick={() => setUploadModalOpen(true)} className="gap-2 w-full">
          <Upload className="h-4 w-4" /> Upload
        </Button>
      </div>
    </motion.section>
  );

  const renderPeriodNavigation = () => (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Botões de Período */}
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = period === opt.value;
          return (
            <Button
              key={opt.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(opt.value as PeriodFilter)}
              className={cn("gap-2", isActive && "shadow-lg shadow-primary/25")}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{opt.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Seletor de Ano/Mês */}
      {(period === "mensal" || period === "anual") && (
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-24">
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
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{MONTH_NAMES[i]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Botões de Visualização */}
      <div className="flex gap-2 ml-auto">
        <Button
          variant={viewMode === "files" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("files")}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Arquivos</span>
        </Button>
        <Button
          variant={viewMode === "months" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("months")}
          className="gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Meses</span>
        </Button>
        <Button
          variant={viewMode === "years" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("years")}
          className="gap-2"
        >
          <Archive className="h-4 w-4" />
          <span className="hidden sm:inline">Anos</span>
        </Button>
      </div>
    </div>
  );

  const renderAreaTabs = () => (
    <Tabs value={selectedArea} onValueChange={setSelectedArea} className="mb-6">
      <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
        {AREAS.map(area => (
          <TabsTrigger key={area.id} value={area.id} className="gap-1">
            <span>{area.icon}</span>
            <span className="hidden md:inline">{area.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  const renderMonthFolders = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-primary" />
          Meses de {selectedYear}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
          const hasData = monthsWithData.includes(mes);
          const filesInMonth = arquivos.filter(a => a.ano === selectedYear && a.mes === mes).length;

          return (
            <motion.div
              key={mes}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedMonth(mes);
                setPeriod("mensal");
                setViewMode("files");
              }}
              className={cn(
                "glass-card rounded-xl p-4 cursor-pointer transition-all border-2",
                hasData 
                  ? "border-primary/30 hover:border-primary/60" 
                  : "border-border/30 opacity-60 hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                {hasData ? (
                  <FolderOpen className="h-8 w-8 text-primary" />
                ) : (
                  <FolderClosed className="h-8 w-8 text-muted-foreground" />
                )}
                {hasData && <Badge variant="secondary">{filesInMonth}</Badge>}
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
    </motion.div>
  );

  const renderYearFolders = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <Archive className="h-6 w-6 text-primary" />
        Arquivo de Anos (50 anos)
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
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
                "glass-card rounded-xl p-3 cursor-pointer transition-all border-2 text-center",
                hasData 
                  ? "border-primary/30 hover:border-primary/60" 
                  : "border-border/20 opacity-40 hover:opacity-70"
              )}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {hasData ? (
                  <FolderOpen className="h-4 w-4 text-primary" />
                ) : null}
              </div>
              <p className={cn(
                "font-bold text-lg",
                ano === currentYear && "text-primary"
              )}>
                {ano}
              </p>
              {hasData && (
                <p className="text-xs text-muted-foreground">
                  {filesInYear} arquivo(s)
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  const renderFilesList = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            <SelectItem value="todos">Todos Tipos</SelectItem>
            <SelectItem value="image">Imagens</SelectItem>
            <SelectItem value="video">Vídeos</SelectItem>
            <SelectItem value="audio">Áudio</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
            <SelectItem value="spreadsheet">Planilhas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setDisplayMode(displayMode === "grid" ? "list" : "grid")}>
          {displayMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={fetchArquivos}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Area Tabs */}
      {renderAreaTabs()}

      {/* Files Table/Grid */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredArquivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum arquivo encontrado</p>
            <Button onClick={() => setUploadModalOpen(true)} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" /> Fazer Upload
            </Button>
          </div>
        ) : displayMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-bold text-white">Nome</th>
                  <th className="text-left p-4 text-sm font-bold text-white">Categoria</th>
                  <th className="text-left p-4 text-sm font-bold text-white">Data</th>
                  <th className="text-right p-4 text-sm font-bold text-white">Tamanho</th>
                  <th className="text-center p-4 text-sm font-bold text-white">IA</th>
                  <th className="text-right p-4 text-sm font-bold text-white">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredArquivos.map((arquivo) => {
                  const FileIcon = getFileIcon(arquivo.tipo);
                  const area = AREAS.find(a => a.id === arquivo.categoria) || AREAS.find(a => a.id === 'geral')!;
                  
                  return (
                    <tr 
                      key={arquivo.id}
                      className="border-t border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg bg-muted", getFileColor(arquivo.tipo))}>
                            <FileIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground truncate max-w-[300px]">{arquivo.nome}</p>
                            {arquivo.descricao && (
                              <p className="text-xs text-muted-foreground truncate max-w-[300px]">{arquivo.descricao}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={area.color}>
                          <span className="mr-1">{area.icon}</span>
                          {area.name}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {format(new Date(arquivo.created_at), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium text-foreground">
                        {formatFileSize(arquivo.tamanho)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {arquivo.ia_processado ? (
                            <Badge className="bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))] gap-1">
                              <Check className="h-3 w-3" />
                              Lido
                            </Badge>
                          ) : arquivo.ia_ler ? (
                            <Badge className="bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))] gap-1">
                              <Clock className="h-3 w-3" />
                              Pendente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <X className="h-3 w-3" />
                              Não
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleView(arquivo)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDownload(arquivo)}
                            title="Baixar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(arquivo)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(arquivo)}>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyUrl(arquivo)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar URL
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleIaLer(arquivo)}>
                                <Brain className="h-4 w-4 mr-2" />
                                {arquivo.ia_ler ? 'Desativar IA' : 'Ativar IA'}
                              </DropdownMenuItem>
                              {!arquivo.ia_processado && arquivo.ia_ler && (
                                <DropdownMenuItem onClick={() => handleProcessIA(arquivo)}>
                                  <Bot className="h-4 w-4 mr-2" />
                                  Processar com IA
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setFileToDelete(arquivo);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid View
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredArquivos.map((arquivo) => {
              const FileIcon = getFileIcon(arquivo.tipo);
              
              return (
                <motion.div
                  key={arquivo.id}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
                  onClick={() => handleView(arquivo)}
                >
                  <div className={cn("p-4 rounded-lg bg-muted mb-3 flex items-center justify-center", getFileColor(arquivo.tipo))}>
                    <FileIcon className="h-10 w-10" />
                  </div>
                  <p className="font-medium text-foreground text-sm truncate">{arquivo.nome}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatFileSize(arquivo.tamanho)}</p>
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDownload(arquivo); }}>
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setFileToDelete(arquivo); setDeleteDialogOpen(true); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════
  // MAIN RETURN
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="space-y-2">
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Central de Arquivos</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Drive Empresarial
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Sistema completo estilo Google Drive com organização por área, ano, mês e dia.
            </p>
          </div>
        </motion.header>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Period Navigation */}
        {renderPeriodNavigation()}

        {/* Content based on view mode */}
        {viewMode === "files" && renderFilesList()}
        {viewMode === "months" && renderMonthFolders()}
        {viewMode === "years" && renderYearFolders()}

        {/* Upload Modal */}
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CloudUpload className="h-5 w-5 text-primary" />
                Upload de Arquivos
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="font-bold text-foreground">Arquivos *</Label>
                <div className="mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setUploadFiles(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-foreground font-medium">Clique para selecionar ou arraste arquivos</p>
                    <p className="text-sm text-muted-foreground mt-1">Aceita qualquer tipo de arquivo (até 2GB)</p>
                  </label>
                </div>
                {uploadFiles && uploadFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {Array.from(uploadFiles).map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="font-bold text-foreground">Categoria/Pasta</Label>
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

              <div>
                <Label className="font-bold text-foreground">Descrição (opcional)</Label>
                <Textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Descrição do(s) arquivo(s)..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <Label className="font-bold text-foreground">Processar com IA</Label>
                  <p className="text-xs text-muted-foreground">Extrair texto e analisar conteúdo</p>
                </div>
                <Switch
                  checked={uploadIaLer}
                  onCheckedChange={setUploadIaLer}
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-center text-muted-foreground">{Math.round(uploadProgress)}% concluído</p>
                </div>
              )}

              <Button 
                onClick={handleUpload} 
                className="w-full gap-2" 
                disabled={uploading || !uploadFiles || uploadFiles.length === 0}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Enviando...' : 'Enviar Arquivos'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o arquivo "{fileToDelete?.nome}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
