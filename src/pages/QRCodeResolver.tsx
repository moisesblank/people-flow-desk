/**
 * 📱 QR CODE RESOLVER
 * Constituição SYNAPSE Ω v10.0
 * 
 * Resolve legacy QR Codes from printed materials
 * Route: /qr?v=XXXXX (videoaulas) ou /qr?s=XXXXX (simulados)
 * 
 * SUPORTA FORMATOS:
 * 1. ?v=10907 → busca por legacy_qr_id (YouTube ou Panda)
 * 2. ?v=UUID → busca direta por panda_video_id
 * 3. ?s=UUID → simulado por ID
 * 4. ?s=slug → simulado por slug
 */

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Video, QrCode, FileText, Brain } from "lucide-react";
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

interface SimuladoData {
  id: string;
  title: string;
  slug: string | null;
  is_active: boolean;
  is_published: boolean;
}

type ContentType = "video" | "simulado";

// Regex para detectar UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function QRCodeResolver() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "found" | "not_found" | "error">("loading");
  const [contentType, setContentType] = useState<ContentType>("video");
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [simulado, setSimulado] = useState<SimuladoData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const videoParam = searchParams.get("v");
  const simuladoParam = searchParams.get("s");

  useEffect(() => {
    async function resolveQRCode() {
      // Determinar tipo de conteúdo
      if (simuladoParam) {
        setContentType("simulado");
        await resolveSimulado(simuladoParam);
      } else if (videoParam) {
        setContentType("video");
        await resolveVideo(videoParam);
      } else {
        setStatus("error");
        setErrorMessage("Parâmetro 'v' ou 's' não encontrado na URL.");
      }
    }

    async function resolveVideo(param: string) {
      try {
        let data: LessonData | null = null;
        let error: any = null;

        // DETECTAR FORMATO: UUID (Panda direto) ou Numérico (legacy_qr_id)
        const isUUID = UUID_REGEX.test(param);
        const isNumeric = /^\d+$/.test(param);

        console.log(`[QR Resolver] Video Input: ${param}, isUUID: ${isUUID}, isNumeric: ${isNumeric}`);

        if (isUUID) {
          // FORMATO UUID: Buscar diretamente pelo panda_video_id
          const result = await supabase
            .from("lessons")
            .select("id, title, youtube_video_id, panda_video_id, video_provider, area_id")
            .eq("panda_video_id", param)
            .maybeSingle();
          
          data = result.data;
          error = result.error;
          
        } else if (isNumeric) {
          // FORMATO NUMÉRICO: Buscar pelo legacy_qr_id
          const qrIdNumber = parseInt(param, 10);
          const result = await supabase
            .from("lessons")
            .select("id, title, youtube_video_id, panda_video_id, video_provider, area_id")
            .eq("legacy_qr_id", qrIdNumber)
            .maybeSingle();
          
          data = result.data;
          error = result.error;
          
        } else {
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
          console.log(`[QR Resolver] Nenhum conteúdo encontrado para: ${param}`);
          setStatus("not_found");
          return;
        }

        console.log(`[QR Resolver] Vídeo encontrado:`, data);
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

    async function resolveSimulado(param: string) {
      try {
        const isUUID = UUID_REGEX.test(param);
        
        console.log(`[QR Resolver] Simulado Input: ${param}, isUUID: ${isUUID}`);

        let query = supabase
          .from("simulados")
          .select("id, title, slug, is_active, is_published");

        if (isUUID) {
          query = query.eq("id", param);
        } else {
          // Buscar por slug
          query = query.eq("slug", param);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error("[QR Resolver] Simulado database error:", error);
          setStatus("error");
          setErrorMessage("Erro ao buscar simulado no banco de dados.");
          return;
        }

        if (!data) {
          console.log(`[QR Resolver] Simulado não encontrado: ${param}`);
          setStatus("not_found");
          return;
        }

        if (!data.is_active || !data.is_published) {
          setStatus("error");
          setErrorMessage("Este simulado não está disponível no momento.");
          return;
        }

        console.log(`[QR Resolver] Simulado encontrado:`, data);
        setSimulado(data);
        setStatus("found");

        // Auto-redirect to simulado player after brief delay
        setTimeout(() => {
          navigate(`/alunos/simulados?s=${data.id}`, { replace: true });
        }, 1500);

      } catch (err) {
        console.error("[QR Resolver] Simulado exception:", err);
        setStatus("error");
        setErrorMessage("Erro ao processar o QR Code do simulado.");
      }
    }

    resolveQRCode();
  }, [videoParam, simuladoParam, navigate]);

  // Determinar display
  const displayId = videoParam || simuladoParam || "---";
  const isUUID = displayId ? UUID_REGEX.test(displayId) : false;

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
                  Localizando {contentType === "simulado" ? "simulado" : "conteúdo"}...
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2 font-mono">
                  {isUUID ? "UUID" : "ID"}: {displayId}
                </p>
              </div>
            </div>
          )}

          {status === "found" && contentType === "video" && lesson && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-600">Vídeo Encontrado!</h2>
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

          {status === "found" && contentType === "simulado" && simulado && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-indigo-600">Simulado Encontrado!</h2>
                <p className="text-foreground font-medium mt-2">{simulado.title}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Redirecionando para o simulado...
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
                  O QR Code não está vinculado a nenhum {contentType === "simulado" ? "simulado" : "conteúdo"}.
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
