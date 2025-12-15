// ============================================
// MOISÉS MEDEIROS v7.0 - GERENCIADOR DE DOCUMENTOS
// Sistema completo de upload e visualização
// ============================================

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileImage,
  File,
  Upload,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  FolderOpen,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Tag,
  HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFileUpload } from "@/hooks/useFileUpload";

// Tipos de documentos suportados
const DOCUMENT_TYPES = {
  pdf: { icon: FileText, color: "text-red-500", bg: "bg-red-500/10" },
  image: { icon: FileImage, color: "text-blue-500", bg: "bg-blue-500/10" },
  doc: { icon: FileText, color: "text-blue-600", bg: "bg-blue-600/10" },
  other: { icon: File, color: "text-muted-foreground", bg: "bg-muted" }
};

// Categorias de documentos
const CATEGORIES = [
  { value: "contrato", label: "Contrato de Trabalho", icon: "📄" },
  { value: "atestado", label: "Atestado Médico", icon: "🏥" },
  { value: "certificado", label: "Certificado/Diploma", icon: "🎓" },
  { value: "documento_pessoal", label: "Documento Pessoal", icon: "🪪" },
  { value: "comprovante", label: "Comprovante", icon: "🧾" },
  { value: "relatorio", label: "Relatório", icon: "📊" },
  { value: "nota_fiscal", label: "Nota Fiscal", icon: "📑" },
  { value: "recibo", label: "Recibo", icon: "🧾" },
  { value: "outro", label: "Outro", icon: "📁" },
];

interface Document {
  id: string;
  nome: string;
  tipo: string;
  categoria: string;
  url: string;
  path: string;
  tamanho: number;
  mime_type: string;
  observacoes?: string;
  created_at: string;
  employee_id?: number;
  employee_name?: string;
}

interface DocumentManagerProps {
  documents: Document[];
  isLoading: boolean;
  onUpload: (file: File, category: string, notes: string) => Promise<void>;
  onDelete: (doc: Document) => Promise<void>;
  onView: (doc: Document) => Promise<void>;
  onRefresh: () => void;
  uploading?: boolean;
  uploadProgress?: number;
  showEmployeeInfo?: boolean;
  emptyMessage?: string;
}

export function DocumentManager({
  documents,
  isLoading,
  onUpload,
  onDelete,
  onView,
  onRefresh,
  uploading = false,
  uploadProgress = 0,
  showEmployeeInfo = false,
  emptyMessage = "Nenhum documento encontrado"
}: DocumentManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("contrato");
  const [uploadNotes, setUploadNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Filtrar documentos
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.observacoes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || doc.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Estatísticas
  const stats = {
    total: documents.length,
    totalSize: documents.reduce((acc, d) => acc + (d.tamanho || 0), 0),
    byCategory: CATEGORIES.map(cat => ({
      ...cat,
      count: documents.filter(d => d.categoria === cat.value).length
    })).filter(c => c.count > 0)
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocType = (mimeType: string) => {
    if (mimeType?.includes("pdf")) return DOCUMENT_TYPES.pdf;
    if (mimeType?.includes("image")) return DOCUMENT_TYPES.image;
    if (mimeType?.includes("word") || mimeType?.includes("document")) return DOCUMENT_TYPES.doc;
    return DOCUMENT_TYPES.other;
  };

  const getCategoryInfo = (categoryValue: string) => {
    return CATEGORIES.find(c => c.value === categoryValue) || CATEGORIES[CATEGORIES.length - 1];
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setIsUploadModalOpen(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setIsUploadModalOpen(true);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    
    await onUpload(selectedFile, uploadCategory, uploadNotes);
    
    setSelectedFile(null);
    setUploadCategory("contrato");
    setUploadNotes("");
    setIsUploadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-secondary/30">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">{stats.total} documentos</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{formatFileSize(stats.totalSize)}</span>
        </div>
        <div className="flex-1" />
        {stats.byCategory.slice(0, 4).map(cat => (
          <Badge key={cat.value} variant="secondary" className="gap-1">
            <span>{cat.icon}</span>
            <span>{cat.count}</span>
          </Badge>
        ))}
      </div>

      {/* Search e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Área de Upload Drag & Drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${dragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-secondary/30"
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
        />
        <div className="space-y-3">
          <motion.div
            animate={{ y: dragActive ? -5 : 0 }}
            className="inline-flex p-4 rounded-full bg-primary/10"
          >
            <Upload className={`h-8 w-8 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
          </motion.div>
          <div>
            <p className="font-medium text-foreground">
              {dragActive ? "Solte o arquivo aqui" : "Arraste um arquivo ou clique para selecionar"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, Imagens, Word • Máximo 20MB
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Documentos */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl shimmer" />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            <AnimatePresence>
              {filteredDocs.map((doc, index) => {
                const docType = getDocType(doc.mime_type);
                const catInfo = getCategoryInfo(doc.categoria);
                const DocIcon = docType.icon;

                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-card-hover border border-border/50 transition-all"
                  >
                    {/* Ícone */}
                    <div className={`p-3 rounded-xl ${docType.bg}`}>
                      <DocIcon className={`h-6 w-6 ${docType.color}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{doc.nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs gap-1">
                          {catInfo.icon} {catInfo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.tamanho)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      {doc.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {doc.observacoes}
                        </p>
                      )}
                    </div>

                    {/* Employee info if shown */}
                    {showEmployeeInfo && doc.employee_name && (
                      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary/50">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{doc.employee_name}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onView(doc)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(doc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* Modal de Upload */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload de Documento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Arquivo selecionado */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Adicione uma descrição ou observação..."
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Enviando...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsUploadModalOpen(false)}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUploadSubmit}
                disabled={!selectedFile || uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
