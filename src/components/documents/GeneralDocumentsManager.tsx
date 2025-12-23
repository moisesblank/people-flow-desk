// ============================================
// GERENCIADOR DE DOCUMENTOS v15.0 - ULTRA
// Upload múltiplo, drag & drop, até 2GB
// Preview avançado, extração IA, visual incrível
// ============================================

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptimisticMutation } from "@/hooks/useSubspaceCommunication";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Search,
  Filter,
  Image,
  FileSpreadsheet,
  File,
  Loader2,
  Eye,
  Plus,
  X,
  FolderOpen,
  Tag,
  Sparkles,
  Brain,
  CheckCircle,
  Clock,
  AlertCircle,
  FileImage,
  FileType,
  Presentation,
  Copy,
  RefreshCw,
  CloudUpload,
  FileVideo,
  FileAudio,
  Archive,
  Code2,
  HardDrive,
  Folder,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  ChevronRight,
  MoreVertical,
  ExternalLink,
  FileCheck,
  Zap,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ============= INTERFACES =============
interface Document {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  category: string;
  tags: string[] | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  extracted_content: string | null;
  extraction_status: string | null;
  extraction_date: string | null;
  extraction_model: string | null;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  category: string;
  title: string;
}

// ============= CONSTANTS =============
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const STORAGE_BUCKET = "arquivos";

const CATEGORIES = [
  { value: "geral", label: "Geral", icon: FolderOpen, color: "bg-slate-500" },
  { value: "contratos", label: "Contratos", icon: FileText, color: "bg-blue-500" },
  { value: "financeiro", label: "Financeiro", icon: FileSpreadsheet, color: "bg-green-500" },
  { value: "marketing", label: "Marketing", icon: Image, color: "bg-purple-500" },
  { value: "rh", label: "RH / Pessoal", icon: FileText, color: "bg-orange-500" },
  { value: "academico", label: "Acadêmico", icon: FileText, color: "bg-cyan-500" },
  { value: "projetos", label: "Projetos", icon: Folder, color: "bg-pink-500" },
  { value: "outros", label: "Outros", icon: File, color: "bg-gray-500" },
];

const FILE_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  'application/pdf': { icon: FileText, color: 'text-red-500', label: 'PDF' },
  'application/msword': { icon: FileText, color: 'text-blue-500', label: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, color: 'text-blue-500', label: 'DOCX' },
  'application/vnd.ms-excel': { icon: FileSpreadsheet, color: 'text-green-500', label: 'XLS' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileSpreadsheet, color: 'text-green-500', label: 'XLSX' },
  'text/csv': { icon: FileSpreadsheet, color: 'text-green-500', label: 'CSV' },
  'application/vnd.ms-powerpoint': { icon: Presentation, color: 'text-orange-500', label: 'PPT' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: Presentation, color: 'text-orange-500', label: 'PPTX' },
  'image/jpeg': { icon: FileImage, color: 'text-purple-500', label: 'JPEG' },
  'image/png': { icon: FileImage, color: 'text-purple-500', label: 'PNG' },
  'image/gif': { icon: FileImage, color: 'text-purple-500', label: 'GIF' },
  'image/webp': { icon: FileImage, color: 'text-purple-500', label: 'WEBP' },
  'image/svg+xml': { icon: FileImage, color: 'text-purple-500', label: 'SVG' },
  'video/mp4': { icon: FileVideo, color: 'text-pink-500', label: 'MP4' },
  'video/webm': { icon: FileVideo, color: 'text-pink-500', label: 'WEBM' },
  'audio/mpeg': { icon: FileAudio, color: 'text-cyan-500', label: 'MP3' },
  'audio/wav': { icon: FileAudio, color: 'text-cyan-500', label: 'WAV' },
  'application/zip': { icon: Archive, color: 'text-yellow-500', label: 'ZIP' },
  'application/x-rar-compressed': { icon: Archive, color: 'text-yellow-500', label: 'RAR' },
  'text/plain': { icon: FileType, color: 'text-gray-500', label: 'TXT' },
  'text/markdown': { icon: FileType, color: 'text-gray-500', label: 'MD' },
  'application/json': { icon: Code2, color: 'text-yellow-500', label: 'JSON' },
  'application/xml': { icon: Code2, color: 'text-orange-500', label: 'XML' },
  'text/html': { icon: Code2, color: 'text-blue-500', label: 'HTML' },
  'text/css': { icon: Code2, color: 'text-purple-500', label: 'CSS' },
  'application/javascript': { icon: Code2, color: 'text-yellow-500', label: 'JS' },
};

