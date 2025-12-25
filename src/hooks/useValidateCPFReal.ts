import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CPFValidationResult {
  valid: boolean;
  exists: boolean | null;
  nome?: string;
  situacao?: string;
  error?: string;
  cpf_sanitized?: string;
}

interface UseValidateCPFRealReturn {
  validateCPF: (cpf: string, validateOnly?: boolean) => Promise<CPFValidationResult | null>;
  isValidating: boolean;
  lastResult: CPFValidationResult | null;
  error: string | null;
}

/**
 * Hook para validar CPF em tempo real na Receita Federal
 * 
 * @example
 * const { validateCPF, isValidating, lastResult } = useValidateCPFReal();
 * 
 * // Validar CPF completo na Receita Federal
 * const result = await validateCPF('123.456.789-00');
 * 
 * // Apenas validar formato (não consome crédito da API)
 * const result = await validateCPF('123.456.789-00', true);
 */
export function useValidateCPFReal(): UseValidateCPFRealReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<CPFValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateCPF = useCallback(async (
    cpf: string, 
    validateOnly: boolean = false
  ): Promise<CPFValidationResult | null> => {
    if (!cpf || cpf.replace(/\D/g, '').length < 11) {
      const result: CPFValidationResult = {
        valid: false,
        exists: null,
        error: 'CPF deve ter 11 dígitos',
        cpf_sanitized: cpf.replace(/\D/g, '')
      };
      setLastResult(result);
      return result;
    }

    setIsValidating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('validate-cpf-real', {
        body: { cpf, validate_only: validateOnly }
      });

      if (fnError) {
        console.error('[useValidateCPFReal] Erro na função:', fnError);
        setError(fnError.message);
        toast.error('Erro ao validar CPF', {
          description: fnError.message
        });
        return null;
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Erro desconhecido na validação';
        setError(errorMsg);
        toast.error('Falha na validação', {
          description: errorMsg
        });
        return null;
      }

      const result = data.result as CPFValidationResult;
      setLastResult(result);

      // Feedback visual baseado no resultado
      if (result.valid && result.exists) {
        toast.success('CPF válido!', {
          description: result.nome 
            ? `Pertence a: ${result.nome.split(' ')[0]}***`
            : 'CPF encontrado na Receita Federal'
        });
      } else if (!result.valid) {
        toast.error('CPF inválido', {
          description: result.error || 'CPF não passou na validação'
        });
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro de conexão';
      console.error('[useValidateCPFReal] Erro:', err);
      setError(errorMsg);
      toast.error('Erro de conexão', {
        description: 'Não foi possível validar o CPF. Tente novamente.'
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validateCPF,
    isValidating,
    lastResult,
    error
  };
}

/**
 * Valida apenas o formato do CPF localmente (sem consultar API)
 * Útil para validação em tempo real enquanto o usuário digita
 */
export function validateCPFFormat(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

/**
 * Mascara CPF para exibição parcial (XXX.***.**X-XX)
 */
export function maskCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.***.***-${cleaned.slice(9, 11)}`;
}
