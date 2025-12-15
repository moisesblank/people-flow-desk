// ============================================
// MOISÉS MEDEIROS v7.0 - ARQUIVOS
// Spider-Man Theme - Gestão de Documentos
// Conectado ao Supabase Storage
// ============================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, 
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
  Folder,
  Loader2,
  Eye,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ArquivoDb {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number | null;
  url: string;
  modulo: string;
  created_at: string;
}

const folderCategories = [
  { id: "aulas", name: "Materiais de Aula", color: "bg-blue-500", icon: "📚" },
  { id: "lancamentos", name: "Lançamentos", color: "bg-orange-500", icon: "🚀" },
  { id: "contratos", name: "Contratos", color: "bg-emerald-500", icon: "📝" },
  { id: "marketing", name: "Marketing", color: "bg-purple-500", icon: "📣" },
  { id: "videos", name: "Vídeos Gravados", color: "bg-red-500", icon: "🎬" },
  { id: "fiscal", name: "Documentos Fiscais", color: "bg-amber-500", icon: "🧾" },
];

export default function Arquivos() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [arquivos, setArquivos] = useState<ArquivoDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    fetchArquivos();
  }, []);

  const fetchArquivos = async () => {
    try {
      const { data, error } = await supabase
        .from('arquivos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArquivos(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${file.name}`;

    try {
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('arquivos')
        .insert({
          nome: file.name,
          tipo: file.type || 'application/octet-stream',
          tamanho: file.size,
          url: urlData.publicUrl,
          modulo: selectedFolder || 'geral'
        });

      if (dbError) throw dbError;

      toast.success('Arquivo enviado com sucesso!');
      fetchArquivos();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar arquivo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    try {
      // Extract filename from URL
      const fileName = url.split('/').pop();
      
      if (fileName) {
        await supabase.storage.from('documentos').remove([fileName]);
      }

      const { error } = await supabase
        .from('arquivos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Arquivo excluído!');
      fetchArquivos();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.includes('pdf')) return FileText;
    if (tipo.includes('image')) return Image;
    if (tipo.includes('video')) return Video;
    if (tipo.includes('spreadsheet') || tipo.includes('excel')) return FileSpreadsheet;
    return FileText;
  };

  const getFileTypeColor = (tipo: string) => {
    if (tipo.includes('pdf')) return "text-red-500";
    if (tipo.includes('image')) return "text-blue-500";
    if (tipo.includes('video')) return "text-purple-500";
    if (tipo.includes('spreadsheet') || tipo.includes('excel')) return "text-emerald-500";
    return "text-muted-foreground";
  };

  const filteredArquivos = arquivos.filter(arquivo => {
    const matchesSearch = arquivo.nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || arquivo.modulo === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const folderStats = folderCategories.map(folder => ({
    ...folder,
    files: arquivos.filter(a => a.modulo === folder.id).length,
    size: formatFileSize(arquivos.filter(a => a.modulo === folder.id).reduce((acc, a) => acc + (a.tamanho || 0), 0))
  }));

  const totalSize = arquivos.reduce((acc, a) => acc + (a.tamanho || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <FolderOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Arquivos Importantes</h1>
            <p className="text-muted-foreground">Gerencie todos os seus documentos • {arquivos.length} arquivos</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar arquivos..." 
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setViewMode("grid")}>
            <Grid className={`h-4 w-4 ${viewMode === "grid" ? "text-primary" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode("list")}>
            <List className={`h-4 w-4 ${viewMode === "list" ? "text-primary" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={fetchArquivos}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <label>
            <Button className="brand-gradient cursor-pointer" disabled={uploading} asChild>
              <span>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload
              </span>
            </Button>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </motion.div>

      {/* Storage Info */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Armazenamento</h3>
              <p className="text-sm text-muted-foreground">{formatFileSize(totalSize)} usados</p>
            </div>
            <Badge variant="secondary">{arquivos.length} arquivos</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary to-primary/70 h-3 rounded-full transition-all"
              style={{ width: `${Math.min((totalSize / (50 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Folders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pastas</h2>
          {selectedFolder && (
            <Button variant="outline" size="sm" onClick={() => setSelectedFolder(null)}>
              Ver Todos
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folderStats.map((folder, index) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={`border-border/50 hover:border-primary/30 transition-all hover:shadow-lg cursor-pointer group ${selectedFolder === folder.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${folder.color}`}>
                        <span className="text-2xl">{folder.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{folder.name}</p>
                        <p className="text-sm text-muted-foreground">{folder.files} arquivos • {folder.size}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedFolder 
              ? `Arquivos em ${folderCategories.find(f => f.id === selectedFolder)?.name}` 
              : 'Todos os Arquivos'
            }
          </CardTitle>
          <CardDescription>
            {loading ? 'Carregando...' : `${filteredArquivos.length} arquivo(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredArquivos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum arquivo encontrado</p>
              <p className="text-sm mt-1">Faça upload de arquivos para começar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArquivos.map((arquivo, index) => {
                const FileIcon = getFileIcon(arquivo.tipo);
                return (
                  <motion.div
                    key={arquivo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${getFileTypeColor(arquivo.tipo)}`}>
                        <FileIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{arquivo.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(arquivo.tamanho)} • {format(new Date(arquivo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={arquivo.url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={arquivo.url} download={arquivo.nome}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(arquivo.id, arquivo.url)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
