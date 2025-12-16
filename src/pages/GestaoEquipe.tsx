// ============================================
// MOISÉS MEDEIROS v7.0 - GESTÃO DE EQUIPE
// Spider-Man Theme - Férias e Documentos
// Upload de PDFs e Gestão Completa
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Calendar,
  FileText,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Plus,
  Upload,
  Download,
  Trash2,
  Eye,
  FileImage,
  File,
  Loader2,
  Search,
  Filter,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";

interface Employee {
  id: number;
  nome: string;
  funcao: string;
  status: string;
  data_admissao: string | null;
}

interface EmployeeDocument {
  id: string;
  employee_id: number;
  nome: string;
  tipo: string;
  categoria: string;
  url: string;
  path: string;
  tamanho: number;
  mime_type: string;
  observacoes: string | null;
  created_at: string;
}

const DOCUMENT_CATEGORIES = [
  { value: "contrato", label: "Contrato de Trabalho", icon: FileText },
  { value: "atestado", label: "Atestado Médico", icon: FileText },
  { value: "certificado", label: "Certificado", icon: FileText },
  { value: "documento_pessoal", label: "Documento Pessoal", icon: FileText },
  { value: "comprovante", label: "Comprovante", icon: FileText },
  { value: "outro", label: "Outro", icon: File },
];

// Limite máximo de upload: 20MB
const MAX_FILE_SIZE_MB = 20;

