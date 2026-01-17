// ============================================
// 📄 VISUALIZADOR DE PDF — ACESSO VIA LINK
// Qualquer aluno logado pode acessar via link direto
// Protegido com ProtectedPDFViewerV2 + watermark forense
// ============================================

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, FileText, Lock, AlertTriangle } from "lucide-react";
import { ProtectedPDFViewerV2 } from "@/components/security/ProtectedPDFViewerV2";

interface QrCodePdf {
  id: string;
  book_id: string;
  title: string;
  slug: string;
  description: string | null;
  pdf_url: string;
  is_active: boolean;
}

interface QrCodeBook {
  id: string;
  name: string;
  slug: string;
}

export default function AlunoQrCodesPdfView() {
  const { bookSlug, pdfSlug } = useParams<{ bookSlug: string; pdfSlug: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  // Buscar dados do book
  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ["qrcode-book", bookSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qrcode_books")
        .select("*")
        .eq("slug", bookSlug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as QrCodeBook;
    },
    enabled: !!bookSlug && !!user,
  });

  // Buscar dados do PDF
  const { data: pdf, isLoading: pdfLoading, error: pdfError } = useQuery({
    queryKey: ["qrcode-pdf", book?.id, pdfSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qrcode_pdfs")
        .select("*")
        .eq("book_id", book!.id)
        .eq("slug", pdfSlug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as QrCodePdf;
    },
    enabled: !!book?.id && !!pdfSlug,
  });

  // Incrementar contador de acesso
  useEffect(() => {
    if (pdf?.id) {
      supabase.rpc("increment_qrcode_pdf_access", { pdf_id: pdf.id });
    }
  }, [pdf?.id]);

  const isLoading = authLoading || bookLoading || pdfLoading;

  // Se não está logado
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-amber-500/50 bg-amber-500/5">
          <CardHeader className="text-center">
            <Lock className="h-16 w-16 mx-auto text-amber-500 mb-4" />
            <CardTitle>Login Necessário</CardTitle>
            <CardDescription>
              Você precisa estar logado para visualizar este conteúdo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => navigate("/auth", { state: { from: window.location.pathname } })}
            >
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se está carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando PDF...</p>
        </div>
      </div>
    );
  }

  // Se PDF não encontrado
  if (pdfError || !pdf) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
          <CardHeader className="text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <CardTitle className="text-destructive">PDF não encontrado</CardTitle>
            <CardDescription>
              Este PDF não existe ou foi removido.
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header compacto */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1.5"
              onClick={() => navigate("/alunos/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-sm font-semibold line-clamp-1">{pdf.title}</h1>
                <p className="text-xs text-muted-foreground">{book?.name}</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Protegido
          </Badge>
        </div>
      </div>

      {/* PDF Viewer PROTEGIDO com watermark forense */}
      <div className="flex-1 h-[calc(100vh-60px)]">
        <ProtectedPDFViewerV2
          pdfUrl={pdf.pdf_url}
          title={pdf.title}
          className="w-full h-full"
          isModal={false}
        />
      </div>
    </div>
  );
}
