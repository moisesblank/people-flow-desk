// ============================================
// GERENCIADOR DE DOCUMENTOS v10.0
// Com extração IA, suporte a todos formatos
// Acesso: Owner/Admin vê tudo, outros só o seu
// ============================================

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const CATEGORIES = [
  { value: "geral", label: "Geral", icon: FolderOpen },
  { value: "contratos", label: "Contratos", icon: FileText },
  { value: "financeiro", label: "Financeiro", icon: FileSpreadsheet },
  { value: "marketing", label: "Marketing", icon: Image },
  { value: "rh", label: "RH / Pessoal", icon: FileText },
  { value: "academico", label: "Acadêmico", icon: FileText },
  { value: "outros", label: "Outros", icon: File },
];

// Tipos de arquivo aceitos
const ACCEPTED_FILE_TYPES = [
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Planilhas
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  // Apresentações
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Imagens
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Texto
  'text/plain',
  'text/markdown',
  // Outros
  'application/json',
  'application/xml',
].join(',');

const getFileIcon = (fileType: string) => {
  if (fileType.includes("image")) return FileImage;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) return FileSpreadsheet;
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return Presentation;
  if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("word")) return FileText;
  if (fileType.includes("text")) return FileType;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getExtractionStatusBadge = (status: string | null) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500/20 text-green-500 gap-1"><CheckCircle className="h-3 w-3" /> Extraído</Badge>;
    case 'processing':
      return <Badge className="bg-blue-500/20 text-blue-500 gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Processando</Badge>;
    case 'rate_limited':
      return <Badge className="bg-yellow-500/20 text-yellow-500 gap-1"><Clock className="h-3 w-3" /> Aguardando</Badge>;
    case 'error':
      return <Badge className="bg-red-500/20 text-red-500 gap-1"><AlertCircle className="h-3 w-3" /> Erro</Badge>;
    default:
      return <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> Pendente</Badge>;
  }
};

