// ============================================
// 📄 PDF REPLACEMENT UPLOADER
// Componente para substituição de PDF em livros existentes
// Reutiliza infraestrutura genesis-book-replace
// ============================================

import { memo, useState, useCallback } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PDFReplacementUploaderProps {
  bookId: string;
  currentFileName?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export const PDFReplacementUploader = memo(function PDFReplacementUploader({
  bookId,
  currentFileName,
  onSuccess,
  onError,
  disabled = false,
}: PDFReplacementUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!bookId || !file) return;

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatus('uploading');
    setSelectedFile(file);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const authHeaders = {
        'Authorization': `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      };

      // ============================================
      // FASE 1: INIT - Obter Signed URL para substituição
      // ============================================
      setUploadProgress(10);
      
      const initPayload = {
        phase: 'init',
        bookId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
      };

      console.log('[PDFReplace] Fase 1 - Init:', initPayload);

      const initResponse = await fetch(`${supabaseUrl}/functions/v1/genesis-book-replace`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(initPayload),
      });

      const initResult = await initResponse.json();

      if (!initResponse.ok || !initResult.success) {
        throw new Error(initResult.error || 'Erro ao iniciar substituição');
      }

      const { uploadUrl } = initResult;
      
      if (!uploadUrl) {
        throw new Error('URL de upload não gerada');
      }

      console.log('[PDFReplace] Fase 1 OK - Signed URL recebida');
      setUploadProgress(25);

      // ============================================
      // FASE 2: UPLOAD DIRETO - Enviar novo PDF
      // ============================================
      toast.info('Enviando novo PDF...', { id: 'pdf-replace-progress' });

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/pdf',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Falha no upload: ${uploadResponse.status}`);
      }

      console.log('[PDFReplace] Fase 2 OK - Arquivo enviado ao Storage');
      setUploadProgress(70);

      // ============================================
      // FASE 3: COMPLETE - Confirmar e reprocessar
      // ============================================
      const completePayload = {
        phase: 'complete',
        bookId,
        deleteOldPages: true, // Deletar páginas antigas
      };

      const completeResponse = await fetch(`${supabaseUrl}/functions/v1/genesis-book-replace`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(completePayload),
      });

      const completeResult = await completeResponse.json();

      if (!completeResponse.ok || !completeResult.success) {
        throw new Error(completeResult.error || 'Erro ao finalizar substituição');
      }

      console.log('[PDFReplace] Fase 3 OK - Reprocessamento iniciado:', completeResult.jobId);
      setUploadProgress(100);
      setUploadStatus('success');

      toast.dismiss('pdf-replace-progress');
      toast.success('📄 PDF substituído! Reprocessamento iniciado.');
      
      onSuccess?.();
    } catch (err) {
      console.error('[PDFReplace] Erro:', err);
      setUploadStatus('error');
      toast.dismiss('pdf-replace-progress');
      toast.error(err instanceof Error ? err.message : 'Erro ao substituir PDF');
      onError?.(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsUploading(false);
    }
  }, [bookId, onSuccess, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: disabled || isUploading,
    onDrop: (files) => {
      if (files[0]) {
        handleUpload(files[0]);
      }
    },
  });

  const resetUploader = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
  }, []);

  return (
    <div className="space-y-3">
      {/* Arquivo atual */}
      {currentFileName && uploadStatus === 'idle' && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Atual:</span>
          <span className="font-medium truncate flex-1">{currentFileName}</span>
        </div>
      )}

      {/* Área de upload */}
      {uploadStatus === 'idle' && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/30 hover:border-primary/50",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className={cn(
              "w-8 h-8",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
            <div className="text-sm">
              {isDragActive ? (
                <span className="text-primary font-medium">Solte o PDF aqui</span>
              ) : (
                <>
                  <span className="text-muted-foreground">Arraste um PDF ou </span>
                  <span className="text-primary underline">clique para selecionar</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              O PDF atual será substituído. Máx: 500MB
            </p>
          </div>
        </div>
      )}

      {/* Progresso de upload */}
      {uploadStatus === 'uploading' && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Substituindo PDF...</span>
          </div>
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="truncate">{selectedFile.name}</span>
            </div>
          )}
          <div className="space-y-1">
            <Progress value={uploadProgress} />
            <p className="text-xs text-muted-foreground text-right">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Sucesso */}
      {uploadStatus === 'success' && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="font-medium text-green-700 dark:text-green-400">
                PDF substituído com sucesso!
              </p>
              <p className="text-sm text-muted-foreground">
                O livro está na fila de reprocessamento.
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={resetUploader}
              className="shrink-0"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Outro
            </Button>
          </div>
        </div>
      )}

      {/* Erro */}
      {uploadStatus === 'error' && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">
                Erro ao substituir PDF
              </p>
              <p className="text-sm text-muted-foreground">
                Tente novamente ou contate o suporte.
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={resetUploader}
              className="shrink-0"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Tentar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

PDFReplacementUploader.displayName = 'PDFReplacementUploader';
