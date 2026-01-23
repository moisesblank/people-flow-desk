// ============================================
// 🎬 VIDEO OVERLAY CONFIG DIALOG
// Upload de imagem de disclaimer/overlay
// Exibido nos primeiros 3s de QUALQUER vídeo
// ============================================

import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Upload, Trash2, Loader2, Eye, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatError } from "@/lib/utils/formatError";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface VideoOverlayConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

const SETTING_KEY = "video_overlay_url";
const BUCKET_NAME = "materiais";

// Hook para buscar a URL assinada do overlay
// O banco agora salva o PATH, não a URL pública
export function useVideoOverlay() {
  return useQuery({
    queryKey: ["video-overlay-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", SETTING_KEY)
        .maybeSingle();

      if (error) throw error;
      
      // setting_value é JSONB, pode ser objeto ou null
      const value = data?.setting_value as { url?: string } | null;
      const pathOrUrl = value?.url ?? null;
      
      if (!pathOrUrl) return null;
      
      // Se já é URL completa (dados antigos), verificar se é assinável
      if (pathOrUrl.startsWith('http')) {
        // Tentar extrair path de URLs antigas
        const match = pathOrUrl.match(/\/materiais\/(.+)$/);
        if (match) {
          // Gerar URL assinada a partir do path extraído
          const { data: signedData } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(match[1], 3600);
          return signedData?.signedUrl ?? null;
        }
        // Se não conseguir extrair, retornar como está (pode falhar se bucket privado)
        return pathOrUrl;
      }
      
      // É um path - gerar URL assinada
      const { data: signedData, error: signError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(pathOrUrl, 3600); // 1 hora
        
      if (signError) {
        console.error('[useVideoOverlay] Erro ao gerar URL assinada:', signError);
        return null;
      }
      
      return signedData?.signedUrl ?? null;
    },
    staleTime: 1000 * 60 * 30, // 30 min cache (URL assinada dura 1h)
  });
}

export function VideoOverlayConfigDialog({ open, onClose }: VideoOverlayConfigDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Buscar configuração atual
  const { data: currentOverlayUrl, isLoading } = useVideoOverlay();

  // Mutation para salvar a URL
  const saveMutation = useMutation({
    mutationFn: async (url: string | null) => {
      const { data: existing } = await supabase
        .from("system_settings")
        .select("id")
        .eq("setting_key", SETTING_KEY)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("system_settings")
          .update({
            setting_value: { url },
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", SETTING_KEY);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("system_settings").insert({
          setting_key: SETTING_KEY,
          setting_value: { url },
          setting_type: "video",
          description: "URL da imagem de overlay/disclaimer exibida nos primeiros 3s de cada vídeo",
          is_public: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Overlay salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["video-overlay-setting"] });
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${formatError(error)}`);
    },
  });

  // Handler de upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 5MB)");
      return;
    }

    setIsUploading(true);

    try {
      // Gerar nome único
      const ext = file.name.split(".").pop() || "png";
      const fileName = `video-overlay-disclaimer-${Date.now()}.${ext}`;
      const filePath = `overlays/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Gerar URL assinada (bucket materiais é privado)
      const { data: signedData, error: signError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 1 hora

      if (signError || !signedData?.signedUrl) {
        throw new Error('Falha ao gerar URL assinada');
      }

      // Salvar o PATH no banco (não a URL assinada, pois expira)
      setPreviewUrl(signedData.signedUrl); // Preview temporário
      
      // Salvar o path no settings (será assinado na leitura)
      await saveMutation.mutateAsync(filePath);
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast.error(`Erro no upload: ${formatError(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handler de remoção
  const handleRemove = async () => {
    await saveMutation.mutateAsync(null);
    setPreviewUrl(null);
  };

  const displayUrl = previewUrl || currentOverlayUrl;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Configurar Overlay de Vídeo
          </DialogTitle>
          <DialogDescription>
            Esta imagem será exibida nos primeiros 3 segundos de <strong>TODOS</strong> os vídeos da plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview atual */}
          {displayUrl && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border">
              <img
                src={displayUrl}
                alt="Overlay Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={saveMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                Overlay ativo
              </div>
            </div>
          )}

          {/* Upload area */}
          <div className="space-y-2">
            <Label>Upload de Imagem</Label>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Enviando...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar uma imagem
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WEBP (máx. 5MB)
                  </p>
                </div>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">📌 Como funciona:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>A imagem aparece por 3 segundos antes de QUALQUER vídeo iniciar</li>
              <li>Funciona para YouTube, Panda e Vimeo</li>
              <li>É exibida após o clique no botão play</li>
              <li>Após os 3 segundos, o vídeo inicia automaticamente</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
