// ============================================
// ARQUIVOS EMPRESARIAIS - GESTÃO DE DOCUMENTOS
// Upload, Download e Gestão de Arquivos por CNPJ
// ============================================

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileArchive, ArrowLeft, Building2, HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// CNPJs das empresas
const CNPJS = [
  { 
    id: "44979308000104", 
    label: "CNPJ 44.979.308/0001-04", 
    nome: "CURSO QUÍMICA MOISES MEDEIROS",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  { 
    id: "53829761000117", 
    label: "CNPJ 53.829.761/0001-17", 
    nome: "MM CURSO DE QUÍMICA LTDA",
    color: "bg-primary/10 text-primary border-primary/20"
  },
];

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
  cnpj,
  onUploadComplete 
}: { 
  categoria: string; 
  cnpj: string;
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
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede o tamanho máximo de 10MB`);
        continue;
      }

      try {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}-${randomSuffix}-${file.name}`;
        const filePath = `${cnpj}/${categoria}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("arquivos")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("arquivos")
          .getPublicUrl(filePath);

        // Salvar com CNPJ associado
        const { error: dbError } = await supabase
          .from("arquivos")
          .insert({
            nome: file.name,
            tipo: file.type,
            modulo: `empresa-${cnpj}-${categoria}`,
            tamanho: file.size,
            url: urlData.publicUrl,
            referencia_id: cnpj
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
  }, [categoria, cnpj, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
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
              <p className="font-medium mb-2">Arraste arquivos ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground">PDF, Excel, Word, Imagens (máx. 10MB)</p>
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
  const [cnpjSelecionado, setCnpjSelecionado] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState("documentos-legais");
  const queryClient = useQueryClient();

  // Buscar arquivos do CNPJ selecionado
  const { data: arquivos, isLoading } = useQuery({
    queryKey: ["arquivos-empresa", cnpjSelecionado, categoriaAtiva],
    queryFn: async () => {
      if (!cnpjSelecionado) return [];
      
      const { data, error } = await supabase
        .from("arquivos")
        .select("*")
        .eq("modulo", `empresa-${cnpjSelecionado}-${categoriaAtiva}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ArquivoEmpresa[];
    },
    enabled: !!cnpjSelecionado,
  });

  // Buscar estatísticas de arquivos por CNPJ
  const { data: statsArquivos } = useQuery({
    queryKey: ["arquivos-stats"],
    queryFn: async () => {
      const stats: Record<string, { count: number; size: number }> = {};
      
      for (const cnpj of CNPJS) {
        const { data, error } = await supabase
          .from("arquivos")
          .select("tamanho")
          .like("modulo", `empresa-${cnpj.id}-%`);
        
        if (!error && data) {
          stats[cnpj.id] = {
            count: data.length,
            size: data.reduce((acc, f) => acc + (f.tamanho || 0), 0)
          };
        } else {
          stats[cnpj.id] = { count: 0, size: 0 };
        }
      }
      
      return stats;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("arquivos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos-empresa"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-stats"] });
      toast.success("Arquivo removido com sucesso!");
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

  // Tela de seleção de CNPJ
  if (!cnpjSelecionado) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary" />
            Arquivos Empresariais
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecione uma empresa para gerenciar seus documentos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {CNPJS.map((cnpj) => {
            const stats = statsArquivos?.[cnpj.id] || { count: 0, size: 0 };
            
            return (
              <motion.div
                key={cnpj.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-all border-2 ${cnpj.color}`}
                  onClick={() => setCnpjSelecionado(cnpj.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-xl ${cnpj.color.replace('text-', 'bg-').replace('/10', '/20')}`}>
                        <Building2 className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{cnpj.nome}</CardTitle>
                        <CardDescription className="font-mono">{cnpj.label}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {stats.count} arquivos
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(stats.size)}
                        </span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Acessar Arquivos
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Resumo Total */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Resumo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {CNPJS.reduce((acc, cnpj) => acc + (statsArquivos?.[cnpj.id]?.count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Arquivos Total</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {formatFileSize(CNPJS.reduce((acc, cnpj) => acc + (statsArquivos?.[cnpj.id]?.size || 0), 0))}
                </p>
                <p className="text-sm text-muted-foreground">Espaço Usado</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">2</p>
                <p className="text-sm text-muted-foreground">CNPJs Ativos</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-500">100%</p>
                <p className="text-sm text-muted-foreground">Sincronizado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de arquivos do CNPJ selecionado
  const cnpjAtual = CNPJS.find(c => c.id === cnpjSelecionado);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setCnpjSelecionado(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              {cnpjAtual?.nome}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">{cnpjAtual?.label}</p>
          </div>
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
              {CATEGORIAS.find(c => c.id === categoriaAtiva)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadZone
              categoria={categoriaAtiva}
              cnpj={cnpjSelecionado}
              onUploadComplete={() => {
                queryClient.invalidateQueries({ queryKey: ["arquivos-empresa"] });
                queryClient.invalidateQueries({ queryKey: ["arquivos-stats"] });
              }}
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
              <Badge variant="outline">{cnpjAtual?.label}</Badge>
            </CardTitle>
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
                        <Button variant="ghost" size="icon" onClick={() => window.open(arquivo.url, "_blank")}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          const a = document.createElement("a");
                          a.href = arquivo.url;
                          a.download = arquivo.nome;
                          a.click();
                        }}>
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
