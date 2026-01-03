import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════════╗
 * ║ 🔒 CONFIDENCE-GATED IMAGE CHEMICAL DATA EXTRACTION POLICY v1.0                   ║
 * ╠══════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                   ║
 * ║ REGRA SUPREMA: Nenhuma extração automática pode ocorrer se confidence < 80%     ║
 * ║                                                                                   ║
 * ║ ═══════════════════════════════════════════════════════════════════════════════  ║
 * ║ COMPORTAMENTO QUANDO confidence < 80%:                                           ║
 * ║   • NÃO modifica a entidade Question                                             ║
 * ║   • NÃO reescreve dados de imagem como texto                                     ║
 * ║   • APENAS loga a detecção sem intervenção                                       ║
 * ║                                                                                   ║
 * ║ COMPORTAMENTO QUANDO confidence >= 80%:                                          ║
 * ║   • Extrai dados químicos das imagens                                            ║
 * ║   • Reescreve dados extraídos em texto químico padronizado                       ║
 * ║   • Insere dados nos campos apropriados da Question                              ║
 * ║   • Loga a intervenção com comparação before/after                               ║
 * ║                                                                                   ║
 * ║ DADOS EXTRAÍVEIS:                                                                ║
 * ║   • Massa molar (g/mol)                                                          ║
 * ║   • Ponto de fusão/ebulição                                                      ║
 * ║   • Número atômico (Z)                                                           ║
 * ║   • Grupos químicos                                                              ║
 * ║   • Reações químicas                                                             ║
 * ║   • Condições de reação                                                          ║
 * ║   • Alternativas apresentadas como imagens                                       ║
 * ║                                                                                   ║
 * ║ IMUTABILIDADE: Este comportamento de gate de confiança é PERMANENTE.             ║
 * ║ Nenhuma feature futura pode contornar o threshold de confiança.                  ║
 * ║ Violação é considerada brecha constitucional.                                    ║
 * ║                                                                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════════╝
 */

// ===== CONSTANTES DA POLÍTICA =====
export const CONFIDENCE_THRESHOLD = 80; // Threshold mínimo para extração automática

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
  // Novos campos para política de confiança
  meetsConfidenceThreshold: boolean;
  confidenceScore: number;
  wasApplied: boolean; // Se a extração foi realmente aplicada
  gateBehavior: 'APPLIED' | 'LOGGED_ONLY' | 'ERROR';
}

/**
 * Verifica se o score de confiança atinge o threshold
 */
export function meetsConfidenceThreshold(confidence: number): boolean {
  return confidence >= CONFIDENCE_THRESHOLD;
}

/**
 * Determina o comportamento baseado no gate de confiança
 */
export function getConfidenceGateBehavior(confidence: number): 'APPLIED' | 'LOGGED_ONLY' {
  return meetsConfidenceThreshold(confidence) ? 'APPLIED' : 'LOGGED_ONLY';
}

