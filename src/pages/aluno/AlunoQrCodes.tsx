// ============================================
// 📱 ÁREA SECRETA DE QR CODES — OWNER ONLY
// Visível apenas para Owner no menu
// Alunos acessam apenas via link direto
// ============================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatError } from "@/lib/utils/formatError";
import { 
  Book, 
  Plus, 
  Eye, 
  FileText, 
  Upload, 
  Loader2, 
  QrCode,
  FolderOpen,
  ArrowRight,
  Shield,
  Lock
} from "lucide-react";

interface QrCodeBook {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  pdf_count?: number;
}

export default function AlunoQrCodes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOwner } = useRolePermissions();
  const [isAddPdfOpen, setIsAddPdfOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<QrCodeBook | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state para novo PDF
  const [newPdf, setNewPdf] = useState({
    title: "",
    description: "",
    file: null as File | null,
  });

  // Buscar todos os books com contagem de PDFs
  const { data: books, isLoading } = useQuery({
    queryKey: ["qrcode-books"],
    queryFn: async () => {
      const { data: booksData, error: booksError } = await supabase
        .from("qrcode_books")
        .select("*")
        .order("position", { ascending: true });

      if (booksError) throw booksError;

      // Buscar contagem de PDFs por book
      const { data: pdfCounts, error: countsError } = await supabase
        .from("qrcode_pdfs")
        .select("book_id");

      if (countsError) throw countsError;

      // Mapear contagem
      const countMap = (pdfCounts || []).reduce((acc, pdf) => {
        acc[pdf.book_id] = (acc[pdf.book_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (booksData || []).map(book => ({
        ...book,
        pdf_count: countMap[book.id] || 0,
      })) as QrCodeBook[];
    },
  });

  // Mutation para upload de PDF
  const uploadPdfMutation = useMutation({
    mutationFn: async ({ bookId, title, description, file }: { 
      bookId: string; 
      title: string; 
      description: string; 
      file: File 
    }) => {
      setUploading(true);

      // 1. Upload do arquivo para storage
      const fileExt = file.name.split(".").pop();
      const fileName = `qrcodes/${bookId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("materiais")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Salvar apenas o path (bucket agora é privado, URL será assinada na leitura)
      // Não usamos mais getPublicUrl pois o bucket materiais é privado

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
          book_id: bookId,
          title,
          slug,
          description,
          pdf_url: fileName, // Salvar path, não URL pública (bucket privado)
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("PDF adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["qrcode-books"] });
      setIsAddPdfOpen(false);
      setNewPdf({ title: "", description: "", file: null });
      setSelectedBook(null);
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao adicionar PDF: ${formatError(error)}`);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPdf(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = () => {
    if (!selectedBook || !newPdf.file || !newPdf.title) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    uploadPdfMutation.mutate({
      bookId: selectedBook.id,
      title: newPdf.title,
      description: newPdf.description,
      file: newPdf.file,
    });
  };

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
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-primary/10">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Área de QR Codes</h1>
            <p className="text-muted-foreground">
              Gerencie PDFs organizados por Books. Alunos acessam apenas via link direto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Owner Only
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Links individuais por PDF
          </Badge>
        </div>
      </div>

      {/* Grid de Books */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books?.map((book) => (
            <Card 
              key={book.id} 
              className="group hover:border-primary/50 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/alunos/qrcodes/${book.slug}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Book className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary">
                    {book.pdf_count} {book.pdf_count === 1 ? "PDF" : "PDFs"}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                  {book.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {book.description || "Clique para gerenciar os PDFs deste book"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="gap-1.5 text-muted-foreground group-hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBook(book);
                      setIsAddPdfOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar PDF
                  </Button>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
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
              Adicionar PDF ao {selectedBook?.name}
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
