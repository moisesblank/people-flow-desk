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
        error: 'O CPF informado deve conter exatamente 11 dígitos numéricos.',
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
        const mensagemErro = traduzirErroCPF(fnError.message);
        setError(mensagemErro);
        toast.error('Falha na Validação do CPF', {
          description: mensagemErro
        });
        return null;
      }

      if (!data?.success) {
        const errorMsg = traduzirErroCPF(data?.error || 'Erro desconhecido na validação');
        setError(errorMsg);
        toast.error('Falha na Validação do CPF', {
          description: errorMsg
        });
        return null;
      }

      const result = data.result as CPFValidationResult;
      setLastResult(result);

      // Feedback visual baseado no resultado
      if (result.valid && result.exists) {
        toast.success('CPF Válido na Receita Federal', {
          description: result.nome 
            ? `Pertence a: ${result.nome.split(' ')[0]}***`
            : 'CPF encontrado e regular na Receita Federal'
        });
      } else if (!result.valid) {
        const mensagemErro = traduzirErroCPF(result.error || 'CPF não passou na validação');
        toast.error('CPF Inválido ou Irregular', {
          description: mensagemErro
        });
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro de conexão';
      console.error('[useValidateCPFReal] Erro:', err);
      const mensagemErro = traduzirErroCPF(errorMsg);
      setError(mensagemErro);
      toast.error('Falha na Conexão com a Receita Federal', {
        description: 'Não foi possível validar o CPF no momento. Verifique sua conexão e tente novamente.'
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
 * Traduz mensagens de erro de CPF para português claro
 * Usado em todos os pontos de exibição de erro do sistema
 */
function traduzirErroCPF(mensagem: string): string {
  const msg = mensagem?.toLowerCase() || '';
  
  // Erros de formato
  if (msg.includes('11 dígitos') || msg.includes('11 digits')) {
    return 'O CPF informado deve conter exatamente 11 dígitos numéricos.';
  }
  if (msg.includes('formato') || msg.includes('format') || msg.includes('invalid cpf')) {
    return 'O formato do CPF está incorreto. Verifique se digitou corretamente.';
  }
  if (msg.includes('dígitos iguais') || msg.includes('same digits')) {
    return 'CPF inválido: todos os dígitos são iguais.';
  }
  if (msg.includes('verificador') || msg.includes('check digit')) {
    return 'CPF inválido: os dígitos verificadores não conferem.';
  }
  
  // Erros da Receita Federal
  if (msg.includes('não encontrado') || msg.includes('not found')) {
    return 'CPF não encontrado na base da Receita Federal. Verifique se o número está correto.';
  }
  if (msg.includes('irregular') || msg.includes('pendente') || msg.includes('suspenso')) {
    return 'CPF irregular ou com pendências na Receita Federal. O titular deve regularizar a situação.';
  }
  if (msg.includes('cancelado') || msg.includes('nulo') || msg.includes('cancelled')) {
    return 'CPF cancelado ou anulado pela Receita Federal. Não é possível criar acesso.';
  }
  if (msg.includes('falecido') || msg.includes('óbito') || msg.includes('deceased')) {
    return 'CPF vinculado a pessoa falecida. Não é possível criar acesso.';
  }
  
  // Erros de autenticação/permissão
  if (msg.includes('auth') || msg.includes('session') || msg.includes('token') || msg.includes('401')) {
    return 'Sessão expirada. Faça logout e login novamente para continuar.';
  }
  if (msg.includes('permissão') || msg.includes('permission') || msg.includes('403') || msg.includes('unauthorized')) {
    return 'Você não tem permissão para realizar esta validação. Contate o administrador.';
  }
  
  // Erros de conexão/API
  if (msg.includes('timeout') || msg.includes('tempo esgotado')) {
    return 'A consulta à Receita Federal demorou muito. Tente novamente em alguns instantes.';
  }
  if (msg.includes('conexão') || msg.includes('connection') || msg.includes('network')) {
    return 'Falha na conexão com a Receita Federal. Verifique sua internet e tente novamente.';
  }
  if (msg.includes('servidor') || msg.includes('server') || msg.includes('500') || msg.includes('502') || msg.includes('503')) {
    return 'O serviço da Receita Federal está temporariamente indisponível. Tente novamente em alguns minutos.';
  }
  if (msg.includes('rate limit') || msg.includes('limite') || msg.includes('muitas requisições')) {
    return 'Muitas consultas realizadas. Aguarde alguns minutos antes de tentar novamente.';
  }
  
  // Erros de crédito/API externa
  if (msg.includes('crédito') || msg.includes('credit') || msg.includes('saldo')) {
    return 'Créditos de consulta esgotados. Contate o administrador do sistema.';
  }
  if (msg.includes('api key') || msg.includes('chave') || msg.includes('token inválido')) {
    return 'Configuração do serviço de validação incorreta. Contate o administrador.';
  }
  
  // Se não encontrou tradução específica, retorna a mensagem original ou uma genérica
  if (mensagem && mensagem.trim().length > 0) {
    return mensagem;
  }
  
  return 'Ocorreu um erro inesperado ao validar o CPF. Tente novamente.';
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
