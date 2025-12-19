// ============================================
// ARQUIVOS EMPRESARIAIS - GESTÃO DE DOCUMENTOS
// Upload, Download e Gestão de Arquivos da Empresa
// ============================================

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Upload, FileText, Download, Eye, Trash2, Search, 
  FolderOpen, File, FileSpreadsheet, Image, 
  FileArchive, Calendar, Filter, Plus, X, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ArquivoEmpresa {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number | null;
  url: string;
  modulo: string;
  referencia_id?: string;
  cnpj?: string;
  created_at: string;
}

const CATEGORIAS = [
  { id: "documentos-legais", label: "Documentos Legais", icon: FileText, color: "text-blue-500" },
  { id: "contratos", label: "Contratos", icon: File, color: "text-purple-500" },
  { id: "certidoes", label: "Certidões", icon: FileArchive, color: "text-green-500" },
  { id: "notas-fiscais", label: "Notas Fiscais", icon: FileSpreadsheet, color: "text-orange-500" },
  { id: "relatorios", label: "Relatórios", icon: FileText, color: "text-cyan-500" },
  { id: "manuais", label: "Manuais", icon: FolderOpen, color: "text-pink-500" },
];

function FileUploadZone({ 
  categoria, 
  onUploadComplete 
}: { 
  categoria: string; 
  onUploadComplete: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede o tamanho máximo de 10MB`);
        continue;
      }

      try {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}-${randomSuffix}-${file.name}`;
        const filePath = `${categoria}/${fileName}`;

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documentos-empresa")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from("documentos-empresa")
          .getPublicUrl(filePath);

        // Salvar metadados
        const { error: dbError } = await supabase
          .from("arquivos")
          .insert({
            nome: file.name,
            tipo: file.type,
            modulo: categoria,
            tamanho: file.size,
            url: urlData.publicUrl
          });

        if (dbError) throw dbError;

        toast.success(`${file.name} enviado com sucesso!`);
        setProgress(((i + 1) / files.length) * 100);
      } catch (error: any) {
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
      }
    }

    setUploading(false);
    setProgress(0);
    onUploadComplete();
  }, [categoria, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {dragActive ? (
            <p className="text-primary font-medium">Solte os arquivos aqui...</p>
          ) : (
            <div>
              <p className="font-medium mb-2">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, Excel, Word, Imagens (máx. 10MB)
              </p>
            </div>
          )}
        </label>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Enviando...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
    </div>
  );
}

export default function ArquivosEmpresariais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("documentos-legais");
  const queryClient = useQueryClient();

  const { data: arquivos, isLoading } = useQuery({
    queryKey: ["arquivos-empresa", categoriaAtiva],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arquivos")
        .select("*")
        .eq("modulo", categoriaAtiva)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ArquivoEmpresa[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("arquivos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos-empresa"] });
      toast.success("Arquivo removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  const arquivosFiltrados = arquivos?.filter(a =>
    a.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType?.includes("sheet") || mimeType?.includes("excel")) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (mimeType?.includes("image")) return <Image className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary" />
            Arquivos Empresariais
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão de documentos e arquivos da empresa
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((cat) => (
          <Button
            key={cat.id}
            variant={categoriaAtiva === cat.id ? "default" : "outline"}
            onClick={() => setCategoriaAtiva(cat.id)}
            className="gap-2"
          >
            <cat.icon className={`w-4 h-4 ${cat.color}`} />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload de Arquivos
            </CardTitle>
            <CardDescription>
              Envie novos documentos para {CATEGORIAS.find(c => c.id === categoriaAtiva)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadZone
              categoria={categoriaAtiva}
              onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ["arquivos-empresa"] })}
            />
          </CardContent>
        </Card>

        {/* Lista de Arquivos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Arquivos ({arquivosFiltrados?.length || 0})
              </span>
            </CardTitle>
            <CardDescription>
              {CATEGORIAS.find(c => c.id === categoriaAtiva)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : arquivosFiltrados && arquivosFiltrados.length > 0 ? (
              <div className="space-y-2">
                <AnimatePresence>
                  {arquivosFiltrados.map((arquivo) => (
                    <motion.div
                      key={arquivo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(arquivo.tipo)}
                        <div>
                          <p className="font-medium text-sm">{arquivo.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(arquivo.created_at).toLocaleDateString("pt-BR")} • {formatFileSize(arquivo.tamanho || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(arquivo.url, "_blank")}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = arquivo.url;
                            a.download = arquivo.nome;
                            a.click();
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(arquivo.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum arquivo encontrado</p>
                <p className="text-sm">Faça upload de arquivos usando o painel ao lado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
