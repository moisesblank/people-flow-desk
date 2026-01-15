// ============================================
// 📖 BOOK DE QR CODES — LISTA DE PDFs
// Owner vê gestão completa, alunos veem apenas via link
// ============================================

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  Eye, 
  FileText, 
  Upload, 
  Loader2, 
  QrCode,
  Copy,
  ExternalLink,
  Trash2,
  Book,
  Link as LinkIcon,
  Shield,
  Lock,
  BarChart3
} from "lucide-react";

interface QrCodePdf {
  id: string;
  book_id: string;
  title: string;
  slug: string;
  description: string | null;
  pdf_url: string;
  thumbnail_url: string | null;
  position: number;
  is_active: boolean;
  access_count: number;
  created_at: string;
}

interface QrCodeBook {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function AlunoQrCodesBook() {
  const { bookSlug } = useParams<{ bookSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOwner } = useRolePermissions();
  const [isAddPdfOpen, setIsAddPdfOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state para novo PDF
  const [newPdf, setNewPdf] = useState({
    title: "",
    description: "",
    file: null as File | null,
  });

  // Buscar dados do book
  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ["qrcode-book", bookSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qrcode_books")
        .select("*")
        .eq("slug", bookSlug)
        .single();

      if (error) throw error;
      return data as QrCodeBook;
    },
    enabled: !!bookSlug,
  });

  // Buscar PDFs do book
  const { data: pdfs, isLoading: pdfsLoading } = useQuery({
    queryKey: ["qrcode-pdfs", book?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qrcode_pdfs")
        .select("*")
        .eq("book_id", book!.id)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as QrCodePdf[];
    },
    enabled: !!book?.id,
  });

  // Mutation para upload de PDF
  const uploadPdfMutation = useMutation({
    mutationFn: async ({ title, description, file }: { 
      title: string; 
      description: string; 
      file: File 
    }) => {
      if (!book) throw new Error("Book não encontrado");
      setUploading(true);

      // 1. Upload do arquivo para storage
      const fileExt = file.name.split(".").pop();
      const fileName = `qrcodes/${book.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("materiais")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: urlData } = supabase.storage
        .from("materiais")
        .getPublicUrl(fileName);

      // 3. Criar registro no banco
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { data, error } = await supabase
        .from("qrcode_pdfs")
        .insert({
          book_id: book.id,
          title,
          slug,
          description,
          pdf_url: urlData.publicUrl,
          position: (pdfs?.length || 0) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("PDF adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["qrcode-pdfs", book?.id] });
      queryClient.invalidateQueries({ queryKey: ["qrcode-books"] });
      setIsAddPdfOpen(false);
      setNewPdf({ title: "", description: "", file: null });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar PDF: ${error.message}`);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  // Mutation para deletar PDF
  const deletePdfMutation = useMutation({
    mutationFn: async (pdfId: string) => {
      const { error } = await supabase
        .from("qrcode_pdfs")
        .delete()
        .eq("id", pdfId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PDF removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["qrcode-pdfs", book?.id] });
      queryClient.invalidateQueries({ queryKey: ["qrcode-books"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover PDF: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPdf(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = () => {
    if (!newPdf.file || !newPdf.title) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    uploadPdfMutation.mutate({
      title: newPdf.title,
      description: newPdf.description,
      file: newPdf.file,
    });
  };

  const copyLink = (pdf: QrCodePdf) => {
    const link = `${window.location.origin}/alunos/qrcodes/${bookSlug}/${pdf.slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const isLoading = bookLoading || pdfsLoading;

  // Se não é Owner, mostrar mensagem de acesso negado
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
          <CardHeader className="text-center">
            <Lock className="h-16 w-16 mx-auto text-destructive mb-4" />
            <CardTitle className="text-destructive">Acesso Restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva para administração.
              Se você recebeu um link de PDF, acesse-o diretamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/alunos/dashboard")}
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 gap-1.5"
          onClick={() => navigate("/alunos/qrcodes")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos Books
        </Button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Book className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {book?.name || "Carregando..."}
              </h1>
              <p className="text-muted-foreground">
                {book?.description || "Gerencie os PDFs deste book"}
              </p>
            </div>
          </div>

          <Button onClick={() => setIsAddPdfOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar PDF
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Owner Only
          </Badge>
          <Badge variant="secondary">
            {pdfs?.length || 0} PDFs
          </Badge>
        </div>
      </div>

      {/* Grid de PDFs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pdfs?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum PDF ainda</h3>
            <p className="text-muted-foreground text-center mb-4">
              Adicione PDFs a este book para gerar links individuais
            </p>
            <Button onClick={() => setIsAddPdfOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar primeiro PDF
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfs?.map((pdf) => (
            <Card 
              key={pdf.id} 
              className="group hover:border-primary/50 transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      {pdf.access_count}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg mt-3 line-clamp-2">
                  {pdf.title}
                </CardTitle>
                {pdf.description && (
                  <CardDescription className="line-clamp-2">
                    {pdf.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Botões de ação */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => copyLink(pdf)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar Link
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate(`/alunos/qrcodes/${bookSlug}/${pdf.slug}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </Button>
                </div>

                {/* Link preview */}
                <div className="p-2 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                    <LinkIcon className="h-3 w-3 flex-shrink-0" />
                    /alunos/qrcodes/{bookSlug}/{pdf.slug}
                  </p>
                </div>

                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover PDF
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover PDF?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O PDF "{pdf.title}" será removido permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => deletePdfMutation.mutate(pdf.id)}
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para adicionar PDF */}
      <Dialog open={isAddPdfOpen} onOpenChange={setIsAddPdfOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Adicionar PDF ao {book?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-title">Título do PDF *</Label>
              <Input
                id="pdf-title"
                placeholder="Ex: Capítulo 1 - Introdução"
                value={newPdf.title}
                onChange={(e) => setNewPdf(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf-description">Descrição (opcional)</Label>
              <Textarea
                id="pdf-description"
                placeholder="Breve descrição do conteúdo..."
                value={newPdf.description}
                onChange={(e) => setNewPdf(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf-file">Arquivo PDF *</Label>
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {newPdf.file && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {newPdf.file.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPdfOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={uploading || !newPdf.title || !newPdf.file}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