// ============= HELPER FUNCTIONS =============
const getFileConfig = (fileType: string) => {
  if (FILE_TYPE_CONFIG[fileType]) return FILE_TYPE_CONFIG[fileType];
  if (fileType.includes("image")) return { icon: FileImage, color: 'text-purple-500', label: 'IMG' };
  if (fileType.includes("video")) return { icon: FileVideo, color: 'text-pink-500', label: 'VID' };
  if (fileType.includes("audio")) return { icon: FileAudio, color: 'text-cyan-500', label: 'AUD' };
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return { icon: FileSpreadsheet, color: 'text-green-500', label: 'XLS' };
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return { icon: Presentation, color: 'text-orange-500', label: 'PPT' };
  if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("word")) return { icon: FileText, color: 'text-blue-500', label: 'DOC' };
  if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("archive")) return { icon: Archive, color: 'text-yellow-500', label: 'ZIP' };
  return { icon: File, color: 'text-muted-foreground', label: 'FILE' };
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getExtractionBadge = (status: string | null) => {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 gap-1 text-[10px]">
          <CheckCircle className="h-3 w-3" /> IA Extraído
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1 text-[10px]">
          <Loader2 className="h-3 w-3 animate-spin" /> Processando
        </Badge>
      );
    case 'rate_limited':
      return (
        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 gap-1 text-[10px]">
          <Clock className="h-3 w-3" /> Na Fila
        </Badge>
      );
    case 'error':
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1 text-[10px]">
          <AlertCircle className="h-3 w-3" /> Erro
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Sparkles className="h-3 w-3" /> Pendente
        </Badge>
      );
  }
};

// Gera URL assinada para visualização segura
const getSignedUrl = async (filePath: string): Promise<string | null> => {
  try {
    // Extrair o path relativo da URL
    let path = filePath;
    if (filePath.includes('/storage/v1/object/public/')) {
      path = filePath.split('/storage/v1/object/public/arquivos/')[1] || filePath;
    } else if (filePath.includes('/arquivos/')) {
      path = filePath.split('/arquivos/').pop() || filePath;
    }
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 3600); // 1 hora
    
    if (error) {
      console.error('Erro ao criar URL assinada:', error);
      // Fallback para URL pública
      return filePath;
    }
    return data.signedUrl;
  } catch (error) {
    console.error('Erro:', error);
    return filePath;
  }
};

