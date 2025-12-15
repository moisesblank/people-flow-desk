import { useState } from "react";
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
  Folder
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const folders = [
  { id: 1, name: "Materiais de Aula", files: 45, size: "2.3 GB", color: "bg-blue-500" },
  { id: 2, name: "Lançamentos", files: 23, size: "1.1 GB", color: "bg-orange-500" },
  { id: 3, name: "Contratos", files: 12, size: "156 MB", color: "bg-emerald-500" },
  { id: 4, name: "Marketing", files: 89, size: "4.5 GB", color: "bg-purple-500" },
  { id: 5, name: "Vídeos Gravados", files: 156, size: "25 GB", color: "bg-red-500" },
  { id: 6, name: "Documentos Fiscais", files: 34, size: "89 MB", color: "bg-amber-500" },
];

const recentFiles = [
  { id: 1, name: "Plano_ENEM_2025.pdf", type: "pdf", size: "2.4 MB", modified: "Há 2 horas", icon: FileText },
  { id: 2, name: "Thumbnail_Curso.png", type: "image", size: "1.2 MB", modified: "Há 5 horas", icon: Image },
  { id: 3, name: "Aula_01_Atomistica.mp4", type: "video", size: "856 MB", modified: "Ontem", icon: Video },
  { id: 4, name: "Planilha_Vendas.xlsx", type: "spreadsheet", size: "456 KB", modified: "Há 2 dias", icon: FileSpreadsheet },
  { id: 5, name: "Contrato_Parceria.pdf", type: "pdf", size: "1.8 MB", modified: "Há 3 dias", icon: FileText },
  { id: 6, name: "Banner_Instagram.png", type: "image", size: "3.2 MB", modified: "Há 4 dias", icon: Image },
];

export default function Arquivos() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "pdf": return "text-red-500";
      case "image": return "text-blue-500";
      case "video": return "text-purple-500";
      case "spreadsheet": return "text-emerald-500";
      default: return "text-muted-foreground";
    }
  };

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
            <p className="text-muted-foreground">Gerencie todos os seus documentos</p>
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
          <Button className="brand-gradient">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </motion.div>

      {/* Storage Info */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Armazenamento</h3>
              <p className="text-sm text-muted-foreground">33.1 GB de 50 GB usados</p>
            </div>
            <Badge variant="secondary">66% usado</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary to-primary/70 h-3 rounded-full transition-all"
              style={{ width: "66%" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Folders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pastas</h2>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Pasta
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder, index) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/50 hover:border-primary/30 transition-all hover:shadow-lg cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${folder.color}`}>
                        <Folder className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{folder.name}</p>
                        <p className="text-sm text-muted-foreground">{folder.files} arquivos • {folder.size}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <CardTitle>Arquivos Recentes</CardTitle>
          <CardDescription>Últimos arquivos acessados ou modificados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${getFileTypeColor(file.type)}`}>
                    <file.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{file.size} • {file.modified}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
