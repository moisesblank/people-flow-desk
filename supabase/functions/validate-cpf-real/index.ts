import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CPFValidationResult {
  valid: boolean;
  exists: boolean;
  nome?: string;
  situacao?: string;
  error?: string;
  cpf_sanitized?: string;
}

// Sanitiza CPF removendo pontuação
function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

// Valida formato matemático do CPF (dígitos verificadores)
function validateCPFFormat(cpf: string): boolean {
  const cleaned = sanitizeCPF(cpf);
  
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

// Consulta CPF na API cpfcnpj.com.br (Receita Federal)
async function consultCPFReal(cpf: string, token: string): Promise<CPFValidationResult> {
  const cleanedCPF = sanitizeCPF(cpf);
  
  // Primeiro valida o formato
  if (!validateCPFFormat(cleanedCPF)) {
    return {
      valid: false,
      exists: false,
      cpf_sanitized: cleanedCPF,
      error: 'CPF com formato inválido (dígitos verificadores incorretos)'
    };
  }
  
  try {
    console.log(`[validate-cpf-real] Consultando CPF ${cleanedCPF.substring(0, 3)}***${cleanedCPF.substring(9)} na Receita Federal...`);
    
    const response = await fetch(`https://api.cpfcnpj.com.br/${token}/1/${cleanedCPF}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[validate-cpf-real] Erro na API: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        return {
          valid: false,
          exists: false,
          cpf_sanitized: cleanedCPF,
          error: 'Token da API inválido ou expirado'
        };
      }
      
      if (response.status === 429) {
        return {
          valid: false,
          exists: false,
          cpf_sanitized: cleanedCPF,
          error: 'Limite de consultas excedido. Tente novamente mais tarde.'
        };
      }
      
      return {
        valid: false,
        exists: false,
        cpf_sanitized: cleanedCPF,
        error: `Erro ao consultar CPF: ${response.status}`
      };
    }
    
    const data = await response.json();
    console.log(`[validate-cpf-real] Resposta da API:`, JSON.stringify(data, null, 2));
    
    // A API retorna erro se CPF não existe
    if (data.erro || data.status === 'ERROR' || data.message) {
      return {
        valid: false,
        exists: false,
        cpf_sanitized: cleanedCPF,
        error: data.message || data.erro || 'CPF não encontrado na base da Receita Federal'
      };
    }
    
    // CPF existe na Receita Federal
    // Verifica situação cadastral
    const situacao = data.situacao_cadastral || data.situacao || 'REGULAR';
    const nome = data.nome || data.nome_completo || '';
    
    // CPF pode existir mas estar em situação irregular
    const situacoesValidas = ['REGULAR', 'PENDENTE DE REGULARIZAÇÃO'];
    const isRegular = situacoesValidas.some(s => 
      situacao.toUpperCase().includes(s) || situacao.toUpperCase() === 'REGULAR'
    );
    
    if (!isRegular && situacao.toUpperCase().includes('CANCELAD')) {
      return {
        valid: false,
        exists: true,
        nome: nome,
        situacao: situacao,
        cpf_sanitized: cleanedCPF,
        error: `CPF existe mas está ${situacao}. Não pode ser utilizado.`
      };
    }
    
    console.log(`[validate-cpf-real] CPF VÁLIDO - Nome: ${nome.substring(0, 10)}***, Situação: ${situacao}`);
    
    return {
      valid: true,
      exists: true,
      nome: nome,
      situacao: situacao,
      cpf_sanitized: cleanedCPF
    };
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error(`[validate-cpf-real] Erro ao consultar API:`, err);
    return {
      valid: false,
      exists: false,
      cpf_sanitized: cleanedCPF,
      error: `Erro de conexão com a Receita Federal: ${errorMessage}`
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CPFCNPJ_TOKEN = Deno.env.get('CPFCNPJ_API_TOKEN');
    
    if (!CPFCNPJ_TOKEN) {
      console.error('[validate-cpf-real] CPFCNPJ_API_TOKEN não configurado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Serviço de validação de CPF não configurado' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cpf, validate_only } = await req.json();
    
    if (!cpf) {
      return new Response(
        JSON.stringify({ success: false, error: 'CPF é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[validate-cpf-real] Iniciando validação de CPF...`);
    
    // Se validate_only=true, apenas valida formato sem consultar API externa
    if (validate_only) {
      const isFormatValid = validateCPFFormat(cpf);
      return new Response(
        JSON.stringify({
          success: true,
          result: {
            valid: isFormatValid,
            exists: null, // Não consultou a Receita
            cpf_sanitized: sanitizeCPF(cpf),
            error: isFormatValid ? null : 'Formato de CPF inválido'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consulta completa na Receita Federal
    const result = await consultCPFReal(cpf, CPFCNPJ_TOKEN);

    // Log de auditoria (fire-and-forget)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Registra auditoria de forma assíncrona
    supabase.from('audit_logs').insert({
      action: 'cpf_validation',
      table_name: 'external_api',
      metadata: {
        cpf_masked: `${sanitizeCPF(cpf).substring(0, 3)}*****${sanitizeCPF(cpf).substring(9)}`,
        valid: result.valid,
        exists: result.exists,
        situacao: result.situacao,
        api: 'cpfcnpj.com.br'
      }
    }).then(() => {
      console.log('[validate-cpf-real] Auditoria registrada');
    });

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[validate-cpf-real] Erro:', err);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
