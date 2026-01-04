// ============================================
// 📱 QR CODE RESOLVER
// Resolve legacy QR Codes from printed materials
// Route: /qr?v=XXXXX
// 
// SUPORTA DOIS FORMATOS:
// 1. Numérico: /qr?v=10907 → busca por legacy_qr_id (YouTube ou Panda)
// 2. UUID: /qr?v=1380a18b-dce2-4f42-9d5b-d4c4c8ec48cf → busca direta por panda_video_id
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

// Regex para detectar UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

      try {
        let data: LessonData | null = null;
        let error: any = null;

        // DETECTAR FORMATO: UUID (Panda direto) ou Numérico (legacy_qr_id)
        const isUUID = UUID_REGEX.test(legacyQrId);
        const isNumeric = /^\d+$/.test(legacyQrId);

        console.log(`[QR Resolver] Input: ${legacyQrId}, isUUID: ${isUUID}, isNumeric: ${isNumeric}`);

        if (isUUID) {
          // FORMATO UUID: Buscar diretamente pelo panda_video_id
          console.log(`[QR Resolver] Buscando por panda_video_id: ${legacyQrId}`);
          
          const result = await supabase
            .from("lessons")
            .select("id, title, youtube_video_id, panda_video_id, video_provider, area_id")
            .eq("panda_video_id", legacyQrId)
            .maybeSingle();
          
          data = result.data;
          error = result.error;
          
        } else if (isNumeric) {
          // FORMATO NUMÉRICO: Buscar pelo legacy_qr_id
          const qrIdNumber = parseInt(legacyQrId, 10);
          console.log(`[QR Resolver] Buscando por legacy_qr_id: ${qrIdNumber}`);
          
          const result = await supabase
            .from("lessons")
            .select("id, title, youtube_video_id, panda_video_id, video_provider, area_id")
            .eq("legacy_qr_id", qrIdNumber)
            .maybeSingle();
          
          data = result.data;
          error = result.error;
          
        } else {
          // FORMATO INVÁLIDO
          setStatus("error");
          setErrorMessage("Formato do QR Code inválido. Use numérico ou UUID.");
          return;
        }

        if (error) {
          console.error("[QR Resolver] Database error:", error);
          setStatus("error");
          setErrorMessage("Erro ao buscar conteúdo no banco de dados.");
          return;
        }

        if (!data) {
          console.log(`[QR Resolver] Nenhum conteúdo encontrado para: ${legacyQrId}`);
          setStatus("not_found");
          return;
        }

        console.log(`[QR Resolver] Conteúdo encontrado:`, data);
        setLesson(data);
        setStatus("found");

        // Auto-redirect to video player after brief delay
        setTimeout(() => {
          navigate(`/alunos/videoaulas?aula=${data.id}`, { replace: true });
        }, 1500);

      } catch (err) {
        console.error("[QR Resolver] Exception:", err);
        setStatus("error");
        setErrorMessage("Erro ao processar o QR Code.");
      }
    }

    resolveQRCode();
  }, [legacyQrId, navigate]);

  // Determinar o tipo de busca para exibição
  const isUUID = legacyQrId ? UUID_REGEX.test(legacyQrId) : false;
  const displayId = legacyQrId || "---";

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
                  Localizando conteúdo...
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2 font-mono">
                  {isUUID ? "Panda UUID" : "ID"}: {displayId}
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
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Provedor: {lesson.video_provider === 'panda' ? '🐼 Panda' : '▶️ YouTube'}
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
                  O QR Code não está vinculado a nenhum conteúdo.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2 font-mono">
                  Valor: {displayId}
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