export function useChemicalImageExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastResult, setLastResult] = useState<ChemicalExtractionResult | null>(null);

  /**
   * Extrai dados químicos de uma imagem COM GATE DE CONFIANÇA
   * 
   * POLÍTICA DE CONFIANÇA:
   * - confidence >= 80%: Extração aplicada, dados inseridos
   * - confidence < 80%: Apenas log, sem intervenção na Question
   * 
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
          confidenceThreshold: CONFIDENCE_THRESHOLD, // Envia threshold para o edge function
        },
      });

      if (error) {
        console.error('[CONFIDENCE-GATE] Chemical extraction error:', error);
        const result: ChemicalExtractionResult = {
          success: false,
          error: error.message || 'Erro ao extrair dados químicos',
          meetsConfidenceThreshold: false,
          confidenceScore: 0,
          wasApplied: false,
          gateBehavior: 'ERROR',
        };
        setLastResult(result);
        return result;
      }

      // Extrair confidence score da resposta
      const confidenceScore = data?.extractedData?.confidence ?? 0;
      const meetsThreshold = meetsConfidenceThreshold(confidenceScore);
      const gateBehavior = getConfidenceGateBehavior(confidenceScore);
      
      // Log do gate de confiança
      console.log(`[CONFIDENCE-GATE] Score: ${confidenceScore}% | Threshold: ${CONFIDENCE_THRESHOLD}% | Behavior: ${gateBehavior}`);
      
      if (!meetsThreshold) {
        console.log('[CONFIDENCE-GATE] ⚠️ Confidence below threshold. Extraction LOGGED but NOT APPLIED.');
      } else {
        console.log('[CONFIDENCE-GATE] ✅ Confidence meets threshold. Extraction APPLIED.');
      }

      const enrichedResult: ChemicalExtractionResult = {
        ...data,
        meetsConfidenceThreshold: meetsThreshold,
        confidenceScore,
        wasApplied: meetsThreshold && data?.success,
        gateBehavior,
      };
      
      setLastResult(enrichedResult);
      return enrichedResult;
    } catch (err) {
      console.error('[CONFIDENCE-GATE] Chemical extraction exception:', err);
      const result: ChemicalExtractionResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        meetsConfidenceThreshold: false,
        confidenceScore: 0,
        wasApplied: false,
        gateBehavior: 'ERROR',
      };
      setLastResult(result);
      return result;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Extrai dados químicos de múltiplas imagens COM GATE DE CONFIANÇA
   * Somente resultados com confidence >= 80% são combinados no output final
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
    
    // Log resumo do gate de confiança
    const applied = results.filter(r => r.wasApplied).length;
    const loggedOnly = results.filter(r => r.gateBehavior === 'LOGGED_ONLY').length;
    const errors = results.filter(r => r.gateBehavior === 'ERROR').length;
    
    console.log(`[CONFIDENCE-GATE] Multiple images processed: ${results.length} total | ${applied} applied | ${loggedOnly} logged-only | ${errors} errors`);
    
    return results;
  }, [extractChemicalData]);

  /**
   * Combina dados extraídos de múltiplas imagens em um único output formatado
   * ATENÇÃO: Apenas inclui resultados que PASSARAM no gate de confiança (>= 80%)
   */
  const combineExtractedData = useCallback((results: ChemicalExtractionResult[]): string => {
    const parts: string[] = [];
    
    for (const result of results) {
      // GATE DE CONFIANÇA: Apenas inclui se wasApplied === true
      if (result.wasApplied && result.extractedData?.hasChemicalContent && result.formattedOutput) {
        parts.push(result.formattedOutput);
      }
    }
    
    const skipped = results.filter(r => !r.wasApplied && r.success).length;
    if (skipped > 0) {
      console.log(`[CONFIDENCE-GATE] ${skipped} extractions skipped due to low confidence (<${CONFIDENCE_THRESHOLD}%)`);
    }
    
    return parts.join('\n\n---\n\n');
  }, []);

  /**
   * Verifica se uma imagem contém dados químicos relevantes COM GATE DE CONFIANÇA
   * Retorna true apenas se:
   * 1. A extração foi bem-sucedida
   * 2. Há conteúdo químico
   * 3. O confidence score >= 80%
   */
  const hasChemicalContent = useCallback(async (imageUrl: string): Promise<boolean> => {
    const result = await extractChemicalData(imageUrl);
    return result.wasApplied && (result.extractedData?.hasChemicalContent || false);
  }, [extractChemicalData]);

  /**
   * Verifica se uma extração pode ser aplicada (confidence >= threshold)
   */
  const canApplyExtraction = useCallback((result: ChemicalExtractionResult): boolean => {
    return result.meetsConfidenceThreshold && result.success;
  }, []);

  /**
   * Retorna um resumo do gate de confiança para logging/auditoria
   */
  const getConfidenceSummary = useCallback((results: ChemicalExtractionResult[]): {
    total: number;
    applied: number;
    loggedOnly: number;
    errors: number;
    averageConfidence: number;
  } => {
    const applied = results.filter(r => r.wasApplied).length;
    const loggedOnly = results.filter(r => r.gateBehavior === 'LOGGED_ONLY').length;
    const errors = results.filter(r => r.gateBehavior === 'ERROR').length;
    const validScores = results.filter(r => r.confidenceScore > 0).map(r => r.confidenceScore);
    const averageConfidence = validScores.length > 0 
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
      : 0;

    return {
      total: results.length,
      applied,
      loggedOnly,
      errors,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
    };
  }, []);

  return {
    isExtracting,
    lastResult,
    extractChemicalData,
    extractFromMultipleImages,
    combineExtractedData,
    hasChemicalContent,
    canApplyExtraction,
    getConfidenceSummary,
    // Exporta constante para uso externo
    CONFIDENCE_THRESHOLD,
  };
}