export default function GestaoEquipe() {
  const { toast: toastUI } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Documents state
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [selectedDocEmployee, setSelectedDocEmployee] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("contrato");
  const [uploadObservacoes, setUpservacoes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // File upload hook
  const { 
    uploadFile, 
    deleteFile, 
    uploading, 
    progress,
    getSignedUrl 
  } = useFileUpload({
    bucket: 'documentos',
    folder: 'funcionarios',
    maxSize: MAX_FILE_SIZE_MB,
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nome, funcao, status, data_admissao")
        .order("nome");
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = useCallback(async (employeeId?: number) => {
    setIsLoadingDocs(true);
    try {
      // Using any type since table was just created
      let query = (supabase as any)
        .from("employee_documents")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setDocuments((data as EmployeeDocument[]) || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast.error("Erro ao carregar documentos");
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments(selectedDocEmployee || undefined);
  }, [selectedDocEmployee, fetchDocuments]);


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDocEmployee) return;

    const result = await uploadFile(file);
    
    if (result) {
      // Save to database - using any since table is new
      const { error } = await (supabase as any).from("employee_documents").insert({
        employee_id: selectedDocEmployee,
        nome: file.name,
        tipo: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'imagem' : 'documento',
        categoria: uploadCategory,
        url: result.url,
        path: result.path,
        tamanho: result.size,
        mime_type: result.type,
        observacoes: uploadObservacoes || null,
      });

      if (error) {
        toast.error("Erro ao salvar documento no banco");
        console.error(error);
      } else {
        toast.success("Documento enviado com sucesso!");
        await fetchDocuments(selectedDocEmployee);
        setIsUploadModalOpen(false);
        setUpservacoes("");
        setUploadCategory("contrato");
      }
    }
  };

  const handleDeleteDocument = async (doc: EmployeeDocument) => {
    const success = await deleteFile(doc.path);
    if (success) {
      const { error } = await (supabase as any)
        .from("employee_documents")
        .delete()
        .eq("id", doc.id);
      
      if (!error) {
        toast.success("Documento removido!");
        await fetchDocuments(selectedDocEmployee || undefined);
      }
    }
  };

  const handleViewDocument = async (doc: EmployeeDocument) => {
    // Get fresh signed URL
    const signedUrl = await getSignedUrl(doc.path);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast.error("Erro ao acessar documento");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType?.includes('image')) return <FileImage className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const statusCounts = {
    ativo: employees.filter(e => e.status === "ativo").length,
    ferias: employees.filter(e => e.status === "ferias").length,
    afastado: employees.filter(e => e.status === "afastado").length,
    inativo: employees.filter(e => e.status === "inativo").length,
  };

  const filteredDocuments = documents.filter(doc => 
    doc.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="space-y-2">
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Recursos Humanos</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Gestão de Equipe
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Controle de ponto, férias e documentos dos funcionários.
            </p>
          </div>
        </motion.header>

        {/* Status Overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Ativos", value: statusCounts.ativo, icon: CheckCircle2, color: "text-[hsl(var(--stats-green))]", bg: "bg-[hsl(var(--stats-green))]/10" },
            { label: "Férias", value: statusCounts.ferias, icon: Calendar, color: "text-[hsl(var(--stats-blue))]", bg: "bg-[hsl(var(--stats-blue))]/10" },
            { label: "Afastados", value: statusCounts.afastado, icon: AlertCircle, color: "text-[hsl(var(--stats-gold))]", bg: "bg-[hsl(var(--stats-gold))]/10" },
            { label: "Inativos", value: statusCounts.inativo, icon: XCircle, color: "text-muted-foreground", bg: "bg-secondary" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className={`inline-flex p-3 rounded-xl ${item.bg} mb-4`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <p className="text-3xl font-bold text-foreground">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </section>

        <Tabs defaultValue="ferias" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
            <TabsTrigger value="ferias" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Férias/Afastamentos</span>
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
          </TabsList>

          {/* Vacation/Leave */}
          <TabsContent value="ferias">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Histórico de Férias e Afastamentos
                </h3>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agendar
                </Button>
              </div>

              <div className="space-y-4">
                {employees.filter(e => e.status === "ferias" || e.status === "afastado").length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum funcionário em férias ou afastamento.</p>
                  </div>
                ) : (
                  employees.filter(e => e.status === "ferias" || e.status === "afastado").map((emp) => (
                    <div key={emp.id} className="p-4 rounded-xl bg-secondary/30 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{emp.nome}</p>
                        <p className="text-sm text-muted-foreground">{emp.funcao}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        emp.status === "ferias" 
                          ? "bg-[hsl(var(--stats-blue))]/20 text-[hsl(var(--stats-blue))]"
                          : "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]"
                      }`}>
                        {emp.status === "ferias" ? "Férias" : "Afastado"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Documents - FULLY FUNCTIONAL */}
          <TabsContent value="documentos">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header & Filters */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Documentos por Funcionário
                  </h3>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar documentos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                    <Select 
                      value={selectedDocEmployee?.toString() || "all"} 
                      onValueChange={(v) => setSelectedDocEmployee(v === "all" ? null : parseInt(v))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Todos funcionários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos funcionários</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Employee Cards for Document Management */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {employees.slice(0, 6).map((emp, index) => {
                    const empDocs = documents.filter(d => d.employee_id === emp.id);
                    return (
                      <motion.div
                        key={emp.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * index }}
                        className={`p-4 rounded-xl transition-all cursor-pointer ${
                          selectedDocEmployee === emp.id 
                            ? 'bg-primary/20 border-2 border-primary' 
                            : 'bg-secondary/30 hover:bg-secondary/50 border-2 border-transparent'
                        }`}
                        onClick={() => setSelectedDocEmployee(emp.id)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {emp.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{emp.nome}</p>
                            <p className="text-xs text-muted-foreground">{emp.funcao}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>{empDocs.length} documento{empDocs.length !== 1 ? 's' : ''}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocEmployee(emp.id);
                              setIsUploadModalOpen(true);
                            }}
                          >
                            <Upload className="h-3 w-3" />
                            Upload
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Upload Info */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Upload className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Upload de Documentos</p>
                      <p className="text-xs text-muted-foreground">
                        Formatos aceitos: PDF, JPG, PNG, WEBP, DOC, DOCX • Máximo: {MAX_FILE_SIZE_MB}MB por arquivo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              {selectedDocEmployee && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        Documentos de {employees.find(e => e.id === selectedDocEmployee)?.nome}
                      </h3>
                      <Badge variant="secondary">{filteredDocuments.length}</Badge>
                    </div>
                    <Button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Novo Documento
                    </Button>
                  </div>

                  {isLoadingDocs ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum documento encontrado.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4 gap-2"
                        onClick={() => setIsUploadModalOpen(true)}
                      >
                        <Upload className="h-4 w-4" />
                        Fazer primeiro upload
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {filteredDocuments.map((doc, index) => (
                          <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                          >
                            <div className="p-2 rounded-lg bg-muted">
                              {getFileIcon(doc.mime_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{doc.nome}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {DOCUMENT_CATEGORIES.find(c => c.value === doc.categoria)?.label || doc.categoria}
                                </Badge>
                                <span>{formatFileSize(doc.tamanho)}</span>
                                <span>{format(new Date(doc.created_at), "dd/MM/yyyy HH:mm")}</span>
                              </div>
                              {doc.observacoes && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {doc.observacoes}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDocument(doc)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDocument(doc)}
                                className="text-destructive hover:text-destructive"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Upload Modal */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload de Documento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Funcionário</Label>
                <Select 
                  value={selectedDocEmployee?.toString()} 
                  onValueChange={(v) => setSelectedDocEmployee(parseInt(v))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Categoria</Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Observações (opcional)</Label>
                <Input
                  value={uploadObservacoes}
                  onChange={(e) => setUpservacoes(e.target.value)}
                  placeholder="Ex: Contrato de experiência 90 dias"
                  className="mt-1.5"
                />
              </div>

              <div className="space-y-3">
                <Label>Arquivo</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading || !selectedDocEmployee}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    uploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}>
                    {uploading ? (
                      <div className="space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">Enviando...</p>
                        <Progress value={progress} className="w-32 mx-auto" />
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Clique para selecionar</p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, PNG, DOC (máx. {MAX_FILE_SIZE_MB}MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
