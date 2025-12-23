// ============================================
// SYNAPSE v14.0 - OCR COMPROVANTES WIDGET
// Upload e extração automática de comprovantes
// ============================================

import { useState, useCallback } from "react";
import { useFileUploadWorker } from "@/hooks/useWebWorker";
import { motion } from "framer-motion";
import {
  Camera,
  Upload,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  DollarSign,
  Calendar,
  Store,
  Tag,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OCRResult {
  amount: number | null;
  date: string | null;
  vendor: string | null;
  category: string | null;
  confidence: number;
  raw_text: string;
}

interface ReceiptOCRProps {
  onExtracted?: (data: OCRResult) => void;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "default" | "sm" | "lg" | "icon";
}

export function ReceiptOCR({ onExtracted, buttonVariant = "outline", buttonSize = "default" }: ReceiptOCRProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // 🏛️ LEI I - Web Worker para Base64
  const { convertFileToBase64: workerFileToBase64 } = useFileUploadWorker();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB)");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  }, []);

  const processReceipt = async () => {
    if (!selectedFile || !user) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      // 🏛️ LEI I - Web Worker para Base64 (UI fluida durante processamento)
      const base64 = await workerFileToBase64(selectedFile);

      setProgress(30);

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("comprovantes")
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
      }

      setProgress(50);

      // Create extraction record
      const { data: extractionData, error: extractionError } = await supabase
        .from("receipt_ocr_extractions")
        .insert({
          user_id: user.id,
          file_url: uploadData?.path || "",
          file_name: selectedFile.name,
          status: "processing"
        })
        .select()
        .single();

      setProgress(70);

      // Call OCR function
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke("ocr-receipt", {
        body: {
          image_base64: base64,
          extraction_id: extractionData?.id
        }
      });

      setProgress(100);

      if (ocrError) throw ocrError;

      if (ocrData?.success && ocrData?.data) {
        setResult(ocrData.data);
        onExtracted?.(ocrData.data);
        toast.success("Comprovante processado com sucesso!");
      } else {
        throw new Error(ocrData?.error || "Erro ao processar comprovante");
      }

    } catch (error: any) {
      console.error("OCR error:", error);
      toast.error(error.message || "Erro ao processar comprovante");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents);

  const reset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <>
      <Button 
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Camera className="h-4 w-4" />
        {buttonSize !== "icon" && "Escanear Comprovante"}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              OCR de Comprovante
            </DialogTitle>
            <DialogDescription>
              Envie uma foto do comprovante para extrair automaticamente os dados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Clique para selecionar ou arraste uma imagem
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  JPG, PNG ou WEBP (máx. 10MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={reset}
                >
                  Trocar
                </Button>
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {progress < 30 && "Preparando imagem..."}
                  {progress >= 30 && progress < 50 && "Enviando arquivo..."}
                  {progress >= 50 && progress < 70 && "Salvando..."}
                  {progress >= 70 && "Processando com IA..."}
                </p>
              </div>
            )}

            {/* Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 rounded-xl bg-secondary/30"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Check className="h-5 w-5 text-[hsl(var(--stats-green))]" />
                  <span className="font-medium">Dados Extraídos</span>
                  <Badge variant="outline" className="ml-auto">
                    {Math.round(result.confidence * 100)}% confiança
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {result.amount && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                      <DollarSign className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="font-bold text-[hsl(var(--stats-green))]">
                          {formatCurrency(result.amount)}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.date && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                      <Calendar className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Data</p>
                        <p className="font-medium">{result.date}</p>
                      </div>
                    </div>
                  )}

                  {result.vendor && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                      <Store className="h-4 w-4 text-[hsl(var(--stats-purple))]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Estabelecimento</p>
                        <p className="font-medium">{result.vendor}</p>
                      </div>
                    </div>
                  )}

                  {result.category && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                      <Tag className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">Categoria Sugerida</p>
                        <p className="font-medium capitalize">{result.category}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!result ? (
                <Button
                  className="flex-1 gap-2"
                  onClick={processReceipt}
                  disabled={!selectedFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Extrair Dados
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={reset}>
                    Novo Comprovante
                  </Button>
                  <Button className="flex-1" onClick={() => setIsOpen(false)}>
                    Usar Dados
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