// ============= MAIN COMPONENT =============
export function GeneralDocumentsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isDragging, setIsDragging] = useState(false);
  
  // Dialogs
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Upload state
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [defaultCategory, setDefaultCategory] = useState("geral");
  const [autoExtract, setAutoExtract] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [extractingId, setExtractingId] = useState<string | null>(null);

  // Fetch documents
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["general-documents", search, categoryFilter, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from("general_documents")
        .select("*")
        .order("created_at", { ascending: sortOrder === "asc" });
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%,extracted_content.ilike.%${search}%`);
      }
      
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    },
  });

  // ============================================
  // FASE 3 COMPLETA - useOptimisticMutation (0ms)
  // ============================================
  const deleteMutation = useOptimisticMutation<Document[], Document, void>({
    queryKey: ["general-documents"],
    mutationFn: async (doc) => {
      // Extrair path do arquivo
      let path = doc.file_url;
      if (path.includes('/storage/v1/object/public/arquivos/')) {
        path = path.split('/storage/v1/object/public/arquivos/')[1];
      } else if (path.includes('/arquivos/')) {
        path = path.split('/arquivos/').pop() || path;
      }
      
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      const { error } = await supabase
        .from("general_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;
    },
    optimisticUpdate: (old, doc) => (old || []).filter(d => d.id !== doc.id),
    onSuccess: () => setDeleteDoc(null),
    successMessage: "Documento excluído!",
    errorMessage: "Erro ao excluir documento",
  });

  // Bulk delete
  const handleBulkDelete = async () => {
    const docsToDelete = documents.filter(d => selectedDocs.has(d.id));
    for (const doc of docsToDelete) {
      await deleteMutation.mutateAsync(doc);
    }
    setSelectedDocs(new Set());
    toast.success(`${docsToDelete.length} documentos excluídos`);
  };

  // Extract content with AI
  const extractContent = async (doc: Document) => {
    setExtractingId(doc.id);
    try {
      const { data, error } = await supabase.functions.invoke('extract-document', {
        body: {
          documentId: doc.id,
          fileUrl: doc.file_url,
          fileName: doc.file_name,
          fileType: doc.file_type
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Conteúdo extraído com IA!", {
          description: `Modelo: ${data.model}`
        });
        refetch();
      } else {
        toast.error("Erro na extração", {
          description: data.error
        });
      }
    } catch (error: any) {
      console.error('Erro na extração:', error);
      toast.error("Erro ao extrair", {
        description: error.message
      });
    } finally {
      setExtractingId(null);
    }
  };

  // Handle file selection
  const handleFilesSelected = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: UploadingFile[] = [];
    
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} excede 2GB`);
        continue;
      }
      
      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        progress: 0,
        status: 'pending',
        category: defaultCategory,
        title: file.name.replace(/\.[^/.]+$/, "")
      });
    }
    
    if (validFiles.length > 0) {
      setUploadingFiles(prev => [...prev, ...validFiles]);
      setIsUploadOpen(true);
    }
  }, [defaultCategory]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFilesSelected(e.dataTransfer.files);
    }
  }, [handleFilesSelected]);

  // Upload single file
  const uploadSingleFile = async (uploadFile: UploadingFile): Promise<boolean> => {
    try {
      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      const fileExt = uploadFile.file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, uploadFile.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Update progress
      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 80 } : f
      ));

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // Insert into database
      const { data: insertedDoc, error: insertError } = await supabase
        .from("general_documents")
        .insert({
          title: uploadFile.title.trim() || uploadFile.file.name,
          file_name: uploadFile.file.name,
          file_url: publicUrl,
          file_type: uploadFile.file.type,
          file_size: uploadFile.file.size,
          category: uploadFile.category,
          uploaded_by: user?.id,
          extraction_status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress: 100, status: 'success' } : f
      ));

      // Auto extract if enabled
      if (autoExtract && insertedDoc) {
        setTimeout(() => {
          extractContent(insertedDoc as Document);
        }, 500);
      }

      return true;
    } catch (error: any) {
      setUploadingFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'error', error: error.message } : f
      ));
      return false;
    }
  };

  // Upload all files
  const handleUploadAll = async () => {
    const pendingFiles = uploadingFiles.filter(f => f.status === 'pending');
    let successCount = 0;
    
    for (const file of pendingFiles) {
      const success = await uploadSingleFile(file);
      if (success) successCount++;
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) enviado(s)!`);
      queryClient.invalidateQueries({ queryKey: ["general-documents"] });
    }
    
    // Remove successful uploads after delay
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(f => f.status !== 'success'));
      if (uploadingFiles.every(f => f.status === 'success' || f.status === 'error')) {
        setIsUploadOpen(false);
      }
    }, 2000);
  };

  // View document
  const handleViewDocument = async (doc: Document) => {
    setViewDoc(doc);
    const url = await getSignedUrl(doc.file_url);
    setPreviewUrl(url);
  };

  // Download document
  const handleDownload = async (doc: Document) => {
    try {
      const url = await getSignedUrl(doc.file_url);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download iniciado!");
      }
    } catch (error) {
      toast.error("Erro ao baixar arquivo");
    }
  };

  // Copy extracted content
  const copyExtractedContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Conteúdo copiado!");
  };

  // Stats
  const stats = {
    total: documents.length,
    totalSize: documents.reduce((acc, d) => acc + (d.file_size || 0), 0),
    extracted: documents.filter(d => d.extraction_status === 'completed').length,
    pending: documents.filter(d => !d.extraction_status || d.extraction_status === 'pending').length,
    byCategory: CATEGORIES.reduce((acc, cat) => {
      acc[cat.value] = documents.filter(d => d.category === cat.value).length;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <TooltipProvider>
      <div 
        className="space-y-6"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-dashed border-primary rounded-3xl p-16 text-center"
              >
                <CloudUpload className="h-24 w-24 mx-auto text-primary mb-6 animate-bounce" />
                <h2 className="text-3xl font-bold mb-2">Solte seus arquivos aqui</h2>
                <p className="text-muted-foreground text-lg">
                  Suporte a múltiplos arquivos • Até 2GB cada
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <FolderOpen className="h-7 w-7 text-primary" />
              </div>
              Central de Documentos
            </h2>
            <p className="text-muted-foreground mt-1">
              Upload ilimitado com extração inteligente via IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar lista</TooltipContent>
            </Tooltip>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
            />
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
              size="lg"
            >
              <CloudUpload className="h-5 w-5" />
              Upload de Arquivos
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Total */}
          <Card className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 border-slate-500/20 hover:border-slate-500/40 transition-colors cursor-pointer"
            onClick={() => setCategoryFilter("all")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/20">
                  <HardDrive className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatFileSize(stats.totalSize)} usados
              </p>
            </CardContent>
          </Card>

          {/* Extraídos */}
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Brain className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.extracted}</p>
                  <p className="text-xs text-muted-foreground">IA Extraído</p>
                </div>
              </div>
              <Progress value={(stats.extracted / Math.max(stats.total, 1)) * 100} className="h-1 mt-2" />
            </CardContent>
          </Card>

          {/* Categories */}
          {CATEGORIES.slice(0, 4).map(cat => {
            const count = stats.byCategory[cat.value] || 0;
            const Icon = cat.icon;
            const isActive = categoryFilter === cat.value;
            return (
              <Card 
                key={cat.value}
                className={`cursor-pointer transition-all hover:scale-[1.02] ${
                  isActive 
                    ? `bg-gradient-to-br ${cat.color}/20 border-primary` 
                    : `hover:border-primary/50`
                }`}
                onClick={() => setCategoryFilter(isActive ? "all" : cat.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${cat.color}/20`}>
                      <Icon className={`h-5 w-5 ${cat.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{cat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, nome do arquivo ou conteúdo extraído..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-11">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              {sortOrder === "desc" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
            </Button>

            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-11 w-11 rounded-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-11 w-11 rounded-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDocs.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg"
          >
            <Badge variant="secondary">{selectedDocs.size} selecionado(s)</Badge>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDocs(new Set())}>
              Cancelar
            </Button>
          </motion.div>
        )}

        {/* Documents */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <CardContent className="py-20 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <CloudUpload className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
                <h3 className="text-xl font-semibold mb-2">Nenhum documento encontrado</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {search || categoryFilter !== "all" 
                    ? "Tente ajustar os filtros de busca"
                    : "Arraste arquivos aqui ou clique para fazer upload. Suporte a múltiplos arquivos até 2GB cada."}
                </p>
                <Button size="lg" className="gap-2">
                  <Upload className="h-5 w-5" />
                  Fazer Upload
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {documents.map((doc, index) => {
                const fileConfig = getFileConfig(doc.file_type);
                const FileIcon = fileConfig.icon;
                const category = CATEGORIES.find(c => c.value === doc.category);
                const isExtracting = extractingId === doc.id;
                const isSelected = selectedDocs.has(doc.id);
                
                return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className={`group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 ${
                      isSelected ? 'ring-2 ring-primary border-primary' : ''
                    }`}>
                      {/* Selection checkbox */}
                      <div className="absolute top-3 left-3 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedDocs);
                            if (checked) newSet.add(doc.id);
                            else newSet.delete(doc.id);
                            setSelectedDocs(newSet);
                          }}
                          className="bg-background/80 backdrop-blur-sm"
                        />
                      </div>

                      {/* Quick actions menu */}
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                              <Eye className="h-4 w-4 mr-2" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" /> Baixar
                            </DropdownMenuItem>
                            {doc.extraction_status !== 'completed' && (
                              <DropdownMenuItem onClick={() => extractContent(doc)} disabled={isExtracting}>
                                <Brain className="h-4 w-4 mr-2" /> Extrair com IA
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteDoc(doc)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <CardContent className="p-5">
                        {/* File icon and type badge */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${category?.color || 'bg-slate-500'}/10 shrink-0`}>
                            <FileIcon className={`h-8 w-8 ${fileConfig.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 leading-tight" title={doc.title}>
                              {doc.title}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate mt-1" title={doc.file_name}>
                              {doc.file_name}
                            </p>
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            {fileConfig.label}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] px-1.5 ${category?.color.replace('bg-', 'border-')}/50`}>
                            {category?.label || doc.category}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                        </div>

                        {/* Extraction status */}
                        <div className="flex items-center justify-between">
                          {getExtractionBadge(doc.extraction_status)}
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>

                        {/* Extracted preview */}
                        {doc.extracted_content && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {doc.extracted_content.substring(0, 150)}...
                            </p>
                          </div>
                        )}
                      </CardContent>

                      {/* Hover actions bar */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" className="flex-1 h-8" onClick={() => handleViewDocument(doc)}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                          </Button>
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleDownload(doc)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          // List View
          <Card>
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {documents.map((doc, index) => {
                  const fileConfig = getFileConfig(doc.file_type);
                  const FileIcon = fileConfig.icon;
                  const category = CATEGORIES.find(c => c.value === doc.category);
                  const isExtracting = extractingId === doc.id;
                  const isSelected = selectedDocs.has(doc.id);
                  
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedDocs);
                          if (checked) newSet.add(doc.id);
                          else newSet.delete(doc.id);
                          setSelectedDocs(newSet);
                        }}
                      />
                      
                      <div className={`p-2 rounded-lg ${category?.color || 'bg-slate-500'}/10 shrink-0`}>
                        <FileIcon className={`h-6 w-6 ${fileConfig.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px]">
                          {category?.label || doc.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground w-16">
                          {formatFileSize(doc.file_size)}
                        </span>
                        {getExtractionBadge(doc.extraction_status)}
                        <span className="text-xs text-muted-foreground w-24">
                          {format(new Date(doc.created_at), "dd/MM/yy HH:mm")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDocument(doc)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Visualizar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Baixar</TooltipContent>
                        </Tooltip>
                        {doc.extraction_status !== 'completed' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={() => extractContent(doc)}
                                disabled={isExtracting}
                              >
                                {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Extrair com IA</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive" 
                              onClick={() => setDeleteDoc(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CloudUpload className="h-5 w-5 text-primary" />
                Upload de Documentos
              </DialogTitle>
              <DialogDescription>
                Arraste arquivos ou clique para selecionar. Suporte até 2GB por arquivo.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <CloudUpload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Clique ou arraste arquivos aqui</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Suporte a múltiplos arquivos • Até 2GB cada
                </p>
              </div>

              {/* Settings */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Categoria padrão:</Label>
                  <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={autoExtract} onCheckedChange={setAutoExtract} />
                  <Label className="text-sm">Extrair com IA</Label>
                </div>
              </div>

              {/* Files list */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {uploadingFiles.length} arquivo(s) selecionado(s)
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setUploadingFiles([])}
                    >
                      Limpar tudo
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[250px] border rounded-lg">
                    <div className="divide-y">
                      {uploadingFiles.map(file => {
                        const fileConfig = getFileConfig(file.file.type);
                        const FileIcon = fileConfig.icon;
                        
                        return (
                          <div key={file.id} className="flex items-center gap-3 p-3">
                            <div className="p-2 rounded-lg bg-muted shrink-0">
                              <FileIcon className={`h-5 w-5 ${fileConfig.color}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-1">
                              <Input
                                value={file.title}
                                onChange={(e) => setUploadingFiles(prev => 
                                  prev.map(f => f.id === file.id ? { ...f, title: e.target.value } : f)
                                )}
                                className="h-8 text-sm"
                                placeholder="Título do documento"
                                disabled={file.status !== 'pending'}
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground truncate flex-1">
                                  {file.file.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatFileSize(file.file.size)}
                                </span>
                              </div>
                              {file.status === 'uploading' && (
                                <Progress value={file.progress} className="h-1" />
                              )}
                              {file.status === 'error' && (
                                <p className="text-[10px] text-destructive">{file.error}</p>
                              )}
                            </div>
                            
                            <Select
                              value={file.category}
                              onValueChange={(value) => setUploadingFiles(prev =>
                                prev.map(f => f.id === file.id ? { ...f, category: value } : f)
                              )}
                              disabled={file.status !== 'pending'}
                            >
                              <SelectTrigger className="w-[100px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map(cat => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <div className="shrink-0">
                              {file.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setUploadingFiles(prev => prev.filter(f => f.id !== file.id))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              {file.status === 'uploading' && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              )}
                              {file.status === 'success' && (
                                <Check className="h-4 w-4 text-emerald-500" />
                              )}
                              {file.status === 'error' && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => {
                setUploadingFiles([]);
                setIsUploadOpen(false);
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUploadAll}
                disabled={uploadingFiles.filter(f => f.status === 'pending').length === 0}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Enviar {uploadingFiles.filter(f => f.status === 'pending').length} arquivo(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {viewDoc && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {(() => {
                      const FileIcon = getFileConfig(viewDoc.file_type).icon;
                      return <FileIcon className={`h-5 w-5 ${getFileConfig(viewDoc.file_type).color}`} />;
                    })()}
                    {viewDoc.title}
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="preview" className="flex-1 overflow-hidden flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="extracted" disabled={!viewDoc.extracted_content}>
                      Conteúdo IA
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="flex-1 overflow-hidden">
                    <div className="h-[500px] bg-muted/50 rounded-lg overflow-hidden">
                      {viewDoc.file_type.includes('image') ? (
                        <img 
                          src={previewUrl || viewDoc.file_url} 
                          alt={viewDoc.title}
                          className="w-full h-full object-contain"
                        />
                      ) : viewDoc.file_type.includes('pdf') ? (
                        <iframe
                          src={previewUrl || viewDoc.file_url}
                          className="w-full h-full"
                          title={viewDoc.title}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          {(() => {
                            const FileIcon = getFileConfig(viewDoc.file_type).icon;
                            return <FileIcon className="h-24 w-24 mb-4" />;
                          })()}
                          <p className="text-lg font-medium mb-4">Preview não disponível</p>
                          <Button onClick={() => handleDownload(viewDoc)} className="gap-2">
                            <Download className="h-4 w-4" />
                            Baixar para visualizar
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="info" className="flex-1 overflow-auto">
                    <div className="space-y-4 p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Nome do arquivo</Label>
                          <p className="font-medium">{viewDoc.file_name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Tamanho</Label>
                          <p className="font-medium">{formatFileSize(viewDoc.file_size)}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Tipo</Label>
                          <p className="font-medium">{viewDoc.file_type}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Categoria</Label>
                          <p className="font-medium">
                            {CATEGORIES.find(c => c.value === viewDoc.category)?.label || viewDoc.category}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Criado em</Label>
                          <p className="font-medium">
                            {format(new Date(viewDoc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Status IA</Label>
                          <div className="mt-1">{getExtractionBadge(viewDoc.extraction_status)}</div>
                        </div>
                      </div>
                      
                      {viewDoc.description && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Descrição</Label>
                          <p className="mt-1">{viewDoc.description}</p>
                        </div>
                      )}
                      
                      {viewDoc.tags && viewDoc.tags.length > 0 && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {viewDoc.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="extracted" className="flex-1 overflow-hidden flex flex-col">
                    {viewDoc.extracted_content && (
                      <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Brain className="h-4 w-4" />
                            <span>Extraído por {viewDoc.extraction_model}</span>
                            {viewDoc.extraction_date && (
                              <span>
                                em {format(new Date(viewDoc.extraction_date), "dd/MM/yyyy HH:mm")}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyExtractedContent(viewDoc.extracted_content!)}
                            className="gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            Copiar
                          </Button>
                        </div>
                        <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/50">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {viewDoc.extracted_content}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <DialogFooter className="border-t pt-4 gap-2">
                  {viewDoc.extraction_status !== 'completed' && (
                    <Button
                      variant="outline"
                      onClick={() => extractContent(viewDoc)}
                      disabled={extractingId === viewDoc.id}
                      className="gap-2"
                    >
                      {extractingId === viewDoc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                      Extrair com IA
                    </Button>
                  )}
                  <Button onClick={() => handleDownload(viewDoc)} className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (previewUrl) {
                        window.open(previewUrl, '_blank');
                      }
                    }}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir em nova aba
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deleteDoc?.title}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteDoc && deleteMutation.mutate(deleteDoc)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
