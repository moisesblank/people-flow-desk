import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * PERMANENT CHEMICAL DATA EXTRACTION AND NORMALIZATION POLICY v1.0
 * 
 * Hook para extrair dados químicos de imagens usando IA com visão.
 * Garante que informações químicas relevantes nunca existam apenas em imagens.
 */

export interface ExtractedChemicalData {
  hasChemicalContent: boolean;
  equations: string[];
  molarMasses: { element: string; mass: string }[];
  atomicNumbers: { element: string; z: number; group?: string }[];
  reactionConditions: string[];
  alternativeOptions: { letter: string; content: string }[];
  rawExtractedText: string;
  formattedOutput: string;
  confidence: number;
}

export interface ChemicalExtractionResult {
  success: boolean;
  questionId?: string;
  extractedData?: ExtractedChemicalData;
  formattedOutput?: string;
  error?: string;
}

export function useChemicalImageExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastResult, setLastResult] = useState<ChemicalExtractionResult | null>(null);

  /**
   * Extrai dados químicos de uma imagem
   * @param imageUrl URL da imagem ou base64
   * @param questionId ID da questão associada (opcional)
   */
  const extractChemicalData = useCallback(async (
    imageUrl: string,
    questionId?: string
  ): Promise<ChemicalExtractionResult> => {
    setIsExtracting(true);
    
    try {
      const isBase64 = imageUrl.startsWith('data:') || !imageUrl.startsWith('http');
      
      const { data, error } = await supabase.functions.invoke('extract-chemical-from-image', {
        body: {
          ...(isBase64 ? { imageBase64: imageUrl } : { imageUrl }),
          questionId,
        },
      });

      if (error) {
        console.error('Chemical extraction error:', error);
        const result: ChemicalExtractionResult = {
          success: false,
          error: error.message || 'Erro ao extrair dados químicos',
        };
        setLastResult(result);
        return result;
      }

      setLastResult(data);
      return data;
    } catch (err) {
      console.error('Chemical extraction exception:', err);
      const result: ChemicalExtractionResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      };
      setLastResult(result);
      return result;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Extrai dados químicos de múltiplas imagens
   */
  const extractFromMultipleImages = useCallback(async (
    imageUrls: string[],
    questionId?: string
  ): Promise<ChemicalExtractionResult[]> => {
    const results: ChemicalExtractionResult[] = [];
    
    for (const url of imageUrls) {
      const result = await extractChemicalData(url, questionId);
      results.push(result);
    }
    
    return results;
  }, [extractChemicalData]);

  /**
   * Combina dados extraídos de múltiplas imagens em um único output formatado
   */
  const combineExtractedData = useCallback((results: ChemicalExtractionResult[]): string => {
    const parts: string[] = [];
    
    for (const result of results) {
      if (result.success && result.extractedData?.hasChemicalContent && result.formattedOutput) {
        parts.push(result.formattedOutput);
      }
    }
    
    return parts.join('\n\n---\n\n');
  }, []);

  /**
   * Verifica se uma imagem contém dados químicos relevantes
   */
  const hasChemicalContent = useCallback(async (imageUrl: string): Promise<boolean> => {
    const result = await extractChemicalData(imageUrl);
    return result.success && (result.extractedData?.hasChemicalContent || false);
  }, [extractChemicalData]);

  return {
    isExtracting,
    lastResult,
    extractChemicalData,
    extractFromMultipleImages,
    combineExtractedData,
    hasChemicalContent,
  };
}