export function GeneralDocumentsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState("geral");
  const [uploadTags, setUploadTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [autoExtract, setAutoExtract] = useState(true);

  // Fetch documents
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["general-documents", search, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("general_documents")
        .select("*")
        .order("created_at", { ascending: false });
      
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (doc: Document) => {
      const path = doc.file_url.split("/").slice(-2).join("/");
      await supabase.storage.from("arquivos").remove([path]);
      const { error } = await supabase
        .from("general_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general-documents"] });
      toast.success("Documento excluído com sucesso");
      setDeleteDoc(null);
    },
    onError: () => {
      toast.error("Erro ao excluir documento");
    },
  });

  // Extração com IA
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
        toast.success("Conteúdo extraído com sucesso!", {
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
      toast.error("Erro ao extrair conteúdo", {
        description: error.message
      });
    } finally {
      setExtractingId(null);
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      toast.error("Preencha o título e selecione um arquivo");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = uploadFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("arquivos")
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("arquivos")
        .getPublicUrl(filePath);

      const { data: insertedDoc, error: insertError } = await supabase
        .from("general_documents")
        .insert({
          title: uploadTitle.trim(),
          description: uploadDescription.trim() || null,
          file_name: uploadFile.name,
          file_url: publicUrl,
          file_type: uploadFile.type,
          file_size: uploadFile.size,
          category: uploadCategory,
          tags: uploadTags ? uploadTags.split(",").map(t => t.trim()).filter(Boolean) : null,
          uploaded_by: user?.id,
          extraction_status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Documento enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["general-documents"] });
      
      // Auto extrair se habilitado
      if (autoExtract && insertedDoc) {
        setTimeout(() => {
          extractContent(insertedDoc as Document);
        }, 500);
      }
      
      resetUploadForm();
    } catch (error: any) {
      toast.error("Erro ao enviar documento", {
        description: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadDescription("");
    setUploadCategory("geral");
    setUploadTags("");
    setIsUploadOpen(false);
  };

  const copyExtractedContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Conteúdo copiado!");
  };

  const stats = {
    total: documents.length,
    extracted: documents.filter(d => d.extraction_status === 'completed').length,
    byCategory: CATEGORIES.reduce((acc, cat) => {
      acc[cat.value] = documents.filter(d => d.category === cat.value).length;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            Documentos e Anexos
          </h2>
          <p className="text-muted-foreground">
            Upload de qualquer arquivo com extração inteligente via IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Documento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="col-span-1 bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex flex-col items-center">
            <Brain className="h-5 w-5 mb-1 text-primary" />
            <span className="text-lg font-bold">{stats.extracted}</span>
            <span className="text-[10px] text-muted-foreground text-center">Extraídos IA</span>
          </CardContent>
        </Card>
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const count = stats.byCategory[cat.value] || 0;
          return (
            <Card 
              key={cat.value}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                categoryFilter === cat.value ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setCategoryFilter(categoryFilter === cat.value ? "all" : cat.value)}
            >
              <CardContent className="p-3 flex flex-col items-center">
                <Icon className={`h-5 w-5 mb-1 ${categoryFilter === cat.value ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-lg font-bold">{count}</span>
                <span className="text-[10px] text-muted-foreground text-center">{cat.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos ou conteúdo extraído..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {search || categoryFilter !== "all" 
              ? "Tente ajustar os filtros de busca"
              : "Envie seu primeiro documento com extração IA"}
          </p>
          <Button onClick={() => setIsUploadOpen(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Enviar Documento
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {documents.map((doc, index) => {
              const FileIcon = getFileIcon(doc.file_type);
              const category = CATEGORIES.find(c => c.value === doc.category);
              const isExtracting = extractingId === doc.id;
              
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="group hover:border-primary/50 transition-all overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <FileIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate" title={doc.title}>
                            {doc.title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.file_name}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              {category?.label || doc.category}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatFileSize(doc.file_size)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {getExtractionStatusBadge(doc.extraction_status)}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1 mt-3 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => setViewDoc(doc)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        {doc.extraction_status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => extractContent(doc)}
                            disabled={isExtracting}
                          >
                            {isExtracting ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3 mr-1" />
                            )}
                            Extrair
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          asChild
                        >
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteDoc(doc)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Enviar Novo Documento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Arquivo *</Label>
              <div className="mt-1.5">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadFile ? (
                    <div className="flex items-center gap-2">
                      <File className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{uploadFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.preventDefault(); setUploadFile(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                      <p className="text-xs text-muted-foreground text-center">
                        PDF, Word, Excel, PowerPoint, Imagens, TXT
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 50 * 1024 * 1024) {
                          toast.error("Arquivo muito grande (máx. 50MB)");
                          return;
                        }
                        setUploadFile(file);
                        if (!uploadTitle) {
                          setUploadTitle(file.name.split(".").slice(0, -1).join("."));
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Nome do documento"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Descrição opcional..."
                rows={2}
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="contrato, 2024, importante"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoExtract"
                checked={autoExtract}
                onChange={(e) => setAutoExtract(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="autoExtract" className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="h-4 w-4 text-primary" />
                Extrair conteúdo com IA automaticamente
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetUploadForm}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadFile || !uploadTitle.trim()}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {viewDoc?.title}
            </DialogTitle>
          </DialogHeader>
          
          {viewDoc && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="preview">Visualização</TabsTrigger>
                <TabsTrigger value="extracted" className="gap-1">
                  <Brain className="h-4 w-4" />
                  Conteúdo IA
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Nome do Arquivo</Label>
                    <p className="font-medium">{viewDoc.file_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tamanho</Label>
                    <p className="font-medium">{formatFileSize(viewDoc.file_size)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Categoria</Label>
                    <p className="font-medium">{CATEGORIES.find(c => c.value === viewDoc.category)?.label}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data de Upload</Label>
                    <p className="font-medium">{format(new Date(viewDoc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tipo</Label>
                    <p className="font-medium text-xs">{viewDoc.file_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status IA</Label>
                    <div className="mt-1">{getExtractionStatusBadge(viewDoc.extraction_status)}</div>
                  </div>
                </div>
                
                {viewDoc.description && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p>{viewDoc.description}</p>
                  </div>
                )}
                
                {viewDoc.tags && viewDoc.tags.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewDoc.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <ScrollArea className="h-[400px]">
                  {viewDoc.file_type.includes("image") && (
                    <div className="border rounded-lg overflow-hidden">
                      <img src={viewDoc.file_url} alt={viewDoc.title} className="max-h-[380px] mx-auto" />
                    </div>
                  )}
                  
                  {viewDoc.file_type.includes("pdf") && (
                    <div className="border rounded-lg overflow-hidden h-[380px]">
                      <iframe src={viewDoc.file_url} className="w-full h-full" title={viewDoc.title} />
                    </div>
                  )}

                  {!viewDoc.file_type.includes("image") && !viewDoc.file_type.includes("pdf") && (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <File className="h-16 w-16 mb-4" />
                      <p>Visualização não disponível para este tipo de arquivo</p>
                      <Button asChild className="mt-4">
                        <a href={viewDoc.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Arquivo
                        </a>
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="extracted" className="mt-4">
                {viewDoc.extracted_content ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Extraído com {viewDoc.extraction_model}
                        {viewDoc.extraction_date && (
                          <span>em {format(new Date(viewDoc.extraction_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copyExtractedContent(viewDoc.extracted_content!)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <ScrollArea className="h-[350px] border rounded-lg p-4 bg-muted/50">
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {viewDoc.extracted_content}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Brain className="h-16 w-16 mb-4 opacity-50" />
                    <p>Conteúdo ainda não extraído</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => extractContent(viewDoc)}
                      disabled={extractingId === viewDoc.id}
                    >
                      {extractingId === viewDoc.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Extrair com IA
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDoc(null)}>Fechar</Button>
            <Button asChild>
              <a href={viewDoc?.file_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
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
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteDoc && deleteMutation.mutate(deleteDoc)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
