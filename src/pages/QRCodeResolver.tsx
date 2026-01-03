// ============================================
// 📱 QR CODE RESOLVER
// Resolve legacy QR Codes from printed materials
// Route: /qr?v=XXXXX
// ============================================

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Video, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LessonData {
  id: string;
  title: string;
  youtube_video_id: string | null;
  panda_video_id: string | null;
  video_provider: string | null;
  area_id: string | null;
}

export default function QRCodeResolver() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "found" | "not_found" | "error">("loading");
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const legacyQrId = searchParams.get("v");

  useEffect(() => {
    async function resolveQRCode() {
      if (!legacyQrId) {
        setStatus("error");
        setErrorMessage("Parâmetro 'v' não encontrado na URL.");
        return;
      }

      const qrIdNumber = parseInt(legacyQrId, 10);
      if (isNaN(qrIdNumber)) {
        setStatus("error");
        setErrorMessage("ID do QR Code inválido.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("lessons")
          .select("id, title, youtube_video_id, panda_video_id, video_provider, area_id")
          .eq("legacy_qr_id", qrIdNumber)
          .single();

        if (error || !data) {
          setStatus("not_found");
          return;
        }

        setLesson(data);
        setStatus("found");

        // Auto-redirect to video player after brief delay
        setTimeout(() => {
          navigate(`/alunos/videoaulas?aula=${data.id}`, { replace: true });
        }, 1500);

      } catch (err) {
        console.error("QR Code resolution error:", err);
        setStatus("error");
        setErrorMessage("Erro ao processar o QR Code.");
      }
    }

    resolveQRCode();
  }, [legacyQrId, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Processando QR Code</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Localizando conteúdo #{legacyQrId}...
                </p>
              </div>
            </div>
          )}

          {status === "found" && lesson && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-600">Conteúdo Encontrado!</h2>
                <p className="text-foreground font-medium mt-2">{lesson.title}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Redirecionando para a aula...
                </p>
              </div>
              <div className="pt-2">
                <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
              </div>
            </div>
          )}

          {status === "not_found" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-amber-600">Conteúdo Não Encontrado</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  O QR Code #{legacyQrId} não está vinculado a nenhum conteúdo.
                </p>
              </div>
              <Button 
                onClick={() => navigate("/alunos")}
                className="mt-4"
              >
                Ir para o Portal do Aluno
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-destructive">Erro</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {errorMessage}
                </p>
              </div>
              <Button 
                onClick={() => navigate("/")}
                variant="outline"
                className="mt-4"
              >
                Voltar ao Início
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
