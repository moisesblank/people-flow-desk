// ============================================
// 📄 PDF UPLOAD WITH PREVIEW v1.0
// Hook que combina upload de PDF + geração automática de preview
// ============================================

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePdfPreviewGenerator } from './usePdfPreviewGenerator';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export interface PdfUploadResult {
  success: boolean;
  pdfUrl?: string;
  pdfPath?: string;
  previewUrl?: string;
  error?: string;
}

export interface PdfUploadWithPreviewOptions {
  /** Bucket de destino do PDF */
  bucket: string;
  /** Pasta dentro do bucket */
  folder?: string;
  /** Tabela para atualizar (opcional) */
  table?: 'web_books' | 'arquivos_universal';
  /** ID do registro para atualizar (requer table) */
  recordId?: string;
  /** Callback após sucesso */
  onSuccess?: (result: PdfUploadResult) => void;
  /** Callback após erro */
  onError?: (error: string) => void;
}

// ============================================
// HOOK: usePdfUploadWithPreview
// ============================================

export function usePdfUploadWithPreview() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { generatePreviewFromFile, updateRecordPreview } = usePdfPreviewGenerator();

  const uploadPdfWithPreview = useCallback(async (
    file: File,
    options: PdfUploadWithPreviewOptions
  ): Promise<PdfUploadResult> => {
    const { bucket, folder = '', table, recordId, onSuccess, onError } = options;

    if (!file.type.includes('pdf')) {
      const error = 'Arquivo não é um PDF válido';
      onError?.(error);
      return { success: false, error };
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Gerar nome único para o arquivo
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const pdfPath = folder 
        ? `${folder}/${timestamp}_${safeName}`
        : `${timestamp}_${safeName}`;

      setProgress(10);

      // 2. Upload do PDF
      console.log('[PdfUploadWithPreview] Fazendo upload do PDF...', pdfPath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(pdfPath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload falhou: ${uploadError.message}`);
      }

      setProgress(50);

      // 3. Para buckets privados, retornar o path (não URL pública)
      // A URL assinada será gerada no momento da leitura
      const pdfUrl = pdfPath; // Salvar path, não URL

      // 4. Gerar preview da primeira página
      console.log('[PdfUploadWithPreview] Gerando preview...');
      
      const previewPath = `${bucket}/${timestamp}_${safeName.replace('.pdf', '.webp')}`;
      const previewResult = await generatePreviewFromFile(file, previewPath);

      setProgress(80);

      let previewUrl: string | undefined;

      if (previewResult.success && previewResult.previewUrl) {
        previewUrl = previewResult.previewUrl;
        console.log('[PdfUploadWithPreview] Preview gerada:', previewUrl);
      } else {
        console.warn('[PdfUploadWithPreview] Falha ao gerar preview:', previewResult.error);
      }

      // 5. Atualizar registro no banco (se fornecido)
      if (table && recordId) {
        await updateRecordPreview(
          table, 
          recordId, 
          previewUrl || null,
          previewResult.success ? 'ready' : 'error'
        );
      }

      setProgress(100);

      const result: PdfUploadResult = {
        success: true,
        pdfUrl,
        pdfPath,
        previewUrl,
      };

      onSuccess?.(result);
      toast.success('PDF enviado com sucesso!');

      return result;

    } catch (error: any) {
      console.error('[PdfUploadWithPreview] Erro:', error);
      const errorMessage = error.message || 'Erro ao fazer upload';
      onError?.(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };

    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [generatePreviewFromFile, updateRecordPreview]);

  return {
    uploadPdfWithPreview,
    isUploading,
    progress,
  };
}

export default usePdfUploadWithPreview;
