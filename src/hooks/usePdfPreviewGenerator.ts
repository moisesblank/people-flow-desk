// ============================================
// 📄 PDF PREVIEW GENERATOR v1.0
// Gera preview da primeira página de PDFs
// Usa PDF.js para renderizar e faz upload para storage
// ============================================

import { useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { supabase } from '@/integrations/supabase/client';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ============================================
// TIPOS
// ============================================

export interface PreviewGenerationResult {
  success: boolean;
  previewUrl?: string;
  error?: string;
}

export interface PdfPreviewGeneratorOptions {
  /** Escala de renderização (default: 1.0 para previews leves) */
  scale?: number;
  /** Qualidade do WebP (0-1, default: 0.8) */
  quality?: number;
  /** Largura máxima em pixels (default: 400) */
  maxWidth?: number;
  /** Formato da imagem (default: 'webp') */
  format?: 'webp' | 'jpeg' | 'png';
}

// ============================================
// CONSTANTES
// ============================================

const PREVIEW_BUCKET = 'pdf-previews';
const DEFAULT_OPTIONS: Required<PdfPreviewGeneratorOptions> = {
  scale: 1.0,
  quality: 0.8,
  maxWidth: 400,
  format: 'webp',
};

// ============================================
// HOOK: usePdfPreviewGenerator
// ============================================

export function usePdfPreviewGenerator() {
  const isProcessingRef = useRef(false);

  /**
   * Gera preview da primeira página de um PDF
   * @param pdfUrl URL do PDF (pode ser signed URL ou pública)
   * @param targetPath Caminho de destino no bucket (ex: "web-books/uuid.webp")
   * @param options Opções de renderização
   */
  const generatePreview = useCallback(async (
    pdfUrl: string,
    targetPath: string,
    options?: PdfPreviewGeneratorOptions
  ): Promise<PreviewGenerationResult> => {
    if (isProcessingRef.current) {
      return { success: false, error: 'Já existe uma geração em andamento' };
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    isProcessingRef.current = true;

    try {
      console.log('[PdfPreviewGenerator] Iniciando geração...', { targetPath });

      // 1. Carregar PDF
      const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
      const pdf = await loadingTask.promise;
      
      console.log('[PdfPreviewGenerator] PDF carregado, páginas:', pdf.numPages);

      // 2. Obter primeira página
      const page = await pdf.getPage(1);
      const originalViewport = page.getViewport({ scale: 1.0 });
      
      // 3. Calcular escala para respeitar maxWidth
      const scaleForMaxWidth = opts.maxWidth / originalViewport.width;
      const finalScale = Math.min(opts.scale, scaleForMaxWidth);
      const viewport = page.getViewport({ scale: finalScale });

      // 4. Criar canvas e renderizar
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Não foi possível criar contexto 2D');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      console.log('[PdfPreviewGenerator] Página renderizada:', canvas.width, 'x', canvas.height);

      // 5. Converter para blob
      const mimeType = opts.format === 'webp' 
        ? 'image/webp' 
        : opts.format === 'png' 
          ? 'image/png' 
          : 'image/jpeg';

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Falha ao criar blob')),
          mimeType,
          opts.quality
        );
      });

      console.log('[PdfPreviewGenerator] Blob criado:', blob.size, 'bytes');

      // 6. Upload para storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(PREVIEW_BUCKET)
        .upload(targetPath, blob, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '31536000', // 1 ano (imutável)
        });

      if (uploadError) {
        throw new Error(`Upload falhou: ${uploadError.message}`);
      }

      // 7. Obter URL pública
      const { data: urlData } = supabase.storage
        .from(PREVIEW_BUCKET)
        .getPublicUrl(targetPath);

      const previewUrl = urlData?.publicUrl;

      if (!previewUrl) {
        throw new Error('Não foi possível obter URL pública');
      }

      // 8. Cleanup
      pdf.destroy();

      console.log('[PdfPreviewGenerator] Preview gerada com sucesso:', previewUrl);

      return { success: true, previewUrl };

    } catch (error: any) {
      console.error('[PdfPreviewGenerator] Erro:', error);
      return { 
        success: false, 
        error: error.message || 'Erro desconhecido ao gerar preview' 
      };
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  /**
   * Gera preview a partir de um arquivo File local (para uploads)
   * @param file Arquivo PDF
   * @param targetPath Caminho de destino no bucket
   * @param options Opções de renderização
   */
  const generatePreviewFromFile = useCallback(async (
    file: File,
    targetPath: string,
    options?: PdfPreviewGeneratorOptions
  ): Promise<PreviewGenerationResult> => {
    if (!file.type.includes('pdf')) {
      return { success: false, error: 'Arquivo não é um PDF' };
    }

    try {
      // Converter File para ArrayBuffer e depois para URL
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);

      const result = await generatePreview(objectUrl, targetPath, options);

      // Cleanup object URL
      URL.revokeObjectURL(objectUrl);

      return result;
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erro ao processar arquivo' 
      };
    }
  }, [generatePreview]);

  /**
   * Atualiza o preview_url e preview_status de um registro
   * @param table Nome da tabela ('web_books' ou 'arquivos_universal')
   * @param recordId ID do registro
   * @param previewUrl URL da preview gerada
   */
  const updateRecordPreview = useCallback(async (
    table: 'web_books' | 'arquivos_universal',
    recordId: string,
    previewUrl: string | null,
    status: 'ready' | 'error' | 'skipped' = 'ready'
  ) => {
    const { error } = await supabase
      .from(table)
      .update({ 
        preview_url: previewUrl,
        preview_status: status,
      })
      .eq('id', recordId);

    if (error) {
      console.error('[PdfPreviewGenerator] Erro ao atualizar registro:', error);
      return false;
    }

    return true;
  }, []);

  return {
    generatePreview,
    generatePreviewFromFile,
    updateRecordPreview,
  };
}

export default usePdfPreviewGenerator;
